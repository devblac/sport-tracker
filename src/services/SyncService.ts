/**
 * Comprehensive Sync Service
 * Integrates all synchronization components with robust error handling and optimization
 */

import { syncQueue } from '@/utils/syncQueue';
import { syncManager } from '@/utils/syncManager';
import { syncFrequencyManager } from '@/utils/syncFrequencyManager';
import type { SyncOperation } from '@/utils/syncQueue';
import type { SyncResult, SyncConflict } from '@/utils/syncManager';

export interface SyncServiceConfig {
  enableAutoSync: boolean;
  enableConflictResolution: boolean;
  enableFrequencyOptimization: boolean;
  maxConcurrentOperations: number;
  syncTimeout: number;
}

const DEFAULT_CONFIG: SyncServiceConfig = {
  enableAutoSync: true,
  enableConflictResolution: true,
  enableFrequencyOptimization: true,
  maxConcurrentOperations: 3,
  syncTimeout: 30000, // 30 seconds
};

export class SyncService {
  private static instance: SyncService;
  private config: SyncServiceConfig;
  private syncListeners: Set<(result: SyncResult) => void> = new Set();
  private conflictListeners: Set<(conflicts: SyncConflict[]) => void> = new Set();
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();
  private isInitialized = false;

  private constructor(config: Partial<SyncServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public static getInstance(config?: Partial<SyncServiceConfig>): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService(config);
    }
    return SyncService.instance;
  }

  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('[SyncService] Initializing sync service...');

      // Set up sync manager listeners
      if (this.config.enableConflictResolution) {
        syncManager.addSyncListener((result) => {
          this.notifySyncListeners(result);
          
          if (result.conflicts.length > 0) {
            this.notifyConflictListeners(result.conflicts);
          }
        });
      }

      // Set up sync queue listeners
      syncQueue.addListener((operation) => {
        this.notifyStatusListeners({
          isOnline: navigator.onLine,
          isSyncing: operation.status === 'processing',
          pendingOperations: 0, // Will be updated by frequency manager
          lastSyncTime: Date.now(),
          hasConflicts: false,
        });
      });

      // Start frequency optimization if enabled
      if (this.config.enableFrequencyOptimization) {
        // Frequency manager is already initialized as singleton
        console.log('[SyncService] Frequency optimization enabled');
      }

      this.isInitialized = true;
      console.log('[SyncService] Sync service initialized successfully');

    } catch (error) {
      console.error('[SyncService] Failed to initialize sync service:', error);
      throw error;
    }
  }

  /**
   * Queue an operation for synchronization
   */
  async queueOperation(
    type: SyncOperation['type'],
    entity: SyncOperation['entity'],
    data: any,
    options: {
      priority?: SyncOperation['priority'];
      maxRetries?: number;
      triggerImmediateSync?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const operationId = await syncQueue.addOperation({
        type,
        entity,
        data,
        priority: options.priority || 'medium',
        maxRetries: options.maxRetries || 3,
      });

      // Notify frequency manager about new operation
      if (this.config.enableFrequencyOptimization) {
        syncFrequencyManager.notifyPendingOperation();
      }

      // Trigger immediate sync if requested
      if (options.triggerImmediateSync) {
        await this.triggerSync();
      }

      console.log(`[SyncService] Operation queued: ${operationId}`);
      return operationId;

    } catch (error) {
      console.error('[SyncService] Failed to queue operation:', error);
      throw error;
    }
  }

  /**
   * Trigger immediate synchronization
   */
  async triggerSync(): Promise<SyncResult> {
    try {
      console.log('[SyncService] Triggering immediate sync...');

      if (this.config.enableFrequencyOptimization) {
        await syncFrequencyManager.triggerImmediateSync();
      }

      const result = await syncManager.performSync();
      
      console.log('[SyncService] Immediate sync completed:', {
        synced: result.synced,
        failed: result.failed,
        conflicts: result.conflicts.length,
        success: result.success
      });

      // Notify listeners with the actual result
      this.notifySyncListeners(result);
      return result;

    } catch (error) {
      console.error('[SyncService] Immediate sync failed:', error);
      
      const errorResult: SyncResult = {
        success: false,
        conflicts: [],
        synced: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : String(error)],
      };

      this.notifySyncListeners(errorResult);
      return errorResult;
    }
  }

  /**
   * Get pending conflicts that require manual resolution
   */
  async getPendingConflicts(): Promise<SyncConflict[]> {
    if (!this.config.enableConflictResolution) {
      return [];
    }

    try {
      return await syncManager.getPendingConflicts();
    } catch (error) {
      console.error('[SyncService] Failed to get pending conflicts:', error);
      return [];
    }
  }

  /**
   * Resolve a conflict manually
   */
  async resolveConflict(
    conflictId: string,
    strategy: 'local_wins' | 'remote_wins' | 'merge',
    mergedData?: any
  ): Promise<void> {
    if (!this.config.enableConflictResolution) {
      throw new Error('Conflict resolution is disabled');
    }

    try {
      await syncManager.resolveConflictManually(conflictId, {
        strategy,
        resolvedData: mergedData,
      });

      console.log(`[SyncService] Conflict resolved: ${conflictId} (${strategy})`);

    } catch (error) {
      console.error('[SyncService] Failed to resolve conflict:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const queueStats = await syncQueue.getQueueStats();
      const pendingConflicts = this.config.enableConflictResolution 
        ? await this.getPendingConflicts()
        : [];

      const frequencyStatus = this.config.enableFrequencyOptimization
        ? syncFrequencyManager.getSyncStatus()
        : null;

      return {
        isOnline: navigator.onLine,
        isSyncing: queueStats.processing > 0,
        pendingOperations: queueStats.pending,
        failedOperations: queueStats.failed,
        lastSyncTime: frequencyStatus?.nextSyncIn ? Date.now() - frequencyStatus.nextSyncIn : 0,
        hasConflicts: pendingConflicts.length > 0,
        conflictCount: pendingConflicts.length,
        networkQuality: frequencyStatus?.networkQuality || 'unknown',
        userActive: frequencyStatus?.userActive || true,
        nextSyncIn: frequencyStatus?.nextSyncIn || -1,
      };

    } catch (error) {
      console.error('[SyncService] Failed to get sync status:', error);
      
      return {
        isOnline: navigator.onLine,
        isSyncing: false,
        pendingOperations: 0,
        failedOperations: 0,
        lastSyncTime: 0,
        hasConflicts: false,
        conflictCount: 0,
        networkQuality: 'unknown',
        userActive: true,
        nextSyncIn: -1,
      };
    }
  }

  /**
   * Enable or disable auto-sync
   */
  setAutoSyncEnabled(enabled: boolean): void {
    this.config.enableAutoSync = enabled;
    
    if (enabled && this.config.enableFrequencyOptimization) {
      // Restart frequency manager if needed
      console.log('[SyncService] Auto-sync enabled');
    } else {
      console.log('[SyncService] Auto-sync disabled');
    }
  }

  /**
   * Update sync configuration
   */
  updateConfig(newConfig: Partial<SyncServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[SyncService] Configuration updated:', newConfig);
  }

  /**
   * Add sync result listener
   */
  addSyncListener(listener: (result: SyncResult) => void): void {
    this.syncListeners.add(listener);
  }

  /**
   * Remove sync result listener
   */
  removeSyncListener(listener: (result: SyncResult) => void): void {
    this.syncListeners.delete(listener);
  }

  /**
   * Add conflict listener
   */
  addConflictListener(listener: (conflicts: SyncConflict[]) => void): void {
    this.conflictListeners.add(listener);
  }

  /**
   * Remove conflict listener
   */
  removeConflictListener(listener: (conflicts: SyncConflict[]) => void): void {
    this.conflictListeners.delete(listener);
  }

  /**
   * Add status listener
   */
  addStatusListener(listener: (status: SyncStatus) => void): void {
    this.statusListeners.add(listener);
  }

  /**
   * Remove status listener
   */
  removeStatusListener(listener: (status: SyncStatus) => void): void {
    this.statusListeners.delete(listener);
  }

  /**
   * Clean up old completed operations and resolved conflicts
   */
  async cleanup(olderThanHours: number = 24): Promise<void> {
    try {
      const cleanedOperations = await syncQueue.cleanupCompletedOperations(olderThanHours);
      console.log(`[SyncService] Cleaned up ${cleanedOperations} old operations`);
    } catch (error) {
      console.error('[SyncService] Cleanup failed:', error);
    }
  }

  /**
   * Destroy the sync service and clean up resources
   */
  destroy(): void {
    this.syncListeners.clear();
    this.conflictListeners.clear();
    this.statusListeners.clear();
    
    if (this.config.enableFrequencyOptimization) {
      syncFrequencyManager.destroy();
    }
    
    syncQueue.stopProcessing();
    
    this.isInitialized = false;
    console.log('[SyncService] Sync service destroyed');
  }

  // Private helper methods

  private notifySyncListeners(result: SyncResult): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        console.error('[SyncService] Sync listener error:', error);
      }
    });
  }

  private notifyConflictListeners(conflicts: SyncConflict[]): void {
    this.conflictListeners.forEach(listener => {
      try {
        listener(conflicts);
      } catch (error) {
        console.error('[SyncService] Conflict listener error:', error);
      }
    });
  }

  private notifyStatusListeners(status: SyncStatus): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('[SyncService] Status listener error:', error);
      }
    });
  }
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  failedOperations?: number;
  lastSyncTime: number;
  hasConflicts: boolean;
  conflictCount?: number;
  networkQuality?: string;
  userActive?: boolean;
  nextSyncIn?: number;
}

// Export singleton instance
export const syncService = SyncService.getInstance();