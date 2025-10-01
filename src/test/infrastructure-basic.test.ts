/**
 * Basic Test Infrastructure Validation
 * 
 * Simple tests to verify the core infrastructure components are working.
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Test Infrastructure - Basic Validation', () => {
  it('should import reliability tracker successfully', async () => {
    const { ReliabilityTracker, reliabilityTracker } = await import('./reliability-tracker');
    
    expect(ReliabilityTracker).toBeDefined();
    expect(reliabilityTracker).toBeDefined();
    expect(typeof reliabilityTracker.calculateReliability).toBe('function');
  });

  it('should import coverage enforcer successfully', async () => {
    const module = await import('./coverage-enforcer-simple');
    
    expect(module.simpleCoverageEnforcer).toBeDefined();
    expect(typeof module.simpleCoverageEnforcer.validateCoverage).toBe('function');
  });

  it('should import test data persistence successfully', async () => {
    const { TestDataPersistence, testDataPersistence } = await import('./test-data-persistence');
    
    expect(TestDataPersistence).toBeDefined();
    expect(testDataPersistence).toBeDefined();
    expect(typeof testDataPersistence.saveTestData).toBe('function');
  });

  it('should import test metrics dashboard successfully', async () => {
    const { createTestMetricsDashboard } = await import('./test-metrics-dashboard');
    
    expect(createTestMetricsDashboard).toBeDefined();
    expect(typeof createTestMetricsDashboard).toBe('function');
  });

  it('should have global test utilities available', () => {
    expect(global.testUtils).toBeDefined();
    expect(global.qualityUtils).toBeDefined();
    
    expect(typeof global.testUtils.createMockUser).toBe('function');
    expect(typeof global.qualityUtils.getReliabilityMetrics).toBe('function');
  });
});

describe('Reliability Tracker - Core Functionality', () => {
  let tracker: any;

  beforeEach(async () => {
    const { ReliabilityTracker } = await import('./reliability-tracker');
    tracker = new ReliabilityTracker();
  });

  it('should track test runs correctly', () => {
    tracker.addTestRun({
      testName: 'basic-test',
      status: 'pass',
      duration: 100,
      buildNumber: 1,
      timestamp: new Date()
    });

    const data = tracker.exportData();
    expect(data.testRuns).toHaveLength(1);
    expect(data.testRuns[0].testName).toBe('basic-test');
  });

  it('should calculate basic reliability metrics', () => {
    // Add a test suite
    tracker.addTestSuite({
      suiteName: 'Test Suite',
      buildNumber: 1,
      timestamp: new Date(),
      totalTests: 2,
      passedTests: 2,
      failedTests: 0,
      skippedTests: 0,
      duration: 1000
    });

    const metrics = tracker.calculateReliability();
    expect(metrics).toHaveProperty('overallReliability');
    expect(metrics).toHaveProperty('flakyTests');
    expect(metrics).toHaveProperty('buildWindow');
  });
});

describe('Coverage Enforcer - Core Functionality', () => {
  it('should validate coverage reports using singleton', async () => {
    const { simpleCoverageEnforcer } = await import('./coverage-enforcer-simple');
    
    const mockReport = {
      overall: {
        statements: 85,
        branches: 80,
        functions: 90,
        lines: 85
      },
      files: {},
      summary: {
        totalFiles: 0,
        coveredFiles: 0,
        uncoveredFiles: 0,
        averageCoverage: 85
      }
    };

    const result = await simpleCoverageEnforcer.validateCoverage(mockReport);
    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('overallCoverage');
    expect(result).toHaveProperty('violations');
  });

  it('should generate recommendations using singleton', async () => {
    const { simpleCoverageEnforcer } = await import('./coverage-enforcer-simple');
    
    const violations = [{
      file: 'test.ts',
      expected: 80,
      actual: 70,
      type: 'utility',
      metric: 'statements',
      severity: 'medium'
    }];

    const recommendations = simpleCoverageEnforcer.generateRecommendations(violations);
    expect(Array.isArray(recommendations)).toBe(true);
  });
});