/**
 * Monitoring Dashboard for administrators
 * Shows error tracking, performance metrics, and system health
 */

import React, { useState, useEffect } from 'react';
import { errorTracker } from '../../utils/monitoring/errorTracking';
import { performanceMonitor } from '../../utils/monitoring/performanceMonitoring';
import { performanceAnalytics } from '../../utils/analytics/performanceAnalytics';

interface MonitoringDashboardProps {
  className?: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  errorRate: number;
  performanceScore: number;
  lastUpdated: Date;
}

export function MonitoringDashboard({ className = '' }: MonitoringDashboardProps) {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    uptime: 0,
    errorRate: 0,
    performanceScore: 100,
    lastUpdated: new Date()
  });
  
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMonitoringData = async () => {
    try {
      setIsLoading(true);
      
      // Load system health
      const health = await getSystemHealth();
      setSystemHealth(health);
      
      // Load recent errors
      const errors = await getRecentErrors();
      setRecentErrors(errors);
      
      // Load performance metrics
      const metrics = performanceMonitor.getMetrics();
      setPerformanceMetrics(metrics.slice(-20)); // Last 20 metrics
      
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSystemHealth = async (): Promise<SystemHealth> => {
    // This would typically fetch from a monitoring API
    // For now, we'll simulate the data
    const errors = await getRecentErrors();
    const errorRate = errors.length / 100; // Simplified calculation
    
    let status: SystemHealth['status'] = 'healthy';
    if (errorRate > 0.1) status = 'critical';
    else if (errorRate > 0.05) status = 'warning';
    
    return {
      status,
      uptime: Date.now() - (performance.timeOrigin || 0),
      errorRate: errorRate * 100,
      performanceScore: Math.max(0, 100 - (errorRate * 1000)),
      lastUpdated: new Date()
    };
  };

  const getRecentErrors = async (): Promise<any[]> => {
    // In a real implementation, this would fetch from IndexedDB or API
    return new Promise((resolve) => {
      const dbName = 'sport-tracker-errors';
      const storeName = 'errors';
      
      const request = indexedDB.open(dbName, 1);
      
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          resolve([]);
          return;
        }
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const errors = getAllRequest.result || [];
          // Sort by timestamp, most recent first
          errors.sort((a, b) => new Date(b.context.timestamp).getTime() - new Date(a.context.timestamp).getTime());
          resolve(errors.slice(0, 10)); // Last 10 errors
        };
        
        getAllRequest.onerror = () => resolve([]);
      };
      
      request.onerror = () => resolve([]);
    });
  };

  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (import.meta.env.VITE_ENVIRONMENT === 'production') {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Monitoring dashboard is not available in production environment.
        </p>
      </div>
    );
  }

  return (
    <div className={`monitoring-dashboard ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">System Monitoring</h2>
        <p className="text-gray-600">
          Real-time monitoring of application health, errors, and performance.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading monitoring data...</span>
        </div>
      )}

      {!isLoading && (
        <>
          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Status</p>
                  <div className="flex items-center mt-1">
                    <span className="text-2xl mr-2">{getStatusIcon(systemHealth.status)}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(systemHealth.status)}`}>
                      {systemHealth.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatUptime(systemHealth.uptime)}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div>
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {systemHealth.errorRate.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance Score</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {systemHealth.performanceScore.toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Errors */}
          <div className="bg-white rounded-lg border shadow-sm mb-8">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Recent Errors</h3>
            </div>
            <div className="p-6">
              {recentErrors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent errors found.</p>
              ) : (
                <div className="space-y-4">
                  {recentErrors.map((error, index) => (
                    <div key={index} className="border-l-4 border-red-400 bg-red-50 p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-red-800">
                            {error.message}
                          </h4>
                          <p className="text-xs text-red-600 mt-1">
                            {error.context.url} • {formatTimestamp(error.context.timestamp)}
                          </p>
                          {error.context.userId && (
                            <p className="text-xs text-red-600">
                              User: {error.context.userId}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          error.level === 'error' ? 'bg-red-100 text-red-800' :
                          error.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {error.level}
                        </span>
                      </div>
                      {error.stack && (
                        <details className="mt-2">
                          <summary className="text-xs text-red-600 cursor-pointer">
                            Show stack trace
                          </summary>
                          <pre className="text-xs text-red-600 mt-1 overflow-x-auto">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
            </div>
            <div className="p-6">
              {performanceMetrics.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No performance metrics available.</p>
              ) : (
                <div className="space-y-2">
                  {performanceMetrics.map((metric, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{metric.name}</span>
                        {metric.tags?.type && (
                          <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {metric.tags.type}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono text-gray-900">
                          {metric.value.toFixed(2)}ms
                        </span>
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(metric.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={loadMonitoringData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh Data
            </button>
            
            <button
              onClick={() => {
                performanceMonitor.clearMetrics();
                loadMonitoringData();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear Metrics
            </button>
          </div>

          {/* Last Updated */}
          <div className="mt-4 text-xs text-gray-500">
            Last updated: {formatTimestamp(systemHealth.lastUpdated)}
          </div>
        </>
      )}
    </div>
  );
}