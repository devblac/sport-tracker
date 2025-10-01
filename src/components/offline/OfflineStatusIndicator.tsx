/**
 * Offline Status Indicator
 * Shows current network status and offline capabilities
 */

import React, { useState, useEffect } from 'react';
import { offlineManager, type NetworkStatus } from '@/utils/offlineUtils';
import { intelligentOfflineQueue, type QueueMetrics } from '@/utils/intelligentOfflineQueue';

interface OfflineStatusIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  position = 'top-right',
  className = ''
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(offlineManager.getNetworkStatus());
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [offlineDuration, setOfflineDuration] = useState(0);

  useEffect(() => {
    // Listen for network changes
    const handleNetworkChange = (status: NetworkStatus) => {
      setNetworkStatus(status);
    };

    const handleOfflineChange = (isOffline: boolean) => {
      if (!isOffline) {
        setOfflineDuration(0);
      }
    };

    const handleQueueMetrics = (metrics: QueueMetrics) => {
      setQueueMetrics(metrics);
    };

    // Add listeners
    offlineManager.addNetworkListener(handleNetworkChange);
    offlineManager.addOfflineListener(handleOfflineChange);
    intelligentOfflineQueue.addMetricsListener(handleQueueMetrics);

    // Update offline duration periodically
    const durationInterval = setInterval(() => {
      if (!networkStatus.isOnline) {
        setOfflineDuration(offlineManager.getOfflineDuration());
      }
    }, 1000);

    // Initial metrics load
    intelligentOfflineQueue.getMetrics().then(setQueueMetrics);

    return () => {
      offlineManager.removeNetworkListener(handleNetworkChange);
      offlineManager.removeOfflineListener(handleOfflineChange);
      intelligentOfflineQueue.removeMetricsListener(handleQueueMetrics);
      clearInterval(durationInterval);
    };
  }, [networkStatus.isOnline]);



  const getStatusIcon = () => {
    if (!networkStatus.isOnline) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
        </svg>
      );
    }

    const quality = offlineManager.getNetworkQuality();
    switch (quality) {
      case 'excellent':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'good':
        return (
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7z" />
          </svg>
        );
      case 'fair':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5z" />
          </svg>
        );
      case 'poor':
        return (
          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 000 2h1v9a2 2 0 002 2h8a2 2 0 002-2V6h1a1 1 0 100-2H3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    if (!networkStatus.isOnline) {
      return offlineDuration > 0 ? `Offline ${formatDuration(offlineDuration)}` : 'Offline';
    }
    
    const quality = offlineManager.getNetworkQuality();
    return `Online (${quality})`;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div 
      className={`fixed z-50 ${positionClasses[position]} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Main Status Indicator */}
      <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-xl">
        {/* Status Icon */}
        <div className="flex items-center justify-center">
          {getStatusIcon()}
        </div>
        
        {/* Status Text */}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getStatusText()}
        </span>

        {/* Queue Indicator */}
        {queueMetrics && queueMetrics.pendingOperations > 0 && (
          <div className="flex items-center space-x-1 bg-blue-50 dark:bg-blue-900/20 rounded-full px-2 py-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {queueMetrics.pendingOperations}
            </span>
          </div>
        )}

        {/* Sync Status */}
        {queueMetrics && queueMetrics.processingOperations > 0 && (
          <div className="flex items-center">
            <svg className="w-3 h-3 text-green-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        )}
      </div>

      {/* Detailed Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-60">
          <div className="space-y-3">
            {/* Network Details */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Network Status
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <span className="ml-1 font-medium">
                    {networkStatus.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Quality:</span>
                  <span className="ml-1 font-medium">
                    {offlineManager.getNetworkQuality()}
                  </span>
                </div>
                {networkStatus.isOnline && (
                  <>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Type:</span>
                      <span className="ml-1 font-medium">
                        {networkStatus.connectionType}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Speed:</span>
                      <span className="ml-1 font-medium">
                        {networkStatus.effectiveType}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Queue Status */}
            {queueMetrics && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Sync Queue
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Pending:</span>
                    <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">
                      {queueMetrics.pendingOperations}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Processing:</span>
                    <span className="ml-1 font-medium text-yellow-600 dark:text-yellow-400">
                      {queueMetrics.processingOperations}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Success Rate:</span>
                    <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                      {Math.round(queueMetrics.successRate * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Avg Time:</span>
                    <span className="ml-1 font-medium">
                      {Math.round(queueMetrics.averageProcessingTime)}ms
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Offline Duration */}
            {!networkStatus.isOnline && offlineDuration > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Offline Duration
                </h4>
                <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {formatDuration(offlineDuration)}
                </div>
              </div>
            )}

            {/* Data Saving Mode */}
            {offlineManager.shouldSaveData() && (
              <div className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-xs text-yellow-700 dark:text-yellow-300">
                  Data saving mode active
                </span>
              </div>
            )}

            {/* Offline Capabilities */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Offline Features
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Workout tracking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Exercise database</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Progress tracking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${networkStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className={networkStatus.isOnline ? '' : 'text-gray-500'}>
                    Social features
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineStatusIndicator;