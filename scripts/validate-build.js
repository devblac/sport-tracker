#!/usr/bin/env node

/**
 * Build Validation Script for Sport Tracker Mobile App
 * Validates the built APK/AAB for common issues before deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
    minFileSize: 5 * 1024 * 1024, // 5MB minimum
    maxFileSize: 100 * 1024 * 1024, // 100MB maximum
    requiredFiles: [
        'android/app/build/outputs/apk/release/app-release.apk',
        'android/app/build/outputs/bundle/release/app-release.aab'
    ],
    requiredAssets: [
        'android/app/src/main/res/mipmap-hdpi/ic_launcher.png',
        'android/app/src/main/res/mipmap-mdpi/ic_launcher.png',
        'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png',
        'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png',
        'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png'
    ]
};

// Utility functions
function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',    // Cyan
        success: '\x1b[32m', // Green
        warning: '\x1b[33m', // Yellow
        error: '\x1b[31m',   // Red
        reset: '\x1b[0m'     // Reset
    };
    
    const prefix = {
        info: 'ℹ',
        success: '✓',
        warning: '⚠',
        error: '✗'
    };
    
    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
}

function fileExists(filePath) {
    return fs.existsSync(filePath);
}

function getFileSize(filePath) {
    if (!fileExists(filePath)) return 0;
    return fs.statSync(filePath).size;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validation functions
function validateBuildFiles() {
    log('Validating build files...', 'info');
    
    let hasValidBuild = false;
    
    for (const filePath of CONFIG.requiredFiles) {
        if (fileExists(filePath)) {
            const size = getFileSize(filePath);
            log(`Found: ${filePath} (${formatBytes(size)})`, 'success');
            
            // Validate file size
            if (size < CONFIG.minFileSize) {
                log(`Warning: ${filePath} is smaller than expected (${formatBytes(CONFIG.minFileSize)})`, 'warning');
            } else if (size > CONFIG.maxFileSize) {
                log(`Warning: ${filePath} is larger than expected (${formatBytes(CONFIG.maxFileSize)})`, 'warning');
            } else {
                hasValidBuild = true;
            }
        }
    }
    
    if (!hasValidBuild) {
        log('No valid build files found', 'error');
        return false;
    }
    
    return true;
}

function validateAssets() {
    log('Validating app assets...', 'info');
    
    let missingAssets = 0;
    
    for (const assetPath of CONFIG.requiredAssets) {
        if (fileExists(assetPath)) {
            log(`Found: ${path.basename(assetPath)}`, 'success');
        } else {
            log(`Missing: ${assetPath}`, 'warning');
            missingAssets++;
        }
    }
    
    if (missingAssets > 0) {
        log(`${missingAssets} assets are missing`, 'warning');
    }
    
    return missingAssets === 0;
}

function validateManifest() {
    log('Validating Android manifest...', 'info');
    
    const manifestPath = 'android/app/src/main/AndroidManifest.xml';
    
    if (!fileExists(manifestPath)) {
        log('AndroidManifest.xml not found', 'error');
        return false;
    }
    
    try {
        const manifest = fs.readFileSync(manifestPath, 'utf8');
        
        // Check for required permissions
        const requiredPermissions = [
            'android.permission.INTERNET',
            'android.permission.ACCESS_NETWORK_STATE'
        ];
        
        for (const permission of requiredPermissions) {
            if (manifest.includes(permission)) {
                log(`Permission found: ${permission}`, 'success');
            } else {
                log(`Missing permission: ${permission}`, 'warning');
            }
        }
        
        // Check for app name and package
        if (manifest.includes('com.sporttracker.app')) {
            log('Package name verified: com.sporttracker.app', 'success');
        } else {
            log('Package name not found or incorrect', 'error');
            return false;
        }
        
        return true;
    } catch (error) {
        log(`Error reading manifest: ${error.message}`, 'error');
        return false;
    }
}

function validateGradleConfig() {
    log('Validating Gradle configuration...', 'info');
    
    const buildGradlePath = 'android/app/build.gradle';
    
    if (!fileExists(buildGradlePath)) {
        log('build.gradle not found', 'error');
        return false;
    }
    
    try {
        const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
        
        // Check version configuration
        const versionCodeMatch = buildGradle.match(/versionCode\s+(\d+)/);
        const versionNameMatch = buildGradle.match(/versionName\s+"([^"]+)"/);
        
        if (versionCodeMatch) {
            log(`Version code: ${versionCodeMatch[1]}`, 'success');
        } else {
            log('Version code not found', 'error');
            return false;
        }
        
        if (versionNameMatch) {
            log(`Version name: ${versionNameMatch[1]}`, 'success');
        } else {
            log('Version name not found', 'error');
            return false;
        }
        
        // Check SDK versions
        const minSdkMatch = buildGradle.match(/minSdkVersion\s+(\d+)/);
        const targetSdkMatch = buildGradle.match(/targetSdkVersion\s+(\d+)/);
        
        if (minSdkMatch) {
            const minSdk = parseInt(minSdkMatch[1]);
            if (minSdk >= 22) {
                log(`Min SDK version: ${minSdk} ✓`, 'success');
            } else {
                log(`Min SDK version too low: ${minSdk} (should be ≥22)`, 'warning');
            }
        }
        
        if (targetSdkMatch) {
            const targetSdk = parseInt(targetSdkMatch[1]);
            if (targetSdk >= 33) {
                log(`Target SDK version: ${targetSdk} ✓`, 'success');
            } else {
                log(`Target SDK version: ${targetSdk} (consider updating)`, 'warning');
            }
        }
        
        return true;
    } catch (error) {
        log(`Error reading build.gradle: ${error.message}`, 'error');
        return false;
    }
}

function validateCapacitorConfig() {
    log('Validating Capacitor configuration...', 'info');
    
    const configPath = 'capacitor.config.ts';
    
    if (!fileExists(configPath)) {
        log('capacitor.config.ts not found', 'error');
        return false;
    }
    
    try {
        const config = fs.readFileSync(configPath, 'utf8');
        
        // Check app ID
        if (config.includes('com.sporttracker.app')) {
            log('App ID verified: com.sporttracker.app', 'success');
        } else {
            log('App ID not found or incorrect', 'error');
            return false;
        }
        
        // Check webDir
        if (config.includes("webDir: 'dist'")) {
            log('Web directory configured: dist', 'success');
        } else {
            log('Web directory configuration not found', 'warning');
        }
        
        return true;
    } catch (error) {
        log(`Error reading Capacitor config: ${error.message}`, 'error');
        return false;
    }
}

function validatePWABuild() {
    log('Validating PWA build...', 'info');
    
    const distPath = 'dist';
    
    if (!fileExists(distPath)) {
        log('dist directory not found', 'error');
        return false;
    }
    
    // Check for essential files
    const essentialFiles = [
        'dist/index.html',
        'dist/manifest.json',
        'dist/sw.js'
    ];
    
    let allFilesExist = true;
    
    for (const file of essentialFiles) {
        if (fileExists(file)) {
            log(`Found: ${path.basename(file)}`, 'success');
        } else {
            log(`Missing: ${file}`, 'error');
            allFilesExist = false;
        }
    }
    
    // Check bundle size
    try {
        const stats = execSync('du -sh dist', { encoding: 'utf8' });
        const size = stats.split('\t')[0];
        log(`PWA bundle size: ${size}`, 'info');
    } catch (error) {
        log('Could not determine bundle size', 'warning');
    }
    
    return allFilesExist;
}

function validateEnvironmentConfig() {
    log('Validating environment configuration...', 'info');
    
    // Check for production environment variables
    const envFiles = ['.env.production', '.env.local'];
    let hasEnvConfig = false;
    
    for (const envFile of envFiles) {
        if (fileExists(envFile)) {
            log(`Found environment file: ${envFile}`, 'success');
            hasEnvConfig = true;
            
            try {
                const envContent = fs.readFileSync(envFile, 'utf8');
                
                // Check for required environment variables
                const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
                
                for (const varName of requiredVars) {
                    if (envContent.includes(varName)) {
                        log(`Environment variable configured: ${varName}`, 'success');
                    } else {
                        log(`Missing environment variable: ${varName}`, 'warning');
                    }
                }
            } catch (error) {
                log(`Error reading ${envFile}: ${error.message}`, 'warning');
            }
        }
    }
    
    if (!hasEnvConfig) {
        log('No environment configuration files found', 'warning');
    }
    
    return true; // Non-blocking
}

function runSecurityChecks() {
    log('Running security checks...', 'info');
    
    try {
        // Check for npm audit issues
        log('Running npm audit...', 'info');
        const auditResult = execSync('npm audit --audit-level moderate', { encoding: 'utf8' });
        
        if (auditResult.includes('found 0 vulnerabilities')) {
            log('No security vulnerabilities found', 'success');
        } else {
            log('Security vulnerabilities detected - review npm audit output', 'warning');
        }
    } catch (error) {
        if (error.status === 1) {
            log('Security vulnerabilities found - check npm audit', 'warning');
        } else {
            log('Could not run security audit', 'warning');
        }
    }
    
    // Check for sensitive files that shouldn't be in build
    const sensitivePatterns = [
        'android/keystore.properties',
        'android/app/google-services.json',
        '.env.local'
    ];
    
    for (const pattern of sensitivePatterns) {
        if (fileExists(pattern)) {
            log(`Sensitive file found (ensure it's not in version control): ${pattern}`, 'warning');
        }
    }
    
    return true;
}

// Main validation function
async function validateBuild() {
    log('=== Sport Tracker Build Validation ===', 'info');
    log('', 'info');
    
    const validations = [
        { name: 'Build Files', fn: validateBuildFiles, critical: true },
        { name: 'App Assets', fn: validateAssets, critical: false },
        { name: 'Android Manifest', fn: validateManifest, critical: true },
        { name: 'Gradle Configuration', fn: validateGradleConfig, critical: true },
        { name: 'Capacitor Configuration', fn: validateCapacitorConfig, critical: true },
        { name: 'PWA Build', fn: validatePWABuild, critical: true },
        { name: 'Environment Configuration', fn: validateEnvironmentConfig, critical: false },
        { name: 'Security Checks', fn: runSecurityChecks, critical: false }
    ];
    
    let criticalFailures = 0;
    let warnings = 0;
    
    for (const validation of validations) {
        try {
            const result = validation.fn();
            if (!result) {
                if (validation.critical) {
                    criticalFailures++;
                } else {
                    warnings++;
                }
            }
        } catch (error) {
            log(`Error in ${validation.name}: ${error.message}`, 'error');
            if (validation.critical) {
                criticalFailures++;
            } else {
                warnings++;
            }
        }
        
        log('', 'info'); // Empty line for readability
    }
    
    // Summary
    log('=== Validation Summary ===', 'info');
    
    if (criticalFailures === 0) {
        log('✓ All critical validations passed', 'success');
        
        if (warnings === 0) {
            log('✓ No warnings found', 'success');
            log('Build is ready for deployment!', 'success');
        } else {
            log(`⚠ ${warnings} warning(s) found - review before deployment`, 'warning');
            log('Build can proceed but address warnings when possible', 'warning');
        }
        
        process.exit(0);
    } else {
        log(`✗ ${criticalFailures} critical failure(s) found`, 'error');
        log('Build validation failed - fix issues before deployment', 'error');
        process.exit(1);
    }
}

// Run validation if called directly
if (require.main === module) {
    validateBuild().catch(error => {
        log(`Validation script error: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = {
    validateBuild,
    validateBuildFiles,
    validateAssets,
    validateManifest,
    validateGradleConfig,
    validateCapacitorConfig,
    validatePWABuild,
    validateEnvironmentConfig,
    runSecurityChecks
};