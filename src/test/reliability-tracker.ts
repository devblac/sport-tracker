/**
 * Test Reliability Tracker
 * 
 * Tracks test reliability over a rolling 50-build window and detects flaky tests
 * using 20-build inconsistency patterns as per requirements 10.1 and 10.2.
 */

export interface TestRun {
  testName: string;
  status: 'pass' | 'fail' | 'skip' | 'todo';
  duration: number;
  buildNumber: number;
  timestamp: Date;
  error?: string;
  retries?: number;
}

export interface TestSuite {
  suiteName: string;
  buildNumber: number;
  timestamp: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage?: CoverageData;
}

export interface CoverageData {
  overall: number;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  perFile: Record<string, FileCoverage>;
}

export interface FileCoverage {
  path: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  type: 'component' | 'utility' | 'service' | 'page' | 'other';
}

export interface ReliabilityMetrics {
  overallReliability: number;
  trend: number[];
  flakyTests: FlakyTest[];
  buildWindow: number;
  totalBuilds: number;
}

export interface FlakyTest {
  testName: string;
  failureRate: number;
  inconsistentBuilds: number;
  lastFailure: Date;
  pattern: 'intermittent' | 'environment' | 'timing' | 'unknown';
}

export class ReliabilityTracker {
  private readonly RELIABILITY_WINDOW = 50; // builds for reliability calculation
  private readonly FLAKY_DETECTION_WINDOW = 20; // builds for flaky test detection
  private readonly FLAKY_THRESHOLD = 0.01; // 1% failure rate threshold
  
  private testRuns: TestRun[] = [];
  private testSuites: TestSuite[] = [];

  /**
   * Add a test run result to the tracking system
   */
  addTestRun(testRun: TestRun): void {
    this.testRuns.push({
      ...testRun,
      timestamp: new Date(testRun.timestamp)
    });
    
    // Keep only recent data to prevent memory bloat
    this.cleanupOldData();
  }

  /**
   * Add a test suite result to the tracking system
   */
  addTestSuite(testSuite: TestSuite): void {
    this.testSuites.push({
      ...testSuite,
      timestamp: new Date(testSuite.timestamp)
    });
    
    this.cleanupOldData();
  }

  /**
   * Calculate test reliability over rolling 50-build window
   * Requirement 10.1: 99%+ target reliability
   */
  calculateReliability(): ReliabilityMetrics {
    const recentSuites = this.getRecentTestSuites(this.RELIABILITY_WINDOW);
    
    if (recentSuites.length === 0) {
      return {
        overallReliability: 0,
        trend: [],
        flakyTests: [],
        buildWindow: 0,
        totalBuilds: 0
      };
    }

    // Calculate overall reliability
    const totalTests = recentSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passedTests = recentSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const overallReliability = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Calculate trend over time (reliability per build)
    const trend = recentSuites.map(suite => {
      return suite.totalTests > 0 ? (suite.passedTests / suite.totalTests) * 100 : 0;
    });

    // Detect flaky tests
    const flakyTests = this.detectFlakyTests();

    return {
      overallReliability,
      trend,
      flakyTests,
      buildWindow: recentSuites.length,
      totalBuilds: this.testSuites.length
    };
  }

  /**
   * Detect flaky tests using 20-build inconsistency patterns
   * Requirement 10.2: <1% flaky test rate
   */
  detectFlakyTests(): FlakyTest[] {
    const recentRuns = this.getRecentTestRuns(this.FLAKY_DETECTION_WINDOW);
    const testGroups = this.groupTestRunsByName(recentRuns);
    const flakyTests: FlakyTest[] = [];

    for (const [testName, runs] of Object.entries(testGroups)) {
      const flakyResult = this.analyzeFlakyPattern(testName, runs);
      if (flakyResult) {
        flakyTests.push(flakyResult);
      }
    }

    return flakyTests.sort((a, b) => b.failureRate - a.failureRate);
  }

  /**
   * Get reliability statistics for a specific time period
   */
  getReliabilityStats(days: number = 7): {
    averageReliability: number;
    minReliability: number;
    maxReliability: number;
    totalBuilds: number;
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentSuites = this.testSuites.filter(
      suite => suite.timestamp >= cutoffDate
    );

    if (recentSuites.length === 0) {
      return {
        averageReliability: 0,
        minReliability: 0,
        maxReliability: 0,
        totalBuilds: 0
      };
    }

    const reliabilities = recentSuites.map(suite => 
      suite.totalTests > 0 ? (suite.passedTests / suite.totalTests) * 100 : 0
    );

    return {
      averageReliability: reliabilities.reduce((sum, r) => sum + r, 0) / reliabilities.length,
      minReliability: Math.min(...reliabilities),
      maxReliability: Math.max(...reliabilities),
      totalBuilds: recentSuites.length
    };
  }

  /**
   * Export test data for persistence
   */
  exportData(): {
    testRuns: TestRun[];
    testSuites: TestSuite[];
    exportedAt: Date;
  } {
    return {
      testRuns: [...this.testRuns],
      testSuites: [...this.testSuites],
      exportedAt: new Date()
    };
  }

  /**
   * Import test data from persistence
   */
  importData(data: {
    testRuns: TestRun[];
    testSuites: TestSuite[];
  }): void {
    this.testRuns = data.testRuns.map(run => ({
      ...run,
      timestamp: new Date(run.timestamp)
    }));
    
    this.testSuites = data.testSuites.map(suite => ({
      ...suite,
      timestamp: new Date(suite.timestamp)
    }));
  }

  /**
   * Clear all tracking data
   */
  clearData(): void {
    this.testRuns = [];
    this.testSuites = [];
  }

  // Private helper methods

  private getRecentTestSuites(windowSize: number): TestSuite[] {
    return this.testSuites
      .sort((a, b) => b.buildNumber - a.buildNumber)
      .slice(0, windowSize);
  }

  private getRecentTestRuns(windowSize: number): TestRun[] {
    const recentBuilds = this.getRecentTestSuites(windowSize)
      .map(suite => suite.buildNumber);
    
    return this.testRuns.filter(run => 
      recentBuilds.includes(run.buildNumber)
    );
  }

  private groupTestRunsByName(runs: TestRun[]): Record<string, TestRun[]> {
    return runs.reduce((groups, run) => {
      if (!groups[run.testName]) {
        groups[run.testName] = [];
      }
      groups[run.testName].push(run);
      return groups;
    }, {} as Record<string, TestRun[]>);
  }

  private analyzeFlakyPattern(testName: string, runs: TestRun[]): FlakyTest | null {
    if (runs.length < 5) {
      // Need at least 5 runs to detect patterns
      return null;
    }

    const failures = runs.filter(run => run.status === 'fail');
    const successes = runs.filter(run => run.status === 'pass');
    const failureRate = failures.length / runs.length;

    // Check if test is flaky (has both failures and successes, failure rate > threshold)
    const hasFailures = failures.length > 0;
    const hasSuccesses = successes.length > 0;
    const isFlaky = hasFailures && hasSuccesses && failureRate > this.FLAKY_THRESHOLD;

    if (!isFlaky) {
      return null;
    }

    // Determine flaky pattern
    let pattern: FlakyTest['pattern'] = 'unknown';
    
    // Check for timing-related issues (failures after long durations)
    const avgFailureDuration = failures.reduce((sum, f) => sum + f.duration, 0) / failures.length;
    const avgSuccessDuration = successes.reduce((sum, s) => sum + s.duration, 0) / successes.length;
    
    if (avgFailureDuration > avgSuccessDuration * 2) {
      pattern = 'timing';
    } else if (this.hasIntermittentPattern(runs)) {
      pattern = 'intermittent';
    } else if (this.hasEnvironmentPattern(runs)) {
      pattern = 'environment';
    }

    return {
      testName,
      failureRate,
      inconsistentBuilds: runs.length,
      lastFailure: failures.length > 0 ? 
        new Date(Math.max(...failures.map(f => f.timestamp.getTime()))) : 
        new Date(),
      pattern
    };
  }

  private hasIntermittentPattern(runs: TestRun[]): boolean {
    // Check for alternating pass/fail pattern
    let alternations = 0;
    for (let i = 1; i < runs.length; i++) {
      if (runs[i].status !== runs[i - 1].status) {
        alternations++;
      }
    }
    return alternations > runs.length * 0.3; // More than 30% alternations
  }

  private hasEnvironmentPattern(runs: TestRun[]): boolean {
    // Check if failures cluster around specific time periods
    const failures = runs.filter(r => r.status === 'fail');
    if (failures.length < 2) return false;

    const failureTimes = failures.map(f => f.timestamp.getTime()).sort();
    const clusters = [];
    let currentCluster = [failureTimes[0]];

    for (let i = 1; i < failureTimes.length; i++) {
      const timeDiff = failureTimes[i] - failureTimes[i - 1];
      if (timeDiff < 24 * 60 * 60 * 1000) { // Within 24 hours
        currentCluster.push(failureTimes[i]);
      } else {
        clusters.push(currentCluster);
        currentCluster = [failureTimes[i]];
      }
    }
    clusters.push(currentCluster);

    // Environment pattern if failures cluster together
    return clusters.some(cluster => cluster.length >= failures.length * 0.5);
  }

  private cleanupOldData(): void {
    // Keep data for last 100 builds to prevent memory issues
    const maxBuilds = 100;
    
    if (this.testSuites.length > maxBuilds) {
      const sortedSuites = this.testSuites.sort((a, b) => b.buildNumber - a.buildNumber);
      const keepBuilds = sortedSuites.slice(0, maxBuilds).map(s => s.buildNumber);
      
      this.testSuites = sortedSuites.slice(0, maxBuilds);
      this.testRuns = this.testRuns.filter(run => keepBuilds.includes(run.buildNumber));
    }
  }
}

// Singleton instance for global use
export const reliabilityTracker = new ReliabilityTracker();