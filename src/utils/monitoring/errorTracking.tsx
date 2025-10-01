/**
 * Error tracking and monitoring utilities
 * Provides centralized error handling and reporting
 */

import React from 'react';

export interface ErrorContext {
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: Date;
  buildVersion?: string;
  environment?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  level: 'error' | 'warning' | 'info';
  context: ErrorContext;
  fingerprint?: string;
}

class ErrorTracker {
  private isInitialized = false;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 100;
  private flushInterval = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  initialize(config: {
    dsn?: string;
    environment?: string;
    release?: string;
    userId?: string;
  }) {
    this.isInitialized = true;
    
    // Initialize external error tracking service (e.g., Sentry)
    if (config.dsn && typeof window !== 'undefined') {
      this.initializeExternalService(config);
    }

    // Start periodic flush
    this.startPeriodicFlush();
    
    console.log('Error tracking initialized', {
      environment: config.environment,
      release: config.release
    });
  }

  private initializeExternalService(config: any) {
    // This would integrate with services like Sentry, LogRocket, etc.
    // For now, we'll use a mock implementation
    console.log('External error tracking service initialized', config);
  }

  private setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(new Error(event.message), {
        url: event.filename,
        additionalData: {
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          additionalData: {
            reason: event.reason,
            type: 'unhandledrejection'
          }
        }
      );
    });

    // Handle React error boundaries
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('React')) {
        this.captureError(new Error(args.join(' ')), {
          additionalData: {
            type: 'react-error',
            args
          }
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  captureError(error: Error, context: Partial<ErrorContext> = {}) {
    const errorReport: ErrorReport = {
      message: error.message,
      stack: error.stack,
      level: 'error',
      context: {
        userId: this.getCurrentUserId(),
        userAgent: navigator?.userAgent,
        url: window?.location?.href,
        timestamp: new Date(),
        buildVersion: import.meta.env.VITE_APP_VERSION,
        environment: import.meta.env.VITE_ENVIRONMENT || 'development',
        ...context
      },
      fingerprint: this.generateFingerprint(error)
    };

    this.addToQueue(errorReport);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error captured:', errorReport);
    }
  }

  captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info', context: Partial<ErrorContext> = {}) {
    const errorReport: ErrorReport = {
      message,
      level,
      context: {
        userId: this.getCurrentUserId(),
        userAgent: navigator?.userAgent,
        url: window?.location?.href,
        timestamp: new Date(),
        buildVersion: import.meta.env.VITE_APP_VERSION,
        environment: import.meta.env.VITE_ENVIRONMENT || 'development',
        ...context
      }
    };

    this.addToQueue(errorReport);
  }

  private addToQueue(errorReport: ErrorReport) {
    this.errorQueue.push(errorReport);
    
    // Prevent queue from growing too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Flush immediately for critical errors
    if (errorReport.level === 'error') {
      this.flush();
    }
  }

  private generateFingerprint(error: Error): string {
    // Create a unique fingerprint for error grouping
    const key = `${error.name}-${error.message}-${error.stack?.split('\n')[1] || ''}`;
    return btoa(key).slice(0, 16);
  }

  private getCurrentUserId(): string | undefined {
    // Get user ID from auth store or local storage
    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.user?.id;
      }
    } catch (e) {
      // Ignore errors when getting user ID
    }
    return undefined;
  }

  private startPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private async flush() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await this.sendErrors(errors);
    } catch (e) {
      // If sending fails, put errors back in queue
      this.errorQueue.unshift(...errors);
      console.warn('Failed to send error reports:', e);
    }
  }

  private async sendErrors(errors: ErrorReport[]) {
    if (!this.isInitialized) return;

    // In a real implementation, this would send to your error tracking service
    // For now, we'll store in IndexedDB as backup
    try {
      await this.storeErrorsLocally(errors);
      
      // Also send to external service if configured
      if (import.meta.env.VITE_ERROR_TRACKING_DSN) {
        await this.sendToExternalService(errors);
      }
    } catch (e) {
      console.warn('Failed to store errors:', e);
    }
  }

  private async storeErrorsLocally(errors: ErrorReport[]) {
    // Store errors in IndexedDB for offline support
    const dbName = 'sport-tracker-errors';
    const storeName = 'errors';
    
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        errors.forEach(error => {
          store.add({
            ...error,
            id: Date.now() + Math.random(),
            sent: false
          });
        });
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'context.timestamp');
          store.createIndex('level', 'level');
        }
      };
    });
  }

  private async sendToExternalService(errors: ErrorReport[]) {
    // Send to external error tracking service
    const response = await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ errors })
    });

    if (!response.ok) {
      throw new Error(`Failed to send errors: ${response.statusText}`);
    }
  }

  // Performance monitoring
  capturePerformanceMetric(name: string, value: number, tags: Record<string, string> = {}) {
    this.captureMessage(`Performance: ${name}`, 'info', {
      additionalData: {
        type: 'performance',
        metric: name,
        value,
        tags
      }
    });
  }

  // User interaction tracking
  captureUserAction(action: string, data: Record<string, any> = {}) {
    this.captureMessage(`User Action: ${action}`, 'info', {
      additionalData: {
        type: 'user-action',
        action,
        data
      }
    });
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// React Error Boundary HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return function ErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallbackComponent}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; resetError: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorTracker.captureError(error, {
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="error-boundary p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">An error occurred while rendering this component.</p>
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };