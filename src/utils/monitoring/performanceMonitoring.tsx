/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and custom performance metrics
 */

// Temporary mock to avoid JSX import issues
const errorTracker = {
  captureMessage: (message: string, level: string, options?: any) => {
    console.warn(`[${level}] ${message}`, options);
  },
  capturePerformanceMetric: (name: string, value: number, tags: Record<string, any>) => {
    console.log(`[Performance] ${name}: ${value}`, tags);
  }
};

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userId?: string;
  tags?: Record<string, string>;
}

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observer?: PerformanceObserver;
  private isInitialized = false;

  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;
    this.setupPerformanceObserver();
    this.trackWebVitals();
    this.trackCustomMetrics();
    this.trackResourceTiming();
    
    console.log('Performance monitoring initialized');
  }

  private setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint'] });
    } catch (e) {
      console.warn('Failed to setup PerformanceObserver:', e);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.duration || entry.startTime,
      timestamp: Date.now(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      tags: {
        type: entry.entryType,
        ...(entry as any).toJSON?.() || {}
      }
    };

    this.recordMetric(metric);
  }

  private trackWebVitals() {
    // Track Core Web Vitals using web-vitals library pattern
    this.trackCLS();
    this.trackFID();
    this.trackFCP();
    this.trackLCP();
    this.trackTTFB();
  }

  private trackCLS() {
    // Cumulative Layout Shift
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        if (clsValue > 0) {
          this.recordWebVital('CLS', clsValue);
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('Failed to track CLS:', e);
    }
  }

  private trackFID() {
    // First Input Delay
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordWebVital('FID', (entry as any).processingStart - entry.startTime);
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('Failed to track FID:', e);
    }
  }

  private trackFCP() {
    // First Contentful Paint
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordWebVital('FCP', entry.startTime);
          }
        }
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch (e) {
      console.warn('Failed to track FCP:', e);
    }
  }

  private trackLCP() {
    // Largest Contentful Paint
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.recordWebVital('LCP', lastEntry.startTime);
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('Failed to track LCP:', e);
    }
  }

  private trackTTFB() {
    // Time to First Byte
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordWebVital('TTFB', navEntry.responseStart - navEntry.requestStart);
          }
        }
      });

      observer.observe({ type: 'navigation', buffered: true });
    } catch (e) {
      console.warn('Failed to track TTFB:', e);
    }
  }

  private recordWebVital(name: WebVitalsMetric['name'], value: number) {
    const rating = this.getWebVitalRating(name, value);
    
    const metric: PerformanceMetric = {
      name: `web-vital-${name.toLowerCase()}`,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      tags: {
        type: 'web-vital',
        vital: name,
        rating
      }
    };

    this.recordMetric(metric);

    // Report poor web vitals as warnings
    if (rating === 'poor') {
      errorTracker.captureMessage(`Poor ${name}: ${value}ms`, 'warning', {
        additionalData: { webVital: name, value, rating }
      });
    }
  }

  private getWebVitalRating(name: WebVitalsMetric['name'], value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[name];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private trackCustomMetrics() {
    // Track custom app-specific metrics
    this.trackRouteChanges();
    this.trackComponentRenderTimes();
    this.trackAPIResponseTimes();
  }

  private trackRouteChanges() {
    // Track route change performance
    let routeStartTime = Date.now();
    
    const trackRouteChange = () => {
      const routeTime = Date.now() - routeStartTime;
      this.recordMetric({
        name: 'route-change-time',
        value: routeTime,
        timestamp: Date.now(),
        url: window.location.href,
        userId: this.getCurrentUserId(),
        tags: { type: 'navigation' }
      });
      routeStartTime = Date.now();
    };

    // Listen for route changes (works with React Router)
    window.addEventListener('popstate', trackRouteChange);
    
    // Also track programmatic navigation
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      trackRouteChange();
    };
  }

  private trackComponentRenderTimes() {
    // This would be integrated with React DevTools or custom hooks
    // For now, we'll provide a utility function
  }

  private trackAPIResponseTimes() {
    // Intercept fetch requests to track API performance
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : 
        args[0] instanceof Request ? args[0].url : args[0].toString();
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        this.recordMetric({
          name: 'api-response-time',
          value: duration,
          timestamp: Date.now(),
          url: window.location.href,
          userId: this.getCurrentUserId(),
          tags: {
            type: 'api',
            endpoint: url,
            status: response.status.toString(),
            method: (args[1]?.method || 'GET').toUpperCase()
          }
        });
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.recordMetric({
          name: 'api-error-time',
          value: duration,
          timestamp: Date.now(),
          url: window.location.href,
          userId: this.getCurrentUserId(),
          tags: {
            type: 'api-error',
            endpoint: url,
            error: (error as Error).message
          }
        });
        
        throw error;
      }
    };
  }

  private trackResourceTiming() {
    // Track resource loading performance
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          this.recordMetric({
            name: 'resource-load-time',
            value: resourceEntry.duration,
            timestamp: Date.now(),
            url: window.location.href,
            userId: this.getCurrentUserId(),
            tags: {
              type: 'resource',
              resource: resourceEntry.name,
              resourceType: resourceEntry.initiatorType,
              size: resourceEntry.transferSize?.toString() || '0'
            }
          });
        }
      });

      observer.observe({ type: 'resource', buffered: true });
    } catch (e) {
      console.warn('Failed to track resource timing:', e);
    }
  }

  // Public API for custom metrics
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Send to error tracker for centralized reporting
    errorTracker.capturePerformanceMetric(metric.name, metric.value, metric.tags || {});
    
    // Keep only recent metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  // Utility for measuring function execution time
  measureFunction<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const startTime = performance.now();
    const result = fn();
    const duration = performance.now() - startTime;
    
    this.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      tags: { type: 'function', ...tags }
    });
    
    return result;
  }

  // Utility for measuring async function execution time
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const duration = performance.now() - startTime;
    
    this.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      tags: { type: 'async-function', ...tags }
    });
    
    return result;
  }

  private getCurrentUserId(): string | undefined {
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

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics() {
    this.metrics = [];
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const measureRender = (componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric({
        name: 'component-render-time',
        value: duration,
        timestamp: Date.now(),
        url: window.location.href,
        tags: {
          type: 'component',
          component: componentName
        }
      });
    };
  };

  return {
    measureRender,
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    measureFunction: performanceMonitor.measureFunction.bind(performanceMonitor),
    measureAsyncFunction: performanceMonitor.measureAsyncFunction.bind(performanceMonitor)
  };
}