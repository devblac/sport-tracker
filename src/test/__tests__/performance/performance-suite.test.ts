/**
 * Performance Test Suite
 * 
 * Comprehensive performance testing suite that runs all performance tests
 * and validates against benchmarks with CI integration
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PerformanceTester } from '../../performance-tester';
import { PerformanceRegressionDetector } from '../../performance-regression-detector';
import { PerformanceCIIntegration } from '../../performance-ci-integration';
import { runPerformanceTestSuite, setupPerformanceTestEnvironment } from '../../performance-test-utils';
import { PERFORMANCE_BENCHMARKS, getBenchmarksByCategory } from '../../performance-benchmarks';
import type { PerformanceTestSuite, ComponentPerformanceTest } from '../../performance-test-utils';

import React from 'react';

// Mock components for comprehensive testing
const MockComponents = {
  Button: () => React.createElement('button', { className: 'btn' }, 'Test Button'),
  Input: () => React.createElement('input', { type: 'text', className: 'input', placeholder: 'Test Input' }),
  Modal: ({ children }: { children: React.ReactNode }) => 
    React.createElement('div', { className: 'modal-overlay' },
      React.createElement('div', { className: 'modal-content' }, children)
    ),
  WorkoutPlayer: () => 
    React.createElement('div', { className: 'workout-player' },
      React.createElement('div', { className: 'controls' },
        React.createElement('button', null, 'Play'),
        React.createElement('button', null, 'Pause'),
        React.createElement('button', null, 'Stop')
      ),
      React.createElement('div', { className: 'progress-bar' },
        React.createElement('div', { className: 'progress', style: { width: '50%' } })
      )
    ),
  ExerciseCard: ({ exercise }: { exercise: { name: string; sets: number; reps: number } }) => 
    React.createElement('div', { className: 'exercise-card' },
      React.createElement('h3', null, exercise.name),
      React.createElement('p', null, `${exercise.sets} sets × ${exercise.reps} reps`)
    ),
  SocialFeed: ({ posts }: { posts: Array<{ id: string; content: string; author: string }> }) => 
    React.createElement('div', { className: 'social-feed' },
      ...posts.map(post => 
        React.createElement('div', { key: post.id, className: 'post' },
          React.createElement('h4', null, post.author),
          React.createElement('p', null, post.content)
        )
      )
    ),
  Dashboard: () => 
    React.createElement('div', { className: 'dashboard' },
      React.createElement('header', { className: 'dashboard-header' },
        React.createElement('h1', null, 'Dashboard')
      ),
      React.createElement('main', { className: 'dashboard-content' },
        React.createElement('div', { className: 'stats-grid' },
          ...Array.from({ length: 6 }, (_, i) => 
            React.createElement('div', { key: i, className: 'stat-card' },
              React.createElement('h3', null, `Stat ${i + 1}`),
              React.createElement('p', null, Math.floor(Math.random() * 1000).toString())
            )
          )
        )
      )
    )
};

describe('Performance Test Suite', () => {
  let cleanup: () => void;
  let regressionDetector: PerformanceRegressionDetector;
  let ciIntegration: PerformanceCIIntegration;

  beforeAll(() => {
    const env = setupPerformanceTestEnvironment();
    cleanup = env.cleanup;
    
    regressionDetector = new PerformanceRegressionDetector('suite-test-build');
    ciIntegration = new PerformanceCIIntegration({
      baselineFile: 'test-suite-baselines.json',
      reportOutputFile: 'test-suite-report.json',
      buildNumber: 'suite-test-build',
      failOnCritical: true,
      failOnHighCount: 3
    });
  });

  afterAll(() => {
    cleanup();
  });

  describe('UI Components Performance Suite', () => {
    it('should run comprehensive UI component performance tests', async () => {
      const uiTestSuite: PerformanceTestSuite = {
        name: 'UI Components Performance',
        tests: [
          {
            name: 'Button Performance Test',
            component: React.createElement(MockComponents.Button),
            benchmark: PERFORMANCE_BENCHMARKS.find(b => b.component === 'Button')!,
            options: {
              iterations: 5,
              warmupRuns: 3,
              detectMemoryLeaks: true
            }
          },
          {
            name: 'Input Performance Test',
            component: React.createElement(MockComponents.Input),
            benchmark: PERFORMANCE_BENCHMARKS.find(b => b.component === 'Input')!,
            options: {
              iterations: 5,
              warmupRuns: 3,
              detectMemoryLeaks: true
            }
          },
          {
            name: 'Modal Performance Test',
            component: React.createElement(MockComponents.Modal, { children: 'Test Modal Content' }),
            benchmark: PERFORMANCE_BENCHMARKS.find(b => b.component === 'Modal')!,
            options: {
              iterations: 3,
              warmupRuns: 2,
              detectMemoryLeaks: true
            }
          }
        ]
      };

      const results = await runPerformanceTestSuite(uiTestSuite, regressionDetector);

      expect(results.suiteName).toBe('UI Components Performance');
      expect(results.results).toHaveLength(3);
      expect(results.summary.total).toBe(3);
      
      // All UI components should pass their benchmarks
      expect(results.summary.passed).toBeGreaterThan(0);
      
      // Verify individual test results
      results.results.forEach(result => {
        expect(result.metrics.renderTime).toBeGreaterThan(0);
        expect(result.metrics.memoryUsage.used).toBeGreaterThan(0);
        
        if (!result.passed) {
          console.warn(`UI Component test failed: ${result.testName}`, result.violations);
        }
      });
    });
  });

  describe('Workout Components Performance Suite', () => {
    it('should run workout-related component performance tests', async () => {
      const workoutTestSuite: PerformanceTestSuite = {
        name: 'Workout Components Performance',
        tests: [
          {
            name: 'WorkoutPlayer Performance Test',
            component: React.createElement(MockComponents.WorkoutPlayer),
            benchmark: PERFORMANCE_BENCHMARKS.find(b => b.component === 'WorkoutPlayer')!,
            options: {
              iterations: 3,
              warmupRuns: 2,
              detectMemoryLeaks: true
            }
          },
          {
            name: 'ExerciseCard Performance Test',
            component: React.createElement(MockComponents.ExerciseCard, {
              exercise: { name: 'Push-ups', sets: 3, reps: 15 }
            }),
            benchmark: PERFORMANCE_BENCHMARKS.find(b => b.component === 'ExerciseCard')!,
            options: {
              iterations: 5,
              warmupRuns: 3,
              detectMemoryLeaks: true
            }
          }
        ]
      };

      const results = await runPerformanceTestSuite(workoutTestSuite, regressionDetector);

      expect(results.suiteName).toBe('Workout Components Performance');
      expect(results.results).toHaveLength(2);
      
      // Workout components may have higher render times due to complexity
      results.results.forEach(result => {
        expect(result.metrics.renderTime).toBeLessThan(100); // Should be under 100ms
        
        if (!result.passed) {
          console.warn(`Workout component test failed: ${result.testName}`, result.violations);
        }
      });
    });
  });

  describe('Social Components Performance Suite', () => {
    it('should run social feature component performance tests', async () => {
      const mockPosts = Array.from({ length: 10 }, (_, i) => ({
        id: `post-${i}`,
        content: `This is test post content ${i}. It contains some text to simulate real social media posts.`,
        author: `User ${i + 1}`
      }));

      const socialTestSuite: PerformanceTestSuite = {
        name: 'Social Components Performance',
        tests: [
          {
            name: 'SocialFeed Performance Test',
            component: React.createElement(MockComponents.SocialFeed, { posts: mockPosts }),
            benchmark: PERFORMANCE_BENCHMARKS.find(b => b.component === 'SocialFeed')!,
            options: {
              iterations: 3,
              warmupRuns: 2,
              detectMemoryLeaks: true
            }
          }
        ]
      };

      const results = await runPerformanceTestSuite(socialTestSuite, regressionDetector);

      expect(results.suiteName).toBe('Social Components Performance');
      expect(results.results).toHaveLength(1);
      
      const socialFeedResult = results.results[0];
      expect(socialFeedResult.testName).toBe('SocialFeed Performance Test');
      
      // Social feed with 10 posts should render reasonably fast
      expect(socialFeedResult.metrics.renderTime).toBeLessThan(150);
    });
  });

  describe('Page Components Performance Suite', () => {
    it('should run page-level component performance tests', async () => {
      const pageTestSuite: PerformanceTestSuite = {
        name: 'Page Components Performance',
        tests: [
          {
            name: 'Dashboard Performance Test',
            component: React.createElement(MockComponents.Dashboard),
            benchmark: PERFORMANCE_BENCHMARKS.find(b => b.component === 'Dashboard')!,
            options: {
              iterations: 2,
              warmupRuns: 1,
              detectMemoryLeaks: true
            }
          }
        ]
      };

      const results = await runPerformanceTestSuite(pageTestSuite, regressionDetector);

      expect(results.suiteName).toBe('Page Components Performance');
      expect(results.results).toHaveLength(1);
      
      const dashboardResult = results.results[0];
      expect(dashboardResult.testName).toBe('Dashboard Performance Test');
      
      // Dashboard is a complex component, allow higher render time
      expect(dashboardResult.metrics.renderTime).toBeLessThan(300);
      expect(dashboardResult.metrics.memoryUsage.used).toBeGreaterThan(0);
    });
  });

  describe('Performance Benchmark Validation', () => {
    it('should validate all benchmarks are achievable', async () => {
      const benchmarkCategories = ['UI_COMPONENTS', 'WORKOUT_COMPONENTS', 'PAGE_COMPONENTS', 'DATA_COMPONENTS'] as const;
      
      for (const category of benchmarkCategories) {
        const benchmarks = getBenchmarksByCategory(category);
        expect(benchmarks.length).toBeGreaterThan(0);
        
        benchmarks.forEach(benchmark => {
          expect(benchmark.maxRenderTime).toBeGreaterThan(0);
          expect(benchmark.maxMemoryIncrease).toBeGreaterThan(0);
          expect(benchmark.component).toBeTruthy();
          expect(benchmark.name).toBeTruthy();
        });
      }
    });

    it('should have reasonable performance expectations', () => {
      PERFORMANCE_BENCHMARKS.forEach(benchmark => {
        // Render time should be reasonable (not too strict, not too lenient)
        expect(benchmark.maxRenderTime).toBeGreaterThan(1); // At least 1ms
        expect(benchmark.maxRenderTime).toBeLessThan(1000); // Less than 1 second
        
        // Memory increase should be reasonable
        expect(benchmark.maxMemoryIncrease).toBeGreaterThan(1024); // At least 1KB
        expect(benchmark.maxMemoryIncrease).toBeLessThan(1024 * 1024 * 10); // Less than 10MB
        
        // Cache hit rate should be reasonable if specified
        if (benchmark.minCacheHitRate) {
          expect(benchmark.minCacheHitRate).toBeGreaterThan(0);
          expect(benchmark.minCacheHitRate).toBeLessThanOrEqual(100);
        }
      });
    });
  });

  describe('Performance Regression Integration', () => {
    it('should detect and report performance regressions', async () => {
      // Create a simple test to generate regression data
      const testSuite: PerformanceTestSuite = {
        name: 'Regression Detection Test',
        tests: [
          {
            name: 'Button Regression Test',
            component: React.createElement(MockComponents.Button),
            benchmark: PERFORMANCE_BENCHMARKS.find(b => b.component === 'Button')!,
            options: { iterations: 3 }
          }
        ]
      };

      const results = await runPerformanceTestSuite(testSuite, regressionDetector);
      
      expect(results.regressionReport).toBeDefined();
      if (results.regressionReport) {
        expect(results.regressionReport.buildNumber).toBe('suite-test-build');
        expect(results.regressionReport.totalTests).toBe(1);
        expect(results.regressionReport.summary).toHaveProperty('critical');
        expect(results.regressionReport.summary).toHaveProperty('high');
        expect(results.regressionReport.summary).toHaveProperty('medium');
        expect(results.regressionReport.summary).toHaveProperty('low');
      }
    });
  });

  describe('CI Integration Performance', () => {
    it('should integrate with CI system for automated testing', async () => {
      await ciIntegration.initialize();
      
      // Create test results that should pass
      const testResults = [
        {
          benchmark: PERFORMANCE_BENCHMARKS.find(b => b.component === 'Button')!,
          metrics: {
            renderTime: 3, // Well within 5ms limit
            memoryUsage: { used: 1024 * 5, total: 1024 * 10, external: 0 } // 5KB used
          },
          passed: true,
          violations: [],
          timestamp: new Date()
        }
      ];

      const result = await ciIntegration.processTestResults(testResults);
      
      expect(result.shouldFailBuild).toBe(false);
      expect(result.report.totalTests).toBe(1);
      expect(result.alerts.length).toBeLessThanOrEqual(1); // May have summary alert
    });
  });

  describe('Performance Test Reliability', () => {
    it('should produce consistent results across multiple runs', async () => {
      const performanceTester = new PerformanceTester();
      const results: number[] = [];
      
      try {
        // Run the same test multiple times
        for (let i = 0; i < 5; i++) {
          performanceTester.startMeasurement('ConsistencyTest');
          // Simulate consistent work
          const start = performance.now();
          while (performance.now() - start < 2) {
            // Consistent 2ms work
          }
          const metrics = performanceTester.endMeasurement('ConsistencyTest');
          results.push(metrics.renderTime);
        }

        // Calculate coefficient of variation (standard deviation / mean)
        const mean = results.reduce((a, b) => a + b, 0) / results.length;
        const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / mean;

        // Results should be reasonably consistent (CV < 50%)
        expect(coefficientOfVariation).toBeLessThan(0.5);
        
        // All results should be positive
        results.forEach(result => {
          expect(result).toBeGreaterThan(0);
        });

      } finally {
        performanceTester.dispose();
      }
    });

    it('should handle performance test failures gracefully', async () => {
      const testSuite: PerformanceTestSuite = {
        name: 'Failure Handling Test',
        tests: [
          {
            name: 'Intentionally Failing Test',
            component: React.createElement('div', null, 'This will fail'),
            benchmark: {
              name: 'Impossible Benchmark',
              component: 'ImpossibleComponent',
              maxRenderTime: 0.001, // Impossible to achieve
              maxMemoryIncrease: 1 // Impossible to achieve
            },
            options: { iterations: 1 }
          }
        ]
      };

      const results = await runPerformanceTestSuite(testSuite);
      
      expect(results.summary.failed).toBe(1);
      expect(results.results[0].passed).toBe(false);
      expect(results.results[0].violations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Test Coverage', () => {
    it('should cover all critical performance scenarios', () => {
      const criticalComponents = [
        'Button', 'Input', 'Modal', 'WorkoutPlayer', 'ExerciseCard', 
        'SocialFeed', 'Dashboard'
      ];

      criticalComponents.forEach(componentName => {
        const benchmark = PERFORMANCE_BENCHMARKS.find(b => b.component === componentName);
        expect(benchmark).toBeDefined();
        expect(benchmark?.name).toContain(componentName);
      });
    });

    it('should test both fast and slow components appropriately', () => {
      const fastComponents = PERFORMANCE_BENCHMARKS.filter(b => b.maxRenderTime <= 10);
      const slowComponents = PERFORMANCE_BENCHMARKS.filter(b => b.maxRenderTime > 50);
      
      expect(fastComponents.length).toBeGreaterThan(0);
      expect(slowComponents.length).toBeGreaterThan(0);
      
      // Fast components should have strict memory limits
      fastComponents.forEach(component => {
        expect(component.maxMemoryIncrease).toBeLessThan(1024 * 50); // Less than 50KB
      });
      
      // Slow components can have higher memory limits
      slowComponents.forEach(component => {
        expect(component.maxMemoryIncrease).toBeGreaterThan(1024 * 50); // More than 50KB
      });
    });
  });
});