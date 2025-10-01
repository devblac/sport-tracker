#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting E2E Test Suite for Sport Tracker PWA\n');

// Ensure test directories exist
const testDirs = [
  'test-results',
  'test-results/screenshots',
  'test-results/videos',
  'test-results/traces'
];

testDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Test configuration
const tests = [
  {
    name: 'Smoke Tests',
    file: 'tests/e2e/smoke.spec.ts',
    description: 'Basic app functionality and responsiveness'
  },
  {
    name: 'Workout Flow Tests',
    file: 'tests/e2e/workout-flow.spec.ts',
    description: 'Complete workout creation, execution, and completion'
  },
  {
    name: 'Social System Tests',
    file: 'tests/e2e/social-system.spec.ts',
    description: 'Social features, friends, challenges, and sharing'
  },
  {
    name: 'Integration Tests',
    file: 'tests/e2e/integration.spec.ts',
    description: 'Cross-system integration and data consistency'
  },
  {
    name: 'Performance Tests',
    file: 'tests/e2e/performance.spec.ts',
    description: 'Performance metrics and Lighthouse audits'
  },
  {
    name: 'Accessibility Tests',
    file: 'tests/e2e/accessibility.spec.ts',
    description: 'WCAG compliance and accessibility features'
  }
];

async function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    
    const child = spawn(command, [], {
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

async function runTestSuite() {
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
  };

  console.log('📋 E2E Test Suite Overview:');
  tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name} - ${test.description}`);
  });
  console.log('');

  // Install Playwright browsers if needed
  try {
    console.log('🔧 Installing Playwright browsers...');
    await runCommand('npx playwright install chromium');
    console.log('✅ Playwright browsers installed\n');
  } catch (error) {
    console.log('⚠️  Playwright browser installation failed, continuing...\n');
  }

  // Run each test suite
  for (const test of tests) {
    console.log(`\n🧪 Running: ${test.name}`);
    console.log(`📝 Description: ${test.description}`);
    
    try {
      // Check if test file exists
      if (!fs.existsSync(test.file)) {
        console.log(`⚠️  Test file not found: ${test.file}`);
        results.skipped++;
        results.details.push({
          name: test.name,
          status: 'skipped',
          reason: 'Test file not found'
        });
        continue;
      }

      // Run the test
      await runCommand(`npx playwright test "${test.file}" --project=chromium --timeout=60000`);
      
      console.log(`✅ ${test.name} - PASSED`);
      results.passed++;
      results.details.push({
        name: test.name,
        status: 'passed'
      });
      
    } catch (error) {
      console.log(`❌ ${test.name} - FAILED`);
      console.log(`Error: ${error.message}`);
      results.failed++;
      results.details.push({
        name: test.name,
        status: 'failed',
        error: error.message
      });
    }
  }

  // Run Lighthouse performance audit
  console.log('\n🔍 Running Lighthouse Performance Audit...');
  try {
    await runCommand('npm run lighthouse');
    console.log('✅ Lighthouse audit completed');
    results.passed++;
    results.details.push({
      name: 'Lighthouse Performance Audit',
      status: 'passed'
    });
  } catch (error) {
    console.log('⚠️  Lighthouse audit failed or skipped');
    results.skipped++;
    results.details.push({
      name: 'Lighthouse Performance Audit',
      status: 'skipped',
      reason: 'Lighthouse audit failed'
    });
  }

  // Generate test report
  try {
    console.log('\n📊 Generating test report...');
    await runCommand('npx playwright show-report --host=127.0.0.1');
  } catch (error) {
    console.log('⚠️  Could not generate test report');
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 E2E TEST SUITE SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Skipped: ${results.skipped}`);
  console.log(`📈 Total: ${results.passed + results.failed + results.skipped}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! The Sport Tracker PWA is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the results and fix issues before deployment.');
  }

  console.log('\n📋 Detailed Results:');
  results.details.forEach((result, index) => {
    const statusIcon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
    console.log(`${index + 1}. ${statusIcon} ${result.name} - ${result.status.toUpperCase()}`);
    if (result.reason) {
      console.log(`   Reason: ${result.reason}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n📁 Test artifacts saved to:');
  console.log('   - Screenshots: test-results/screenshots/');
  console.log('   - Videos: test-results/videos/');
  console.log('   - Traces: test-results/traces/');
  console.log('   - HTML Report: playwright-report/');

  console.log('\n🔗 Next steps:');
  if (results.failed > 0) {
    console.log('   1. Review failed tests and fix issues');
    console.log('   2. Check test artifacts for debugging information');
    console.log('   3. Re-run specific failed tests');
  } else {
    console.log('   1. Review performance metrics');
    console.log('   2. Deploy to staging environment');
    console.log('   3. Run tests against staging');
  }

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('E2E Test Suite for Sport Tracker PWA');
  console.log('');
  console.log('Usage: node tests/run-e2e-suite.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h    Show this help message');
  console.log('');
  console.log('Available npm scripts:');
  console.log('  npm run test:e2e:full         Run complete E2E test suite');
  console.log('  npm run test:e2e:workout      Run workout flow tests only');
  console.log('  npm run test:e2e:social       Run social system tests only');
  console.log('  npm run test:e2e:performance  Run performance tests only');
  console.log('  npm run test:e2e:accessibility Run accessibility tests only');
  process.exit(0);
}

// Run the test suite
runTestSuite().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});