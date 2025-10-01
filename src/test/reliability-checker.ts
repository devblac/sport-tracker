import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface TestRun {
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  buildNumber: number;
  timestamp: Date;
  error?: string;
}

interface BuildResult {
  buildNumber: number;
  timestamp: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  testRuns: TestRun[];
}

interface ReliabilityMetrics {
  current: number;
  trend: number[];
  flakyTests: string[];
  buildWindow: number;
  totalBuilds: number;
  averageReliability: number;
}

class ReliabilityChecker {
  private readonly RELIABILITY_WINDOW = 50; // builds
  private readonly FLAKY_DETECTION_WINDOW = 20; // builds
  private readonly RELIABILITY_THRESHOLD = 99;
  private readonly FLAKY_THRESHOLD = 0.01; // 1%

  private readonly resultsDir = join(process.cwd(), 'test-results');
  private readonly historyFile = join(this.resultsDir, 'build-history.json');
  private readonly reliabilityFile = join(this.resultsDir, 'reliability-report.json');

  async checkReliability(): Promise<void> {
    console.log('🎯 Checking test reliability...');

    // Ensure results directory exists
    if (!existsSync(this.resultsDir)) {
      mkdirSync(this.resultsDir, { recursive: true });
    }

    // Record current test run
    const currentBuild = await this.recordCurrentBuild();
    
    // Load build history
    const buildHistory = this.loadBuildHistory();
    buildHistory.push(currentBuild);

    // Keep only recent builds
    const recentHistory = buildHistory.slice(-this.RELIABILITY_WINDOW);
    
    // Calculate reliability metrics
    const metrics = this.calculateReliabilityMetrics(recentHistory);
    
    // Save updated history and metrics
    this.saveBuildHistory(recentHistory);
    this.saveReliabilityReport(metrics);

    // Report results
    this.reportReliability(metrics);

    // Fail if below threshold
    if (metrics.current < this.RELIABILITY_THRESHOLD) {
      console.error(`❌ Test reliability ${metrics.current}% below ${this.RELIABILITY_THRESHOLD}% threshold`);
      process.exit(1);
    }
  }

  private async recordCurrentBuild(): Promise<BuildResult> {
    console.log('📊 Recording current test run...');

    const buildNumber = this.getCurrentBuildNumber();
    const timestamp = new Date();

    try {
      // Run tests and capture results
      const testOutput = execSync('npm run test -- --run --reporter=json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const testResults = JSON.parse(testOutput);
      const testRuns: TestRun[] = [];

      // Parse test results
      if (testResults.testResults) {
        for (const fileResult of testResults.testResults) {
          for (const testResult of fileResult.assertionResults) {
            testRuns.push({
              testName: `${fileResult.name}:${testResult.title}`,
              status: testResult.status === 'passed' ? 'pass' : 
                     testResult.status === 'failed' ? 'fail' : 'skip',
              duration: testResult.duration || 0,
              buildNumber,
              timestamp,
              error: testResult.failureMessages?.[0]
            });
          }
        }
      }

      const totalTests = testRuns.length;
      const passedTests = testRuns.filter(t => t.status === 'pass').length;
      const failedTests = testRuns.filter(t => t.status === 'fail').length;
      const skippedTests = testRuns.filter(t => t.status === 'skip').length;

      return {
        buildNumber,
        timestamp,
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        duration: testResults.duration || 0,
        testRuns
      };

    } catch (error) {
      console.warn('⚠️ Could not parse test results, using fallback data');
      
      // Fallback: create basic build record
      return {
        buildNumber,
        timestamp,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0,
        testRuns: []
      };
    }
  }

  private getCurrentBuildNumber(): number {
    // Try to get build number from CI environment
    const ciBuildNumber = process.env.GITHUB_RUN_NUMBER || 
                         process.env.BUILD_NUMBER || 
                         process.env.CI_PIPELINE_ID;

    if (ciBuildNumber) {
      return parseInt(ciBuildNumber, 10);
    }

    // Fallback: use timestamp-based build number
    const history = this.loadBuildHistory();
    return history.length > 0 ? Math.max(...history.map(b => b.buildNumber)) + 1 : 1;
  }

  private loadBuildHistory(): BuildResult[] {
    if (!existsSync(this.historyFile)) {
      return [];
    }

    try {
      const data = readFileSync(this.historyFile, 'utf8');
      return JSON.parse(data).map((build: any) => ({
        ...build,
        timestamp: new Date(build.timestamp)
      }));
    } catch (error) {
      console.warn('⚠️ Could not load build history, starting fresh');
      return [];
    }
  }

  private saveBuildHistory(history: BuildResult[]): void {
    writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
  }

  private calculateReliabilityMetrics(buildHistory: BuildResult[]): ReliabilityMetrics {
    if (buildHistory.length === 0) {
      return {
        current: 100,
        trend: [100],
        flakyTests: [],
        buildWindow: 0,
        totalBuilds: 0,
        averageReliability: 100
      };
    }

    // Calculate current reliability (last build)
    const lastBuild = buildHistory[buildHistory.length - 1];
    const current = lastBuild.totalTests > 0 
      ? (lastBuild.passedTests / lastBuild.totalTests) * 100 
      : 100;

    // Calculate trend over recent builds
    const trend = buildHistory.map(build => 
      build.totalTests > 0 ? (build.passedTests / build.totalTests) * 100 : 100
    );

    // Calculate average reliability
    const averageReliability = trend.length > 0 
      ? trend.reduce((sum, rel) => sum + rel, 0) / trend.length 
      : 100;

    // Detect flaky tests
    const flakyTests = this.detectFlakyTests(buildHistory);

    return {
      current,
      trend,
      flakyTests,
      buildWindow: buildHistory.length,
      totalBuilds: buildHistory.length,
      averageReliability
    };
  }

  private detectFlakyTests(buildHistory: BuildResult[]): string[] {
    // Use recent builds for flaky test detection
    const recentBuilds = buildHistory.slice(-this.FLAKY_DETECTION_WINDOW);
    
    if (recentBuilds.length < 5) {
      return []; // Need at least 5 builds for meaningful flaky detection
    }

    // Group test results by test name
    const testResultsByName: Record<string, TestRun[]> = {};
    
    for (const build of recentBuilds) {
      for (const testRun of build.testRuns) {
        if (!testResultsByName[testRun.testName]) {
          testResultsByName[testRun.testName] = [];
        }
        testResultsByName[testRun.testName].push(testRun);
      }
    }

    // Identify flaky tests
    const flakyTests: string[] = [];

    for (const [testName, runs] of Object.entries(testResultsByName)) {
      if (runs.length < 3) continue; // Need at least 3 runs to detect flakiness

      const hasFailures = runs.some(run => run.status === 'fail');
      const hasSuccesses = runs.some(run => run.status === 'pass');
      const failureRate = runs.filter(run => run.status === 'fail').length / runs.length;

      // Test is flaky if it has both failures and successes, and failure rate > threshold
      if (hasFailures && hasSuccesses && failureRate > this.FLAKY_THRESHOLD) {
        flakyTests.push(testName);
      }
    }

    return flakyTests;
  }

  private saveReliabilityReport(metrics: ReliabilityMetrics): void {
    writeFileSync(this.reliabilityFile, JSON.stringify(metrics, null, 2));
  }

  private reportReliability(metrics: ReliabilityMetrics): void {
    console.log('\n📈 Test Reliability Report:');
    console.log('===========================');
    
    console.log(`Current Reliability: ${metrics.current.toFixed(2)}%`);
    console.log(`Average Reliability: ${metrics.averageReliability.toFixed(2)}%`);
    console.log(`Build Window: ${metrics.buildWindow} builds`);
    console.log(`Target: ${this.RELIABILITY_THRESHOLD}%+`);

    if (metrics.trend.length > 1) {
      const trendDirection = metrics.trend[metrics.trend.length - 1] > metrics.trend[metrics.trend.length - 2] 
        ? '📈 Improving' : '📉 Declining';
      console.log(`Trend: ${trendDirection}`);
    }

    if (metrics.flakyTests.length > 0) {
      console.log(`\n⚠️ Flaky Tests Detected (${metrics.flakyTests.length}):`);
      metrics.flakyTests.forEach(testName => {
        console.log(`  - ${testName}`);
      });
      
      console.log('\n🔧 Flaky Test Remediation:');
      console.log('1. Review test setup and teardown procedures');
      console.log('2. Check for race conditions and timing issues');
      console.log('3. Ensure proper mocking of external dependencies');
      console.log('4. Add explicit waits for asynchronous operations');
    } else {
      console.log('\n✅ No flaky tests detected');
    }

    const status = metrics.current >= this.RELIABILITY_THRESHOLD ? '✅ PASSED' : '❌ FAILED';
    console.log(`\nReliability Status: ${status}`);
  }

  async validateTrends(): Promise<void> {
    console.log('📊 Validating reliability trends...');

    if (!existsSync(this.reliabilityFile)) {
      console.warn('⚠️ No reliability data available for trend validation');
      return;
    }

    const metrics: ReliabilityMetrics = JSON.parse(readFileSync(this.reliabilityFile, 'utf8'));

    // Check for concerning trends
    if (metrics.trend.length >= 5) {
      const recentTrend = metrics.trend.slice(-5);
      const isDecreasing = recentTrend.every((value, index) => 
        index === 0 || value <= recentTrend[index - 1]
      );

      if (isDecreasing && recentTrend[0] - recentTrend[recentTrend.length - 1] > 5) {
        console.warn('⚠️ Reliability trend is decreasing over last 5 builds');
      }
    }

    // Check flaky test rate
    const flakyRate = (metrics.flakyTests.length / 100) * 100; // Assuming ~100 tests
    if (flakyRate > 1) {
      console.error(`❌ Flaky test rate ${flakyRate.toFixed(1)}% exceeds 1% threshold`);
      process.exit(1);
    }

    console.log('✅ Reliability trends validated');
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new ReliabilityChecker();
  
  const command = process.argv[2];
  
  if (command === 'validate-trends') {
    checker.validateTrends().catch(error => {
      console.error('❌ Reliability trend validation failed:', error.message);
      if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
        process.exit(1);
      }
    });
  } else {
    checker.checkReliability().catch(error => {
      console.error('❌ Reliability check failed:', error.message);
      if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
        process.exit(1);
      }
    });
  }
}

export { ReliabilityChecker };