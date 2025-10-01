import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CoverageReport {
  total: {
    lines: { pct: number };
    statements: { pct: number };
    functions: { pct: number };
    branches: { pct: number };
  };
  files: Record<string, {
    lines: { pct: number };
    statements: { pct: number };
    functions: { pct: number };
    branches: { pct: number };
  }>;
}

interface ReliabilityReport {
  current: number;
  trend: number[];
  flakyTests: string[];
  buildWindow: number;
}

interface AccessibilityReport {
  automatedScore: number;
  manualTestsRequired: number;
  violations: Array<{
    rule: string;
    severity: 'critical' | 'serious' | 'moderate' | 'minor';
    count: number;
  }>;
}

interface QualityGateReport {
  passed: boolean;
  coverage: {
    overall: number;
    components: number;
    utilities: number;
    violations: Array<{
      file: string;
      coverage: number;
      threshold: number;
      type: string;
    }>;
  };
  reliability: {
    current: number;
    flakyTests: string[];
    trend: number[];
  };
  accessibility: {
    automatedScore: number;
    manualTestsRequired: number;
    violations: number;
  };
  alerts: Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    remediation: string;
  }>;
  timestamp: string;
}

class QualityGateEvaluator {
  private readonly COVERAGE_THRESHOLDS = {
    overall: 90,
    components: 75,
    utilities: 85,
    files: 80
  };

  private readonly RELIABILITY_THRESHOLD = 99;
  private readonly FLAKY_TEST_THRESHOLD = 1; // 1% max flaky tests

  async evaluate(): Promise<QualityGateReport> {
    console.log('🔍 Evaluating quality gates...');

    const coverage = await this.evaluateCoverage();
    const reliability = await this.evaluateReliability();
    const accessibility = await this.evaluateAccessibility();

    const alerts = this.generateAlerts(coverage, reliability, accessibility);
    const passed = this.determineOverallStatus(coverage, reliability, accessibility, alerts);

    const report: QualityGateReport = {
      passed,
      coverage,
      reliability,
      accessibility,
      alerts,
      timestamp: new Date().toISOString()
    };

    // Write report for CI consumption
    writeFileSync('quality-gate-report.json', JSON.stringify(report, null, 2));

    this.logResults(report);
    return report;
  }

  private async evaluateCoverage() {
    console.log('📊 Evaluating coverage metrics...');

    const coverageFile = join(process.cwd(), 'coverage', 'coverage-summary.json');
    if (!existsSync(coverageFile)) {
      throw new Error('Coverage report not found. Run tests with coverage first.');
    }

    const coverageData: CoverageReport = JSON.parse(readFileSync(coverageFile, 'utf8'));
    const overall = coverageData.total.lines.pct;

    // Calculate per-module coverage
    const componentFiles = Object.entries(coverageData.files)
      .filter(([path]) => path.includes('/components/'));
    const utilityFiles = Object.entries(coverageData.files)
      .filter(([path]) => path.includes('/utils/') || path.includes('/services/'));

    const components = componentFiles.length > 0 
      ? componentFiles.reduce((sum, [, data]) => sum + data.lines.pct, 0) / componentFiles.length
      : 100;

    const utilities = utilityFiles.length > 0
      ? utilityFiles.reduce((sum, [, data]) => sum + data.lines.pct, 0) / utilityFiles.length
      : 100;

    // Find coverage violations
    const violations = [];
    for (const [filePath, fileData] of Object.entries(coverageData.files)) {
      const isComponent = filePath.includes('/components/');
      const isUtility = filePath.includes('/utils/') || filePath.includes('/services/');
      
      let threshold = this.COVERAGE_THRESHOLDS.files;
      let type = 'file';

      if (isComponent) {
        threshold = this.COVERAGE_THRESHOLDS.components;
        type = 'component';
      } else if (isUtility) {
        threshold = this.COVERAGE_THRESHOLDS.utilities;
        type = 'utility';
      }

      if (fileData.lines.pct < threshold) {
        violations.push({
          file: filePath,
          coverage: fileData.lines.pct,
          threshold,
          type
        });
      }
    }

    return {
      overall,
      components,
      utilities,
      violations
    };
  }

  private async evaluateReliability() {
    console.log('🎯 Evaluating test reliability...');

    const reliabilityFile = join(process.cwd(), 'test-results', 'reliability-report.json');
    if (!existsSync(reliabilityFile)) {
      console.warn('⚠️ Reliability report not found. Assuming 100% reliability.');
      return {
        current: 100,
        flakyTests: [],
        trend: [100]
      };
    }

    const reliabilityData: ReliabilityReport = JSON.parse(readFileSync(reliabilityFile, 'utf8'));
    
    return {
      current: reliabilityData.current,
      flakyTests: reliabilityData.flakyTests,
      trend: reliabilityData.trend
    };
  }

  private async evaluateAccessibility() {
    console.log('♿ Evaluating accessibility compliance...');

    const a11yFile = join(process.cwd(), 'test-results', 'accessibility-report.json');
    if (!existsSync(a11yFile)) {
      console.warn('⚠️ Accessibility report not found. Manual validation required.');
      return {
        automatedScore: 0,
        manualTestsRequired: 10,
        violations: 0
      };
    }

    const a11yData: AccessibilityReport = JSON.parse(readFileSync(a11yFile, 'utf8'));
    
    return {
      automatedScore: a11yData.automatedScore,
      manualTestsRequired: a11yData.manualTestsRequired,
      violations: a11yData.violations.length
    };
  }

  private generateAlerts(coverage: any, reliability: any, accessibility: any) {
    const alerts = [];

    // Coverage alerts
    if (coverage.overall < this.COVERAGE_THRESHOLDS.overall) {
      alerts.push({
        type: 'coverage',
        severity: 'high' as const,
        message: `Overall coverage ${coverage.overall}% below ${this.COVERAGE_THRESHOLDS.overall}% threshold`,
        remediation: 'Add tests for uncovered code paths'
      });
    }

    if (coverage.violations.length > 0) {
      alerts.push({
        type: 'coverage-violations',
        severity: 'medium' as const,
        message: `${coverage.violations.length} files below coverage thresholds`,
        remediation: `Fix coverage for: ${coverage.violations.slice(0, 3).map(v => v.file).join(', ')}`
      });
    }

    // Reliability alerts
    if (reliability.current < this.RELIABILITY_THRESHOLD) {
      alerts.push({
        type: 'reliability',
        severity: 'critical' as const,
        message: `Test reliability ${reliability.current}% below ${this.RELIABILITY_THRESHOLD}% threshold`,
        remediation: 'Fix flaky tests and improve test stability'
      });
    }

    if (reliability.flakyTests.length > 0) {
      const flakyRate = (reliability.flakyTests.length / 100) * 100; // Assuming ~100 tests
      if (flakyRate > this.FLAKY_TEST_THRESHOLD) {
        alerts.push({
          type: 'flaky-tests',
          severity: 'high' as const,
          message: `${reliability.flakyTests.length} flaky tests detected (${flakyRate.toFixed(1)}% rate)`,
          remediation: `Fix flaky tests: ${reliability.flakyTests.slice(0, 3).join(', ')}`
        });
      }
    }

    // Accessibility alerts
    if (accessibility.automatedScore < 95) {
      alerts.push({
        type: 'accessibility',
        severity: 'medium' as const,
        message: `Accessibility automated score ${accessibility.automatedScore}% below 95% target`,
        remediation: 'Fix accessibility violations and improve WCAG compliance'
      });
    }

    return alerts;
  }

  private determineOverallStatus(coverage: any, reliability: any, accessibility: any, alerts: any[]) {
    // Critical failures that block builds
    const criticalFailures = [
      coverage.overall < this.COVERAGE_THRESHOLDS.overall,
      reliability.current < this.RELIABILITY_THRESHOLD,
      alerts.some(alert => alert.severity === 'critical')
    ];

    return !criticalFailures.some(failure => failure);
  }

  private logResults(report: QualityGateReport) {
    console.log('\n📋 Quality Gate Results:');
    console.log('========================');
    
    console.log(`\n📊 Coverage:`);
    console.log(`  Overall: ${report.coverage.overall}% (Target: ${this.COVERAGE_THRESHOLDS.overall}%+)`);
    console.log(`  Components: ${report.coverage.components.toFixed(1)}% (Target: ${this.COVERAGE_THRESHOLDS.components}%+)`);
    console.log(`  Utilities: ${report.coverage.utilities.toFixed(1)}% (Target: ${this.COVERAGE_THRESHOLDS.utilities}%+)`);
    console.log(`  Violations: ${report.coverage.violations.length} files`);

    console.log(`\n🎯 Reliability:`);
    console.log(`  Current: ${report.reliability.current}% (Target: ${this.RELIABILITY_THRESHOLD}%+)`);
    console.log(`  Flaky Tests: ${report.reliability.flakyTests.length} (Target: <${this.FLAKY_TEST_THRESHOLD}%)`);

    console.log(`\n♿ Accessibility:`);
    console.log(`  Automated Score: ${report.accessibility.automatedScore}%`);
    console.log(`  Manual Tests Required: ${report.accessibility.manualTestsRequired}`);

    if (report.alerts.length > 0) {
      console.log(`\n⚠️ Alerts (${report.alerts.length}):`);
      report.alerts.forEach(alert => {
        const icon = alert.severity === 'critical' ? '🚨' : 
                    alert.severity === 'high' ? '⚠️' : 
                    alert.severity === 'medium' ? '⚡' : 'ℹ️';
        console.log(`  ${icon} ${alert.type}: ${alert.message}`);
      });
    }

    console.log(`\n${report.passed ? '✅ Quality Gate: PASSED' : '❌ Quality Gate: FAILED'}`);
    
    if (!report.passed) {
      console.log('\n🔧 Remediation Steps:');
      report.alerts.forEach(alert => {
        console.log(`  - ${alert.remediation}`);
      });
      
      // Only exit in non-test environments
      if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
        process.exit(1);
      }
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const evaluator = new QualityGateEvaluator();
  evaluator.evaluate().catch(error => {
    console.error('❌ Quality gate evaluation failed:', error.message);
    if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
      process.exit(1);
    }
  });
}

export { QualityGateEvaluator };