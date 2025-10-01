/**
 * Service Health Dashboard
 * 
 * Debug component that provides real-time monitoring of service health,
 * performance metrics, error rates, and system status.
 */

import React, { useState, useEffect } from 'react';
import { serviceMonitor } from '@/services/ServiceMonitor';
import { errorHandlingService } from '@/services/ErrorHandlingService';
import { resourceUsageMonitor } from '@/services/ResourceUsageMonitor';
import { serviceRegistry } from '@/services/ServiceRegistry';
import { EventBus } from '@/utils/EventBus';
import type { ServiceStatus, HealthCheckResult } from '@/types/serviceConfig';

interface ServiceHealthDashboardProps {
  className?: string;
  compact?: boolean;
}

export const ServiceHealthDashboard: React.FC<ServiceHealthDashboardProps> = ({
  className = '',
  compact = false
}) => {
  const [serviceStatuses, setServiceStatuses] = useState<Map<string, ServiceStatus>>(new Map());
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [errorMetrics, setErrorMetrics] = useState(errorHandlingService.getErrorMetrics());
  const [resourceUsage, setResourceUsage] = useState(resourceUsageMonitor.getCurrentUsage());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineMode, setIsOfflineMode] = useState(errorHandlingService.isOfflineModeActive());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Initial data load
    updateDashboard();

    // Set up event listeners
    const handleServiceStatusChange = () => {
      setServiceStatuses(new Map(serviceMonitor.getAllServiceStatuses()));
      setLastUpdate(new Date());
    };

    const handleHealthCheckComplete = ({ results }: { results: HealthCheckResult }) => {
      setHealthCheck(results);
      setLastUpdate(new Date());
    };

    const handleNetworkChange = (online: boolean) => {
      setIsOnline(online);
      setLastUpdate(new Date());
    };

    const handleOfflineModeChange = () => {
      setIsOfflineMode(errorHandlingService.isOfflineModeActive());
      setLastUpdate(new Date());
    };

    // Subscribe to events
    serviceMonitor.on('service-status-changed', handleServiceStatusChange);
    serviceMonitor.on('health-check-completed', handleHealthCheckComplete);
    EventBus.on('network-status-change', handleNetworkChange);
    EventBus.on('offline-mode-activated', handleOfflineModeChange);
    EventBus.on('offline-mode-deactivated', handleOfflineModeChange);

    // Update metrics periodically
    const interval = setInterval(() => {
      setErrorMetrics(errorHandlingService.getErrorMetrics());
      setResourceUsage(resourceUsageMonitor.getCurrentUsage());
      setLastUpdate(new Date());
    }, 5000);

    return () => {
      // Cleanup
      serviceMonitor.off('service-status-changed', handleServiceStatusChange);
      serviceMonitor.off('health-check-completed', handleHealthCheckComplete);
      EventBus.off('network-status-change', handleNetworkChange);
      EventBus.off('offline-mode-activated', handleOfflineModeChange);
      EventBus.off('offline-mode-deactivated', handleOfflineModeChange);
      clearInterval(interval);
    };
  }, []);

  const updateDashboard = async () => {
    setServiceStatuses(new Map(serviceMonitor.getAllServiceStatuses()));
    setErrorMetrics(errorHandlingService.getErrorMetrics());
    setResourceUsage(resourceUsageMonitor.getCurrentUsage());
    
    try {
      const health = await serviceMonitor.performHealthCheck();
      setHealthCheck(health);
    } catch (error) {
      console.error('Failed to perform health check:', error);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'fallback': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'connected': return '✅';
      case 'fallback': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const formatResponseTime = (time: number): string => {
    if (time < 1000) return `${time.toFixed(0)}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (compact) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">System Status</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Array.from(serviceStatuses.entries()).map(([name, status]) => (
            <div key={name} className="flex items-center justify-between">
              <span className="text-gray-600 capitalize">{name}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status.status)}`}>
                {getStatusIcon(status.status)} {status.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Service Health Dashboard</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {isOfflineMode && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Offline Mode
              </span>
            )}
            <button
              onClick={updateDashboard}
              className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Service Status Grid */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">Service Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(serviceStatuses.entries()).map(([name, status]) => (
              <div key={name} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 capitalize">{name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status.status)}`}>
                    {getStatusIcon(status.status)} {status.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span>{formatResponseTime(status.performance.averageResponseTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span>{formatPercentage(status.performance.successRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Hit Rate:</span>
                    <span>{formatPercentage(status.performance.cacheHitRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Errors:</span>
                    <span className={status.errorCount > 0 ? 'text-red-600' : ''}>
                      {status.errorCount}
                    </span>
                  </div>
                  {status.circuitBreakerOpen && (
                    <div className="text-red-600 font-medium">
                      Circuit Breaker Open
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Check Results */}
        {healthCheck && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Health Check Results</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl mb-1 ${healthCheck.overall ? 'text-green-600' : 'text-red-600'}`}>
                    {healthCheck.overall ? '✅' : '❌'}
                  </div>
                  <div className="text-xs text-gray-600">Overall</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl mb-1 ${healthCheck.supabase ? 'text-green-600' : 'text-red-600'}`}>
                    {healthCheck.supabase ? '✅' : '❌'}
                  </div>
                  <div className="text-xs text-gray-600">Database</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl mb-1 ${healthCheck.auth ? 'text-green-600' : 'text-red-600'}`}>
                    {healthCheck.auth ? '✅' : '❌'}
                  </div>
                  <div className="text-xs text-gray-600">Auth</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl mb-1 ${healthCheck.social ? 'text-green-600' : 'text-red-600'}`}>
                    {healthCheck.social ? '✅' : '❌'}
                  </div>
                  <div className="text-xs text-gray-600">Social</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 text-center">
                Last check: {healthCheck.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Error Metrics */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">Error Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{errorMetrics.totalErrors}</div>
              <div className="text-sm text-gray-600">Total Errors</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {formatPercentage(errorMetrics.recoverySuccessRate)}
              </div>
              <div className="text-sm text-gray-600">Recovery Rate</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{errorMetrics.fallbackActivations}</div>
              <div className="text-sm text-gray-600">Fallback Uses</div>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">Resource Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">API Calls</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>{resourceUsage.apiCalls.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Successful:</span>
                  <span className="text-green-600">{resourceUsage.apiCalls.successful}</span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="text-red-600">{resourceUsage.apiCalls.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cached:</span>
                  <span className="text-blue-600">{resourceUsage.apiCalls.cached}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Real-time</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Active Subscriptions:</span>
                  <span>{resourceUsage.realtime.activeSubscriptions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages Received:</span>
                  <span>{resourceUsage.realtime.messagesReceived}</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages Sent:</span>
                  <span>{resourceUsage.realtime.messagesSent}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Implementations */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">Current Implementations</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {Object.entries(serviceRegistry.getServiceImplementations()).map(([service, impl]) => (
                <div key={service} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{service}:</span>
                  <span className={`font-medium ${impl.includes('mock') ? 'text-yellow-600' : 'text-green-600'}`}>
                    {impl}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => serviceRegistry.enableRealServices()}
              className="px-3 py-2 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 transition-colors"
            >
              Enable Real Services
            </button>
            <button
              onClick={() => serviceRegistry.enableMockServices()}
              className="px-3 py-2 bg-yellow-100 text-yellow-700 text-sm rounded hover:bg-yellow-200 transition-colors"
            >
              Enable Mock Services
            </button>
            <button
              onClick={() => errorHandlingService.forceOfflineMode()}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
            >
              Force Offline Mode
            </button>
            <button
              onClick={() => errorHandlingService.forceOnlineMode()}
              className="px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
            >
              Force Online Mode
            </button>
            <button
              onClick={() => errorHandlingService.clearErrorHistory()}
              className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
            >
              Clear Error History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceHealthDashboard;