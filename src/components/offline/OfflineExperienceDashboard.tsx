/**
 * Offline Experience Dashboard
 * Comprehensive view of offline capabilities and status
 */

import React, { useState } from 'react';
import { useOfflineExperience, useOfflineStatus, useQueueStatus, useCacheManagement } from '@/hooks/useOfflineExperience';
import { OfflineStatusIndicator } from './OfflineStatusIndicator';
import { NetworkErrorBanner } from './NetworkErrorBanner';
import { OfflineSettings } from './OfflineSettings';

interface OfflineExperienceDashboardProps {
  className?: string;
  showSettings?: boolean;
}

export const OfflineExperienceDashboard: React.FC<OfflineExperienceDashboardProps> = ({
  className = '',
  showSettings = false
}) => {
  const [state, actions] = useOfflineExperience();
  const offlineStatus = useOfflineStatus();
  const queueStatus = useQueueStatus();
  const cacheManagement = useCacheManagement();
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'cache' | 'settings'>('overview');
  const [showSettingsModal, setShowSettingsModal] = useState(showSettings);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'good': return 'text-green-500 bg-green-50 dark:bg-green-900/10';
      case 'fair': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'poor': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'offline': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
      case 'optimal': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Network Error Banner */}
      <NetworkErrorBanner />

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${state.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Offline Experience
            </h2>
          </div>
          
          {!state.isOnline && state.offlineDuration > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Offline for {formatDuration(state.offlineDuration)}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {state.isSyncing && (
            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">Syncing...</span>
            </div>
          )}
          
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'queue', label: 'Sync Queue', icon: '🔄' },
          { id: 'cache', label: 'Cache', icon: '💾' },
          { id: 'settings', label: 'Settings', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Network Status */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Network Status
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      state.isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {state.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Quality</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(state.networkQuality)}`}>
                      {state.networkQuality}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Connection</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {state.networkStatus.connectionType}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Data Saving</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      state.dataSavingMode ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {state.dataSavingMode ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Quick Stats
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Pending Operations
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {state.queueMetrics?.pendingOperations || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Success Rate
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {Math.round((state.queueMetrics?.successRate || 1) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        Cache Size
                      </p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {state.cacheStats ? formatBytes(state.cacheStats.totalSize) : '0 B'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Offline Capabilities */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Offline Capabilities
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Workout Tracking', available: true, description: 'Create and complete workouts offline' },
                  { name: 'Exercise Database', available: true, description: 'Browse exercises and instructions' },
                  { name: 'Progress Charts', available: true, description: 'View your fitness progress' },
                  { name: 'Social Features', available: state.isOnline, description: 'Connect with gym friends' },
                  { name: 'Cloud Sync', available: state.isOnline, description: 'Backup data to the cloud' },
                  { name: 'Real-time Updates', available: state.isOnline, description: 'Live notifications and updates' }
                ].map((capability, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${capability.available ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {capability.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {capability.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Sync Queue Status
              </h3>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(queueStatus.queueHealth)}`}>
                  {queueStatus.queueHealth}
                </span>
                
                <button
                  onClick={() => actions.retryFailedOperations()}
                  disabled={!state.isOnline || state.isSyncing}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Retry Failed
                </button>
              </div>
            </div>

            {queueStatus.metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {queueStatus.metrics.pendingOperations}
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-100">Pending</p>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {queueStatus.metrics.processingOperations}
                  </p>
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">Processing</p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {queueStatus.metrics.completedOperations}
                  </p>
                  <p className="text-sm text-green-900 dark:text-green-100">Completed</p>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {queueStatus.metrics.failedOperations}
                  </p>
                  <p className="text-sm text-red-900 dark:text-red-100">Failed</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Performance Metrics</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2 dark:bg-gray-600">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(queueStatus.successRate || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{Math.round((queueStatus.successRate || 0) * 100)}%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg Processing Time</span>
                  <span className="text-sm font-medium">{queueStatus.averageProcessingTime}ms</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cache' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Cache Management
              </h3>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(cacheManagement.cacheHealth)}`}>
                  {cacheManagement.cacheHealth}
                </span>
                
                <button
                  onClick={() => cacheManagement.optimizeCache()}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Optimize
                </button>
                
                <button
                  onClick={() => actions.clearCache()}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Clear All
                </button>
              </div>
            </div>

            {cacheManagement.cacheStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatBytes(cacheManagement.cacheStats.totalSize)}
                  </p>
                  <p className="text-sm text-purple-900 dark:text-purple-100">Total Size</p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {cacheManagement.cacheStats.itemCount}
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-100">Items</p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(cacheManagement.cacheStats.hitRate * 100)}%
                  </p>
                  <p className="text-sm text-green-900 dark:text-green-100">Hit Rate</p>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round((1 - cacheManagement.cacheStats.compressionRatio) * 100)}%
                  </p>
                  <p className="text-sm text-orange-900 dark:text-orange-100">Compression</p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Cache Actions</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => actions.clearCacheByTags(['workout'])}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Clear Workout Cache
                </button>
                
                <button
                  onClick={() => actions.clearCacheByTags(['social'])}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Clear Social Cache
                </button>
                
                <button
                  onClick={() => actions.clearCacheByTags(['old', 'expired'])}
                  className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Clear Old Items
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <OfflineSettings />
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <OfflineSettings onClose={() => setShowSettingsModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineExperienceDashboard; 