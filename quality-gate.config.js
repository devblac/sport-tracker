/**
 * Quality Gate Configuration
 * 
 * This file defines the thresholds and rules for the quality gate system.
 * Modify these values to adjust quality requirements for your project.
 */

export const qualityGateConfig = {
  // Coverage thresholds
  coverage: {
    overall: 90,           // Overall project coverage minimum
    components: 75,        // UI component coverage minimum
    utilities: 85,         // Utility function coverage minimum
    services: 85,          // Service layer coverage minimum
    hooks: 80,            // Custom hooks coverage minimum
    pages: 70,            // Page component coverage minimum
    files: 80,            // Individual file coverage minimum
  },

  // Test reliability thresholds
  reliability: {
    minimum: 99,          // Minimum test reliability percentage
    buildWindow: 50,      // Number of builds to analyze for reliability
    flakyDetectionWindow: 20, // Number of builds to analyze for flaky tests
    flakyThreshold: 0.01, // Maximum allowed flaky test rate (1%)
  },

  // Accessibility thresholds
  accessibility: {
    automatedMinimum: 95, // Minimum automated accessibility score
    wcagLevel: 'AA',      // WCAG compliance level
    manualTestsRequired: true, // Whether manual tests are required
  },

  // Performance thresholds
  performance: {
    componentRenderTime: 100,    // Maximum component render time (ms)
    testExecutionTime: 2000,     // Maximum full test suite time (ms)
    memoryLeakThreshold: 10,     // Maximum memory leak size (MB)
    cacheHitRate: 80,           // Minimum cache hit rate percentage
  },

  // Security requirements
  security: {
    auditLevel: 'moderate',     // npm audit severity level
    vulnerabilityThreshold: 0,  // Maximum allowed vulnerabilities
    requireSecurityTests: true, // Whether security tests are mandatory
  },

  // Alert configuration
  alerts: {
    severityLevels: {
      critical: {
        blockBuild: true,
        notifyTeam: true,
        escalate: true,
      },
      high: {
        blockBuild: true,
        notifyTeam: true,
        escalate: false,
      },
      medium: {
        blockBuild: false,
        notifyTeam: true,
        escalate: false,
      },
      low: {
        blockBuild: false,
        notifyTeam: false,
        escalate: false,
      },
    },
    
    // Notification settings
    notifications: {
      slack: {
        enabled: false,
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: '#quality-alerts',
      },
      email: {
        enabled: false,
        recipients: ['team@example.com'],
      },
    },
  },

  // CI/CD integration settings
  cicd: {
    // GitHub Actions specific settings
    github: {
      blockPullRequests: true,
      requireStatusChecks: true,
      commentOnPR: true,
      uploadArtifacts: true,
    },
    
    // Build timeout settings
    timeouts: {
      totalWorkflow: 20,      // Maximum workflow time (minutes)
      qualityGateCheck: 15,   // Maximum quality gate check time (minutes)
      testExecution: 10,      // Maximum test execution time (minutes)
    },
  },

  // File patterns for different module types
  modulePatterns: {
    components: [
      'src/components/**/*.{ts,tsx}',
      '!src/components/**/*.test.{ts,tsx}',
      '!src/components/**/*.stories.{ts,tsx}',
    ],
    utilities: [
      'src/utils/**/*.{ts,tsx}',
      'src/lib/**/*.{ts,tsx}',
      '!src/utils/**/*.test.{ts,tsx}',
      '!src/lib/**/*.test.{ts,tsx}',
    ],
    services: [
      'src/services/**/*.{ts,tsx}',
      'src/api/**/*.{ts,tsx}',
      '!src/services/**/*.test.{ts,tsx}',
      '!src/api/**/*.test.{ts,tsx}',
    ],
    hooks: [
      'src/hooks/**/*.{ts,tsx}',
      '!src/hooks/**/*.test.{ts,tsx}',
    ],
    pages: [
      'src/pages/**/*.{ts,tsx}',
      '!src/pages/**/*.test.{ts,tsx}',
    ],
  },

  // Exclusion patterns
  exclusions: {
    coverage: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/__tests__/**',
      '**/__mocks__/**',
      '**/test-utils/**',
      'src/vite-env.d.ts',
      'src/main.tsx',
    ],
    reliability: [
      'e2e/**',
      'integration/**',
    ],
  },

  // Reporting configuration
  reporting: {
    formats: ['json', 'html', 'markdown'],
    outputDir: 'quality-reports',
    includeHistoricalData: true,
    generateTrends: true,
    
    // Dashboard settings
    dashboard: {
      enabled: true,
      port: 3001,
      refreshInterval: 30, // seconds
    },
  },

  // Development mode settings
  development: {
    relaxedThresholds: {
      coverage: {
        overall: 80,
        components: 65,
        utilities: 75,
      },
      reliability: {
        minimum: 95,
      },
    },
    skipManualTests: true,
    verboseLogging: true,
  },
};

// Environment-specific overrides
const environment = process.env.NODE_ENV || 'development';

if (environment === 'development') {
  // Apply relaxed thresholds for development
  Object.assign(qualityGateConfig.coverage, qualityGateConfig.development.relaxedThresholds.coverage);
  Object.assign(qualityGateConfig.reliability, qualityGateConfig.development.relaxedThresholds.reliability);
}

export default qualityGateConfig;