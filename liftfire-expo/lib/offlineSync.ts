import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import { getDatabase, whitelistWorkoutData, whitelistExerciseData } from './database';
import { Workout, Exercise } from '../types';
import { showSyncToast } from './toast';

// Types for sync operations
export interface SyncOperation {
  id?: number;
  operation_type: 'CREATE_WORKOUT' | 'UPDATE_WORKOUT' | 'DELETE_WORKOUT' | 'CREATE_EXERCISE' | 'UPDATE_EXERCISE' | 'DELETE_EXERCISE';
  table_name: 'workouts' | 'exercises';
  record_id: string;
  data: any;
  timestamp: string;
  retry_count: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

// Network connectivity state
let isOnline = true;
let connectivitySubscription: (() => void) | null = null;

// Initialize network monitoring
export const initializeNetworkMonitoring = (): void => {
  // Set up NetInfo listener
  connectivitySubscription = NetInfo.addEventListener(state => {
    const wasOffline = !isOnline;
    isOnline = state.isConnected ?? false;
    
    console.log('Network state changed:', { isOnline, wasOffline });
    
    // If we just came back online, process the queue
    if (isOnline && wasOffline) {
      console.log('Back online - processing sync queue');
      processQueue().catch(error => {
        console.error('Failed to process queue after coming online:', error);
      });
    }
  });

  // Get initial connectivity state
  NetInfo.fetch().then(state => {
    isOnline = state.isConnected ?? false;
    console.log('Initial network state:', { isOnline });
  });
};

// Clean up network monitoring
export const cleanupNetworkMonitoring = (): void => {
  if (connectivitySubscription) {
    connectivitySubscription();
    connectivitySubscription = null;
  }
};

// Queue an operation for offline sync (workouts only)
export const queueOperation = async (
  operationType: SyncOperation['operation_type'],
  tableName: SyncOperation['table_name'],
  recordId: string,
  data: any
): Promise<void> => {
  try {
    const database = await getDatabase();
    
    // Whitelist data based on table type
    let whitelistedData;
    if (tableName === 'workouts') {
      whitelistedData = whitelistWorkoutData(data);
    } else if (tableName === 'exercises') {
      whitelistedData = whitelistExerciseData(data);
    } else {
      throw new Error(`Unsupported table for offline sync: ${tableName}`);
    }

    const operation: Omit<SyncOperation, 'id'> = {
      operation_type: operationType,
      table_name: tableName,
      record_id: recordId,
      data: JSON.stringify(whitelistedData),
      timestamp: new Date().toISOString(),
      retry_count: 0,
      status: 'pending'
    };

    await database.runAsync(
      `INSERT INTO sync_queue (operation_type, table_name, record_id, data, timestamp, retry_count, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        operation.operation_type,
        operation.table_name,
        operation.record_id,
        operation.data,
        operation.timestamp,
        operation.retry_count,
        operation.status
      ]
    );

    console.log('Queued operation:', { operationType, tableName, recordId });

    // If we're online, try to process the queue immediately
    if (isOnline) {
      processQueue().catch(error => {
        console.error('Failed to process queue immediately:', error);
      });
    }
  } catch (error) {
    console.error('Failed to queue operation:', error);
    throw error;
  }
};

// Process the sync queue when online
export const processQueue = async (): Promise<void> => {
  if (!isOnline) {
    console.log('Offline - skipping queue processing');
    return;
  }

  try {
    const database = await getDatabase();
    
    // Get pending operations ordered by timestamp
    const operations = await database.getAllAsync<SyncOperation>(
      `SELECT * FROM sync_queue 
       WHERE status = 'pending' 
       ORDER BY timestamp ASC 
       LIMIT 10`
    );

    if (operations.length === 0) {
      console.log('No pending operations to sync');
      return;
    }

    console.log(`Processing ${operations.length} pending operations`);
    showSyncToast('syncing', operations.length);

    let successCount = 0;
    let failureCount = 0;

    for (const operation of operations) {
      try {
        // Mark as syncing
        await database.runAsync(
          'UPDATE sync_queue SET status = ? WHERE id = ?',
          ['syncing', operation.id!]
        );

        await processSingleOperation(operation);

        // Mark as completed
        await database.runAsync(
          'UPDATE sync_queue SET status = ? WHERE id = ?',
          ['completed', operation.id!]
        );

        successCount++;
        console.log('Successfully synced operation:', operation.id);
      } catch (error) {
        console.error('Failed to sync operation:', operation.id, error);
        failureCount++;
        
        // Increment retry count and mark as failed if max retries reached
        const newRetryCount = operation.retry_count + 1;
        const maxRetries = 3;
        
        if (newRetryCount >= maxRetries) {
          await database.runAsync(
            'UPDATE sync_queue SET status = ?, retry_count = ? WHERE id = ?',
            ['failed', newRetryCount, operation.id!]
          );
        } else {
          await database.runAsync(
            'UPDATE sync_queue SET status = ?, retry_count = ? WHERE id = ?',
            ['pending', newRetryCount, operation.id!]
          );
        }
      }
    }

    // Show sync result toast
    if (successCount > 0 && failureCount === 0) {
      showSyncToast('synced', successCount);
    } else if (failureCount > 0) {
      showSyncToast('failed');
    }

    // Clean up completed operations older than 24 hours
    await database.runAsync(
      `DELETE FROM sync_queue 
       WHERE status = 'completed' 
       AND datetime(timestamp) < datetime('now', '-1 day')`
    );

  } catch (error) {
    console.error('Failed to process sync queue:', error);
    throw error;
  }
};

// Process a single sync operation
const processSingleOperation = async (operation: SyncOperation): Promise<void> => {
  const data = JSON.parse(operation.data);
  
  switch (operation.operation_type) {
    case 'CREATE_WORKOUT':
      await syncCreateWorkout(data);
      break;
    case 'UPDATE_WORKOUT':
      await syncUpdateWorkout(operation.record_id, data);
      break;
    case 'DELETE_WORKOUT':
      await syncDeleteWorkout(operation.record_id);
      break;
    case 'CREATE_EXERCISE':
      await syncCreateExercise(data);
      break;
    case 'UPDATE_EXERCISE':
      await syncUpdateExercise(operation.record_id, data);
      break;
    case 'DELETE_EXERCISE':
      await syncDeleteExercise(operation.record_id);
      break;
    default:
      throw new Error(`Unknown operation type: ${operation.operation_type}`);
  }
};

// Sync operations for workouts
const syncCreateWorkout = async (workoutData: Partial<Workout>): Promise<void> => {
  const { error } = await supabase
    .from('workouts')
    .insert(workoutData);
    
  if (error) {
    throw new Error(`Failed to create workout: ${error.message}`);
  }
};

const syncUpdateWorkout = async (workoutId: string, workoutData: Partial<Workout>): Promise<void> => {
  // Implement "last write wins" conflict resolution
  const { error } = await supabase
    .from('workouts')
    .update(workoutData)
    .eq('id', workoutId);
    
  if (error) {
    throw new Error(`Failed to update workout: ${error.message}`);
  }
};

const syncDeleteWorkout = async (workoutId: string): Promise<void> => {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId);
    
  if (error) {
    throw new Error(`Failed to delete workout: ${error.message}`);
  }
};

// Sync operations for exercises
const syncCreateExercise = async (exerciseData: Partial<Exercise>): Promise<void> => {
  const { error } = await supabase
    .from('exercises')
    .insert(exerciseData);
    
  if (error) {
    throw new Error(`Failed to create exercise: ${error.message}`);
  }
};

const syncUpdateExercise = async (exerciseId: string, exerciseData: Partial<Exercise>): Promise<void> => {
  const { error } = await supabase
    .from('exercises')
    .update(exerciseData)
    .eq('id', exerciseId);
    
  if (error) {
    throw new Error(`Failed to update exercise: ${error.message}`);
  }
};

const syncDeleteExercise = async (exerciseId: string): Promise<void> => {
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', exerciseId);
    
  if (error) {
    throw new Error(`Failed to delete exercise: ${error.message}`);
  }
};

// Get pending sync count
export const getPendingSyncCount = async (): Promise<number> => {
  try {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending"'
    );
    return result?.count || 0;
  } catch (error) {
    console.error('Failed to get pending sync count:', error);
    return 0;
  }
};

// Get sync queue status
export const getSyncQueueStatus = async () => {
  try {
    const database = await getDatabase();
    
    const pending = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue WHERE status = "pending"'
    );
    
    const failed = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue WHERE status = "failed"'
    );
    
    const syncing = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue WHERE status = "syncing"'
    );

    return {
      pending: pending?.count || 0,
      failed: failed?.count || 0,
      syncing: syncing?.count || 0,
      isOnline
    };
  } catch (error) {
    console.error('Failed to get sync queue status:', error);
    return {
      pending: 0,
      failed: 0,
      syncing: 0,
      isOnline
    };
  }
};

// Force sync now (manual trigger)
export const forceSyncNow = async (): Promise<void> => {
  if (!isOnline) {
    throw new Error('Cannot sync while offline');
  }
  
  await processQueue();
};

// Clear failed operations (for retry)
export const clearFailedOperations = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM sync_queue WHERE status = "failed"');
  } catch (error) {
    console.error('Failed to clear failed operations:', error);
    throw error;
  }
};

// Retry failed operations
export const retryFailedOperations = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(
      'UPDATE sync_queue SET status = "pending", retry_count = 0 WHERE status = "failed"'
    );
    
    if (isOnline) {
      await processQueue();
    }
  } catch (error) {
    console.error('Failed to retry failed operations:', error);
    throw error;
  }
};