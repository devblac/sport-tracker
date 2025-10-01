#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  // Test suites to run
  suites: {
    workout: 'tests/e2e/workout-flow.spec.ts',
    social: 'tests/e2e/social-system.spec.ts',
    integration: 'tests/e2e/integration.spec.ts',
    performance: 'tests/e2e/performance.spec.ts',
    accessibility: 'tests/e2e/accessibility.spec.ts'
  },
  
  // Browsers to test
  browsers: ['chromium', 'firefox', 'webkit'],
  
  // Mobile devices to test
  mobile: ['Mobile Chrome', 'Mobile Safari'],
  
  // Test environments
  environments: {
    development: 'http://localhost:5173',
    staging: process.env.STAGING_URL || 'http://localhost:4173'
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function ensureDirectories() {
  const dirs = [
    'test-results',
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces',
    'test-results/reports'
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created directory: ${dir}`);
    }
  }
}

async function installPlaywrightBrowsers() {
  try {
    log('Installing Playwright browsers...');
    await runCommand('npx', ['playwright', 'install']);
    log('Playwright browsers installed successfully', 'success');
  } catch (error) {
    log('Failed to install Playwright browsers', 'error');
    throw error;
  }
}

async function runTestSuite(suite, options = {}) {
  const {
    browser = 'chromium',
    headed = false,
    debug = false,
    timeout = 30000
  } = options;
  
  const args = [
    'playwright', 'test',
    testConfig.suites[suite],
    '--project', browser,
    '--timeout', timeout.toString()
  ];
  
  if (headed) args.push('--headed');
  if (debug) args.push('--debug');
  
  try {
    log(`Running ${suite} tests on ${browser}...`);
    await runCommand('npx', args);
    log(`${suite} tests completed successfully`, 'success');
    return true;
  } catch (error) {
    log(`${suite} tests failed on ${browser}`, 'error');
    return false;
  }
}

async function runPerformanceTests() {
  log('Running performance tests with Lighthouse...');
  
  try {
    // Start the dev server
    const serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    });
    
    // Wait for server to start
    await new Promise((resolve) => {
      serverProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Local:')) {
          resolve();
        }
      });
    });
    
    // Run performance tests
    await runTestSuite('performance', { browser: 'chromium' });
    
    // Kill server
    serverProcess.kill();
    
    log('Performance tests completed', 'success');
  } catch (error) {
    log('Performance tests failed', 'error');
    throw error;
  }
}

async function runAccessibilityTests() {
  log('Running accessibility tests...');
  
  try {
    await runTestSuite('accessibility', { browser: 'chromium' });
    log('Accessibility tests completed', 'success');
  } catch (error) {
    log('Accessibility tests failed', 'error');
    throw error;
  }
}

async function generateReport() {
  log('Generating test report...');
  
  try {
    await runCommand('npx', ['playwright', 'show-report']);
    log('Test report generated', 'success');
  } catch (error) {
    log('Failed to generate test report', 'warning');
  }
}

async function runFullTestSuite() {
  log('Starting full E2E test suite...', 'info');
  
  try {
    // Setup
    await ensureDirectories();
    await installPlaywrightBrowsers();
    
    const results = {
      passed: 0,
      failed: 0,
      suites: {}
    };
    
    // Run core functionality tests
    for (const [suiteName, _] of Object.entries(testConfig.suites)) {
      if (suiteName === 'performance' || suiteName === 'accessibility') {
        continue; // Handle these separately
      }
      
      log(`\n=== Running ${suiteName} test suite ===`);
      
      for (const browser of testConfig.browsers) {
        const success = await runTestSuite(suiteName, { browser });
        
        if (!results.suites[suiteName]) {
          results.suites[suiteName] = { passed: 0, failed: 0 };
        }
        
        if (success) {
          results.passed++;
          results.suites[suiteName].passed++;
        } else {
          results.failed++;
          results.suites[suiteName].failed++;
        }
      }
    }
    
    // Run performance tests
    log('\n=== Running Performance Tests ===');
    try {
      await runPerformanceTests();
      results.passed++;
    } catch (error) {
      results.failed++;
      log('Performance tests failed', 'error');
    }
    
    // Run accessibility tests
    log('\n=== Running Accessibility Tests ===');
    try {
      await runAccessibilityTests();
      results.passed++;
    } catch (error) {
      results.failed++;
      log('Accessibility tests failed', 'error');
    }
    
    // Generate report
    await generateReport();
    
    // Summary
    log('\n=== Test Suite Summary ===');
    log(`Total Passed: ${results.passed}`, 'success');
    log(`Total Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info');
    
    for (const [suite, result] of Object.entries(results.suites)) {
      log(`${suite}: ${result.passed} passed, ${result.failed} failed`);
    }
    
    if (results.failed === 0) {
      log('All tests passed! 🎉', 'success');
      process.exit(0);
    } else {
      log('Some tests failed. Check the reports for details.', 'error');
      process.exit(1);
    }
    
  } catch (error) {
    log(`Test suite failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// CLI handling
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'install':
    installPlaywrightBrowsers();
    break;
    
  case 'workout':
    runTestSuite('workout', { browser: args[1] || 'chromium' });
    break;
    
  case 'social':
    runTestSuite('social', { browser: args[1] || 'chromium' });
    break;
    
  case 'integration':
    runTestSuite('integration', { browser: args[1] || 'chromium' });
    break;
    
  case 'performance':
    runPerformanceTests();
    break;
    
  case 'accessibility':
    runAccessibilityTests();
    break;
    
  case 'report':
    generateReport();
    break;
    
  case 'full':
  default:
    runFullTestSuite();
    break;
}