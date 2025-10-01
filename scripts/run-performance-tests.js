#!/usr/bin/env node

/**
 * Performance Test Runner Script
 * 
 * Runs performance tests and integrates with CI/CD pipeline
 * Usage: node scripts/run-performance-tests.js [options]
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Configuration
const config = {
  testPattern: 'src/test/__tests__/performance/**/*.test.{ts,tsx}',
  coverageThreshold: 90,
  performanceThreshold: {
    renderTime: 200, // ms
    memoryUsage: 1024 * 1024, // 1MB
  },
  outputDir: 'test-results/performance',
  baselineFile: 'performance-baselines.json',
  reportFile: 'performance-report.json',
  ciIntegration: true,
  regressionDetection: true
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  updateBaselines: args.includes('--update-baselines'),
  failFast: args.includes('--fail-fast'),
  verbose: args.includes('--verbose'),
  ci: args.includes('--ci') || process.env.CI === 'true',
  component: args.find(arg => arg.startsWith('--component='))?.split('=')[1],
  iterations: parseInt(args.find(arg => arg.startsWith('--iterations='))?.split('=')[1] || '3')
};

console.log('🚀 Starting Performance Test Suite');
console.log('Configuration:', JSON.stringify(config, null, 2));
console.log('Options:', JSON.stringify(options, null, 2));

async function runPerformanceTests() {
  try {
    // Ensure output directory exists
    execSync(`mkdir -p ${config.outputDir}`, { stdio: 'inherit' });

    // Build the project first
    console.log('\n📦 Building project...');
    execSync('npm run build', { stdio: options.verbose ? 'inherit' : 'pipe' });

    // Run performance tests
    console.log('\n🧪 Running performance tests...');
    
    const vitestCommand = [
      'npx vitest run',
      `--config vitest.config.ts`,
      `--reporter=verbose`,
      `--reporter=json --outputFile=${config.outputDir}/results.json`,
      config.testPattern
    ];

    if (options.component) {
      vitestCommand.push(`--grep="${options.component}"`);
    }

    if (options.failFast) {
      vitestCommand.push('--bail=1');
    }

    // Set environment variables for performance testing
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      PERFORMANCE_TEST_MODE: 'true',
      PERFORMANCE_ITERATIONS: options.iterations.toString(),
      PERFORMANCE_UPDATE_BASELINES: options.updateBaselines.toString(),
      PERFORMANCE_CI_MODE: options.ci.toString(),
      PERFORMANCE_REGRESSION_DETECTION: config.regressionDetection.toString(),
      BUILD_NUMBER: process.env.GITHUB_RUN_NUMBER || process.env.BUILD_NUMBER || `local-${Date.now()}`
    };

    execSync(vitestCommand.join(' '), { 
      stdio: options.verbose ? 'inherit' : 'pipe',
      env
    });

    // Process results
    console.log('\n📊 Processing performance results...');
    await processPerformanceResults();

    // Generate reports
    console.log('\n📋 Generating performance reports...');
    await generateReports();

    // Check for regressions if in CI mode
    if (options.ci) {
      console.log('\n🔍 Checking for performance regressions...');
      const shouldFail = await checkRegressions();
      
      if (shouldFail) {
        console.error('❌ Performance tests failed due to regressions');
        process.exit(1);
      }
    }

    console.log('\n✅ Performance tests completed successfully');

  } catch (error) {
    console.error('\n❌ Performance tests failed:', error.message);
    
    if (options.verbose) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

async function processPerformanceResults() {
  const resultsFile = path.join(config.outputDir, 'results.json');
  
  if (!existsSync(resultsFile)) {
    throw new Error('Performance test results not found');
  }

  const results = JSON.parse(readFileSync(resultsFile, 'utf-8'));
  
  // Extract performance metrics from test results
  const performanceMetrics = extractPerformanceMetrics(results);
  
  // Save processed metrics
  const metricsFile = path.join(config.outputDir, 'metrics.json');
  writeFileSync(metricsFile, JSON.stringify(performanceMetrics, null, 2));
  
  console.log(`📈 Processed ${performanceMetrics.length} performance metrics`);
  
  return performanceMetrics;
}

function extractPerformanceMetrics(testResults) {
  const metrics = [];
  
  // Process test results to extract performance data
  if (testResults.testResults) {
    testResults.testResults.forEach(suite => {
      if (suite.assertionResults) {
        suite.assertionResults.forEach(test => {
          if (test.title.includes('performance') || test.title.includes('render')) {
            // Extract performance data from test output or custom properties
            const metric = {
              testName: test.title,
              suiteName: suite.name,
              status: test.status,
              duration: test.duration || 0,
              // Additional performance metrics would be extracted here
              // from custom test output or global test state
            };
            
            metrics.push(metric);
          }
        });
      }
    });
  }
  
  return metrics;
}

async function generateReports() {
  const metricsFile = path.join(config.outputDir, 'metrics.json');
  
  if (!existsSync(metricsFile)) {
    console.warn('⚠️ No performance metrics found, skipping report generation');
    return;
  }

  const metrics = JSON.parse(readFileSync(metricsFile, 'utf-8'));
  
  // Generate HTML report
  const htmlReport = generateHTMLReport(metrics);
  const htmlFile = path.join(config.outputDir, 'report.html');
  writeFileSync(htmlFile, htmlReport);
  
  // Generate markdown report for CI
  const markdownReport = generateMarkdownReport(metrics);
  const markdownFile = path.join(config.outputDir, 'report.md');
  writeFileSync(markdownFile, markdownReport);
  
  console.log(`📄 Reports generated: ${htmlFile}, ${markdownFile}`);
}

function generateHTMLReport(metrics) {
  const passedTests = metrics.filter(m => m.status === 'passed').length;
  const failedTests = metrics.filter(m => m.status === 'failed').length;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .metric { margin: 10px 0; padding: 10px; border-left: 4px solid #007acc; }
        .passed { border-left-color: #28a745; }
        .failed { border-left-color: #dc3545; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Performance Test Report</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${metrics.length}</p>
        <p><strong>Passed:</strong> ${passedTests}</p>
        <p><strong>Failed:</strong> ${failedTests}</p>
        <p><strong>Success Rate:</strong> ${((passedTests / metrics.length) * 100).toFixed(1)}%</p>
    </div>
    
    <h2>Test Results</h2>
    <table>
        <thead>
            <tr>
                <th>Test Name</th>
                <th>Suite</th>
                <th>Status</th>
                <th>Duration (ms)</th>
            </tr>
        </thead>
        <tbody>
            ${metrics.map(metric => `
                <tr class="${metric.status}">
                    <td>${metric.testName}</td>
                    <td>${metric.suiteName}</td>
                    <td>${metric.status}</td>
                    <td>${metric.duration}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <p><em>Generated on ${new Date().toISOString()}</em></p>
</body>
</html>
  `;
}

function generateMarkdownReport(metrics) {
  const passedTests = metrics.filter(m => m.status === 'passed').length;
  const failedTests = metrics.filter(m => m.status === 'failed').length;
  
  let report = `# Performance Test Report\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${metrics.length}\n`;
  report += `- **Passed:** ${passedTests} ✅\n`;
  report += `- **Failed:** ${failedTests} ❌\n`;
  report += `- **Success Rate:** ${((passedTests / metrics.length) * 100).toFixed(1)}%\n\n`;
  
  if (failedTests > 0) {
    report += `## Failed Tests\n\n`;
    metrics.filter(m => m.status === 'failed').forEach(metric => {
      report += `- ❌ **${metric.testName}** (${metric.suiteName})\n`;
    });
    report += `\n`;
  }
  
  report += `## All Results\n\n`;
  report += `| Test Name | Suite | Status | Duration |\n`;
  report += `|-----------|-------|--------|----------|\n`;
  
  metrics.forEach(metric => {
    const status = metric.status === 'passed' ? '✅' : '❌';
    report += `| ${metric.testName} | ${metric.suiteName} | ${status} | ${metric.duration}ms |\n`;
  });
  
  report += `\n---\n*Generated on ${new Date().toISOString()}*\n`;
  
  return report;
}

async function checkRegressions() {
  // Load baseline data if it exists
  const baselineFile = config.baselineFile;
  let baselines = {};
  
  if (existsSync(baselineFile)) {
    baselines = JSON.parse(readFileSync(baselineFile, 'utf-8'));
  }
  
  // Load current metrics
  const metricsFile = path.join(config.outputDir, 'metrics.json');
  const currentMetrics = JSON.parse(readFileSync(metricsFile, 'utf-8'));
  
  // Check for regressions
  let hasRegressions = false;
  const regressions = [];
  
  currentMetrics.forEach(metric => {
    const baseline = baselines[metric.testName];
    
    if (baseline && metric.duration > baseline.duration * 1.2) { // 20% regression threshold
      hasRegressions = true;
      regressions.push({
        test: metric.testName,
        current: metric.duration,
        baseline: baseline.duration,
        regression: ((metric.duration / baseline.duration - 1) * 100).toFixed(1)
      });
    }
  });
  
  if (hasRegressions) {
    console.error('\n🚨 Performance regressions detected:');
    regressions.forEach(reg => {
      console.error(`  - ${reg.test}: ${reg.current}ms vs ${reg.baseline}ms baseline (+${reg.regression}%)`);
    });
  }
  
  // Update baselines if requested
  if (options.updateBaselines) {
    const newBaselines = {};
    currentMetrics.forEach(metric => {
      newBaselines[metric.testName] = {
        duration: metric.duration,
        timestamp: new Date().toISOString()
      };
    });
    
    writeFileSync(baselineFile, JSON.stringify(newBaselines, null, 2));
    console.log(`📊 Updated performance baselines in ${baselineFile}`);
  }
  
  return hasRegressions && !options.updateBaselines;
}

// Run the performance tests
runPerformanceTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});