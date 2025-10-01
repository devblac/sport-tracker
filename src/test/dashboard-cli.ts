#!/usr/bin/env node

/**
 * Test Metrics Dashboard CLI
 * 
 * Command-line interface for the test metrics dashboard system.
 * Provides commands for viewing metrics, generating reports, and managing alerts.
 */

import { TestMetricsDashboard, createTestMetricsDashboard } from './test-metrics-dashboard';
import { ReliabilityTracker } from './reliability-tracker';
import { EnhancedCoverageEnforcer } from './coverage-enforcer';
import { TestDataPersistence } from './test-data-persistence';

interface CLIOptions {
  command: string;
  format?: 'json' | 'text' | 'prometheus';
  output?: string;
  days?: number;
  watch?: boolean;
  alerts?: boolean;
}

class DashboardCLI {
  private dashboard: TestMetricsDashboard;

  constructor() {
    // Initialize dashboard components
    const reliabilityTracker = new ReliabilityTracker();
    const coverageEnforcer = new EnhancedCoverageEnforcer();
    const dataPersistence = new TestDataPersistence();
    
    this.dashboard = createTestMetricsDashboard(
      reliabilityTracker,
      coverageEnforcer,
      dataPersistence
    );
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(): CLIOptions {
    const args = process.argv.slice(2);
    const options: CLIOptions = {
      command: args[0] || 'status'
    };

    for (let i = 1; i < args.length; i += 2) {
      const flag = args[i];
      const value = args[i + 1];

      switch (flag) {
        case '--format':
          options.format = value as 'json' | 'text' | 'prometheus';
          break;
        case '--output':
          options.output = value;
          break;
        case '--days':
          options.days = parseInt(value, 10);
          break;
        case '--watch':
          options.watch = true;
          i--; // No value for this flag
          break;
        case '--alerts':
          options.alerts = true;
          i--; // No value for this flag
          break;
      }
    }

    return options;
  }

  /**
   * Execute CLI command
   */
  async run(): Promise<void> {
    const options = this.parseArgs();

    try {
      switch (options.command) {
        case 'status':
          await this.showStatus(options);
          break;
        case 'report':
          await this.generateReport(options);
          break;
        case 'alerts':
          await this.showAlerts(options);
          break;
        case 'trends':
          await this.showTrends(options);
          break;
        case 'export':
          await this.exportData(options);
          break;
        case 'start':
          await this.startDashboard(options);
          break;
        case 'help':
          this.showHelp();
          break;
        default:
          console.error(`Unknown command: ${options.command}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error('CLI Error:', error);
      process.exit(1);
    }
  }

  /**
   * Show current dashboard status
   */
  private async showStatus(options: CLIOptions): Promise<void> {
    const status = this.dashboard.getStatusSummary();
    
    if (options.format === 'json') {
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    console.log('📊 Test Quality Dashboard Status');
    console.log('================================');
    console.log();
    
    const statusEmoji = status.status === 'healthy' ? '✅' : 
                       status.status === 'warning' ? '⚠️' : '🚨';
    
    console.log(`${statusEmoji} Overall Status: ${status.status.toUpperCase()}`);
    console.log(`🎯 Reliability: ${status.reliability.toFixed(2)}%`);
    console.log(`📈 Coverage: ${status.coverage.toFixed(2)}%`);
    console.log(`🚨 Active Alerts: ${status.activeAlerts}`);
    console.log(`🕒 Last Update: ${status.lastUpdate.toLocaleString()}`);
    console.log();

    if (status.activeAlerts > 0) {
      console.log('Run `npm run dashboard alerts` to see active alerts');
    }
  }

  /**
   * Generate comprehensive dashboard report
   */
  private async generateReport(options: CLIOptions): Promise<void> {
    console.log('Generating test quality report...');
    
    const report = await this.dashboard.generateReport();
    
    if (options.output) {
      const fs = await import('fs/promises');
      await fs.writeFile(options.output, report);
      console.log(`Report saved to: ${options.output}`);
    } else {
      console.log(report);
    }
  }

  /**
   * Show active alerts
   */
  private async showAlerts(options: CLIOptions): Promise<void> {
    const alerts = this.dashboard.getActiveAlerts();
    
    if (options.format === 'json') {
      console.log(JSON.stringify(alerts, null, 2));
      return;
    }

    console.log('🚨 Active Test Quality Alerts');
    console.log('=============================');
    console.log();

    if (alerts.length === 0) {
      console.log('✅ No active alerts - all systems healthy!');
      return;
    }

    for (const alert of alerts) {
      const emoji = this.getAlertEmoji(alert.severity);
      console.log(`${emoji} [${alert.severity.toUpperCase()}] ${alert.type}`);
      console.log(`   ${alert.message}`);
      console.log(`   ${alert.details}`);
      console.log(`   Time: ${alert.timestamp.toLocaleString()}`);
      
      if (alert.remediation.length > 0) {
        console.log(`   Remediation: ${alert.remediation[0]}`);
      }
      console.log();
    }

    console.log(`Total alerts: ${alerts.length}`);
    console.log('Use `npm run dashboard acknowledge <alert-id>` to acknowledge alerts');
  }

  /**
   * Show trend analysis
   */
  private async showTrends(options: CLIOptions): Promise<void> {
    const metrics = await this.dashboard.getCurrentMetrics();
    const days = options.days || 7;
    
    if (options.format === 'json') {
      console.log(JSON.stringify(metrics.trends, null, 2));
      return;
    }

    console.log(`📈 Test Quality Trends (Last ${days} days)`);
    console.log('=========================================');
    console.log();

    // Reliability trend
    const recentReliability = metrics.trends.reliabilityTrend.slice(-days);
    if (recentReliability.length > 0) {
      console.log('🎯 Reliability Trend:');
      for (const point of recentReliability) {
        const indicator = point.reliability >= 99 ? '✅' : 
                         point.reliability >= 95 ? '⚠️' : '🚨';
        console.log(`   ${point.date}: ${indicator} ${point.reliability.toFixed(2)}%`);
      }
      console.log();
    }

    // Coverage trend by module
    const moduleTypes = ['component', 'utility', 'service', 'hook', 'store'];
    for (const moduleType of moduleTypes) {
      const moduleTrend = metrics.trends.coverageTrend
        .filter(t => t.module === moduleType)
        .slice(-3); // Last 3 days
      
      if (moduleTrend.length > 0) {
        const latest = moduleTrend[moduleTrend.length - 1];
        const indicator = latest.coverage >= 85 ? '✅' : 
                         latest.coverage >= 75 ? '⚠️' : '🚨';
        console.log(`📊 ${moduleType}: ${indicator} ${latest.coverage.toFixed(1)}%`);
      }
    }
    console.log();

    // Flaky tests trend
    const recentFlaky = metrics.trends.flakyTestTrend.slice(-days);
    if (recentFlaky.length > 0) {
      const totalFlaky = recentFlaky.reduce((sum, day) => sum + day.count, 0);
      console.log(`🔄 Flaky Tests: ${totalFlaky} detected over ${days} days`);
      
      if (totalFlaky > 0) {
        const latestFlaky = recentFlaky[recentFlaky.length - 1];
        if (latestFlaky.tests.length > 0) {
          console.log(`   Recent: ${latestFlaky.tests.slice(0, 3).join(', ')}`);
        }
      }
      console.log();
    }
  }

  /**
   * Export dashboard data
   */
  private async exportData(options: CLIOptions): Promise<void> {
    const format = options.format || 'json';
    const data = await this.dashboard.exportDashboardData(format);
    
    if (options.output) {
      const fs = await import('fs/promises');
      await fs.writeFile(options.output, data);
      console.log(`Data exported to: ${options.output}`);
    } else {
      console.log(data);
    }
  }

  /**
   * Start dashboard in watch mode
   */
  private async startDashboard(options: CLIOptions): Promise<void> {
    console.log('🚀 Starting Test Metrics Dashboard...');
    
    this.dashboard.start();
    
    if (options.alerts) {
      this.dashboard.setupAutomatedAlerts();
      console.log('🚨 Alert system enabled');
    }
    
    console.log('📊 Dashboard running - Press Ctrl+C to stop');
    console.log('View status: npm run dashboard status');
    console.log('View report: npm run dashboard report');
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping dashboard...');
      this.dashboard.stop();
      process.exit(0);
    });
    
    // Show periodic status updates if in watch mode
    if (options.watch) {
      setInterval(async () => {
        const status = this.dashboard.getStatusSummary();
        console.log(`[${new Date().toLocaleTimeString()}] Status: ${status.status}, Reliability: ${status.reliability.toFixed(1)}%, Alerts: ${status.activeAlerts}`);
      }, 30000); // Every 30 seconds
    }
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log('Test Metrics Dashboard CLI');
    console.log('=========================');
    console.log();
    console.log('Usage: npm run dashboard <command> [options]');
    console.log();
    console.log('Commands:');
    console.log('  status              Show current dashboard status');
    console.log('  report              Generate comprehensive quality report');
    console.log('  alerts              Show active alerts');
    console.log('  trends              Show trend analysis');
    console.log('  export              Export dashboard data');
    console.log('  start               Start dashboard in monitoring mode');
    console.log('  help                Show this help message');
    console.log();
    console.log('Options:');
    console.log('  --format <format>   Output format: json, text, prometheus');
    console.log('  --output <file>     Save output to file');
    console.log('  --days <number>     Number of days for trend analysis');
    console.log('  --watch             Enable watch mode for continuous monitoring');
    console.log('  --alerts            Enable automated alert system');
    console.log();
    console.log('Examples:');
    console.log('  npm run dashboard status');
    console.log('  npm run dashboard report --output quality-report.md');
    console.log('  npm run dashboard trends --days 14');
    console.log('  npm run dashboard export --format prometheus');
    console.log('  npm run dashboard start --watch --alerts');
  }

  /**
   * Get emoji for alert severity
   */
  private getAlertEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return '💡';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new DashboardCLI();
  cli.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { DashboardCLI };