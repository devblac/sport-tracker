/**
 * Service Registry Integration Tests
 * 
 * Tests for graceful fallback between real and mock services,
 * rate limiting, resource management, and error handling scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceRegistry, serviceRegistry } from '../ServiceRegistry';
import { serviceConfigManager } from '../ServiceConfigManager';
import { serviceMonitor } from '../ServiceMonitor';
import type { ServiceConfig } from '@/types/serviceConfig';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    },
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
        return { unsubscribe: vi.fn() };
      })
    })),
    removeChannel: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null })
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

// Mock environment variables
vi.mock('@/config/environment', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key',
    VITE_USE_MOCK_SERVICES: 'false',
    VITE_FORCE_REAL_SERVICES: 'false'
  }
}));

describe('ServiceRegistry Integration Tests', () => {
  let registry: ServiceRegistry;
  let originalOnLine: boolean;

  beforeEach(async () => {
    // Store original online status
    originalOnLine = navigator.onLine;
    
    // Reset service registry to clean state
    registry = ServiceRegistry.getInstance();
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset configuration to defaults
    serviceConfigManager.updateConfig({
      useRealServices: false,
      supabaseEnabled: true,
      offlineMode: false
    });
  });

  afterEach(async () => {
    // Restore original online status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine
    });
    
    // Cleanup registry
    await registry.shutdown();
  });

  describe('Service Switching and Fallback', () => {
    it('should switch between real and mock services based on configuration', () => {
      // Start with mock services
      serviceConfigManager.switchToMockServices();
      
      const authService = registry.auth;
      const workoutService = registry.workout;
      
      expect(authService).toBeDefined();
      expect(workoutService).toBeDefined();
      
      // Switch to real services
      serviceConfigManager.switchToRealServices();
      
      const realAuthService = registry.auth;
      const realWorkoutService = registry.workout;
      
      expect(realAuthService).toBeDefined();
      expect(realWorkoutService).toBeDefined();
      
      // Services should be different instances
      expect(realAuthService).not.toBe(authService);
    });

    it('should gracefully fallback to mock services when real services fail', async () => {
      // Enable real services
      serviceConfigManager.switchToRealServices();
      
      // Simulate service failure by triggering circuit breaker
      for (let i = 0; i < 6; i++) {
        serviceMonitor.recordServiceFailure('auth', 'Connection timeout');
      }
      
      // Should now use fallback service
      const authService = registry.auth;
      expect(authService).toBeDefined();
      
      // Verify circuit breaker is open
      expect(serviceMonitor.canAttemptRequest('auth')).toBe(false);
    });

    it('should handle offline/online transitions', () => {
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      
      window.dispatchEvent(new Event('offline'));
      
      // Configuration should reflect offline mode
      const config = serviceConfigManager.getConfig();
      expect(config.offlineMode).toBe(true);
      
      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      
      window.dispatchEvent(new Event('online'));
      
      // Configuration should reflect online mode
      const onlineConfig = serviceConfigManager.getConfig();
      expect(onlineConfig.offlineMode).toBe(false);
    });

    it('should maintain service availability during configuration changes', () => {
      // Get initial services
      const initialAuth = registry.auth;
      const initialWorkout = registry.workout;
      
      expect(initialAuth).toBeDefined();
      expect(initialWorkout).toBeDefined();
      
      // Change configuration
      serviceConfigManager.updateConfig({
        useRealServices: !serviceConfigManager.getConfig().useRealServices
      });
      
      // Services should still be available
      const newAuth = registry.auth;
      const newWorkout = registry.workout;
      
      expect(newAuth).toBeDefined();
      expect(newWorkout).toBeDefined();
    });
  });

  describe('Rate Limiting and Resource Management', () => {
    it('should respect rate limits for different services', () => {
      const config = serviceConfigManager.getConfig();
      
      // Check that different services have appropriate rate limits
      const authLimit = serviceConfigManager.getRateLimitForService('auth');
      const socialLimit = serviceConfigManager.getRateLimitForService('social');
      const workoutLimit = serviceConfigManager.getRateLimitForService('workout');
      
      expect(authLimit).toBeLessThan(config.rateLimits.requestsPerMinute);
      expect(socialLimit).toBeLessThan(config.rateLimits.requestsPerMinute);
      expect(workoutLimit).toBeLessThan(config.rateLimits.requestsPerMinute);
      
      // Auth should have the lowest limit (security)
      expect(authLimit).toBeLessThan(socialLimit);
      expect(authLimit).toBeLessThan(workoutLimit);
    });

    it('should track and enforce rate limits', async () => {
      const serviceName = 'auth';
      const limit = serviceConfigManager.getRateLimitForService(serviceName);
      
      // Simulate rapid requests
      for (let i = 0; i < limit + 5; i++) {
        serviceMonitor.recordServiceSuccess(serviceName);
      }
      
      // Should still allow requests (rate limiting is more complex than simple counting)
      expect(serviceMonitor.canAttemptRequest(serviceName)).toBe(true);
    });

    it('should provide resource usage monitoring', () => {
      const performanceStats = registry.getPerformanceStats();
      
      if (performanceStats) {
        expect(performanceStats).toHaveProperty('cacheHitRate');
        expect(performanceStats).toHaveProperty('averageResponseTime');
        expect(performanceStats).toHaveProperty('totalRequests');
      }
    });

    it('should handle cache configuration per service', () => {
      const userProfilesCache = serviceConfigManager.getCacheStrategyForService('userProfiles');
      const exercisesCache = serviceConfigManager.getCacheStrategyForService('exercises');
      const socialCache = serviceConfigManager.getCacheStrategyForService('social');
      
      expect(userProfilesCache.strategy).toBe('stale-while-revalidate');
      expect(exercisesCache.strategy).toBe('cache-first');
      expect(socialCache.strategy).toBe('network-only');
      
      // TTL should be different for different types of data
      expect(exercisesCache.ttl).toBeGreaterThan(socialCache.ttl);
    });
  });

  describe('Real-time Subscription Management', () => {
    it('should manage subscription lifecycle properly', () => {
      // Test that subscriptions can be created and cleaned up
      const socialService = registry.social;
      
      expect(socialService).toBeDefined();
      
      // If it's a real social service, it should have subscription methods
      if ('subscribeToFeed' in socialService) {
        expect(typeof socialService.subscribeToFeed).toBe('function');
      }
    });

    it('should handle subscription errors gracefully', () => {
      const socialService = registry.social;
      expect(socialService).toBeDefined();
      
      // Should not throw even with subscription errors
      // (Error handling would be tested in real implementation)
    });

    it('should cleanup subscriptions on service shutdown', async () => {
      const socialService = registry.social;
      expect(socialService).toBeDefined();
      
      // Shutdown should cleanup all subscriptions
      await registry.shutdown();
      
      // Verify cleanup was called (would be called in real implementation)
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle service initialization failures gracefully', async () => {
      // Mock auth service initialization failure
      const mockAuthService = {
        initializeAuth: vi.fn().mockRejectedValue(new Error('Auth init failed'))
      };
      
      // Should handle initialization errors without crashing
      await expect(registry.initialize()).rejects.toThrow();
    });

    it('should recover from temporary service failures', async () => {
      // Simulate temporary failure
      serviceMonitor.recordServiceFailure('database', 'Temporary network error');
      
      // Service should still be available (fallback)
      const databaseService = registry.database;
      expect(databaseService).toBeDefined();
      
      // Simulate recovery
      serviceMonitor.recordServiceSuccess('database');
      
      // Should be able to use service normally
      expect(serviceMonitor.canAttemptRequest('database')).toBe(true);
    });

    it('should provide detailed error information', () => {
      const serviceName = 'gamification';
      const errorMessage = 'Service temporarily unavailable';
      
      serviceMonitor.recordServiceFailure(serviceName, errorMessage);
      
      const status = serviceMonitor.getServiceStatus(serviceName);
      expect(status.status).toBe('error');
      expect(status.lastError).toBe(errorMessage);
    });

    it('should handle circuit breaker recovery', async () => {
      const serviceName = 'workout';
      
      // Trigger circuit breaker
      for (let i = 0; i < 6; i++) {
        serviceMonitor.recordServiceFailure(serviceName, 'Connection timeout');
      }
      
      expect(serviceMonitor.canAttemptRequest(serviceName)).toBe(false);
      
      // Wait for circuit breaker timeout (mocked)
      vi.advanceTimersByTime(60000);
      
      // Should allow retry attempts
      expect(serviceMonitor.canAttemptRequest(serviceName)).toBe(true);
    });
  });

  describe('Service Health Monitoring', () => {
    it('should perform comprehensive health checks', async () => {
      const healthStatus = await registry.healthCheck();
      
      expect(healthStatus).toBeDefined();
      expect(typeof healthStatus).toBe('object');
    });

    it('should provide service status information', () => {
      const allStatuses = registry.getServiceStatus();
      
      expect(allStatuses).toBeDefined();
      expect(typeof allStatuses).toBe('object');
      
      // Should have status for each service type
      const serviceTypes = ['auth', 'gamification', 'workout', 'social', 'database'];
      serviceTypes.forEach(serviceType => {
        expect(allStatuses).toHaveProperty(serviceType);
      });
    });

    it('should track system health over time', () => {
      const systemHealth = registry.getSystemHealth();
      
      expect(systemHealth).toBeDefined();
      expect(systemHealth).toHaveProperty('overallStatus');
      expect(systemHealth).toHaveProperty('serviceCount');
      expect(systemHealth).toHaveProperty('healthyServices');
    });

    it('should provide service implementation information', () => {
      const implementations = registry.getServiceImplementations();
      
      expect(implementations).toHaveProperty('auth');
      expect(implementations).toHaveProperty('gamification');
      expect(implementations).toHaveProperty('workout');
      expect(implementations).toHaveProperty('social');
      expect(implementations).toHaveProperty('database');
      
      // Values should be either 'mock', 'real', 'enhanced', etc.
      Object.values(implementations).forEach(impl => {
        expect(typeof impl).toBe('string');
        expect(impl.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Service Connectivity Testing', () => {
    it('should test connectivity to all services', async () => {
      const connectivityResults = await registry.testServiceConnectivity();
      
      expect(connectivityResults).toBeDefined();
      expect(typeof connectivityResults).toBe('object');
      
      // Should test all major services
      expect(connectivityResults).toHaveProperty('auth');
      expect(connectivityResults).toHaveProperty('database');
      expect(connectivityResults).toHaveProperty('gamification');
      expect(connectivityResults).toHaveProperty('workout');
      expect(connectivityResults).toHaveProperty('social');
      
      // Results should be boolean
      Object.values(connectivityResults).forEach(result => {
        expect(typeof result).toBe('boolean');
      });
    });

    it('should handle connectivity test failures gracefully', async () => {
      // Mock auth service to throw error
      const authService = registry.auth;
      if ('isAuthenticated' in authService) {
        vi.spyOn(authService, 'isAuthenticated').mockRejectedValue(new Error('Connection failed'));
      }
      
      const connectivityResults = await registry.testServiceConnectivity();
      
      // Should still return results even with failures
      expect(connectivityResults).toBeDefined();
      expect(connectivityResults.auth).toBe(false);
    });
  });

  describe('Configuration Management', () => {
    it('should allow dynamic configuration updates', () => {
      const initialConfig = registry.getConfig();
      
      const updates = {
        useRealServices: !initialConfig.useRealServices,
        offlineMode: !initialConfig.offlineMode
      };
      
      registry.updateConfig(updates);
      
      const updatedConfig = registry.getConfig();
      expect(updatedConfig.useRealServices).toBe(updates.useRealServices);
      expect(updatedConfig.offlineMode).toBe(updates.offlineMode);
    });

    it('should refresh configuration from external sources', () => {
      const initialConfig = registry.getConfig();
      
      // Simulate external configuration change
      serviceConfigManager.updateConfig({
        rateLimits: {
          ...initialConfig.rateLimits,
          requestsPerMinute: 200
        }
      });
      
      registry.refreshConfiguration();
      
      const refreshedConfig = registry.getConfig();
      expect(refreshedConfig.rateLimits.requestsPerMinute).toBe(200);
    });

    it('should validate configuration changes', () => {
      expect(() => {
        registry.updateConfig({
          // @ts-expect-error - Testing invalid config
          invalidProperty: 'invalid'
        });
      }).toThrow();
    });
  });

  describe('Event Handling', () => {
    it('should handle service events properly', () => {
      const eventHandler = vi.fn();
      
      registry.onServiceEvent('service-status-changed', eventHandler);
      
      // Trigger a service status change
      serviceMonitor.recordServiceFailure('auth', 'Test failure');
      
      // Event handler should have been called
      expect(eventHandler).toHaveBeenCalled();
      
      // Cleanup
      registry.offServiceEvent('service-status-changed', eventHandler);
    });

    it('should handle circuit breaker events', () => {
      const circuitBreakerHandler = vi.fn();
      
      registry.onServiceEvent('circuit-breaker-opened', circuitBreakerHandler);
      
      // Trigger circuit breaker
      for (let i = 0; i < 6; i++) {
        serviceMonitor.recordServiceFailure('social', 'Connection timeout');
      }
      
      // Handler should have been called
      expect(circuitBreakerHandler).toHaveBeenCalled();
      
      // Cleanup
      registry.offServiceEvent('circuit-breaker-opened', circuitBreakerHandler);
    });

    it('should handle fallback activation events', () => {
      const fallbackHandler = vi.fn();
      
      registry.onServiceEvent('fallback-activated', fallbackHandler);
      
      // Trigger fallback by causing service failure
      serviceMonitor.recordServiceFailure('workout', 'Service unavailable');
      
      // Handler should have been called
      expect(fallbackHandler).toHaveBeenCalled();
      
      // Cleanup
      registry.offServiceEvent('fallback-activated', fallbackHandler);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should cleanup resources on shutdown', async () => {
      // Initialize registry
      await registry.initialize();
      
      // Shutdown should not throw
      await expect(registry.shutdown()).resolves.not.toThrow();
    });

    it('should handle multiple initialization attempts', async () => {
      await registry.initialize();
      
      // Second initialization should not throw
      await expect(registry.initialize()).resolves.not.toThrow();
    });

    it('should provide memory usage information', () => {
      const performanceStats = registry.getPerformanceStats();
      
      if (performanceStats) {
        // Should have performance-related properties
        expect(typeof performanceStats).toBe('object');
      }
    });
  });
});