import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import vitestQualityPlugin from './src/test/vitest-quality-plugin';
import TestPerformanceOptimizer from './src/test/performance-optimizer';

// Detect CI environment
const isCI = process.env.CI === 'true';
const isCIOptimized = process.env.VITEST_PERFORMANCE_MODE === 'ci';

// Get test files for optimization
const testFiles = [
  'src/**/*.test.{js,ts,tsx}',
  'src/**/__tests__/**/*.{js,ts,tsx}'
];

// Create optimized configuration
async function createOptimizedConfig() {
  const performanceOptimizer = new TestPerformanceOptimizer();
  const optimizedConfig = await performanceOptimizer.optimizeTestConfiguration(testFiles, isCI || isCIOptimized);
  
  return {
    testTimeout: optimizedConfig.testTimeout,
    setupTimeout: optimizedConfig.setupTimeout,
    teardownTimeout: optimizedConfig.teardownTimeout,
    poolOptions: optimizedConfig.poolOptions
  };
}

// For now, use default values since Vite config can't be async
const defaultOptimizedConfig = {
  testTimeout: isCI ? 15000 : 10000,
  setupTimeout: isCI ? 30000 : 20000,
  teardownTimeout: 5000,
  poolOptions: {
    threads: {
      singleThread: false,
      isolate: true,
      minThreads: 1,
      maxThreads: isCI ? 2 : 4,
      useAtomics: true,
      execArgv: [
        '--max-old-space-size=2048',
        '--optimize-for-size'
      ]
    }
  }
};

export default defineConfig({
  plugins: [
    // Enhanced test infrastructure with performance optimization
    vitestQualityPlugin({
      enableReliabilityTracking: true,
      enableCoverageEnforcement: true,
      enableDataPersistence: true,
      enableMetricsDashboard: process.env.NODE_ENV === 'development',
      failOnThresholdViolation: isCI,
      buildNumber: parseInt(process.env.BUILD_NUMBER || Date.now().toString()),
      environment: process.env.NODE_ENV || 'test',
      // Performance optimization settings
      enablePerformanceOptimization: true,
      performanceTargets: {
        maxSuiteTime: 120000, // 2 minutes
        maxTestTime: 100, // 100ms per test
        maxCITime: 300000 // 5 minutes total CI time
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    
    // Optimized coverage configuration
    coverage: {
      provider: 'v8',
      reporter: isCI ? ['json', 'json-summary'] : ['text', 'json', 'html', 'json-summary'],
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
      // Performance-optimized coverage thresholds
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        perFile: true
      },
      watermarks: {
        statements: [75, 85],
        functions: [75, 85],
        branches: [75, 85],
        lines: [75, 85]
      },
      all: true,
      skipFull: isCI, // Skip full coverage in CI for speed
      // Optimize coverage collection
      reportsDirectory: './coverage',
      clean: true,
      cleanOnRerun: true
    },

    // Performance-optimized timeouts
    testTimeout: defaultOptimizedConfig.testTimeout,
    hookTimeout: defaultOptimizedConfig.setupTimeout,
    teardownTimeout: defaultOptimizedConfig.teardownTimeout,
    
    // Disable retries for performance and flaky test detection
    retry: 0,
    
    // Performance testing configuration
    benchmark: {
      include: ['**/*.bench.{js,ts,tsx}'],
      exclude: ['node_modules/**/*'],
      reporters: isCI ? ['json'] : ['default', 'json']
    },
    
    // Optimized test result reporting
    outputFile: {
      json: './test-results/results.json',
      junit: isCI ? './test-results/results.xml' : undefined
    },
    
    // Performance-optimized reporters
    reporters: isCI 
      ? ['basic', 'json'] // Minimal output in CI
      : ['default', 'json'],
    
    // Optimized pool configuration for performance
    pool: 'threads',
    poolOptions: defaultOptimizedConfig.poolOptions,
    
    // Performance optimizations
    includeSource: ['src/**/*.{js,ts,tsx}'],
    
    // Fail fast in CI for performance
    bail: isCI ? 1 : 0,
    
    // Optimize logging for performance
    printConsoleTrace: !isCI,
    logHeapUsage: !isCI,
    
    // Performance-focused test selection
    passWithNoTests: true,
    
    // Optimize file watching (disabled in CI)
    watch: !isCI,
    
    // Cache configuration for performance
    cache: {
      dir: './.test-cache/vitest'
    },
    
    // Optimize test isolation for performance
    isolate: true,
    
    // Performance-optimized environment options
    environmentOptions: {
      jsdom: {
        resources: isCI ? 'usable' : 'preferFast', // Faster resource loading in CI
        runScripts: 'dangerously',
        pretendToBeVisual: false // Disable visual features for performance
      }
    },
    
    // Optimize test file processing
    deps: {
      // Optimize dependency handling
      inline: [
        // Inline small dependencies for better performance
        /^(?!.*node_modules).*$/
      ],
      // External dependencies that should not be processed
      external: [
        'node_modules/**'
      ]
    },
    
    // Performance-focused test execution
    sequence: {
      // Optimize test execution order
      shuffle: false, // Disable shuffling for consistent performance
      concurrent: true, // Enable concurrent execution
      setupFiles: 'parallel' // Run setup files in parallel
    },
    
    // Optimize test file discovery
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      // Exclude slow integration tests in performance mode
      ...(isCIOptimized ? ['**/integration/**', '**/e2e/**'] : [])
    ]
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  
  // Optimize build performance
  esbuild: {
    target: 'node14',
    // Optimize for faster builds
    minify: false,
    sourcemap: !isCI
  },
  
  // Performance-focused define
  define: {
    __TEST_PERFORMANCE_MODE__: isCIOptimized,
    __CI_MODE__: isCI
  }
});