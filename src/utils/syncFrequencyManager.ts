/**
 * Sync Frequency Manager
 * Intelligently manages synchronization frequency based on user activity and network conditions
 */

import { syncQueue } from './syncQueue';
import { syncManager } from './syncManager';

export interface SyncFrequencyConfig {
  minInterval: number; // Minimum time between syncs (ms)
  maxInterval: number; // Maximum time between syncs (ms)
  activeUserInterval: number; // Sync interval when user is active (ms)
  inactiveUserInterval: number; // Sync interval when user is inactive (ms)
  networkOptimizedInterval: number; // Interval when network is slow (ms)
  batchSyncThreshold: number; // Number of operations to trigger immediate sync
}

const DEFAULT_CONFIG: SyncFrequencyConfig = {
  minInterval: 30000, // 30 seconds
  maxInterval: 300000, // 5 minutes
  activeUserInterval: 60000, // 1 minute
  inactiveUserInterval: 180000, // 3 minutes
  networkOptimizedInterval: 120000, // 2 minutes
  batchSyncThreshold: 5,
};

export class SyncFrequencyManager {
  private static instance: SyncFrequencyManager;
  private config: SyncFrequencyConfig;
  private syncTimer?: NodeJS.Timeout;
  private lastSyncTime = 0;
  private lastUserActivity = Date.now();
  private isUserActive = true;
  private networkQuality: 'fast' | 'slow' | 'offline' = 'fast';
  private pendingOperationsCount = 0;
  private syncInProgress = false;

  private constructor(config: Partial<SyncFrequencyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeActivityTracking();
    this.initializeNetworkMonitoring();
    this.startSyncScheduler();
  }

  public static getInstance(config?: Partial<SyncFrequencyConfig>): SyncFrequencyManager {
    if (!SyncFrequencyManager.instance) {
      SyncFrequencyManager.instance = new SyncFrequencyManager(config);
    }
    return SyncFrequencyManager.instance;
  }

  /**
   * Initialize user activity tracking
   */
  private initializeActivityTracking(): void {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      this.lastUserActivity = Date.now();
      if (!this.isUserActive) {
        this.isUserActive = true;
        this.optimizeSyncFrequency();
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for inactivity every minute
    setInterval(() => {
      const inactiveTime = Date.now() - this.lastUserActivity;
      const wasActive = this.isUserActive;
      this.isUserActive = inactiveTime < 300000; // 5 minutes

      if (wasActive !== this.isUserActive) {
        this.optimizeSyncFrequency();
      }
    }, 60000);
  }

  /**
   * Initialize network quality monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.networkQuality = 'fast';
      this.optimizeSyncFrequency();
      this.triggerImmediateSync(); // Sync when coming back online
    });

    window.addEventListener('offline', () => {
      this.networkQuality = 'offline';
      this.stopSyncScheduler();
    });

    // Monitor connection quality if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkQuality = () => {
        if (connection.effectiveType === '4g' || connection.effectiveType === '3g') {
          this.networkQuality = 'fast';
        } else {
          this.networkQuality = 'slow';
        }
        this.optimizeSyncFrequency();
      };

      connection.addEventListener('change', updateNetworkQuality);
      updateNetworkQuality(); // Initial check
    }
  }

  /**
   * Start the sync scheduler
   */
  private startSyncScheduler(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    const interval = this.calculateOptimalInterval();
    
    this.syncTimer = setInterval(async () => {
      await this.performScheduledSync();
    }, interval);

    console.log(`[SyncFrequencyManager] Sync scheduler started with ${interval}ms interval`);
  }

  /**
   * Stop the sync scheduler
   */
  private stopSyncScheduler(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
    console.log('[SyncFrequencyManager] Sync scheduler stopped');
  }

  /**
   * Calculate optimal sync interval based on current conditions
   */
  private calculateOptimalInterval(): number {
    if (this.networkQuality === 'offline') {
      return this.config.maxInterval;
    }

    let interval: number;

    // Base interval on user activity
    if (this.isUserActive) {
      interval = this.config.activeUserInterval;
    } else {
      interval = this.config.inactiveUserInterval;
    }

    // Adjust for network quality
    if (this.networkQuality === 'slow') {
      interval = Math.max(interval, this.config.networkOptimizedInterval);
    }

    // Adjust for pending operations
    if (this.pendingOperationsCount >= this.config.batchSyncThreshold) {
      interval = Math.max(this.config.minInterval, interval / 2);
    }

    // Ensure within bounds
    return Math.max(this.config.minInterval, Math.min(interval, this.config.maxInterval));
  }

  /**
   * Optimize sync frequency based on current conditions
   */
  private optimizeSyncFrequency(): void {
    if (this.networkQuality !== 'offline') {
      this.startSyncScheduler();
    }
  }

  /**
   * Perform scheduled sync
   */
  private async performScheduledSync(): Promise<void> {
    if (this.syncInProgress || this.networkQuality === 'offline') {
      return;
    }

    try {
      this.syncInProgress = true;
      
      // Update pending operations count
      const stats = await syncQueue.getQueueStats();
      this.pendingOperationsCount = stats.pending;

      // Skip sync if no pending operations
      if (this.pendingOperationsCount === 0) {
        return;
      }

      console.log(`[SyncFrequencyManager] Starting scheduled sync (${this.pendingOperationsCount} pending operations)`);
      
      // Perform sync
      const result = await syncManager.performSync();
      
      this.lastSyncTime = Date.now();
      
      console.log(`[SyncFrequencyManager] Scheduled sync completed:`, {
        synced: result.synced,
        failed: result.failed,
        conflicts: result.conflicts.length
      });

      // Adjust frequency based on results
      if (result.failed > 0) {
        // Slow down on failures
        this.config.activeUserInterval = Math.min(
          this.config.activeUserInterval * 1.5,
          this.config.maxInterval
        );
      } else if (result.synced > 0) {
        // Speed up on success
        this.config.activeUserInterval = Math.max(
          this.config.activeUserInterval * 0.9,
          this.config.minInterval
        );
      }

    } catch (error) {
      console.error('[SyncFrequencyManager] Scheduled sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Trigger immediate sync (e.g., when user performs important action)
   */
  async triggerImmediateSync(): Promise<void> {
    if (this.syncInProgress || this.networkQuality === 'offline') {
      return;
    }

    // Don't sync too frequently
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    if (timeSinceLastSync < this.config.minInterval) {
      console.log('[SyncFrequencyManager] Skipping immediate sync - too soon since last sync');
      return;
    }

    console.log('[SyncFrequencyManager] Triggering immediate sync');
    await this.performScheduledSync();
  }

  /**
   * Notify about new pending operation
   */
  notifyPendingOperation(): void {
    this.pendingOperationsCount++;
    
    // Trigger immediate sync if threshold reached
    if (this.pendingOperationsCount >= this.config.batchSyncThreshold) {
      this.triggerImmediateSync();
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): {
    isActive: boolean;
    nextSyncIn: number;
    pendingOperations: number;
    networkQuality: string;
    userActive: boolean;
  } {
    const nextSyncIn = this.syncTimer 
      ? this.calculateOptimalInterval() - (Date.now() - this.lastSyncTime)
      : -1;

    return {
      isActive: !!this.syncTimer,
      nextSyncIn: Math.max(0, nextSyncIn),
      pendingOperations: this.pendingOperationsCount,
      networkQuality: this.networkQuality,
      userActive: this.isUserActive,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SyncFrequencyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.optimizeSyncFrequency();
    console.log('[SyncFrequencyManager] Configuration updated:', newConfig);
  }

  /**
   * Destroy the manager and clean up resources
   */
  destroy(): void {
    this.stopSyncScheduler();
    console.log('[SyncFrequencyManager] Destroyed');
  }
}

// Export singleton instance
export const syncFrequencyManager = SyncFrequencyManager.getInstance();