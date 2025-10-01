import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import vitestQualityPlugin from './src/test/vitest-quality-plugin';

export default defineConfig({
  plugins: [
    // Enhanced test infrastructure with reliability tracking
    vitestQualityPlugin({
      enableReliabilityTracking: true,
      enableCoverageEnforcement: true,
      enableDataPersistence: true,
      enableMetricsDashboard: process.env.NODE_ENV === 'development',
      failOnThresholdViolation: process.env.CI === 'true',
      buildNumber: parseInt(process.env.BUILD_NUMBER || Date.now().toString()),
      environment: process.env.NODE_ENV || 'test'
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/polyfills.ts',
        'src/**/*.stories.tsx',
        'src/**/*.bench.ts'
      ],
      // Global thresholds (90% overall) - Requirement 10.3
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        // Per-file thresholds (80% minimum) - Requirement 11.1
        perFile: true
      },
      // Watermarks for different code types - Components 75%, Utilities 85%
      watermarks: {
        statements: [75, 85], // Component (75%) vs Utility (85%) thresholds
        functions: [75, 85],
        branches: [75, 85],
        lines: [75, 85]
      },
      // Enable all coverage metrics for granular analysis
      all: true,
      skipFull: false,
      // Coverage validation will be handled by the plugin
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    // Disable retries to detect flaky tests - Requirement 10.2
    retry: 0,
    // Performance testing
    benchmark: {
      include: ['**/*.bench.{js,ts,tsx}'],
      exclude: ['node_modules/**/*']
    },
    // Test result reporting for reliability tracking - Requirements 10.1, 10.2
    outputFile: {
      json: './test-results/results.json',
      junit: './test-results/results.xml'
    },
    // Enhanced reporting with quality metrics
    reporters: [
      'default',
      'json',
      'junit'
    ],
    // Pool options for consistent test execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
        // Ensure consistent environment for flaky test detection
        minThreads: 1,
        maxThreads: process.env.CI ? 2 : 4
      }
    },
    // Enhanced test metadata for reliability analysis
    includeSource: ['src/**/*.{js,ts,tsx}'],
    // Fail fast on critical issues in CI
    bail: process.env.CI ? 1 : 0,
    // Detailed error reporting
    printConsoleTrace: true,
    logHeapUsage: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});