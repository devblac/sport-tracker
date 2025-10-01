/**
 * Offline Experience Hook
 * Provides comprehensive offline functionality and status
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineManager, networkErrorHandler, type NetworkStatus } from '@/utils/offlineUtils';
import { intelligentOfflineQueue, type QueueMetrics } from '@/utils/intelligentOfflineQueue';
import { cacheManager, type CacheStats } from '@/utils/cacheManager';

export interface OfflineExperienceState {
  // Network status
  isOnline: boolean;
  networkStatus: NetworkStatus;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  offlineDuration: number;
  
  // Queue status
  queueMetrics: QueueMetrics | null;
  hasPendingOperations: boolean;
  isSyncing: boolean;
  
  // Cache status
  cacheStats: CacheStats | null;
  
  // Error handling
  hasNetworkErrors: boolean;
  lastError: string | null;
  
  // Data saving mode
  dataSavingMode: boolean;
}

export interface OfflineExperienceActions {
  // Queue operations
  queueOperation: (operation: any) => Promise<string>;
  retryFailedOperations: () => Promise<void>;
  clearQueue: () => Promise<void>;
  
  // Cache operations
  clearCache: () => Promise<void>;
  clearCacheByTags: (tags: string[]) => Promise<number>;
  
  // Error handling
  clearErrors: () => void;
  reportError: (error: Error, context: string) => void;
  
  // Manual sync
  triggerSync: () => Promise<void>;
  
  // Settings
  setDataSavingMode: (enabled: boolean) => void;
}

export const useOfflineExperience = (): [OfflineExperienceState, OfflineExperienceActions] => {
  const [state, setState] = useState<OfflineExperienceState>({
    isOnline: offlineManager.getNetworkStatus().isOnline,
    networkStatus: offlineManager.getNetworkStatus(),
    networkQuality: offlineManager.getNetworkQuality(),
    offlineDuration: 0,
    queueMetrics: null,
    hasPendingOperations: false,
    isSyncing: false,
    cacheStats: null,
    hasNetworkErrors: false,
    lastError: null,
    dataSavingMode: offlineManager.shouldSaveData(),
  });

  // Update network status
  useEffect(() => {
    const handleNetworkChange = (networkStatus: NetworkStatus) => {
      setState(prev => ({
        ...prev,
        isOnline: networkStatus.isOnline,
        networkStatus,
        networkQuality: offlineManager.getNetworkQuality(),
        dataSavingMode: offlineManager.shouldSaveData(),
      }));
    };

    const handleOfflineChange = (isOffline: boolean) => {
      setState(prev => ({
        ...prev,
        isOnline: !isOffline,
        hasNetworkErrors: isOffline,
        lastError: isOffline ? 'Connection lost' : null,
      }));
    };

    offlineManager.addNetworkListener(handleNetworkChange);
    offlineManager.addOfflineListener(handleOfflineChange);

    return () => {
      offlineManager.removeNetworkListener(handleNetworkChange);
      offlineManager.removeOfflineListener(handleOfflineChange);
    };
  }, []);

  // Update offline duration
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!state.isOnline) {
      interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          offlineDuration: offlineManager.getOfflineDuration(),
        }));
      }, 1000);
    } else {
      setState(prev => ({
        ...prev,
        offlineDuration: 0,
      }));
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.isOnline]);

  // Update queue metrics
  useEffect(() => {
    const handleQueueMetrics = (metrics: QueueMetrics) => {
      setState(prev => ({
        ...prev,
        queueMetrics: metrics,
        hasPendingOperations: metrics.pendingOperations > 0,
        isSyncing: metrics.processingOperations > 0,
      }));
    };

    intelligentOfflineQueue.addMetricsListener(handleQueueMetrics);

    // Initial load
    intelligentOfflineQueue.getMetrics().then(handleQueueMetrics);

    return () => {
      intelligentOfflineQueue.removeMetricsListener(handleQueueMetrics);
    };
  }, []);

  // Update cache stats
  useEffect(() => {
    const updateCacheStats = async () => {
      try {
        const stats = await cacheManager.getStats();
        setState(prev => ({
          ...prev,
          cacheStats: stats,
        }));
      } catch (error) {
        console.error('Failed to get cache stats:', error);
      }
    };

    // Update cache stats periodically
    updateCacheStats();
    const interval = setInterval(updateCacheStats, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Actions
  const queueOperation = useCallback(async (operation: any): Promise<string> => {
    try {
      return await intelligentOfflineQueue.addOperation(operation);
    } catch (error) {
      setState(prev => ({
        ...prev,
        hasNetworkErrors: true,
        lastError: error instanceof Error ? error.message : 'Failed to queue operation',
      }));
      throw error;
    }
  }, []);

  const retryFailedOperations = useCallback(async (): Promise<void> => {
    try {
      // Reset error tracking
      networkErrorHandler.resetErrorTracking('retry');
      
      // Trigger queue processing
      await intelligentOfflineQueue.getMetrics();
      
      setState(prev => ({
        ...prev,
        hasNetworkErrors: false,
        lastError: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        hasNetworkErrors: true,
        lastError: error instanceof Error ? error.message : 'Retry failed',
      }));
      throw error;
    }
  }, []);

  const clearQueue = useCallback(async (): Promise<void> => {
    try {
      // This would need to be implemented in the queue
      console.log('Clear queue not yet implemented');
    } catch (error) {
      console.error('Failed to clear queue:', error);
      throw error;
    }
  }, []);

  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await cacheManager.clear();
      
      // Update cache stats
      const stats = await cacheManager.getStats();
      setState(prev => ({
        ...prev,
        cacheStats: stats,
      }));
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }, []);

  const clearCacheByTags = useCallback(async (tags: string[]): Promise<number> => {
    try {
      const deletedCount = await cacheManager.clearByTags(tags);
      
      // Update cache stats
      const stats = await cacheManager.getStats();
      setState(prev => ({
        ...prev,
        cacheStats: stats,
      }));
      
      return deletedCount;
    } catch (error) {
      console.error('Failed to clear cache by tags:', error);
      throw error;
    }
  }, []);

  const clearErrors = useCallback((): void => {
    setState(prev => ({
      ...prev,
      hasNetworkErrors: false,
      lastError: null,
    }));
  }, []);

  const reportError = useCallback((error: Error, context: string): void => {
    const errorInfo = networkErrorHandler.handleError(error, context);
    
    setState(prev => ({
      ...prev,
      hasNetworkErrors: true,
      lastError: error.message,
    }));
    
    // Log error info for debugging
    console.warn('[OfflineExperience] Error reported:', errorInfo);
  }, []);

  const triggerSync = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({
        ...prev,
        isSyncing: true,
      }));
      
      // Trigger queue processing
      await intelligentOfflineQueue.getMetrics();
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        hasNetworkErrors: true,
        lastError: error instanceof Error ? error.message : 'Sync failed',
      }));
      throw error;
    } finally {
      setState(prev => ({
        ...prev,
        isSyncing: false,
      }));
    }
  }, []);

  const setDataSavingMode = useCallback((enabled: boolean): void => {
    // This would need to be implemented in the offline manager
    setState(prev => ({
      ...prev,
      dataSavingMode: enabled,
    }));
  }, []);

  const actions: OfflineExperienceActions = {
    queueOperation,
    retryFailedOperations,
    clearQueue,
    clearCache,
    clearCacheByTags,
    clearErrors,
    reportError,
    triggerSync,
    setDataSavingMode,
  };

  return [state, actions];
};

/**
 * Hook for simple offline status with enhanced features
 */
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(offlineManager.getNetworkStatus().isOnline);
  const [networkQuality, setNetworkQuality] = useState(offlineManager.getNetworkQuality());
  const [connectionStable, setConnectionStable] = useState(true);
  const [lastConnectionChange, setLastConnectionChange] = useState<number>(0);

  useEffect(() => {
    let stabilityTimer: NodeJS.Timeout;

    const handleOfflineChange = (offline: boolean) => {
      setIsOnline(!offline);
      setLastConnectionChange(Date.now());
      
      // Mark connection as unstable temporarily
      setConnectionStable(false);
      
      // Clear existing timer
      if (stabilityTimer) {
        clearTimeout(stabilityTimer);
      }
      
      // Mark as stable after 30 seconds of no changes
      stabilityTimer = setTimeout(() => {
        setConnectionStable(true);
      }, 30000);
    };

    const handleNetworkChange = () => {
      const newQuality = offlineManager.getNetworkQuality();
      setNetworkQuality(newQuality);
      setLastConnectionChange(Date.now());
    };

    offlineManager.addOfflineListener(handleOfflineChange);
    offlineManager.addNetworkListener(handleNetworkChange);

    return () => {
      offlineManager.removeOfflineListener(handleOfflineChange);
      offlineManager.removeNetworkListener(handleNetworkChange);
      if (stabilityTimer) {
        clearTimeout(stabilityTimer);
      }
    };
  }, []);

  return {
    isOnline,
    networkQuality,
    isOffline: !isOnline,
    shouldSaveData: offlineManager.shouldSaveData(),
    connectionStable,
    lastConnectionChange,
    isSlowConnection: networkQuality === 'poor' || networkQuality === 'fair',
    isFastConnection: networkQuality === 'excellent' || networkQuality === 'good',
  };
};

/**
 * Hook for enhanced queue status with performance insights
 */
export const useQueueStatus = () => {
  const [metrics, setMetrics] = useState<QueueMetrics | null>(null);
  const [queueHealth, setQueueHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');

  useEffect(() => {
    const handleMetrics = (newMetrics: QueueMetrics) => {
      setMetrics(newMetrics);
      
      // Calculate queue health
      let health: 'healthy' | 'warning' | 'critical' = 'healthy';
      
      if (newMetrics.failedOperations > 10 || newMetrics.successRate < 0.7) {
        health = 'critical';
      } else if (newMetrics.pendingOperations > 50 || newMetrics.successRate < 0.9) {
        health = 'warning';
      }
      
      setQueueHealth(health);
    };

    intelligentOfflineQueue.addMetricsListener(handleMetrics);
    intelligentOfflineQueue.getMetrics().then(handleMetrics);

    return () => {
      intelligentOfflineQueue.removeMetricsListener(handleMetrics);
    };
  }, []);

  return {
    metrics,
    queueHealth,
    hasPendingOperations: metrics ? metrics.pendingOperations > 0 : false,
    isSyncing: metrics ? metrics.processingOperations > 0 : false,
    successRate: metrics ? metrics.successRate : 1,
    isHealthy: queueHealth === 'healthy',
    needsAttention: queueHealth === 'warning' || queueHealth === 'critical',
    averageProcessingTime: metrics ? metrics.averageProcessingTime : 0,
  };
};

/**
 * Hook for cache management with optimization insights
 */
export const useCacheManagement = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [cacheHealth, setCacheHealth] = useState<'optimal' | 'warning' | 'critical'>('optimal');

  useEffect(() => {
    const updateCacheStats = async () => {
      try {
        const stats = await cacheManager.getStats();
        setCacheStats(stats);
        
        // Calculate cache health
        let health: 'optimal' | 'warning' | 'critical' = 'optimal';
        
        // Check hit rate
        if (stats.hitRate < 0.5) {
          health = 'critical';
        } else if (stats.hitRate < 0.7) {
          health = 'warning';
        }
        
        // Check age of items
        const oldestAge = Date.now() - stats.oldestItem;
        const daysSinceOldest = oldestAge / (1000 * 60 * 60 * 24);
        
        if (daysSinceOldest > 60) { // Items older than 60 days
          health = health === 'optimal' ? 'warning' : health;
        }
        
        setCacheHealth(health);
      } catch (error) {
        console.error('Failed to get cache stats:', error);
      }
    };

    updateCacheStats();
    const interval = setInterval(updateCacheStats, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  const optimizeCache = useCallback(async () => {
    try {
      // Clear old cache entries
      await cacheManager.clearByTags(['old', 'expired']);
      
      // Trigger cleanup
      const stats = await cacheManager.getStats();
      setCacheStats(stats);
      
      return true;
    } catch (error) {
      console.error('Cache optimization failed:', error);
      return false;
    }
  }, []);

  return {
    cacheStats,
    cacheHealth,
    isOptimal: cacheHealth === 'optimal',
    needsOptimization: cacheHealth === 'warning' || cacheHealth === 'critical',
    optimizeCache,
  };
};

export default useOfflineExperience;