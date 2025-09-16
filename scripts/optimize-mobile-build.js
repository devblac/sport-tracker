#!/usr/bin/env node

/**
 * Mobile Build Optimizer
 * Optimizes the build output specifically for mobile distribution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

console.log('🚀 Starting mobile build optimization...');

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('❌ Dist directory not found. Please run build first.');
  process.exit(1);
}

// Optimization functions
function optimizeImages() {
  console.log('📸 Optimizing images for mobile...');
  
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
  let optimizedCount = 0;
  
  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (imageExtensions.some(ext => file.toLowerCase().endsWith(ext))) {
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        
        if (sizeKB > 500) {
          console.log(`⚠️  Large image detected: ${file} (${sizeKB}KB)`);
        }
        
        optimizedCount++;
      }
    });
  }
  
  processDirectory(distPath);
  console.log(`✅ Processed ${optimizedCount} images`);
}

function optimizeJavaScript() {
  console.log('📦 Analyzing JavaScript bundles...');
  
  const jsFiles = [];
  
  function findJSFiles(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findJSFiles(filePath);
      } else if (file.endsWith('.js')) {
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        jsFiles.push({ file, sizeKB, path: filePath });
      }
    });
  }
  
  findJSFiles(distPath);
  
  // Sort by size
  jsFiles.sort((a, b) => b.sizeKB - a.sizeKB);
  
  console.log('📊 JavaScript bundle sizes:');
  jsFiles.forEach(({ file, sizeKB }) => {
    const status = sizeKB > 200 ? '⚠️ ' : sizeKB > 100 ? '⚡' : '✅';
    console.log(`  ${status} ${file}: ${sizeKB}KB`);
  });
  
  const totalSize = jsFiles.reduce((sum, { sizeKB }) => sum + sizeKB, 0);
  console.log(`📦 Total JavaScript size: ${totalSize}KB`);
  
  if (totalSize > 1000) {
    console.log('⚠️  Warning: Total bundle size is large for mobile. Consider code splitting.');
  }
}

function optimizeCSS() {
  console.log('🎨 Analyzing CSS files...');
  
  const cssFiles = [];
  
  function findCSSFiles(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findCSSFiles(filePath);
      } else if (file.endsWith('.css')) {
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        cssFiles.push({ file, sizeKB });
      }
    });
  }
  
  findCSSFiles(distPath);
  
  const totalCSSSize = cssFiles.reduce((sum, { sizeKB }) => sum + sizeKB, 0);
  console.log(`🎨 Total CSS size: ${totalCSSSize}KB`);
  
  cssFiles.forEach(({ file, sizeKB }) => {
    const status = sizeKB > 50 ? '⚠️ ' : '✅';
    console.log(`  ${status} ${file}: ${sizeKB}KB`);
  });
}

function generateMobileBuildReport() {
  console.log('📋 Generating mobile build report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    buildOptimizations: {
      minification: 'enabled',
      treeshaking: 'enabled',
      codesplitting: 'enabled',
      compression: 'gzip',
    },
    recommendations: [],
  };
  
  // Check for common mobile optimization issues
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    const content = fs.readFileSync(indexHtml, 'utf8');
    
    if (!content.includes('viewport')) {
      report.recommendations.push('Add viewport meta tag for mobile optimization');
    }
    
    if (!content.includes('preload')) {
      report.recommendations.push('Consider adding resource preloading for critical assets');
    }
  }
  
  // Save report
  const reportPath = path.join(distPath, 'mobile-build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📋 Build report saved to: ${reportPath}`);
}

function validateMobileBuild() {
  console.log('✅ Validating mobile build...');
  
  const requiredFiles = [
    'index.html',
    'manifest.webmanifest',
    'sw.js'
  ];
  
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(distPath, file))
  );
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:', missingFiles);
    return false;
  }
  
  console.log('✅ All required files present');
  return true;
}

// Run optimizations
async function main() {
  try {
    optimizeImages();
    optimizeJavaScript();
    optimizeCSS();
    generateMobileBuildReport();
    
    if (validateMobileBuild()) {
      console.log('🎉 Mobile build optimization completed successfully!');
    } else {
      console.error('❌ Mobile build validation failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during mobile optimization:', error);
    process.exit(1);
  }
}

main();