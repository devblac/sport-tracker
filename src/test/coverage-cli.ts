#!/usr/bin/env node

/**
 * Coverage Enforcement CLI
 * 
 * Command-line utility for running coverage enforcement
 * Requirements: 10.3, 11.1
 */

import { EnhancedCoverageEnforcer } from './coverage-enforcer';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

interface CLIOptions {
  reportPath?: string;
  outputPath?: string;
  format: 'console' | 'markdown' | 'json';
  failOnViolation: boolean;
  verbose: boolean;
}

class CoverageCLI {
  private enforcer: EnhancedCoverageEnforcer;

  constructor() {
    this.enforcer = new EnhancedCoverageEnforcer();
  }

  async run(options: CLIOptions): Promise<void> {
    try {
      console.log('🔍 Loading coverage report...');
      
      const report = await this.enforcer.loadCoverageReport(options.reportPath);
      
      if (!report) {
        console.error('❌ Failed to load coverage report');
        console.error('Expected locations:');
        console.error('  - ./coverage/coverage-final.json');
        console.error('  - ./coverage/coverage-summary.json');
        console.error('  - ./test-results/coverage.json');
        process.exit(1);
      }

      console.log(`📊 Analyzing coverage for ${report.summary.totalFiles} files...`);
      
      const result = await this.enforcer.validateCoverage(report);
      
      // Generate output based on format
      let output: string;
      
      switch (options.format) {
        case 'json':
          output = JSON.stringify(result, null, 2);
          break;
        case 'markdown':
          output = this.enforcer.createComprehensiveReport(result);
          break;
        default:
          output = this.formatConsoleOutput(result);
      }

      // Output to file or console
      if (options.outputPath) {
        const fullPath = resolve(process.cwd(), options.outputPath);
        writeFileSync(fullPath, output, 'utf-8');
        console.log(`📝 Report written to: ${fullPath}`);
      } else {
        console.log(output);
      }

      // Print summary
      this.printSummary(result, options.verbose);

      // Exit with appropriate code
      if (options.failOnViolation && !result.passed) {
        console.error('\n❌ Coverage enforcement failed - violations detected');
        process.exit(1);
      } else {
        console.log('\n✅ Coverage enforcement completed');
        process.exit(0);
      }

    } catch (error) {
      console.error('💥 Coverage enforcement failed:', error);
      process.exit(1);
    }
  }

  private formatConsoleOutput(result: any): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('📊 COVERAGE ENFORCEMENT REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    
    lines.push(`Overall Coverage: ${result.overallCoverage.toFixed(2)}%`);
    lines.push(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`Total Files: ${result.summary.totalFiles}`);
    lines.push(`Violations: ${result.violations.length}`);
    lines.push('');

    if (result.violations.length > 0) {
      lines.push('VIOLATIONS:');
      lines.push('-'.repeat(40));
      
      for (const violation of result.violations.slice(0, 10)) {
        const severity = this.getSeveritySymbol(violation.severity);
        lines.push(`${severity} ${violation.file}`);
        lines.push(`   Expected: ${violation.expected}%, Actual: ${violation.actual.toFixed(2)}%`);
        lines.push('');
      }
      
      if (result.violations.length > 10) {
        lines.push(`... and ${result.violations.length - 10} more violations`);
        lines.push('');
      }
    }

    lines.push('MODULE RESULTS:');
    lines.push('-'.repeat(40));
    
    for (const module of result.moduleResults) {
      const status = module.passed ? '✅' : '❌';
      lines.push(`${status} ${module.type}: ${module.actualCoverage.toFixed(2)}% (${module.fileCount} files)`);
    }
    
    return lines.join('\n');
  }

  private getSeveritySymbol(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return '💡';
      default: return '📝';
    }
  }

  private printSummary(result: any, verbose: boolean): void {
    console.log('\n' + '='.repeat(60));
    console.log('📈 SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`Overall Coverage: ${result.overallCoverage.toFixed(2)}%`);
    console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (result.violations.length > 0) {
      const criticalCount = result.violations.filter((v: any) => v.severity === 'critical').length;
      const highCount = result.violations.filter((v: any) => v.severity === 'high').length;
      
      console.log(`\nViolations Breakdown:`);
      console.log(`  🚨 Critical: ${criticalCount}`);
      console.log(`  ⚠️  High: ${highCount}`);
      console.log(`  ⚡ Medium: ${result.violations.filter((v: any) => v.severity === 'medium').length}`);
      console.log(`  💡 Low: ${result.violations.filter((v: any) => v.severity === 'low').length}`);
    }

    if (verbose && result.summary.recommendations.length > 0) {
      console.log('\nTop Recommendations:');
      for (const rec of result.summary.recommendations.slice(0, 3)) {
        console.log(`  • ${rec}`);
      }
    }
  }
}

// CLI argument parsing
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    format: 'console',
    failOnViolation: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--report':
      case '-r':
        options.reportPath = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputPath = args[++i];
        break;
      case '--format':
      case '-f':
        const format = args[++i];
        if (['console', 'markdown', 'json'].includes(format)) {
          options.format = format as CLIOptions['format'];
        }
        break;
      case '--fail-on-violation':
        options.failOnViolation = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Coverage Enforcement CLI

USAGE:
  npm run coverage:enforce [OPTIONS]

OPTIONS:
  -r, --report <path>        Path to coverage report (auto-detected if not specified)
  -o, --output <path>        Output file path (prints to console if not specified)
  -f, --format <format>      Output format: console, markdown, json (default: console)
  --fail-on-violation        Exit with error code if violations found
  -v, --verbose              Show detailed output
  -h, --help                 Show this help message

EXAMPLES:
  npm run coverage:enforce
  npm run coverage:enforce --format markdown --output coverage-report.md
  npm run coverage:enforce --fail-on-violation --verbose
  npm run coverage:enforce --report ./custom-coverage.json --format json

REQUIREMENTS:
  - Coverage report must be generated first (npm run test:coverage)
  - Supports coverage-final.json and coverage-summary.json formats
`);
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const cli = new CoverageCLI();
  cli.run(options);
}

export { CoverageCLI, type CLIOptions };