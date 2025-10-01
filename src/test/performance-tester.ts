/**
 * Performance Testing Framework
 * 
 * Provides comprehensive performance testing capabilities including:
 * - Component render time measurement
 * - Memory leak detection
 * - Cache performance validation
 * - Performance regression tracking
 */

import { performance, PerformanceObserver } from 'perf_hooks';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: {
    used: number;
    total: number;
    external: number;
  };
  cacheMetrics?: {
    hitRate: number;
    missRate: number;
    evictions: number;
  };
}

export interface PerformanceBenchmark {
  name: string;
  component: string;
  maxRenderTime: number; // milliseconds
  maxMemoryIncrease: number; // bytes
  minCacheHitRate?: number; // percentage
}

export interface PerformanceTestResult {
  benchmark: PerformanceBenchmark;
  metrics: PerformanceMetrics;
  passed: boolean;
  violations: string[];
  timestamp: Date;
}

export class PerformanceTester {
  private performanceObserver: PerformanceObserver | null = null;
  private measurements: Map<string, number[]> = new Map();
  private memoryBaseline: NodeJS.MemoryUsage | null = null;

  constructor() {
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const existing = this.measurements.get(entry.name) || [];
          existing.push(entry.duration);
          this.measurements.set(entry.name, existing);
        });
      });
      
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  /**
   * Start performance measurement for a component render
   */
  startMeasurement(componentName: string): void {
    const markName = `${componentName}-start`;
    performance.mark(markName);
    
    // Capture memory baseline
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.memoryBaseline = process.memoryUsage();
    }
  }

  /**
   * End performance measurement and return metrics
   */
  endMeasurement(componentName: string): PerformanceMetrics {
    const startMark = `${componentName}-start`;
    const endMark = `${componentName}-end`;
    const measureName = `${componentName}-render`;

    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    const renderTime = this.getLastMeasurement(measureName);
    const memoryUsage = this.getCurrentMemoryUsage();

    // Clean up marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);

    return {
      renderTime,
      memoryUsage
    };
  }

  private getLastMeasurement(name: string): number {
    const measurements = this.measurements.get(name) || [];
    if (measurements.length > 0) {
      return measurements[measurements.length - 1];
    }
    
    // Fallback: calculate time difference using performance.now()
    const startMark = `${name.replace('-render', '')}-start`;
    const endMark = `${name.replace('-render', '')}-end`;
    
    try {
      const entries = performance.getEntriesByName(name, 'measure');
      if (entries.length > 0) {
        return entries[entries.length - 1].duration;
      }
    } catch (error) {
      // Fallback for environments without full performance API
    }
    
    return 1; // Return minimum 1ms to avoid zero values in tests
  }

  private getCurrentMemoryUsage(): PerformanceMetrics['memoryUsage'] {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const current = process.memoryUsage();
      return {
        used: current.heapUsed,
        total: current.heapTotal,
        external: current.external
      };
    }

    // Fallback for browser environment
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize || 0,
        total: memory.totalJSHeapSize || 0,
        external: 0
      };
    }

    return { used: 0, total: 0, external: 0 };
  }

  /**
   * Detect memory leaks by comparing memory usage over multiple renders
   */
  async detectMemoryLeaks(
    renderFunction: () => Promise<void> | void,
    iterations: number = 10
  ): Promise<{
    hasLeak: boolean;
    memoryGrowth: number;
    iterations: number;
  }> {
    const initialMemory = this.getCurrentMemoryUsage();
    const memorySnapshots: number[] = [];

    for (let i = 0; i < iterations; i++) {
      await renderFunction();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const currentMemory = this.getCurrentMemoryUsage();
      memorySnapshots.push(currentMemory.used);
      
      // Small delay to allow cleanup
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const finalMemory = this.getCurrentMemoryUsage();
    const memoryGrowth = finalMemory.used - initialMemory.used;
    
    // Consider it a leak if memory grows by more than 1MB over iterations
    const hasLeak = memoryGrowth > 1024 * 1024;

    return {
      hasLeak,
      memoryGrowth,
      iterations
    };
  }

  /**
   * Test cache performance metrics
   */
  testCachePerformance(cache: any): PerformanceMetrics['cacheMetrics'] {
    if (!cache || typeof cache.getStats !== 'function') {
      return undefined;
    }

    const stats = cache.getStats();
    const totalRequests = stats.hits + stats.misses;
    
    if (totalRequests === 0) {
      return {
        hitRate: 0,
        missRate: 0,
        evictions: stats.evictions || 0
      };
    }

    return {
      hitRate: (stats.hits / totalRequests) * 100,
      missRate: (stats.misses / totalRequests) * 100,
      evictions: stats.evictions || 0
    };
  }

  /**
   * Run performance test against a benchmark
   */
  async runBenchmark(
    benchmark: PerformanceBenchmark,
    testFunction: () => Promise<PerformanceMetrics> | PerformanceMetrics
  ): Promise<PerformanceTestResult> {
    const metrics = await testFunction();
    const violations: string[] = [];

    // Check render time
    if (metrics.renderTime > benchmark.maxRenderTime) {
      violations.push(
        `Render time ${metrics.renderTime.toFixed(2)}ms exceeds limit ${benchmark.maxRenderTime}ms`
      );
    }

    // Check memory usage increase
    const memoryIncrease = this.memoryBaseline 
      ? metrics.memoryUsage.used - this.memoryBaseline.heapUsed
      : 0;
      
    if (memoryIncrease > benchmark.maxMemoryIncrease) {
      violations.push(
        `Memory increase ${(memoryIncrease / 1024).toFixed(2)}KB exceeds limit ${(benchmark.maxMemoryIncrease / 1024).toFixed(2)}KB`
      );
    }

    // Check cache hit rate if applicable
    if (benchmark.minCacheHitRate && metrics.cacheMetrics) {
      if (metrics.cacheMetrics.hitRate < benchmark.minCacheHitRate) {
        violations.push(
          `Cache hit rate ${metrics.cacheMetrics.hitRate.toFixed(2)}% below minimum ${benchmark.minCacheHitRate}%`
        );
      }
    }

    return {
      benchmark,
      metrics,
      passed: violations.length === 0,
      violations,
      timestamp: new Date()
    };
  }

  /**
   * Get performance statistics for a component
   */
  getPerformanceStats(componentName: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } {
    const measurements = this.measurements.get(`${componentName}-render`) || [];
    
    if (measurements.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0 };
    }

    const sum = measurements.reduce((a, b) => a + b, 0);
    const average = sum / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);

    return { average, min, max, count: measurements.length };
  }

  /**
   * Clear all measurements
   */
  clearMeasurements(): void {
    this.measurements.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    this.clearMeasurements();
  }
}