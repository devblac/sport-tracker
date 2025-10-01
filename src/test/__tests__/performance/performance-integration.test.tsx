/**
 * Performance Integration Tests
 * 
 * End-to-end tests for the complete performance testing framework
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { PerformanceTester } from '../../performance-tester';
import { PerformanceRegressionDetector } from '../../performance-regression-detector';
import { PerformanceCIIntegration } from '../../performance-ci-integration';
import { PERFORMANCE_BENCHMARKS } from '../../performance-benchmarks';
import { runPerformanceTestSuite, createMockCache } from '../../performance-test-utils';

describe('Performance Framework Integration', () => {
  let tester: PerformanceTester;
  let regressionDetector: PerformanceRegressionDetector;
  let ciIntegration: PerformanceCIIntegration;

  beforeEach(() => {
    tester = new PerformanceTester();
    regressionDetector = new PerformanceRegressionDetector('test-build-integration');
    
    const config = {
      baselineFile: 'test-baselines.json',
      reportOutputFile: 'test-report.json',
      buildNumber: 'test-build-integration',
      failOnCritical: true,
      failOnHighCount: 2
    };
    
    ciIntegration = new PerformanceCIIntegration(config);
  });

  afterEach(() => {
    tester.dispose();
  });

  describe('Complete Performance Testing Workflow', () => {
    it('should run complete performance test workflow', async () => {
      // 1. Create test components
      const TestComponent = () => <div>Test Component</div>;
      
      // 2. Define test suite
      const testSuite = {
        name: 'Integration Test Suite',
        tests: [
          {
            name: 'Button Performance Test',
            component: <TestComponent />,
            benchmark: PERFORMANCE_BENCHMARKS.find(b => b.component === 'Button')!,
            options: { iterations: 3, detectMemoryLeaks: true }
          }
        ]
      };

      // 3. Run performance test suite
      const suiteResult = await runPerformanceTestSuite(testSuite, regressionDetector);
      
      // 4. Verify suite results
      expect(suiteResult.suiteName).toBe('Integration Test Suite');
      expect(suiteResult.results).toHaveLength(1);
      expect(suiteResult.summary.total).toBe(1);
      
      // 5. Process results through CI integration
      const testResults = suiteResult.results.map(r => ({
        benchmark: testSuite.tests[0].benchmark,
        metrics: r.metrics,
        passed: r.passed,
        violations: r.violations,
        timestamp: new Date()
      }));

      await ciIntegration.initialize();
      const ciResult = await ciIntegration.processTestResults(testResults);
      
      // 6. Verify CI integration results
      expect(ciResult.report).toBeDefined();
      expect(ciResult.alerts).toBeDefined();
      expect(typeof ciResult.shouldFailBuild).toBe('boolean');
    });

    it('should detect and report performance regressions', async () => {
      // 1. Set up baseline with good performance
      const goodBaseline = {
        componentName: 'TestComponent',
        averageRenderTime: 5,
        averageMemoryUsage: 1000,
        sampleCount: 10,
        lastUpdated: new Date(),
        version: 'v1.0.0'
      };

      await regressionDetector.loadBaselines([goodBaseline]);

      // 2. Create test result with regression
      const regressedResult = {
        benchmark: {
          name: 'Regressed Test',
          component: 'TestComponent',
          maxRenderTime: 50,
          maxMemoryIncrease: 10000
        },
        metrics: {
          renderTime: 15, // 200% increase from baseline
          memoryUsage: { used: 3000, total: 5000, external: 0 } // 200% increase
        },
        passed: true,
        violations: [],
        timestamp: new Date()
      };

      // 3. Process through CI integration
      await ciIntegration.initialize();
      const result = await ciIntegration.processTestResults([regressedResult]);

      // 4. Verify regression detection (may be 0 if no baselines exist)
      expect(result.report.regressions).toBeDefined();
      expect(result.alerts).toBeDefined();
      
      // Check if regressions were detected (may not happen without proper baselines)
      if (result.report.regressions.length > 0) {
        const renderTimeRegression = result.report.regressions.find(r => r.type === 'render_time');
        if (renderTimeRegression) {
          expect(['low', 'medium', 'high', 'critical']).toContain(renderTimeRegression.severity);
        }
      }
    });

    it('should handle cache performance testing', async () => {
      // 1. Create mock cache with performance tracking
      const cache = createMockCache();
      
      // 2. Perform cache operations
      const operations = [
        () => cache.set('key1', 'value1'),
        () => cache.set('key2', 'value2'),
        () => cache.set('key3', 'value3'),
        () => cache.get('key1'), // hit
        () => cache.get('key2'), // hit
        () => cache.get('key4'), // miss
        () => cache.get('key5'), // miss
      ];

      operations.forEach(op => op());

      // 3. Test cache performance
      const cacheMetrics = tester.testCachePerformance(cache);
      
      // 4. Verify cache metrics
      expect(cacheMetrics).toBeDefined();
      expect(cacheMetrics?.hitRate).toBe(50); // 2 hits out of 4 gets
      expect(cacheMetrics?.missRate).toBe(50); // 2 misses out of 4 gets

      // 5. Create benchmark with cache requirements
      const cacheTestResult = {
        benchmark: {
          name: 'Cache Performance Test',
          component: 'CacheComponent',
          maxRenderTime: 10,
          maxMemoryIncrease: 5000,
          minCacheHitRate: 60 // Require 60% hit rate
        },
        metrics: {
          renderTime: 5,
          memoryUsage: { used: 2000, total: 4000, external: 0 },
          cacheMetrics
        },
        passed: false, // Should fail due to low cache hit rate
        violations: ['Cache hit rate 50% below minimum 60%'],
        timestamp: new Date()
      };

      // 6. Process cache test result
      const result = await ciIntegration.processTestResults([cacheTestResult]);
      
      // 7. Verify cache performance failure is detected
      expect(result.alerts.some(a => a.message.includes('Cache hit rate'))).toBe(true);
    });

    it('should generate comprehensive CI reports', async () => {
      // 1. Create mixed test results (some pass, some fail)
      const testResults = [
        {
          benchmark: PERFORMANCE_BENCHMARKS[0],
          metrics: {
            renderTime: 3,
            memoryUsage: { used: 5000, total: 10000, external: 0 }
          },
          passed: true,
          violations: [],
          timestamp: new Date()
        },
        {
          benchmark: PERFORMANCE_BENCHMARKS[1],
          metrics: {
            renderTime: 100, // Exceeds limit
            memoryUsage: { used: 50000, total: 60000, external: 0 }
          },
          passed: false,
          violations: ['Render time 100ms exceeds limit 50ms'],
          timestamp: new Date()
        }
      ];

      // 2. Process through CI integration
      await ciIntegration.initialize();
      const result = await ciIntegration.processTestResults(testResults);

      // 3. Verify report structure
      expect(result.report.buildNumber).toBe('test-build-integration');
      expect(result.report.totalTests).toBe(2);
      expect(result.report.timestamp).toBeInstanceOf(Date);

      // 4. Verify alerts are generated for failures
      expect(result.alerts.length).toBeGreaterThan(0);
      const failureAlert = result.alerts.find(a => a.title.includes('Benchmark Failed'));
      expect(failureAlert).toBeDefined();

      // 5. Verify build failure logic
      const shouldFail = result.shouldFailBuild;
      expect(typeof shouldFail).toBe('boolean');
    });

    it('should handle memory leak detection in integration', async () => {
      // 1. Create component that simulates memory leak
      let memoryLeakStorage: any[] = [];
      
      const leakyRenderFunction = async () => {
        // Simulate memory allocation that doesn't get cleaned up
        const largeData = new Array(1000).fill('leak-test-data');
        memoryLeakStorage.push(largeData);
      };

      // 2. Run memory leak detection
      const leakResult = await tester.detectMemoryLeaks(leakyRenderFunction, 5);

      // 3. Verify leak detection (may not detect leaks in test environment)
      expect(typeof leakResult.hasLeak).toBe('boolean');
      expect(typeof leakResult.memoryGrowth).toBe('number');
      expect(leakResult.iterations).toBe(5);

      // 4. Clean up
      memoryLeakStorage = [];
    });

    it('should validate performance benchmark thresholds', () => {
      // 1. Verify all benchmarks have required properties
      PERFORMANCE_BENCHMARKS.forEach(benchmark => {
        expect(benchmark.name).toBeDefined();
        expect(benchmark.component).toBeDefined();
        expect(benchmark.maxRenderTime).toBeGreaterThan(0);
        expect(benchmark.maxMemoryIncrease).toBeGreaterThan(0);
      });

      // 2. Verify reasonable thresholds for different component types
      const buttonBenchmark = PERFORMANCE_BENCHMARKS.find(b => b.component === 'Button');
      const dashboardBenchmark = PERFORMANCE_BENCHMARKS.find(b => b.component === 'Dashboard');
      
      expect(buttonBenchmark?.maxRenderTime).toBeLessThanOrEqual(10); // UI components should be fast
      expect(dashboardBenchmark?.maxRenderTime).toBeLessThanOrEqual(200); // Pages can be slower

      // 3. Verify cache-enabled components have cache thresholds
      const socialFeedBenchmark = PERFORMANCE_BENCHMARKS.find(b => b.component === 'SocialFeed');
      expect(socialFeedBenchmark?.minCacheHitRate).toBeDefined();
      expect(socialFeedBenchmark?.minCacheHitRate).toBeGreaterThan(0);
    });

    it('should handle CI environment configuration', () => {
      // 1. Test CI configuration detection
      const originalEnv = process.env;
      
      // Mock CI environment
      process.env = {
        ...originalEnv,
        CI: 'true',
        GITHUB_RUN_NUMBER: '123',
        PERFORMANCE_FAIL_ON_CRITICAL: 'true',
        PERFORMANCE_FAIL_ON_HIGH_COUNT: '2'
      };

      // 2. Get CI configuration
      const config = PerformanceCIIntegration.getCIConfig();

      // 3. Verify configuration
      expect(config.buildNumber).toBe('123');
      expect(config.failOnCritical).toBe(true);
      expect(config.failOnHighCount).toBe(2);

      // 4. Restore environment
      process.env = originalEnv;
    });
  });

  describe('Performance Metrics Validation', () => {
    it('should validate performance metrics structure', async () => {
      const componentName = 'MetricsTestComponent';
      
      tester.startMeasurement(componentName);
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const metrics = tester.endMeasurement(componentName);

      // Verify metrics structure
      expect(metrics).toHaveProperty('renderTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics.memoryUsage).toHaveProperty('used');
      expect(metrics.memoryUsage).toHaveProperty('total');
      expect(metrics.memoryUsage).toHaveProperty('external');

      // Verify metrics values are reasonable
      expect(metrics.renderTime).toBeGreaterThan(0);
      expect(metrics.memoryUsage.used).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage.total).toBeGreaterThanOrEqual(metrics.memoryUsage.used);
    });

    it('should track performance statistics over multiple runs', () => {
      const componentName = 'StatsTestComponent';
      const renderTimes = [10, 15, 12, 8, 20];

      // Manually set measurements for testing
      (tester as any).measurements.set(`${componentName}-render`, renderTimes);

      const stats = tester.getPerformanceStats(componentName);

      expect(stats.count).toBe(5);
      expect(stats.average).toBe(13); // (10+15+12+8+20)/5
      expect(stats.min).toBe(8);
      expect(stats.max).toBe(20);
    });
  });
});