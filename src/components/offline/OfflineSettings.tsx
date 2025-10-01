/**
 * Offline Settings Component
 * Allows users to configure offline behavior and cache management
 */

import React, { useState, useEffect } from 'react';
import { cacheManager, type CacheStats } from '@/utils/cacheManager';
import { intelligentOfflineQueue, type QueueMetrics } from '@/utils/intelligentOfflineQueue';
import { offlineManager } from '@/utils/offlineUtils';

interface OfflineSettingsProps {
  onClose?: () => void;
  className?: string;
}

interface OfflineConfig {
  enableOfflineMode: boolean;
  enableDataSaving: boolean;
  maxCacheSize: number; // MB
  cacheExpirationDays: number;
  enableBackgroundSync: boolean;
  syncFrequency: 'immediate' | 'smart' | 'manual';
  enableCompression: boolean;
  preloadContent: boolean;
}

export const OfflineSettings: React.FC<OfflineSettingsProps> = ({
  onClose,
  className = ''
}) => {
  const [config, setConfig] = useState<OfflineConfig>({
    enableOfflineMode: true,
    enableDataSaving: false,
    maxCacheSize: 50, // 50MB
    cacheExpirationDays: 7,
    enableBackgroundSync: true,
    syncFrequency: 'smart',
    enableCompression: true,
    preloadContent: true,
  });

  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load current settings
    loadSettings();
    
    // Load stats
    loadCacheStats();
    loadQueueMetrics();
  }, []);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('offlineSettings');
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        setConfig(prev => ({ ...prev, ...parsedConfig }));
      }
    } catch (error) {
      console.error('Failed to load offline settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('offlineSettings', JSON.stringify(config));
      
      // Apply cache configuration
      cacheManager.updateConfig({
        maxSize: config.maxCacheSize * 1024 * 1024, // Convert MB to bytes
        compressionThreshold: config.enableCompression ? 10 * 1024 : Infinity, // Enable/disable compression
        defaultTTL: config.cacheExpirationDays * 24 * 60 * 60 * 1000, // Convert days to ms
      });

      // Apply queue configuration
      // This would need to be implemented in the queue manager
      
      console.log('Offline settings saved successfully');
    } catch (error) {
      console.error('Failed to save offline settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const loadCacheStats = async () => {
    try {
      const stats = await cacheManager.getStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const loadQueueMetrics = async () => {
    try {
      const metrics = await intelligentOfflineQueue.getMetrics();
      setQueueMetrics(metrics);
    } catch (error) {
      console.error('Failed to load queue metrics:', error);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await cacheManager.clear();
      await loadCacheStats();
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearOldCache = async () => {
    setIsClearing(true);
    try {
      const deletedCount = await cacheManager.clearByTags(['old', 'expired']);
      await loadCacheStats();
      console.log(`Cleared ${deletedCount} old cache entries`);
    } catch (error) {
      console.error('Failed to clear old cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCacheUsagePercentage = (): number => {
    if (!cacheStats) return 0;
    const maxBytes = config.maxCacheSize * 1024 * 1024;
    return (cacheStats.totalSize / maxBytes) * 100;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Offline Settings
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* General Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            General Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Offline Mode
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow the app to work without internet connection
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.enableOfflineMode}
                onChange={(e) => setConfig(prev => ({ ...prev, enableOfflineMode: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data Saving Mode
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reduce data usage on slow connections
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.enableDataSaving}
                onChange={(e) => setConfig(prev => ({ ...prev, enableDataSaving: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preload Content
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Download content for offline use
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.preloadContent}
                onChange={(e) => setConfig(prev => ({ ...prev, preloadContent: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Cache Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Cache Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Cache Size: {config.maxCacheSize} MB
              </label>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={config.maxCacheSize}
                onChange={(e) => setConfig(prev => ({ ...prev, maxCacheSize: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>10 MB</span>
                <span>200 MB</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cache Expiration: {config.cacheExpirationDays} days
              </label>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={config.cacheExpirationDays}
                onChange={(e) => setConfig(prev => ({ ...prev, cacheExpirationDays: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>1 day</span>
                <span>30 days</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Compression
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Compress cached data to save space
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.enableCompression}
                onChange={(e) => setConfig(prev => ({ ...prev, enableCompression: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Sync Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Sync Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Background Sync
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sync data automatically in the background
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.enableBackgroundSync}
                onChange={(e) => setConfig(prev => ({ ...prev, enableBackgroundSync: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sync Frequency
              </label>
              <select
                value={config.syncFrequency}
                onChange={(e) => setConfig(prev => ({ ...prev, syncFrequency: e.target.value as any }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="immediate">Immediate</option>
                <option value="smart">Smart (Recommended)</option>
                <option value="manual">Manual Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cache Statistics */}
        {cacheStats && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Cache Statistics
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Cache Usage</span>
                <span className="text-sm font-medium">
                  {formatBytes(cacheStats.totalSize)} / {config.maxCacheSize} MB
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getCacheUsagePercentage(), 100)}%` }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Items:</span>
                  <span className="ml-2 font-medium">{cacheStats.itemCount}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Hit Rate:</span>
                  <span className="ml-2 font-medium">{Math.round(cacheStats.hitRate * 100)}%</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Compression:</span>
                  <span className="ml-2 font-medium">{Math.round((1 - cacheStats.compressionRatio) * 100)}%</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Oldest Item:</span>
                  <span className="ml-2 font-medium">
                    {cacheStats.oldestItem ? new Date(cacheStats.oldestItem).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Queue Statistics */}
        {queueMetrics && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Sync Queue Status
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                  <span className="ml-2 font-medium text-blue-600">{queueMetrics.pendingOperations}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Processing:</span>
                  <span className="ml-2 font-medium text-yellow-600">{queueMetrics.processingOperations}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                  <span className="ml-2 font-medium text-green-600">{queueMetrics.completedOperations}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Failed:</span>
                  <span className="ml-2 font-medium text-red-600">{queueMetrics.failedOperations}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                  <span className="font-medium">{Math.round(queueMetrics.successRate * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button
            onClick={handleClearOldCache}
            disabled={isClearing}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? 'Clearing...' : 'Clear Old Cache'}
          </button>
          
          <button
            onClick={handleClearCache}
            disabled={isClearing}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? 'Clearing...' : 'Clear All Cache'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineSettings;