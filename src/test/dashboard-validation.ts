/**
 * Dashboard Validation Script
 * 
 * Simple validation script to test dashboard functionality
 */

import { TestMetricsDashboard, createTestMetricsDashboard } from './test-metrics-dashboard';
import { ReliabilityTracker } from './reliability-tracker';
import { EnhancedCoverageEnforcer } from './coverage-enforcer';
import { TestDataPersistence } from './test-data-persistence';

async function validateDashboard() {
  console.log('🚀 Validating Test Metrics Dashboard...');
  
  try {
    // Create dashboard components
    const reliabilityTracker = new ReliabilityTracker();
    const coverageEnforcer = new EnhancedCoverageEnforcer();
    const dataPersistence = new TestDataPersistence();
    
    const dashboard = createTestMetricsDashboard(
      reliabilityTracker,
      coverageEnforcer,
      dataPersistence
    );

    console.log('✅ Dashboard created successfully');

    // Add some test data
    reliabilityTracker.addTestSuite({
      suiteName: 'validation-suite',
      buildNumber: 1,
      timestamp: new Date(),
      totalTests: 100,
      passedTests: 95,
      failedTests: 5,
      skippedTests: 0,
      duration: 30000
    });

    console.log('✅ Test data added');

    // Get current metrics
    const metrics = await dashboard.getCurrentMetrics();
    console.log('✅ Metrics collected successfully');
    console.log(`📊 Reliability: ${metrics.reliability.overallReliability.toFixed(2)}%`);
    console.log(`📈 Coverage: ${metrics.coverage.overallCoverage.toFixed(2)}%`);
    console.log(`🚨 Active Alerts: ${metrics.alerts.length}`);

    // Generate report
    const report = await dashboard.generateReport();
    console.log('✅ Report generated successfully');
    console.log(`📄 Report length: ${report.length} characters`);

    // Test status summary
    const status = dashboard.getStatusSummary();
    console.log('✅ Status summary generated');
    console.log(`🎯 Overall Status: ${status.status}`);

    // Test export functionality
    const exportData = await dashboard.exportDashboardData('json');
    console.log('✅ Data export successful');
    console.log(`📦 Export size: ${exportData.length} characters`);

    console.log('\n🎉 All dashboard validations passed!');
    
    return true;
  } catch (error) {
    console.error('❌ Dashboard validation failed:', error);
    return false;
  }
}

// Run validation
validateDashboard().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal validation error:', error);
  process.exit(1);
});