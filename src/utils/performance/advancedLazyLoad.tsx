import React from 'react';
import { routePreloader } from './routePreloader';

/**
 * Advanced Lazy Loading with Performance Optimizations
 */

interface AdvancedLazyLoadOptions {
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  preloadStrategy?: 'immediate' | 'hover' | 'idle' | 'viewport';
  priority?: 'high' | 'medium' | 'low';
  timeout?: number;
  retryAttempts?: number;
  chunkName?: string;
}

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Performance-optimized loading fallback
 */
const OptimizedLoadingFallback: React.FC<{ priority?: string }> = ({ priority }) => (
  <div className="flex items-center justify-center p-4 min-h-[200px]">
    <div className="text-center space-y-3">
      <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto ${
        priority === 'high' ? 'h-8 w-8' : 'h-6 w-6'
      }`}></div>
      <p className="text-sm text-muted-foreground">
        {priority === 'high' ? 'Loading...' : 'Loading component...'}
      </p>
    </div>
  </div>
);

/**
 * Enhanced error fallback with performance metrics
 */
const OptimizedErrorFallback: React.FC<{ 
  error: Error; 
  retry: () => void;
  retryCount: number;
}> = ({ error, retry, retryCount }) => (
  <div className="flex items-center justify-center p-6">
    <div className="text-center space-y-4 max-w-md">
      <div className="text-destructive text-3xl">⚠️</div>
      <h3 className="font-semibold text-foreground">Component failed to load</h3>
      <p className="text-sm text-muted-foreground">
        {error.message || 'An unexpected error occurred'}
      </p>
      {retryCount > 0 && (
        <p className="text-xs text-muted-foreground">
          Retry attempts: {retryCount}
        </p>
      )}
      <div className="flex gap-2 justify-center">
        <button 
          onClick={retry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
          disabled={retryCount >= 3}
        >
          {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
);

/**
 * Advanced lazy loading with performance optimizations
 */
export function advancedLazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T } | T>,
  options: AdvancedLazyLoadOptions = {}
): React.ComponentType<React.ComponentProps<T>> {
  const {
    fallback: LoadingFallback = OptimizedLoadingFallback,
    errorFallback: ErrorFallback = OptimizedErrorFallback,
    preloadStrategy = 'idle',
    priority = 'medium',
    timeout = 10000,
    retryAttempts = 3,
    chunkName
  } = options;

  // Create a wrapper for the import function with timeout and retry logic
  const enhancedImportFunc = async (): Promise<{ default: T }> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Component load timeout')), timeout);
        });
        
        const loadPromise = importFunc();
        const module = await Promise.race([loadPromise, timeoutPromise]);
        
        // Handle both default exports and named exports
        if (module && typeof module === 'object' && 'default' in module) {
          return { default: module.default };
        }
        
        return { default: module as T };
      } catch (error) {
        lastError = error as Error;
        
        // Exponential backoff for retries
        if (attempt < retryAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  };

  const LazyComponent = React.lazy(enhancedImportFunc);

  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    const [loadingState, setLoadingState] = React.useState<LoadingState>({
      isLoading: false,
      error: null,
      retryCount: 0
    });

    const retry = React.useCallback(() => {
      setLoadingState(prev => ({
        isLoading: false,
        error: null,
        retryCount: prev.retryCount + 1
      }));
    }, []);

    // Handle preloading based on strategy
    React.useEffect(() => {
      if (preloadStrategy === 'immediate') {
        enhancedImportFunc().catch(() => {
          // Silently handle preload failures
        });
      }
    }, [preloadStrategy]);

    if (loadingState.error) {
      return (
        <ErrorFallback 
          error={loadingState.error} 
          retry={retry}
          retryCount={loadingState.retryCount}
        />
      );
    }

    return (
      <React.Suspense 
        fallback={<LoadingFallback priority={priority} />}
      >
        <LazyComponent 
          {...props} 
          ref={ref}
          key={loadingState.retryCount} // Force remount on retry
        />
      </React.Suspense>
    );
  });
}

/**
 * Hook for preloading components with intersection observer
 */
export function useIntersectionPreload<T>(
  importFunc: () => Promise<{ default: T } | T>,
  options: { rootMargin?: string; threshold?: number } = {}
) {
  const [isPreloaded, setIsPreloaded] = React.useState(false);
  const elementRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!elementRef.current || isPreloaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          importFunc()
            .then(() => setIsPreloaded(true))
            .catch(() => {
              // Silently handle preload failures
            });
          observer.disconnect();
        }
      },
      {
        rootMargin: options.rootMargin || '100px',
        threshold: options.threshold || 0.1
      }
    );

    observer.observe(elementRef.current);

    return () => observer.disconnect();
  }, [importFunc, isPreloaded, options.rootMargin, options.threshold]);

  return { elementRef, isPreloaded };
}

/**
 * Component for lazy loading with intersection observer
 */
export function LazyOnVisible<T extends React.ComponentType<any>>({
  importFunc,
  fallback,
  className,
  children,
  ...props
}: {
  importFunc: () => Promise<{ default: T } | T>;
  fallback?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
} & React.ComponentProps<T>) {
  const { elementRef, isPreloaded } = useIntersectionPreload(importFunc);
  const LazyComponent = React.useMemo(
    () => advancedLazyLoad(importFunc, { preloadStrategy: 'viewport' }),
    [importFunc]
  );

  if (!isPreloaded) {
    return (
      <div 
        ref={elementRef as React.RefObject<HTMLDivElement>}
        className={`min-h-[200px] flex items-center justify-center ${className || ''}`}
      >
        {fallback || (
          <div className="text-center space-y-2">
            <div className="w-6 h-6 bg-secondary rounded animate-pulse mx-auto"></div>
            <p className="text-xs text-muted-foreground">Loading when visible...</p>
          </div>
        )}
      </div>
    );
  }

  return <LazyComponent {...props}>{children}</LazyComponent>;
}

/**
 * Higher-order component for adding preload on hover
 */
export function withHoverPreload<T extends React.ComponentType<any>>(
  Component: T,
  importFunc: () => Promise<{ default: T } | T>
): T {
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    const [isPreloaded, setIsPreloaded] = React.useState(false);

    const handleMouseEnter = React.useCallback(() => {
      if (!isPreloaded) {
        importFunc()
          .then(() => setIsPreloaded(true))
          .catch(() => {
            // Silently handle preload failures
          });
      }
      
      // Call original onMouseEnter if it exists
      if ('onMouseEnter' in props && typeof props.onMouseEnter === 'function') {
        props.onMouseEnter();
      }
    }, [isPreloaded]);

    return (
      <Component 
        {...props} 
        ref={ref}
        onMouseEnter={handleMouseEnter}
      />
    );
  }) as T;
}

/**
 * Performance monitoring for lazy loaded components
 */
export class LazyLoadPerformanceMonitor {
  private static instance: LazyLoadPerformanceMonitor;
  private metrics = new Map<string, {
    loadTime: number;
    errorCount: number;
    successCount: number;
    lastLoaded: number;
  }>();

  static getInstance(): LazyLoadPerformanceMonitor {
    if (!LazyLoadPerformanceMonitor.instance) {
      LazyLoadPerformanceMonitor.instance = new LazyLoadPerformanceMonitor();
    }
    return LazyLoadPerformanceMonitor.instance;
  }

  recordLoad(componentName: string, loadTime: number, success: boolean) {
    const existing = this.metrics.get(componentName) || {
      loadTime: 0,
      errorCount: 0,
      successCount: 0,
      lastLoaded: 0
    };

    if (success) {
      existing.successCount++;
      existing.loadTime = loadTime;
      existing.lastLoaded = Date.now();
    } else {
      existing.errorCount++;
    }

    this.metrics.set(componentName, existing);
  }

  getMetrics() {
    return Array.from(this.metrics.entries()).map(([name, metrics]) => ({
      componentName: name,
      ...metrics,
      successRate: metrics.successCount / (metrics.successCount + metrics.errorCount)
    }));
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

// Export the singleton instance
export const lazyLoadMonitor = LazyLoadPerformanceMonitor.getInstance();