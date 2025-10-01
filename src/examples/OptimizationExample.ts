/**
 * Example usage of the optimization services
 * 
 * This demonstrates how to use the database query optimizer, realtime subscription
 * manager, and resource usage monitor together for optimal performance.
 */

import { databaseQueryOptimizer } from '@/services/DatabaseQueryOptimizer';
import { realtimeSubscriptionManager } from '@/services/RealtimeSubscriptionManager';
import { resourceUsageMonitor } from '@/services/ResourceUsageMonitor';
import { optimizationService } from '@/services/OptimizationService';

// ============================================================================
// Example: Optimized Database Operations
// ============================================================================

export async function exampleOptimizedQueries() {
  console.log('=== Database Query Optimization Example ===');

  // Example 1: Cached query for frequently accessed data
  const userQuery = await optimizationService.executeOptimizedQuery({
    id: 'get-user-profile',
    table: 'users',
    operation: 'select',
    filters: { id: 123 },
    priority: 'high',
    cacheable: true,
    cacheKey: 'user-123',
    cacheTTL: 300000 // 5 minutes
  });

  console.log('User query result:', userQuery);

  // Example 2: Batchable insert operations
  const workoutData = [
    { name: 'Morning Workout', user_id: 123, duration: 45 },
    { name: 'Evening Workout', user_id: 123, duration: 60 }
  ];

  for (const workout of workoutData) {
    await optimizationService.executeOptimizedQuery({
      id: `insert-workout-${Date.now()}`,
      table: 'workouts',
      operation: 'insert',
      data: workout,
      priority: 'medium',
      batchable: true // Will be batched automatically
    });
  }

  // Example 3: Prefetch related data
  databaseQueryOptimizer.addPrefetchStrategy({
    table: 'exercises',
    conditions: { category: 'strength' },
    relatedTables: ['exercise_instructions', 'exercise_media'],
    priority: 'low',
    trigger: 'user_action'
  });

  console.log('Database optimization examples completed');
}

// ============================================================================
// Example: Optimized Real-time Subscriptions
// ============================================================================

export function exampleOptimizedSubscriptions() {
  console.log('=== Real-time Subscription Optimization Example ===');

  // Example 1: High-priority subscription for user notifications
  const notificationSubscription = optimizationService.createOptimizedSubscription({
    id: 'user-notifications',
    table: 'notifications',
    event: 'INSERT',
    callback: (payload) => {
      console.log('New notification:', payload);
    },
    priority: 'high',
    userActivity: 'active',
    batchable: false
  });

  // Example 2: Medium-priority subscription for social feed
  const socialFeedSubscription = optimizationService.createOptimizedSubscription({
    id: 'social-feed',
    table: 'social_posts',
    event: '*',
    callback: (payload) => {
      console.log('Social feed update:', payload);
    },
    priority: 'medium',
    userActivity: 'active',
    batchable: true,
    maxAge: 600000 // 10 minutes
  });

  // Example 3: Low-priority subscription for leaderboard updates
  const leaderboardSubscription = optimizationService.createOptimizedSubscription({
    id: 'leaderboard-updates',
    table: 'user_stats',
    event: 'UPDATE',
    callback: (payload) => {
      console.log('Leaderboard update:', payload);
    },
    priority: 'low',
    userActivity: 'background',
    batchable: true
  });

  console.log('Created subscriptions:', {
    notifications: notificationSubscription,
    socialFeed: socialFeedSubscription,
    leaderboard: leaderboardSubscription
  });

  // Simulate user activity changes
  setTimeout(() => {
    console.log('User going to background...');
    realtimeSubscriptionManager.setBackgroundMode();
  }, 5000);

  setTimeout(() => {
    console.log('User becoming inactive...');
    realtimeSubscriptionManager.setInactiveMode();
  }, 10000);

  setTimeout(() => {
    console.log('User becoming active again...');
    realtimeSubscriptionManager.updateUserActivity();
  }, 15000);

  console.log('Real-time subscription examples completed');
}

// ============================================================================
// Example: Resource Usage Monitoring
// ============================================================================

export function exampleResourceMonitoring() {
  console.log('=== Resource Usage Monitoring Example ===');

  // Example 1: Track API calls
  resourceUsageMonitor.trackAPICall({
    endpoint: '/api/workouts',
    method: 'GET',
    responseTime: 150,
    success: true,
    cached: false,
    dataSize: 2048
  });

  resourceUsageMonitor.trackAPICall({
    endpoint: '/api/users/profile',
    method: 'GET',
    responseTime: 50,
    success: true,
    cached: true,
    dataSize: 512
  });

  // Example 2: Track database operations
  resourceUsageMonitor.trackDatabaseOperation('read', 1024);
  resourceUsageMonitor.trackDatabaseOperation('write', 256);

  // Example 3: Track real-time usage
  resourceUsageMonitor.trackRealtimeSubscription(3);
  resourceUsageMonitor.trackRealtimeMessage('received');
  resourceUsageMonitor.trackRealtimeMessage('sent');

  // Example 4: Get current usage statistics
  const currentUsage = resourceUsageMonitor.getCurrentUsage();
  console.log('Current resource usage:', currentUsage);

  // Example 5: Get optimization suggestions
  const suggestions = resourceUsageMonitor.getOptimizationSuggestions();
  console.log('Optimization suggestions:', suggestions);

  // Example 6: Get performance metrics
  const apiStats = resourceUsageMonitor.getAPICallStats();
  console.log('API call statistics:', apiStats);

  console.log('Resource monitoring examples completed');
}

// ============================================================================
// Example: Integrated Optimization
// ============================================================================

export async function exampleIntegratedOptimization() {
  console.log('=== Integrated Optimization Example ===');

  // Example 1: Get comprehensive optimization status
  const status = optimizationService.getOptimizationStatus();
  console.log('Optimization status:', {
    config: status.config,
    activeSubscriptions: status.subscriptionManager.activeSubscriptions,
    userActivity: status.subscriptionManager.userActivity,
    resourceUsage: status.resourceMonitor.usage,
    activeAlerts: status.resourceMonitor.alerts.length
  });

  // Example 2: Generate optimization report
  const report = optimizationService.getOptimizationReport();
  console.log('Optimization report:', {
    timestamp: report.timestamp,
    queryOptimization: report.queryOptimization,
    realtimeOptimization: report.realtimeOptimization,
    overallImpact: report.overallImpact
  });

  // Example 3: Update optimization configuration
  optimizationService.updateConfig({
    enableAutoOptimization: true,
    aggressiveOptimization: false
  });

  // Example 4: Force optimization analysis
  await optimizationService.forceOptimization();

  console.log('Integrated optimization examples completed');
}

// ============================================================================
// Example: Performance Monitoring
// ============================================================================

export function examplePerformanceMonitoring() {
  console.log('=== Performance Monitoring Example ===');

  // Simulate high API usage to trigger alerts
  console.log('Simulating high API usage...');
  for (let i = 0; i < 50; i++) {
    resourceUsageMonitor.trackAPICall({
      endpoint: '/api/test',
      method: 'GET',
      responseTime: Math.random() * 1000,
      success: Math.random() > 0.1,
      cached: Math.random() > 0.7
    });
  }

  // Check for alerts
  setTimeout(() => {
    const alerts = resourceUsageMonitor.getActiveAlerts();
    console.log('Generated alerts:', alerts);

    // Acknowledge alerts
    alerts.forEach(alert => {
      resourceUsageMonitor.acknowledgeAlert(alert.id);
    });
  }, 1000);

  // Monitor cache performance
  const cacheStats = databaseQueryOptimizer.getCacheStats();
  console.log('Cache statistics:', cacheStats);

  // Monitor subscription metrics
  const subscriptionMetrics = realtimeSubscriptionManager.getMetrics();
  console.log('Subscription metrics:', subscriptionMetrics);

  console.log('Performance monitoring examples completed');
}

// ============================================================================
// Run All Examples
// ============================================================================

export async function runAllOptimizationExamples() {
  console.log('🚀 Starting Optimization Services Examples...\n');

  try {
    await exampleOptimizedQueries();
    console.log('✅ Database optimization examples completed\n');

    exampleOptimizedSubscriptions();
    console.log('✅ Real-time subscription examples completed\n');

    exampleResourceMonitoring();
    console.log('✅ Resource monitoring examples completed\n');

    await exampleIntegratedOptimization();
    console.log('✅ Integrated optimization examples completed\n');

    examplePerformanceMonitoring();
    console.log('✅ Performance monitoring examples completed\n');

    console.log('🎉 All optimization examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running optimization examples:', error);
  }
}

// Export for use in other parts of the application
export {
  databaseQueryOptimizer,
  realtimeSubscriptionManager,
  resourceUsageMonitor,
  optimizationService
};