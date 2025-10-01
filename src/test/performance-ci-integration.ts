/**
 * Performance CI Integration
 * 
 * Provides CI/CD integration for performance testing including
 * automated alerts, build failure logic, and performance reporting
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PerformanceRegressionDetector, RegressionReport, PerformanceBaseline } from './performance-regression-detector';
import { PerformanceTestResult } from './performance-tester';
import { generateCIPerformanceReport } from './performance-test-utils';

export interface CIPerformanceConfig {
  baselineFile: string;
  reportOutputFile: string;
  buildNumber: string;
  failOnCritical: boolean;
  failOnHighCount: number;
  alertWebhookUrl?: string;
  slackWebhookUrl?: string;
}

export interface PerformanceAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  component?: string;
  buildNumber: string;
  timestamp: Date;
  metrics?: {
    renderTime?: number;
    memoryUsage?: number;
    cacheHitRate?: number;
  };
}

export class PerformanceCIIntegration {
  private config: CIPerformanceConfig;
  private regressionDetector: PerformanceRegressionDetector;

  constructor(config: CIPerformanceConfig) {
    this.config = config;
    this.regressionDetector = new PerformanceRegressionDetector(config.buildNumber);
  }

  /**
   * Initialize CI integration by loading existing baselines
   */
  async initialize(): Promise<void> {
    try {
      if (existsSync(this.config.baselineFile)) {
        const baselineData = JSON.parse(readFileSync(this.config.baselineFile, 'utf-8'));
        await this.regressionDetector.loadBaselines(baselineData);
        console.log(`Loaded ${baselineData.length} performance baselines`);
      } else {
        console.log('No existing baselines found, will create new ones');
      }
    } catch (error) {
      console.warn('Failed to load performance baselines:', error);
    }
  }

  /**
   * Process performance test results and generate reports
   */
  async processTestResults(results: PerformanceTestResult[]): Promise<{
    report: RegressionReport;
    shouldFailBuild: boolean;
    alerts: PerformanceAlert[];
  }> {
    // Generate regression report
    const report = this.regressionDetector.generateRegressionReport(results);
    
    // Determine if build should fail
    const shouldFailBuild = this.shouldFailBuild(report);
    
    // Generate alerts
    const alerts = this.generateAlerts(report, results);
    
    // Save updated baselines
    await this.saveBaselines();
    
    // Generate and save CI report
    await this.generateCIReport(report, results, alerts);
    
    // Send notifications if configured
    await this.sendNotifications(alerts, report);
    
    return { report, shouldFailBuild, alerts };
  }

  private shouldFailBuild(report: RegressionReport): boolean {
    if (this.config.failOnCritical && report.summary.critical > 0) {
      return true;
    }
    
    if (report.summary.high >= this.config.failOnHighCount) {
      return true;
    }
    
    return false;
  }

  private generateAlerts(report: RegressionReport, results: PerformanceTestResult[]): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    
    // Generate alerts for regressions
    report.regressions.forEach(regression => {
      const level = this.mapSeverityToLevel(regression.severity);
      
      alerts.push({
        level,
        title: `Performance Regression: ${regression.componentName}`,
        message: regression.message,
        component: regression.componentName,
        buildNumber: this.config.buildNumber,
        timestamp: new Date(),
        metrics: {
          renderTime: regression.type === 'render_time' ? regression.currentValue : undefined,
          memoryUsage: regression.type === 'memory_usage' ? regression.currentValue : undefined,
          cacheHitRate: regression.type === 'cache_performance' ? regression.currentValue : undefined
        }
      });
    });
    
    // Generate alerts for failed benchmarks
    const failedTests = results.filter(r => !r.passed);
    failedTests.forEach(test => {
      alerts.push({
        level: 'error',
        title: `Performance Benchmark Failed: ${test.benchmark.component}`,
        message: `Component exceeded performance thresholds: ${test.violations.join(', ')}`,
        component: test.benchmark.component,
        buildNumber: this.config.buildNumber,
        timestamp: new Date(),
        metrics: {
          renderTime: test.metrics.renderTime,
          memoryUsage: test.metrics.memoryUsage.used,
          cacheHitRate: test.metrics.cacheMetrics?.hitRate
        }
      });
    });
    
    // Generate summary alert if there are issues
    if (report.summary.critical > 0 || report.summary.high > 0 || failedTests.length > 0) {
      alerts.push({
        level: report.summary.critical > 0 ? 'critical' : 'warning',
        title: 'Performance Test Summary',
        message: `Build ${this.config.buildNumber}: ${failedTests.length} failed tests, ${report.summary.critical} critical regressions, ${report.summary.high} high regressions`,
        buildNumber: this.config.buildNumber,
        timestamp: new Date()
      });
    }
    
    return alerts;
  }

  private mapSeverityToLevel(severity: string): PerformanceAlert['level'] {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  }

  private async saveBaselines(): Promise<void> {
    try {
      const baselines = this.regressionDetector.exportBaselines();
      writeFileSync(this.config.baselineFile, JSON.stringify(baselines, null, 2));
      console.log(`Saved ${baselines.length} performance baselines to ${this.config.baselineFile}`);
    } catch (error) {
      console.error('Failed to save performance baselines:', error);
    }
  }

  private async generateCIReport(
    report: RegressionReport, 
    results: PerformanceTestResult[], 
    alerts: PerformanceAlert[]
  ): Promise<void> {
    try {
      const ciReport = {
        buildNumber: this.config.buildNumber,
        timestamp: new Date().toISOString(),
        summary: {
          totalTests: results.length,
          passedTests: results.filter(r => r.passed).length,
          failedTests: results.filter(r => !r.passed).length,
          regressions: report.summary
        },
        alerts: alerts.map(alert => ({
          level: alert.level,
          title: alert.title,
          message: alert.message,
          component: alert.component
        })),
        details: {
          regressionReport: report,
          testResults: results.map(r => ({
            component: r.benchmark.component,
            passed: r.passed,
            renderTime: r.metrics.renderTime,
            memoryUsage: r.metrics.memoryUsage.used,
            violations: r.violations
          }))
        }
      };

      // Save JSON report
      writeFileSync(this.config.reportOutputFile, JSON.stringify(ciReport, null, 2));
      
      // Generate markdown report for GitHub Actions
      const markdownReport = this.generateMarkdownReport(report, results, alerts);
      const markdownFile = this.config.reportOutputFile.replace('.json', '.md');
      writeFileSync(markdownFile, markdownReport);
      
      console.log(`Performance reports saved to ${this.config.reportOutputFile} and ${markdownFile}`);
    } catch (error) {
      console.error('Failed to generate CI report:', error);
    }
  }

  private generateMarkdownReport(
    report: RegressionReport, 
    results: PerformanceTestResult[], 
    alerts: PerformanceAlert[]
  ): string {
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.filter(r => !r.passed).length;
    
    let markdown = `# Performance Test Report - Build ${this.config.buildNumber}\n\n`;
    
    // Summary
    markdown += `## Summary\n\n`;
    markdown += `- **Total Tests:** ${results.length}\n`;
    markdown += `- **Passed:** ${passedTests} ✅\n`;
    markdown += `- **Failed:** ${failedTests} ❌\n`;
    markdown += `- **Critical Regressions:** ${report.summary.critical}\n`;
    markdown += `- **High Regressions:** ${report.summary.high}\n`;
    markdown += `- **Medium Regressions:** ${report.summary.medium}\n`;
    markdown += `- **Low Regressions:** ${report.summary.low}\n\n`;
    
    // Build status
    const shouldFail = this.shouldFailBuild(report);
    markdown += `## Build Status: ${shouldFail ? '❌ FAIL' : '✅ PASS'}\n\n`;
    
    if (shouldFail) {
      markdown += `**Build failed due to:**\n`;
      if (report.summary.critical > 0) {
        markdown += `- ${report.summary.critical} critical performance regressions\n`;
      }
      if (report.summary.high >= this.config.failOnHighCount) {
        markdown += `- ${report.summary.high} high-severity regressions (threshold: ${this.config.failOnHighCount})\n`;
      }
      markdown += `\n`;
    }
    
    // Failed tests
    if (failedTests > 0) {
      markdown += `## Failed Tests\n\n`;
      results.filter(r => !r.passed).forEach(result => {
        markdown += `### ${result.benchmark.component}\n`;
        markdown += `- **Render Time:** ${result.metrics.renderTime.toFixed(2)}ms (limit: ${result.benchmark.maxRenderTime}ms)\n`;
        markdown += `- **Memory Usage:** ${(result.metrics.memoryUsage.used / 1024).toFixed(2)}KB (limit: ${(result.benchmark.maxMemoryIncrease / 1024).toFixed(2)}KB)\n`;
        markdown += `- **Violations:**\n`;
        result.violations.forEach(violation => {
          markdown += `  - ${violation}\n`;
        });
        markdown += `\n`;
      });
    }
    
    // Regressions
    if (report.regressions.length > 0) {
      markdown += `## Performance Regressions\n\n`;
      report.regressions.forEach(regression => {
        const icon = regression.severity === 'critical' ? '🚨' : 
                     regression.severity === 'high' ? '⚠️' : 
                     regression.severity === 'medium' ? '⚡' : 'ℹ️';
        
        markdown += `${icon} **${regression.componentName}** (${regression.severity})\n`;
        markdown += `- ${regression.message}\n`;
        markdown += `- Degradation: ${regression.degradationPercentage.toFixed(1)}%\n\n`;
      });
    }
    
    // Performance metrics
    markdown += `## Performance Metrics\n\n`;
    markdown += `| Component | Render Time | Memory Usage | Status |\n`;
    markdown += `|-----------|-------------|--------------|--------|\n`;
    
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const renderTime = result.metrics.renderTime.toFixed(2);
      const memoryUsage = (result.metrics.memoryUsage.used / 1024).toFixed(2);
      
      markdown += `| ${result.benchmark.component} | ${renderTime}ms | ${memoryUsage}KB | ${status} |\n`;
    });
    
    markdown += `\n---\n`;
    markdown += `*Report generated on ${new Date().toISOString()}*\n`;
    
    return markdown;
  }

  private async sendNotifications(alerts: PerformanceAlert[], report: RegressionReport): Promise<void> {
    // Send webhook notifications if configured
    if (this.config.alertWebhookUrl) {
      await this.sendWebhookNotification(alerts, report);
    }
    
    // Send Slack notifications if configured
    if (this.config.slackWebhookUrl) {
      await this.sendSlackNotification(alerts, report);
    }
  }

  private async sendWebhookNotification(alerts: PerformanceAlert[], report: RegressionReport): Promise<void> {
    try {
      const payload = {
        buildNumber: this.config.buildNumber,
        timestamp: new Date().toISOString(),
        alerts: alerts.filter(a => a.level === 'critical' || a.level === 'error'),
        summary: report.summary
      };

      // In a real implementation, you would use fetch or axios to send the webhook
      console.log('Would send webhook notification:', JSON.stringify(payload, null, 2));
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  private async sendSlackNotification(alerts: PerformanceAlert[], report: RegressionReport): Promise<void> {
    try {
      const criticalAlerts = alerts.filter(a => a.level === 'critical' || a.level === 'error');
      
      if (criticalAlerts.length === 0) {
        return; // No critical alerts to send
      }

      const message = {
        text: `Performance Alert - Build ${this.config.buildNumber}`,
        attachments: [
          {
            color: 'danger',
            title: 'Performance Issues Detected',
            fields: [
              {
                title: 'Critical Regressions',
                value: report.summary.critical.toString(),
                short: true
              },
              {
                title: 'High Regressions',
                value: report.summary.high.toString(),
                short: true
              }
            ],
            text: criticalAlerts.map(alert => `• ${alert.title}: ${alert.message}`).join('\n')
          }
        ]
      };

      // In a real implementation, you would use fetch or axios to send to Slack
      console.log('Would send Slack notification:', JSON.stringify(message, null, 2));
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  /**
   * Get CI environment configuration
   */
  static getCIConfig(): CIPerformanceConfig {
    const buildNumber = process.env.GITHUB_RUN_NUMBER || 
                       process.env.BUILD_NUMBER || 
                       process.env.CI_PIPELINE_ID || 
                       'local-' + Date.now();

    return {
      baselineFile: join(process.cwd(), 'performance-baselines.json'),
      reportOutputFile: join(process.cwd(), 'performance-report.json'),
      buildNumber,
      failOnCritical: process.env.PERFORMANCE_FAIL_ON_CRITICAL !== 'false',
      failOnHighCount: parseInt(process.env.PERFORMANCE_FAIL_ON_HIGH_COUNT || '3'),
      alertWebhookUrl: process.env.PERFORMANCE_WEBHOOK_URL,
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL
    };
  }

  /**
   * Create GitHub Actions output for performance results
   */
  static setGitHubOutput(shouldFailBuild: boolean, report: RegressionReport): void {
    if (process.env.GITHUB_OUTPUT) {
      const outputs = [
        `performance-passed=${!shouldFailBuild}`,
        `critical-regressions=${report.summary.critical}`,
        `high-regressions=${report.summary.high}`,
        `total-regressions=${report.regressions.length}`
      ];

      try {
        const fs = require('fs');
        fs.appendFileSync(process.env.GITHUB_OUTPUT, outputs.join('\n') + '\n');
      } catch (error) {
        console.error('Failed to set GitHub output:', error);
      }
    }
  }
}