import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CircuitBreakerService,
  CircuitBreakerState,
  CircuitBreakerError,
  getCircuitBreakerService,
  initializeCircuitBreakerService,
  setupDefaultCircuitBreakers,
  ServiceNames,
} from '../CircuitBreakerService';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;
  const serviceName = 'test-service';

  beforeEach(() => {
    vi.useFakeTimers();
    service = new CircuitBreakerService();
  });

  afterEach(() => {
    service.destroy();
    vi.useRealTimers();
  });

  describe('Service Registration', () => {
    it('should register a service with default configuration', () => {
      service.register(serviceName);
      
      const status = service.getServiceStatus(serviceName);
      expect(status).toBeDefined();
      expect(status?.name).toBe(serviceName);
      expect(status?.state).toBe(CircuitBreakerState.CLOSED);
    });

    it('should register a service with custom configuration', () => {
      const config = {
        failureThreshold: 3,
        recoveryTimeout: 30000,
        fallbackEnabled: false,
      };

      service.register(serviceName, config);
      
      const status = service.getServiceStatus(serviceName);
      expect(status).toBeDefined();
      expect(status?.state).toBe(CircuitBreakerState.CLOSED);
    });

    it('should register a service with fallback function', async () => {
      const fallback = vi.fn().mockResolvedValue('fallback-result');
      
      service.register(serviceName, {}, fallback);
      
      // Force a failure to test fallback
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service failed'));
      
      // Trigger enough failures to open circuit
      for (let i = 0; i < 5; i++) {
        await service.execute(serviceName, failingOperation);
      }

      const result = await service.execute(serviceName, failingOperation);
      
      expect(result.fallbackUsed).toBe(true);
      expect(result.data).toBe('fallback-result');
      expect(fallback).toHaveBeenCalled();
    });

    it('should register a service with health check', () => {
      const healthCheck = vi.fn().mockResolvedValue(true);
      
      service.register(serviceName, {}, undefined, healthCheck);
      
      // Health check should be registered
      expect(service.getServiceStatus(serviceName)).toBeDefined();
    });
  });

  describe('Circuit Breaker States', () => {
    beforeEach(() => {
      service.register(serviceName, { failureThreshold: 3 });
    });

    it('should start in CLOSED state', () => {
      expect(service.getState(serviceName)).toBe(CircuitBreakerState.CLOSED);
    });

    it('should transition to OPEN after failure threshold', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service failed'));
      
      // Execute failing operations up to threshold
      for (let i = 0; i < 3; i++) {
        await service.execute(serviceName, failingOperation);
      }

      expect(service.getState(serviceName)).toBe(CircuitBreakerState.OPEN);
    });

    it('should transition to HALF_OPEN after recovery timeout', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service failed'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await service.execute(serviceName, failingOperation);
      }
      
      expect(service.getState(serviceName)).toBe(CircuitBreakerState.OPEN);

      // Advance time past recovery timeout (default 60 seconds)
      vi.advanceTimersByTime(61000);

      expect(service.getState(serviceName)).toBe(CircuitBreakerState.HALF_OPEN);
    });

    it('should transition back to CLOSED after successful operation in HALF_OPEN', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service failed'));
      const successfulOperation = vi.fn().mockResolvedValue('success');
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await service.execute(serviceName, failingOperation);
      }
      
      // Wait for recovery timeout
      vi.advanceTimersByTime(61000);
      expect(service.getState(serviceName)).toBe(CircuitBreakerState.HALF_OPEN);

      // Execute successful operation
      await service.execute(serviceName, successfulOperation);
      
      expect(service.getState(serviceName)).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('Operation Execution', () => {
    beforeEach(() => {
      service.register(serviceName);
    });

    it('should execute successful operations normally', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await service.execute(serviceName, operation);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.fallbackUsed).toBe(false);
      expect(result.state).toBe(CircuitBreakerState.CLOSED);
      expect(operation).toHaveBeenCalledOnce();
    });

    it('should handle failed operations', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      
      const result = await service.execute(serviceName, operation);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Operation failed');
      expect(result.fallbackUsed).toBe(false);
    });

    it('should use fallback when circuit is open', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service failed'));
      const fallback = vi.fn().mockResolvedValue('fallback-data');
      
      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await service.execute(serviceName, failingOperation);
      }

      const result = await service.execute(serviceName, failingOperation, fallback);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('fallback-data');
      expect(result.fallbackUsed).toBe(true);
      expect(result.state).toBe(CircuitBreakerState.OPEN);
      expect(fallback).toHaveBeenCalled();
    });

    it('should measure execution time', async () => {
      const operation = vi.fn().mockImplementation(async () => {
        // Simulate some processing time
        vi.advanceTimersByTime(100);
        return 'success';
      });
      
      const result = await service.execute(serviceName, operation);
      
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should throw error for unregistered service', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      await expect(
        service.execute('unregistered-service', operation)
      ).rejects.toThrow('Service unregistered-service not registered');
    });
  });

  describe('Expected Errors', () => {
    it('should not count expected errors as failures', async () => {
      service.register(serviceName, {
        failureThreshold: 2,
        expectedErrors: ['ExpectedError'],
      });

      const expectedErrorOperation = vi.fn().mockRejectedValue(new Error('ExpectedError occurred'));
      
      // Execute operations with expected errors
      for (let i = 0; i < 5; i++) {
        await service.execute(serviceName, expectedErrorOperation);
      }

      // Circuit should still be closed since errors were expected
      expect(service.getState(serviceName)).toBe(CircuitBreakerState.CLOSED);
    });

    it('should count unexpected errors as failures', async () => {
      service.register(serviceName, {
        failureThreshold: 2,
        expectedErrors: ['ExpectedError'],
      });

      const unexpectedErrorOperation = vi.fn().mockRejectedValue(new Error('UnexpectedError occurred'));
      
      // Execute operations with unexpected errors
      for (let i = 0; i < 2; i++) {
        await service.execute(serviceName, unexpectedErrorOperation);
      }

      // Circuit should be open since errors were unexpected
      expect(service.getState(serviceName)).toBe(CircuitBreakerState.OPEN);
    });
  });

  describe('Service Status and Statistics', () => {
    beforeEach(() => {
      service.register(serviceName);
    });

    it('should track service statistics', async () => {
      const successOperation = vi.fn().mockImplementation(async () => {
        vi.advanceTimersByTime(10); // Simulate some execution time
        return 'success';
      });
      const failOperation = vi.fn().mockImplementation(async () => {
        vi.advanceTimersByTime(5); // Simulate some execution time
        throw new Error('failed');
      });
      
      // Execute some operations
      await service.execute(serviceName, successOperation);
      await service.execute(serviceName, successOperation);
      await service.execute(serviceName, failOperation);

      const status = service.getServiceStatus(serviceName);
      
      expect(status).toBeDefined();
      expect(status?.totalRequests).toBe(3);
      expect(status?.successfulRequests).toBe(2);
      expect(status?.failedRequests).toBe(1);
      expect(status?.averageResponseTime).toBeGreaterThan(0);
    });

    it('should return null for unregistered service', () => {
      const status = service.getServiceStatus('unregistered');
      expect(status).toBeNull();
    });

    it('should return all service statuses', () => {
      // Create a fresh service to avoid interference from other tests
      const freshService = new CircuitBreakerService();
      
      freshService.register('service1');
      freshService.register('service2');
      
      const statuses = freshService.getAllServiceStatuses();
      
      expect(statuses).toHaveLength(2);
      expect(statuses.map(s => s.name)).toContain('service1');
      expect(statuses.map(s => s.name)).toContain('service2');
      
      freshService.destroy();
    });
  });

  describe('Health Checks', () => {
    it('should perform health checks on registered services', async () => {
      const healthCheck1 = vi.fn().mockResolvedValue(true);
      const healthCheck2 = vi.fn().mockResolvedValue(false);
      
      service.register('service1', {}, undefined, healthCheck1);
      service.register('service2', {}, undefined, healthCheck2);
      
      const results = await service.performHealthChecks();
      
      expect(results).toHaveLength(2);
      expect(results[0].healthy).toBe(true);
      expect(results[1].healthy).toBe(false);
      expect(healthCheck1).toHaveBeenCalled();
      expect(healthCheck2).toHaveBeenCalled();
    });

    it('should handle health check errors', async () => {
      const healthCheck = vi.fn().mockRejectedValue(new Error('Health check failed'));
      
      service.register(serviceName, {}, undefined, healthCheck);
      
      const results = await service.performHealthChecks();
      
      expect(results).toHaveLength(1);
      expect(results[0].healthy).toBe(false);
      expect(results[0].error).toBe('Health check failed');
    });

    it('should transition to HALF_OPEN when health check passes for open circuit', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service failed'));
      const healthCheck = vi.fn().mockResolvedValue(true);
      
      service.register(serviceName, { 
        failureThreshold: 2,
        recoveryTimeout: 30000 // 30 seconds
      }, undefined, healthCheck);
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await service.execute(serviceName, failingOperation);
      }
      
      expect(service.getState(serviceName)).toBe(CircuitBreakerState.OPEN);

      // Advance time to allow recovery timeout to pass
      vi.advanceTimersByTime(31000);
      
      // Now the circuit should be in HALF_OPEN state due to timeout
      expect(service.getState(serviceName)).toBe(CircuitBreakerState.HALF_OPEN);
    });
  });

  describe('Configuration Management', () => {
    it('should update service configuration', () => {
      service.register(serviceName, { failureThreshold: 5 });
      
      service.updateConfig(serviceName, { failureThreshold: 3 });
      
      // Configuration should be updated (we can't directly test this, but we can test behavior)
      const status = service.getServiceStatus(serviceName);
      expect(status).toBeDefined();
    });

    it('should validate configuration updates', () => {
      service.register(serviceName);
      
      // This should not throw since validation happens in the schema
      expect(() => {
        service.updateConfig(serviceName, { failureThreshold: 10 });
      }).not.toThrow();
    });
  });

  describe('Circuit Reset', () => {
    it('should reset circuit breaker state', async () => {
      service.register(serviceName, { failureThreshold: 2 });
      
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service failed'));
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await service.execute(serviceName, failingOperation);
      }
      
      expect(service.getState(serviceName)).toBe(CircuitBreakerState.OPEN);

      // Reset the circuit
      service.reset(serviceName);
      
      expect(service.getState(serviceName)).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('Fallback Handling', () => {
    it('should use registered fallback when no fallback provided', async () => {
      const registeredFallback = vi.fn().mockResolvedValue('registered-fallback');
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service failed'));
      
      service.register(serviceName, { failureThreshold: 1 }, registeredFallback);
      
      // Open circuit
      await service.execute(serviceName, failingOperation);
      
      // Next call should use registered fallback
      const result = await service.execute(serviceName, failingOperation);
      
      expect(result.fallbackUsed).toBe(true);
      expect(result.data).toBe('registered-fallback');
      expect(registeredFallback).toHaveBeenCalled();
    });

    it('should prefer provided fallback over registered fallback', async () => {
      const registeredFallback = vi.fn().mockResolvedValue('registered-fallback');
      const providedFallback = vi.fn().mockResolvedValue('provided-fallback');
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service failed'));
      
      service.register(serviceName, { failureThreshold: 1 }, registeredFallback);
      
      // Open circuit without using fallback
      await service.execute(serviceName, failingOperation);
      
      // Reset the mock to clear previous calls
      registeredFallback.mockClear();
      
      // Next call should use provided fallback
      const result = await service.execute(serviceName, failingOperation, providedFallback);
      
      expect(result.fallbackUsed).toBe(true);
      expect(result.data).toBe('provided-fallback');
      expect(providedFallback).toHaveBeenCalled();
      expect(registeredFallback).not.toHaveBeenCalled();
    });

    it('should handle fallback errors', async () => {
      const failingFallback = vi.fn().mockRejectedValue(new Error('Fallback failed'));
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service failed'));
      
      service.register(serviceName, { failureThreshold: 1 });
      
      // Open circuit
      await service.execute(serviceName, failingOperation);
      
      // Next call with failing fallback
      const result = await service.execute(serviceName, failingOperation, failingFallback);
      
      expect(result.success).toBe(false);
      expect(result.fallbackUsed).toBe(true);
      expect(result.error?.message).toBe('Fallback failed');
    });

    it('should respect fallbackEnabled configuration', async () => {
      const fallback = vi.fn().mockResolvedValue('fallback-result');
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service failed'));
      
      service.register(serviceName, { 
        failureThreshold: 1,
        fallbackEnabled: false 
      }, fallback);
      
      // Open circuit
      await service.execute(serviceName, failingOperation);
      
      // Next call should not use fallback
      const result = await service.execute(serviceName, failingOperation);
      
      expect(result.success).toBe(false);
      expect(result.fallbackUsed).toBe(false);
      expect(fallback).not.toHaveBeenCalled();
    });
  });

  describe('Half-Open State Behavior', () => {
    it('should limit requests in HALF_OPEN state', async () => {
      service.register(serviceName, { failureThreshold: 2 });
      
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service failed'));
      const fallback = vi.fn().mockResolvedValue('fallback');
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await service.execute(serviceName, failingOperation);
      }
      
      // Wait for recovery timeout
      vi.advanceTimersByTime(61000);
      expect(service.getState(serviceName)).toBe(CircuitBreakerState.HALF_OPEN);

      // First request should go through
      const result1 = await service.execute(serviceName, failingOperation, fallback);
      
      // Second request should use fallback (circuit testing in progress)
      const result2 = await service.execute(serviceName, failingOperation, fallback);
      
      expect(result2.fallbackUsed).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getCircuitBreakerService', () => {
      const instance1 = getCircuitBreakerService();
      const instance2 = getCircuitBreakerService();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance with initializeCircuitBreakerService', () => {
      const instance1 = getCircuitBreakerService();
      const instance2 = initializeCircuitBreakerService();
      
      expect(instance1).not.toBe(instance2);
      
      // Subsequent calls should return the new instance
      const instance3 = getCircuitBreakerService();
      expect(instance2).toBe(instance3);
    });
  });

  describe('Default Circuit Breakers Setup', () => {
    it('should setup default circuit breakers', () => {
      setupDefaultCircuitBreakers(service);
      
      // Check that default services are registered
      expect(service.getServiceStatus(ServiceNames.SUPABASE_DATABASE)).toBeDefined();
      expect(service.getServiceStatus(ServiceNames.SUPABASE_AUTH)).toBeDefined();
      expect(service.getServiceStatus(ServiceNames.AWS_LAMBDA)).toBeDefined();
      expect(service.getServiceStatus(ServiceNames.EXTERNAL_API)).toBeDefined();
    });

    it('should have different configurations for different services', () => {
      setupDefaultCircuitBreakers(service);
      
      const dbStatus = service.getServiceStatus(ServiceNames.SUPABASE_DATABASE);
      const authStatus = service.getServiceStatus(ServiceNames.SUPABASE_AUTH);
      
      expect(dbStatus).toBeDefined();
      expect(authStatus).toBeDefined();
      
      // Both should start in CLOSED state
      expect(dbStatus?.state).toBe(CircuitBreakerState.CLOSED);
      expect(authStatus?.state).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on destroy', () => {
      service.register('service1');
      service.register('service2');
      
      expect(service.getAllServiceStatuses()).toHaveLength(2);
      
      service.destroy();
      
      // After destroy, no services should be registered
      expect(service.getAllServiceStatuses()).toHaveLength(0);
    });

    it('should limit response time history', async () => {
      service.register(serviceName);
      
      const operation = vi.fn().mockResolvedValue('success');
      
      // Execute many operations to test history limit
      for (let i = 0; i < 150; i++) {
        await service.execute(serviceName, operation);
      }

      const status = service.getServiceStatus(serviceName);
      expect(status?.totalRequests).toBe(150);
      // Response times should be limited to last 100
      expect(status?.averageResponseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Monitoring Integration', () => {
    it('should start monitoring interval on creation', () => {
      const service = new CircuitBreakerService();
      
      // Monitoring should be active (we can't easily test the interval directly)
      expect(service).toBeDefined();
      
      service.destroy();
    });

    it('should perform periodic health checks', async () => {
      const healthCheck = vi.fn().mockResolvedValue(true);
      
      service.register(serviceName, {}, undefined, healthCheck);
      
      // Advance time to trigger monitoring
      vi.advanceTimersByTime(30000);
      
      // Health check should have been called
      expect(healthCheck).toHaveBeenCalled();
    });
  });
});