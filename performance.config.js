/**
 * Performance Testing Configuration
 * 
 * Central configuration for performance testing framework
 */

module.exports = {
  // Test execution settings
  testPattern: 'src/test/__tests__/performance/**/*.test.{ts,tsx}',
  outputDir: 'test-results/performance',
  
  // Performance thresholds
  thresholds: {
    // Component render time limits (ms)
    renderTime: {
      ui: 10,        // Basic UI components
      workout: 50,   // Workout-related components  
      page: 200,     // Full page components
      data: 120      // Data-heavy components
    },
    
    // Memory usage limits (bytes)
    memoryUsage: {
      ui: 1024 * 20,      // 20KB for UI components
      workout: 1024 * 100, // 100KB for workout components
      page: 1024 * 500,    // 500KB for page components
      data: 1024 * 250     // 250KB for data components
    },
    
    // Cache performance
    cache: {
      minHitRate: 70,      // 70% minimum hit rate
      maxMissRate: 30,     // 30% maximum miss rate
      maxEvictionRate: 5   // 5% maximum eviction rate
    },
    
    // Memory leak detection
    memoryLeak: {
      iterations: 20,              // Test iterations
      maxGrowth: 1024 * 1024,     // 1MB max growth
      growthRate: 0.1             // 10% max growth rate
    }
  },
  
  // Regression detection settings
  regression: {
    baselineFile: 'performance-baselines.json',
    baselineSamples: 10,                    // Samples needed for baseline
    renderTimeThreshold: 1.2,               // 20% degradation threshold
    memoryThreshold: 1.5,                   // 50% memory increase threshold
    
    // Severity thresholds
    severity: {
      critical: {
        renderTime: 3.0,    // 200% degradation
        memory: 3.5,        // 250% degradation
        cache: 30           // 30% hit rate drop
      },
      high: {
        renderTime: 2.0,    // 100% degradation
        memory: 2.0,        // 100% degradation
        cache: 20           // 20% hit rate drop
      },
      medium: {
        renderTime: 1.5,    // 50% degradation
        memory: 1.25,       // 25% degradation
        cache: 10           // 10% hit rate drop
      }
    }
  },
  
  // CI/CD integration settings
  ci: {
    failOnCritical: true,           // Fail build on critical regressions
    failOnHighCount: 3,             // Fail if more than 3 high regressions
    reportFormat: ['json', 'markdown', 'html'],
    
    // GitHub Actions integration
    github: {
      outputFile: process.env.GITHUB_OUTPUT,
      stepSummary: process.env.GITHUB_STEP_SUMMARY
    },
    
    // Notification settings
    notifications: {
      webhook: process.env.PERFORMANCE_WEBHOOK_URL,
      slack: process.env.SLACK_WEBHOOK_URL,
      email: process.env.PERFORMANCE_EMAIL_ALERTS
    }
  },
  
  // Test execution options
  execution: {
    warmupRuns: 3,              // Warmup iterations
    testIterations: 5,          // Test iterations
    memoryLeakDetection: true,  // Enable memory leak detection
    cacheValidation: true,      // Enable cache performance validation
    parallelExecution: false,   // Disable parallel execution for consistent results
    
    // Timeout settings
    testTimeout: 30000,         // 30 second test timeout
    suiteTimeout: 300000        // 5 minute suite timeout
  },
  
  // Component categories for testing
  categories: {
    ui: {
      pattern: 'src/components/ui/**/*.tsx',
      maxRenderTime: 10,
      maxMemoryIncrease: 1024 * 20
    },
    
    workout: {
      pattern: 'src/components/workouts/**/*.tsx',
      maxRenderTime: 50,
      maxMemoryIncrease: 1024 * 100
    },
    
    social: {
      pattern: 'src/components/social/**/*.tsx',
      maxRenderTime: 80,
      maxMemoryIncrease: 1024 * 150,
      minCacheHitRate: 70
    },
    
    gamification: {
      pattern: 'src/components/gamification/**/*.tsx',
      maxRenderTime: 15,
      maxMemoryIncrease: 1024 * 30
    },
    
    pages: {
      pattern: 'src/pages/**/*.tsx',
      maxRenderTime: 200,
      maxMemoryIncrease: 1024 * 500,
      minCacheHitRate: 80
    }
  },
  
  // Reporting configuration
  reporting: {
    includeMetrics: true,
    includeTrends: true,
    includeRegressions: true,
    includeRecommendations: true,
    
    // Chart generation
    charts: {
      renderTime: true,
      memoryUsage: true,
      cachePerformance: true,
      trends: true
    },
    
    // Export formats
    formats: {
      json: true,
      html: true,
      markdown: true,
      csv: false
    }
  },
  
  // Development settings
  development: {
    verbose: process.env.NODE_ENV === 'development',
    debugMode: process.env.PERFORMANCE_DEBUG === 'true',
    mockComponents: true,
    skipSlowTests: false
  }
};