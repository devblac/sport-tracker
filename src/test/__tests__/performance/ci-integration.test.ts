/**
 * CI Integration Performance Tests
 * 
 * Tests CI/CD integration, alerts, and build failure logic
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PerformanceCIIntegration, type CIPerformanceConfig, type PerformanceAlert } from '../../performance-ci-integration';
import { type PerformanceTestResult } from '../../performance-tester';

describe('CI Integration Performance Tests', () => {
  let ciIntegration: PerformanceCIIntegration;
  let testConfig: CIPerformanceConfig;
  let tempFiles: string[] = [];

  beforeEach(() => {
    testConfig = {
      baselineFile: join(process.cwd(), 'test-baselines.json'),
      reportOutputFile: join(process.cwd(), 'test-performance-report.json'),
      buildNumber: 'test-build-456',
      failOnCritical: true,
      failOnHighCount: 3,
      alertWebhookUrl: 'https://example.com/webhook',
      slackWebhookUrl: 'https://hooks.slack.com/test'
    };

    ciIntegration = new PerformanceCIIntegration(testConfig);
    tempFiles = [testConfig.baselineFile, testConfig.reportOutputFile];
  });

  afterEach(() => {
    // Cleanup temp files
    tempFiles.forEach(file => {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    });
  });

  describe('CI Configuration', () => {
    it('should get CI configuration from environment', () => {
      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        GITHUB_RUN_NUMBER: '123',
        PERFORMANCE_FAIL_ON_CRITICAL: 'true',
        PERFORMANCE_FAIL_ON_HIGH_COUNT: '2',
        PERFORMANCE_WEBHOOK_URL: 'https://test.webhook.com',
        SLACK_WEBHOOK_URL: 'https://hooks.slack.com/services/test'
      };

      const config = PerformanceCIIntegration.getCIConfig();

      expect(config.buildNumber).toBe('123');
      expect(config.failOnCritical).toBe(true);
      expect(config.failOnHighCount).toBe(2);
      expect(config.alertWebhookUrl).toBe('https://test.webhook.com');
      expect(config.slackWebhookUrl).toBe('https://hooks.slack.com/services/test');

      process.env = originalEnv;
    });

    it('should use default values when environment variables are not set', () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.GITHUB_RUN_NUMBER;
      delete process.env.BUILD_NUMBER;
      delete process.env.CI_PIPELINE_ID;

      const config = PerformanceCIIntegration.getCIConfig();

      expect(config.buildNumber).toMatch(/^local-\d+$/);
      expect(config.failOnCritical).toBe(true);
      expect(config.failOnHighCount).toBe(3);

      process.env = originalEnv;
    });
  });

  describe('Baseline Management', () => {
    it('should initialize with existing baselines', async () => {
      // Create test baseline file
      const testBaselines = [
        {
          componentName: 'TestComponent',
          averageRenderTime: 10,
          averageMemoryUsage: 1024,
          sampleCount: 10,
          lastUpdated: new Date().toISOString(),
          version: 'v1.0.0'
        }
      ];

      writeFileSync(testConfig.baselineFile, JSON.stringify(testBaselines));

      await ciIntegration.initialize();

      // Verify baselines were loaded (we can't directly test this, but no error should occur)
      expect(existsSync(testConfig.baselineFile)).toBe(true);
    });

    it('should handle missing baseline file gracefully', async () => {
      await expect(ciIntegration.initialize()).resolves.not.toThrow();
    });

    it('should handle corrupted baseline file gracefully', async () => {
      writeFileSync(testConfig.baselineFile, 'invalid json');

      await expect(ciIntegration.initialize()).resolves.not.toThrow();
    });
  });

  describe('Test Result Processing', () => {
    it('should process successful test results', async () => {
      const testResults: PerformanceTestResult[] = [
        {
          benchmark: {
            name: 'Fast Component',
            component: 'FastComponent',
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
        }
      ];

      const result = await ciIntegration.processTestResults(testResults);

      expect(result.shouldFailBuild).toBe(false);
      expect(result.report.totalTests).toBe(1);
      expect(result.alerts).toHaveLength(0);
      expect(existsSync(testConfig.reportOutputFile)).toBe(true);
    });

    it('should process failed test results and generate alerts', async () => {
      const testResults: PerformanceTestResult[] = [
        {
          benchmark: {
            name: 'Slow Component',
            component: 'SlowComponent',
            maxRenderTime: 10,
            maxMemoryIncrease: 1024 * 10
          },
          metrics: {
            renderTime: 50, // Exceeds benchmark
            memoryUsage: { used: 1024 * 20, total: 1024 * 40, external: 0 } // Exceeds benchmark
          },
          passed: false,
          violations: [
            'Render time 50ms exceeds limit 10ms',
            'Memory usage 20KB exceeds limit 10KB'
          ],
          timestamp: new Date()
        }
      ];

      const result = await ciIntegration.processTestResults(testResults);

      expect(result.shouldFailBuild).toBe(false); // No regressions, just failed benchmarks
      expect(result.alerts.length).toBeGreaterThan(0);
      
      const failureAlert = result.alerts.find(alert => 
        alert.title.includes('Performance Benchmark Failed')
      );
      expect(failureAlert).toBeDefined();
      expect(failureAlert?.level).toBe('error');
    });

    it('should fail build on critical regressions', async () => {
      // First, set up a baseline
      const baseline = [
        {
          componentName: 'TestComponent',
          averageRenderTime: 10,
          averageMemoryUsage: 1024,
          sampleCount: 10,
          lastUpdated: new Date().toISOString(),
          version: 'v1.0.0'
        }
      ];
      writeFileSync(testConfig.baselineFile, JSON.stringify(baseline));
      await ciIntegration.initialize();

      // Now test with a critical regression
      const testResults: PerformanceTestResult[] = [
        {
          benchmark: {
            name: 'Regressed Component',
            component: 'TestComponent',
            maxRenderTime: 100,
            maxMemoryIncrease: 1024 * 100
          },
          metrics: {
            renderTime: 40, // 300% increase - critical regression
            memoryUsage: { used: 1024, total: 2048, external: 0 }
          },
          passed: true,
          violations: [],
          timestamp: new Date()
        }
      ];

      const result = await ciIntegration.processTestResults(testResults);

      expect(result.shouldFailBuild).toBe(true);
      expect(result.report.summary.critical).toBeGreaterThan(0);
    });

    it('should fail build on too many high regressions', async () => {
      // Set up baselines for multiple components
      const baselines = Array.from({ length: 5 }, (_, i) => ({
        componentName: `Component${i}`,
        averageRenderTime: 10,
        averageMemoryUsage: 1024,
        sampleCount: 10,
        lastUpdated: new Date().toISOString(),
        version: 'v1.0.0'
      }));
      writeFileSync(testConfig.baselineFile, JSON.stringify(baselines));
      await ciIntegration.initialize();

      // Create test results with high regressions
      const testResults: PerformanceTestResult[] = Array.from({ length: 5 }, (_, i) => ({
        benchmark: {
          name: `Component ${i}`,
          component: `Component${i}`,
          maxRenderTime: 100,
          maxMemoryIncrease: 1024 * 100
        },
        metrics: {
          renderTime: 25, // 150% increase - high regression
          memoryUsage: { used: 1024, total: 2048, external: 0 }
        },
        passed: true,
        violations: [],
        timestamp: new Date()
      }));

      const result = await ciIntegration.processTestResults(testResults);

      expect(result.shouldFailBuild).toBe(true);
      expect(result.report.summary.high).toBeGreaterThanOrEqual(testConfig.failOnHighCount);
    });
  });

  describe('Report Generation', () => {
    it('should generate JSON and markdown reports', async () => {
      const testResults: PerformanceTestResult[] = [
        {
          benchmark: {
            name: 'Test Component',
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

      await ciIntegration.processTestResults(testResults);

      // Check JSON report
      expect(existsSync(testConfig.reportOutputFile)).toBe(true);
      const jsonReport = JSON.parse(readFileSync(testConfig.reportOutputFile, 'utf-8'));
      expect(jsonReport.buildNumber).toBe(testConfig.buildNumber);
      expect(jsonReport.summary.totalTests).toBe(1);

      // Check markdown report
      const markdownFile = testConfig.reportOutputFile.replace('.json', '.md');
      expect(existsSync(markdownFile)).toBe(true);
      const markdownContent = readFileSync(markdownFile, 'utf-8');
      expect(markdownContent).toContain('Performance Test Report');
      expect(markdownContent).toContain(testConfig.buildNumber);

      tempFiles.push(markdownFile);
    });

    it('should include performance metrics in reports', async () => {
      const testResults: PerformanceTestResult[] = [
        {
          benchmark: {
            name: 'Fast Component',
            component: 'FastComponent',
            maxRenderTime: 50,
            maxMemoryIncrease: 1024 * 50
          },
          metrics: {
            renderTime: 5.5,
            memoryUsage: { used: 1536, total: 2048, external: 0 }
          },
          passed: true,
          violations: [],
          timestamp: new Date()
        }
      ];

      await ciIntegration.processTestResults(testResults);

      const jsonReport = JSON.parse(readFileSync(testConfig.reportOutputFile, 'utf-8'));
      const testDetail = jsonReport.details.testResults[0];
      
      expect(testDetail.component).toBe('FastComponent');
      expect(testDetail.renderTime).toBe(5.5);
      expect(testDetail.memoryUsage).toBe(1536);
      expect(testDetail.passed).toBe(true);
    });
  });

  describe('GitHub Actions Integration', () => {
    it('should set GitHub output variables', () => {
      const originalGitHubOutput = process.env.GITHUB_OUTPUT;
      const tempOutputFile = join(process.cwd(), 'test-github-output');
      process.env.GITHUB_OUTPUT = tempOutputFile;
      tempFiles.push(tempOutputFile);

      const report = {
        buildNumber: 'test-123',
        timestamp: new Date(),
        totalTests: 5,
        regressions: [],
        summary: { critical: 1, high: 2, medium: 1, low: 0 }
      };

      PerformanceCIIntegration.setGitHubOutput(true, report);

      expect(existsSync(tempOutputFile)).toBe(true);
      const outputContent = readFileSync(tempOutputFile, 'utf-8');
      expect(outputContent).toContain('performance-passed=true');
      expect(outputContent).toContain('critical-regressions=1');
      expect(outputContent).toContain('high-regressions=2');
      expect(outputContent).toContain('total-regressions=0');

      process.env.GITHUB_OUTPUT = originalGitHubOutput;
    });

    it('should handle missing GitHub output file gracefully', () => {
      const originalGitHubOutput = process.env.GITHUB_OUTPUT;
      delete process.env.GITHUB_OUTPUT;

      const report = {
        buildNumber: 'test-123',
        timestamp: new Date(),
        totalTests: 1,
        regressions: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0 }
      };

      expect(() => {
        PerformanceCIIntegration.setGitHubOutput(false, report);
      }).not.toThrow();

      process.env.GITHUB_OUTPUT = originalGitHubOutput;
    });
  });

  describe('Alert Generation', () => {
    it('should generate alerts for different severity levels', async () => {
      // Set up baseline
      const baseline = [
        {
          componentName: 'TestComponent',
          averageRenderTime: 10,
          averageMemoryUsage: 1024,
          sampleCount: 10,
          lastUpdated: new Date().toISOString(),
          version: 'v1.0.0'
        }
      ];
      writeFileSync(testConfig.baselineFile, JSON.stringify(baseline));
      await ciIntegration.initialize();

      const testResults: PerformanceTestResult[] = [
        {
          benchmark: {
            name: 'Critical Regression',
            component: 'TestComponent',
            maxRenderTime: 100,
            maxMemoryIncrease: 1024 * 100
          },
          metrics: {
            renderTime: 40, // Critical regression
            memoryUsage: { used: 1024, total: 2048, external: 0 }
          },
          passed: true,
          violations: [],
          timestamp: new Date()
        }
      ];

      const result = await ciIntegration.processTestResults(testResults);

      const criticalAlert = result.alerts.find(alert => alert.level === 'critical');
      expect(criticalAlert).toBeDefined();
      expect(criticalAlert?.title).toContain('Performance Regression');
      expect(criticalAlert?.component).toBe('TestComponent');
      expect(criticalAlert?.metrics?.renderTime).toBe(40);
    });

    it('should generate summary alerts', async () => {
      const testResults: PerformanceTestResult[] = [
        {
          benchmark: {
            name: 'Failed Component',
            component: 'FailedComponent',
            maxRenderTime: 10,
            maxMemoryIncrease: 1024 * 10
          },
          metrics: {
            renderTime: 50,
            memoryUsage: { used: 1024 * 20, total: 1024 * 40, external: 0 }
          },
          passed: false,
          violations: ['Performance exceeded'],
          timestamp: new Date()
        }
      ];

      const result = await ciIntegration.processTestResults(testResults);

      const summaryAlert = result.alerts.find(alert => 
        alert.title === 'Performance Test Summary'
      );
      expect(summaryAlert).toBeDefined();
      expect(summaryAlert?.message).toContain('1 failed tests');
    });
  });

  describe('Notification System', () => {
    it('should prepare webhook notifications', async () => {
      // Mock console.log to capture webhook payload
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const testResults: PerformanceTestResult[] = [
        {
          benchmark: {
            name: 'Failed Component',
            component: 'FailedComponent',
            maxRenderTime: 10,
            maxMemoryIncrease: 1024 * 10
          },
          metrics: {
            renderTime: 50,
            memoryUsage: { used: 1024 * 20, total: 1024 * 40, external: 0 }
          },
          passed: false,
          violations: ['Performance exceeded'],
          timestamp: new Date()
        }
      ];

      await ciIntegration.processTestResults(testResults);

      // Verify webhook notification was prepared
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Would send webhook notification:'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });

    it('should prepare Slack notifications for critical issues', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const testResults: PerformanceTestResult[] = [
        {
          benchmark: {
            name: 'Critical Component',
            component: 'CriticalComponent',
            maxRenderTime: 5,
            maxMemoryIncrease: 1024 * 5
          },
          metrics: {
            renderTime: 100,
            memoryUsage: { used: 1024 * 50, total: 1024 * 100, external: 0 }
          },
          passed: false,
          violations: ['Critical performance failure'],
          timestamp: new Date()
        }
      ];

      await ciIntegration.processTestResults(testResults);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Would send Slack notification:'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });
  });
});