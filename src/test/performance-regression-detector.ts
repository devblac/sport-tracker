/**
 * Performance Regression Detection System
 * 
 * Detects performance regressions by comparing current metrics
 * against historical baselines and alerting on significant degradations
 */

import { PerformanceTestResult, PerformanceMetrics } from './performance-tester';
import { REGRESSION_DETECTION } from './performance-benchmarks';

export interface PerformanceBaseline {
  componentName: string;
  averageRenderTime: number;
  averageMemoryUsage: number;
  sampleCount: number;
  lastUpdated: Date;
  version: string;
}

export interface RegressionAlert {
  type: 'render_time' | 'memory_usage' | 'cache_performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  componentName: string;
  currentValue: number;
  baselineValue: number;
  degradationPercentage: number;
  message: string;
  timestamp: Date;
  buildNumber?: string;
}

export interface RegressionReport {
  buildNumber: string;
  timestamp: Date;
  totalTests: number;
  regressions: RegressionAlert[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export class PerformanceRegressionDetector {
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private historicalData: Map<string, PerformanceTestResult[]> = new Map();

  constructor(private buildNumber: string = 'unknown') {}

  /**
   * Load baselines from storage
   */
  async loadBaselines(baselineData?: PerformanceBaseline[]): Promise<void> {
    if (baselineData) {
      baselineData.forEach(baseline => {
        this.baselines.set(baseline.componentName, baseline);
      });
    }
  }

  /**
   * Update baseline for a component
   */
  updateBaseline(componentName: string, results: PerformanceTestResult[]): void {
    if (results.length < REGRESSION_DETECTION.BASELINE_SAMPLES) {
      console.warn(`Insufficient samples for ${componentName} baseline (need ${REGRESSION_DETECTION.BASELINE_SAMPLES}, got ${results.length})`);
      return;
    }

    const renderTimes = results.map(r => r.metrics.renderTime);
    const memoryUsages = results.map(r => r.metrics.memoryUsage.used);

    const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const averageMemoryUsage = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;

    const baseline: PerformanceBaseline = {
      componentName,
      averageRenderTime,
      averageMemoryUsage,
      sampleCount: results.length,
      lastUpdated: new Date(),
      version: this.buildNumber
    };

    this.baselines.set(componentName, baseline);
  }

  /**
   * Detect regressions in a test result
   */
  detectRegressions(result: PerformanceTestResult): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];
    const baseline = this.baselines.get(result.benchmark.component);

    if (!baseline) {
      // No baseline available, store this result for future baseline creation
      this.addHistoricalData(result);
      return alerts;
    }

    // Check render time regression
    const renderTimeRegression = this.checkRenderTimeRegression(result, baseline);
    if (renderTimeRegression) {
      alerts.push(renderTimeRegression);
    }

    // Check memory usage regression
    const memoryRegression = this.checkMemoryRegression(result, baseline);
    if (memoryRegression) {
      alerts.push(memoryRegression);
    }

    // Check cache performance regression
    const cacheRegression = this.checkCacheRegression(result, baseline);
    if (cacheRegression) {
      alerts.push(cacheRegression);
    }

    // Store result for historical tracking
    this.addHistoricalData(result);

    return alerts;
  }

  private checkRenderTimeRegression(
    result: PerformanceTestResult, 
    baseline: PerformanceBaseline
  ): RegressionAlert | null {
    const currentRenderTime = result.metrics.renderTime;
    const baselineRenderTime = baseline.averageRenderTime;
    
    const degradationRatio = currentRenderTime / baselineRenderTime;
    
    if (degradationRatio <= REGRESSION_DETECTION.REGRESSION_THRESHOLD) {
      return null; // No regression
    }

    const degradationPercentage = ((degradationRatio - 1) * 100);
    const severity = this.calculateSeverity(degradationRatio, 'render_time');

    return {
      type: 'render_time',
      severity,
      componentName: result.benchmark.component,
      currentValue: currentRenderTime,
      baselineValue: baselineRenderTime,
      degradationPercentage,
      message: `Render time increased by ${degradationPercentage.toFixed(1)}% (${currentRenderTime.toFixed(2)}ms vs ${baselineRenderTime.toFixed(2)}ms baseline)`,
      timestamp: new Date(),
      buildNumber: this.buildNumber
    };
  }

  private checkMemoryRegression(
    result: PerformanceTestResult, 
    baseline: PerformanceBaseline
  ): RegressionAlert | null {
    const currentMemoryUsage = result.metrics.memoryUsage.used;
    const baselineMemoryUsage = baseline.averageMemoryUsage;
    
    const degradationRatio = currentMemoryUsage / baselineMemoryUsage;
    
    if (degradationRatio <= REGRESSION_DETECTION.MEMORY_REGRESSION_THRESHOLD) {
      return null; // No regression
    }

    const degradationPercentage = ((degradationRatio - 1) * 100);
    const severity = this.calculateSeverity(degradationRatio, 'memory_usage');

    return {
      type: 'memory_usage',
      severity,
      componentName: result.benchmark.component,
      currentValue: currentMemoryUsage,
      baselineValue: baselineMemoryUsage,
      degradationPercentage,
      message: `Memory usage increased by ${degradationPercentage.toFixed(1)}% (${(currentMemoryUsage / 1024).toFixed(2)}KB vs ${(baselineMemoryUsage / 1024).toFixed(2)}KB baseline)`,
      timestamp: new Date(),
      buildNumber: this.buildNumber
    };
  }

  private checkCacheRegression(
    result: PerformanceTestResult, 
    baseline: PerformanceBaseline
  ): RegressionAlert | null {
    const cacheMetrics = result.metrics.cacheMetrics;
    if (!cacheMetrics || !result.benchmark.minCacheHitRate) {
      return null; // No cache metrics to check
    }

    const currentHitRate = cacheMetrics.hitRate;
    const expectedHitRate = result.benchmark.minCacheHitRate;
    
    if (currentHitRate >= expectedHitRate) {
      return null; // No regression
    }

    const degradationPercentage = expectedHitRate - currentHitRate;
    const severity = this.calculateCacheSeverity(degradationPercentage);

    return {
      type: 'cache_performance',
      severity,
      componentName: result.benchmark.component,
      currentValue: currentHitRate,
      baselineValue: expectedHitRate,
      degradationPercentage,
      message: `Cache hit rate dropped by ${degradationPercentage.toFixed(1)}% (${currentHitRate.toFixed(1)}% vs ${expectedHitRate}% expected)`,
      timestamp: new Date(),
      buildNumber: this.buildNumber
    };
  }

  private calculateSeverity(
    degradationRatio: number, 
    type: 'render_time' | 'memory_usage'
  ): RegressionAlert['severity'] {
    const threshold = type === 'render_time' 
      ? REGRESSION_DETECTION.REGRESSION_THRESHOLD 
      : REGRESSION_DETECTION.MEMORY_REGRESSION_THRESHOLD;

    if (degradationRatio >= threshold * 3) return 'critical'; // 260%+ degradation for render_time, 350%+ for memory
    if (degradationRatio >= threshold * 2) return 'high';     // 140%+ degradation for render_time, 200%+ for memory  
    if (degradationRatio >= threshold * 1.5) return 'medium'; // 80%+ degradation for render_time, 125%+ for memory
    return 'low';
  }

  private calculateCacheSeverity(degradationPercentage: number): RegressionAlert['severity'] {
    if (degradationPercentage >= 30) return 'critical'; // 30%+ drop
    if (degradationPercentage >= 20) return 'high';     // 20%+ drop
    if (degradationPercentage >= 10) return 'medium';   // 10%+ drop
    return 'low';
  }

  private addHistoricalData(result: PerformanceTestResult): void {
    const componentName = result.benchmark.component;
    const existing = this.historicalData.get(componentName) || [];
    existing.push(result);
    
    // Keep only last 50 results for each component
    if (existing.length > 50) {
      existing.splice(0, existing.length - 50);
    }
    
    this.historicalData.set(componentName, existing);
  }

  /**
   * Generate regression report for current build
   */
  generateRegressionReport(results: PerformanceTestResult[]): RegressionReport {
    const allRegressions: RegressionAlert[] = [];
    
    results.forEach(result => {
      const regressions = this.detectRegressions(result);
      allRegressions.push(...regressions);
    });

    const summary = {
      critical: allRegressions.filter(r => r.severity === 'critical').length,
      high: allRegressions.filter(r => r.severity === 'high').length,
      medium: allRegressions.filter(r => r.severity === 'medium').length,
      low: allRegressions.filter(r => r.severity === 'low').length
    };

    return {
      buildNumber: this.buildNumber,
      timestamp: new Date(),
      totalTests: results.length,
      regressions: allRegressions,
      summary
    };
  }

  /**
   * Check if build should fail based on regressions
   */
  shouldFailBuild(report: RegressionReport): boolean {
    return report.summary.critical > 0 || report.summary.high > 2;
  }

  /**
   * Get performance trends for a component
   */
  getPerformanceTrends(componentName: string): {
    renderTimeTrend: number[];
    memoryUsageTrend: number[];
    timestamps: Date[];
  } {
    const data = this.historicalData.get(componentName) || [];
    
    return {
      renderTimeTrend: data.map(d => d.metrics.renderTime),
      memoryUsageTrend: data.map(d => d.metrics.memoryUsage.used),
      timestamps: data.map(d => d.timestamp)
    };
  }

  /**
   * Export baselines for storage
   */
  exportBaselines(): PerformanceBaseline[] {
    return Array.from(this.baselines.values());
  }

  /**
   * Get regression statistics
   */
  getRegressionStatistics(): {
    totalComponents: number;
    componentsWithBaselines: number;
    averageRenderTime: number;
    averageMemoryUsage: number;
  } {
    const baselines = Array.from(this.baselines.values());
    
    return {
      totalComponents: this.historicalData.size,
      componentsWithBaselines: baselines.length,
      averageRenderTime: baselines.reduce((sum, b) => sum + b.averageRenderTime, 0) / baselines.length || 0,
      averageMemoryUsage: baselines.reduce((sum, b) => sum + b.averageMemoryUsage, 0) / baselines.length || 0
    };
  }
}