/**
 * Coverage Integration
 * 
 * Integration point for coverage enforcement in the test pipeline
 * Requirements: 10.3, 11.1
 */

import { EnhancedCoverageEnforcer } from './coverage-enforcer';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

/**
 * Run coverage enforcement and generate reports
 */
export async function runCoverageEnforcement(): Promise<{
  passed: boolean;
  report: string;
  violations: number;
}> {
  const enforcer = new EnhancedCoverageEnforcer();
  
  try {
    console.log('🔍 Loading coverage report...');
    const report = await enforcer.loadCoverageReport();
    
    if (!report) {
      throw new Error('No coverage report found. Run "npm run test:coverage" first.');
    }

    console.log(`📊 Analyzing coverage for ${report.summary.totalFiles} files...`);
    const result = await enforcer.validateCoverage(report);
    
    // Generate comprehensive report
    const reportContent = enforcer.createComprehensiveReport(result);
    
    // Ensure output directory exists
    const outputDir = resolve(process.cwd(), 'test-results');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Write report to file
    const reportPath = resolve(outputDir, 'coverage-enforcement-report.md');
    writeFileSync(reportPath, reportContent, 'utf-8');
    
    // Write JSON result for CI
    const jsonPath = resolve(outputDir, 'coverage-enforcement.json');
    writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
    
    console.log(`📝 Reports written to:`);
    console.log(`  - ${reportPath}`);
    console.log(`  - ${jsonPath}`);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 COVERAGE ENFORCEMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Overall Coverage: ${result.overallCoverage.toFixed(2)}%`);
    console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Total Files: ${result.summary.totalFiles}`);
    console.log(`Violations: ${result.violations.length}`);
    
    if (result.violations.length > 0) {
      const criticalCount = result.violations.filter(v => v.severity === 'critical').length;
      const highCount = result.violations.filter(v => v.severity === 'high').length;
      
      console.log(`\nViolation Breakdown:`);
      console.log(`  🚨 Critical: ${criticalCount}`);
      console.log(`  ⚠️  High: ${highCount}`);
      console.log(`  ⚡ Medium: ${result.violations.filter(v => v.severity === 'medium').length}`);
      console.log(`  💡 Low: ${result.violations.filter(v => v.severity === 'low').length}`);
      
      console.log(`\nTop Recommendations:`);
      for (const rec of result.summary.recommendations.slice(0, 3)) {
        console.log(`  • ${rec}`);
      }
    }
    
    return {
      passed: result.passed,
      report: reportContent,
      violations: result.violations.length
    };
    
  } catch (error) {
    console.error('💥 Coverage enforcement failed:', error);
    throw error;
  }
}

/**
 * Validate coverage thresholds for CI/CD
 */
export async function validateCoverageThresholds(): Promise<boolean> {
  try {
    const result = await runCoverageEnforcement();
    
    if (!result.passed) {
      console.error('\n❌ Coverage enforcement failed - violations detected');
      console.error(`Found ${result.violations} violations that must be fixed`);
      return false;
    }
    
    console.log('\n✅ All coverage thresholds met');
    return true;
    
  } catch (error) {
    console.error('💥 Coverage validation failed:', error);
    return false;
  }
}

/**
 * Generate coverage watermarks configuration for vitest
 */
export function generateVitestWatermarks() {
  const enforcer = new EnhancedCoverageEnforcer();
  
  const componentWatermarks = enforcer.getWatermarkThresholds('component');
  const utilityWatermarks = enforcer.getWatermarkThresholds('utility');
  
  return {
    // Use component thresholds as baseline (most permissive)
    statements: componentWatermarks.statements,
    branches: componentWatermarks.branches,
    functions: componentWatermarks.functions,
    lines: componentWatermarks.lines,
    
    // Per-file enforcement will be handled by the enforcer
    perFile: {
      statements: 80, // Minimum per-file threshold
      branches: 75,
      functions: 80,
      lines: 80
    }
  };
}

// Export for use in other modules
export { EnhancedCoverageEnforcer } from './coverage-enforcer';