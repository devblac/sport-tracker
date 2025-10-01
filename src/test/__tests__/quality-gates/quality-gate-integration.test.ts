import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { QualityGateEvaluator } from '../../quality-gate-evaluator';
import { CoverageEnforcer } from '../../coverage-enforcer';
import { ReliabilityChecker } from '../../reliability-checker';
import { AccessibilityValidator } from '../../accessibility-validator';

describe('Quality Gate Integration', () => {
  const testResultsDir = join(process.cwd(), 'test-results');
  const coverageDir = join(process.cwd(), 'coverage');

  beforeEach(() => {
    // Ensure test directories exist
    if (!existsSync(testResultsDir)) {
      mkdirSync(testResultsDir, { recursive: true });
    }
    if (!existsSync(coverageDir)) {
      mkdirSync(coverageDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync(testResultsDir)) {
      rmSync(testResultsDir, { recursive: true, force: true });
    }
    if (existsSync(coverageDir)) {
      rmSync(coverageDir, { recursive: true, force: true });
    }
  });

  describe('QualityGateEvaluator', () => {
    it('should create quality gate evaluator instance', () => {
      const evaluator = new QualityGateEvaluator();
      expect(evaluator).toBeDefined();
    });

    it('should handle missing coverage report gracefully', async () => {
      const evaluator = new QualityGateEvaluator();
      
      // Should throw error when coverage report is missing
      await expect(evaluator.evaluate()).rejects.toThrow('Coverage report not found');
    });

    it('should evaluate quality gates with mock data', async () => {
      // Create mock coverage report
      const mockCoverage = {
        total: {
          lines: { pct: 95 },
          statements: { pct: 95 },
          functions: { pct: 95 },
          branches: { pct: 95 }
        },
        files: {
          'src/components/Button.tsx': {
            lines: { pct: 85 },
            statements: { pct: 85 },
            functions: { pct: 85 },
            branches: { pct: 85 }
          },
          'src/utils/calculations.ts': {
            lines: { pct: 90 },
            statements: { pct: 90 },
            functions: { pct: 90 },
            branches: { pct: 90 }
          }
        }
      };

      writeFileSync(
        join(coverageDir, 'coverage-summary.json'),
        JSON.stringify(mockCoverage, null, 2)
      );

      // Create mock reliability report
      const mockReliability = {
        current: 99.5,
        trend: [98, 99, 99.5],
        flakyTests: [],
        buildWindow: 3
      };

      writeFileSync(
        join(testResultsDir, 'reliability-report.json'),
        JSON.stringify(mockReliability, null, 2)
      );

      // Create mock accessibility report
      const mockAccessibility = {
        automatedScore: 96,
        manualTestsRequired: 5,
        violations: []
      };

      writeFileSync(
        join(testResultsDir, 'accessibility-report.json'),
        JSON.stringify(mockAccessibility, null, 2)
      );

      const evaluator = new QualityGateEvaluator();
      const report = await evaluator.evaluate();

      expect(report).toBeDefined();
      expect(report.passed).toBe(true);
      expect(report.coverage.overall).toBe(95);
      expect(report.reliability.current).toBe(99.5);
      expect(report.accessibility.automatedScore).toBe(96);
      expect(report.alerts).toHaveLength(0);
    });
  });

  describe('CoverageEnforcer', () => {
    it('should create coverage enforcer instance', () => {
      const enforcer = new CoverageEnforcer();
      expect(enforcer).toBeDefined();
    });

    it('should validate coverage thresholds', async () => {
      // Create mock coverage report with good coverage
      const mockCoverage = {
        total: {
          lines: { pct: 92 },
          statements: { pct: 92 },
          functions: { pct: 92 },
          branches: { pct: 92 }
        },
        files: {
          'src/components/Button.tsx': {
            lines: { pct: 85 },
            statements: { pct: 85 },
            functions: { pct: 85 },
            branches: { pct: 85 }
          }
        }
      };

      writeFileSync(
        join(coverageDir, 'coverage-summary.json'),
        JSON.stringify(mockCoverage, null, 2)
      );

      const enforcer = new CoverageEnforcer();
      
      // Should not throw with good coverage
      await expect(enforcer.enforce()).resolves.not.toThrow();
    });
  });

  describe('ReliabilityChecker', () => {
    it('should create reliability checker instance', () => {
      const checker = new ReliabilityChecker();
      expect(checker).toBeDefined();
    });

    it('should handle missing reliability data', async () => {
      const checker = new ReliabilityChecker();
      
      // Should not throw when validating trends with no data
      await expect(checker.validateTrends()).resolves.not.toThrow();
    });
  });

  describe('AccessibilityValidator', () => {
    it('should create accessibility validator instance', () => {
      const validator = new AccessibilityValidator();
      expect(validator).toBeDefined();
    });

    it('should generate manual test checklist', () => {
      const validator = new AccessibilityValidator();
      
      // Should not throw when generating checklist
      expect(() => validator.generateManualChecklist()).not.toThrow();
      
      // Check if checklist file was created
      const checklistFile = join(testResultsDir, 'accessibility-manual-checklist.md');
      expect(existsSync(checklistFile)).toBe(true);
    });
  });

  describe('Integration Workflow', () => {
    it('should run complete quality gate workflow', async () => {
      // Create comprehensive mock data
      const mockCoverage = {
        total: {
          lines: { pct: 91 },
          statements: { pct: 91 },
          functions: { pct: 91 },
          branches: { pct: 91 }
        },
        files: {
          'src/components/Button.tsx': { lines: { pct: 80 }, statements: { pct: 80 }, functions: { pct: 80 }, branches: { pct: 80 } },
          'src/utils/calculations.ts': { lines: { pct: 88 }, statements: { pct: 88 }, functions: { pct: 88 }, branches: { pct: 88 } },
          'src/services/auth.ts': { lines: { pct: 90 }, statements: { pct: 90 }, functions: { pct: 90 }, branches: { pct: 90 } }
        }
      };

      const mockReliability = {
        current: 99.2,
        trend: [98.5, 99.0, 99.2],
        flakyTests: [],
        buildWindow: 3
      };

      const mockAccessibility = {
        automatedScore: 97,
        manualTestsRequired: 3,
        violations: []
      };

      // Write mock data
      writeFileSync(join(coverageDir, 'coverage-summary.json'), JSON.stringify(mockCoverage, null, 2));
      writeFileSync(join(testResultsDir, 'reliability-report.json'), JSON.stringify(mockReliability, null, 2));
      writeFileSync(join(testResultsDir, 'accessibility-report.json'), JSON.stringify(mockAccessibility, null, 2));

      // Run quality gate evaluation
      const evaluator = new QualityGateEvaluator();
      const report = await evaluator.evaluate();

      // Verify comprehensive report
      expect(report.passed).toBe(true);
      expect(report.coverage.overall).toBe(91);
      expect(report.reliability.current).toBe(99.2);
      expect(report.accessibility.automatedScore).toBe(97);
      expect(report.timestamp).toBeDefined();
      
      // Verify report file was created
      expect(existsSync('quality-gate-report.json')).toBe(true);
    });

    it('should fail quality gates with poor metrics', async () => {
      // Create mock data with poor metrics
      const mockCoverage = {
        total: {
          lines: { pct: 75 }, // Below 90% threshold
          statements: { pct: 75 },
          functions: { pct: 75 },
          branches: { pct: 75 }
        },
        files: {
          'src/components/Button.tsx': { lines: { pct: 60 }, statements: { pct: 60 }, functions: { pct: 60 }, branches: { pct: 60 } }
        }
      };

      const mockReliability = {
        current: 95, // Below 99% threshold
        trend: [96, 95, 95],
        flakyTests: ['test1', 'test2'], // Has flaky tests
        buildWindow: 3
      };

      const mockAccessibility = {
        automatedScore: 85, // Below 95% threshold
        manualTestsRequired: 8,
        violations: [
          { rule: 'color-contrast', severity: 'serious', count: 3 }
        ]
      };

      // Write mock data
      writeFileSync(join(coverageDir, 'coverage-summary.json'), JSON.stringify(mockCoverage, null, 2));
      writeFileSync(join(testResultsDir, 'reliability-report.json'), JSON.stringify(mockReliability, null, 2));
      writeFileSync(join(testResultsDir, 'accessibility-report.json'), JSON.stringify(mockAccessibility, null, 2));

      // Run quality gate evaluation
      const evaluator = new QualityGateEvaluator();
      const report = await evaluator.evaluate();

      // Verify failure conditions
      expect(report.passed).toBe(false);
      expect(report.alerts.length).toBeGreaterThan(0);
      
      // Check specific alert types
      const alertTypes = report.alerts.map(alert => alert.type);
      expect(alertTypes).toContain('coverage');
      expect(alertTypes).toContain('reliability');
    });
  });
});