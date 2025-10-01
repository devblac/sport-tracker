#!/usr/bin/env node

/**
 * Test Performance Monitoring Script
 * Monitors and optimizes test execution performance
 * Requirements: 6.1, 9.1, 9.2
 */

import { performance } from 'perf_hooks';
import { spawn } from 'child_process';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

class TestPerformanceMonitor {
  constructor() {
    this.startTime = 0;
    this.metrics = {
      totalTime: 0,
      testCount: 0,
      averageTestTime: 0,
      slowTests: [],
      fastTests: [],
      memoryUsage: 0,
      cacheHitRate: 0
    };
    
    this.targets = {
      maxSuiteTime: 120000, // 2 minutes
      maxTestTime: 100, // 100ms per test
      maxCITime: 300000, // 5 minutes for CI
      minCacheHitRate: 0.3 // 30%
    };
  }

  async runPerformanceTest(mode = 'balanced') {
    console.log('🚀 Starting performance-optimized test execution...');
    this.startTime = performance.now();

    const config = this.getConfigForMode(mode);
    const testProcess = this.spawnTestProcess(config);
    
    const results = await this.monitorTestExecution(testProcess);
    const metrics = this.calculateMetrics(results);
    
    await this.generateReport(metrics);
    return metrics;
  }

  getConfigForMode(mode) {
    const configs = {
      fast: {
        config: 'vitest.config.performance.ts',
        env: { VITEST_PERFORMANCE_MODE: 'ci' },
        args: ['--reporter=basic', '--bail=1', '--no-coverage']
      },
      balanced: {
        config: 'vitest.config.performance.ts',
        env: { VITEST_PERFORMANCE_MODE: 'balanced' },
        args: ['--reporter=verbose']
      },
      thorough: {
        config: 'vitest.config.ts',
        env: {},
        args: ['--reporter=verbose', '--coverage']
      }
    };

    return configs[mode] || configs.balanced;
  }

  spawnTestProcess(config) {
    const env = {
      ...process.env,
      ...config.env,
      NODE_OPTIONS: '--max-old-space-size=2048 --optimize-for-size'
    };

    const args = [
      'run',
      '--config', config.config,
      ...config.args
    ];

    return spawn('npx', ['vitest', ...args], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
  }

  async monitorTestExecution(testProcess) {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      const testTimes = [];
      const memorySnapshots = [];

      // Monitor memory usage
      const memoryInterval = setInterval(() => {
        const usage = process.memoryUsage();
        memorySnapshots.push(usage.heapUsed);
      }, 1000);

      testProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        
        // Parse test execution times from output
        const testMatches = output.match(/✓.*?\((\d+)ms\)/g);
        if (testMatches) {
          testMatches.forEach(match => {
            const time = parseInt(match.match(/\((\d+)ms\)/)[1]);
            testTimes.push(time);
          });
        }

        // Real-time performance warnings
        const slowTestMatch = output.match(/✓.*?\((\d+)ms\)/);
        if (slowTestMatch) {
          const time = parseInt(slowTestMatch[1]);
          if (time > this.targets.maxTestTime * 2) {
            console.warn(`⚠️  Slow test detected: ${time}ms`);
          }
        }
      });

      testProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      testProcess.on('close', (code) => {
        clearInterval(memoryInterval);
        
        const results = {
          exitCode: code,
          stdout,
          stderr,
          testTimes,
          memorySnapshots,
          totalTime: performance.now() - this.startTime
        };

        if (code === 0) {
          resolve(results);
        } else {
          reject(new Error(`Test process failed with code ${code}\n${stderr}`));
        }
      });
    });
  }

  calculateMetrics(results) {
    const { testTimes, memorySnapshots, totalTime } = results;
    
    const testCount = testTimes.length;
    const averageTestTime = testCount > 0 ? testTimes.reduce((a, b) => a + b, 0) / testCount : 0;
    const maxMemory = Math.max(...memorySnapshots);
    
    // Identify slow and fast tests
    const slowTests = testTimes.filter(time => time > this.targets.maxTestTime * 2);
    const fastTests = testTimes.filter(time => time < this.targets.maxTestTime * 0.5);
    
    // Calculate cache hit rate (mock for now)
    const cacheHitRate = this.estimateCacheHitRate(results.stdout);
    
    return {
      totalTime: Math.round(totalTime),
      testCount,
      averageTestTime: Math.round(averageTestTime),
      slowTestCount: slowTests.length,
      fastTestCount: fastTests.length,
      maxMemoryUsage: maxMemory,
      cacheHitRate,
      performanceGrade: this.calculateGrade(totalTime, averageTestTime, slowTests.length),
      recommendations: this.generateRecommendations(totalTime, averageTestTime, slowTests.length, cacheHitRate)
    };
  }

  estimateCacheHitRate(stdout) {
    // Look for cache-related output in test results
    const cacheHits = (stdout.match(/cache hit/gi) || []).length;
    const cacheMisses = (stdout.match(/cache miss/gi) || []).length;
    const total = cacheHits + cacheMisses;
    
    return total > 0 ? cacheHits / total : 0.1; // Default to 10% if no cache info
  }

  calculateGrade(totalTime, averageTestTime, slowTestCount) {
    let score = 100;
    
    // Deduct points for slow execution
    if (totalTime > this.targets.maxSuiteTime) {
      score -= 30;
    } else if (totalTime > this.targets.maxSuiteTime * 0.8) {
      score -= 15;
    }
    
    // Deduct points for slow individual tests
    if (averageTestTime > this.targets.maxTestTime) {
      score -= 25;
    } else if (averageTestTime > this.targets.maxTestTime * 0.8) {
      score -= 10;
    }
    
    // Deduct points for slow tests
    score -= Math.min(slowTestCount * 5, 25);
    
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  generateRecommendations(totalTime, averageTestTime, slowTestCount, cacheHitRate) {
    const recommendations = [];
    
    if (totalTime > this.targets.maxSuiteTime) {
      recommendations.push('🚀 Consider enabling test parallelization or reducing test scope');
    }
    
    if (averageTestTime > this.targets.maxTestTime) {
      recommendations.push('⚡ Optimize individual test performance with better mocking');
    }
    
    if (slowTestCount > 5) {
      recommendations.push(`🐌 ${slowTestCount} slow tests detected - consider refactoring`);
    }
    
    if (cacheHitRate < this.targets.minCacheHitRate) {
      recommendations.push('💾 Improve test result caching for better performance');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Test performance is optimal!');
    }
    
    return recommendations;
  }

  async generateReport(metrics) {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      targets: this.targets,
      summary: {
        passed: metrics.totalTime <= this.targets.maxSuiteTime && 
                metrics.averageTestTime <= this.targets.maxTestTime,
        grade: metrics.performanceGrade,
        timeEfficiency: Math.round((this.targets.maxSuiteTime - metrics.totalTime) / this.targets.maxSuiteTime * 100),
        testEfficiency: Math.round((this.targets.maxTestTime - metrics.averageTestTime) / this.targets.maxTestTime * 100)
      }
    };

    // Write JSON report
    writeFileSync('test-performance-report.json', JSON.stringify(report, null, 2));
    
    // Write markdown summary
    const markdown = this.generateMarkdownReport(report);
    writeFileSync('test-performance-summary.md', markdown);
    
    // Console output
    this.printSummary(report);
    
    return report;
  }

  generateMarkdownReport(report) {
    const { metrics, summary } = report;
    
    return `# Test Performance Report

## Summary
- **Grade**: ${metrics.performanceGrade}
- **Status**: ${summary.passed ? '✅ PASSED' : '❌ FAILED'}
- **Total Time**: ${(metrics.totalTime / 1000).toFixed(1)}s / ${(this.targets.maxSuiteTime / 1000)}s
- **Average Test Time**: ${metrics.averageTestTime}ms / ${this.targets.maxTestTime}ms

## Metrics
- **Test Count**: ${metrics.testCount}
- **Fast Tests**: ${metrics.fastTestCount} (< ${this.targets.maxTestTime * 0.5}ms)
- **Slow Tests**: ${metrics.slowTestCount} (> ${this.targets.maxTestTime * 2}ms)
- **Memory Usage**: ${(metrics.maxMemoryUsage / 1024 / 1024).toFixed(1)} MB
- **Cache Hit Rate**: ${(metrics.cacheHitRate * 100).toFixed(1)}%

## Efficiency
- **Time Efficiency**: ${summary.timeEfficiency}%
- **Test Efficiency**: ${summary.testEfficiency}%

## Recommendations
${metrics.recommendations.map(rec => `- ${rec}`).join('\n')}

## Targets
- **Max Suite Time**: ${this.targets.maxSuiteTime / 1000}s
- **Max Test Time**: ${this.targets.maxTestTime}ms
- **Min Cache Hit Rate**: ${this.targets.minCacheHitRate * 100}%
`;
  }

  printSummary(report) {
    const { metrics, summary } = report;
    
    console.log('\n📊 Test Performance Summary');
    console.log('═'.repeat(50));
    console.log(`🎯 Grade: ${metrics.performanceGrade}`);
    console.log(`⏱️  Total Time: ${(metrics.totalTime / 1000).toFixed(1)}s`);
    console.log(`🧪 Tests: ${metrics.testCount}`);
    console.log(`⚡ Avg Time: ${metrics.averageTestTime}ms`);
    console.log(`🐌 Slow Tests: ${metrics.slowTestCount}`);
    console.log(`💾 Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`📈 Status: ${summary.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (metrics.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      metrics.recommendations.forEach(rec => console.log(`   ${rec}`));
    }
    
    console.log('═'.repeat(50));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'balanced';
  
  if (!['fast', 'balanced', 'thorough'].includes(mode)) {
    console.error('Usage: node monitor-test-performance.js [fast|balanced|thorough]');
    process.exit(1);
  }
  
  const monitor = new TestPerformanceMonitor();
  
  try {
    const metrics = await monitor.runPerformanceTest(mode);
    
    // Exit with error code if performance targets not met
    const passed = metrics.totalTime <= monitor.targets.maxSuiteTime && 
                   metrics.averageTestTime <= monitor.targets.maxTestTime;
    
    process.exit(passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default TestPerformanceMonitor;