/**
 * Network Error Banner
 * Shows network-related errors and retry options
 */

import React, { useState, useEffect } from 'react';
import { offlineManager } from '@/utils/offlineUtils';
import { intelligentOfflineQueue } from '@/utils/intelligentOfflineQueue';

interface NetworkError {
  id: string;
  message: string;
  type: 'network' | 'server' | 'client' | 'unknown';
  timestamp: number;
  retryable: boolean;
  context?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
  autoRetryCount?: number;
}

interface NetworkErrorBannerProps {
  maxErrors?: number;
  autoHideDelay?: number;
  showRetryButton?: boolean;
  className?: string;
}

export const NetworkErrorBanner: React.FC<NetworkErrorBannerProps> = ({
  maxErrors = 3,
  autoHideDelay = 5000,
  showRetryButton = true,
  className = ''
}) => {
  const [errors, setErrors] = useState<NetworkError[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(offlineManager.getNetworkStatus().isOnline);

  useEffect(() => {
    const handleOfflineChange = (offline: boolean) => {
      setIsOnline(!offline);
      
      if (offline) {
        // Add offline error
        const offlineError: NetworkError = {
          id: `offline-${Date.now()}`,
          message: 'You are currently offline. Changes will be synced when connection is restored.',
          type: 'network',
          timestamp: Date.now(),
          retryable: false,
          context: 'offline',
          severity: 'medium',
          suggestion: 'Check your internet connection or switch to a different network.',
          autoRetryCount: 0
        };
        
        setErrors(prev => [offlineError, ...prev.slice(0, maxErrors - 1)]);
      } else {
        // Remove offline errors when back online
        setErrors(prev => prev.filter(error => error.context !== 'offline'));
      }
    };

    // Listen for offline changes
    offlineManager.addOfflineListener(handleOfflineChange);

    return () => {
      offlineManager.removeOfflineListener(handleOfflineChange);
    };
  }, [maxErrors]);

  useEffect(() => {
    // Auto-hide errors after delay
    if (errors.length > 0 && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setErrors(prev => prev.slice(1));
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [errors, autoHideDelay]);

  const addError = (error: NetworkError) => {
    setErrors(prev => {
      // Check if similar error already exists
      const existingError = prev.find(e => 
        e.message === error.message && 
        e.type === error.type &&
        Date.now() - e.timestamp < 10000 // Within 10 seconds
      );
      
      if (existingError) {
        return prev; // Don't add duplicate
      }
      
      return [error, ...prev.slice(0, maxErrors - 1)];
    });
  };

  const removeError = (errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  };

  const handleRetry = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    
    try {
      // Trigger sync to retry failed operations
      await intelligentOfflineQueue.getMetrics(); // This will trigger processing
      
      // Clear retryable errors
      setErrors(prev => prev.filter(error => !error.retryable));
      
    } catch (error) {
      console.error('Retry failed:', error);
      
      // Add retry error
      const retryError: NetworkError = {
        id: `retry-failed-${Date.now()}`,
        message: 'Retry failed. Please check your connection and try again.',
        type: 'network',
        timestamp: Date.now(),
        retryable: true,
        context: 'retry',
        severity: 'high',
        suggestion: 'Try switching to a different network or wait for better connectivity.',
        autoRetryCount: 0
      };
      
      addError(retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorIcon = (type: NetworkError['type']) => {
    switch (type) {
      case 'network':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'server':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        );
      case 'client':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getErrorColor = (error: NetworkError) => {
    // Color based on severity first, then type
    switch (error.severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      default:
        // Fallback to type-based coloring
        switch (error.type) {
          case 'network':
            return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200';
          case 'server':
            return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
          case 'client':
            return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
          default:
            return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200';
        }
    }
  };

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-40 ${className}`}>
      <div className="space-y-1">
        {errors.map((error, index) => (
          <div
            key={error.id}
            className={`mx-4 mt-4 p-4 rounded-lg border ${getErrorColor(error)} animate-slide-down`}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getErrorIcon(error.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {error.message}
                  </p>
                  
                  {error.context && (
                    <p className="text-xs mt-1 opacity-75">
                      Context: {error.context}
                    </p>
                  )}
                  
                  {error.suggestion && (
                    <p className="text-xs mt-2 opacity-90 bg-white dark:bg-gray-800 rounded px-2 py-1">
                      💡 {error.suggestion}
                    </p>
                  )}
                  
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(error.timestamp).toLocaleTimeString()}
                    {error.autoRetryCount && error.autoRetryCount > 0 && (
                      <span className="ml-2">• Auto-retried {error.autoRetryCount} times</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {/* Retry Button */}
                {showRetryButton && error.retryable && isOnline && (
                  <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-white dark:bg-gray-800 border border-current opacity-75 hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    {isRetrying ? (
                      <>
                        <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retrying...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry
                      </>
                    )}
                  </button>
                )}

                {/* Dismiss Button */}
                <button
                  onClick={() => removeError(error.id)}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full opacity-75 hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Hook to use the error banner
export const useNetworkErrorBanner = () => {


  const showError = (error: Omit<NetworkError, 'id' | 'timestamp'>) => {
    // This would be implemented to communicate with the banner component
    // For now, we'll use a simple event system
    const errorEvent = new CustomEvent('networkError', {
      detail: {
        ...error,
        id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(errorEvent);
  };

  const showNetworkError = (message: string, context?: string) => {
    showError({
      message,
      type: 'network',
      retryable: true,
      context,
      severity: 'medium'
    });
  };

  const showServerError = (message: string, context?: string) => {
    showError({
      message,
      type: 'server',
      retryable: true,
      context,
      severity: 'high'
    });
  };

  const showClientError = (message: string, context?: string) => {
    showError({
      message,
      type: 'client',
      retryable: false,
      context,
      severity: 'low'
    });
  };

  return {
    showError,
    showNetworkError,
    showServerError,
    showClientError
  };
};

export default NetworkErrorBanner;