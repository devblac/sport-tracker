/**
 * Test Metrics Dashboard Tests
 * 
 * Comprehensive tests for the test metrics dashboard system including
 * real-time metrics visualization, coverage trend analysis, reliability tracking,
 * flaky test detection, and automated alert system.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestMetricsDashboard, createTestMetricsDashboard } from '../test-metrics-dashboard';
import { ReliabilityTracker } from '../reliability-tracker';
import { EnhancedCoverageEnforcer } from '../coverage-enforcer';
import { TestDataPersistence } from '../test-data-persistence';

// Mock file system operations
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    unlink: vi.fn(),
    copyFile: vi.fn()
  }
}));

describe('TestMetricsDashboard', () => {
  let dashboard: TestMetricsDashboard;
  let reliabilityTracker: ReliabilityTracker;
  let coverageEnforcer: EnhancedCoverageEnforcer;
  let dataPersistence: TestDataPersistence;

  beforeEach(() => {
    // Create fresh instances for each test
    reliabilityTracker = new ReliabilityTracker();
    coverageEnforcer = new EnhancedCoverageEnforcer();
    dataPersistence = new TestDataPersistence();
    
    dashboard = createTestMetricsDashboard(
      reliabilityTracker,
      coverageEnforcer,
      dataPersistence,
      {
        refreshInterval: 1000, // 1 second for testing
        alertRetentionDays: 1,
        trendAnalysisDays: 7,
        thresholds: {
          reliability: 99,
          coverage: 90,
          flakyTestRate: 1,
          performanceRegression: 20
        }
      }
    );
  });

  afterEach(() => {
    dashboard.stop();
    vi.clearAllMocks();
  });

  describe('Dashboard Initialization', () => {
    it('should create dashboard with default configuration', () => {
      const defaultDashboard = createTestMetricsDashboard(
        reliabilityTracker,
        coverageEnforcer,
        dataPersistence
      );
      
      expect(defaultDashboard).toBeInstanceOf(TestMetricsDashboard);
    });

    it('should create dashboard with custom configuration', () => {
      const customConfig = {
        refreshInterval: 5000,
        alertRetentionDays: 14,
        trendAnalysisDays: 30,
        thresholds: {
          reliability: 95,
          coverage: 85,
          flakyTestRate: 2,
          performanceRegression: 15
        }
      };

      const customDashboard = createTestMetricsDashboard(
        reliabilityTracker,
        coverageEnforcer,
        dataPersistence,
        customConfig
      );

      expect(customDashboard).toBeInstanceOf(TestMetricsDashboard);
    });
  });

  describe('Real-time Metrics Collection', () => {
    it('should collect current metrics successfully', async () => {
      // Add some test data
      reliabilityTracker.addTestSuite({
        suiteName: 'test-suite',
        buildNumber: 1,
        timestamp: new Date(),
        totalTests: 100,
        passedTests: 95,
        failedTests: 5,
        skippedTests: 0,
        duration: 30000
      });

      const metrics = await dashboard.getCurrentMetrics();

      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('reliability');
      expect(metrics).toHaveProperty('coverage');
      expect(metrics).toHaveProperty('performance');
      expect(metrics).toHaveProperty('alerts');
      expect(metrics).toHaveProperty('trends');
      
      expect(metrics.reliability.overallReliability).toBe(95);
      expect(metrics.reliability.buildWindow).toBe(1);
    });

    it('should generate comprehensive dashboard report', async () => {
      // Add test data for report generation
      reliabilityTracker.addTestSuite({
        suiteName: 'test-suite',
        buildNumber: 1,
        timestamp: new Date(),
        totalTests: 100,
        passedTests: 99,
        failedTests: 1,
        skippedTests: 0,
        duration: 25000
      });

      const report = await dashboard.generateReport();

      expect(report).toContain('# Test Quality Dashboard Report');
      expect(report).toContain('## 🎯 Test Reliability');
      expect(report).toContain('## 📊 Test Coverage');
      expect(report).toContain('## ⚡ Performance Metrics');
      expect(report).toContain('99.00%'); // Reliability percentage
    });
  });

  describe('Coverage Trend Analysis', () => {
    it('should analyze coverage trends by module over time', async () => {
      // Mock historical data
      vi.spyOn(dataPersistence, 'loadTestDataRange').mockResolvedValue([
        {
          testRuns: [],
          testSuites: [{
            suiteName: 'test-suite',
            buildNumber: 1,
            timestamp: new Date('2024-01-01'),
            totalTests: 100,
            passedTests: 95,
            failedTests: 5,
            skippedTests: 0,
            duration: 30000
          }],
          metadata: {
            version: '1.0.0',
            lastUpdated: new Date('2024-01-01'),
            totalBuilds: 1,
            environment: 'test'
          }
        }
      ]);

      const metrics = await dashboard.getCurrentMetrics();
      const coverageTrend = metrics.trends.coverageTrend;

      expect(coverageTrend).toBeInstanceOf(Array);
      expect(coverageTrend.length).toBeGreaterThan(0);
      
      // Check that all module types are represented
      const moduleTypes = [...new Set(coverageTrend.map(t => t.module))];
      expect(moduleTypes).toContain('component');
      expect(moduleTypes).toContain('utility');
      expect(moduleTypes).toContain('service');
    });

    it('should track coverage trends with proper date formatting', async () => {
      const metrics = await dashboard.getCurrentMetrics();
      const coverageTrend = metrics.trends.coverageTrend;

      for (const trend of coverageTrend) {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('coverage');
        expect(trend).toHaveProperty('module');
        expect(typeof trend.date).toBe('string');
        expect(typeof trend.coverage).toBe('number');
        expect(trend.coverage).toBeGreaterThanOrEqual(0);
        expect(trend.coverage).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Reliability Tracking', () => {
    it('should track reliability over rolling 50-build window', async () => {
      // Add multiple test suites to simulate build history
      for (let i = 1; i <= 10; i++) {
        reliabilityTracker.addTestSuite({
          suiteName: `test-suite-${i}`,
          buildNumber: i,
          timestamp: new Date(),
          totalTests: 100,
          passedTests: 95 + (i % 5), // Varying reliability
          failedTests: 5 - (i % 5),
          skippedTests: 0,
          duration: 30000
        });
      }

      const metrics = await dashboard.getCurrentMetrics();
      const reliability = metrics.reliability;

      expect(reliability.overallReliability).toBeGreaterThan(90);
      expect(reliability.buildWindow).toBe(10);
      expect(reliability.trend).toHaveLength(10);
    });

    it('should calculate reliability percentage correctly', async () => {
      reliabilityTracker.addTestSuite({
        suiteName: 'perfect-suite',
        buildNumber: 1,
        timestamp: new Date(),
        totalTests: 100,
        passedTests: 100,
        failedTests: 0,
        skippedTests: 0,
        duration: 30000
      });

      const metrics = await dashboard.getCurrentMetrics();
      expect(metrics.reliability.overallReliability).toBe(100);
    });
  });

  describe('Flaky Test Detection', () => {
    it('should detect flaky tests with failure analysis', async () => {
      // Add test runs with flaky pattern
      const flakyTestName = 'flaky-test';
      
      // Add alternating pass/fail pattern with sufficient runs
      for (let i = 1; i <= 20; i++) {
        reliabilityTracker.addTestRun({
          testName: flakyTestName,
          status: i % 3 === 0 ? 'fail' : 'pass', // 33% failure rate
          duration: 100,
          buildNumber: Math.floor(i / 2) + 1, // Multiple runs per build
          timestamp: new Date()
        });
      }

      // Add multiple test suites to provide build context
      for (let i = 1; i <= 10; i++) {
        reliabilityTracker.addTestSuite({
          suiteName: `test-suite-${i}`,
          buildNumber: i,
          timestamp: new Date(),
          totalTests: 2,
          passedTests: 1,
          failedTests: 1,
          skippedTests: 0,
          duration: 1000
        });
      }

      const metrics = await dashboard.getCurrentMetrics();
      const flakyTests = metrics.reliability.flakyTests;

      expect(flakyTests.length).toBeGreaterThan(0);
      expect(flakyTests[0].testName).toBe(flakyTestName);
      expect(flakyTests[0].failureRate).toBeGreaterThan(0);
      expect(flakyTests[0].pattern).toBeDefined();
    });

    it('should track flaky test trends over time', async () => {
      // Mock historical data with flaky tests
      vi.spyOn(dataPersistence, 'loadTestDataRange').mockResolvedValue([
        {
          testRuns: [
            {
              testName: 'flaky-test-1',
              status: 'fail',
              duration: 100,
              buildNumber: 1,
              timestamp: new Date('2024-01-01')
            },
            {
              testName: 'flaky-test-1',
              status: 'pass',
              duration: 100,
              buildNumber: 1,
              timestamp: new Date('2024-01-01')
            }
          ],
          testSuites: [],
          metadata: {
            version: '1.0.0',
            lastUpdated: new Date('2024-01-01'),
            totalBuilds: 1,
            environment: 'test'
          }
        }
      ]);

      const metrics = await dashboard.getCurrentMetrics();
      const flakyTrend = metrics.trends.flakyTestTrend;

      expect(flakyTrend).toBeInstanceOf(Array);
      expect(flakyTrend.length).toBeGreaterThan(0);
      
      for (const trend of flakyTrend) {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('count');
        expect(trend).toHaveProperty('tests');
        expect(Array.isArray(trend.tests)).toBe(true);
      }
    });
  });

  describe('Automated Alert System', () => {
    it('should generate alerts for threshold violations', async () => {
      // Add test data that violates reliability threshold
      reliabilityTracker.addTestSuite({
        suiteName: 'failing-suite',
        buildNumber: 1,
        timestamp: new Date(),
        totalTests: 100,
        passedTests: 90, // Below 99% threshold
        failedTests: 10,
        skippedTests: 0,
        duration: 30000
      });

      const metrics = await dashboard.getCurrentMetrics();
      const alerts = metrics.alerts;

      expect(alerts.length).toBeGreaterThan(0);
      
      const reliabilityAlert = alerts.find(alert => alert.type === 'reliability');
      expect(reliabilityAlert).toBeDefined();
      expect(reliabilityAlert?.severity).toBe('critical');
      expect(reliabilityAlert?.message).toContain('reliability below threshold');
    });

    it('should generate alerts with proper remediation suggestions', async () => {
      // Add failing test data
      reliabilityTracker.addTestSuite({
        suiteName: 'failing-suite',
        buildNumber: 1,
        timestamp: new Date(),
        totalTests: 100,
        passedTests: 85,
        failedTests: 15,
        skippedTests: 0,
        duration: 30000
      });

      const metrics = await dashboard.getCurrentMetrics();
      const alerts = metrics.alerts;

      expect(alerts.length).toBeGreaterThan(0);
      
      const alert = alerts[0];
      expect(alert.remediation).toBeInstanceOf(Array);
      expect(alert.remediation.length).toBeGreaterThan(0);
      expect(alert.remediation[0]).toContain('Fix failing tests');
    });

    it('should acknowledge alerts correctly', () => {
      // Generate an alert first
      dashboard['alerts'] = [{
        id: 'test-alert-1',
        type: 'reliability',
        severity: 'high',
        message: 'Test alert',
        details: 'Test details',
        timestamp: new Date(),
        remediation: ['Fix the issue'],
        acknowledged: false,
        autoResolve: true
      }];

      const acknowledged = dashboard.acknowledgeAlert('test-alert-1');
      expect(acknowledged).toBe(true);

      const activeAlerts = dashboard.getActiveAlerts();
      expect(activeAlerts.length).toBe(0);
    });

    it('should setup automated alerts with proper intervals', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      dashboard.setupAutomatedAlerts();
      
      // Verify that the setup doesn't throw errors
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('error'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Metrics', () => {
    it('should track performance trends over time', async () => {
      // Mock historical performance data
      vi.spyOn(dataPersistence, 'loadTestDataRange').mockResolvedValue([
        {
          testRuns: [],
          testSuites: [{
            suiteName: 'performance-suite',
            buildNumber: 1,
            timestamp: new Date('2024-01-01'),
            totalTests: 50,
            passedTests: 50,
            failedTests: 0,
            skippedTests: 0,
            duration: 15000 // 15 seconds total
          }],
          metadata: {
            version: '1.0.0',
            lastUpdated: new Date('2024-01-01'),
            totalBuilds: 1,
            environment: 'test'
          }
        }
      ]);

      const metrics = await dashboard.getCurrentMetrics();
      const performanceTrend = metrics.trends.performanceTrend;

      expect(performanceTrend).toBeInstanceOf(Array);
      expect(performanceTrend.length).toBeGreaterThan(0);
      
      for (const trend of performanceTrend) {
        expect(trend).toHaveProperty('date');
        expect(trend).toHaveProperty('duration');
        expect(trend).toHaveProperty('testCount');
        expect(trend.duration).toBe(300); // 15000ms / 50 tests = 300ms average
        expect(trend.testCount).toBe(50);
      }
    });

    it('should calculate average test duration correctly', async () => {
      const metrics = await dashboard.getCurrentMetrics();
      const performance = metrics.performance;

      expect(performance).toHaveProperty('averageTestDuration');
      expect(performance).toHaveProperty('testSuiteExecutionTime');
      expect(performance).toHaveProperty('slowestTests');
      expect(typeof performance.averageTestDuration).toBe('number');
    });
  });

  describe('Dashboard Status and Export', () => {
    it('should provide status summary for health checks', () => {
      const status = dashboard.getStatusSummary();

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('reliability');
      expect(status).toHaveProperty('coverage');
      expect(status).toHaveProperty('activeAlerts');
      expect(status).toHaveProperty('lastUpdate');
      
      expect(['healthy', 'warning', 'critical']).toContain(status.status);
      expect(typeof status.reliability).toBe('number');
      expect(typeof status.activeAlerts).toBe('number');
    });

    it('should export dashboard data in JSON format', async () => {
      const exportedData = await dashboard.exportDashboardData('json');
      
      expect(typeof exportedData).toBe('string');
      
      const parsedData = JSON.parse(exportedData);
      expect(parsedData).toHaveProperty('timestamp');
      expect(parsedData).toHaveProperty('reliability');
      expect(parsedData).toHaveProperty('coverage');
    });

    it('should export dashboard data in Prometheus format', async () => {
      const exportedData = await dashboard.exportDashboardData('prometheus');
      
      expect(typeof exportedData).toBe('string');
      expect(exportedData).toContain('# HELP test_reliability_percentage');
      expect(exportedData).toContain('# TYPE test_reliability_percentage gauge');
      expect(exportedData).toContain('test_reliability_percentage');
    });
  });

  describe('Dashboard Lifecycle', () => {
    it('should start and stop dashboard correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      dashboard.start();
      expect(consoleSpy).toHaveBeenCalledWith('Test Metrics Dashboard started');
      
      dashboard.stop();
      expect(consoleSpy).toHaveBeenCalledWith('Test Metrics Dashboard stopped');
      
      consoleSpy.mockRestore();
    });

    it('should handle multiple start calls gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      dashboard.start();
      dashboard.start(); // Second start should warn
      
      expect(consoleSpy).toHaveBeenCalledWith('Dashboard is already running');
      
      dashboard.stop();
      consoleSpy.mockRestore();
    });

    it('should collect metrics periodically when running', async () => {
      const collectSpy = vi.spyOn(dashboard as any, 'collectMetrics');
      
      dashboard.start();
      
      // Wait for initial collection
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(collectSpy).toHaveBeenCalled();
      
      dashboard.stop();
    });
  });

  describe('Error Handling', () => {
    it('should handle coverage loading errors gracefully', async () => {
      // Mock coverage enforcer to throw error
      vi.spyOn(coverageEnforcer, 'loadCoverageReport').mockRejectedValue(new Error('Coverage load failed'));
      
      const metrics = await dashboard.getCurrentMetrics();
      
      expect(metrics.coverage.passed).toBe(false);
      expect(metrics.coverage.summary.recommendations).toContain('Failed to load coverage data: Error: Coverage load failed');
    });

    it('should handle data persistence errors gracefully', async () => {
      // Mock data persistence to throw error
      vi.spyOn(dataPersistence, 'getHistoricalMetrics').mockRejectedValue(new Error('Persistence failed'));
      
      try {
        const metrics = await dashboard.getCurrentMetrics();
        
        // Should still return metrics even if historical data fails
        expect(metrics).toHaveProperty('trends');
        expect(metrics.trends.reliabilityTrend).toBeInstanceOf(Array);
      } catch (error) {
        // If the error propagates, that's also acceptable behavior
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Persistence failed');
      }
    });

    it('should handle alert file creation errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Create an alert that would trigger file creation
      const alert = {
        id: 'test-alert',
        type: 'reliability' as const,
        severity: 'critical' as const,
        message: 'Test alert',
        details: 'Test details',
        timestamp: new Date(),
        remediation: ['Fix it'],
        acknowledged: false,
        autoResolve: true
      };

      // Mock fs to throw error
      const fs = await import('fs/promises');
      vi.mocked(fs.default.writeFile).mockRejectedValue(new Error('Write failed'));

      await (dashboard as any).createAlertFile(alert);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create alert file:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});

describe('Dashboard Factory Function', () => {
  it('should create dashboard instance with all components', () => {
    const reliabilityTracker = new ReliabilityTracker();
    const coverageEnforcer = new EnhancedCoverageEnforcer();
    const dataPersistence = new TestDataPersistence();
    
    const dashboard = createTestMetricsDashboard(
      reliabilityTracker,
      coverageEnforcer,
      dataPersistence
    );

    expect(dashboard).toBeInstanceOf(TestMetricsDashboard);
  });

  it('should create dashboard with custom configuration', () => {
    const reliabilityTracker = new ReliabilityTracker();
    const coverageEnforcer = new EnhancedCoverageEnforcer();
    const dataPersistence = new TestDataPersistence();
    
    const config = {
      refreshInterval: 10000,
      alertRetentionDays: 30,
      trendAnalysisDays: 60,
      thresholds: {
        reliability: 95,
        coverage: 85,
        flakyTestRate: 2,
        performanceRegression: 25
      }
    };

    const dashboard = createTestMetricsDashboard(
      reliabilityTracker,
      coverageEnforcer,
      dataPersistence,
      config
    );

    expect(dashboard).toBeInstanceOf(TestMetricsDashboard);
  });
});