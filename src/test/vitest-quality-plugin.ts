/**
 * Vitest Quality Plugin
 * 
 * Integrates reliability tracking, coverage enforcement, and metrics collection
 * into the Vitest test runner for automated quality monitoring.
 */

import type { Plugin } from 'vite';
import type { TestContext, TestSuite as VitestTestSuite, TaskResultPack } from 'vitest';
import { reliabilityTracker } from './reliability-tracker';
import type { TestRun, TestSuite } from './reliability-tracker';
import type { CoverageReport } from './coverage-enforcer';
import { testDataPersistence } from './test-data-persistence';
import { createTestMetricsDashboard } from './test-metrics-dashboard';

export interface QualityPluginOptions {
  enableReliabilityTracking?: boolean;
  enableCoverageEnforcement?: boolean;
  enableMetricsDashboard?: boolean;
  enableDataPersistence?: boolean;
  failOnThresholdViolation?: boolean;
  buildNumber?: number;
  environment?: string;
}

export function vitestQualityPlugin(options: QualityPluginOptions = {}): Plugin {
  const config = {
    enableReliabilityTracking: true,
    enableCoverageEnforcement: true,
    enableMetricsDashboard: false, // Disabled by default for CI
    enableDataPersistence: true,
    failOnThresholdViolation: true,
    buildNumber: parseInt(process.env.BUILD_NUMBER || Date.now().toString()),
    environment: process.env.NODE_ENV || 'test',
    ...options
  };

  let testSuiteStartTime: number;
  let currentTestRuns: TestRun[] = [];

  return {
    name: 'vitest-quality-plugin',
    
    configureServer(server) {
      // Initialize dashboard if enabled
      if (config.enableMetricsDashboard) {
        const dashboard = createTestMetricsDashboard(
          reliabilityTracker,
          coverageEnforcer,
          testDataPersistence
        );
        dashboard.start();
        
        // Cleanup on server close
        server.httpServer?.on('close', () => {
          dashboard.stop();
        });
      }
    },

    configResolved(resolvedConfig) {
      // Store Vitest instance when available
      if (resolvedConfig.test) {
        // Configuration is available, we can set up hooks
      }
    },

    buildStart() {
      if (config.enableReliabilityTracking) {
        testSuiteStartTime = Date.now();
        currentTestRuns = [];
        console.log('🔍 Test quality monitoring started');
      }
    },

    async buildEnd() {
      if (!config.enableReliabilityTracking) return;

      try {
        // Create test suite summary
        const testSuite: TestSuite = {
          suiteName: 'Full Test Suite',
          buildNumber: config.buildNumber,
          timestamp: new Date(),
          totalTests: currentTestRuns.length,
          passedTests: currentTestRuns.filter(r => r.status === 'pass').length,
          failedTests: currentTestRuns.filter(r => r.status === 'fail').length,
          skippedTests: currentTestRuns.filter(r => r.status === 'skip').length,
          duration: Date.now() - testSuiteStartTime
        };

        // Add to reliability tracker
        reliabilityTracker.addTestSuite(testSuite);
        currentTestRuns.forEach(run => reliabilityTracker.addTestRun(run));

        // Calculate and log reliability metrics
        const metrics = reliabilityTracker.calculateReliability();
        console.log(`📊 Test Reliability: ${metrics.overallReliability.toFixed(2)}% (${metrics.buildWindow} builds)`);
        
        if (metrics.flakyTests.length > 0) {
          console.warn(`⚠️  Flaky tests detected: ${metrics.flakyTests.length}`);
          metrics.flakyTests.slice(0, 3).forEach(test => {
            console.warn(`   - ${test.testName} (${(test.failureRate * 100).toFixed(1)}% failure rate)`);
          });
        }

        // Persist data if enabled
        if (config.enableDataPersistence) {
          await testDataPersistence.saveTestData({
            testRuns: currentTestRuns,
            testSuites: [testSuite],
            metadata: {
              version: '1.0.0',
              lastUpdated: new Date(),
              totalBuilds: 1,
              environment: config.environment
            }
          });
        }

        // Fail build if reliability is too low
        if (config.failOnThresholdViolation && metrics.overallReliability < 99) {
          throw new Error(
            `Test reliability ${metrics.overallReliability.toFixed(2)}% is below 99% threshold. ` +
            `Fix failing tests before proceeding.`
          );
        }

      } catch (error) {
        console.error('❌ Test quality monitoring failed:', error);
        if (config.failOnThresholdViolation) {
          throw error;
        }
      }
    }
  };
}

/**
 * Vitest reporter for quality metrics
 */
export class QualityReporter {
  private testRuns: TestRun[] = [];
  private suiteStartTime: number = Date.now();

  onInit(ctx: TestContext) {
    console.log('🔍 Quality Reporter initialized');
    this.suiteStartTime = Date.now();
  }

  onTaskUpdate(packs: TaskResultPack[]) {
    for (const [id, result] of packs) {
      if (result?.state && result.state !== 'queued') {
        const testRun: TestRun = {
          testName: this.getTestName(id, result),
          status: this.mapTestStatus(result.state),
          duration: result.duration || 0,
          buildNumber: parseInt(process.env.BUILD_NUMBER || Date.now().toString()),
          timestamp: new Date(),
          error: result.errors?.[0]?.message,
          retries: result.retryCount || 0
        };

        this.testRuns.push(testRun);
      }
    }
  }

  async onFinished(files: VitestTestSuite[], errors: unknown[]) {
    try {
      // Calculate suite metrics
      const totalDuration = Date.now() - this.suiteStartTime;
      const testSuite: TestSuite = {
        suiteName: 'Test Suite',
        buildNumber: parseInt(process.env.BUILD_NUMBER || Date.now().toString()),
        timestamp: new Date(),
        totalTests: this.testRuns.length,
        passedTests: this.testRuns.filter(r => r.status === 'pass').length,
        failedTests: this.testRuns.filter(r => r.status === 'fail').length,
        skippedTests: this.testRuns.filter(r => r.status === 'skip').length,
        duration: totalDuration
      };

      // Add to reliability tracker
      reliabilityTracker.addTestSuite(testSuite);
      this.testRuns.forEach(run => reliabilityTracker.addTestRun(run));

      // Generate quality report
      const metrics = reliabilityTracker.calculateReliability();
      this.logQualityReport(metrics, testSuite);

      // Persist data
      await testDataPersistence.saveTestData({
        testRuns: this.testRuns,
        testSuites: [testSuite],
        metadata: {
          version: '1.0.0',
          lastUpdated: new Date(),
          totalBuilds: 1,
          environment: process.env.NODE_ENV || 'test'
        }
      });

    } catch (error) {
      console.error('Failed to generate quality report:', error);
    }
  }

  private getTestName(id: string, result: any): string {
    // Extract meaningful test name from Vitest result
    return result.name || id || 'Unknown Test';
  }

  private mapTestStatus(state: string): TestRun['status'] {
    switch (state) {
      case 'pass': return 'pass';
      case 'fail': return 'fail';
      case 'skip': return 'skip';
      case 'todo': return 'todo';
      default: return 'fail';
    }
  }

  private logQualityReport(metrics: any, suite: TestSuite): void {
    console.log('\n📊 Test Quality Report');
    console.log('═'.repeat(50));
    console.log(`Reliability: ${metrics.overallReliability.toFixed(2)}% (Target: 99%)`);
    console.log(`Total Tests: ${suite.totalTests}`);
    console.log(`Passed: ${suite.passedTests} | Failed: ${suite.failedTests} | Skipped: ${suite.skippedTests}`);
    console.log(`Duration: ${(suite.duration / 1000).toFixed(2)}s`);
    console.log(`Build Window: ${metrics.buildWindow} builds`);
    
    if (metrics.flakyTests.length > 0) {
      console.log(`\n⚠️  Flaky Tests (${metrics.flakyTests.length}):`);
      metrics.flakyTests.slice(0, 5).forEach((test: any) => {
        console.log(`   • ${test.testName} (${(test.failureRate * 100).toFixed(1)}% failure)`);
      });
    }
    
    console.log('═'.repeat(50));
  }
}

/**
 * Coverage validation hook for Vitest
 */
export async function validateCoverageThresholds(coverageReport: any): Promise<void> {
  if (!coverageReport) {
    console.warn('⚠️  No coverage report available for validation');
    return;
  }

  try {
    // Import coverage enforcer dynamically to avoid circular imports
    const { coverageEnforcer } = await import('./coverage-enforcer');
    
    // Convert Vitest coverage format to our format
    const formattedReport: CoverageReport = {
      overall: {
        statements: coverageReport.statements?.pct || 0,
        branches: coverageReport.branches?.pct || 0,
        functions: coverageReport.functions?.pct || 0,
        lines: coverageReport.lines?.pct || 0
      },
      files: {},
      summary: {
        totalFiles: Object.keys(coverageReport.files || {}).length,
        coveredFiles: 0,
        uncoveredFiles: 0,
        averageCoverage: 0
      }
    };

    // Process file-level coverage
    if (coverageReport.files) {
      for (const [filePath, fileData] of Object.entries(coverageReport.files)) {
        const data = fileData as any;
        formattedReport.files[filePath] = {
          path: filePath,
          coverage: {
            statements: data.statements?.pct || 0,
            branches: data.branches?.pct || 0,
            functions: data.functions?.pct || 0,
            lines: data.lines?.pct || 0
          },
          type: determineFileType(filePath),
          size: 0,
          lastModified: new Date()
        };
      }
    }

    // Validate coverage
    const result = await coverageEnforcer.validateCoverage(formattedReport);
    
    console.log('\n📋 Coverage Validation Report');
    console.log('═'.repeat(50));
    console.log(`Overall Coverage: ${result.overallCoverage.toFixed(2)}% (Target: 90%)`);
    console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (result.violations.length > 0) {
      console.log(`\n❌ Violations (${result.violations.length}):`);
      result.violations.slice(0, 10).forEach(violation => {
        console.log(`   • ${violation.file}: ${violation.actual.toFixed(1)}% < ${violation.expected}% (${violation.type})`);
      });
    }

    if (result.summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.summary.recommendations.slice(0, 3).forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
    
    console.log('═'.repeat(50));

    // Fail if thresholds not met
    if (!result.passed && process.env.FAIL_ON_COVERAGE_THRESHOLD !== 'false') {
      throw new Error(
        `Coverage validation failed: ${result.violations.length} violations detected. ` +
        `Overall coverage ${result.overallCoverage.toFixed(2)}% may be below thresholds.`
      );
    }

  } catch (error) {
    console.error('Coverage validation failed:', error);
    throw error;
  }
}

function determineFileType(filePath: string): 'component' | 'utility' | 'service' | 'page' | 'hook' | 'store' | 'other' {
  if (filePath.includes('/components/')) return 'component';
  if (filePath.includes('/utils/')) return 'utility';
  if (filePath.includes('/services/')) return 'service';
  if (filePath.includes('/pages/')) return 'page';
  if (filePath.includes('/hooks/')) return 'hook';
  if (filePath.includes('/stores/')) return 'store';
  return 'other';
}

// Export default plugin
export default vitestQualityPlugin;