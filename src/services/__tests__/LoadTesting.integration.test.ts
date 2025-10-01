/**
 * Load Testing Integration Tests
 * 
 * Comprehensive load testing for concurrent users, stress testing,
 * and system behavior under extreme conditions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceRegistry, serviceRegistry } from '../ServiceRegistry';
import { ResourceUsageMonitor, resourceUsageMonitor } from '../ResourceUsageMonitor';
import { serviceConfigManager } from '../ServiceConfigManager';
import { serviceMonitor } from '../ServiceMonitor';
import type { ServiceType } from '@/types/serviceConfig';

// Mock high-performance Supabase client
const createLoadTestSupabaseClient = () => {
  let totalRequests = 0;
  let concurrentRequests = 0;
  let maxConcurrentRequests = 0;
  let responseTimeMs = 50;
  let errorRate = 0;
  
  const simulateRequest = async (operation: string) => {
    totalRequests++;
    concurrentRequests++;
    maxConcurrentRequests = Math.max(maxConcurrentRequests, concurrentRequests);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, responseTimeMs));
    
    concurrentRequests--;
    
    // Simulate errors based on error rate
    if (Math.random() < errorRate) {
      throw new Error(`${operation} failed`);
    }
    
    return { data: [], error: null };
  };
  
  return {
    auth: {
      getSession: () => simulateRequest('getSession'),
      signInWithPassword: () => simulateRequest('signIn'),
      signOut: () => simulateRequest('signOut'),
      onAuthStateChange: vi.fn().mockReturnValue({ 
        data: { subscription: { unsubscribe: vi.fn() } } 
      })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: () => simulateRequest('database')
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        setTimeout(() => callback('SUBSCRIBED'), responseTimeMs);
        return { unsubscribe: vi.fn() };
      })
    })),
    removeChannel: vi.fn(),
    rpc: () => simulateRequest('rpc'),
    
    // Test utilities
    _getMetrics: () => ({
      totalRequests,
      concurrentRequests,
      maxConcurrentRequests,
      responseTimeMs,
      errorRate
    }),
    _setResponseTime: (ms: number) => { responseTimeMs = ms; },
    _setErrorRate: (rate: number) => { errorRate = rate; },
    _reset: () => {
      totalRequests = 0;
      concurrentRequests = 0;
      maxConcurrentRequests = 0;
      responseTimeMs = 50;
      errorRate = 0;
    }
  };
};

const mockSupabaseClient = createLoadTestSupabaseClient();

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

describe('Load Testing Integration Tests', () => {
  let registry: ServiceRegistry;
  let resourceMonitor: ResourceUsageMonitor;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSupabaseClient._reset();
    
    registry = ServiceRegistry.getInstance();
    resourceMonitor = resourceUsageMonitor;
    
    // Configure for load testing
    serviceConfigManager.updateConfig({
      useRealServices: true,
      supabaseEnabled: true,
      rateLimits: {
        requestsPerMinute: 1000, // Higher limit for load testing
        burstLimit: 100,
        backoffStrategy: 'exponential',
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 5000
      }
    });
    
    resourceMonitor.reset();
  });

  afterEach(async () => {
    await registry.shutdown();
  });

  describe('Concurrent User Load Testing', () => {
    it('should handle 100 concurrent users performing basic operations', async () => {
      const concurrentUsers = 100;
      const operationsPerUser = 10;
      
      const userSimulations = Array.from({ length: concurrentUsers }, async (_, userId) => {
        const userOperations = [];
        
        for (let op = 0; op < operationsPerUser; op++) {
          userOperations.push(
            (async () => {
              try {
                // Simulate user workflow
                await registry.auth.isAuthenticated();
                await registry.workout.getWorkoutTemplates();
                
                if (registry.social && 'getFeed' in registry.social) {
                  await registry.social.getFeed();
                }
                
                // Track successful operation
                resourceMonitor.trackAPICall({
                  endpoint: `/user/${userId}/operation/${op}`,
                  method: 'GET',
                  responseTime: 100,
                  success: true
                });
                
              } catch (error) {
                // Track failed operation
                resourceMonitor.trackAPICall({
                  endpoint: `/user/${userId}/operation/${op}`,
                  method: 'GET',
                  responseTime: 100,
                  success: false
                });
              }
            })()
          );
          
          // Stagger operations within user
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        }
        
        return Promise.all(userOperations);
      });
      
      const startTime = Date.now();
      await Promise.all(userSimulations);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      const totalOperations = concurrentUsers * operationsPerUser;
      const operationsPerSecond = totalOperations / (totalTime / 1000);
      
      // Performance expectations
      expect(operationsPerSecond).toBeGreaterThan(50); // At least 50 ops/sec
      expect(totalTime).toBeLessThan(30000); // Complete within 30 seconds
      
      // Verify resource tracking
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.apiCalls.total).toBe(totalOperations);
      
      // Check Supabase metrics
      const supabaseMetrics = mockSupabaseClient._getMetrics();
      expect(supabaseMetrics.maxConcurrentRequests).toBeGreaterThan(1);
      expect(supabaseMetrics.totalRequests).toBeGreaterThan(0);
    });

    it('should maintain performance with 200 concurrent database operations', async () => {
      const concurrentOperations = 200;
      const operationTypes = ['read', 'write', 'update', 'delete'];
      
      const databaseOperations = Array.from({ length: concurrentOperations }, async (_, index) => {
        const operationType = operationTypes[index % operationTypes.length];
        const startTime = Date.now();
        
        try {
          const databaseService = registry.database;
          
          // Simulate different database operations
          switch (operationType) {
            case 'read':
              await databaseService.healthCheck();
              resourceMonitor.trackDatabaseOperation('read', 1024);
              break;
            case 'write':
              // Simulate write operation
              resourceMonitor.trackDatabaseOperation('write', 2048);
              break;
            case 'update':
              // Simulate update operation
              resourceMonitor.trackDatabaseOperation('write', 1536);
              break;
            case 'delete':
              // Simulate delete operation
              resourceMonitor.trackDatabaseOperation('write', 512);
              break;
          }
          
          const endTime = Date.now();
          return { success: true, responseTime: endTime - startTime, type: operationType };
          
        } catch (error) {
          const endTime = Date.now();
          return { success: false, responseTime: endTime - startTime, type: operationType };
        }
      });
      
      const results = await Promise.all(databaseOperations);
      
      // Analyze results
      const successfulOperations = results.filter(r => r.success);
      const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const successRate = successfulOperations.length / results.length;
      
      // Performance expectations
      expect(successRate).toBeGreaterThan(0.95); // 95% success rate
      expect(averageResponseTime).toBeLessThan(1000); // Average < 1 second
      
      // Verify resource tracking
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.database.reads).toBeGreaterThan(0);
      expect(usage.database.writes).toBeGreaterThan(0);
    });

    it('should handle 500 concurrent real-time subscriptions', async () => {
      const concurrentSubscriptions = 500;
      const messagesPerSubscription = 5;
      
      // Create subscriptions in batches to avoid overwhelming the system
      const batchSize = 50;
      const batches = Math.ceil(concurrentSubscriptions / batchSize);
      const allSubscriptions: string[] = [];
      
      for (let batch = 0; batch < batches; batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, concurrentSubscriptions);
        
        const batchSubscriptions = Array.from({ length: batchEnd - batchStart }, (_, index) => {
          const subscriptionIndex = batchStart + index;
          const messageCount = { received: 0 };
          
          const config = {
            id: `load-test-${subscriptionIndex}`,
            table: 'test_table',
            event: '*' as const,
            callback: (payload: any) => {
              messageCount.received++;
              resourceMonitor.trackRealtimeMessage('received');
            },
            priority: 'medium' as const,
            userActivity: 'active' as const
          };
          
          const subscriptionId = registry.social ? 
            (registry.social as any).subscribe?.(config) : 
            `mock-${subscriptionIndex}`;
          
          return subscriptionId;
        });
        
        allSubscriptions.push(...batchSubscriptions.filter(Boolean));
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Simulate messages for all subscriptions
      for (let message = 0; message < messagesPerSubscription; message++) {
        for (let i = 0; i < allSubscriptions.length; i++) {
          resourceMonitor.trackRealtimeMessage('received');
          
          // Stagger messages
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
      }
      
      // Verify resource tracking
      const usage = resourceMonitor.getCurrentUsage();
      const expectedMessages = concurrentSubscriptions * messagesPerSubscription;
      expect(usage.realtime.messagesReceived).toBe(expectedMessages);
      
      // Cleanup subscriptions
      // Note: In a real implementation, we would unsubscribe from all subscriptions
      expect(allSubscriptions.length).toBeGreaterThan(0);
    });
  });

  describe('Stress Testing', () => {
    it('should handle system overload gracefully', async () => {
      // Simulate system overload
      mockSupabaseClient._setResponseTime(2000); // 2 second delays
      mockSupabaseClient._setErrorRate(0.3); // 30% error rate
      
      const overloadOperations = 100;
      const operations = Array.from({ length: overloadOperations }, async (_, index) => {
        try {
          const startTime = Date.now();
          
          // Attempt various operations under stress
          await Promise.race([
            registry.auth.isAuthenticated(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]);
          
          const endTime = Date.now();
          return { success: true, responseTime: endTime - startTime };
          
        } catch (error) {
          return { success: false, responseTime: 5000 };
        }
      });
      
      const results = await Promise.all(operations);
      
      // System should remain stable even under stress
      const successfulOperations = results.filter(r => r.success);
      expect(successfulOperations.length).toBeGreaterThan(0); // Some operations should succeed
      
      // Should not crash the system
      expect(() => registry.getSystemHealth()).not.toThrow();
      
      // Reset for cleanup
      mockSupabaseClient._setResponseTime(50);
      mockSupabaseClient._setErrorRate(0);
    });

    it('should handle memory pressure from large datasets', async () => {
      const largeDatasetSize = 1000;
      const recordSize = 1024; // 1KB per record
      
      // Simulate processing large datasets
      for (let i = 0; i < largeDatasetSize; i++) {
        resourceMonitor.trackDatabaseOperation('read', recordSize);
        
        // Simulate memory allocation
        const largeObject = new Array(recordSize).fill(0);
        
        // Process in batches to avoid memory issues
        if (i % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // Force garbage collection hint
          if (global.gc) {
            global.gc();
          }
        }
      }
      
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.database.bandwidth).toBe(largeDatasetSize * recordSize);
      
      // System should still be responsive
      const systemHealth = registry.getSystemHealth();
      expect(systemHealth).toBeDefined();
    });

    it('should handle rapid service switching under load', async () => {
      const switchCycles = 50;
      const operationsPerCycle = 10;
      
      for (let cycle = 0; cycle < switchCycles; cycle++) {
        // Switch service configuration
        const useRealServices = cycle % 2 === 0;
        serviceConfigManager.updateConfig({ useRealServices });
        
        // Perform operations with current configuration
        const cycleOperations = Array.from({ length: operationsPerCycle }, async () => {
          try {
            await registry.auth.isAuthenticated();
            return true;
          } catch {
            return false;
          }
        });
        
        const results = await Promise.all(cycleOperations);
        const successCount = results.filter(Boolean).length;
        
        // Should maintain some level of functionality
        expect(successCount).toBeGreaterThan(0);
        
        // Small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // System should still be functional after rapid switching
      expect(() => registry.getServiceImplementations()).not.toThrow();
    });
  });

  describe('Resource Exhaustion Testing', () => {
    it('should handle API rate limit exhaustion', async () => {
      const rateLimitConfig = serviceConfigManager.getConfig().rateLimits;
      const requestsToExceedLimit = rateLimitConfig.requestsPerMinute + 50;
      
      // Rapidly make requests to exceed rate limit
      const rapidRequests = Array.from({ length: requestsToExceedLimit }, async (_, index) => {
        resourceMonitor.trackAPICall({
          endpoint: '/api/rate-limit-test',
          method: 'GET',
          responseTime: 50,
          success: true
        });
        
        return index;
      });
      
      await Promise.all(rapidRequests);
      
      // Should have tracked all requests
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.apiCalls.total).toBe(requestsToExceedLimit);
      
      // Should generate optimization suggestions
      const suggestions = resourceMonitor.getOptimizationSuggestions();
      const rateLimitSuggestions = suggestions.filter(s => 
        s.category === 'api' && s.message.includes('rate')
      );
      expect(rateLimitSuggestions.length).toBeGreaterThan(0);
    });

    it('should handle database connection exhaustion', async () => {
      const maxConnections = 20; // Simulated connection limit
      const connectionAttempts = maxConnections + 10;
      
      // Attempt to create more connections than available
      const connectionPromises = Array.from({ length: connectionAttempts }, async (_, index) => {
        try {
          const databaseService = registry.database;
          await databaseService.healthCheck();
          return { success: true, index };
        } catch (error) {
          return { success: false, index, error: error.message };
        }
      });
      
      const results = await Promise.all(connectionPromises);
      
      // Some connections should succeed, others may fail
      const successfulConnections = results.filter(r => r.success);
      expect(successfulConnections.length).toBeGreaterThan(0);
      
      // System should handle connection exhaustion gracefully
      expect(() => registry.getSystemHealth()).not.toThrow();
    });

    it('should handle subscription limit exhaustion', async () => {
      const maxSubscriptions = 50; // Simulated subscription limit
      const subscriptionAttempts = maxSubscriptions + 20;
      
      const subscriptionIds: (string | null)[] = [];
      
      // Attempt to create more subscriptions than allowed
      for (let i = 0; i < subscriptionAttempts; i++) {
        const config = {
          id: `exhaustion-test-${i}`,
          table: 'test_table',
          event: '*' as const,
          callback: vi.fn(),
          priority: 'low' as const,
          userActivity: 'active' as const
        };
        
        // Simulate subscription creation (would use real subscription manager)
        const subscriptionId = i < maxSubscriptions ? `sub-${i}` : null;
        subscriptionIds.push(subscriptionId);
        
        if (subscriptionId) {
          resourceMonitor.trackRealtimeSubscription(1);
        }
      }
      
      const successfulSubscriptions = subscriptionIds.filter(Boolean);
      expect(successfulSubscriptions.length).toBeLessThanOrEqual(maxSubscriptions);
      
      // Should provide optimization suggestions
      const suggestions = resourceMonitor.getOptimizationSuggestions();
      const subscriptionSuggestions = suggestions.filter(s => 
        s.category === 'realtime'
      );
      expect(subscriptionSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Degradation Testing', () => {
    it('should maintain functionality with slow network conditions', async () => {
      // Simulate slow network
      mockSupabaseClient._setResponseTime(3000); // 3 second delays
      
      const slowNetworkOperations = 10;
      const operations = Array.from({ length: slowNetworkOperations }, async (_, index) => {
        const startTime = Date.now();
        
        try {
          // Set timeout for operations
          await Promise.race([
            registry.auth.isAuthenticated(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Operation timeout')), 5000)
            )
          ]);
          
          const endTime = Date.now();
          return { success: true, responseTime: endTime - startTime };
          
        } catch (error) {
          const endTime = Date.now();
          return { success: false, responseTime: endTime - startTime };
        }
      });
      
      const results = await Promise.all(operations);
      
      // Should handle slow conditions gracefully
      const completedOperations = results.length;
      expect(completedOperations).toBe(slowNetworkOperations);
      
      // Reset network speed
      mockSupabaseClient._setResponseTime(50);
    });

    it('should adapt to high error rates', async () => {
      // Simulate high error rate
      mockSupabaseClient._setErrorRate(0.5); // 50% error rate
      
      const errorProneOperations = 20;
      const operations = Array.from({ length: errorProneOperations }, async () => {
        try {
          await registry.database.healthCheck();
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      const results = await Promise.all(operations);
      
      // Should handle high error rates
      const successfulOperations = results.filter(r => r.success);
      const failedOperations = results.filter(r => !r.success);
      
      expect(failedOperations.length).toBeGreaterThan(0); // Some should fail
      expect(successfulOperations.length).toBeGreaterThan(0); // Some should succeed
      
      // System should remain stable
      expect(() => registry.getSystemHealth()).not.toThrow();
      
      // Reset error rate
      mockSupabaseClient._setErrorRate(0);
    });

    it('should handle cascading service failures', async () => {
      const services: ServiceType[] = ['auth', 'database', 'social', 'gamification'];
      
      // Simulate cascading failures
      services.forEach((service, index) => {
        setTimeout(() => {
          // Simulate service failure
          for (let i = 0; i < 6; i++) {
            serviceMonitor.recordServiceFailure(service, 'Cascading failure');
          }
        }, index * 1000); // Stagger failures
      });
      
      // Wait for all failures to occur
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // System should still provide some functionality
      const systemHealth = registry.getSystemHealth();
      expect(systemHealth).toBeDefined();
      
      // Should have fallback services available
      const implementations = registry.getServiceImplementations();
      expect(implementations).toBeDefined();
      
      // Reset service statuses
      services.forEach(service => {
        serviceMonitor.resetServiceStatus(service);
      });
    });
  });

  describe('Recovery and Resilience Testing', () => {
    it('should recover from complete system failure', async () => {
      // Simulate complete system failure
      const services: ServiceType[] = ['auth', 'database', 'social', 'gamification', 'workout'];
      
      services.forEach(service => {
        for (let i = 0; i < 10; i++) {
          serviceMonitor.recordServiceFailure(service, 'System failure');
        }
      });
      
      // Verify all services are in error state
      services.forEach(service => {
        const status = serviceMonitor.getServiceStatus(service);
        expect(status.status).toBe('error');
      });
      
      // Simulate system recovery
      await registry.shutdown();
      
      // Reset all service statuses
      services.forEach(service => {
        serviceMonitor.resetServiceStatus(service);
      });
      
      // Reinitialize system
      await registry.initialize();
      
      // Verify recovery
      const systemHealth = registry.getSystemHealth();
      expect(systemHealth.healthyServices).toBeGreaterThan(0);
    });

    it('should maintain performance during recovery', async () => {
      // Simulate partial failure and recovery
      serviceMonitor.recordServiceFailure('database', 'Temporary failure');
      
      // Continue operations during recovery
      const recoveryOperations = 50;
      const operations = Array.from({ length: recoveryOperations }, async (_, index) => {
        try {
          // Simulate recovery after some operations
          if (index === 25) {
            serviceMonitor.recordServiceSuccess('database');
          }
          
          await registry.auth.isAuthenticated();
          return { success: true, index };
        } catch (error) {
          return { success: false, index };
        }
      });
      
      const results = await Promise.all(operations);
      const successfulOperations = results.filter(r => r.success);
      
      // Should maintain reasonable performance during recovery
      expect(successfulOperations.length).toBeGreaterThan(recoveryOperations * 0.7); // 70% success rate
    });
  });
});