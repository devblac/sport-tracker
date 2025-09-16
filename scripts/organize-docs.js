#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(__dirname);

console.log('📚 Organizing documentation files...');

// Define the organization structure
const docStructure = {
  // Getting Started
  'getting-started': [
    'README.md', // Keep main README in root
    'QUICK_START.md',
    'INSTALLATION.md'
  ],
  
  // Development
  'development': [
    'KIRO_DEVELOPMENT_PROCESS.md',
    'API.md',
    'CONTRIBUTING.md',
    'TESTING.md',
    'ARCHITECTURE.md'
  ],
  
  // Mobile Development
  'mobile': [
    'BUILD_APK_GUIDE.md',
    'APK_DEBUGGING_GUIDE.md',
    'DEBUG_APK_CRASH.md',
    'MOBILE_DEPLOYMENT.md',
    'MOBILE_DEVELOPMENT.md',
    'MOBILE_TROUBLESHOOTING.md',
    'MOBILE_PERFORMANCE_OPTIMIZATION.md',
    'MOBILE_MONITORING.md',
    'MOBILE_VERSIONING.md',
    'CAPACITOR_SETUP.md',
    'mobile-integration-test-report.md'
  ],
  
  // Technical Documentation
  'technical': [
    'SECURITY_GUIDELINES.md',
    'supabase-percentile-cost-analysis.md',
    'MENTORSHIP_SUPABASE_SETUP.md'
  ],
  
  // Deployment
  'deployment': [
    'DEPLOYMENT.md',
    'DEPLOYMENT_CHECKLIST.md',
    'ANDROID_RELEASE_BUILD.md',
    'BUILD_WORKFLOW_SUMMARY.md'
  ],
  
  // Troubleshooting
  'troubleshooting': [
    'BUG_FIXES_SUMMARY.md',
    'bug-fixes-summary.md',
    'comprehensive-import-fixes.md',
    'fix-all-imports.md',
    'fix-imports.md',
    'module-resolution-fix.md',
    'DUPLICATE_EXPORT_FIX.md',
    'FINAL_GET_DIAGNOSTICS_FIX.md',
    'FINAL_SQL_FIXES.md',
    'SQL_FIXES_SUMMARY.md',
    'QUICK_FIX_VERIFICATION.md',
    'REACT_CONTEXT_FIX.md',
    'ROUTER_CONTEXT_FIX.md',
    'SOCIAL_PAGE_FIX.md',
    'PROGRESS_PAGE_FIX.md',
    'PROGRESS_PAGE_FIXES.md',
    'STREAK_ERROR_FIX.md',
    'STREAK_IMPROVEMENTS_SUMMARY.md',
    'STREAK_SCHEDULE_CONFIG_FIX.md',
    'AUTH_FLOW_FIX.md',
    'HOME_CLEANUP_SUMMARY.md',
    'USER_EXERCISE_PREFERENCES_FINAL_FIX.md',
    'template-fix-test.md'
  ],
  
  // Features
  'features': [
    'MARKETPLACE_IMPLEMENTATION_SUMMARY.md',
    'REAL_TIME_WORKOUT_IMPLEMENTATION.md',
    'FEATURE_ROADMAP.md',
    'STREAK_SETUP_GUIDE.md',
    'AI_SUGGESTIONS_TOGGLE_FEATURE.md',
    'AI_TOGGLE_COMPREHENSIVE_FIX.md',
    'AI_TOGGLE_NESTED_COMPONENTS_FIX.md',
    'AI_TOGGLE_SCOPE_FIX.md',
    'halloween-theme-implementation.md',
    'oled-theme-implementation.md'
  ],
  
  // Showcase
  'showcase': [
    'HACKATHON_SUBMISSION.md',
    '3MIN_DEMO_SCRIPT.md',
    'DEMO_FLOW_ANALYSIS.md'
  ]
};

// Function to move file if it exists
const moveFileIfExists = (fileName, targetDir) => {
  const sourcePath = path.join(rootDir, fileName);
  const targetPath = path.join(rootDir, 'docs', targetDir, fileName);
  
  if (fs.existsSync(sourcePath)) {
    // Ensure target directory exists
    const targetDirPath = path.dirname(targetPath);
    if (!fs.existsSync(targetDirPath)) {
      fs.mkdirSync(targetDirPath, { recursive: true });
    }
    
    try {
      fs.renameSync(sourcePath, targetPath);
      console.log(`✅ Moved ${fileName} → docs/${targetDir}/`);
      return true;
    } catch (error) {
      console.log(`⚠️  Failed to move ${fileName}: ${error.message}`);
      return false;
    }
  } else {
    // Check if it's already in docs
    const docsPath = path.join(rootDir, 'docs', fileName);
    if (fs.existsSync(docsPath)) {
      try {
        fs.renameSync(docsPath, targetPath);
        console.log(`✅ Reorganized ${fileName} → docs/${targetDir}/`);
        return true;
      } catch (error) {
        console.log(`⚠️  Failed to reorganize ${fileName}: ${error.message}`);
        return false;
      }
    }
    console.log(`ℹ️  File not found: ${fileName}`);
    return false;
  }
};

// Organize files
let movedCount = 0;
let totalFiles = 0;

Object.entries(docStructure).forEach(([category, files]) => {
  console.log(`\n📁 Organizing ${category} documentation...`);
  
  files.forEach(fileName => {
    totalFiles++;
    if (moveFileIfExists(fileName, category)) {
      movedCount++;
    }
  });
});

// Create category index files
Object.entries(docStructure).forEach(([category, files]) => {
  const indexPath = path.join(rootDir, 'docs', category, 'README.md');
  
  if (!fs.existsSync(indexPath)) {
    const categoryTitle = category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    const indexContent = `# ${categoryTitle} Documentation

## Available Documents

${files.map(file => {
  const title = file.replace('.md', '').replace(/[-_]/g, ' ');
  return `- [${title}](./${file})`;
}).join('\n')}

---

[← Back to Main Documentation](../README.md)
`;
    
    fs.writeFileSync(indexPath, indexContent);
    console.log(`✅ Created index for ${category}`);
  }
});

// Clean up any remaining files in root
const rootMdFiles = fs.readdirSync(rootDir)
  .filter(file => file.endsWith('.md') && file !== 'README.md' && file !== 'CHANGELOG.md');

if (rootMdFiles.length > 0) {
  console.log(`\n🧹 Found ${rootMdFiles.length} unorganized files in root:`);
  rootMdFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
}

console.log(`\n🎉 Documentation organization complete!`);
console.log(`📊 Moved ${movedCount}/${totalFiles} files`);
console.log(`📁 Organized into ${Object.keys(docStructure).length} categories`);
console.log(`\n📖 View the organized docs: docs/README.md`);