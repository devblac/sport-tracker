import React, { useState, useEffect } from 'react';
import { Activity, Database, Zap, TrendingUp, Clock, HardDrive } from 'lucide-react';
import { CacheManager } from '@/services/CacheManager';
import { QueryOptimizer } from '@/services/QueryService';
import { PrefetchManager } from '@/services/PrefetchManager';

interface CacheMonitorProps {
  className?: string;
  refreshInterval?: number;
}

export const CacheMonitor: React.FC<CacheMonitorProps> = ({
  className = '',
  refreshInterval = 5000
}) => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [queryStats, setQueryStats] = useState<any>(null);
  const [prefetchStats, setPrefetchStats] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const cacheManager = CacheManager.getInstance();
      const queryOptimizer = QueryOptimizer.getInstance();
      const prefetchManager = PrefetchManager.getInstance();

      setCacheStats(cacheManager.getStats());
      setQueryStats(queryOptimizer.getStats());
      setPrefetchStats(prefetchManager.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-500 text-white p-2 rounded-full shadow-lg hover:bg-purple-600 transition-colors z-50"
        title="Show Cache Monitor"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };

  return (
    <div className={`fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm z-50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Cache Monitor
          </h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ×
        </button>
      </div>

      {/* Cache Stats */}
      {cacheStats && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cache Performance
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
              <div className="text-green-600 dark:text-green-400 font-medium">
                Hit Rate
              </div>
              <div className="text-green-800 dark:text-green-200 font-bold">
                {formatPercentage(cacheStats.hitRate)}
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <div className="text-blue-600 dark:text-blue-400 font-medium">
                Cache Size
              </div>
              <div className="text-blue-800 dark:text-blue-200 font-bold">
                {cacheStats.cacheSize}
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
              <div className="text-purple-600 dark:text-purple-400 font-medium">
                Memory
              </div>
              <div className="text-purple-800 dark:text-purple-200 font-bold">
                {formatBytes(cacheStats.memoryUsage)}
              </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
              <div className="text-orange-600 dark:text-orange-400 font-medium">
                Requests
              </div>
              <div className="text-orange-800 dark:text-orange-200 font-bold">
                {cacheStats.totalRequests}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Query Stats */}
      {queryStats && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Query Optimizer
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                Active Queries
              </div>
              <div className="text-gray-800 dark:text-gray-200 font-bold">
                {queryStats.activeQueries}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                Batch Queue
              </div>
              <div className="text-gray-800 dark:text-gray-200 font-bold">
                {queryStats.batchQueueSize}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prefetch Stats */}
      {prefetchStats && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Prefetch Manager
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
              <div className="text-yellow-600 dark:text-yellow-400 font-medium">
                Success Rate
              </div>
              <div className="text-yellow-800 dark:text-yellow-200 font-bold">
                {formatPercentage(prefetchStats.hitRate)}
              </div>
            </div>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded">
              <div className="text-indigo-600 dark:text-indigo-400 font-medium">
                Patterns
              </div>
              <div className="text-indigo-800 dark:text-indigo-200 font-bold">
                {prefetchStats.activePatterns}/{prefetchStats.patterns}
              </div>
            </div>
            
            <div className="bg-pink-50 dark:bg-pink-900/20 p-2 rounded">
              <div className="text-pink-600 dark:text-pink-400 font-medium">
                Total
              </div>
              <div className="text-pink-800 dark:text-pink-200 font-bold">
                {prefetchStats.totalPrefetches}
              </div>
            </div>
            
            <div className="bg-teal-50 dark:bg-teal-900/20 p-2 rounded">
              <div className="text-teal-600 dark:text-teal-400 font-medium">
                Success
              </div>
              <div className="text-teal-800 dark:text-teal-200 font-bold">
                {prefetchStats.successfulPrefetches}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Indicator */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Updated every {refreshInterval / 1000}s</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${
            cacheStats?.hitRate > 0.8 
              ? 'bg-green-500' 
              : cacheStats?.hitRate > 0.6 
              ? 'bg-yellow-500' 
              : 'bg-red-500'
          }`} />
          <span>
            {cacheStats?.hitRate > 0.8 
              ? 'Excellent' 
              : cacheStats?.hitRate > 0.6 
              ? 'Good' 
              : 'Poor'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              CacheManager.getInstance().clear();
            }}
            className="flex-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
          >
            Clear Cache
          </button>
          <button
            onClick={() => {
              CacheManager.getInstance().optimize();
            }}
            className="flex-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
          >
            Optimize
          </button>
        </div>
      </div>
    </div>
  );
};