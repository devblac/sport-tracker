/**
 * Performance monitoring and optimization utilities
 */

import { logger } from './logger';

interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  type: 'navigation' | 'resource' | 'measure' | 'custom';
  details?: Record<string, any>;
}

interface BundleAnalysis {
  totalSize: number;
  chunks: Array<{
    name: string;
    size: number;
    loadTime?: number;
  }>;
  recommendations: string[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = typeof window !== 'undefined' && 'performance' in window;
    if (this.isEnabled) {
      this.initializeObservers();
      this.trackInitialMetrics();
    }
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    try {
      // Navigation timing
      if ('PerformanceObserver' in window) {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.recordMetric({
                name: 'page-load',
                duration: entry.duration,
                timestamp: entry.startTime,
                type: 'navigation',
                details: {
                  domContentLoaded: (entry as PerformanceNavigationTiming).domContentLoadedEventEnd,
                  loadComplete: (entry as PerformanceNavigationTiming).loadEventEnd,
                  firstPaint: this.getFirstPaint(),
                  firstContentfulPaint: this.getFirstContentfulPaint(),
                }
              });
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);

        // Resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resource = entry as PerformanceResourceTiming;
              this.recordMetric({
                name: `resource-${this.getResourceType(resource.name)}`,
                duration: entry.duration,
                timestamp: entry.startTime,
                type: 'resource',
                details: {
                  url: resource.name,
                  size: resource.transferSize,
                  cached: resource.transferSize === 0,
                }
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

        // Measure timing
        const measureObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              this.recordMetric({
                name: entry.name,
                duration: entry.duration,
                timestamp: entry.startTime,
                type: 'measure'
              });
            }
          }
        });
        measureObserver.observe({ entryTypes: ['measure'] });
        this.observers.push(measureObserver);
      }
    } catch (error) {
      logger.warn('Failed to initialize performance observers', error);
    }
  }

  /**
   * Track initial performance metrics
   */
  private trackInitialMetrics(): void {
    if (!this.isEnabled) return;

    // Core Web Vitals
    this.trackCoreWebVitals();
    
    // Bundle size analysis
    this.analyzeBundleSize();
    
    // Memory usage
    this.trackMemoryUsage();
  }

  /**
   * Track Core Web Vitals
   */
  private trackCoreWebVitals(): void {
    try {
      // First Contentful Paint
      const fcp = this.getFirstContentfulPaint();
      if (fcp) {
        this.recordMetric({
          name: 'first-contentful-paint',
          duration: fcp,
          timestamp: performance.now(),
          type: 'custom',
          details: { metric: 'FCP', threshold: 1800 }
        });
      }

      // Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.recordMetric({
              name: 'largest-contentful-paint',
              duration: lastEntry.startTime,
              timestamp: performance.now(),
              type: 'custom',
              details: { metric: 'LCP', threshold: 2500 }
            });
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          this.observers.push(lcpObserver);
        } catch (error) {
          // LCP might not be supported
        }
      }

      // Cumulative Layout Shift
      this.trackCLS();

      // First Input Delay
      this.trackFID();
    } catch (error) {
      logger.warn('Failed to track Core Web Vitals', error);
    }
  }

  /**
   * Track Cumulative Layout Shift
   */
  private trackCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.recordMetric({
          name: 'cumulative-layout-shift',
          duration: clsValue,
          timestamp: performance.now(),
          type: 'custom',
          details: { metric: 'CLS', threshold: 0.1 }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (error) {
      // CLS might not be supported
    }
  }

  /**
   * Track First Input Delay
   */
  private trackFID(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'first-input-delay',
            duration: (entry as any).processingStart - entry.startTime,
            timestamp: entry.startTime,
            type: 'custom',
            details: { metric: 'FID', threshold: 100 }
          });
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (error) {
      // FID might not be supported
    }
  }

  /**
   * Analyze bundle size and loading performance
   */
  private analyzeBundleSize(): void {
    if (!this.isEnabled) return;

    setTimeout(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const cssResources = resources.filter(r => r.name.includes('.css'));

      const analysis: BundleAnalysis = {
        totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        chunks: [
          ...jsResources.map(r => ({
            name: this.getFileName(r.name),
            size: r.transferSize || 0,
            loadTime: r.duration
          })),
          ...cssResources.map(r => ({
            name: this.getFileName(r.name),
            size: r.transferSize || 0,
            loadTime: r.duration
          }))
        ],
        recommendations: this.generateRecommendations(jsResources, cssResources)
      };

      this.recordMetric({
        name: 'bundle-analysis',
        duration: 0,
        timestamp: performance.now(),
        type: 'custom',
        details: analysis
      });
    }, 2000);
  }

  /**
   * Track memory usage
   */
  private trackMemoryUsage(): void {
    if (!this.isEnabled || !('memory' in performance)) return;

    const memory = (performance as any).memory;
    this.recordMetric({
      name: 'memory-usage',
      duration: 0,
      timestamp: performance.now(),
      type: 'custom',
      details: {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      }
    });
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Log performance issues
    if (metric.type === 'custom' && metric.details?.threshold) {
      if (metric.duration > metric.details.threshold) {
        logger.warn(`Performance threshold exceeded for ${metric.name}`, {
          duration: metric.duration,
          threshold: metric.details.threshold
        });
      }
    }

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Measure execution time of a function
   */
  measure<T>(name: string, fn: () => T): T {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    const result = fn();
    const end = performance.now();

    this.recordMetric({
      name,
      duration: end - start,
      timestamp: start,
      type: 'measure'
    });

    return result;
  }

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    this.recordMetric({
      name,
      duration: end - start,
      timestamp: start,
      type: 'measure'
    });

    return result;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    coreWebVitals: Record<string, number>;
    loadTimes: Record<string, number>;
    bundleSize: number;
    recommendations: string[];
  } {
    const coreWebVitals: Record<string, number> = {};
    const loadTimes: Record<string, number> = {};
    let bundleSize = 0;
    let recommendations: string[] = [];

    for (const metric of this.metrics) {
      if (metric.details?.metric) {
        coreWebVitals[metric.details.metric] = metric.duration;
      }
      
      if (metric.type === 'navigation' || metric.type === 'resource') {
        loadTimes[metric.name] = metric.duration;
      }

      if (metric.name === 'bundle-analysis' && metric.details) {
        bundleSize = metric.details.totalSize;
        recommendations = metric.details.recommendations;
      }
    }

    return {
      coreWebVitals,
      loadTimes,
      bundleSize,
      recommendations
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }

  // Helper methods
  private getFirstPaint(): number | null {
    const entries = performance.getEntriesByType('paint');
    const fp = entries.find(entry => entry.name === 'first-paint');
    return fp ? fp.startTime : null;
  }

  private getFirstContentfulPaint(): number | null {
    const entries = performance.getEntriesByType('paint');
    const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  private getFileName(url: string): string {
    return url.split('/').pop() || url;
  }

  private generateRecommendations(jsResources: PerformanceResourceTiming[], cssResources: PerformanceResourceTiming[]): string[] {
    const recommendations: string[] = [];
    
    const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

    if (totalJSSize > 500000) { // 500KB
      recommendations.push('Consider code splitting to reduce JavaScript bundle size');
    }

    if (totalCSSSize > 100000) { // 100KB
      recommendations.push('Consider CSS optimization and unused CSS removal');
    }

    const slowResources = [...jsResources, ...cssResources].filter(r => r.duration > 1000);
    if (slowResources.length > 0) {
      recommendations.push('Some resources are loading slowly, consider CDN or compression');
    }

    return recommendations;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions
export function measurePerformance<T>(name: string, fn: () => T): T {
  return performanceMonitor.measure(name, fn);
}

export async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return performanceMonitor.measureAsync(name, fn);
}

export function getPerformanceSummary() {
  return performanceMonitor.getSummary();
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const [summary, setSummary] = React.useState(performanceMonitor.getSummary());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setSummary(performanceMonitor.getSummary());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return summary;
}

// Add to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).performanceMonitor = performanceMonitor;
}