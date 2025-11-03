import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  initializeNetworkMonitoring,
  cleanupNetworkMonitoring,
  queueOperation,
  processQueue,
  getPendingSyncCount,
  getSyncQueueStatus,
  forceSyncNow,
  retryFailedOperations,
  SyncOperation
} from '../lib/offlineSync';

export interface SyncStatus {
  pending: number;
  failed: number;
  syncing: number;
  isOnline: boolean;
}

export interface UseOfflineSyncReturn {
  // Queue operations
  queueOperation: (
    operationType: SyncOperation['operation_type'],
    tableName: SyncOperation['table_name'],
    recordId: string,
    data: any
  ) => Promise<void>;
  
  // Manual sync controls
  syncNow: () => Promise<void>;
  retryFailed: () => Promise<void>;
  
  // Status information
  pendingCount: number;
  syncStatus: SyncStatus;
  isSyncing: boolean;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

export const useOfflineSync = (): UseOfflineSyncReturn => {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    pending: 0,
    failed: 0,
    syncing: 0,
    isOnline: true
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const appState = useRef(AppState.currentState);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize sync monitoring
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Initialize network monitoring
        initializeNetworkMonitoring();
        
        // Load initial sync status
        await updateSyncStatus();
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize offline sync:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize sync');
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      cleanupNetworkMonitoring();
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
      }
    };
  }, []);

  // Set up app state monitoring for background sync
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const wasBackground = appState.current.match(/inactive|background/);
      const isActive = nextAppState === 'active';
      
      appState.current = nextAppState;
      
      // If app is coming to foreground, trigger sync
      if (wasBackground && isActive) {
        console.log('App came to foreground - triggering sync');
        handleSyncNow().catch(err => {
          console.error('Background sync failed:', err);
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription?.remove();
  }, []);

  // Set up periodic sync status updates
  useEffect(() => {
    const startPeriodicUpdates = () => {
      syncInterval.current = setInterval(() => {
        updateSyncStatus().catch(err => {
          console.error('Failed to update sync status:', err);
        });
      }, 5000); // Update every 5 seconds
    };

    startPeriodicUpdates();

    return () => {
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
      }
    };
  }, []);

  // Update sync status from database
  const updateSyncStatus = useCallback(async () => {
    try {
      const [count, status] = await Promise.all([
        getPendingSyncCount(),
        getSyncQueueStatus()
      ]);
      
      setPendingCount(count);
      setSyncStatus(status);
      setError(null);
    } catch (err) {
      console.error('Failed to update sync status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update sync status');
    }
  }, []);

  // Queue an operation for offline sync
  const handleQueueOperation = useCallback(async (
    operationType: SyncOperation['operation_type'],
    tableName: SyncOperation['table_name'],
    recordId: string,
    data: any
  ) => {
    try {
      setError(null);
      await queueOperation(operationType, tableName, recordId, data);
      await updateSyncStatus();
    } catch (err) {
      console.error('Failed to queue operation:', err);
      setError(err instanceof Error ? err.message : 'Failed to queue operation');
      throw err;
    }
  }, [updateSyncStatus]);

  // Manual sync trigger
  const handleSyncNow = useCallback(async () => {
    if (isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    try {
      setIsSyncing(true);
      setError(null);
      
      await forceSyncNow();
      await updateSyncStatus();
      
      console.log('Manual sync completed');
    } catch (err) {
      console.error('Manual sync failed:', err);
      setError(err instanceof Error ? err.message : 'Sync failed');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updateSyncStatus]);

  // Retry failed operations
  const handleRetryFailed = useCallback(async () => {
    try {
      setError(null);
      await retryFailedOperations();
      await updateSyncStatus();
    } catch (err) {
      console.error('Failed to retry operations:', err);
      setError(err instanceof Error ? err.message : 'Failed to retry operations');
      throw err;
    }
  }, [updateSyncStatus]);

  return {
    queueOperation: handleQueueOperation,
    syncNow: handleSyncNow,
    retryFailed: handleRetryFailed,
    pendingCount,
    syncStatus,
    isSyncing,
    isLoading,
    error
  };
};

// Hook for sync status indicators in UI components
export const useSyncStatusIndicator = () => {
  const { pendingCount, syncStatus, isSyncing } = useOfflineSync();
  
  const getSyncStatusText = useCallback(() => {
    if (!syncStatus.isOnline) {
      return 'Offline';
    }
    
    if (isSyncing) {
      return 'Syncing...';
    }
    
    if (pendingCount > 0) {
      return `${pendingCount} pending`;
    }
    
    if (syncStatus.failed > 0) {
      return `${syncStatus.failed} failed`;
    }
    
    return 'Synced';
  }, [pendingCount, syncStatus, isSyncing]);

  const getSyncStatusColor = useCallback(() => {
    if (!syncStatus.isOnline) {
      return '#ff6b6b'; // Red for offline
    }
    
    if (isSyncing) {
      return '#4ecdc4'; // Teal for syncing
    }
    
    if (pendingCount > 0) {
      return '#ffd93d'; // Yellow for pending
    }
    
    if (syncStatus.failed > 0) {
      return '#ff6b6b'; // Red for failed
    }
    
    return '#6bcf7f'; // Green for synced
  }, [pendingCount, syncStatus, isSyncing]);

  return {
    statusText: getSyncStatusText(),
    statusColor: getSyncStatusColor(),
    isOnline: syncStatus.isOnline,
    hasPending: pendingCount > 0,
    hasFailed: syncStatus.failed > 0,
    isSyncing
  };
};