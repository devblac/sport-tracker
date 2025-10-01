#!/usr/bin/env node

/**
 * Deployment script for Sport Tracker PWA
 * Handles staging and production deployments with health checks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const deployConfig = require('../deploy.config.js');

const ENVIRONMENT = process.argv[2] || 'staging';
const config = deployConfig[ENVIRONMENT];

if (!config) {
  console.error(`❌ Unknown environment: ${ENVIRONMENT}`);
  console.log('Available environments:', Object.keys(deployConfig).join(', '));
  process.exit(1);
}

console.log(`🚀 Starting deployment to ${config.name}...`);
console.log(`📍 URL: ${config.url}`);
console.log(`🌿 Branch: ${config.branch}`);

async function deploy() {
  try {
    // Step 1: Pre-deployment checks
    if (config.preDeployChecks) {
      console.log('\n📋 Running pre-deployment checks...');
      for (const check of config.preDeployChecks) {
        console.log(`   Running: ${check}`);
        execSync(check, { stdio: 'inherit' });
      }
      console.log('✅ Pre-deployment checks passed');
    }

    // Step 2: Load environment variables
    if (config.environmentFile && fs.existsSync(config.environmentFile)) {
      console.log(`\n🔧 Loading environment from ${config.environmentFile}`);
      const envContent = fs.readFileSync(config.environmentFile, 'utf8');
      const envVars = envContent
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .reduce((acc, line) => {
          const [key, value] = line.split('=');
          if (key && value) {
            acc[key.trim()] = value.trim();
          }
          return acc;
        }, {});
      
      // Set build-time variables
      envVars.VITE_BUILD_TIME = new Date().toISOString();
      envVars.VITE_APP_VERSION = getVersion();
      
      Object.assign(process.env, envVars);
    }

    // Step 3: Build application
    console.log('\n🔨 Building application...');
    execSync(config.buildCommand, { stdio: 'inherit' });
    console.log('✅ Build completed');

    // Step 4: Deploy (this would be replaced with actual deployment logic)
    console.log('\n📤 Deploying to server...');
    await simulateDeployment();
    console.log('✅ Deployment completed');

    // Step 5: Post-deployment checks
    if (config.postDeployChecks) {
      console.log('\n🔍 Running post-deployment checks...');
      for (const check of config.postDeployChecks) {
        console.log(`   Running: ${check}`);
        if (check === 'health-check') {
          await healthCheck(config.url + config.healthCheck);
        } else if (check === 'smoke-tests') {
          await runSmokeTests();
        } else {
          execSync(check, { stdio: 'inherit' });
        }
      }
      console.log('✅ Post-deployment checks passed');
    }

    // Step 6: Send notifications
    if (config.notifications) {
      console.log('\n📢 Sending notifications...');
      await sendNotifications(config, 'success');
    }

    console.log(`\n🎉 Deployment to ${config.name} completed successfully!`);
    console.log(`🌐 Application is available at: ${config.url}`);

  } catch (error) {
    console.error(`\n❌ Deployment failed:`, error.message);
    
    // Send failure notifications
    if (config.notifications) {
      await sendNotifications(config, 'failure', error.message);
    }
    
    process.exit(1);
  }
}

async function simulateDeployment() {
  // This would be replaced with actual deployment logic
  // e.g., uploading to S3, deploying to Vercel, etc.
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('   Files uploaded to server');
      console.log('   CDN cache invalidated');
      console.log('   Service worker updated');
      resolve();
    }, 2000);
  });
}

async function healthCheck(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      console.log('   ✅ Health check passed');
    } else {
      throw new Error(`Health check failed: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Health check failed: ${error.message}`);
  }
}

async function runSmokeTests() {
  try {
    console.log('   Running basic smoke tests...');
    // This would run a subset of E2E tests
    execSync('npm run test:e2e -- --grep="smoke"', { stdio: 'pipe' });
    console.log('   ✅ Smoke tests passed');
  } catch (error) {
    throw new Error(`Smoke tests failed: ${error.message}`);
  }
}

async function sendNotifications(config, status, error = null) {
  const { notifications } = config;
  
  if (notifications.slack) {
    await sendSlackNotification(notifications.slack, status, error);
  }
  
  if (notifications.email) {
    await sendEmailNotification(notifications.email, status, error);
  }
}

async function sendSlackNotification(slackConfig, status, error) {
  if (!slackConfig.webhook) return;
  
  const emoji = status === 'success' ? '✅' : '❌';
  const color = status === 'success' ? 'good' : 'danger';
  
  const message = {
    channel: slackConfig.channel,
    attachments: [{
      color,
      title: `${emoji} Deployment ${status}`,
      fields: [
        {
          title: 'Environment',
          value: config.name,
          short: true
        },
        {
          title: 'Branch',
          value: config.branch,
          short: true
        },
        {
          title: 'URL',
          value: config.url,
          short: false
        }
      ],
      footer: 'Sport Tracker Deployment',
      ts: Math.floor(Date.now() / 1000)
    }]
  };
  
  if (error) {
    message.attachments[0].fields.push({
      title: 'Error',
      value: error,
      short: false
    });
  }
  
  try {
    const response = await fetch(slackConfig.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (response.ok) {
      console.log('   📱 Slack notification sent');
    }
  } catch (err) {
    console.warn('   ⚠️ Failed to send Slack notification:', err.message);
  }
}

async function sendEmailNotification(emailConfig, status, error) {
  // This would integrate with an email service
  console.log(`   📧 Email notification would be sent to: ${emailConfig.recipients.join(', ')}`);
}

function getVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    return 'unknown';
  }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run deployment
deploy();