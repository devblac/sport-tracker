/**
 * React Hook for Sync Service Integration
 * Provides easy access to synchronization functionality with React state management
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { syncService } from '@/services/SyncService';
import type { SyncResult, SyncStatus } from '@/services/SyncService';
import type { SyncConflict } from '@/utils/syncManager';
import type { SyncOperation } from '@/utils/syncQueue';

export interface UseSyncOptions {
  enableAutoSync?: boolean;
  enableConflictNotifications?: boolean;
  enableStatusUpdates?: boolean;
  autoInitialize?: boolean;
}

export interface UseSyncResult {
  // Status
  status: SyncStatus;
  isInitialized: boolean;
  
  // Actions
  queueOperation: (
    type: SyncOperation['type'],
    entity: SyncOperation['entity'],
    data: any,
    options?: {
      priority?: SyncOperation['priority'];
      maxRetries?: number;
      triggerImmediateSync?: boolean;
    }
  ) => Promise<string>;
  
  triggerSync: () => Promise<SyncResult>;
  resolveConflict: (
    conflictId: string,
    strategy: 'local_wins' | 'remote_wins' | 'merge',
    mergedData?: any
  ) => Promise<void>;
  
  // Data
  pendingConflicts: SyncConflict[];
  lastSyncResult: SyncResult | null;
  
  // Controls
  setAutoSyncEnabled: (enabled: boolean) => void;
  cleanup: (olderThanHours?: number) => Promise<void>;
}

const DEFAULT_STATUS: SyncStatus = {
  isOnline: navigator.onLine,
  isSyncing: false,
  pendingOperations: 0,
  lastSyncTime: 0,
  hasConflicts: false,
};

export function useSync(options: UseSyncOptions = {}): UseSyncResult {
  const {
    enableAutoSync = true,
    enableConflictNotifications = true,
    enableStatusUpdates = true,
    autoInitialize = true,
  } = options;

  // State
  const [status, setStatus] = useState<SyncStatus>(DEFAULT_STATUS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState<SyncConflict[]>([]);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Refs to prevent stale closures
  const statusUpdateIntervalRef = useRef<NodeJS.Timeout>();
  const conflictCheckIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize sync service
  useEffect(() => {
    if (!autoInitialize) return;

    const initializeSync = async () => {
      try {
        await syncService.initialize();
        setIsInitialized(true);
        
        // Update initial status
        const initialStatus = await syncService.getSyncStatus();
        setStatus(initialStatus);
        
        console.log('[useSync] Sync service initialized');
      } catch (error) {
        console.error('[useSync] Failed to initialize sync service:', error);
      }
    };

    initializeSync();
  }, [autoInitialize]);

  // Set up sync result listener
  useEffect(() => {
    if (!isInitialized) return;

    const handleSyncResult = (result: SyncResult) => {
      setLastSyncResult(result);
      console.log('[useSync] Sync result received:', result);
    };

    syncService.addSyncListener(handleSyncResult);

    return () => {
      syncService.removeSyncListener(handleSyncResult);
    };
  }, [isInitialized]);

  // Set up conflict listener
  useEffect(() => {
    if (!isInitialized || !enableConflictNotifications) return;

    const handleConflicts = (conflicts: SyncConflict[]) => {
      setPendingConflicts(conflicts);
      console.log('[useSync] Conflicts detected:', conflicts.length);
    };

    syncService.addConflictListener(handleConflicts);

    return () => {
      syncService.removeConflictListener(handleConflicts);
    };
  }, [isInitialized, enableConflictNotifications]);

  // Set up status updates
  useEffect(() => {
    if (!isInitialized || !enableStatusUpdates) return;

    const updateStatus = async () => {
      try {
        const currentStatus = await syncService.getSyncStatus();
        setStatus(currentStatus);
      } catch (error) {
        console.error('[useSync] Failed to update status:', error);
      }
    };

    // Update status immediately
    updateStatus();

    // Set up periodic status updates
    statusUpdateIntervalRef.current = setInterval(updateStatus, 5000); // Every 5 seconds

    return () => {
      if (statusUpdateIntervalRef.current) {
        clearInterval(statusUpdateIntervalRef.current);
      }
    };
  }, [isInitialized, enableStatusUpdates]);

  // Set up periodic conflict checks
  useEffect(() => {
    if (!isInitialized || !enableConflictNotifications) return;

    const checkConflicts = async () => {
      try {
        const conflicts = await syncService.getPendingConflicts();
        setPendingConflicts(conflicts);
      } catch (error) {
        console.error('[useSync] Failed to check conflicts:', error);
      }
    };

    // Check conflicts immediately
    checkConflicts();

    // Set up periodic conflict checks
    conflictCheckIntervalRef.current = setInterval(checkConflicts, 30000); // Every 30 seconds

    return () => {
      if (conflictCheckIntervalRef.current) {
        clearInterval(conflictCheckIntervalRef.current);
      }
    };
  }, [isInitialized, enableConflictNotifications]);

  // Configure auto-sync
  useEffect(() => {
    if (!isInitialized) return;

    syncService.setAutoSyncEnabled(enableAutoSync);
  }, [isInitialized, enableAutoSync]);

  // Memoized action functions
  const queueOperation = useCallback(async (
    type: SyncOperation['type'],
    entity: SyncOperation['entity'],
    data: any,
    operationOptions?: {
      priority?: SyncOperation['priority'];
      maxRetries?: number;
      triggerImmediateSync?: boolean;
    }
  ) => {
    if (!isInitialized) {
      throw new Error('Sync service not initialized');
    }

    return await syncService.queueOperation(type, entity, data, operationOptions);
  }, [isInitialized]);

  const triggerSync = useCallback(async () => {
    if (!isInitialized) {
      throw new Error('Sync service not initialized');
    }

    return await syncService.triggerSync();
  }, [isInitialized]);

  const resolveConflict = useCallback(async (
    conflictId: string,
    strategy: 'local_wins' | 'remote_wins' | 'merge',
    mergedData?: any
  ) => {
    if (!isInitialized) {
      throw new Error('Sync service not initialized');
    }

    await syncService.resolveConflict(conflictId, strategy, mergedData);
    
    // Refresh conflicts after resolution
    const updatedConflicts = await syncService.getPendingConflicts();
    setPendingConflicts(updatedConflicts);
  }, [isInitialized]);

  const setAutoSyncEnabled = useCallback((enabled: boolean) => {
    if (!isInitialized) return;
    
    syncService.setAutoSyncEnabled(enabled);
  }, [isInitialized]);

  const cleanup = useCallback(async (olderThanHours: number = 24) => {
    if (!isInitialized) return;
    
    await syncService.cleanup(olderThanHours);
  }, [isInitialized]);

  return {
    // Status
    status,
    isInitialized,
    
    // Actions
    queueOperation,
    triggerSync,
    resolveConflict,
    
    // Data
    pendingConflicts,
    lastSyncResult,
    
    // Controls
    setAutoSyncEnabled,
    cleanup,
  };
}

/**
 * Hook for simple sync operations without full status management
 */
export function useSyncOperations() {
  const { queueOperation, triggerSync, isInitialized } = useSync({
    enableStatusUpdates: false,
    enableConflictNotifications: false,
  });

  return {
    queueOperation,
    triggerSync,
    isInitialized,
  };
}

/**
 * Hook for sync status monitoring only
 */
export function useSyncStatus() {
  const { status, isInitialized } = useSync({
    enableConflictNotifications: false,
  });

  return {
    status,
    isInitialized,
  };
}

/**
 * Hook for conflict management only
 */
export function useSyncConflicts() {
  const { pendingConflicts, resolveConflict, isInitialized } = useSync({
    enableStatusUpdates: false,
  });

  return {
    pendingConflicts,
    resolveConflict,
    isInitialized,
  };
}