/**
 * Performance Initialization
 * Coordinates all performance optimizations and monitoring
 */

import { databaseOptimizer } from './databaseOptimizer';
import { intelligentCache, setupIntelligentCaching } from './intelligentCache';
import { predictivePrefetcher } from './predictivePrefetch';
import { routePreloader } from './routePreloader';
import { lazyLoadMonitor } from './advancedLazyLoad';

interface PerformanceConfig {
  enableDatabaseOptimization: boolean;
  enableIntelligentCaching: boolean;
  enablePredictivePrefetching: boolean;
  enableRoutePreloading: boolean;
  enablePerformanceMonitoring: boolean;
  developmentMode: boolean;
}

class PerformanceManager {
  private static instance: PerformanceManager;
  private isInitialized = false;
  private config: PerformanceConfig;

  private constructor() {
    this.config = {
      enableDatabaseOptimization: true,
      enableIntelligentCaching: true,
      enablePredictivePrefetching: true,
      enableRoutePreloading: true,
      enablePerformanceMonitoring: import.meta.env.DEV,
      developmentMode: import.meta.env.DEV
    };
  }

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  /**
   * Initialize all performance optimizations
   */
  async initialize(customConfig?: Partial<PerformanceConfig>): Promise<void> {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...customConfig };

    try {
      console.log('[Performance] Initializing performance optimizations...');

      // Initialize Core Web Vitals monitoring
      if (this.config.enablePerformanceMonitoring) {
        this.initializeCoreWebVitals();
      }

      // Initialize intelligent caching
      if (this.config.enableIntelligentCaching) {
        setupIntelligentCaching();
        this.initializeServiceWorkerCaching();
      }

      // Initialize predictive prefetching
      if (this.config.enablePredictivePrefetching) {
        // Predictive prefetcher is already initialized as singleton
        console.log('[Performance] Predictive prefetching enabled');
      }

      // Initialize route preloading
      if (this.config.enableRoutePreloading) {
        // Route preloader is already initialized as singleton
        console.log('[Performance] Route preloading enabled');
      }

      // Set up performance observers
      this.setupPerformanceObservers();

      // Initialize resource hints
      this.initializeResourceHints();

      this.isInitialized = true;
      console.log('[Performance] All performance optimizations initialized successfully');

    } catch (error) {
      console.error('[Performance] Failed to initialize performance optimizations:', error);
      throw error;
    }
  }

  private initializeCoreWebVitals(): void {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              console.log('[Performance] FCP:', entry.startTime);
              this.reportMetric('FCP', entry.startTime);
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        console.warn('[Performance] Failed to observe paint metrics:', error);
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('[Performance] LCP:', lastEntry.startTime);
          this.reportMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('[Performance] Failed to observe LCP metrics:', error);
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log('[Performance] FID:', entry.processingStart - entry.startTime);
            this.reportMetric('FID', entry.processingStart - entry.startTime);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (error) {
        console.warn('[Performance] Failed to observe FID metrics:', error);
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          console.log('[Performance] CLS:', clsValue);
          this.reportMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('[Performance] Failed to observe CLS metrics:', error);
      }
    }
  }

  private initializeServiceWorkerCaching(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Send initialization message to service worker
        if (registration.active) {
          registration.active.postMessage({
            type: 'INIT_INTELLIGENT_CACHE'
          });
        }
      });
    }
  }

  private setupPerformanceObservers(): void {
    if ('PerformanceObserver' in window) {
      // Navigation timing
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log('[Performance] Navigation timing:', {
              dns: entry.domainLookupEnd - entry.domainLookupStart,
              tcp: entry.connectEnd - entry.connectStart,
              request: entry.responseStart - entry.requestStart,
              response: entry.responseEnd - entry.responseStart,
              dom: entry.domContentLoadedEventEnd - entry.responseEnd,
              load: entry.loadEventEnd - entry.loadEventStart
            });
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.warn('[Performance] Failed to observe navigation timing:', error);
      }

      // Resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 1000) { // Log slow resources (>1s)
              console.warn('[Performance] Slow resource:', entry.name, entry.duration);
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('[Performance] Failed to observe resource timing:', error);
      }
    }
  }

  private initializeResourceHints(): void {
    // Add DNS prefetch for external domains
    this.addResourceHint('dns-prefetch', 'https://fonts.googleapis.com');
    this.addResourceHint('dns-prefetch', 'https://fonts.gstatic.com');
    
    // Add preconnect for critical external resources
    this.addResourceHint('preconnect', 'https://fonts.googleapis.com', true);
    
    // Add modulepreload for critical modules
    if (this.config.developmentMode) {
      // In development, we might want to preload certain modules
      this.addResourceHint('modulepreload', '/src/main.tsx');
    }
  }

  private addResourceHint(rel: string, href: string, crossorigin = false): void {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (crossorigin) {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  }

  private reportMetric(name: string, value: number): void {
    // In a real implementation, this would send metrics to analytics
    if (this.config.developmentMode) {
      console.log(`[Performance] ${name}:`, value);
    }

    // Store metric locally for performance monitor
    const metrics = JSON.parse(localStorage.getItem('performance-metrics') || '{}');
    metrics[name] = value;
    metrics.timestamp = Date.now();
    localStorage.setItem('performance-metrics', JSON.stringify(metrics));
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem('performance-metrics') || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Clear all performance data
   */
  clearMetrics(): void {
    localStorage.removeItem('performance-metrics');
    
    if (this.config.enableDatabaseOptimization) {
      databaseOptimizer.clearMetrics();
    }
    
    if (this.config.enableIntelligentCaching) {
      intelligentCache.clearAllCaches();
    }
    
    if (this.config.enablePredictivePrefetching) {
      predictivePrefetcher.clearPredictionData();
    }
    
    lazyLoadMonitor.clearMetrics();
  }

  /**
   * Export all performance data
   */
  exportPerformanceData(): string {
    const data = {
      coreMetrics: this.getMetrics(),
      database: this.config.enableDatabaseOptimization ? databaseOptimizer.exportPerformanceData() : null,
      cache: this.config.enableIntelligentCaching ? intelligentCache.getCacheAnalytics() : null,
      prefetch: this.config.enablePredictivePrefetching ? predictivePrefetcher.exportPredictionData() : null,
      lazyLoad: lazyLoadMonitor.getMetrics(),
      routes: routePreloader.getPreloadStats(),
      config: this.config,
      timestamp: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Get performance recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getMetrics();

    // FCP recommendations
    if (metrics.FCP > 3000) {
      recommendations.push('First Contentful Paint is slow (>3s). Consider optimizing critical resources.');
    } else if (metrics.FCP > 1800) {
      recommendations.push('First Contentful Paint could be improved (<1.8s is ideal).');
    }

    // LCP recommendations
    if (metrics.LCP > 4000) {
      recommendations.push('Largest Contentful Paint is slow (>4s). Optimize your largest content element.');
    } else if (metrics.LCP > 2500) {
      recommendations.push('Largest Contentful Paint could be improved (<2.5s is ideal).');
    }

    // FID recommendations
    if (metrics.FID > 300) {
      recommendations.push('First Input Delay is high (>300ms). Consider reducing JavaScript execution time.');
    } else if (metrics.FID > 100) {
      recommendations.push('First Input Delay could be improved (<100ms is ideal).');
    }

    // CLS recommendations
    if (metrics.CLS > 0.25) {
      recommendations.push('Cumulative Layout Shift is high (>0.25). Ensure elements have defined dimensions.');
    } else if (metrics.CLS > 0.1) {
      recommendations.push('Cumulative Layout Shift could be improved (<0.1 is ideal).');
    }

    // Database recommendations
    if (this.config.enableDatabaseOptimization) {
      const dbRecommendations = databaseOptimizer.getOptimizationRecommendations();
      recommendations.push(...dbRecommendations.map(rec => rec.recommendation));
    }

    return recommendations;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const performanceManager = PerformanceManager.getInstance();

// Convenience function for initialization
export async function initializePerformanceOptimizations(config?: Partial<PerformanceConfig>): Promise<void> {
  await performanceManager.initialize(config);
}

// React hook for performance management
export function usePerformanceManager() {
  return {
    getMetrics: () => performanceManager.getMetrics(),
    clearMetrics: () => performanceManager.clearMetrics(),
    exportData: () => performanceManager.exportPerformanceData(),
    getRecommendations: () => performanceManager.getRecommendations(),
    updateConfig: (config: Partial<PerformanceConfig>) => performanceManager.updateConfig(config),
    getConfig: () => performanceManager.getConfig()
  };
}