// Performance monitoring and optimization utilities
import { SecureLogger } from './security';

/**
 * Performance Metrics Collector
 */
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();
  private static observers: PerformanceObserver[] = [];

  /**
   * Initialize performance monitoring
   */
  static init() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor resource loading
    this.observeResources();
    
    // Monitor long tasks
    this.observeLongTasks();
    
    // Monitor navigation timing
    this.observeNavigation();
  }

  /**
   * Monitor Core Web Vitals (LCP, FID, CLS)
   */
  private static observeWebVitals() {
    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordMetric('CLS', clsValue);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

    } catch (error) {
      console.warn('Web Vitals monitoring not supported:', error);
    }
  }

  /**
   * Monitor resource loading performance
   */
  private static observeResources() {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          // Track slow resources
          if (entry.duration > 1000) {
            this.recordMetric(`slow_resource_${entry.initiatorType}`, entry.duration);
            
            // Log slow resources in development
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Slow ${entry.initiatorType} resource:`, entry.name, `${entry.duration}ms`);
            }
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource monitoring not supported:', error);
    }
  }

  /**
   * Monitor long tasks that block the main thread
   */
  private static observeLongTasks() {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('long_task', entry.duration);
          
          // Log long tasks in development
          if (process.env.NODE_ENV === 'development') {
            console.warn('Long task detected:', `${entry.duration}ms`);
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      console.warn('Long task monitoring not supported:', error);
    }
  }

  /**
   * Monitor navigation timing
   */
  private static observeNavigation() {
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('navigation_duration', entry.duration);
          this.recordMetric('dom_content_loaded', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart);
          this.recordMetric('load_event', entry.loadEventEnd - entry.loadEventStart);
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (error) {
      console.warn('Navigation monitoring not supported:', error);
    }
  }

  /**
   * Record a performance metric
   */
  static recordMetric(name: string, value: number) {
    this.metrics.set(name, value);
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(name, value);
    }
  }

  /**
   * Get all recorded metrics
   */
  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Send metrics to analytics service
   */
  private static sendToAnalytics(name: string, value: number) {
    try {
      // Send to Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'performance_metric', {
          event_category: 'Performance',
          event_label: name,
          value: Math.round(value)
        });
      }

      // Send to custom analytics endpoint
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: name,
          value: value,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(error => {
        // Fail silently for analytics
        console.debug('Analytics send failed:', error);
      });
    } catch (error) {
      console.debug('Analytics error:', error);
    }
  }

  /**
   * Cleanup observers
   */
  static cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

/**
 * Bundle Size Analyzer
 */
export class BundleAnalyzer {
  /**
   * Analyze and report bundle sizes
   */
  static analyzeBundles() {
    if (typeof window === 'undefined') return;

    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    const analysis = {
      scripts: scripts.length,
      styles: styles.length,
      totalResources: scripts.length + styles.length
    };

    console.log('Bundle Analysis:', analysis);
    return analysis;
  }
}

/**
 * Memory Usage Monitor
 */
export class MemoryMonitor {
  private static interval: NodeJS.Timeout | null = null;

  /**
   * Start monitoring memory usage
   */
  static startMonitoring(intervalMs: number = 30000) {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    this.interval = setInterval(() => {
      const memory = (performance as any).memory;
      
      const usage = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };

      // Warn if memory usage is high
      const usagePercent = (usage.used / usage.limit) * 100;
      if (usagePercent > 80) {
        SecureLogger.logError(new Error('High memory usage detected'), {
          memoryUsage: usage,
          usagePercent
        });
      }

      PerformanceMonitor.recordMetric('memory_used_mb', usage.used);
      PerformanceMonitor.recordMetric('memory_usage_percent', usagePercent);
    }, intervalMs);
  }

  /**
   * Stop monitoring memory usage
   */
  static stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Get current memory usage
   */
  static getCurrentUsage() {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
    };
  }
}

/**
 * Image Optimization Helper
 */
export class ImageOptimizer {
  /**
   * Create optimized image with WebP fallback
   */
  static createOptimizedImage(src: string, alt: string, className?: string): HTMLPictureElement {
    const picture = document.createElement('picture');
    
    // WebP source
    const webpSource = document.createElement('source');
    webpSource.srcset = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    webpSource.type = 'image/webp';
    
    // Fallback image
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    if (className) img.className = className;
    
    picture.appendChild(webpSource);
    picture.appendChild(img);
    
    return picture;
  }

  /**
   * Lazy load images with Intersection Observer
   */
  static setupLazyLoading() {
    if (!('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Code Splitting Helper
 */
export class CodeSplitter {
  private static loadedChunks = new Set<string>();

  /**
   * Dynamically import a component
   */
  static async loadComponent<T>(importFn: () => Promise<T>, chunkName: string): Promise<T> {
    try {
      // Track loading time
      const startTime = performance.now();
      
      const module = await importFn();
      
      const loadTime = performance.now() - startTime;
      PerformanceMonitor.recordMetric(`chunk_load_${chunkName}`, loadTime);
      
      this.loadedChunks.add(chunkName);
      return module;
    } catch (error) {
      SecureLogger.logError(error as Error, { chunkName });
      throw error;
    }
  }

  /**
   * Preload a chunk
   */
  static preloadChunk(chunkName: string) {
    if (this.loadedChunks.has(chunkName)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/assets/${chunkName}.js`;
    document.head.appendChild(link);
  }

  /**
   * Get loaded chunks
   */
  static getLoadedChunks(): string[] {
    return Array.from(this.loadedChunks);
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Start monitoring when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      PerformanceMonitor.init();
      MemoryMonitor.startMonitoring();
      ImageOptimizer.setupLazyLoading();
    });
  } else {
    PerformanceMonitor.init();
    MemoryMonitor.startMonitoring();
    ImageOptimizer.setupLazyLoading();
  }
}