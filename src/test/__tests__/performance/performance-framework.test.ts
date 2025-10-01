/**
 * Performance Framework Tests
 * 
 * Tests for the performance testing framework components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceTester, PerformanceMetrics } from '../../performance-tester';
import { PerformanceRegressionDetector, PerformanceBaseline } from '../../performance-regression-detector';
import { PERFORMANCE_BENCHMARKS, getBenchmarkByComponent } from '../../performance-benchmarks';
import { createMockCache, testCachePerformance } from '../../performance-test-utils';

describe('Performance Testing Framework', () => {
  let performanceTester: PerformanceTester;
  let regressionDetector: PerformanceRegressionDetector;

  beforeEach(() => {
    performanceTester = new PerformanceTester();
    regressionDetector = new PerformanceRegressionDetector('test-build-123');
    
    // Mock performance API
    vi.stubGlobal('performance', {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      getEntriesByType: vi.fn(() => []),
      getEntriesByName: vi.fn(() => [])
    });
  });

  afterEach(() => {
    performanceTester.dispose();
    vi.unstubAllGlobals();
  });

  describe('PerformanceTester', () => {
    it('should measure component render time', () => {
      const componentName = 'TestComponent';
      
      performanceTester.startMeasurement(componentName);
      
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait for 10ms
      }
      
      const metrics = performanceTester.endMeasurement(componentName);
      
      expect(metrics.renderTime).toBeGreaterThan(0);
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.memoryUsage.used).toBeGreaterThanOrEqual(0);
    });

    it('should detect memory leaks', async () => {
      const leakyFunction = vi.fn(() => {
        // Simulate memory allocation
        const largeArray = new Array(1000).fill('memory-leak-test');
        return largeArray;
      });

      const result = await performanceTester.detectMemoryLeaks(leakyFunction, 5);
      
      expect(result).toBeDefined();
      expect(result.iterations).toBe(5);
      expect(typeof result.hasLeak).toBe('boolean');
      expect(typeof result.memoryGrowth).toBe('number');
    });

    it('should test cache performance', () => {
      const mockCache = createMockCache();
      
      const cacheMetrics = performanceTester.testCachePerformance(mockCache);
      
      expect(cacheMetrics).toBeDefined();
      expect(cacheMetrics?.hitRate).toBe(0); // No hits initially
      expect(cacheMetrics?.missRate).toBe(0); // No misses initially
    });

    it('should run benchmark validation', async () => {
      const benchmark = getBenchmarkByComponent('Button');
      expect(benchmark).toBeDefined();

      if (benchmark) {
        const mockMetrics: PerformanceMetrics = {
          renderTime: 3, // Under 5ms limit
          memoryUsage: { used: 5000, total: 10000, external: 0 } // Under 10KB limit
        };

        const result = await performanceTester.runBenchmark(benchmark, async () => mockMetrics);
        
        expect(result.passed).toBe(true);
        expect(result.violations).toHaveLength(0);
      }
    });

    it('should fail benchmark when limits exceeded', async () => {
      const benchmark = getBenchmarkByComponent('Button');
      expect(benchmark).toBeDefined();

      if (benchmark) {
        const mockMetrics: PerformanceMetrics = {
          renderTime: 15, // Over 5ms limit
          memoryUsage: { used: 50000, total: 60000, external: 0 } // Over 10KB limit
        };

        const result = await performanceTester.runBenchmark(benchmark, async () => mockMetrics);
        
        expect(result.passed).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
        expect(result.violations[0]).toContain('Render time');
      }
    });

    it('should track performance statistics', () => {
      const componentName = 'StatTestComponent';
      
      // Simulate multiple measurements
      for (let i = 0; i < 5; i++) {
        performanceTester.startMeasurement(componentName);
        const metrics = performanceTester.endMeasurement(componentName);
        // Manually add to measurements for testing
        (performanceTester as any).measurements.set(`${componentName}-render`, [10, 15, 12, 8, 20]);
      }
      
      const stats = performanceTester.getPerformanceStats(componentName);
      
      expect(stats.count).toBe(5);
      expect(stats.average).toBe(13); // (10+15+12+8+20)/5
      expect(stats.min).toBe(8);
      expect(stats.max).toBe(20);
    });
  });

  describe('PerformanceRegressionDetector', () => {
    it('should load and store baselines', async () => {
      const baselines: PerformanceBaseline[] = [
        {
          componentName: 'TestComponent',
          averageRenderTime: 10,
          averageMemoryUsage: 5000,
          sampleCount: 10,
          lastUpdated: new Date(),
          version: 'v1.0.0'
        }
      ];

      await regressionDetector.loadBaselines(baselines);
      const exported = regressionDetector.exportBaselines();
      
      expect(exported).toHaveLength(1);
      expect(exported[0].componentName).toBe('TestComponent');
    });

    it('should detect render time regression', async () => {
      // Set up baseline
      const baseline: PerformanceBaseline = {
        componentName: 'TestComponent',
        averageRenderTime: 10,
        averageMemoryUsage: 5000,
        sampleCount: 10,
        lastUpdated: new Date(),
        version: 'v1.0.0'
      };

      await regressionDetector.loadBaselines([baseline]);

      // Create test result with regression
      const testResult = {
        benchmark: {
          name: 'Test Benchmark',
          component: 'TestComponent',
          maxRenderTime: 50,
          maxMemoryIncrease: 10000
        },
        metrics: {
          renderTime: 25, // 150% increase from baseline of 10ms
          memoryUsage: { used: 6000, total: 10000, external: 0 }
        },
        passed: true,
        violations: [],
        timestamp: new Date()
      };

      const regressions = regressionDetector.detectRegressions(testResult);
      
      expect(regressions).toHaveLength(1);
      expect(regressions[0].type).toBe('render_time');
      expect(regressions[0].severity).toBe('high'); // 150% increase
    });

    it('should generate regression report', async () => {
      const testResults = [
        {
          benchmark: {
            name: 'Test Benchmark',
            component: 'TestComponent',
            maxRenderTime: 50,
            maxMemoryIncrease: 10000
          },
          metrics: {
            renderTime: 5,
            memoryUsage: { used: 3000, total: 10000, external: 0 }
          },
          passed: true,
          violations: [],
          timestamp: new Date()
        }
      ];

      const report = regressionDetector.generateRegressionReport(testResults);
      
      expect(report.buildNumber).toBe('test-build-123');
      expect(report.totalTests).toBe(1);
      expect(report.summary).toBeDefined();
      expect(report.regressions).toBeDefined();
    });

    it('should determine build failure based on regressions', () => {
      const reportWithCritical = {
        buildNumber: 'test',
        timestamp: new Date(),
        totalTests: 1,
        regressions: [],
        summary: { critical: 1, high: 0, medium: 0, low: 0 }
      };

      const reportWithManyHigh = {
        buildNumber: 'test',
        timestamp: new Date(),
        totalTests: 1,
        regressions: [],
        summary: { critical: 0, high: 3, medium: 0, low: 0 }
      };

      const reportOk = {
        buildNumber: 'test',
        timestamp: new Date(),
        totalTests: 1,
        regressions: [],
        summary: { critical: 0, high: 1, medium: 2, low: 3 }
      };

      expect(regressionDetector.shouldFailBuild(reportWithCritical)).toBe(true);
      expect(regressionDetector.shouldFailBuild(reportWithManyHigh)).toBe(true);
      expect(regressionDetector.shouldFailBuild(reportOk)).toBe(false);
    });
  });

  describe('Cache Performance Testing', () => {
    it('should test cache hit and miss rates', () => {
      const cache = createMockCache();
      
      const operations = [
        () => cache.set('key1', 'value1'),
        () => cache.set('key2', 'value2'),
        () => cache.get('key1'), // hit
        () => cache.get('key2'), // hit
        () => cache.get('key3'), // miss
        () => cache.get('key4'), // miss
      ];

      const result = testCachePerformance(cache, operations);
      
      expect(result.hitRate).toBe(50); // 2 hits out of 4 gets
      expect(result.missRate).toBe(50); // 2 misses out of 4 gets
    });

    it('should track cache evictions', () => {
      const cache = createMockCache();
      
      // Fill cache beyond capacity to trigger evictions
      const operations = [];
      for (let i = 0; i < 105; i++) { // Exceeds maxSize of 100
        operations.push(() => cache.set(`key${i}`, `value${i}`));
      }

      const result = testCachePerformance(cache, operations);
      
      expect(result.finalStats.evictions).toBeGreaterThan(0);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should have benchmarks for critical components', () => {
      const criticalComponents = [
        'Button', 'WorkoutPlayer', 'SocialFeed', 'Dashboard'
      ];

      criticalComponents.forEach(component => {
        const benchmark = getBenchmarkByComponent(component);
        expect(benchmark).toBeDefined();
        expect(benchmark?.maxRenderTime).toBeGreaterThan(0);
        expect(benchmark?.maxMemoryIncrease).toBeGreaterThan(0);
      });
    });

    it('should have reasonable performance thresholds', () => {
      PERFORMANCE_BENCHMARKS.forEach(benchmark => {
        // UI components should render quickly
        if (benchmark.component === 'Button' || benchmark.component === 'Input') {
          expect(benchmark.maxRenderTime).toBeLessThanOrEqual(10);
        }
        
        // Page components can take longer
        if (benchmark.component.includes('Page') || benchmark.component === 'Dashboard') {
          expect(benchmark.maxRenderTime).toBeLessThanOrEqual(200);
        }
        
        // All components should have memory limits
        expect(benchmark.maxMemoryIncrease).toBeGreaterThan(0);
      });
    });
  });
});