/**
 * Lazy-loaded chart components for better performance
 */

import React from 'react';
import { lazyLoadOnVisible } from '@/utils/lazyLoad';

// Loading fallback for charts
const ChartLoadingFallback: React.FC = () => (
  <div className="w-full h-64 bg-secondary/20 rounded-lg flex items-center justify-center">
    <div className="text-center space-y-3">
      <div className="animate-pulse">
        <div className="h-4 bg-secondary rounded w-32 mx-auto mb-2"></div>
        <div className="h-32 bg-secondary rounded w-full mb-2"></div>
        <div className="h-4 bg-secondary rounded w-24 mx-auto"></div>
      </div>
      <p className="text-sm text-muted-foreground">Loading chart...</p>
    </div>
  </div>
);

// Error fallback for charts
const ChartErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="w-full h-64 bg-destructive/5 border border-destructive/20 rounded-lg flex items-center justify-center">
    <div className="text-center space-y-3 p-4">
      <div className="text-destructive text-xl">📊</div>
      <h3 className="font-medium text-foreground">Chart failed to load</h3>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button 
        onClick={retry}
        className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
      >
        Retry
      </button>
    </div>
  </div>
);

// Lazy load chart components with intersection observer
export const LazyProgressChart = lazyLoadOnVisible(
  () => import('./ProgressChart').then(m => ({ default: m.ProgressChart })),
  {
    fallback: ChartLoadingFallback,
    errorFallback: ChartErrorFallback,
    rootMargin: '100px', // Load when 100px away from viewport
    threshold: 0.1
  }
);

export const LazyWorkoutVolumeChart = lazyLoadOnVisible(
  () => import('./WorkoutVolumeChart').then(m => ({ default: m.WorkoutVolumeChart })),
  {
    fallback: ChartLoadingFallback,
    errorFallback: ChartErrorFallback,
    rootMargin: '100px',
    threshold: 0.1
  }
);

export const LazyStrengthProgressChart = lazyLoadOnVisible(
  () => import('./StrengthProgressChart').then(m => ({ default: m.StrengthProgressChart })),
  {
    fallback: ChartLoadingFallback,
    errorFallback: ChartErrorFallback,
    rootMargin: '100px',
    threshold: 0.1
  }
);

export const LazyWorkoutHeatmap = lazyLoadOnVisible(
  () => import('./WorkoutHeatmap').then(m => ({ default: m.WorkoutHeatmap })),
  {
    fallback: ChartLoadingFallback,
    errorFallback: ChartErrorFallback,
    rootMargin: '150px', // Heatmaps are more complex, load earlier
    threshold: 0.1
  }
);

export const LazyExerciseDistributionChart = lazyLoadOnVisible(
  () => import('./ExerciseDistributionChart').then(m => ({ default: m.ExerciseDistributionChart })),
  {
    fallback: ChartLoadingFallback,
    errorFallback: ChartErrorFallback,
    rootMargin: '100px',
    threshold: 0.1
  }
);

// Preload charts on user interaction
export const useChartPreloading = () => {
  const preloadProgressChart = React.useCallback(() => {
    import('./ProgressChart').catch(() => {});
  }, []);

  const preloadVolumeChart = React.useCallback(() => {
    import('./WorkoutVolumeChart').catch(() => {});
  }, []);

  const preloadStrengthChart = React.useCallback(() => {
    import('./StrengthProgressChart').catch(() => {});
  }, []);

  const preloadHeatmap = React.useCallback(() => {
    import('./WorkoutHeatmap').catch(() => {});
  }, []);

  const preloadDistributionChart = React.useCallback(() => {
    import('./ExerciseDistributionChart').catch(() => {});
  }, []);

  return {
    preloadProgressChart,
    preloadVolumeChart,
    preloadStrengthChart,
    preloadHeatmap,
    preloadDistributionChart
  };
};

// Chart container with performance optimization
export const OptimizedChartContainer: React.FC<{
  children: React.ReactNode;
  title?: string;
  className?: string;
}> = ({ children, title, className = '' }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`chart-container ${className}`}
      style={{ 
        minHeight: '200px',
        // Optimize rendering performance
        willChange: isVisible ? 'auto' : 'transform',
        transform: isVisible ? 'translateZ(0)' : 'none'
      }}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      )}
      {isVisible ? children : (
        <div className="w-full h-48 bg-secondary/10 rounded-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-secondary rounded animate-pulse mx-auto"></div>
            <p className="text-xs text-muted-foreground">Chart loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for chart performance monitoring
export const useChartPerformance = (chartName: string) => {
  const [renderTime, setRenderTime] = React.useState<number | null>(null);
  const [isRendering, setIsRendering] = React.useState(false);

  const startRender = React.useCallback(() => {
    setIsRendering(true);
    performance.mark(`${chartName}-render-start`);
  }, [chartName]);

  const endRender = React.useCallback(() => {
    performance.mark(`${chartName}-render-end`);
    performance.measure(
      `${chartName}-render-time`,
      `${chartName}-render-start`,
      `${chartName}-render-end`
    );
    
    const measure = performance.getEntriesByName(`${chartName}-render-time`)[0];
    setRenderTime(measure.duration);
    setIsRendering(false);
  }, [chartName]);

  React.useEffect(() => {
    return () => {
      // Cleanup performance marks
      performance.clearMarks(`${chartName}-render-start`);
      performance.clearMarks(`${chartName}-render-end`);
      performance.clearMeasures(`${chartName}-render-time`);
    };
  }, [chartName]);

  return {
    renderTime,
    isRendering,
    startRender,
    endRender
  };
};