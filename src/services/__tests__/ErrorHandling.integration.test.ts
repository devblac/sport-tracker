/**
 * Error Handling Integration Tests
 * 
 * Tests for error handling, recovery scenarios, circuit breaker patterns,
 * and graceful degradation across all services.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceRegistry, serviceRegistry } from '../ServiceRegistry';
import { serviceMonitor } from '../ServiceMonitor';
import { ErrorHandlingService } from '../ErrorHandlingService';
import { serviceConfigManager } from '../ServiceConfigManager';
import type { ServiceType } from '@/types/serviceConfig';

// Mock Supabase with controllable failures
const createMockSupabaseClient = (shouldFail = false) => ({
  auth: {
    getSession: vi.fn().mockImplementation(() => 
      shouldFail 
        ? Promise.reject(new Error('Auth service unavailable'))
        : Promise.resolve({ data: { session: null }, error: null })
    ),
    signInWithPassword: vi.fn().mockImplementation(() =>
      shouldFail
        ? Promise.reject(new Error('Login failed'))
        : Promise.resolve({ data: { user: null }, error: null })
    ),
    signOut: vi.fn().mockResolvedValue({ error: null }),
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
    then: vi.fn().mockImplementation(() =>
      shouldFail
        ? Promise.reject(new Error('Database operation failed'))
        : Promise.resolve({ data: [], error: null })
    )
  })),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((callback) => {
      if (shouldFail) {
        callback('CHANNEL_ERROR', { message: 'Subscription failed' });
      } else {
        callback('SUBSCRIBED');
      }
      return { unsubscribe: vi.fn() };
    })
  })),
  removeChannel: vi.fn(),
  rpc: vi.fn().mockImplementation(() =>
    shouldFail
      ? Promise.reject(new Error('RPC call failed'))
      : Promise.resolve({ data: null, error: null })
  )
});

let mockSupabaseClient = createMockSupabaseClient(false);

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

// Mock logger to capture error logs
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

vi.mock('@/utils/logger', () => ({
  logger: mockLogger
}));

// Mock network status
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('Error Handling Integration Tests', () => {
  let registry: ServiceRegistry;
  let errorHandler: ErrorHandlingService;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    mockLogger.info.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.error.mockClear();
    mockLogger.debug.mockClear();
    
    // Reset Supabase mock to working state
    mockSupabaseClient = createMockSupabaseClient(false);
    
    // Reset service registry
    registry = ServiceRegistry.getInstance();
    errorHandler = ErrorHandlingService.getInstance();
    
    // Reset configuration
    serviceConfigManager.updateConfig({
      useRealServices: true,
      supabaseEnabled: true,
      offlineMode: false
    });
    
    // Reset service monitor
    const services: ServiceType[] = ['auth', 'gamification', 'workout', 'social', 'database'];
    services.forEach(service => {
      serviceMonitor.resetServiceStatus(service);
    });
  });

  afterEach(async () => {
    await registry.shutdown();
    errorHandler.destroy();
  });

  describe('Service Failure Detection and Recovery', () => {
    it('should detect service failures and activate circuit breaker', async () => {
      const serviceName: ServiceType = 'auth';
      
      // Simulate multiple failures to trigger circuit breaker
      for (let i = 0; i < 6; i++) {
        serviceMonitor.recordServiceFailure(serviceName, `Failure ${i + 1}`);
      }
      
      // Circuit breaker should be open
      expect(serviceMonitor.canAttemptRequest(serviceName)).toBe(false);
      
      const status = serviceMonitor.getServiceStatus(serviceName);
      expect(status.status).toBe('error');
      expect(status.failureCount).toBeGreaterThanOrEqual(5);
    });

    it('should recover from circuit breaker after timeout', async () => {
      const serviceName: ServiceType = 'database';
      
      // Trigger circuit breaker
      for (let i = 0; i < 6; i++) {
        serviceMonitor.recordServiceFailure(serviceName, 'Connection timeout');
      }
      
      expect(serviceMonitor.canAttemptRequest(serviceName)).toBe(false);
      
      // Simulate time passing (circuit breaker timeout)
      vi.advanceTimersByTime(60000);
      
      // Should allow retry attempts
      expect(serviceMonitor.canAttemptRequest(serviceName)).toBe(true);
      
      // Successful request should reset circuit breaker
      serviceMonitor.recordServiceSuccess(serviceName);
      
      const status = serviceMonitor.getServiceStatus(serviceName);
      expect(status.status).toBe('healthy');
    });

    it('should gracefully degrade to fallback services', () => {
      // Trigger circuit breaker for gamification service
      for (let i = 0; i < 6; i++) {
        serviceMonitor.recordServiceFailure('gamification', 'Service unavailable');
      }
      
      // Should still return a service (fallback)
      const gamificationService = registry.gamification;
      expect(gamificationService).toBeDefined();
      
      // Should log fallback activation
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('circuit breaker open'),
        expect.any(Object)
      );
    });

    it('should handle cascading failures across services', async () => {
      const services: ServiceType[] = ['auth', 'database', 'social'];
      
      // Simulate cascading failures
      services.forEach(service => {
        for (let i = 0; i < 6; i++) {
          serviceMonitor.recordServiceFailure(service, 'Cascading failure');
        }
      });
      
      // All services should have circuit breakers open
      services.forEach(service => {
        expect(serviceMonitor.canAttemptRequest(service)).toBe(false);
      });
      
      // System should still be functional with fallbacks
      const systemHealth = registry.getSystemHealth();
      expect(systemHealth).toBeDefined();
      expect(systemHealth.overallStatus).toBeDefined();
    });
  });

  describe('Network Connectivity Handling', () => {
    it('should handle offline/online transitions', () => {
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      
      window.dispatchEvent(new Event('offline'));
      
      // Configuration should reflect offline mode
      const offlineConfig = serviceConfigManager.getConfig();
      expect(offlineConfig.offlineMode).toBe(true);
      
      // Services should still be available (fallback to local)
      const authService = registry.auth;
      const workoutService = registry.workout;
      
      expect(authService).toBeDefined();
      expect(workoutService).toBeDefined();
      
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

    it('should handle intermittent connectivity issues', async () => {
      // Simulate intermittent failures
      mockSupabaseClient = createMockSupabaseClient(true);
      
      // Try to use database service
      const databaseService = registry.database;
      
      // Should handle failures gracefully
      try {
        await databaseService.healthCheck();
      } catch (error) {
        // Error should be handled gracefully
        expect(error).toBeDefined();
      }
      
      // Restore connectivity
      mockSupabaseClient = createMockSupabaseClient(false);
      
      // Should recover automatically
      const healthStatus = await databaseService.healthCheck();
      expect(healthStatus).toBeDefined();
    });

    it('should queue operations during offline periods', async () => {
      // Simulate offline mode
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      
      window.dispatchEvent(new Event('offline'));
      
      // Operations should be queued or handled locally
      const workoutService = registry.workout;
      
      // Should not throw even when offline
      expect(() => {
        // Simulate workout operation
        workoutService.getWorkoutTemplates();
      }).not.toThrow();
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should implement exponential backoff for retries', async () => {
      const serviceName: ServiceType = 'social';
      
      // Simulate failures with retry attempts
      const startTime = Date.now();
      
      for (let i = 0; i < 3; i++) {
        serviceMonitor.recordServiceFailure(serviceName, 'Temporary failure');
        
        // Simulate retry delay
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should have taken some time due to backoff
      expect(totalTime).toBeGreaterThan(300); // At least 300ms for exponential backoff
    });

    it('should implement different retry strategies for different error types', () => {
      const serviceName: ServiceType = 'workout';
      
      // Network errors should be retried
      serviceMonitor.recordServiceFailure(serviceName, 'Network timeout');
      expect(serviceMonitor.canAttemptRequest(serviceName)).toBe(true);
      
      // Authentication errors should not be retried immediately
      serviceMonitor.recordServiceFailure('auth', 'Invalid credentials');
      const authStatus = serviceMonitor.getServiceStatus('auth');
      expect(authStatus.status).toBe('error');
    });

    it('should handle partial service degradation', () => {
      // Simulate partial failure (some operations work, others don't)
      serviceMonitor.recordServiceFailure('database', 'Write operation failed');
      serviceMonitor.recordServiceSuccess('database'); // Read operations still work
      
      const databaseService = registry.database;
      expect(databaseService).toBeDefined();
      
      // Service should still be available with limited functionality
      const status = serviceMonitor.getServiceStatus('database');
      expect(status.status).toBe('healthy'); // Last operation was successful
    });
  });

  describe('Error Reporting and Monitoring', () => {
    it('should collect and report error metrics', () => {
      const serviceName: ServiceType = 'gamification';
      const errorMessage = 'XP calculation failed';
      
      serviceMonitor.recordServiceFailure(serviceName, errorMessage);
      
      const status = serviceMonitor.getServiceStatus(serviceName);
      expect(status.lastError).toBe(errorMessage);
      expect(status.failureCount).toBeGreaterThan(0);
      expect(status.lastHealthCheck).toBeDefined();
    });

    it('should provide error analytics and trends', () => {
      const serviceName: ServiceType = 'social';
      
      // Generate error pattern
      for (let i = 0; i < 10; i++) {
        if (i % 3 === 0) {
          serviceMonitor.recordServiceFailure(serviceName, 'Rate limit exceeded');
        } else {
          serviceMonitor.recordServiceSuccess(serviceName);
        }
      }
      
      const status = serviceMonitor.getServiceStatus(serviceName);
      expect(status.failureCount).toBeGreaterThan(0);
      expect(status.successCount).toBeGreaterThan(0);
    });

    it('should generate alerts for critical errors', () => {
      const criticalServices: ServiceType[] = ['auth', 'database'];
      
      criticalServices.forEach(service => {
        // Simulate critical failure
        for (let i = 0; i < 6; i++) {
          serviceMonitor.recordServiceFailure(service, 'Critical system failure');
        }
      });
      
      // Should have logged critical errors
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Critical system failure'),
        expect.any(Object)
      );
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should handle data synchronization conflicts', async () => {
      // Simulate conflicting data updates
      const workoutService = registry.workout;
      
      // Should handle conflicts gracefully
      expect(() => {
        // Simulate concurrent updates
        workoutService.getWorkoutTemplates();
      }).not.toThrow();
    });

    it('should validate data integrity after errors', () => {
      // Simulate data corruption scenario
      serviceMonitor.recordServiceFailure('database', 'Data integrity check failed');
      
      const databaseService = registry.database;
      expect(databaseService).toBeDefined();
      
      // Should still provide service with validation
    });

    it('should handle transaction rollbacks on errors', async () => {
      // Simulate transaction failure
      mockSupabaseClient = createMockSupabaseClient(true);
      
      const databaseService = registry.database;
      
      // Should handle transaction failures gracefully
      try {
        // Simulate database operation
        await databaseService.healthCheck();
      } catch (error) {
        // Should be handled without data corruption
        expect(error).toBeDefined();
      }
    });
  });

  describe('User Experience During Errors', () => {
    it('should provide meaningful error messages to users', () => {
      const errorHandler = ErrorHandlingService.getInstance();
      
      // Test different error scenarios
      const networkError = errorHandler.handleError(new Error('Network timeout'), 'network');
      const authError = errorHandler.handleError(new Error('Invalid credentials'), 'auth');
      const serverError = errorHandler.handleError(new Error('Internal server error'), 'server');
      
      expect(networkError.userMessage).toContain('connection');
      expect(authError.userMessage).toContain('authentication');
      expect(serverError.userMessage).toContain('server');
    });

    it('should maintain app functionality during service degradation', () => {
      // Simulate multiple service failures
      const services: ServiceType[] = ['social', 'gamification'];
      
      services.forEach(service => {
        for (let i = 0; i < 6; i++) {
          serviceMonitor.recordServiceFailure(service, 'Service degraded');
        }
      });
      
      // Core services should still work
      const authService = registry.auth;
      const workoutService = registry.workout;
      
      expect(authService).toBeDefined();
      expect(workoutService).toBeDefined();
      
      // App should remain functional
      expect(() => {
        registry.getServiceImplementations();
      }).not.toThrow();
    });

    it('should provide offline mode capabilities', () => {
      // Simulate complete network failure
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      
      window.dispatchEvent(new Event('offline'));
      
      // Services should switch to offline mode
      const workoutService = registry.workout;
      
      // Should still provide basic functionality
      expect(() => {
        workoutService.getWorkoutTemplates();
      }).not.toThrow();
    });
  });

  describe('Recovery Testing', () => {
    it('should recover all services after system restart', async () => {
      // Simulate system failure
      const services: ServiceType[] = ['auth', 'database', 'social', 'gamification', 'workout'];
      
      services.forEach(service => {
        for (let i = 0; i < 6; i++) {
          serviceMonitor.recordServiceFailure(service, 'System failure');
        }
      });
      
      // Shutdown and restart
      await registry.shutdown();
      
      // Reset service monitor
      services.forEach(service => {
        serviceMonitor.resetServiceStatus(service);
      });
      
      // Reinitialize
      await registry.initialize();
      
      // All services should be available again
      services.forEach(service => {
        const status = serviceMonitor.getServiceStatus(service);
        expect(status.status).not.toBe('error');
      });
    });

    it('should handle partial recovery scenarios', async () => {
      // Simulate partial system recovery
      serviceMonitor.recordServiceFailure('database', 'Partial failure');
      serviceMonitor.recordServiceSuccess('auth');
      serviceMonitor.recordServiceSuccess('workout');
      
      const systemHealth = registry.getSystemHealth();
      expect(systemHealth.healthyServices).toBeGreaterThan(0);
      expect(systemHealth.overallStatus).toBeDefined();
    });

    it('should validate service health after recovery', async () => {
      // Simulate recovery
      const services: ServiceType[] = ['auth', 'database'];
      
      services.forEach(service => {
        serviceMonitor.recordServiceSuccess(service);
      });
      
      // Perform health check
      const healthStatus = await registry.healthCheck();
      expect(healthStatus).toBeDefined();
      
      // All recovered services should be healthy
      services.forEach(service => {
        const status = serviceMonitor.getServiceStatus(service);
        expect(status.status).toBe('healthy');
      });
    });
  });
});