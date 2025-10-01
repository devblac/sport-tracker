#!/usr/bin/env node

/**
 * Performance Testing CLI
 * 
 * Command-line interface for running performance tests
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */

import { PerformanceRunner } from './performance-runner';

interface CLIOptions {
  component?: string;
  category?: string;
  updateBaselines?: boolean;
  ci?: boolean;
  verbose?: boolean;
  help?: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--component':
      case '-c':
        options.component = args[++i];
        break;
      case '--category':
        options.category = args[++i];
        break;
      case '--update-baselines':
      case '-u':
        options.updateBaselines = true;
        break;
      case '--ci':
        options.ci = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
Performance Testing CLI

Usage: npm run test:performance [options]

Options:
  -c, --component <name>    Run tests for specific component
      --category <name>     Run tests for specific category
  -u, --update-baselines    Update performance baselines
      --ci                  Run in CI mode
  -v, --verbose             Verbose output
  -h, --help                Show this help

Examples:
  npm run test:performance                    # Run all performance tests
  npm run test:performance -c Button          # Test Button component only
  npm run test:performance --category ui      # Test UI components only
  npm run test:performance -u                 # Update baselines
  npm run test:performance --ci               # Run in CI mode

Categories:
  ui          - Basic UI components (Button, Input, Modal)
  workout     - Workout-related components
  social      - Social feature components
  gamification - XP, achievements, streaks
  pages       - Full page components

Components:
  Button, Input, Modal, WorkoutPlayer, ExerciseCard, SocialFeed,
  Dashboard, Profile, XPDisplay, AchievementCard, StreakCounter
`);
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  console.log('🚀 Performance Testing CLI');
  console.log('═'.repeat(40));

  try {
    const runner = new PerformanceRunner({
      buildNumber: process.env.BUILD_NUMBER || `cli-${Date.now()}`,
      updateBaselines: options.updateBaselines,
      ciMode: options.ci || process.env.CI === 'true',
      verbose: options.verbose,
      components: options.component ? [options.component] : undefined,
      categories: options.category ? [options.category] : undefined
    });

    let result;

    if (options.updateBaselines) {
      console.log('📊 Updating performance baselines...');
      await runner.updateBaselines();
      console.log('✅ Baselines updated successfully');
      return;
    }

    if (options.component) {
      console.log(`🧪 Testing component: ${options.component}`);
      result = await runner.runComponent(options.component);
    } else if (options.category) {
      console.log(`📂 Testing category: ${options.category}`);
      result = await runner.runCategory(options.category);
    } else {
      console.log('🔍 Running all performance tests...');
      result = await runner.runAll();
    }

    // Print summary
    console.log('\n📊 Test Summary');
    console.log('═'.repeat(40));
    console.log(`Total Tests: ${result.totalTests}`);
    console.log(`Passed: ${result.passedTests} ✅`);
    console.log(`Failed: ${result.failedTests} ❌`);
    console.log(`Execution Time: ${(result.executionTime / 1000).toFixed(2)}s`);

    if (result.regressions > 0) {
      console.log(`\n⚠️  Performance Regressions: ${result.regressions}`);
      console.log(`Critical: ${result.criticalRegressions}`);
    }

    if (result.reportPath) {
      console.log(`\n📄 Report: ${result.reportPath}`);
    }

    // Exit with appropriate code
    if (!result.success || result.shouldFailBuild) {
      console.log('\n❌ Performance tests failed');
      process.exit(1);
    } else {
      console.log('\n✅ All performance tests passed');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Performance testing failed:', error);
    
    if (options.verbose && error instanceof Error) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as runPerformanceCLI };