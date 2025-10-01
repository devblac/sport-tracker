import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import os from 'os';

// Detect environment and performance mode
const isCI = process.env.CI === 'true';
const isPerformanceMode = process.env.VITEST_PERFORMANCE_MODE === 'optimized';
const cpuCount = os.cpus().length;

// Calculate optimal thread configuration
const getOptimalThreads = () => {
  if (isCI) {
    return Math.min(2, cpuCount); // Conservative in CI
  }
  if (isPerformanceMode) {
    return Math.min(4, Math.max(2, Math.floor(cpuCount * 0.75)));
  }
  return Math.min(6, cpuCount);
};

const optimalThreads = getOptimalThreads();

export default defineConfig({
  test: {
    // Environment configuration
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    
    // Performance-optimized timeouts
    testTimeout: isCI ? 8000 : 10000,
    hookTimeout: isCI ? 15000 : 20000,
    teardownTimeout: 3000,
    
    // Disable retries for performance and flaky test detection
    retry: 0,
    
    // Optimized pool configuration for maximum performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: !isPerformanceMode, // Disable isolation in performance mode for speed
        minThreads: 1,
        maxThreads: optimalThreads,
        useAtomics: true,
        // Remove execArgv to avoid worker issues
      }
    },
    
    // Performance-focused test selection and execution
    passWithNoTests: true,
    allowOnly: !isCI,
    
    // Optimized file watching (disabled in CI and performance mode)
    watch: !isCI && !isPerformanceMode,
    
    // Use Vite's cacheDir instead of deprecated cache.dir
    
    // Optimized coverage configuration
    coverage: {
      provider: 'v8',
      reporter: isCI || isPerformanceMode 
        ? ['json-summary', 'json'] 
        : ['text', 'json', 'html'],
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
      // Performance-optimized thresholds
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        perFile: !isPerformanceMode // Skip per-file in performance mode
      },
      all: !isPerformanceMode, // Skip full coverage in performance mode
      skipFull: isCI || isPerformanceMode,
      clean: true,
      cleanOnRerun: true
    },
    
    // Performance-optimized reporters
    reporters: isCI || isPerformanceMode
      ? ['basic', 'json']
      : ['default', 'json'],
    
    // Test result output
    outputFile: {
      json: './test-results/results.json',
      junit: isCI ? './test-results/results.xml' : undefined
    },
    
    // Optimize logging for performance
    printConsoleTrace: !isCI && !isPerformanceMode,
    logHeapUsage: !isCI && !isPerformanceMode,
    
    // Fail fast in CI for performance
    bail: isCI ? 1 : 0,
    
    // Performance-optimized environment options
    environmentOptions: {
      jsdom: {
        resources: isCI || isPerformanceMode ? 'usable' : 'preferFast',
        runScripts: 'dangerously',
        pretendToBeVisual: false,
        // Optimize DOM operations
        url: 'http://localhost:3000',
        referrer: 'http://localhost:3000',
        contentType: 'text/html',
        storageQuota: 10000000 // 10MB limit for performance
      }
    },
    
    // Use modern optimizer configuration instead of deprecated deps
    // deps.inline and deps.external are deprecated
    
    // Performance-focused test execution sequence
    sequence: {
      shuffle: false, // Disable shuffling for consistent performance
      concurrent: true, // Enable concurrent execution
      setupFiles: 'parallel' // Run setup files in parallel
    },
    
    // Optimized test file discovery
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      // Conditionally exclude slow tests in performance mode
      ...(isPerformanceMode ? [
        '**/integration/**',
        '**/e2e/**',
        '**/*.integration.test.*',
        '**/*.e2e.test.*'
      ] : [])
    ],
    
    // Performance monitoring
    benchmark: {
      include: ['**/*.bench.{js,ts,tsx}'],
      exclude: ['node_modules/**/*'],
      reporters: isCI ? ['json'] : ['default', 'json']
    }
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  
  // Optimize build performance
  esbuild: {
    target: 'node14',
    minify: false,
    sourcemap: !isCI && !isPerformanceMode,
    // Optimize for faster builds
    treeShaking: true,
    platform: 'node'
  },
  
  // Performance-focused define
  define: {
    __TEST_PERFORMANCE_MODE__: isPerformanceMode,
    __CI_MODE__: isCI,
    __OPTIMAL_THREADS__: optimalThreads
  },
  
  // Optimize server options for test execution
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  },
  
  // Use Vite's cacheDir for better performance
  cacheDir: './.test-cache/vite'
});