import React from 'react';

/**
 * Enhanced lazy loading utility with error boundary and loading states
 */

interface LazyLoadOptions {
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  delay?: number;
  preload?: boolean;
}

interface LazyComponentProps {
  loading?: boolean;
  error?: Error | null;
  retry?: () => void;
}

/**
 * Default loading component
 */
const DefaultLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">Loading component...</p>
    </div>
  </div>
);

/**
 * Default error component
 */
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center space-y-4 max-w-md">
      <div className="text-destructive text-2xl">⚠️</div>
      <h3 className="font-semibold text-foreground">Failed to load component</h3>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button 
        onClick={retry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
      >
        Try Again
      </button>
    </div>
  </div>
);

/**
 * Enhanced lazy loading with error handling and retry logic
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T } | T>,
  options: LazyLoadOptions = {}
): React.ComponentType<React.ComponentProps<T>> {
  const {
    fallback: LoadingFallback = DefaultLoadingFallback,
    errorFallback: ErrorFallback = DefaultErrorFallback,
    delay = 0,
    preload = false
  } = options;

  // Preload the component if requested
  if (preload && typeof window !== 'undefined') {
    setTimeout(() => {
      importFunc().catch(() => {
        // Silently fail preload attempts
      });
    }, delay);
  }

  const LazyComponent = React.lazy(async () => {
    try {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const module = await importFunc();
      
      // Handle both default exports and named exports
      if (module && typeof module === 'object' && 'default' in module) {
        return { default: module.default };
      }
      
      return { default: module as T };
    } catch (error) {
      console.error('Failed to load component:', error);
      throw error;
    }
  });

  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    const [error, setError] = React.useState<Error | null>(null);
    const [retryCount, setRetryCount] = React.useState(0);

    const retry = React.useCallback(() => {
      setError(null);
      setRetryCount(prev => prev + 1);
    }, []);

    if (error) {
      return <ErrorFallback error={error} retry={retry} />;
    }

    return (
      <React.Suspense fallback={<LoadingFallback />}>
        <LazyComponent 
          {...props} 
          ref={ref}
          key={retryCount} // Force remount on retry
        />
      </React.Suspense>
    );
  });
}

/**
 * Lazy load with intersection observer for viewport-based loading
 */
export function lazyLoadOnVisible<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T } | T>,
  options: LazyLoadOptions & { rootMargin?: string; threshold?: number } = {}
): React.ComponentType<React.ComponentProps<T> & { className?: string }> {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    ...lazyOptions
  } = options;

  const LazyComponent = lazyLoad(importFunc, lazyOptions);

  return React.forwardRef<any, React.ComponentProps<T> & { className?: string }>((props, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin, threshold }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, [rootMargin, threshold]);

    if (!isVisible) {
      return (
        <div 
          ref={containerRef}
          className={`min-h-[200px] flex items-center justify-center ${props.className || ''}`}
        >
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-secondary rounded animate-pulse mx-auto"></div>
            <p className="text-xs text-muted-foreground">Loading when visible...</p>
          </div>
        </div>
      );
    }

    return <LazyComponent {...props} ref={ref} />;
  });
}

/**
 * Preload a component for better UX
 */
export function preloadComponent<T>(
  importFunc: () => Promise<{ default: T } | T>
): Promise<T> {
  return importFunc().then(module => {
    if (module && typeof module === 'object' && 'default' in module) {
      return module.default;
    }
    return module as T;
  });
}

/**
 * Hook for preloading components on user interaction
 */
export function usePreload<T>(
  importFunc: () => Promise<{ default: T } | T>
) {
  const [isPreloaded, setIsPreloaded] = React.useState(false);
  const [isPreloading, setIsPreloading] = React.useState(false);

  const preload = React.useCallback(async () => {
    if (isPreloaded || isPreloading) return;
    
    setIsPreloading(true);
    try {
      await preloadComponent(importFunc);
      setIsPreloaded(true);
    } catch (error) {
      console.warn('Failed to preload component:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [importFunc, isPreloaded, isPreloading]);

  return { preload, isPreloaded, isPreloading };
}

/**
 * Higher-order component for lazy loading with preload on hover
 */
export function withPreloadOnHover<T extends React.ComponentType<any>>(
  LazyComponent: React.ComponentType<React.ComponentProps<T>>,
  importFunc: () => Promise<{ default: T } | T>
) {
  return React.forwardRef<any, React.ComponentProps<T> & { onMouseEnter?: () => void }>((props, ref) => {
    const { preload } = usePreload(importFunc);
    
    const handleMouseEnter = React.useCallback(() => {
      preload();
      props.onMouseEnter?.();
    }, [preload, props.onMouseEnter]);

    return (
      <LazyComponent 
        {...props} 
        ref={ref}
        onMouseEnter={handleMouseEnter}
      />
    );
  });
}

/**
 * Utility for creating route-based lazy components
 */
export function createLazyRoute<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T } | T>,
  options?: LazyLoadOptions
) {
  return lazyLoad(importFunc, {
    fallback: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading page...</p>
        </div>
      </div>
    ),
    ...options
  });
}