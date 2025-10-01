/**
 * Performance Optimization Utilities
 * Central export for all performance-related utilities
 */

// Core performance management
export { 
  performanceManager, 
  initializePerformanceOptimizations,
  usePerformanceManager 
} from './performanceInit';

// Advanced lazy loading
export { 
  advancedLazyLoad,
  useIntersectionPreload,
  LazyOnVisible,
  withHoverPreload,
  lazyLoadMonitor
} from './advancedLazyLoad';

// Database optimization
export { 
  databaseOptimizer,
  QueryOptimizations 
} from './databaseOptimizer';

// Intelligent caching
export { 
  intelligentCache,
  setupIntelligentCaching 
} from './intelligentCache';

// Predictive prefetching
export { 
  predictivePrefetcher,
  usePredictivePrefetch 
} from './predictivePrefetch';

// Route preloading
export { 
  routePreloader,
  useRoutePreloader 
} from './routePreloader';

// Performance monitoring component
export { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';

// Types
export type { PerformanceConfig } from './performanceInit';

// Utility functions
export const PerformanceUtils = {
  /**
   * Measure function execution time
   */
  measureTime: async <T>(fn: () => Promise<T> | T, label?: string): Promise<{ result: T; time: number }> => {
    const start = performance.now();
    const result = await fn();
    const time = performance.now() - start;
    
    if (label) {
      console.log(`[Performance] ${label}: ${time.toFixed(2)}ms`);
    }
    
    return { result, time };
  },

  /**
   * Debounce function for performance
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function for performance
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Check if user is on a slow connection
   */
  isSlowConnection: (): boolean => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
    }
    return false;
  },

  /**
   * Check if device has low memory
   */
  isLowMemoryDevice: (): boolean => {
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory < 4; // Less than 4GB
    }
    return false;
  },

  /**
   * Get device performance tier
   */
  getDevicePerformanceTier: (): 'high' | 'medium' | 'low' => {
    const isSlowConnection = PerformanceUtils.isSlowConnection();
    const isLowMemory = PerformanceUtils.isLowMemoryDevice();
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;

    if (isSlowConnection || isLowMemory || hardwareConcurrency < 4) {
      return 'low';
    } else if (hardwareConcurrency < 8) {
      return 'medium';
    } else {
      return 'high';
    }
  },

  /**
   * Adaptive loading based on device capabilities
   */
  shouldLoadResource: (resourceType: 'image' | 'video' | 'animation' | 'heavy-js'): boolean => {
    const tier = PerformanceUtils.getDevicePerformanceTier();
    const prefersReducedMotion = PerformanceUtils.prefersReducedMotion();

    switch (resourceType) {
      case 'image':
        return true; // Always load images
      case 'video':
        return tier !== 'low';
      case 'animation':
        return tier === 'high' && !prefersReducedMotion;
      case 'heavy-js':
        return tier !== 'low';
      default:
        return true;
    }
  }
};

// Performance constants
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals thresholds
  FCP_GOOD: 1800,
  FCP_POOR: 3000,
  LCP_GOOD: 2500,
  LCP_POOR: 4000,
  FID_GOOD: 100,
  FID_POOR: 300,
  CLS_GOOD: 0.1,
  CLS_POOR: 0.25,
  
  // Custom thresholds
  DB_QUERY_GOOD: 50,
  DB_QUERY_POOR: 100,
  CACHE_HIT_RATE_GOOD: 0.8,
  CACHE_HIT_RATE_POOR: 0.5,
  ROUTE_LOAD_GOOD: 1000,
  ROUTE_LOAD_POOR: 3000
} as const;