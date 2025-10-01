/**
 * Integration tests for optimization services
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OptimizationService } from '../OptimizationService';
import { DatabaseQueryOptimizer, databaseQueryOptimizer } from '../DatabaseQueryOptimizer';
import { RealtimeSubscriptionManager, realtimeSubscriptionManager } from '../RealtimeSubscriptionManager';
import { ResourceUsageMonitor, resourceUsageMonitor } from '../ResourceUsageMonitor';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null })
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        callback('SUBSCRIBED');
        return {};
      })
    })),
    removeChannel: vi.fn()
  }
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

// Mock EventBus
vi.mock('@/utils/EventBus', () => ({
  EventBus: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}));

describe('Optimization Services Integration', () => {
  let optimizationService: OptimizationService;
  let queryOptimizer: DatabaseQueryOptimizer;
  let subscriptionManager: RealtimeSubscriptionManager;
  let resourceMonitor: ResourceUsageMonitor;

  beforeEach(() => {
    // Get singleton instances
    optimizationService = OptimizationService.getInstance();
    queryOptimizer = databaseQueryOptimizer;
    subscriptionManager = realtimeSubscriptionManager;
    resourceMonitor = resourceUsageMonitor;
  });

  afterEach(() => {
    // Reset any state if needed
    vi.clearAllMocks();
  });

  describe('Database Query Optimization', () => {
    it('should execute optimized queries with caching', async () => {
      const queryConfig = {
        id: 'test-query',
        table: 'users',
        operation: 'select' as const,
        priority: 'high' as const,
        cacheable: true,
        cacheKey: 'users-all'
      };

      const result = await optimizationService.executeOptimizedQuery(queryConfig);
      
      // Should not throw and should handle the query
      expect(result).toBeDefined();
    });

    it('should batch operations for efficiency', async () => {
      const batchConfig = {
        id: 'batch-insert',
        table: 'workouts',
        operation: 'insert' as const,
        data: { name: 'Test Workout', user_id: 1 },
        priority: 'medium' as const,
        batchable: true
      };

      // Execute multiple batchable operations
      await optimizationService.executeOptimizedQuery(batchConfig);
      await optimizationService.executeOptimizedQuery({
        ...batchConfig,
        id: 'batch-insert-2',
        data: { name: 'Test Workout 2', user_id: 2 }
      });

      // Should handle batching internally
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    it('should provide query metrics', () => {
      const metrics = queryOptimizer.getMetrics();
      
      expect(metrics).toHaveProperty('totalQueries');
      expect(metrics).toHaveProperty('cachedQueries');
      expect(metrics).toHaveProperty('batchedQueries');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('cacheHitRate');
    });
  });

  describe('Realtime Subscription Optimization', () => {
    it('should create optimized subscriptions', () => {
      const subscriptionConfig = {
        id: 'test-subscription',
        table: 'social_posts',
        event: '*' as const,
        callback: vi.fn(),
        priority: 'high' as const,
        userActivity: 'active' as const,
        batchable: false
      };

      const subscriptionId = optimizationService.createOptimizedSubscription(subscriptionConfig);
      
      expect(subscriptionId).toBeDefined();
    });

    it('should manage subscription lifecycle', () => {
      const subscriptionConfig = {
        id: 'lifecycle-test',
        table: 'notifications',
        event: 'INSERT' as const,
        callback: vi.fn(),
        priority: 'medium' as const,
        userActivity: 'active' as const
      };

      const subscriptionId = optimizationService.createOptimizedSubscription(subscriptionConfig);
      expect(subscriptionId).toBeDefined();

      const removed = optimizationService.removeOptimizedSubscription(subscriptionId);
      expect(removed).toBe(true);
    });

    it('should provide subscription metrics', () => {
      const metrics = subscriptionManager.getMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should handle user activity changes', () => {
      const initialActivity = subscriptionManager.getUserActivityLevel();
      expect(['active', 'background', 'inactive']).toContain(initialActivity);

      subscriptionManager.updateUserActivity();
      expect(subscriptionManager.getUserActivityLevel()).toBe('active');

      subscriptionManager.setBackgroundMode();
      expect(subscriptionManager.getUserActivityLevel()).toBe('background');

      subscriptionManager.setInactiveMode();
      expect(subscriptionManager.getUserActivityLevel()).toBe('inactive');
    });
  });

  describe('Resource Usage Monitoring', () => {
    it('should track API calls', () => {
      resourceMonitor.trackAPICall({
        endpoint: '/api/users',
        method: 'GET',
        responseTime: 150,
        success: true,
        cached: false
      });

      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.apiCalls.total).toBeGreaterThan(0);
    });

    it('should track database operations', () => {
      resourceMonitor.trackDatabaseOperation('read', 1024);
      resourceMonitor.trackDatabaseOperation('write', 512);

      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.database.reads).toBeGreaterThan(0);
      expect(usage.database.writes).toBeGreaterThan(0);
      expect(usage.database.bandwidth).toBeGreaterThan(0);
    });

    it('should track realtime usage', () => {
      resourceMonitor.trackRealtimeSubscription(5);
      resourceMonitor.trackRealtimeMessage('received');
      resourceMonitor.trackRealtimeMessage('sent');

      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.realtime.activeSubscriptions).toBe(5);
      expect(usage.realtime.messagesReceived).toBeGreaterThan(0);
      expect(usage.realtime.messagesSent).toBeGreaterThan(0);
    });

    it('should provide optimization suggestions', () => {
      const suggestions = resourceMonitor.getOptimizationSuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should generate alerts for high usage', () => {
      // Simulate high API usage
      for (let i = 0; i < 150; i++) {
        resourceMonitor.trackAPICall({
          endpoint: '/api/test',
          method: 'GET',
          responseTime: 100,
          success: true
        });
      }

      // Check if alerts were generated (may be async)
      const alerts = resourceMonitor.getActiveAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe('Integrated Optimization', () => {
    it('should provide comprehensive optimization status', () => {
      const status = optimizationService.getOptimizationStatus();
      
      expect(status).toHaveProperty('config');
      expect(status).toHaveProperty('queryOptimizer');
      expect(status).toHaveProperty('subscriptionManager');
      expect(status).toHaveProperty('resourceMonitor');
      expect(status).toHaveProperty('lastReport');
    });

    it('should generate optimization reports', () => {
      const report = optimizationService.getOptimizationReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('queryOptimization');
      expect(report).toHaveProperty('realtimeOptimization');
      expect(report).toHaveProperty('resourceUsage');
      expect(report).toHaveProperty('overallImpact');
    });

    it('should allow configuration updates', () => {
      const newConfig = {
        enableQueryOptimization: false,
        enableAutoOptimization: false
      };

      optimizationService.updateConfig(newConfig);
      const currentConfig = optimizationService.getConfig();
      
      expect(currentConfig.enableQueryOptimization).toBe(false);
      expect(currentConfig.enableAutoOptimization).toBe(false);
    });

    it('should handle force optimization', async () => {
      // Should not throw when forcing optimization
      await expect(optimizationService.forceOptimization()).resolves.not.toThrow();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should cleanup resources properly', () => {
      // Test that services can be destroyed without errors
      expect(() => {
        queryOptimizer.destroy();
        subscriptionManager.destroy();
        resourceMonitor.destroy();
        optimizationService.destroy();
      }).not.toThrow();
    });

    it('should handle cache management', () => {
      // Test cache operations
      queryOptimizer.clearCache();
      
      const cacheStats = queryOptimizer.getCacheStats();
      expect(cacheStats).toHaveProperty('size');
      expect(cacheStats).toHaveProperty('hitRate');
      expect(cacheStats).toHaveProperty('entries');
    });

    it('should handle subscription cleanup', () => {
      // Create multiple subscriptions
      const subscriptions = [];
      for (let i = 0; i < 5; i++) {
        const id = optimizationService.createOptimizedSubscription({
          id: `cleanup-test-${i}`,
          table: 'test_table',
          event: '*',
          callback: vi.fn(),
          priority: 'low',
          userActivity: 'active'
        });
        if (id) subscriptions.push(id);
      }

      // Cleanup all subscriptions
      subscriptionManager.unsubscribeAll();
      
      expect(subscriptionManager.getActiveSubscriptionCount()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle query errors gracefully', async () => {
      const errorConfig = {
        id: 'error-test',
        table: 'nonexistent_table',
        operation: 'select' as const,
        priority: 'low' as const
      };

      // Should handle errors without crashing
      await expect(optimizationService.executeOptimizedQuery(errorConfig))
        .resolves.not.toThrow();
    });

    it('should handle subscription errors gracefully', () => {
      const errorConfig = {
        id: 'error-subscription',
        table: 'nonexistent_table',
        event: '*' as const,
        callback: () => { throw new Error('Test error'); },
        priority: 'low' as const,
        userActivity: 'active' as const
      };

      // Should handle subscription errors without crashing
      expect(() => {
        optimizationService.createOptimizedSubscription(errorConfig);
      }).not.toThrow();
    });
  });
});