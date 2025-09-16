#!/usr/bin/env node

/**
 * Version Bump Script for Sport Tracker Mobile App
 * Automatically updates version numbers across all relevant files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
    packageJsonPath: 'package.json',
    gradlePath: 'android/app/build.gradle',
    capacitorConfigPath: 'capacitor.config.ts',
    changelogPath: 'CHANGELOG.md'
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

function readJsonFile(filePath) {
    if (!fileExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function parseVersion(version) {
    const parts = version.split('.').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
        throw new Error(`Invalid version format: ${version}`);
    }
    return { major: parts[0], minor: parts[1], patch: parts[2] };
}

function formatVersion(major, minor, patch) {
    return `${major}.${minor}.${patch}`;
}

function calculateVersionCode(major, minor, patch) {
    // Version code calculation: MAJOR * 10000 + MINOR * 100 + PATCH
    // This allows for 99 minor versions and 99 patches per major version
    return major * 10000 + minor * 100 + patch;
}

// Version update functions
function updatePackageJson(newVersion) {
    log('Updating package.json...', 'info');
    
    const packageJson = readJsonFile(CONFIG.packageJsonPath);
    const oldVersion = packageJson.version;
    
    packageJson.version = newVersion;
    writeJsonFile(CONFIG.packageJsonPath, packageJson);
    
    log(`Updated package.json: ${oldVersion} → ${newVersion}`, 'success');
    return oldVersion;
}

function updateAndroidGradle(newVersion, newVersionCode) {
    log('Updating Android build.gradle...', 'info');
    
    if (!fileExists(CONFIG.gradlePath)) {
        log(`Warning: ${CONFIG.gradlePath} not found`, 'warning');
        return;
    }
    
    let content = fs.readFileSync(CONFIG.gradlePath, 'utf8');
    
    // Extract current version info
    const versionCodeMatch = content.match(/versionCode\s+(\d+)/);
    const versionNameMatch = content.match(/versionName\s+"([^"]+)"/);
    
    const oldVersionCode = versionCodeMatch ? versionCodeMatch[1] : 'unknown';
    const oldVersionName = versionNameMatch ? versionNameMatch[1] : 'unknown';
    
    // Update version code
    content = content.replace(
        /versionCode\s+\d+/,
        `versionCode ${newVersionCode}`
    );
    
    // Update version name
    content = content.replace(
        /versionName\s+"[^"]+"/,
        `versionName "${newVersion}"`
    );
    
    fs.writeFileSync(CONFIG.gradlePath, content);
    
    log(`Updated build.gradle:`, 'success');
    log(`  Version Code: ${oldVersionCode} → ${newVersionCode}`, 'success');
    log(`  Version Name: ${oldVersionName} → ${newVersion}`, 'success');
}

function updateCapacitorConfig(newVersion) {
    log('Updating Capacitor config...', 'info');
    
    if (!fileExists(CONFIG.capacitorConfigPath)) {
        log(`Warning: ${CONFIG.capacitorConfigPath} not found`, 'warning');
        return;
    }
    
    let content = fs.readFileSync(CONFIG.capacitorConfigPath, 'utf8');
    
    // Check if version field exists
    if (content.includes('version:')) {
        // Update existing version
        content = content.replace(
            /version:\s*['"][^'"]+['"]/,
            `version: '${newVersion}'`
        );
        log(`Updated Capacitor config version: ${newVersion}`, 'success');
    } else {
        // Add version field
        content = content.replace(
            /(const config: CapacitorConfig = {)/,
            `$1\n  version: '${newVersion}',`
        );
        log(`Added version to Capacitor config: ${newVersion}`, 'success');
    }
    
    fs.writeFileSync(CONFIG.capacitorConfigPath, content);
}

function updateChangelog(newVersion, versionType) {
    log('Updating CHANGELOG.md...', 'info');
    
    const changelogPath = CONFIG.changelogPath;
    const today = new Date().toISOString().split('T')[0];
    
    let content = '';
    if (fileExists(changelogPath)) {
        content = fs.readFileSync(changelogPath, 'utf8');
    } else {
        content = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
    }
    
    // Create new version entry
    const newEntry = `## [${newVersion}] - ${today}

### Added
- 

### Changed
- 

### Fixed
- 

### Security
- 

`;
    
    // Insert new entry after the header
    const lines = content.split('\n');
    const insertIndex = lines.findIndex(line => line.startsWith('## [')) || lines.length;
    
    lines.splice(insertIndex, 0, newEntry);
    
    fs.writeFileSync(changelogPath, lines.join('\n'));
    log(`Added new entry to CHANGELOG.md for version ${newVersion}`, 'success');
}

function createGitTag(version, message) {
    log('Creating Git tag...', 'info');
    
    try {
        // Check if we're in a git repository
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        
        // Check if there are uncommitted changes
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.trim()) {
            log('Warning: There are uncommitted changes', 'warning');
            log('Consider committing changes before tagging', 'warning');
        }
        
        // Create tag
        const tagName = `v${version}`;
        execSync(`git tag -a ${tagName} -m "${message}"`, { stdio: 'inherit' });
        
        log(`Created Git tag: ${tagName}`, 'success');
        log('Push tags with: git push origin --tags', 'info');
        
        return tagName;
    } catch (error) {
        log('Could not create Git tag (not in a git repository or git not available)', 'warning');
        return null;
    }
}

function validateVersionBump(currentVersion, newVersion, bumpType) {
    const current = parseVersion(currentVersion);
    const next = parseVersion(newVersion);
    
    let expectedVersion;
    
    switch (bumpType) {
        case 'major':
            expectedVersion = formatVersion(current.major + 1, 0, 0);
            break;
        case 'minor':
            expectedVersion = formatVersion(current.major, current.minor + 1, 0);
            break;
        case 'patch':
            expectedVersion = formatVersion(current.major, current.minor, current.patch + 1);
            break;
        default:
            throw new Error(`Invalid bump type: ${bumpType}`);
    }
    
    if (newVersion !== expectedVersion) {
        throw new Error(`Version mismatch: expected ${expectedVersion}, got ${newVersion}`);
    }
    
    return true;
}

// Main bump function
function bumpVersion(type = 'patch', options = {}) {
    const { 
        dryRun = false, 
        skipGit = false, 
        skipChangelog = false,
        customVersion = null 
    } = options;
    
    log('=== Sport Tracker Version Bump ===', 'info');
    log(`Bump type: ${type}`, 'info');
    
    if (dryRun) {
        log('DRY RUN MODE - No files will be modified', 'warning');
    }
    
    log('', 'info');
    
    try {
        // Read current version
        const packageJson = readJsonFile(CONFIG.packageJsonPath);
        const currentVersion = packageJson.version;
        
        log(`Current version: ${currentVersion}`, 'info');
        
        // Calculate new version
        let newVersion;
        if (customVersion) {
            newVersion = customVersion;
            log(`Custom version specified: ${newVersion}`, 'info');
        } else {
            const { major, minor, patch } = parseVersion(currentVersion);
            
            switch (type) {
                case 'major':
                    newVersion = formatVersion(major + 1, 0, 0);
                    break;
                case 'minor':
                    newVersion = formatVersion(major, minor + 1, 0);
                    break;
                case 'patch':
                    newVersion = formatVersion(major, minor, patch + 1);
                    break;
                default:
                    throw new Error(`Invalid bump type: ${type}. Use 'major', 'minor', or 'patch'`);
            }
        }
        
        // Validate version bump
        if (!customVersion) {
            validateVersionBump(currentVersion, newVersion, type);
        }
        
        // Calculate version code
        const { major, minor, patch } = parseVersion(newVersion);
        const newVersionCode = calculateVersionCode(major, minor, patch);
        
        log(`New version: ${newVersion}`, 'success');
        log(`New version code: ${newVersionCode}`, 'success');
        log('', 'info');
        
        if (dryRun) {
            log('DRY RUN - Would update the following files:', 'info');
            log(`  - ${CONFIG.packageJsonPath}`, 'info');
            log(`  - ${CONFIG.gradlePath}`, 'info');
            log(`  - ${CONFIG.capacitorConfigPath}`, 'info');
            if (!skipChangelog) {
                log(`  - ${CONFIG.changelogPath}`, 'info');
            }
            if (!skipGit) {
                log(`  - Git tag: v${newVersion}`, 'info');
            }
            return { version: newVersion, versionCode: newVersionCode };
        }
        
        // Update files
        updatePackageJson(newVersion);
        updateAndroidGradle(newVersion, newVersionCode);
        updateCapacitorConfig(newVersion);
        
        if (!skipChangelog) {
            updateChangelog(newVersion, type);
        }
        
        log('', 'info');
        
        // Create Git tag
        if (!skipGit) {
            const tagMessage = `Release version ${newVersion}`;
            createGitTag(newVersion, tagMessage);
        }
        
        log('', 'info');
        log('=== Version Bump Complete ===', 'success');
        log(`Version updated: ${currentVersion} → ${newVersion}`, 'success');
        log(`Version code: ${newVersionCode}`, 'success');
        
        if (!skipChangelog) {
            log('', 'info');
            log('Next steps:', 'info');
            log('1. Update CHANGELOG.md with release notes', 'info');
            log('2. Commit changes: git add . && git commit -m "chore: bump version to ' + newVersion + '"', 'info');
            log('3. Push changes: git push origin main --tags', 'info');
            log('4. Build and deploy: npm run build:production', 'info');
        }
        
        return { version: newVersion, versionCode: newVersionCode };
        
    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        process.exit(1);
    }
}

// CLI interface
function main() {
    const args = process.argv.slice(2);
    const type = args[0] || 'patch';
    
    // Parse options
    const options = {
        dryRun: args.includes('--dry-run'),
        skipGit: args.includes('--skip-git'),
        skipChangelog: args.includes('--skip-changelog'),
        customVersion: null
    };
    
    // Check for custom version
    const versionIndex = args.findIndex(arg => arg.startsWith('--version='));
    if (versionIndex !== -1) {
        options.customVersion = args[versionIndex].split('=')[1];
    }
    
    // Show help
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Sport Tracker Version Bump Script

Usage: node version-bump.js [type] [options]

Types:
  major    Increment major version (1.0.0 → 2.0.0)
  minor    Increment minor version (1.0.0 → 1.1.0)
  patch    Increment patch version (1.0.0 → 1.0.1) [default]

Options:
  --version=X.Y.Z    Set custom version instead of incrementing
  --dry-run          Show what would be changed without modifying files
  --skip-git         Don't create Git tag
  --skip-changelog   Don't update CHANGELOG.md
  --help, -h         Show this help message

Examples:
  node version-bump.js patch
  node version-bump.js minor --dry-run
  node version-bump.js --version=2.0.0
  node version-bump.js major --skip-git
        `);
        return;
    }
    
    // Validate type
    if (!['major', 'minor', 'patch'].includes(type) && !options.customVersion) {
        log(`Invalid bump type: ${type}. Use 'major', 'minor', or 'patch'`, 'error');
        process.exit(1);
    }
    
    bumpVersion(type, options);
}

// Export for use as module
module.exports = {
    bumpVersion,
    updatePackageJson,
    updateAndroidGradle,
    updateCapacitorConfig,
    updateChangelog,
    createGitTag,
    parseVersion,
    formatVersion,
    calculateVersionCode
};

// Run if called directly
if (require.main === module) {
    main();
}