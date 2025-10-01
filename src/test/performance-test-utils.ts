/**
 * Performance Testing Utilities
 * 
 * Provides helper functions and utilities for performance testing
 * including React component testing, cache testing, and CI integration
 */

import { render, RenderResult } from '@testing-library/react';
import { ReactElement } from 'react';
import { PerformanceTester, PerformanceMetrics, PerformanceBenchmark } from './performance-tester';
import { PerformanceRegressionDetector, RegressionReport } from './performance-regression-detector';
import { getBenchmarkByComponent, createCustomBenchmark } from './performance-benchmarks';

export interface ComponentPerformanceTestOptions {
  iterations?: number;
  warmupRuns?: number;
  detectMemoryLeaks?: boolean;
  customBenchmark?: Partial<PerformanceBenchmark>;
}

export interface PerformanceTestSuite {
  name: string;
  tests: ComponentPerformanceTest[];
}

export interface ComponentPerformanceTest {
  name: string;
  component: ReactElement;
  benchmark: PerformanceBenchmark;
  options?: ComponentPerformanceTestOptions;
}

/**
 * Test React component performance
 */
export async function testComponentPerformance(
  componentName: string,
  component: ReactElement,
  options: ComponentPerformanceTestOptions = {}
): Promise<{
  metrics: PerformanceMetrics;
  passed: boolean;
  violations: string[];
  memoryLeakDetection?: {
    hasLeak: boolean;
    memoryGrowth: number;
  };
}> {
  const {
    iterations = 1,
    warmupRuns = 3,
    detectMemoryLeaks = false,
    customBenchmark
  } = options;

  const tester = new PerformanceTester();
  
  // Get or create benchmark
  let benchmark = getBenchmarkByComponent(componentName);
  if (!benchmark) {
    benchmark = createCustomBenchmark(componentName, 'UI_COMPONENTS', customBenchmark);
  } else if (customBenchmark) {
    benchmark = { ...benchmark, ...customBenchmark };
  }

  try {
    // Warmup runs to stabilize performance
    for (let i = 0; i < warmupRuns; i++) {
      const { unmount } = render(component);
      unmount();
    }

    // Main performance test
    tester.startMeasurement(componentName);
    
    let renderResult: RenderResult | null = null;
    for (let i = 0; i < iterations; i++) {
      renderResult = render(component);
      if (i < iterations - 1) {
        renderResult.unmount();
      }
    }

    const metrics = tester.endMeasurement(componentName);

    // Memory leak detection if requested
    let memoryLeakDetection;
    if (detectMemoryLeaks && renderResult) {
      memoryLeakDetection = await tester.detectMemoryLeaks(async () => {
        const { unmount } = render(component);
        unmount();
      }, 10);
    }

    // Run benchmark validation
    const result = await tester.runBenchmark(benchmark, async () => metrics);

    // Cleanup
    if (renderResult) {
      renderResult.unmount();
    }

    return {
      metrics,
      passed: result.passed,
      violations: result.violations,
      memoryLeakDetection
    };
  } finally {
    tester.dispose();
  }
}

/**
 * Test cache performance
 */
export function testCachePerformance(cache: any, operations: Array<() => void>): {
  initialStats: any;
  finalStats: any;
  hitRate: number;
  missRate: number;
  evictionRate: number;
} {
  const tester = new PerformanceTester();
  
  // Get initial stats
  const initialStats = cache.getStats ? cache.getStats() : { hits: 0, misses: 0, evictions: 0 };
  
  // Run operations
  operations.forEach(operation => operation());
  
  // Get final stats
  const finalStats = cache.getStats ? cache.getStats() : { hits: 0, misses: 0, evictions: 0 };
  
  const totalRequests = finalStats.hits + finalStats.misses;
  const hitRate = totalRequests > 0 ? (finalStats.hits / totalRequests) * 100 : 0;
  const missRate = totalRequests > 0 ? (finalStats.misses / totalRequests) * 100 : 0;
  const evictionRate = finalStats.evictions > 0 ? (finalStats.evictions / totalRequests) * 100 : 0;

  tester.dispose();

  return {
    initialStats,
    finalStats,
    hitRate,
    missRate,
    evictionRate
  };
}

/**
 * Run performance test suite
 */
export async function runPerformanceTestSuite(
  suite: PerformanceTestSuite,
  regressionDetector?: PerformanceRegressionDetector
): Promise<{
  suiteName: string;
  results: Array<{
    testName: string;
    passed: boolean;
    metrics: PerformanceMetrics;
    violations: string[];
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  regressionReport?: RegressionReport;
}> {
  const results = [];
  
  for (const test of suite.tests) {
    try {
      const result = await testComponentPerformance(
        test.benchmark.component,
        test.component,
        test.options
      );

      results.push({
        testName: test.name,
        passed: result.passed,
        metrics: result.metrics,
        violations: result.violations
      });

      // Add to regression detection if available
      if (regressionDetector) {
        const tester = new PerformanceTester();
        const benchmarkResult = await tester.runBenchmark(test.benchmark, async () => result.metrics);
        regressionDetector.detectRegressions(benchmarkResult);
        tester.dispose();
      }
    } catch (error) {
      results.push({
        testName: test.name,
        passed: false,
        metrics: { renderTime: 0, memoryUsage: { used: 0, total: 0, external: 0 } },
        violations: [`Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
    }
  }

  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length
  };

  // Generate regression report if detector is available
  let regressionReport;
  if (regressionDetector) {
    const testResults = results.map(r => ({
      benchmark: suite.tests.find(t => t.name === r.testName)!.benchmark,
      metrics: r.metrics,
      passed: r.passed,
      violations: r.violations,
      timestamp: new Date()
    }));
    regressionReport = regressionDetector.generateRegressionReport(testResults);
  }

  return {
    suiteName: suite.name,
    results,
    summary,
    regressionReport
  };
}

/**
 * Create a mock cache for testing
 */
export function createMockCache(): {
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  delete: (key: string) => boolean;
  clear: () => void;
  getStats: () => { hits: number; misses: number; evictions: number };
} {
  const cache = new Map();
  let hits = 0;
  let misses = 0;
  let evictions = 0;
  const maxSize = 100;

  return {
    get(key: string) {
      if (cache.has(key)) {
        hits++;
        return cache.get(key);
      } else {
        misses++;
        return undefined;
      }
    },
    
    set(key: string, value: any) {
      if (cache.size >= maxSize && !cache.has(key)) {
        // Evict oldest entry
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
        evictions++;
      }
      cache.set(key, value);
    },
    
    delete(key: string) {
      return cache.delete(key);
    },
    
    clear() {
      cache.clear();
      hits = 0;
      misses = 0;
      evictions = 0;
    },
    
    getStats() {
      return { hits, misses, evictions };
    }
  };
}

/**
 * Performance test wrapper for Vitest
 */
export function performanceTest(
  name: string,
  testFn: () => Promise<void> | void,
  benchmark?: PerformanceBenchmark
) {
  return async () => {
    const tester = new PerformanceTester();
    
    try {
      tester.startMeasurement(name);
      await testFn();
      const metrics = tester.endMeasurement(name);

      if (benchmark) {
        const result = await tester.runBenchmark(benchmark, async () => metrics);
        if (!result.passed) {
          throw new Error(`Performance benchmark failed: ${result.violations.join(', ')}`);
        }
      }

      // Log performance metrics
      console.log(`Performance Test: ${name}`);
      console.log(`  Render Time: ${metrics.renderTime.toFixed(2)}ms`);
      console.log(`  Memory Usage: ${(metrics.memoryUsage.used / 1024).toFixed(2)}KB`);
      
      if (metrics.cacheMetrics) {
        console.log(`  Cache Hit Rate: ${metrics.cacheMetrics.hitRate.toFixed(2)}%`);
      }
    } finally {
      tester.dispose();
    }
  };
}

/**
 * Generate performance report for CI
 */
export function generateCIPerformanceReport(
  results: Array<{ testName: string; passed: boolean; violations: string[] }>,
  regressionReport?: RegressionReport
): string {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  let report = `# Performance Test Report\n\n`;
  report += `**Total Tests:** ${totalTests}\n`;
  report += `**Passed:** ${passedTests}\n`;
  report += `**Failed:** ${failedTests}\n\n`;

  if (failedTests > 0) {
    report += `## Failed Tests\n\n`;
    results.filter(r => !r.passed).forEach(result => {
      report += `### ${result.testName}\n`;
      result.violations.forEach(violation => {
        report += `- ❌ ${violation}\n`;
      });
      report += `\n`;
    });
  }

  if (regressionReport && regressionReport.regressions.length > 0) {
    report += `## Performance Regressions\n\n`;
    report += `**Critical:** ${regressionReport.summary.critical}\n`;
    report += `**High:** ${regressionReport.summary.high}\n`;
    report += `**Medium:** ${regressionReport.summary.medium}\n`;
    report += `**Low:** ${regressionReport.summary.low}\n\n`;

    regressionReport.regressions.forEach(regression => {
      const icon = regression.severity === 'critical' ? '🚨' : 
                   regression.severity === 'high' ? '⚠️' : 
                   regression.severity === 'medium' ? '⚡' : 'ℹ️';
      
      report += `${icon} **${regression.componentName}** - ${regression.message}\n`;
    });
  }

  return report;
}

/**
 * Setup performance testing environment
 */
export function setupPerformanceTestEnvironment(): {
  cleanup: () => void;
} {
  // Mock performance APIs if not available
  if (typeof performance === 'undefined') {
    (global as any).performance = {
      now: () => Date.now(),
      mark: () => {},
      measure: () => {},
      clearMarks: () => {},
      clearMeasures: () => {},
      getEntriesByType: () => [],
      getEntriesByName: () => []
    };
  }

  // Mock memory API for Node.js environment
  if (typeof window !== 'undefined' && !('memory' in performance)) {
    (performance as any).memory = {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    };
  }

  return {
    cleanup: () => {
      // Cleanup any global mocks if needed
    }
  };
}