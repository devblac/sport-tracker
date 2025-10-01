#!/usr/bin/env node

/**
 * Simple Test Performance Measurement
 * Measures current test performance and validates optimizations
 */

import { performance } from 'perf_hooks';
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

async function measureTestPerformance() {
  console.log('🚀 Measuring test performance...');
  const startTime = performance.now();

  return new Promise((resolve, reject) => {
    // Run tests with basic configuration for performance measurement
    const testProcess = spawn('npx', [
      'vitest', 
      'run', 
      '--reporter=basic',
      '--no-coverage',
      '--bail=5' // Stop after 5 failures to get quick feedback
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=2048',
        NODE_ENV: 'test'
      }
    });

    let stdout = '';
    let stderr = '';
    const testTimes = [];

    testProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      
      // Parse test execution times
      const testMatches = output.match(/✓.*?\((\d+)ms\)/g);
      if (testMatches) {
        testMatches.forEach(match => {
          const time = parseInt(match.match(/\((\d+)ms\)/)[1]);
          testTimes.push(time);
        });
      }
    });

    testProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    testProcess.on('close', (code) => {
      const executionTime = performance.now() - startTime;
      
      // Parse test counts from output
      const testCountMatch = stdout.match(/Tests\s+(\d+)\s+failed.*?(\d+)\s+passed/);
      const passedMatch = stdout.match(/(\d+)\s+passed/);
      
      let testCount = testTimes.length;
      let passedTests = 0;
      
      if (testCountMatch) {
        passedTests = parseInt(testCountMatch[2]);
        testCount = Math.max(testCount, passedTests + parseInt(testCountMatch[1]));
      } else if (passedMatch) {
        passedTests = parseInt(passedMatch[1]);
        testCount = Math.max(testCount, passedTests);
      }

      const averageTestTime = testTimes.length > 0 
        ? testTimes.reduce((a, b) => a + b, 0) / testTimes.length 
        : 0;

      const slowTests = testTimes.filter(time => time > 100);
      const verySlowTests = testTimes.filter(time => time > 500);

      const results = {
        executionTime: Math.round(executionTime),
        testCount,
        passedTests,
        averageTestTime: Math.round(averageTestTime),
        slowTestCount: slowTests.length,
        verySlowTestCount: verySlowTests.length,
        testThroughput: testCount > 0 ? Math.round((testCount / executionTime) * 1000) : 0,
        exitCode: code
      };

      resolve(results);
    });

    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    console.log('📊 Starting test performance measurement...');
    
    const results = await measureTestPerformance();
    
    // Performance targets
    const targets = {
      maxSuiteTime: 120000, // 2 minutes
      maxTestTime: 100, // 100ms per test
      minThroughput: 10 // 10 tests per second
    };

    // Analyze results
    const analysis = {
      suiteTimeStatus: results.executionTime <= targets.maxSuiteTime ? '✅' : '❌',
      testTimeStatus: results.averageTestTime <= targets.maxTestTime ? '✅' : '❌',
      throughputStatus: results.testThroughput >= targets.minThroughput ? '✅' : '❌'
    };

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      results,
      targets,
      analysis,
      recommendations: generateRecommendations(results, targets)
    };

    // Output results
    console.log('\n📊 Test Performance Results:');
    console.log('═'.repeat(50));
    console.log(`⏱️  Execution Time: ${(results.executionTime / 1000).toFixed(1)}s ${analysis.suiteTimeStatus}`);
    console.log(`🧪 Total Tests: ${results.testCount} (${results.passedTests} passed)`);
    console.log(`⚡ Average Test Time: ${results.averageTestTime}ms ${analysis.testTimeStatus}`);
    console.log(`📈 Test Throughput: ${results.testThroughput} tests/sec ${analysis.throughputStatus}`);
    console.log(`🐌 Slow Tests: ${results.slowTestCount} (>100ms)`);
    console.log(`🚨 Very Slow Tests: ${results.verySlowTestCount} (>500ms)`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`   ${rec}`));
    }
    
    console.log('═'.repeat(50));

    // Write detailed report
    writeFileSync('test-performance-baseline.json', JSON.stringify(report, null, 2));
    console.log('📄 Detailed report saved to test-performance-baseline.json');

    // Exit with appropriate code
    const allTargetsMet = analysis.suiteTimeStatus === '✅' && 
                         analysis.testTimeStatus === '✅' && 
                         analysis.throughputStatus === '✅';
    
    process.exit(allTargetsMet ? 0 : 1);

  } catch (error) {
    console.error('❌ Performance measurement failed:', error.message);
    process.exit(1);
  }
}

function generateRecommendations(results, targets) {
  const recommendations = [];

  if (results.executionTime > targets.maxSuiteTime) {
    const excessTime = Math.round((results.executionTime - targets.maxSuiteTime) / 1000);
    recommendations.push(`🚀 Reduce suite time by ${excessTime}s - implement test parallelization`);
  }

  if (results.averageTestTime > targets.maxTestTime) {
    recommendations.push(`⚡ Optimize individual tests - current avg ${results.averageTestTime}ms > ${targets.maxTestTime}ms`);
  }

  if (results.testThroughput < targets.minThroughput) {
    recommendations.push(`📈 Improve test throughput - current ${results.testThroughput} < ${targets.minThroughput} tests/sec`);
  }

  if (results.slowTestCount > 10) {
    recommendations.push(`🐌 Optimize ${results.slowTestCount} slow tests (>100ms)`);
  }

  if (results.verySlowTestCount > 0) {
    recommendations.push(`🚨 Fix ${results.verySlowTestCount} very slow tests (>500ms)`);
  }

  return recommendations;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}