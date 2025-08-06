/**
 * Sync Service
 * 
 * Handles synchronization between local IndexedDB and Supabase database.
 * Manages offline-first functionality with conflict resolution.
 */

import { supabase } from '@/lib/supabase';
import { IndexedDBManager } from '@/db/IndexedDBManager';
import type { Database } from '@/types/database';

interface SyncOperation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  localId?: string;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

interface SyncConflict {
  id: string;
  table: string;
  localData: any;
  remoteData: any;
  conflictType: 'update_conflict' | 'delete_conflict' | 'version_conflict';
  timestamp: number;
}

export class SyncService {
  private static instance: SyncService;
  private dbManager: IndexedDBManager;
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncInterval: number | null = null;
  private conflictResolver: Map<string, (conflict: SyncConflict) => Promise<any>> = new Map();

  private constructor() {
    this.dbManager = IndexedDBManager.getInstance();
    this.setupEventListeners();
    this.loadSyncQueue();
    this.setupConflictResolvers();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // ============================================================================
  // Initialization and Setup
  // ============================================================================

  private setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.startSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.stopSync();
    });

    // Visibility change (app becomes active)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.startSync();
      }
    });
  }

  private async loadSyncQueue() {
    try {
      const queue = await this.dbManager.getAll('syncQueue');
      this.syncQueue = queue.map(item => ({
        ...item,
        status: 'pending' // Reset status on app start
      }));
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  private setupConflictResolvers() {
    // User profiles: prefer remote data for most fields, keep local preferences
    this.conflictResolver.set('user_profiles', async (conflict) => {
      return {
        ...conflict.remoteData,
        // Keep local preferences if they're newer
        theme: conflict.localData.updated_at > conflict.remoteData.updated_at 
          ? conflict.localData.theme 
          : conflict.remoteData.theme,
        notifications_enabled: conflict.localData.updated_at > conflict.remoteData.updated_at
          ? conflict.localData.notifications_enabled
          : conflict.remoteData.notifications_enabled
      };
    });

    // Workout sessions: prefer local data (user was offline when creating)
    this.conflictResolver.set('workout_sessions', async (conflict) => {
      if (conflict.conflictType === 'update_conflict') {
        // Merge workout data, prefer local exercise data
        return {
          ...conflict.remoteData,
          exercises: conflict.localData.exercises,
          total_volume_kg: conflict.localData.total_volume_kg,
          total_reps: conflict.localData.total_reps,
          total_sets: conflict.localData.total_sets,
          duration_seconds: conflict.localData.duration_seconds,
          notes: conflict.localData.notes || conflict.remoteData.notes
        };
      }
      return conflict.localData; // Prefer local for new workouts
    });

    // Comments: prefer remote data (collaborative content)
    this.conflictResolver.set('comments', async (conflict) => {
      return conflict.remoteData;
    });

    // Default resolver: prefer remote data
    this.conflictResolver.set('default', async (conflict) => {
      return conflict.remoteData;
    });
  }

  // ============================================================================
  // Sync Queue Management
  // ============================================================================

  async addToSyncQueue(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any,
    localId?: string
  ): Promise<void> {
    const syncOperation: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table,
      operation,
      data,
      localId,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    this.syncQueue.push(syncOperation);
    
    // Persist to IndexedDB
    try {
      await this.dbManager.add('syncQueue', syncOperation);
    } catch (error) {
      console.error('Failed to persist sync operation:', error);
    }

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.startSync();
    }
  }

  private async removeSyncOperation(operationId: string): Promise<void> {
    this.syncQueue = this.syncQueue.filter(op => op.id !== operationId);
    
    try {
      await this.dbManager.delete('syncQueue', operationId);
    } catch (error) {
      console.error('Failed to remove sync operation:', error);
    }
  }

  private async updateSyncOperation(operation: SyncOperation): Promise<void> {
    const index = this.syncQueue.findIndex(op => op.id === operation.id);
    if (index !== -1) {
      this.syncQueue[index] = operation;
      
      try {
        await this.dbManager.update('sync_queue', operation);
      } catch (error) {
        console.error('Failed to update sync operation:', error);
      }
    }
  }

  // ============================================================================
  // Sync Execution
  // ============================================================================

  async startSync(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting sync process...');

    try {
      // First, pull remote changes
      await this.pullRemoteChanges();
      
      // Then, push local changes
      await this.pushLocalChanges();
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }

    // Schedule next sync
    this.scheduleNextSync();
  }

  private stopSync(): void {
    if (this.syncInterval) {
      clearTimeout(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private scheduleNextSync(): void {
    this.stopSync();
    
    // Sync every 5 minutes when online
    this.syncInterval = window.setTimeout(() => {
      if (this.isOnline) {
        this.startSync();
      }
    }, 5 * 60 * 1000);
  }

  // ============================================================================
  // Pull Remote Changes
  // ============================================================================

  private async pullRemoteChanges(): Promise<void> {
    const tables = [
      'user_profiles',
      'workout_sessions',
      'exercise_performances',
      'social_posts',
      'comments',
      'comment_likes',
      'post_likes',
      'friendships',
      'user_achievements',
      'notifications'
    ];

    for (const table of tables) {
      try {
        await this.pullTableChanges(table);
      } catch (error) {
        console.error(`Failed to pull changes for ${table}:`, error);
      }
    }
  }

  private async pullTableChanges(table: string): Promise<void> {
    // Get last sync timestamp for this table
    const lastSync = await this.getLastSyncTimestamp(table);
    
    // Fetch changes since last sync
    const { data: remoteData, error } = await supabase
      .from(table as any)
      .select('*')
      .gte('updated_at', new Date(lastSync).toISOString())
      .order('updated_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch remote changes for ${table}: ${error.message}`);
    }

    if (!remoteData || remoteData.length === 0) {
      return;
    }

    // Process each remote record
    for (const remoteRecord of remoteData) {
      await this.processRemoteRecord(table, remoteRecord);
    }

    // Update last sync timestamp
    await this.setLastSyncTimestamp(table, Date.now());
  }

  private async processRemoteRecord(table: string, remoteRecord: any): Promise<void> {
    try {
      // Check if record exists locally
      const localRecord = await this.dbManager.get(table, remoteRecord.id);
      
      if (!localRecord) {
        // New record, insert locally
        await this.dbManager.add(table, remoteRecord);
      } else {
        // Record exists, check for conflicts
        const localUpdated = new Date(localRecord.updated_at).getTime();
        const remoteUpdated = new Date(remoteRecord.updated_at).getTime();
        
        if (remoteUpdated > localUpdated) {
          // Remote is newer, update local
          await this.dbManager.update(table, remoteRecord);
        } else if (localUpdated > remoteUpdated) {
          // Local is newer, potential conflict
          await this.handleConflict(table, localRecord, remoteRecord);
        }
        // If timestamps are equal, no action needed
      }
    } catch (error) {
      console.error(`Failed to process remote record for ${table}:`, error);
    }
  }

  // ============================================================================
  // Push Local Changes
  // ============================================================================

  private async pushLocalChanges(): Promise<void> {
    const pendingOperations = this.syncQueue.filter(op => op.status === 'pending');
    
    for (const operation of pendingOperations) {
      try {
        operation.status = 'syncing';
        await this.updateSyncOperation(operation);
        
        await this.executeSyncOperation(operation);
        
        operation.status = 'completed';
        await this.removeSyncOperation(operation.id);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        
        operation.retryCount++;
        operation.status = 'failed';
        
        if (operation.retryCount >= 3) {
          // Max retries reached, remove from queue
          await this.removeSyncOperation(operation.id);
          console.error(`Max retries reached for operation ${operation.id}, removing from queue`);
        } else {
          // Reset status for retry
          operation.status = 'pending';
          await this.updateSyncOperation(operation);
        }
      }
    }
  }

  private async executeSyncOperation(operation: SyncOperation): Promise<void> {
    const { table, operation: op, data } = operation;
    
    switch (op) {
      case 'insert':
        const { error: insertError } = await supabase
          .from(table as any)
          .insert(data);
        
        if (insertError) {
          throw new Error(`Insert failed: ${insertError.message}`);
        }
        break;
        
      case 'update':
        const { error: updateError } = await supabase
          .from(table as any)
          .update(data)
          .eq('id', data.id);
        
        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }
        break;
        
      case 'delete':
        const { error: deleteError } = await supabase
          .from(table as any)
          .delete()
          .eq('id', data.id);
        
        if (deleteError) {
          throw new Error(`Delete failed: ${deleteError.message}`);
        }
        break;
    }
  }

  // ============================================================================
  // Conflict Resolution
  // ============================================================================

  private async handleConflict(
    table: string,
    localData: any,
    remoteData: any
  ): Promise<void> {
    const conflict: SyncConflict = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table,
      localData,
      remoteData,
      conflictType: 'update_conflict',
      timestamp: Date.now()
    };

    // Get conflict resolver for this table
    const resolver = this.conflictResolver.get(table) || this.conflictResolver.get('default')!;
    
    try {
      const resolvedData = await resolver(conflict);
      
      // Update local data with resolved version
      await this.dbManager.update(table, resolvedData);
      
      // Add to sync queue to push resolved data to remote
      await this.addToSyncQueue(table, 'update', resolvedData);
      
      console.log(`Conflict resolved for ${table}:${localData.id}`);
    } catch (error) {
      console.error(`Failed to resolve conflict for ${table}:`, error);
      
      // Fallback: use remote data
      await this.dbManager.update(table, remoteData);
    }
  }

  // ============================================================================
  // Sync Metadata Management
  // ============================================================================

  private async getLastSyncTimestamp(table: string): Promise<number> {
    try {
      const metadata = await this.dbManager.get('syncMetadata', table);
      return metadata?.last_sync || 0;
    } catch (error) {
      return 0; // First sync
    }
  }

  private async setLastSyncTimestamp(table: string, timestamp: number): Promise<void> {
    try {
      const metadata = {
        id: table,
        table_name: table,
        last_sync: timestamp,
        updated_at: new Date().toISOString()
      };
      
      await this.dbManager.update('sync_metadata', metadata);
    } catch (error) {
      // If update fails, try insert
      try {
        await this.dbManager.add('syncMetadata', metadata);
      } catch (insertError) {
        console.error(`Failed to set sync timestamp for ${table}:`, insertError);
      }
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Force a full sync
   */
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.startSync();
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isOnline: boolean;
    syncInProgress: boolean;
    pendingOperations: number;
    failedOperations: number;
  } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      pendingOperations: this.syncQueue.filter(op => op.status === 'pending').length,
      failedOperations: this.syncQueue.filter(op => op.status === 'failed').length
    };
  }

  /**
   * Clear failed operations
   */
  async clearFailedOperations(): Promise<void> {
    const failedOps = this.syncQueue.filter(op => op.status === 'failed');
    
    for (const op of failedOps) {
      await this.removeSyncOperation(op.id);
    }
  }

  /**
   * Reset sync for a table (force full re-sync)
   */
  async resetTableSync(table: string): Promise<void> {
    await this.setLastSyncTimestamp(table, 0);
  }

  /**
   * Get sync conflicts (for manual resolution)
   */
  async getSyncConflicts(): Promise<SyncConflict[]> {
    try {
      // Temporarily disabled - return empty array
      console.warn('[SyncService] Conflict resolution temporarily disabled');
      return [];
      // return await this.dbManager.getAll('syncConflicts');
    } catch (error) {
      console.error('Failed to get sync conflicts:', error);
      return [];
    }
  }
}

export const syncService = SyncService.getInstance();