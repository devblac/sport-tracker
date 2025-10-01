/**
 * Performance Integration Tests
 * 
 * Tests for free tier resource usage compliance, concurrent user scenarios,
 * caching effectiveness, and real-time feature performance under load.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceRegistry, serviceRegistry } from '../ServiceRegistry';
import { ResourceUsageMonitor, resourceUsageMonitor } from '../ResourceUsageMonitor';
import { DatabaseQueryOptimizer, databaseQueryOptimizer } from '../DatabaseQueryOptimizer';
import { RealtimeSubscriptionManager, realtimeSubscriptionManager } from '../RealtimeSubscriptionManager';
import { serviceConfigManager } from '../ServiceConfigManager';
import type { QueryConfig, SubscriptionConfig } from '@/types/optimization';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => [])
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance
});

// Mock Supabase with performance tracking
const createMockSupabaseWithMetrics = () => {
  let requestCount = 0;
  let responseTime = 100;
  
  return {
    auth: {
      getSession: vi.fn().mockImplementation(() => {
        requestCount++;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ data: { session: null }, error: null });
          }, responseTime);
        });
      }),
      signInWithPassword: vi.fn().mockImplementation(() => {
        requestCount++;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ data: { user: null }, error: null });
          }, responseTime);
        });
      })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(() => {
        requestCount++;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ data: [], error: null });
          }, responseTime);
        });
      })
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        requestCount++;
        setTimeout(() => callback('SUBSCRIBED'), responseTime);
        return { unsubscribe: vi.fn() };
      })
    })),
    removeChannel: vi.fn(),
    rpc: vi.fn().mockImplementation(() => {
      requestCount++;
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ data: null, error: null });
        }, responseTime);
      });
    }),
    // Test utilities
    _getRequestCount: () => requestCount,
    _setResponseTime: (time: number) => { responseTime = time; },
    _resetMetrics: () => { requestCount = 0; responseTime = 100; }
  };
};

const mockSupabaseClient = createMockSupabaseWithMetrics();

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('Performance Integration Tests', () => {
  let registry: ServiceRegistry;
  let resourceMonitor: ResourceUsageMonitor;
  let queryOptimizer: DatabaseQueryOptimizer;
  let subscriptionManager: RealtimeSubscriptionManager;

  beforeEach(async () => {
    // Reset all mocks and metrics
    vi.clearAllMocks();
    mockSupabaseClient._resetMetrics();
    
    // Get service instances
    registry = ServiceRegistry.getInstance();
    resourceMonitor = resourceUsageMonitor;
    queryOptimizer = databaseQueryOptimizer;
    subscriptionManager = realtimeSubscriptionManager;
    
    // Configure for performance testing
    serviceConfigManager.updateConfig({
      useRealServices: true,
      supabaseEnabled: true,
      rateLimits: {
        requestsPerMinute: 100,
        burstLimit: 20,
        backoffStrategy: 'exponential',
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000
      }
    });
    
    // Reset resource monitor
    resourceMonitor.reset();
    
    // Clear caches
    queryOptimizer.clearCache();
    subscriptionManager.unsubscribeAll();
  });

  afterEach(async () => {
    // Cleanup
    subscriptionManager.unsubscribeAll();
    queryOptimizer.clearCache();
    resourceMonitor.reset();
    await registry.shutdown();
  });

  describe('Free Tier Resource Usage Compliance', () => {
    it('should stay within Supabase free tier API limits', async () => {
      const freetierLimit = 500; // API calls per hour for free tier
      const testDuration = 60000; // 1 minute test
      const expectedCallsPerMinute = Math.floor(freetierLimit / 60);
      
      const startTime = Date.now();
      let apiCalls = 0;
      
      // Simulate normal app usage
      while (Date.now() - startTime < testDuration) {
        // Simulate user actions that trigger API calls
        const databaseService = registry.database;
        
        try {
          await databaseService.healthCheck();
          apiCalls++;
        } catch (error) {
          // Count failed calls too
          apiCalls++;
        }
        
        // Simulate realistic user interaction intervals
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Should stay well within free tier limits
      expect(apiCalls).toBeLessThan(expectedCallsPerMinute);
      
      // Verify resource monitoring
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.apiCalls.total).toBe(apiCalls);
    });

    it('should optimize database bandwidth usage', async () => {
      const maxBandwidthPerMinute = 2 * 1024 * 1024; // 2MB per minute
      
      // Simulate data-heavy operations
      for (let i = 0; i < 10; i++) {
        const queryConfig: QueryConfig = {
          id: `bandwidth-test-${i}`,
          table: 'workouts',
          operation: 'select',
          priority: 'medium',
          cacheable: true,
          cacheKey: `workouts-${i}`
        };
        
        // Track bandwidth usage
        resourceMonitor.trackDatabaseOperation('read', 1024); // 1KB per operation
        
        // Execute query with optimization
        await queryOptimizer.executeQuery(queryConfig);
      }
      
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.database.bandwidth).toBeLessThan(maxBandwidthPerMinute);
    });

    it('should limit concurrent real-time subscriptions', () => {
      const maxConcurrentSubscriptions = 10; // Free tier limit
      
      // Create subscriptions up to the limit
      const subscriptionIds: string[] = [];
      
      for (let i = 0; i < maxConcurrentSubscriptions + 5; i++) {
        const config: SubscriptionConfig = {
          id: `limit-test-${i}`,
          table: 'social_posts',
          event: '*',
          callback: vi.fn(),
          priority: 'medium',
          userActivity: 'active'
        };
        
        const subscriptionId = subscriptionManager.subscribe(config);
        if (subscriptionId) {
          subscriptionIds.push(subscriptionId);
        }
      }
      
      // Should not exceed the limit
      expect(subscriptionManager.getActiveSubscriptionCount()).toBeLessThanOrEqual(maxConcurrentSubscriptions);
      
      // Cleanup
      subscriptionIds.forEach(id => subscriptionManager.unsubscribe(id));
    });

    it('should implement intelligent rate limiting', async () => {
      const rateLimitConfig = serviceConfigManager.getConfig().rateLimits;
      const requestsPerMinute = rateLimitConfig.requestsPerMinute;
      
      // Track request timing
      const requestTimes: number[] = [];
      
      // Make requests rapidly
      for (let i = 0; i < requestsPerMinute + 10; i++) {
        const startTime = Date.now();
        
        resourceMonitor.trackAPICall({
          endpoint: '/api/test',
          method: 'GET',
          responseTime: 100,
          success: true
        });
        
        requestTimes.push(Date.now() - startTime);
        
        // Small delay to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Should have tracked all requests
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.apiCalls.total).toBeGreaterThan(requestsPerMinute);
      
      // Should provide rate limiting suggestions
      const suggestions = resourceMonitor.getOptimizationSuggestions();
      const rateLimitSuggestions = suggestions.filter(s => 
        s.category === 'api' && s.message.includes('rate')
      );
      expect(rateLimitSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Concurrent User Scenarios', () => {
    it('should handle multiple concurrent users', async () => {
      const concurrentUsers = 50;
      const actionsPerUser = 5;
      
      // Simulate concurrent user actions
      const userPromises = Array.from({ length: concurrentUsers }, async (_, userId) => {
        const userActions = [];
        
        for (let action = 0; action < actionsPerUser; action++) {
          userActions.push(
            // Simulate different user actions
            Promise.all([
              // Auth check
              registry.auth.isAuthenticated(),
              // Workout data fetch
              registry.workout.getWorkoutTemplates(),
              // Social feed check
              registry.social ? registry.social.getFeed?.() : Promise.resolve([])
            ]).catch(() => {
              // Handle errors gracefully in concurrent scenario
            })
          );
          
          // Stagger actions
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        }
        
        return Promise.all(userActions);
      });
      
      // Wait for all users to complete
      const startTime = Date.now();
      await Promise.all(userPromises);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      const averageTimePerUser = totalTime / concurrentUsers;
      
      // Should handle concurrent load efficiently
      expect(averageTimePerUser).toBeLessThan(5000); // Less than 5 seconds per user
      
      // Verify resource usage
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.apiCalls.total).toBeGreaterThan(0);
    });

    it('should maintain performance under concurrent database operations', async () => {
      const concurrentOperations = 20;
      
      // Create concurrent database operations
      const operationPromises = Array.from({ length: concurrentOperations }, async (_, index) => {
        const queryConfig: QueryConfig = {
          id: `concurrent-${index}`,
          table: 'users',
          operation: 'select',
          priority: 'medium',
          cacheable: true,
          cacheKey: `users-${index % 5}` // Some cache overlap
        };
        
        const startTime = Date.now();
        await queryOptimizer.executeQuery(queryConfig);
        const endTime = Date.now();
        
        return endTime - startTime;
      });
      
      const responseTimes = await Promise.all(operationPromises);
      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      
      // Should maintain reasonable response times
      expect(averageResponseTime).toBeLessThan(1000); // Less than 1 second average
      
      // Check cache effectiveness
      const cacheStats = queryOptimizer.getCacheStats();
      expect(cacheStats.hitRate).toBeGreaterThan(0); // Some cache hits expected
    });

    it('should handle concurrent real-time subscriptions', async () => {
      const concurrentSubscriptions = 15;
      const messagesPerSubscription = 10;
      
      // Create concurrent subscriptions
      const subscriptionPromises = Array.from({ length: concurrentSubscriptions }, async (_, index) => {
        const messageCount = { received: 0 };
        
        const config: SubscriptionConfig = {
          id: `concurrent-sub-${index}`,
          table: 'notifications',
          event: 'INSERT',
          callback: (payload) => {
            messageCount.received++;
            resourceMonitor.trackRealtimeMessage('received');
          },
          priority: 'medium',
          userActivity: 'active'
        };
        
        const subscriptionId = subscriptionManager.subscribe(config);
        
        // Simulate messages
        for (let i = 0; i < messagesPerSubscription; i++) {
          resourceMonitor.trackRealtimeMessage('received');
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        return { subscriptionId, messageCount };
      });
      
      const results = await Promise.all(subscriptionPromises);
      
      // Verify all subscriptions were created
      expect(results.length).toBe(concurrentSubscriptions);
      
      // Check resource usage
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.realtime.messagesReceived).toBeGreaterThan(0);
      
      // Cleanup
      results.forEach(result => {
        if (result.subscriptionId) {
          subscriptionManager.unsubscribe(result.subscriptionId);
        }
      });
    });
  });

  describe('Caching Effectiveness and Hit Rates', () => {
    it('should achieve high cache hit rates for repeated queries', async () => {
      const queryConfig: QueryConfig = {
        id: 'cache-test',
        table: 'exercises',
        operation: 'select',
        priority: 'high',
        cacheable: true,
        cacheKey: 'exercises-all'
      };
      
      // First query - cache miss
      await queryOptimizer.executeQuery(queryConfig);
      
      // Subsequent queries - should be cache hits
      for (let i = 0; i < 10; i++) {
        await queryOptimizer.executeQuery(queryConfig);
      }
      
      const cacheStats = queryOptimizer.getCacheStats();
      expect(cacheStats.hitRate).toBeGreaterThan(0.8); // 80% hit rate
      expect(cacheStats.entries).toBeGreaterThan(0);
    });

    it('should implement cache invalidation strategies', async () => {
      const readConfig: QueryConfig = {
        id: 'cache-read',
        table: 'workouts',
        operation: 'select',
        priority: 'medium',
        cacheable: true,
        cacheKey: 'workouts-user-1'
      };
      
      const writeConfig: QueryConfig = {
        id: 'cache-write',
        table: 'workouts',
        operation: 'insert',
        data: { name: 'New Workout', user_id: 1 },
        priority: 'high',
        invalidateCache: ['workouts-user-1']
      };
      
      // Cache some data
      await queryOptimizer.executeQuery(readConfig);
      
      let cacheStats = queryOptimizer.getCacheStats();
      const initialEntries = cacheStats.entries;
      
      // Write operation should invalidate cache
      await queryOptimizer.executeQuery(writeConfig);
      
      cacheStats = queryOptimizer.getCacheStats();
      expect(cacheStats.entries).toBeLessThanOrEqual(initialEntries);
    });

    it('should optimize cache memory usage', () => {
      const maxCacheSize = 100; // entries
      
      // Fill cache beyond limit
      for (let i = 0; i < maxCacheSize + 20; i++) {
        const queryConfig: QueryConfig = {
          id: `memory-test-${i}`,
          table: 'test_table',
          operation: 'select',
          priority: 'low',
          cacheable: true,
          cacheKey: `test-${i}`
        };
        
        queryOptimizer.executeQuery(queryConfig);
      }
      
      const cacheStats = queryOptimizer.getCacheStats();
      expect(cacheStats.entries).toBeLessThanOrEqual(maxCacheSize);
    });

    it('should implement TTL-based cache expiration', async () => {
      const shortTTLConfig: QueryConfig = {
        id: 'ttl-test',
        table: 'notifications',
        operation: 'select',
        priority: 'medium',
        cacheable: true,
        cacheKey: 'notifications-recent',
        cacheTTL: 100 // 100ms TTL
      };
      
      // Cache data
      await queryOptimizer.executeQuery(shortTTLConfig);
      
      let cacheStats = queryOptimizer.getCacheStats();
      const initialEntries = cacheStats.entries;
      
      // Wait for TTL expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Execute query again - should be cache miss due to TTL
      await queryOptimizer.executeQuery(shortTTLConfig);
      
      // Cache should have been refreshed
      cacheStats = queryOptimizer.getCacheStats();
      expect(cacheStats.entries).toBeGreaterThanOrEqual(initialEntries);
    });
  });

  describe('Real-time Feature Performance Under Load', () => {
    it('should maintain real-time performance with high message throughput', async () => {
      const messageCount = 1000;
      const subscriptionCount = 5;
      
      // Create multiple subscriptions
      const subscriptions = Array.from({ length: subscriptionCount }, (_, index) => {
        const messageReceived = { count: 0, totalTime: 0 };
        
        const config: SubscriptionConfig = {
          id: `throughput-test-${index}`,
          table: 'social_posts',
          event: '*',
          callback: (payload) => {
            const endTime = Date.now();
            messageReceived.count++;
            messageReceived.totalTime += endTime - (payload.timestamp || endTime);
            resourceMonitor.trackRealtimeMessage('received');
          },
          priority: 'high',
          userActivity: 'active'
        };
        
        const subscriptionId = subscriptionManager.subscribe(config);
        return { subscriptionId, messageReceived };
      });
      
      // Send high volume of messages
      const startTime = Date.now();
      
      for (let i = 0; i < messageCount; i++) {
        // Simulate message processing
        resourceMonitor.trackRealtimeMessage('received');
        
        // Small delay to simulate realistic message intervals
        if (i % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const messagesPerSecond = messageCount / (totalTime / 1000);
      
      // Should handle high throughput
      expect(messagesPerSecond).toBeGreaterThan(100); // At least 100 messages/second
      
      // Verify resource tracking
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.realtime.messagesReceived).toBe(messageCount);
      
      // Cleanup
      subscriptions.forEach(sub => {
        if (sub.subscriptionId) {
          subscriptionManager.unsubscribe(sub.subscriptionId);
        }
      });
    });

    it('should optimize subscription management under load', async () => {
      const maxSubscriptions = 20;
      const subscriptionChurn = 50; // Create/destroy cycles
      
      for (let cycle = 0; cycle < subscriptionChurn; cycle++) {
        const subscriptionIds: string[] = [];
        
        // Create subscriptions
        for (let i = 0; i < maxSubscriptions; i++) {
          const config: SubscriptionConfig = {
            id: `churn-${cycle}-${i}`,
            table: 'test_table',
            event: '*',
            callback: vi.fn(),
            priority: 'medium',
            userActivity: 'active'
          };
          
          const subscriptionId = subscriptionManager.subscribe(config);
          if (subscriptionId) {
            subscriptionIds.push(subscriptionId);
          }
        }
        
        // Verify subscription count
        expect(subscriptionManager.getActiveSubscriptionCount()).toBeGreaterThan(0);
        
        // Destroy subscriptions
        subscriptionIds.forEach(id => subscriptionManager.unsubscribe(id));
        
        // Small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Should end with no active subscriptions
      expect(subscriptionManager.getActiveSubscriptionCount()).toBe(0);
    });

    it('should handle subscription errors without performance degradation', async () => {
      const errorRate = 0.2; // 20% error rate
      const subscriptionCount = 30;
      
      const subscriptions = Array.from({ length: subscriptionCount }, (_, index) => {
        const shouldError = Math.random() < errorRate;
        
        const config: SubscriptionConfig = {
          id: `error-test-${index}`,
          table: 'test_table',
          event: '*',
          callback: shouldError 
            ? () => { throw new Error('Callback error'); }
            : vi.fn(),
          priority: 'medium',
          userActivity: 'active'
        };
        
        return subscriptionManager.subscribe(config);
      });
      
      // Should handle errors gracefully
      const activeCount = subscriptionManager.getActiveSubscriptionCount();
      expect(activeCount).toBeGreaterThan(0);
      
      // Performance should not be significantly impacted
      const metrics = subscriptionManager.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      
      // Cleanup
      subscriptions.forEach(id => {
        if (id) subscriptionManager.unsubscribe(id);
      });
    });

    it('should optimize based on user activity levels', async () => {
      const subscriptionCount = 10;
      
      // Create subscriptions in active mode
      subscriptionManager.updateUserActivity(); // Active mode
      
      const subscriptions = Array.from({ length: subscriptionCount }, (_, index) => {
        const config: SubscriptionConfig = {
          id: `activity-test-${index}`,
          table: 'social_posts',
          event: '*',
          callback: vi.fn(),
          priority: index < 5 ? 'high' : 'low',
          userActivity: 'active'
        };
        
        return subscriptionManager.subscribe(config);
      });
      
      const activeCount = subscriptionManager.getActiveSubscriptionCount();
      
      // Switch to background mode
      subscriptionManager.setBackgroundMode();
      
      // Should optimize subscriptions for background
      const backgroundCount = subscriptionManager.getActiveSubscriptionCount();
      expect(backgroundCount).toBeLessThanOrEqual(activeCount);
      
      // Switch to inactive mode
      subscriptionManager.setInactiveMode();
      
      // Should further optimize for inactive mode
      const inactiveCount = subscriptionManager.getActiveSubscriptionCount();
      expect(inactiveCount).toBeLessThanOrEqual(backgroundCount);
      
      // Cleanup
      subscriptions.forEach(id => {
        if (id) subscriptionManager.unsubscribe(id);
      });
    });
  });

  describe('Performance Monitoring and Optimization', () => {
    it('should provide comprehensive performance metrics', () => {
      // Generate some activity
      for (let i = 0; i < 10; i++) {
        resourceMonitor.trackAPICall({
          endpoint: '/api/test',
          method: 'GET',
          responseTime: 100 + Math.random() * 200,
          success: Math.random() > 0.1,
          cached: Math.random() > 0.5
        });
        
        resourceMonitor.trackDatabaseOperation('read', 1024);
        resourceMonitor.trackRealtimeMessage('received');
      }
      
      const usage = resourceMonitor.getCurrentUsage();
      
      // Should have comprehensive metrics
      expect(usage.apiCalls.total).toBe(10);
      expect(usage.apiCalls.successful).toBeGreaterThan(0);
      expect(usage.apiCalls.cached).toBeGreaterThan(0);
      expect(usage.database.reads).toBe(10);
      expect(usage.realtime.messagesReceived).toBe(10);
    });

    it('should generate actionable optimization suggestions', () => {
      // Generate high resource usage
      for (let i = 0; i < 200; i++) {
        resourceMonitor.trackAPICall({
          endpoint: '/api/heavy',
          method: 'POST',
          responseTime: 500,
          success: true,
          cached: false
        });
      }
      
      const suggestions = resourceMonitor.getOptimizationSuggestions();
      
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Should have specific suggestions
      const apiSuggestions = suggestions.filter(s => s.category === 'api');
      expect(apiSuggestions.length).toBeGreaterThan(0);
      
      // Suggestions should be actionable
      suggestions.forEach(suggestion => {
        expect(suggestion.message).toBeDefined();
        expect(suggestion.impact).toBeDefined();
        expect(suggestion.category).toBeDefined();
      });
    });

    it('should track performance trends over time', async () => {
      const measurementPeriods = 5;
      const measurements = [];
      
      for (let period = 0; period < measurementPeriods; period++) {
        // Generate activity
        for (let i = 0; i < 20; i++) {
          resourceMonitor.trackAPICall({
            endpoint: '/api/test',
            method: 'GET',
            responseTime: 100 + period * 50, // Increasing response time
            success: true
          });
        }
        
        const usage = resourceMonitor.getCurrentUsage();
        measurements.push({
          period,
          apiCalls: usage.apiCalls.total,
          averageResponseTime: usage.apiCalls.averageResponseTime
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Should show trend data
      expect(measurements.length).toBe(measurementPeriods);
      
      // Response time should show increasing trend
      const firstMeasurement = measurements[0];
      const lastMeasurement = measurements[measurements.length - 1];
      
      expect(lastMeasurement.apiCalls).toBeGreaterThan(firstMeasurement.apiCalls);
    });

    it('should provide performance alerts for critical thresholds', () => {
      // Simulate high resource usage that should trigger alerts
      
      // High API usage
      for (let i = 0; i < 150; i++) {
        resourceMonitor.trackAPICall({
          endpoint: '/api/test',
          method: 'GET',
          responseTime: 100,
          success: true
        });
      }
      
      // High database usage
      resourceMonitor.trackDatabaseOperation('write', 5 * 1024 * 1024); // 5MB
      
      // High subscription count
      resourceMonitor.trackRealtimeSubscription(25);
      
      const alerts = resourceMonitor.getActiveAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      
      // Should have alerts for different resource types
      const alertCategories = new Set(alerts.map(alert => alert.category));
      expect(alertCategories.size).toBeGreaterThan(0);
    });
  });
});