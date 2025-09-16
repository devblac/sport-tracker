#!/usr/bin/env node

/**
 * Google Play Store Requirements Validation Script
 * Validates that the app meets all Google Play Store requirements
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PlayStoreValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    switch (type) {
      case 'error':
        this.errors.push(message);
        console.error(`❌ ${message}`);
        break;
      case 'warning':
        this.warnings.push(message);
        console.warn(`⚠️  ${message}`);
        break;
      case 'success':
        console.log(`✅ ${message}`);
        break;
      default:
        this.info.push(message);
        console.log(`ℹ️  ${message}`);
    }
  }

  validateFileExists(filePath, description) {
    if (fs.existsSync(filePath)) {
      this.log(`${description} exists: ${filePath}`, 'success');
      return true;
    } else {
      this.log(`${description} missing: ${filePath}`, 'error');
      return false;
    }
  }

  validateProjectStructure() {
    this.log('Validating project structure...');
    
    const requiredFiles = [
      { path: 'package.json', desc: 'Package configuration' },
      { path: 'android/app/build.gradle', desc: 'Android build configuration' },
      { path: 'android/app/src/main/AndroidManifest.xml', desc: 'Android manifest' },
      { path: 'capacitor.config.ts', desc: 'Capacitor configuration' }
    ];

    let allExist = true;
    for (const file of requiredFiles) {
      if (!this.validateFileExists(file.path, file.desc)) {
        allExist = false;
      }
    }

    return allExist;
  }

  validateAppConfiguration() {
    this.log('Validating app configuration...');
    
    try {
      // Check build.gradle
      const buildGradle = fs.readFileSync('android/app/build.gradle', 'utf8');
      
      // Version code
      const versionCodeMatch = buildGradle.match(/versionCode\s+(\d+)/);
      if (versionCodeMatch) {
        const versionCode = parseInt(versionCodeMatch[1]);
        if (versionCode >= 1) {
          this.log(`Version code: ${versionCode}`, 'success');
        } else {
          this.log('Version code must be >= 1', 'error');
        }
      } else {
        this.log('Version code not found in build.gradle', 'error');
      }

      // Version name
      const versionNameMatch = buildGradle.match(/versionName\s+"([^"]+)"/);
      if (versionNameMatch) {
        this.log(`Version name: ${versionNameMatch[1]}`, 'success');
      } else {
        this.log('Version name not found in build.gradle', 'error');
      }

      // Target SDK version
      const targetSdkMatch = buildGradle.match(/targetSdkVersion\s+(\d+)/);
      if (targetSdkMatch) {
        const targetSdk = parseInt(targetSdkMatch[1]);
        if (targetSdk >= 33) {
          this.log(`Target SDK version: ${targetSdk}`, 'success');
        } else {
          this.log(`Target SDK version should be 33+ for new apps (current: ${targetSdk})`, 'warning');
        }
      }

      // Application ID
      const appIdMatch = buildGradle.match(/applicationId\s+"([^"]+)"/);
      if (appIdMatch) {
        const appId = appIdMatch[1];
        if (appId.includes('.') && appId.length > 10) {
          this.log(`Application ID: ${appId}`, 'success');
        } else {
          this.log(`Application ID should follow reverse domain format: ${appId}`, 'warning');
        }
      }

    } catch (error) {
      this.log(`Error reading build.gradle: ${error.message}`, 'error');
    }
  }

  validateAppIcons() {
    this.log('Validating app icons...');
    
    const requiredIcons = [
      'android/app/src/main/res/mipmap-mdpi/ic_launcher.png',
      'android/app/src/main/res/mipmap-hdpi/ic_launcher.png',
      'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png',
      'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png',
      'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png'
    ];

    const expectedSizes = {
      'mipmap-mdpi': 48,
      'mipmap-hdpi': 72,
      'mipmap-xhdpi': 96,
      'mipmap-xxhdpi': 144,
      'mipmap-xxxhdpi': 192
    };

    let allIconsValid = true;
    for (const iconPath of requiredIcons) {
      if (fs.existsSync(iconPath)) {
        this.log(`Icon exists: ${iconPath}`, 'success');
        
        // Check if we can get image dimensions (requires imagemagick or similar)
        try {
          const density = iconPath.match(/mipmap-([^/]+)/)[1];
          const expectedSize = expectedSizes[`mipmap-${density}`];
          if (expectedSize) {
            this.log(`Expected size for ${density}: ${expectedSize}x${expectedSize}px`);
          }
        } catch (error) {
          // Image size validation would require additional dependencies
        }
      } else {
        this.log(`Missing required icon: ${iconPath}`, 'error');
        allIconsValid = false;
      }
    }

    // Check for adaptive icons
    const adaptiveIcons = [
      'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
      'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml'
    ];

    for (const adaptiveIcon of adaptiveIcons) {
      if (fs.existsSync(adaptiveIcon)) {
        this.log(`Adaptive icon exists: ${adaptiveIcon}`, 'success');
      } else {
        this.log(`Adaptive icon missing: ${adaptiveIcon}`, 'warning');
      }
    }

    return allIconsValid;
  }

  validateAppStrings() {
    this.log('Validating app strings...');
    
    try {
      const stringsXml = fs.readFileSync('android/app/src/main/res/values/strings.xml', 'utf8');
      
      // App name
      const appNameMatch = stringsXml.match(/<string name="app_name">([^<]+)<\/string>/);
      if (appNameMatch) {
        const appName = appNameMatch[1];
        if (appName.length > 0 && appName.length <= 50) {
          this.log(`App name: "${appName}"`, 'success');
        } else {
          this.log(`App name length should be 1-50 characters: "${appName}"`, 'warning');
        }
      } else {
        this.log('App name not found in strings.xml', 'error');
      }

      // App description
      const appDescMatch = stringsXml.match(/<string name="app_description">([^<]+)<\/string>/);
      if (appDescMatch) {
        const appDesc = appDescMatch[1];
        if (appDesc.length > 10) {
          this.log(`App description: "${appDesc.substring(0, 50)}..."`, 'success');
        } else {
          this.log('App description is too short', 'warning');
        }
      } else {
        this.log('App description not found in strings.xml', 'error');
      }

      // Check Spanish strings
      if (fs.existsSync('android/app/src/main/res/values-es/strings.xml')) {
        this.log('Spanish localization found', 'success');
      } else {
        this.log('Spanish localization missing', 'warning');
      }

    } catch (error) {
      this.log(`Error reading strings.xml: ${error.message}`, 'error');
    }
  }

  validatePermissions() {
    this.log('Validating permissions...');
    
    try {
      const manifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
      
      // Check for dangerous permissions
      const dangerousPermissions = [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.RECORD_AUDIO'
      ];

      const declaredPermissions = [];
      const permissionMatches = manifest.match(/<uses-permission[^>]+android:name="([^"]+)"/g);
      
      if (permissionMatches) {
        for (const match of permissionMatches) {
          const permMatch = match.match(/android:name="([^"]+)"/);
          if (permMatch) {
            declaredPermissions.push(permMatch[1]);
          }
        }
      }

      this.log(`Declared permissions: ${declaredPermissions.length}`);
      
      for (const permission of declaredPermissions) {
        if (dangerousPermissions.includes(permission)) {
          this.log(`Dangerous permission declared: ${permission}`, 'warning');
        } else {
          this.log(`Permission: ${permission}`);
        }
      }

      // Check for internet permission (required for most apps)
      if (declaredPermissions.includes('android.permission.INTERNET')) {
        this.log('Internet permission declared', 'success');
      } else {
        this.log('Internet permission not declared', 'warning');
      }

    } catch (error) {
      this.log(`Error reading AndroidManifest.xml: ${error.message}`, 'error');
    }
  }

  validateSigningConfiguration() {
    this.log('Validating signing configuration...');
    
    // Check for keystore
    const keystorePaths = [
      'android/app/sport-tracker-release.keystore',
      'android/app/release.keystore',
      'android/app/keystore.jks'
    ];

    let keystoreFound = false;
    for (const keystorePath of keystorePaths) {
      if (fs.existsSync(keystorePath)) {
        this.log(`Keystore found: ${keystorePath}`, 'success');
        keystoreFound = true;
        break;
      }
    }

    if (!keystoreFound) {
      this.log('No release keystore found. Run generate-keystore script first.', 'error');
    }

    // Check for keystore properties
    if (fs.existsSync('android/keystore.properties')) {
      this.log('Keystore properties file found', 'success');
    } else if (fs.existsSync('android/keystore.properties.example')) {
      this.log('Only example keystore properties found. Create actual keystore.properties.', 'warning');
    } else {
      this.log('Keystore properties not configured', 'warning');
    }
  }

  validateBuildConfiguration() {
    this.log('Validating build configuration...');
    
    try {
      const buildGradle = fs.readFileSync('android/app/build.gradle', 'utf8');
      
      // Check for release build type
      if (buildGradle.includes('buildTypes') && buildGradle.includes('release')) {
        this.log('Release build type configured', 'success');
        
        // Check for minification
        if (buildGradle.includes('minifyEnabled true')) {
          this.log('Code minification enabled', 'success');
        } else {
          this.log('Code minification not enabled', 'warning');
        }

        // Check for resource shrinking
        if (buildGradle.includes('shrinkResources true')) {
          this.log('Resource shrinking enabled', 'success');
        } else {
          this.log('Resource shrinking not enabled', 'warning');
        }

        // Check for ProGuard
        if (buildGradle.includes('proguardFiles')) {
          this.log('ProGuard configuration found', 'success');
        } else {
          this.log('ProGuard not configured', 'warning');
        }
      } else {
        this.log('Release build type not properly configured', 'error');
      }

    } catch (error) {
      this.log(`Error reading build.gradle: ${error.message}`, 'error');
    }
  }

  validateCapacitorConfiguration() {
    this.log('Validating Capacitor configuration...');
    
    try {
      const capacitorConfig = fs.readFileSync('capacitor.config.ts', 'utf8');
      
      // Check app ID
      const appIdMatch = capacitorConfig.match(/appId:\s*['"]([^'"]+)['"]/);
      if (appIdMatch) {
        this.log(`Capacitor app ID: ${appIdMatch[1]}`, 'success');
      } else {
        this.log('Capacitor app ID not found', 'error');
      }

      // Check app name
      const appNameMatch = capacitorConfig.match(/appName:\s*['"]([^'"]+)['"]/);
      if (appNameMatch) {
        this.log(`Capacitor app name: ${appNameMatch[1]}`, 'success');
      } else {
        this.log('Capacitor app name not found', 'error');
      }

      // Check webDir
      const webDirMatch = capacitorConfig.match(/webDir:\s*['"]([^'"]+)['"]/);
      if (webDirMatch) {
        const webDir = webDirMatch[1];
        if (fs.existsSync(webDir) || webDir === 'dist') {
          this.log(`Capacitor webDir: ${webDir}`, 'success');
        } else {
          this.log(`Capacitor webDir not found: ${webDir}`, 'warning');
        }
      }

    } catch (error) {
      this.log(`Error reading capacitor.config.ts: ${error.message}`, 'error');
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        info: this.info.length
      },
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
      status: this.errors.length === 0 ? 'READY' : 'NEEDS_FIXES'
    };

    // Write report to file
    const reportPath = 'play-store-validation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📋 Validation Summary:');
    console.log(`✅ Passed: ${this.info.length} checks`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length === 0) {
      console.log('\n🎉 App is ready for Play Store submission!');
    } else {
      console.log('\n🔧 Fix the errors above before submitting to Play Store.');
    }
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    return report;
  }

  async run() {
    console.log('🔍 Google Play Store Requirements Validation\n');
    
    this.validateProjectStructure();
    this.validateAppConfiguration();
    this.validateAppIcons();
    this.validateAppStrings();
    this.validatePermissions();
    this.validateSigningConfiguration();
    this.validateBuildConfiguration();
    this.validateCapacitorConfiguration();
    
    return this.generateReport();
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new PlayStoreValidator();
  validator.run().then(report => {
    process.exit(report.errors.length > 0 ? 1 : 0);
  }).catch(error => {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  });
}

export default PlayStoreValidator;