#!/usr/bin/env node

/**
 * Build Validation Script
 * 
 * This script validates that the production build is ready for deployment.
 * It checks:
 * - TypeScript compilation
 * - Linting
 * - Tests
 * - Environment variables
 * - Build configuration
 * - Asset files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - Missing: ${filePath}`, 'red');
    return false;
  }
}

function runCommand(command, description) {
  try {
    log(`Running: ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    log(`✓ ${description} passed`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${description} failed`, 'red');
    return false;
  }
}

function checkEnvFile(envFile) {
  const envPath = path.join(__dirname, '..', envFile);
  if (!fs.existsSync(envPath)) {
    log(`✗ ${envFile} not found`, 'red');
    return false;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const hasUrl = content.includes('EXPO_PUBLIC_SUPABASE_URL=');
  const hasKey = content.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY=');
  
  if (!hasUrl || !hasKey) {
    log(`✗ ${envFile} missing required variables`, 'red');
    return false;
  }

  // Check for placeholder values
  if (content.includes('your-project.supabase.co') || content.includes('your-anon-key-here')) {
    log(`⚠ ${envFile} contains placeholder values`, 'yellow');
    return false;
  }

  log(`✓ ${envFile} configured`, 'green');
  return true;
}

async function main() {
  log('\n🚀 LiftFire Build Validation\n', 'cyan');
  
  let allPassed = true;

  // 1. Check required files
  logSection('1. Checking Required Files');
  allPassed &= checkFile('app.json', 'app.json');
  allPassed &= checkFile('eas.json', 'eas.json');
  allPassed &= checkFile('package.json', 'package.json');
  allPassed &= checkFile('tsconfig.json', 'tsconfig.json');
  allPassed &= checkFile('.env.example', '.env.example');

  // 2. Check assets
  logSection('2. Checking Assets');
  allPassed &= checkFile('assets/icon.png', 'App icon');
  allPassed &= checkFile('assets/adaptive-icon.png', 'Adaptive icon');
  allPassed &= checkFile('assets/splash-icon.png', 'Splash screen');
  allPassed &= checkFile('assets/favicon.png', 'Favicon');

  // 3. Check environment configuration
  logSection('3. Checking Environment Configuration');
  const hasDevEnv = checkEnvFile('.env');
  if (!hasDevEnv) {
    log('⚠ Development .env not configured (copy from .env.example)', 'yellow');
  }
  
  log('\nNote: Production environment should use EAS Secrets', 'blue');
  log('Run: eas secret:create --scope project --name KEY --value "value"', 'blue');

  // 4. TypeScript validation
  logSection('4. TypeScript Validation');
  allPassed &= runCommand('npm run type-check', 'TypeScript compilation');

  // 5. Linting
  logSection('5. Code Linting');
  allPassed &= runCommand('npm run lint', 'ESLint');

  // 6. Tests
  logSection('6. Running Tests');
  allPassed &= runCommand('npm test -- --passWithNoTests', 'Jest tests');

  // 7. Check app.json configuration
  logSection('7. Checking app.json Configuration');
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  if (appJson.expo.version) {
    log(`✓ Version: ${appJson.expo.version}`, 'green');
  } else {
    log('✗ Version not set in app.json', 'red');
    allPassed = false;
  }

  if (appJson.expo.android?.package) {
    log(`✓ Android package: ${appJson.expo.android.package}`, 'green');
  } else {
    log('✗ Android package not set', 'red');
    allPassed = false;
  }

  if (appJson.expo.ios?.bundleIdentifier) {
    log(`✓ iOS bundle ID: ${appJson.expo.ios.bundleIdentifier}`, 'green');
  } else {
    log('✗ iOS bundle identifier not set', 'red');
    allPassed = false;
  }

  // 8. Check for common issues
  logSection('8. Checking for Common Issues');
  
  // Check for console.log statements
  try {
    const result = execSync('grep -r "console.log" app/ lib/ hooks/ components/ --include="*.ts" --include="*.tsx" || true', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    if (result.trim()) {
      log('⚠ Found console.log statements (consider removing for production)', 'yellow');
      console.log(result);
    } else {
      log('✓ No console.log statements found', 'green');
    }
  } catch (error) {
    // Ignore grep errors
  }

  // Check for TODO comments
  try {
    const result = execSync('grep -r "TODO\\|FIXME" app/ lib/ hooks/ components/ --include="*.ts" --include="*.tsx" || true', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    if (result.trim()) {
      log('⚠ Found TODO/FIXME comments', 'yellow');
      console.log(result);
    } else {
      log('✓ No TODO/FIXME comments found', 'green');
    }
  } catch (error) {
    // Ignore grep errors
  }

  // Final summary
  logSection('Summary');
  
  if (allPassed) {
    log('✓ All validation checks passed!', 'green');
    log('\nReady to build:', 'cyan');
    log('  Web:     npm run build:web', 'blue');
    log('  Android: npm run build:android:production', 'blue');
    log('  iOS:     npm run build:ios:production', 'blue');
    process.exit(0);
  } else {
    log('✗ Some validation checks failed', 'red');
    log('\nPlease fix the issues above before building for production.', 'yellow');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n✗ Validation script error: ${error.message}`, 'red');
  process.exit(1);
});
