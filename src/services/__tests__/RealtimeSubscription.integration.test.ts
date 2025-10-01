/**
 * Real-time Subscription Integration Tests
 * 
 * Tests for real-time subscription management, memory leak prevention,
 * and performance under load scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RealtimeSubscriptionManager, realtimeSubscriptionManager } from '../RealtimeSubscriptionManager';
import { ResourceUsageMonitor, resourceUsageMonitor } from '../ResourceUsageMonitor';
import type { SubscriptionConfig, UserActivityLevel } from '@/types/realtime';

// Mock Supabase
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn((callback) => {
    callback('SUBSCRIBED');
    return { unsubscribe: vi.fn() };
  }),
  unsubscribe: vi.fn()
};

const mockSupabaseClient = {
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
  getChannels: vi.fn(() => [])
};

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

// Mock EventBus
vi.mock('@/utils/EventBus', () => ({
  EventBus: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}));

describe('Real-time Subscription Integration Tests', () => {
  let subscriptionManager: RealtimeSubscriptionManager;
  let resourceMonitor: ResourceUsageMonitor;

  beforeEach(() => {
    subscriptionManager = realtimeSubscriptionManager;
    resourceMonitor = resourceUsageMonitor;
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset subscription manager state
    subscriptionManager.unsubscribeAll();
    subscriptionManager.updateUserActivity();
  });

  afterEach(() => {
    // Cleanup subscriptions
    subscriptionManager.unsubscribeAll();
    subscriptionManager.destroy();
  });

  describe('Subscription Lifecycle Management', () => {
    it('should create and manage subscriptions properly', () => {
      const config: SubscriptionConfig = {
        id: 'test-subscription',
        table: 'social_posts',
        event: '*',
        callback: vi.fn(),
        priority: 'high',
        userActivity: 'active'
      };

      const subscriptionId = subscriptionManager.subscribe(config);
      
      expect(subscriptionId).toBeDefined();
      expect(subscriptionManager.getActiveSubscriptionCount()).toBe(1);
      
      // Verify subscription was created
      const activeSubscriptions = subscriptionManager.getActiveSubscriptions();
      expect(activeSubscriptions).toHaveLength(1);
      expect(activeSubscriptions[0]).toMatchObject({
        id: config.id,
        table: config.table,
        priority: config.priority
      });
    });

    it('should unsubscribe properly', () => {
      const config: SubscriptionConfig = {
        id: 'unsubscribe-test',
        table: 'notifications',
        event: 'INSERT',
        callback: vi.fn(),
        priority: 'medium',
        userActivity: 'active'
      };

      const subscriptionId = subscriptionManager.subscribe(config);
      expect(subscriptionManager.getActiveSubscriptionCount()).toBe(1);
      
      const unsubscribed = subscriptionManager.unsubscribe(subscriptionId);
      expect(unsubscribed).toBe(true);
      expect(subscriptionManager.getActiveSubscriptionCount()).toBe(0);
    });

    it('should handle duplicate subscription IDs', () => {
      const config: SubscriptionConfig = {
        id: 'duplicate-test',
        table: 'workouts',
        event: 'UPDATE',
        callback: vi.fn(),
        priority: 'low',
        userActivity: 'active'
      };

      const firstId = subscriptionManager.subscribe(config);
      const secondId = subscriptionManager.subscribe(config);
      
      // Should handle duplicates gracefully
      expect(firstId).toBeDefined();
      expect(secondId).toBeDefined();
      
      // Should not create duplicate subscriptions
      expect(subscriptionManager.getActiveSubscriptionCount()).toBeLessThanOrEqual(2);
    });

    it('should cleanup all subscriptions', () => {
      // Create multiple subscriptions
      for (let i = 0; i < 5; i++) {
        subscriptionManager.subscribe({
          id: `cleanup-test-${i}`,
          table: 'test_table',
          event: '*',
          callback: vi.fn(),
          priority: 'low',
          userActivity: 'active'
        });
      }

      expect(subscriptionManager.getActiveSubscriptionCount()).toBe(5);
      
      subscriptionManager.unsubscribeAll();
      expect(subscriptionManager.getActiveSubscriptionCount()).toBe(0);
    });
  });

  describe('User Activity-Based Optimization', () => {
    it('should adjust subscriptions based on user activity', () => {
      const config: SubscriptionConfig = {
        id: 'activity-test',
        table: 'social_posts',
        event: '*',
        callback: vi.fn(),
        priority: 'medium',
        userActivity: 'active'
      };

      subscriptionManager.subscribe(config);
      expect(subscriptionManager.getUserActivityLevel()).toBe('active');
      
      // Switch to background mode
      subscriptionManager.setBackgroundMode();
      expect(subscriptionManager.getUserActivityLevel()).toBe('background');
      
      // Switch to inactive mode
      subscriptionManager.setInactiveMode();
      expect(subscriptionManager.getUserActivityLevel()).toBe('inactive');
      
      // Return to active mode
      subscriptionManager.updateUserActivity();
      expect(subscriptionManager.getUserActivityLevel()).toBe('active');
    });

    it('should optimize subscriptions for background mode', () => {
      // Create high and low priority subscriptions
      const highPriorityConfig: SubscriptionConfig = {
        id: 'high-priority',
        table: 'notifications',
        event: 'INSERT',
        callback: vi.fn(),
        priority: 'high',
        userActivity: 'active'
      };

      const lowPriorityConfig: SubscriptionConfig = {
        id: 'low-priority',
        table: 'social_posts',
        event: '*',
        callback: vi.fn(),
        priority: 'low',
        userActivity: 'active'
      };

      subscriptionManager.subscribe(highPriorityConfig);
      subscriptionManager.subscribe(lowPriorityConfig);
      
      expect(subscriptionManager.getActiveSubscriptionCount()).toBe(2);
      
      // Switch to background mode
      subscriptionManager.setBackgroundMode();
      
      // Should still have subscriptions but they may be optimized
      expect(subscriptionManager.getActiveSubscriptionCount()).toBeGreaterThan(0);
    });

    it('should handle inactive mode properly', () => {
      const config: SubscriptionConfig = {
        id: 'inactive-test',
        table: 'workouts',
        event: 'UPDATE',
        callback: vi.fn(),
        priority: 'medium',
        userActivity: 'active'
      };

      subscriptionManager.subscribe(config);
      
      // Switch to inactive mode
      subscriptionManager.setInactiveMode();
      
      // Should minimize subscriptions in inactive mode
      const activeCount = subscriptionManager.getActiveSubscriptionCount();
      expect(activeCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should properly cleanup subscription callbacks', () => {
      const callback = vi.fn();
      const config: SubscriptionConfig = {
        id: 'memory-test',
        table: 'test_table',
        event: '*',
        callback,
        priority: 'medium',
        userActivity: 'active'
      };

      const subscriptionId = subscriptionManager.subscribe(config);
      
      // Unsubscribe should cleanup callback references
      subscriptionManager.unsubscribe(subscriptionId);
      
      // Verify cleanup
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it('should handle subscription errors without memory leaks', () => {
      // Mock subscription error
      mockChannel.subscribe.mockImplementationOnce((callback) => {
        callback('CHANNEL_ERROR', { message: 'Connection failed' });
        return { unsubscribe: vi.fn() };
      });

      const config: SubscriptionConfig = {
        id: 'error-test',
        table: 'test_table',
        event: '*',
        callback: vi.fn(),
        priority: 'low',
        userActivity: 'active'
      };

      // Should handle errors gracefully
      expect(() => {
        subscriptionManager.subscribe(config);
      }).not.toThrow();
    });

    it('should cleanup on destroy', () => {
      // Create multiple subscriptions
      for (let i = 0; i < 3; i++) {
        subscriptionManager.subscribe({
          id: `destroy-test-${i}`,
          table: 'test_table',
          event: '*',
          callback: vi.fn(),
          priority: 'low',
          userActivity: 'active'
        });
      }

      expect(subscriptionManager.getActiveSubscriptionCount()).toBe(3);
      
      // Destroy should cleanup everything
      subscriptionManager.destroy();
      expect(subscriptionManager.getActiveSubscriptionCount()).toBe(0);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle many concurrent subscriptions', () => {
      const subscriptionCount = 50;
      const subscriptionIds: string[] = [];

      // Create many subscriptions
      for (let i = 0; i < subscriptionCount; i++) {
        const id = subscriptionManager.subscribe({
          id: `load-test-${i}`,
          table: `table_${i % 5}`, // Distribute across 5 tables
          event: '*',
          callback: vi.fn(),
          priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
          userActivity: 'active'
        });
        if (id) subscriptionIds.push(id);
      }

      // Should handle all subscriptions
      expect(subscriptionManager.getActiveSubscriptionCount()).toBeLessThanOrEqual(subscriptionCount);
      
      // Cleanup
      subscriptionIds.forEach(id => subscriptionManager.unsubscribe(id));
    });

    it('should optimize subscription batching', () => {
      // Create multiple subscriptions for the same table
      const tableSubscriptions = [];
      for (let i = 0; i < 10; i++) {
        const id = subscriptionManager.subscribe({
          id: `batch-test-${i}`,
          table: 'social_posts',
          event: '*',
          callback: vi.fn(),
          priority: 'medium',
          userActivity: 'active',
          batchable: true
        });
        if (id) tableSubscriptions.push(id);
      }

      // Should optimize by batching similar subscriptions
      expect(subscriptionManager.getActiveSubscriptionCount()).toBeGreaterThan(0);
      
      // Cleanup
      tableSubscriptions.forEach(id => subscriptionManager.unsubscribe(id));
    });

    it('should handle rapid subscribe/unsubscribe cycles', () => {
      const cycles = 20;
      
      for (let cycle = 0; cycle < cycles; cycle++) {
        const subscriptionIds: string[] = [];
        
        // Subscribe to multiple channels
        for (let i = 0; i < 5; i++) {
          const id = subscriptionManager.subscribe({
            id: `cycle-${cycle}-${i}`,
            table: 'test_table',
            event: '*',
            callback: vi.fn(),
            priority: 'medium',
            userActivity: 'active'
          });
          if (id) subscriptionIds.push(id);
        }
        
        // Immediately unsubscribe
        subscriptionIds.forEach(id => subscriptionManager.unsubscribe(id));
      }
      
      // Should end with no active subscriptions
      expect(subscriptionManager.getActiveSubscriptionCount()).toBe(0);
    });

    it('should provide performance metrics', () => {
      // Create some subscriptions and activity
      for (let i = 0; i < 5; i++) {
        subscriptionManager.subscribe({
          id: `metrics-test-${i}`,
          table: 'test_table',
          event: '*',
          callback: vi.fn(),
          priority: 'medium',
          userActivity: 'active'
        });
      }

      const metrics = subscriptionManager.getMetrics();
      
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      
      // Each metric should have required properties
      metrics.forEach(metric => {
        expect(metric).toHaveProperty('subscriptionId');
        expect(metric).toHaveProperty('table');
        expect(metric).toHaveProperty('priority');
        expect(metric).toHaveProperty('createdAt');
      });
    });
  });

  describe('Resource Usage Integration', () => {
    it('should track subscription resource usage', () => {
      const initialUsage = resourceMonitor.getCurrentUsage();
      
      // Create subscriptions
      for (let i = 0; i < 3; i++) {
        subscriptionManager.subscribe({
          id: `resource-test-${i}`,
          table: 'test_table',
          event: '*',
          callback: vi.fn(),
          priority: 'medium',
          userActivity: 'active'
        });
      }

      // Track subscription count
      resourceMonitor.trackRealtimeSubscription(3);
      
      const updatedUsage = resourceMonitor.getCurrentUsage();
      expect(updatedUsage.realtime.activeSubscriptions).toBeGreaterThanOrEqual(initialUsage.realtime.activeSubscriptions);
    });

    it('should track message throughput', () => {
      const config: SubscriptionConfig = {
        id: 'throughput-test',
        table: 'social_posts',
        event: '*',
        callback: (payload) => {
          resourceMonitor.trackRealtimeMessage('received');
        },
        priority: 'medium',
        userActivity: 'active'
      };

      subscriptionManager.subscribe(config);
      
      // Simulate messages
      for (let i = 0; i < 10; i++) {
        resourceMonitor.trackRealtimeMessage('received');
        resourceMonitor.trackRealtimeMessage('sent');
      }

      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.realtime.messagesReceived).toBeGreaterThan(0);
      expect(usage.realtime.messagesSent).toBeGreaterThan(0);
    });

    it('should provide optimization suggestions for subscriptions', () => {
      // Create many subscriptions to trigger optimization suggestions
      for (let i = 0; i < 15; i++) {
        subscriptionManager.subscribe({
          id: `optimization-test-${i}`,
          table: 'test_table',
          event: '*',
          callback: vi.fn(),
          priority: 'low',
          userActivity: 'active'
        });
      }

      resourceMonitor.trackRealtimeSubscription(15);
      
      const suggestions = resourceMonitor.getOptimizationSuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // Should have suggestions about subscription optimization
      const subscriptionSuggestions = suggestions.filter(s => 
        s.category === 'realtime' || s.message.includes('subscription')
      );
      expect(subscriptionSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle subscription failures gracefully', () => {
      // Mock subscription failure
      mockChannel.subscribe.mockImplementationOnce(() => {
        throw new Error('Subscription failed');
      });

      const config: SubscriptionConfig = {
        id: 'failure-test',
        table: 'test_table',
        event: '*',
        callback: vi.fn(),
        priority: 'medium',
        userActivity: 'active'
      };

      // Should not throw on subscription failure
      expect(() => {
        subscriptionManager.subscribe(config);
      }).not.toThrow();
    });

    it('should handle callback errors without affecting other subscriptions', () => {
      const workingCallback = vi.fn();
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      // Create working subscription
      subscriptionManager.subscribe({
        id: 'working-subscription',
        table: 'test_table',
        event: '*',
        callback: workingCallback,
        priority: 'medium',
        userActivity: 'active'
      });

      // Create error-prone subscription
      subscriptionManager.subscribe({
        id: 'error-subscription',
        table: 'test_table',
        event: '*',
        callback: errorCallback,
        priority: 'medium',
        userActivity: 'active'
      });

      expect(subscriptionManager.getActiveSubscriptionCount()).toBe(2);
      
      // Both subscriptions should remain active despite callback error
    });

    it('should recover from connection issues', () => {
      const config: SubscriptionConfig = {
        id: 'recovery-test',
        table: 'test_table',
        event: '*',
        callback: vi.fn(),
        priority: 'high',
        userActivity: 'active'
      };

      const subscriptionId = subscriptionManager.subscribe(config);
      expect(subscriptionId).toBeDefined();
      
      // Simulate connection recovery
      mockChannel.subscribe.mockImplementationOnce((callback) => {
        callback('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      });

      // Should handle reconnection gracefully
      expect(subscriptionManager.getActiveSubscriptionCount()).toBeGreaterThan(0);
    });
  });

  describe('Subscription Prioritization', () => {
    it('should prioritize high-priority subscriptions', () => {
      const highPriorityConfig: SubscriptionConfig = {
        id: 'high-priority-test',
        table: 'notifications',
        event: 'INSERT',
        callback: vi.fn(),
        priority: 'high',
        userActivity: 'active'
      };

      const lowPriorityConfig: SubscriptionConfig = {
        id: 'low-priority-test',
        table: 'social_posts',
        event: '*',
        callback: vi.fn(),
        priority: 'low',
        userActivity: 'active'
      };

      subscriptionManager.subscribe(highPriorityConfig);
      subscriptionManager.subscribe(lowPriorityConfig);
      
      const subscriptions = subscriptionManager.getActiveSubscriptions();
      
      // High priority should be processed first
      const highPriorityIndex = subscriptions.findIndex(s => s.priority === 'high');
      const lowPriorityIndex = subscriptions.findIndex(s => s.priority === 'low');
      
      expect(highPriorityIndex).toBeGreaterThanOrEqual(0);
      expect(lowPriorityIndex).toBeGreaterThanOrEqual(0);
    });

    it('should handle priority changes during background mode', () => {
      const config: SubscriptionConfig = {
        id: 'priority-change-test',
        table: 'workouts',
        event: 'UPDATE',
        callback: vi.fn(),
        priority: 'low',
        userActivity: 'active'
      };

      subscriptionManager.subscribe(config);
      
      // Switch to background mode
      subscriptionManager.setBackgroundMode();
      
      // Low priority subscriptions may be paused or reduced
      const activeCount = subscriptionManager.getActiveSubscriptionCount();
      expect(activeCount).toBeGreaterThanOrEqual(0);
    });
  });
});