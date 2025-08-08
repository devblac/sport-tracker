import { useState, useEffect, useCallback } from 'react';
import { syncQueue } from '@/utils/syncQueue';
import type { SyncOperation } from '@/utils/syncQueue';
import { syncManager } from '@/utils/syncManager';
import type { SyncResult, SyncConflict } from '@/utils/syncManager';

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  queueSize: number;
  lastSyncTime: Date | null;
  conflicts: SyncConflict[];
  syncResult: SyncResult | null;
}

export interface SyncActions {
  addToQueue: (operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>) => Promise<string>;
  performSync: () => Promise<SyncResult>;
  resolveConflict: (conflictId: string, strategy: 'local' | 'remote' | 'merge', mergedData?: any) => Promise<void>;
  clearQueue: () => Promise<void>;
  getQueueStats: () => Promise<any>;
}

export const useSync = () => {
  const [state, setState] = useState<SyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    queueSize: 0,
    lastSyncTime: null,
    conflicts: [],
    syncResult: null,
  });

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      if (state.queueSize > 0) {
        performSync();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.queueSize]);

  // Listen to sync queue updates
  useEffect(() => {
    const handleOperationUpdate = (operation: SyncOperation) => {
      updateQueueSize();
    };

    syncQueue.addListener(handleOperationUpdate);

    return () => {
      syncQueue.removeListener(handleOperationUpdate);
    };
  }, []);

  // Listen to sync results
  useEffect(() => {
    const handleSyncResult = (result: SyncResult) => {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncResult: result,
        lastSyncTime: new Date(),
        conflicts: result.conflicts,
      }));
    };

    syncManager.addSyncListener(handleSyncResult);

    return () => {
      syncManager.removeSyncListener(handleSyncResult);
    };
  }, []);

  // Update queue size
  const updateQueueSize = useCallback(async () => {
    try {
      const stats = await syncQueue.getQueueStats();
      setState(prev => ({ 
        ...prev, 
        queueSize: stats.pending + stats.processing 
      }));
    } catch (error) {
      // Silently handle database initialization errors
      if (error instanceof Error && error.message.includes('object stores was not found')) {
        return;
      }
      console.error('Failed to update queue size:', error);
    }
  }, []);

  // Initialize queue size
  useEffect(() => {
    updateQueueSize();
  }, [updateQueueSize]);

  // Add operation to queue
  const addToQueue = useCallback(async (
    operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>
  ): Promise<string> => {
    try {
      const operationId = await syncQueue.addOperation(operation);
      await updateQueueSize();
      return operationId;
    } catch (error) {
      console.error('Failed to add operation to queue:', error);
      throw error;
    }
  }, [updateQueueSize]);

  // Perform sync
  const performSync = useCallback(async (): Promise<SyncResult> => {
    if (!state.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    setState(prev => ({ ...prev, isSyncing: true }));

    try {
      const result = await syncManager.performSync();
      await updateQueueSize();
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [state.isOnline, updateQueueSize]);

  // Resolve conflict
  const resolveConflict = useCallback(async (
    conflictId: string, 
    strategy: 'local' | 'remote' | 'merge', 
    mergedData?: any
  ): Promise<void> => {
    try {
      const resolution = {
        strategy: strategy === 'local' ? 'local_wins' as const :
                 strategy === 'remote' ? 'remote_wins' as const :
                 'merge' as const,
        resolvedData: mergedData,
      };

      await syncManager.resolveConflictManually(conflictId, resolution);
      
      // Update conflicts list
      const updatedConflicts = await syncManager.getPendingConflicts();
      setState(prev => ({ ...prev, conflicts: updatedConflicts }));
      
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  }, []);

  // Clear queue
  const clearQueue = useCallback(async (): Promise<void> => {
    try {
      // This would need to be implemented in syncQueue
      console.warn('Clear queue not implemented yet');
      await updateQueueSize();
    } catch (error) {
      console.error('Failed to clear queue:', error);
      throw error;
    }
  }, [updateQueueSize]);

  // Get queue stats
  const getQueueStats = useCallback(async () => {
    try {
      return await syncQueue.getQueueStats();
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    }
  }, []);

  const actions: SyncActions = {
    addToQueue,
    performSync,
    resolveConflict,
    clearQueue,
    getQueueStats,
  };

  return {
    ...state,
    actions,
  };
};

// Hook for specific entity syncing
export const useEntitySync = (entity: 'workout' | 'exercise' | 'profile' | 'settings') => {
  const { actions } = useSync();

  const syncCreate = useCallback(async (data: any) => {
    return await actions.addToQueue({
      type: 'CREATE',
      entity,
      data,
      maxRetries: 5,
      priority: 'medium',
    });
  }, [actions, entity]);

  const syncUpdate = useCallback(async (data: any) => {
    return await actions.addToQueue({
      type: 'UPDATE',
      entity,
      data,
      maxRetries: 5,
      priority: 'medium',
    });
  }, [actions, entity]);

  const syncDelete = useCallback(async (data: any) => {
    return await actions.addToQueue({
      type: 'DELETE',
      entity,
      data,
      maxRetries: 3,
      priority: 'high',
    });
  }, [actions, entity]);

  return {
    syncCreate,
    syncUpdate,
    syncDelete,
  };
};

// Hook for workout-specific syncing
export const useWorkoutSync = () => {
  return useEntitySync('workout');
};

// Hook for profile-specific syncing
export const useProfileSync = () => {
  return useEntitySync('profile');
};