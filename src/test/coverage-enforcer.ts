import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface CoverageData {
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

interface ModuleCoverageRule {
  pattern: string;
  minCoverage: number;
  type: 'component' | 'utility' | 'service' | 'page' | 'hook';
  description: string;
}

interface CoverageViolation {
  file: string;
  expected: number;
  actual: number;
  type: string;
  gap: number;
}

class CoverageEnforcer {
  private readonly COVERAGE_RULES: ModuleCoverageRule[] = [
    {
      pattern: 'src/components/**/*.{ts,tsx}',
      minCoverage: 75,
      type: 'component',
      description: 'UI Components'
    },
    {
      pattern: 'src/utils/**/*.{ts,tsx}',
      minCoverage: 85,
      type: 'utility',
      description: 'Utility Functions'
    },
    {
      pattern: 'src/services/**/*.{ts,tsx}',
      minCoverage: 85,
      type: 'service',
      description: 'Business Logic Services'
    },
    {
      pattern: 'src/hooks/**/*.{ts,tsx}',
      minCoverage: 80,
      type: 'hook',
      description: 'Custom React Hooks'
    },
    {
      pattern: 'src/pages/**/*.{ts,tsx}',
      minCoverage: 70,
      type: 'page',
      description: 'Page Components'
    }
  ];

  private readonly OVERALL_THRESHOLD = 90;
  private readonly FILE_THRESHOLD = 80;

  async enforce(): Promise<void> {
    console.log('🛡️ Enforcing coverage thresholds...');

    const coverageFile = join(process.cwd(), 'coverage', 'coverage-summary.json');
    if (!existsSync(coverageFile)) {
      throw new Error('Coverage report not found. Run tests with coverage first.');
    }

    const coverageData: CoverageData = JSON.parse(readFileSync(coverageFile, 'utf8'));
    
    // Check overall coverage
    const overallCoverage = coverageData.total.lines.pct;
    if (overallCoverage < this.OVERALL_THRESHOLD) {
      console.error(`❌ Overall coverage ${overallCoverage}% below ${this.OVERALL_THRESHOLD}% threshold`);
      if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
        process.exit(1);
      }
      return;
    }

    console.log(`✅ Overall coverage: ${overallCoverage}% (Target: ${this.OVERALL_THRESHOLD}%+)`);

    // Check per-module coverage
    const violations = await this.validatePerModuleCoverage(coverageData);
    
    if (violations.length > 0) {
      this.reportViolations(violations);
      if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
        process.exit(1);
      }
      return;
    }

    console.log('✅ All coverage thresholds met!');
  }

  private async validatePerModuleCoverage(coverageData: CoverageData): Promise<CoverageViolation[]> {
    const violations: CoverageViolation[] = [];

    for (const rule of this.COVERAGE_RULES) {
      console.log(`\n📋 Checking ${rule.description} (${rule.minCoverage}%+ required):`);
      
      // Find matching files using glob pattern
      const matchingFiles = await glob(rule.pattern, { 
        cwd: process.cwd(),
        ignore: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**']
      });

      let moduleTotal = 0;
      let moduleCount = 0;
      const fileViolations: CoverageViolation[] = [];

      for (const filePath of matchingFiles) {
        // Normalize path for coverage data lookup
        const normalizedPath = filePath.replace(/\\/g, '/');
        const fileData = coverageData.files[normalizedPath];

        if (!fileData) {
          console.warn(`⚠️ No coverage data for ${filePath}`);
          continue;
        }

        const fileCoverage = fileData.lines.pct;
        moduleTotal += fileCoverage;
        moduleCount++;

        // Check individual file threshold
        if (fileCoverage < this.FILE_THRESHOLD) {
          fileViolations.push({
            file: filePath,
            expected: this.FILE_THRESHOLD,
            actual: fileCoverage,
            type: 'file',
            gap: this.FILE_THRESHOLD - fileCoverage
          });
        }

        // Check module-specific threshold
        if (fileCoverage < rule.minCoverage) {
          violations.push({
            file: filePath,
            expected: rule.minCoverage,
            actual: fileCoverage,
            type: rule.type,
            gap: rule.minCoverage - fileCoverage
          });
        }

        const status = fileCoverage >= rule.minCoverage ? '✅' : '❌';
        console.log(`  ${status} ${filePath}: ${fileCoverage.toFixed(1)}%`);
      }

      // Calculate module average
      const moduleAverage = moduleCount > 0 ? moduleTotal / moduleCount : 0;
      const moduleStatus = moduleAverage >= rule.minCoverage ? '✅' : '❌';
      console.log(`  ${moduleStatus} ${rule.description} Average: ${moduleAverage.toFixed(1)}% (${moduleCount} files)`);

      // Add file threshold violations
      violations.push(...fileViolations);
    }

    return violations;
  }

  private reportViolations(violations: CoverageViolation[]): void {
    console.log('\n❌ Coverage Threshold Violations:');
    console.log('==================================');

    // Group violations by type
    const violationsByType = violations.reduce((acc, violation) => {
      if (!acc[violation.type]) {
        acc[violation.type] = [];
      }
      acc[violation.type].push(violation);
      return acc;
    }, {} as Record<string, CoverageViolation[]>);

    for (const [type, typeViolations] of Object.entries(violationsByType)) {
      console.log(`\n📊 ${type.toUpperCase()} Violations (${typeViolations.length}):`);
      
      // Sort by gap (worst first)
      typeViolations.sort((a, b) => b.gap - a.gap);
      
      typeViolations.forEach(violation => {
        console.log(`  ❌ ${violation.file}`);
        console.log(`     Expected: ${violation.expected}% | Actual: ${violation.actual.toFixed(1)}% | Gap: ${violation.gap.toFixed(1)}%`);
      });
    }

    console.log('\n🔧 Remediation Steps:');
    console.log('1. Add unit tests for uncovered code paths');
    console.log('2. Focus on files with the largest coverage gaps first');
    console.log('3. Ensure edge cases and error conditions are tested');
    console.log('4. Consider refactoring complex functions for better testability');

    console.log(`\n📈 Summary: ${violations.length} files need coverage improvements`);
  }

  // Method to generate coverage improvement suggestions
  generateImprovementSuggestions(violations: CoverageViolation[]): string[] {
    const suggestions = [];

    // Group by file type
    const componentViolations = violations.filter(v => v.type === 'component');
    const utilityViolations = violations.filter(v => v.type === 'utility');
    const serviceViolations = violations.filter(v => v.type === 'service');

    if (componentViolations.length > 0) {
      suggestions.push('🎨 Component Testing: Add tests for user interactions, prop variations, and error states');
    }

    if (utilityViolations.length > 0) {
      suggestions.push('🔧 Utility Testing: Test edge cases, error conditions, and boundary values');
    }

    if (serviceViolations.length > 0) {
      suggestions.push('⚙️ Service Testing: Mock external dependencies and test error handling');
    }

    return suggestions;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const enforcer = new CoverageEnforcer();
  enforcer.enforce().catch(error => {
    console.error('❌ Coverage enforcement failed:', error.message);
    if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
      process.exit(1);
    }
  });
}

export { CoverageEnforcer };