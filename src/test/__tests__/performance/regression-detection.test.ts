/**
 * Performance Regression Detection Tests
 * 
 * Tests the regression detection system and performance alerts
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceRegressionDetector, type PerformanceBaseline, type RegressionAlert } from '../../performance-regression-detector';
import { PerformanceTester, type PerformanceTestResult, type PerformanceBenchmark } from '../../performance-tester';
import { REGRESSION_DETECTION } from '../../performance-benchmarks';

describe('Performance Regression Detection Tests', () => {
  let regressionDetector: PerformanceRegressionDetector;
  let performanceTester: PerformanceTester;

  beforeEach(() => {
    regressionDetector = new PerformanceRegressionDetector('test-build-123');
    performanceTester = new PerformanceTester();
  });

  afterEach(() => {
    performanceTester.dispose();
  });

  describe('Baseline Management', () => {
    it('should load and store baselines correctly', async () => {
      const testBaselines: PerformanceBaseline[] = [
        {
          componentName: 'TestComponent',
          averageRenderTime: 10,
          averageMemoryUsage: 1024,
          sampleCount: 10,
          lastUpdated: new Date(),
          version: 'v1.0.0'
        }
      ];

      await regressionDetector.loadBaselines(testBaselines);
      const exportedBaselines = regressionDetector.exportBaselines();

      expect(exportedBaselines).toHaveLength(1);
      expect(exportedBaselines[0].componentName).toBe('TestComponent');
      expect(exportedBaselines[0].averageRenderTime).toBe(10);
    });

    it('should update baselines with sufficient samples', () => {
      const testResults: PerformanceTestResult[] = [];
      
      // Create 10 test results for baseline
      for (let i = 0; i < REGRESSION_DETECTION.BASELINE_SAMPLES; i++) {
        testResults.push({
          benchmark: {
            name: 'Test Benchmark',
            component: 'TestComponent',
            maxRenderTime: 50,
            maxMemoryIncrease: 1024 * 50
          },
          metrics: {
            renderTime: 10 + Math.random() * 2, // 10-12ms
            memoryUsage: {
              used: 1024 + Math.random() * 100, // ~1KB
              total: 2048,
              external: 0
            }
          },
          passed: true,
          violations: [],
          timestamp: new Date()
        });
      }

      regressionDetector.updateBaseline('TestComponent', testResults);
      const baselines = regressionDetector.exportBaselines();

      expect(baselines).toHaveLength(1);
      expect(baselines[0].componentName).toBe('TestComponent');
      expect(baselines[0].averageRenderTime).toBeGreaterThan(10);
      expect(baselines[0].averageRenderTime).toBeLessThan(12);
    });

    it('should not update baseline with insufficient samples', () => {
      const testResults: PerformanceTestResult[] = [
        {
          benchmark: {
            name: 'Test Benchmark',
            component: 'TestComponent',
            maxRenderTime: 50,
            maxMemoryIncrease: 1024 * 50
          },
          metrics: {
            renderTime: 10,
            memoryUsage: { used: 1024, total: 2048, external: 0 }
          },
          passed: true,
          violations: [],
          timestamp: new Date()
        }
      ];

      regressionDetector.updateBaseline('TestComponent', testResults);
      const baselines = regressionDetector.exportBaselines();

      expect(baselines).toHaveLength(0);
    });
  });

  describe('Regression Detection', () => {
    beforeEach(async () => {
      // Set up baseline
      const baseline: PerformanceBaseline = {
        componentName: 'TestComponent',
        averageRenderTime: 10,
        averageMemoryUsage: 1024,
        sampleCount: 10,
        lastUpdated: new Date(),
        version: 'v1.0.0'
      };

      await regressionDetector.loadBaselines([baseline]);
    });

    it('should detect render time regression', () => {
      const testResult: PerformanceTestResult = {
        benchmark: {
          name: 'Test Benchmark',
          component: 'TestComponent',
          maxRenderTime: 50,
          maxMemoryIncrease: 1024 * 50
        },
        metrics: {
          renderTime: 15, // 50% increase from baseline (10ms)
          memoryUsage: { used: 1024, total: 2048, external: 0 }
        },
        passed: true,
        violations: [],
        timestamp: new Date()
      };

      const regressions = regressionDetector.detectRegressions(testResult);

      expect(regressions).toHaveLength(1);
      expect(regressions[0].type).toBe('render_time');
      expect(regressions[0].severity).toBe('medium');
      expect(regressions[0].degradationPercentage).toBe(50);
    });

    it('should detect memory usage regression', () => {
      const testResult: PerformanceTestResult = {
        benchmark: {
          name: 'Test Benchmark',
          component: 'TestComponent',
          maxRenderTime: 50,
          maxMemoryIncrease: 1024 * 50
        },
        metrics: {
          renderTime: 10,
          memoryUsage: { used: 2048, total: 4096, external: 0 } // 100% increase from baseline (1024)
        },
        passed: true,
        violations: [],
        timestamp: new Date()
      };

      const regressions = regressionDetector.detectRegressions(testResult);

      expect(regressions).toHaveLength(1);
      expect(regressions[0].type).toBe('memory_usage');
      expect(regressions[0].severity).toBe('medium');
      expect(regressions[0].degradationPercentage).toBe(100);
    });

    it('should detect cache performance regression', () => {
      const testResult: PerformanceTestResult = {
        benchmark: {
          name: 'Test Benchmark',
          component: 'TestComponent',
          maxRenderTime: 50,
          maxMemoryIncrease: 1024 * 50,
          minCacheHitRate: 80
        },
        metrics: {
          renderTime: 10,
          memoryUsage: { used: 1024, total: 2048, external: 0 },
          cacheMetrics: {
            hitRate: 60, // 20% below expected 80%
            missRate: 40,
            evictions: 5
          }
        },
        passed: true,
        violations: [],
        timestamp: new Date()
      };

      const regressions = regressionDetector.detectRegressions(testResult);

      expect(regressions).toHaveLength(1);
      expect(regressions[0].type).toBe('cache_performance');
      expect(regressions[0].severity).toBe('medium');
      expect(regressions[0].degradationPercentage).toBe(20);
    });

    it('should not detect regression within acceptable thresholds', () => {
      const testResult: PerformanceTestResult = {
        benchmark: {
          name: 'Test Benchmark',
          component: 'TestComponent',
          maxRenderTime: 50,
          maxMemoryIncrease: 1024 * 50
        },
        metrics: {
          renderTime: 11, // 10% increase - within threshold
          memoryUsage: { used: 1100, total: 2048, external: 0 } // ~7% increase - within threshold
        },
        passed: true,
        violations: [],
        timestamp: new Date()
      };

      const regressions = regressionDetector.detectRegressions(testResult);

      expect(regressions).toHaveLength(0);
    });
  });

  describe('Severity Classification', () => {
    beforeEach(async () => {
      const baseline: PerformanceBaseline = {
        componentName: 'TestComponent',
        averageRenderTime: 10,
        averageMemoryUsage: 1024,
        sampleCount: 10,
        lastUpdated: new Date(),
        version: 'v1.0.0'
      };

      await regressionDetector.loadBaselines([baseline]);
    });

    it('should classify critical render time regression', () => {
      const testResult: PerformanceTestResult = {
        benchmark: {
          name: 'Test Benchmark',
          component: 'TestComponent',
          maxRenderTime: 50,
          maxMemoryIncrease: 1024 * 50
        },
        metrics: {
          renderTime: 40, // 300% increase - critical
          memoryUsage: { used: 1024, total: 2048, external: 0 }
        },
        passed: true,
        violations: [],
        timestamp: new Date()
      };

      const regressions = regressionDetector.detectRegressions(testResult);

      expect(regressions).toHaveLength(1);
      expect(regressions[0].severity).toBe('critical');
    });

    it('should classify high memory regression', () => {
      const testResult: PerformanceTestResult = {
        benchmark: {
          name: 'Test Benchmark',
          component: 'TestComponent',
          maxRenderTime: 50,
          maxMemoryIncrease: 1024 * 50
        },
        metrics: {
          renderTime: 10,
          memoryUsage: { used: 3072, total: 4096, external: 0 } // 200% increase - high
        },
        passed: true,
        violations: [],
        timestamp: new Date()
      };

      const regressions = regressionDetector.detectRegressions(testResult);

      expect(regressions).toHaveLength(1);
      expect(regressions[0].severity).toBe('high');
    });

    it('should classify critical cache regression', () => {
      const testResult: PerformanceTestResult = {
        benchmark: {
          name: 'Test Benchmark',
          component: 'TestComponent',
          maxRenderTime: 50,
          maxMemoryIncrease: 1024 * 50,
          minCacheHitRate: 80
        },
        metrics: {
          renderTime: 10,
          memoryUsage: { used: 1024, total: 2048, external: 0 },
          cacheMetrics: {
            hitRate: 40, // 40% below expected - critical
            missRate: 60,
            evictions: 10
          }
        },
        passed: true,
        violations: [],
        timestamp: new Date()
      };

      const regressions = regressionDetector.detectRegressions(testResult);

      expect(regressions).toHaveLength(1);
      expect(regressions[0].severity).toBe('critical');
    });
  });

  describe('Regression Reporting', () => {
    it('should generate comprehensive regression report', () => {
      const testResults: PerformanceTestResult[] = [
        {
          benchmark: {
            name: 'Good Component',
            component: 'GoodComponent',
            maxRenderTime: 50,
            maxMemoryIncrease: 1024 * 50
          },
          metrics: {
            renderTime: 5,
            memoryUsage: { used: 512, total: 1024, external: 0 }
          },
          passed: true,
          violations: [],
          timestamp: new Date()
        },
        {
          benchmark: {
            name: 'Slow Component',
            component: 'SlowComponent',
            maxRenderTime: 50,
            maxMemoryIncrease: 1024 * 50
          },
          metrics: {
            renderTime: 100, // Will cause regression if baseline exists
            memoryUsage: { used: 1024, total: 2048, external: 0 }
          },
          passed: false,
          violations: ['Render time exceeded'],
          timestamp: new Date()
        }
      ];

      const report = regressionDetector.generateRegressionReport(testResults);

      expect(report.buildNumber).toBe('test-build-123');
      expect(report.totalTests).toBe(2);
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.summary).toHaveProperty('critical');
      expect(report.summary).toHaveProperty('high');
      expect(report.summary).toHaveProperty('medium');
      expect(report.summary).toHaveProperty('low');
    });

    it('should determine build failure correctly', () => {
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
        summary: { critical: 0, high: 5, medium: 0, low: 0 }
      };

      const reportWithAcceptable = {
        buildNumber: 'test',
        timestamp: new Date(),
        totalTests: 1,
        regressions: [],
        summary: { critical: 0, high: 1, medium: 2, low: 3 }
      };

      expect(regressionDetector.shouldFailBuild(reportWithCritical)).toBe(true);
      expect(regressionDetector.shouldFailBuild(reportWithManyHigh)).toBe(true);
      expect(regressionDetector.shouldFailBuild(reportWithAcceptable)).toBe(false);
    });
  });

  describe('Performance Trends', () => {
    it('should track performance trends over time', () => {
      const testResults: PerformanceTestResult[] = [];
      
      // Create historical data
      for (let i = 0; i < 5; i++) {
        const result: PerformanceTestResult = {
          benchmark: {
            name: 'Test Component',
            component: 'TestComponent',
            maxRenderTime: 50,
            maxMemoryIncrease: 1024 * 50
          },
          metrics: {
            renderTime: 10 + i, // Gradually increasing
            memoryUsage: { used: 1024 + (i * 100), total: 2048, external: 0 }
          },
          passed: true,
          violations: [],
          timestamp: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000) // 5 days ago to today
        };
        
        regressionDetector.detectRegressions(result);
      }

      const trends = regressionDetector.getPerformanceTrends('TestComponent');

      expect(trends.renderTimeTrend).toHaveLength(5);
      expect(trends.memoryUsageTrend).toHaveLength(5);
      expect(trends.timestamps).toHaveLength(5);
      
      // Verify trend is increasing
      expect(trends.renderTimeTrend[4]).toBeGreaterThan(trends.renderTimeTrend[0]);
      expect(trends.memoryUsageTrend[4]).toBeGreaterThan(trends.memoryUsageTrend[0]);
    });

    it('should provide regression statistics', () => {
      // Add some test data
      regressionDetector.updateBaseline('Component1', Array(10).fill(null).map(() => ({
        benchmark: { name: 'Test', component: 'Component1', maxRenderTime: 50, maxMemoryIncrease: 1024 },
        metrics: { renderTime: 10, memoryUsage: { used: 1024, total: 2048, external: 0 } },
        passed: true,
        violations: [],
        timestamp: new Date()
      })));

      const stats = regressionDetector.getRegressionStatistics();

      expect(stats.totalComponents).toBeGreaterThanOrEqual(0);
      expect(stats.componentsWithBaselines).toBeGreaterThanOrEqual(0);
      expect(stats.averageRenderTime).toBeGreaterThanOrEqual(0);
      expect(stats.averageMemoryUsage).toBeGreaterThanOrEqual(0);
    });
  });
});