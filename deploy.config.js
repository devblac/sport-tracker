/**
 * Deployment configuration for different environments
 */

const deployConfig = {
  staging: {
    name: 'staging',
    url: 'https://staging.sporttracker.app',
    branch: 'develop',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    environmentFile: '.env.staging',
    healthCheck: '/health',
    rollback: {
      enabled: true,
      keepVersions: 5
    },
    notifications: {
      slack: {
        webhook: process.env.SLACK_WEBHOOK_STAGING,
        channel: '#deployments-staging'
      }
    }
  },
  
  production: {
    name: 'production',
    url: 'https://sporttracker.app',
    branch: 'main',
    buildCommand: 'npm run build:production',
    outputDir: 'dist',
    environmentFile: '.env.production',
    healthCheck: '/health',
    rollback: {
      enabled: true,
      keepVersions: 10
    },
    preDeployChecks: [
      'npm run test:all',
      'npm run lighthouse:ci',
      'npm run security-check'
    ],
    postDeployChecks: [
      'health-check',
      'smoke-tests'
    ],
    notifications: {
      slack: {
        webhook: process.env.SLACK_WEBHOOK_PRODUCTION,
        channel: '#deployments'
      },
      email: {
        recipients: ['admin@sporttracker.app'],
        subject: 'Production Deployment'
      }
    }
  }
};

module.exports = deployConfig;