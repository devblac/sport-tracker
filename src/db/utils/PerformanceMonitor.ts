/**
 * Database Performance Monitor
 * 
 * Monitors and tracks database operation performance for optimization.
 */

interface OperationMetric {
  operation: string;
  storeName: string;
  duration: number;
  timestamp: number;
  success: boolean;
  recordCount?: number;
  indexUsed?: string;
}

interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  successRate: number;
  slowOperations: number;
  operationsByStore: Record<string, number>;
  operationsByType: Record<string, number>;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: OperationMetric[] = [];
  private readonly maxMetrics = 1000;
  private readonly slowOperationThreshold = 100; // ms

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record a database operation
   */
  recordOperation(
    operation: string,
    storeName: string,
    duration: number,
    success: boolean,
    recordCount?: number,
    indexUsed?: string
  ): void {
    const metric: OperationMetric = {
      operation,
      storeName,
      duration,
      timestamp: Date.now(),
      success,
      recordCount,
      indexUsed,
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations
    if (duration > this.slowOperationThreshold) {
      console.warn(`Slow database operation detected:`, {
        operation,
        storeName,
        duration: `${duration}ms`,
        recordCount,
        indexUsed,
      });
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        successRate: 0,
        slowOperations: 0,
        operationsByStore: {},
        operationsByType: {},
      };
    }

    const totalOperations = this.metrics.length;
    const successfulOperations = this.metrics.filter(m => m.success).length;
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const slowOperations = this.metrics.filter(m => m.duration > this.slowOperationThreshold).length;

    const operationsByStore: Record<string, number> = {};
    const operationsByType: Record<string, number> = {};

    this.metrics.forEach(metric => {
      operationsByStore[metric.storeName] = (operationsByStore[metric.storeName] || 0) + 1;
      operationsByType[metric.operation] = (operationsByType[metric.operation] || 0) + 1;
    });

    return {
      totalOperations,
      averageDuration: Math.round(totalDuration / totalOperations * 100) / 100,
      successRate: Math.round(successfulOperations / totalOperations * 100) / 100,
      slowOperations,
      operationsByStore,
      operationsByType,
    };
  }

  /**
   * Get slow operations
   */
  getSlowOperations(limit = 10): OperationMetric[] {
    return this.metrics
      .filter(m => m.duration > this.slowOperationThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get operations for a specific store
   */
  getStoreMetrics(storeName: string): OperationMetric[] {
    return this.metrics.filter(m => m.storeName === storeName);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      stats: this.getStats(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Decorator for monitoring database operations
   */
  static monitor<T extends any[], R>(
    operation: string,
    storeName: string
  ) {
    return function (
      _target: any,
      _propertyKey: string,
      descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
    ) {
      const originalMethod = descriptor.value!;

      descriptor.value = async function (...args: T): Promise<R> {
        const monitor = PerformanceMonitor.getInstance();
        const startTime = performance.now();
        let success = true;
        let result: R | undefined;

        try {
          result = await originalMethod.apply(this, args);
          return result;
        } catch (error) {
          success = false;
          throw error;
        } finally {
          const duration = performance.now() - startTime;
          const recordCount = Array.isArray(result) ? result.length : (result ? 1 : 0);
          
          monitor.recordOperation(
            operation,
            storeName,
            duration,
            success,
            recordCount
          );
        }
      };

      return descriptor;
    };
  }
}

/**
 * Utility function to measure operation performance
 */
export async function measurePerformance<T>(
  operation: string,
  storeName: string,
  fn: () => Promise<T>
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = performance.now();
  let success = true;
  let result: T | undefined;

  try {
    result = await fn();
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = performance.now() - startTime;
    const recordCount = Array.isArray(result) ? result.length : (result ? 1 : 0);
    
    monitor.recordOperation(
      operation,
      storeName,
      duration,
      success,
      recordCount
    );
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();