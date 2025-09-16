#!/usr/bin/env node

/**
 * Mobile Performance Testing Script
 * Tests the app performance on various Android device configurations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Starting mobile performance testing...');

// Device configurations to test
const deviceConfigs = [
  {
    name: 'Low-end Device',
    ram: '2GB',
    cpu: 'Quad-core 1.4GHz',
    api: '23',
    density: 'mdpi',
    resolution: '720x1280'
  },
  {
    name: 'Mid-range Device',
    ram: '4GB',
    cpu: 'Octa-core 2.0GHz',
    api: '28',
    density: 'xhdpi',
    resolution: '1080x1920'
  },
  {
    name: 'High-end Device',
    ram: '8GB',
    cpu: 'Octa-core 2.8GHz',
    api: '33',
    density: 'xxhdpi',
    resolution: '1440x2560'
  }
];

// Performance metrics to track
const performanceMetrics = {
  appStartTime: 0,
  firstContentfulPaint: 0,
  largestContentfulPaint: 0,
  cumulativeLayoutShift: 0,
  firstInputDelay: 0,
  memoryUsage: 0,
  bundleSize: 0,
  networkRequests: 0
};

function checkPrerequisites() {
  console.log('📋 Checking prerequisites...');
  
  try {
    // Check if Android SDK is available
    execSync('adb version', { stdio: 'pipe' });
    console.log('✅ ADB is available');
  } catch (error) {
    console.error('❌ ADB not found. Please install Android SDK.');
    return false;
  }
  
  try {
    // Check if Capacitor is configured
    const capacitorConfig = path.join(__dirname, '..', 'capacitor.config.ts');
    if (!fs.existsSync(capacitorConfig)) {
      console.error('❌ Capacitor config not found');
      return false;
    }
    console.log('✅ Capacitor is configured');
  } catch (error) {
    console.error('❌ Capacitor configuration error:', error.message);
    return false;
  }
  
  return true;
}

function getConnectedDevices() {
  console.log('📱 Checking connected devices...');
  
  try {
    const output = execSync('adb devices', { encoding: 'utf8' });
    const lines = output.split('\n').filter(line => line.includes('\tdevice'));
    
    if (lines.length === 0) {
      console.log('⚠️  No physical devices connected. Will use emulator if available.');
      return [];
    }
    
    const devices = lines.map(line => {
      const deviceId = line.split('\t')[0];
      return { id: deviceId, type: 'physical' };
    });
    
    console.log(`✅ Found ${devices.length} connected device(s)`);
    return devices;
  } catch (error) {
    console.error('❌ Error checking devices:', error.message);
    return [];
  }
}

function measureBundleSize() {
  console.log('📦 Measuring bundle size...');
  
  const distPath = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build not found. Please run build first.');
    return 0;
  }
  
  let totalSize = 0;
  
  function calculateSize(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        calculateSize(filePath);
      } else {
        totalSize += stat.size;
      }
    });
  }
  
  calculateSize(distPath);
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`📦 Total bundle size: ${sizeMB}MB`);
  return parseFloat(sizeMB);
}

function testAppStartup(deviceId) {
  console.log(`🚀 Testing app startup on device: ${deviceId}`);
  
  try {
    // Clear app data
    execSync(`adb -s ${deviceId} shell pm clear com.gymtracker.app`, { stdio: 'pipe' });
    
    // Start app and measure time
    const startTime = Date.now();
    execSync(`adb -s ${deviceId} shell am start -n com.gymtracker.app/.MainActivity`, { stdio: 'pipe' });
    
    // Wait for app to be fully loaded (simplified - in real testing you'd use more sophisticated methods)
    setTimeout(() => {
      const endTime = Date.now();
      const startupTime = endTime - startTime;
      
      console.log(`⏱️  App startup time: ${startupTime}ms`);
      return startupTime;
    }, 3000);
    
  } catch (error) {
    console.error(`❌ Error testing startup on ${deviceId}:`, error.message);
    return 0;
  }
}

function testMemoryUsage(deviceId) {
  console.log(`🧠 Testing memory usage on device: ${deviceId}`);
  
  try {
    // Get memory info
    const output = execSync(`adb -s ${deviceId} shell dumpsys meminfo com.gymtracker.app`, { encoding: 'utf8' });
    
    // Parse memory usage (simplified parsing)
    const lines = output.split('\n');
    const totalPssLine = lines.find(line => line.includes('TOTAL PSS:'));
    
    if (totalPssLine) {
      const memoryMatch = totalPssLine.match(/(\d+)/);
      if (memoryMatch) {
        const memoryKB = parseInt(memoryMatch[1]);
        const memoryMB = (memoryKB / 1024).toFixed(2);
        
        console.log(`🧠 Memory usage: ${memoryMB}MB`);
        return parseFloat(memoryMB);
      }
    }
    
    console.log('⚠️  Could not parse memory usage');
    return 0;
  } catch (error) {
    console.error(`❌ Error testing memory on ${deviceId}:`, error.message);
    return 0;
  }
}

function generatePerformanceReport(results) {
  console.log('📊 Generating performance report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    testEnvironment: {
      platform: 'Android',
      capacitorVersion: '7.4.3',
      nodeVersion: process.version
    },
    bundleAnalysis: {
      totalSize: results.bundleSize,
      recommendations: []
    },
    deviceTests: results.deviceTests || [],
    overallScore: calculateOverallScore(results),
    recommendations: generateRecommendations(results)
  };
  
  // Add recommendations based on results
  if (results.bundleSize > 5) {
    report.bundleAnalysis.recommendations.push('Bundle size is large. Consider code splitting and lazy loading.');
  }
  
  if (results.bundleSize > 10) {
    report.bundleAnalysis.recommendations.push('Bundle size is very large. Urgent optimization needed.');
  }
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'mobile-performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📊 Performance report saved to: ${reportPath}`);
  
  // Display summary
  console.log('\n📋 Performance Summary:');
  console.log(`   Bundle Size: ${results.bundleSize}MB`);
  console.log(`   Overall Score: ${report.overallScore}/100`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`   • ${rec}`));
  }
}

function calculateOverallScore(results) {
  let score = 100;
  
  // Deduct points for large bundle size
  if (results.bundleSize > 2) score -= 10;
  if (results.bundleSize > 5) score -= 20;
  if (results.bundleSize > 10) score -= 30;
  
  // Add more scoring logic based on other metrics
  
  return Math.max(0, score);
}

function generateRecommendations(results) {
  const recommendations = [];
  
  if (results.bundleSize > 5) {
    recommendations.push('Implement code splitting to reduce initial bundle size');
    recommendations.push('Use lazy loading for non-critical components');
    recommendations.push('Optimize images and use modern formats (WebP, AVIF)');
  }
  
  if (results.bundleSize > 2) {
    recommendations.push('Enable tree shaking to remove unused code');
    recommendations.push('Consider using dynamic imports for heavy libraries');
  }
  
  recommendations.push('Enable gzip/brotli compression on the server');
  recommendations.push('Implement resource preloading for critical assets');
  recommendations.push('Use service worker for efficient caching');
  
  return recommendations;
}

async function runPerformanceTests() {
  console.log('🏃‍♂️ Running performance tests...');
  
  const results = {
    bundleSize: measureBundleSize(),
    deviceTests: []
  };
  
  const devices = getConnectedDevices();
  
  if (devices.length > 0) {
    console.log('📱 Testing on connected devices...');
    
    for (const device of devices) {
      console.log(`\n🔍 Testing device: ${device.id}`);
      
      const deviceResults = {
        deviceId: device.id,
        type: device.type,
        startupTime: testAppStartup(device.id),
        memoryUsage: testMemoryUsage(device.id)
      };
      
      results.deviceTests.push(deviceResults);
    }
  } else {
    console.log('⚠️  No devices available for testing. Running bundle analysis only.');
  }
  
  generatePerformanceReport(results);
}

// Main execution
async function main() {
  try {
    if (!checkPrerequisites()) {
      process.exit(1);
    }
    
    await runPerformanceTests();
    
    console.log('\n🎉 Mobile performance testing completed!');
  } catch (error) {
    console.error('❌ Error during performance testing:', error);
    process.exit(1);
  }
}

main();