/**
 * Coverage Enforcer Tests
 * 
 * Tests for granular coverage enforcement system
 * Requirements: 10.3, 11.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  CoverageEnforcer, 
  EnhancedCoverageEnforcer,
  COVERAGE_RULES,
  type CoverageReport,
  type CoverageViolation,
  type ModuleCoverageConfig
} from '../coverage-enforcer';

describe('CoverageEnforcer', () => {
  let enforcer: CoverageEnforcer;

  beforeEach(() => {
    enforcer = new CoverageEnforcer();
  });

  describe('validateCoverage', () => {
    it('should pass when all thresholds are met', async () => {
      const mockReport: CoverageReport = {
        overall: {
          statements: 95,
          branches: 92,
          functions: 94,
          lines: 93
        },
        files: {
          'src/components/Button.tsx': {
            path: 'src/components/Button.tsx',
            coverage: { statements: 85, branches: 80, functions: 90, lines: 85 },
            type: 'component',
            size: 1000,
            lastModified: new Date()
          },
          'src/utils/calculations.ts': {
            path: 'src/utils/calculations.ts',
            coverage: { statements: 95, branches: 90, functions: 95, lines: 92 },
            type: 'utility',
            size: 500,
            lastModified: new Date()
          }
        },
        summary: {
          totalFiles: 2,
          coveredFiles: 2,
          uncoveredFiles: 0,
          averageCoverage: 90
        }
      };

      const result = await enforcer.validateCoverage(mockReport);

      expect(result.passed).toBe(true);
      expect(result.overallCoverage).toBeGreaterThan(90);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail when overall coverage is below threshold', async () => {
      const mockReport: CoverageReport = {
        overall: {
          statements: 85, // Below 90% threshold
          branches: 80,
          functions: 85,
          lines: 82
        },
        files: {},
        summary: {
          totalFiles: 0,
          coveredFiles: 0,
          uncoveredFiles: 0,
          averageCoverage: 83
        }
      };

      const result = await enforcer.validateCoverage(mockReport);

      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].file).toBe('OVERALL');
      expect(result.violations[0].severity).toBe('critical');
    });

    it('should detect per-file threshold violations', async () => {
      const mockReport: CoverageReport = {
        overall: {
          statements: 95,
          branches: 92,
          functions: 94,
          lines: 93
        },
        files: {
          'src/components/LowCoverage.tsx': {
            path: 'src/components/LowCoverage.tsx',
            coverage: { statements: 60, branches: 55, functions: 65, lines: 58 }, // Below 80% per-file threshold
            type: 'component',
            size: 1000,
            lastModified: new Date()
          }
        },
        summary: {
          totalFiles: 1,
          coveredFiles: 1,
          uncoveredFiles: 0,
          averageCoverage: 59.5
        }
      };

      const result = await enforcer.validateCoverage(mockReport);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      
      const fileViolation = result.violations.find(v => v.file === 'src/components/LowCoverage.tsx');
      expect(fileViolation).toBeDefined();
      expect(fileViolation?.severity).toBe('high'); // 20+ point gap
    });

    it('should validate module-specific thresholds', async () => {
      // Mock the getMatchingFiles method to return our test files
      const originalGetMatchingFiles = (enforcer as any).getMatchingFiles;
      (enforcer as any).getMatchingFiles = vi.fn().mockImplementation((pattern: string) => {
        if (pattern.includes('components')) {
          return Promise.resolve(['src/components/Component.tsx']);
        }
        if (pattern.includes('utils')) {
          return Promise.resolve(['src/utils/utility.ts']);
        }
        return Promise.resolve([]);
      });

      const mockReport: CoverageReport = {
        overall: {
          statements: 95,
          branches: 92,
          functions: 94,
          lines: 93
        },
        files: {
          'src/components/Component.tsx': {
            path: 'src/components/Component.tsx',
            coverage: { statements: 70, branches: 65, functions: 75, lines: 68 }, // Below 80% per-file threshold
            type: 'component',
            size: 1000,
            lastModified: new Date()
          },
          'src/utils/utility.ts': {
            path: 'src/utils/utility.ts',
            coverage: { statements: 70, branches: 65, functions: 75, lines: 68 }, // Below 80% per-file threshold AND 85% utility threshold
            type: 'utility',
            size: 500,
            lastModified: new Date()
          }
        },
        summary: {
          totalFiles: 2,
          coveredFiles: 2,
          uncoveredFiles: 0,
          averageCoverage: 69.5
        }
      };

      const result = await enforcer.validateCoverage(mockReport);

      // Restore original method
      (enforcer as any).getMatchingFiles = originalGetMatchingFiles;

      expect(result.passed).toBe(false);
      expect(result.moduleResults).toHaveLength(COVERAGE_RULES.length);
      
      // Check component module result - should fail due to per-file threshold
      const componentResult = result.moduleResults.find(m => m.type === 'component');
      expect(componentResult?.passed).toBe(false);
      expect(componentResult?.violatingFiles).toContain('src/components/Component.tsx');
      
      // Check utility module result - should fail due to both module and per-file thresholds
      const utilityResult = result.moduleResults.find(m => m.type === 'utility');
      expect(utilityResult?.passed).toBe(false);
      expect(utilityResult?.violatingFiles).toContain('src/utils/utility.ts');
    });
  });

  describe('generateRecommendations', () => {
    it('should generate type-specific recommendations', () => {
      const violations: CoverageViolation[] = [
        {
          file: 'src/components/Button.tsx',
          expected: 75,
          actual: 60,
          type: 'component',
          metric: 'statements',
          severity: 'medium'
        },
        {
          file: 'src/utils/math.ts',
          expected: 85,
          actual: 70,
          type: 'utility',
          metric: 'branches',
          severity: 'medium'
        }
      ];

      const recommendations = enforcer.generateRecommendations(violations);

      expect(recommendations.join(' ')).toContain('component tests focusing on user interactions');
      expect(recommendations.join(' ')).toContain('utility function tests covering edge cases');
    });

    it('should prioritize critical violations', () => {
      const violations: CoverageViolation[] = [
        {
          file: 'src/critical.ts',
          expected: 80,
          actual: 40,
          type: 'utility',
          metric: 'statements',
          severity: 'critical'
        }
      ];

      const recommendations = enforcer.generateRecommendations(violations);

      expect(recommendations[0]).toContain('CRITICAL');
    });
  });

  describe('createEnforcementReport', () => {
    it('should create comprehensive report with violations and recommendations', async () => {
      const mockReport: CoverageReport = {
        overall: { statements: 85, branches: 80, functions: 85, lines: 82 },
        files: {
          'src/test.ts': {
            path: 'src/test.ts',
            coverage: { statements: 60, branches: 55, functions: 65, lines: 58 },
            type: 'utility',
            size: 100,
            lastModified: new Date()
          }
        },
        summary: { totalFiles: 1, coveredFiles: 1, uncoveredFiles: 0, averageCoverage: 59.5 }
      };

      const result = await enforcer.validateCoverage(mockReport);
      const report = enforcer.createEnforcementReport(result);

      expect(report).toContain('Coverage Enforcement Report');
      expect(report).toContain('❌ FAILED');
      expect(report).toContain('Violations');
      expect(report).toContain('Recommendations');
    });
  });
});

describe('EnhancedCoverageEnforcer', () => {
  let enhancedEnforcer: EnhancedCoverageEnforcer;

  beforeEach(() => {
    enhancedEnforcer = new EnhancedCoverageEnforcer();
  });

  describe('configureWatermarks', () => {
    it('should configure custom watermarks', () => {
      const customWatermarks = {
        statements: [80, 90] as [number, number],
        branches: [75, 85] as [number, number],
        functions: [80, 90] as [number, number],
        lines: [80, 90] as [number, number]
      };

      enhancedEnforcer.configureWatermarks(customWatermarks);

      const componentWatermarks = enhancedEnforcer.getWatermarkThresholds('component');
      expect(componentWatermarks.statements).toEqual([75, 85]); // Component-specific override
    });
  });

  describe('getWatermarkThresholds', () => {
    it('should return appropriate thresholds for different module types', () => {
      const componentWatermarks = enhancedEnforcer.getWatermarkThresholds('component');
      const utilityWatermarks = enhancedEnforcer.getWatermarkThresholds('utility');

      expect(componentWatermarks.statements).toEqual([75, 85]);
      expect(utilityWatermarks.statements).toEqual([85, 95]);
    });
  });

  describe('loadCoverageReport', () => {
    it('should handle missing coverage report gracefully', async () => {
      const report = await enhancedEnforcer.loadCoverageReport('./non-existent-path.json');
      expect(report).toBeNull();
    });
  });

  describe('generateDetailedRemediation', () => {
    it('should provide specific remediation suggestions', () => {
      const violations: CoverageViolation[] = [
        {
          file: 'src/components/Button.tsx',
          expected: 75,
          actual: 35, // 40+ point gap to trigger critical severity
          type: 'component',
          metric: 'branches',
          severity: 'critical'
        }
      ];

      const remediation = enhancedEnforcer.generateDetailedRemediation(violations);

      expect(remediation['src/components/Button.tsx']).toBeDefined();
      expect(remediation['src/components/Button.tsx'].join(' ')).toContain('CRITICAL');
      expect(remediation['src/components/Button.tsx'].join(' ')).toContain('conditional logic');
    });

    it('should provide type-specific suggestions', () => {
      const violations: CoverageViolation[] = [
        {
          file: 'src/hooks/useCustomHook.ts',
          expected: 80,
          actual: 60,
          type: 'hook',
          metric: 'functions',
          severity: 'medium'
        }
      ];

      const remediation = enhancedEnforcer.generateDetailedRemediation(violations);

      expect(remediation['src/hooks/useCustomHook.ts'].join(' ')).toContain('@testing-library/react-hooks');
    });
  });

  describe('createComprehensiveReport', () => {
    it('should create detailed report with watermarks and remediation', async () => {
      const mockReport: CoverageReport = {
        overall: { statements: 85, branches: 80, functions: 85, lines: 82 },
        files: {
          'src/components/Test.tsx': {
            path: 'src/components/Test.tsx',
            coverage: { statements: 60, branches: 55, functions: 65, lines: 58 },
            type: 'component',
            size: 100,
            lastModified: new Date()
          }
        },
        summary: { totalFiles: 1, coveredFiles: 1, uncoveredFiles: 0, averageCoverage: 59.5 }
      };

      const result = await enhancedEnforcer.validateCoverage(mockReport);
      const report = enhancedEnforcer.createComprehensiveReport(result);

      expect(report).toContain('📊 Coverage Enforcement Report');
      expect(report).toContain('🎯 Coverage Watermarks');
      expect(report).toContain('📈 Module Results');
      expect(report).toContain('🚨 Coverage Violations');
      expect(report).toContain('💡 **Remediation:**');
      expect(report).toContain('🎯 Next Steps');
    });
  });
});

describe('COVERAGE_RULES Configuration', () => {
  it('should have proper coverage rules for all module types', () => {
    expect(COVERAGE_RULES).toHaveLength(6);
    
    const componentRule = COVERAGE_RULES.find(r => r.type === 'component');
    expect(componentRule?.minCoverage).toBe(75);
    
    const utilityRule = COVERAGE_RULES.find(r => r.type === 'utility');
    expect(utilityRule?.minCoverage).toBe(85);
    
    const serviceRule = COVERAGE_RULES.find(r => r.type === 'service');
    expect(serviceRule?.minCoverage).toBe(85);
  });

  it('should have valid glob patterns', () => {
    for (const rule of COVERAGE_RULES) {
      expect(rule.pattern).toMatch(/^src\//);
      expect(rule.pattern).toContain('**/*');
      expect(rule.minCoverage).toBeGreaterThan(0);
      expect(rule.minCoverage).toBeLessThanOrEqual(100);
    }
  });
});