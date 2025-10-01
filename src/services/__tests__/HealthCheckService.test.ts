import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  HealthCheckService,
  HealthStatus,
  getHealthCheckService,
  initializeHealthCheckService,
  defaultAlertHandlers,
} from '../HealthCheckService';
import type { HealthCheckResult, HealthAlert } from '../HealthCheckService';

// Mock fetch for HTTP health checks
global.fetch = vi.fn();

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  const serviceName = 'test-service';

  beforeEach(() => {
    vi.useFakeTimers();
    service = new HealthCheckService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.destroy();
    vi.useRealTimers();
  });

  describe('Endpoint Registration', () => {
    it('should register a health check endpoint', () => {
      const checkFunction = vi.fn().mockResolvedValue({
        serviceName,
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      service.registerEndpoint(serviceName, checkFunction);
      
      expect(service.getServiceHealth(serviceName)).toBeNull(); // No check performed yet
    });

    it('should register endpoint with custom configuration', () => {
      const checkFunction = vi.fn().mockResolvedValue({
        serviceName,
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      const config = {
        interval: 60000,
        timeout: 10000,
        alertThreshold: 5,
      };

      service.registerEndpoint(serviceName, checkFunction, config);
      
      // Configuration should be applied (we can't directly test this, but endpoint should be registered)
      expect(service.getServiceHealth(serviceName)).toBeNull();
    });

    it('should register endpoint with URL', () => {
      const checkFunction = vi.fn().mockResolvedValue({
        serviceName,
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      service.registerEndpoint(serviceName, checkFunction, {}, 'https://api.example.com/health');
      
      expect(service.getServiceHealth(serviceName)).toBeNull();
    });
  });

  describe('Health Check Execution', () => {
    it('should perform health checks on all endpoints', async () => {
      const checkFunction1 = vi.fn().mockResolvedValue({
        serviceName: 'service1',
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      const checkFunction2 = vi.fn().mockResolvedValue({
        serviceName: 'service2',
        status: HealthStatus.DEGRADED,
        responseTime: 200,
        timestamp: new Date(),
      });

      service.registerEndpoint('service1', checkFunction1);
      service.registerEndpoint('service2', checkFunction2);

      const results = await service.performHealthChecks();

      expect(results).toHaveLength(2);
      expect(checkFunction1).toHaveBeenCalled();
      expect(checkFunction2).toHaveBeenCalled();
    });

    it('should handle health check failures', async () => {
      const checkFunction = vi.fn().mockRejectedValue(new Error('Health check failed'));

      service.registerEndpoint(serviceName, checkFunction);

      const results = await service.performHealthChecks();

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe(HealthStatus.UNHEALTHY);
      expect(results[0].error).toBe('Health check failed');
    });

    it('should handle health check timeouts', async () => {
      const checkFunction = vi.fn().mockImplementation(() => 
        new Promise(resolve => {
          // Use fake timers to simulate timeout
          setTimeout(resolve, 10000);
        })
      );

      service.registerEndpoint(serviceName, checkFunction, { timeout: 1000 });

      const resultsPromise = service.performHealthChecks();
      
      // Advance timers to trigger timeout
      vi.advanceTimersByTime(1001);
      
      const results = await resultsPromise;

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe(HealthStatus.UNHEALTHY);
      expect(results[0].error).toBe('Health check timeout');
    }, 15000);
  });

  describe('Service Health Status', () => {
    it('should return service health status', async () => {
      const checkFunction = vi.fn().mockResolvedValue({
        serviceName,
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      service.registerEndpoint(serviceName, checkFunction);
      await service.performHealthChecks();

      const health = service.getServiceHealth(serviceName);
      expect(health).toBeDefined();
      expect(health?.status).toBe(HealthStatus.HEALTHY);
      expect(health?.serviceName).toBe(serviceName);
    });

    it('should return null for unregistered service', () => {
      const health = service.getServiceHealth('unregistered');
      expect(health).toBeNull();
    });

    it('should return all service health statuses', async () => {
      const checkFunction1 = vi.fn().mockResolvedValue({
        serviceName: 'service1',
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      const checkFunction2 = vi.fn().mockResolvedValue({
        serviceName: 'service2',
        status: HealthStatus.DEGRADED,
        responseTime: 200,
        timestamp: new Date(),
      });

      service.registerEndpoint('service1', checkFunction1);
      service.registerEndpoint('service2', checkFunction2);
      await service.performHealthChecks();

      const allHealth = service.getAllServiceHealth();
      expect(allHealth).toHaveLength(2);
    });
  });

  describe('System Health Status', () => {
    it('should return overall system health as healthy when all services are healthy', async () => {
      const checkFunction1 = vi.fn().mockResolvedValue({
        serviceName: 'service1',
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      const checkFunction2 = vi.fn().mockResolvedValue({
        serviceName: 'service2',
        status: HealthStatus.HEALTHY,
        responseTime: 150,
        timestamp: new Date(),
      });

      service.registerEndpoint('service1', checkFunction1);
      service.registerEndpoint('service2', checkFunction2);
      await service.performHealthChecks();

      const systemHealth = service.getSystemHealth();
      expect(systemHealth.status).toBe(HealthStatus.HEALTHY);
      expect(systemHealth.summary.healthy).toBe(2);
      expect(systemHealth.summary.total).toBe(2);
    });

    it('should return overall system health as degraded when some services are degraded', async () => {
      const checkFunction1 = vi.fn().mockResolvedValue({
        serviceName: 'service1',
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      const checkFunction2 = vi.fn().mockResolvedValue({
        serviceName: 'service2',
        status: HealthStatus.DEGRADED,
        responseTime: 300,
        timestamp: new Date(),
      });

      service.registerEndpoint('service1', checkFunction1);
      service.registerEndpoint('service2', checkFunction2);
      await service.performHealthChecks();

      const systemHealth = service.getSystemHealth();
      expect(systemHealth.status).toBe(HealthStatus.DEGRADED);
      expect(systemHealth.summary.healthy).toBe(1);
      expect(systemHealth.summary.degraded).toBe(1);
    });

    it('should return overall system health as unhealthy when any service is unhealthy', async () => {
      const checkFunction1 = vi.fn().mockResolvedValue({
        serviceName: 'service1',
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      const checkFunction2 = vi.fn().mockRejectedValue(new Error('Service failed'));

      service.registerEndpoint('service1', checkFunction1);
      service.registerEndpoint('service2', checkFunction2);
      await service.performHealthChecks();

      const systemHealth = service.getSystemHealth();
      expect(systemHealth.status).toBe(HealthStatus.UNHEALTHY);
      expect(systemHealth.summary.healthy).toBe(1);
      expect(systemHealth.summary.unhealthy).toBe(1);
    });
  });

  describe('HTTP Health Checks', () => {
    it('should create HTTP health check that returns healthy for 200 status', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
      } as Response);

      const healthCheck = service.createHttpHealthCheck(
        serviceName,
        'https://api.example.com/health'
      );

      const result = await healthCheck();

      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.metadata?.httpStatus).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/health',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'User-Agent': 'HealthCheckService/1.0',
          }),
        })
      );
    });

    it('should create HTTP health check that returns degraded for non-200 status', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue({
        status: 500,
        ok: false,
      } as Response);

      const healthCheck = service.createHttpHealthCheck(
        serviceName,
        'https://api.example.com/health'
      );

      const result = await healthCheck();

      expect(result.status).toBe(HealthStatus.DEGRADED);
      expect(result.metadata?.httpStatus).toBe(500);
    });

    it('should create HTTP health check that returns unhealthy for network errors', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const healthCheck = service.createHttpHealthCheck(
        serviceName,
        'https://api.example.com/health'
      );

      const result = await healthCheck();

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.error).toBe('Network error');
    });

    it('should handle HTTP health check timeout', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(resolve, 10000);
        })
      );

      const healthCheck = service.createHttpHealthCheck(
        serviceName,
        'https://api.example.com/health',
        200,
        1000 // 1 second timeout
      );

      const resultPromise = healthCheck();
      
      // Advance timers to trigger timeout
      vi.advanceTimersByTime(1001);
      
      const result = await resultPromise;

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.error).toContain('timeout');
    }, 15000);
  });

  describe('Database Health Checks', () => {
    it('should create database health check that returns healthy for successful query', async () => {
      const testQuery = vi.fn().mockResolvedValue({ success: true });

      const healthCheck = service.createDatabaseHealthCheck(serviceName, testQuery);

      const result = await healthCheck();

      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.metadata?.type).toBe('database');
      expect(testQuery).toHaveBeenCalled();
    });

    it('should create database health check that returns unhealthy for failed query', async () => {
      const testQuery = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      const healthCheck = service.createDatabaseHealthCheck(serviceName, testQuery);

      const result = await healthCheck();

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('Service Health Checks', () => {
    it('should create service health check that returns healthy for true result', async () => {
      const serviceCheck = vi.fn().mockResolvedValue(true);
      const metadata = { type: 'custom-service' };

      const healthCheck = service.createServiceHealthCheck(serviceName, serviceCheck, metadata);

      const result = await healthCheck();

      expect(result.status).toBe(HealthStatus.HEALTHY);
      expect(result.metadata).toEqual(metadata);
      expect(serviceCheck).toHaveBeenCalled();
    });

    it('should create service health check that returns degraded for false result', async () => {
      const serviceCheck = vi.fn().mockResolvedValue(false);

      const healthCheck = service.createServiceHealthCheck(serviceName, serviceCheck);

      const result = await healthCheck();

      expect(result.status).toBe(HealthStatus.DEGRADED);
    });

    it('should create service health check that returns unhealthy for errors', async () => {
      const serviceCheck = vi.fn().mockRejectedValue(new Error('Service check failed'));

      const healthCheck = service.createServiceHealthCheck(serviceName, serviceCheck);

      const result = await healthCheck();

      expect(result.status).toBe(HealthStatus.UNHEALTHY);
      expect(result.error).toBe('Service check failed');
    });
  });

  describe('Alert Handling', () => {
    it('should register and call alert handlers', async () => {
      const alertHandler = vi.fn();
      service.registerAlertHandler(alertHandler);

      const checkFunction = vi.fn().mockRejectedValue(new Error('Service failed'));

      service.registerEndpoint(serviceName, checkFunction, { alertThreshold: 1 });

      // Trigger health check to generate alert
      await service.performHealthChecks();

      expect(alertHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName,
          status: HealthStatus.UNHEALTHY,
          consecutiveFailures: 1,
        })
      );
    });

    it('should send recovery alert when service recovers', async () => {
      const alertHandler = vi.fn();
      service.registerAlertHandler(alertHandler);

      const checkFunction = vi.fn()
        .mockRejectedValueOnce(new Error('Service failed'))
        .mockResolvedValueOnce({
          serviceName,
          status: HealthStatus.HEALTHY,
          responseTime: 100,
          timestamp: new Date(),
        });

      service.registerEndpoint(serviceName, checkFunction, { alertThreshold: 1 });

      // First check - should trigger alert
      await service.performHealthChecks();
      expect(alertHandler).toHaveBeenCalledTimes(1);

      // Second check - should trigger recovery alert
      await service.performHealthChecks();
      expect(alertHandler).toHaveBeenCalledTimes(2);
      
      const recoveryCall = alertHandler.mock.calls[1][0];
      expect(recoveryCall.status).toBe(HealthStatus.HEALTHY);
      expect(recoveryCall.message).toContain('recovered');
    });

    it('should not send duplicate alerts for consecutive failures below threshold', async () => {
      const alertHandler = vi.fn();
      service.registerAlertHandler(alertHandler);

      const checkFunction = vi.fn().mockRejectedValue(new Error('Service failed'));

      service.registerEndpoint(serviceName, checkFunction, { alertThreshold: 3 });

      // First two checks should not trigger alerts
      await service.performHealthChecks();
      await service.performHealthChecks();
      expect(alertHandler).not.toHaveBeenCalled();

      // Third check should trigger alert
      await service.performHealthChecks();
      expect(alertHandler).toHaveBeenCalledTimes(1);

      // Fourth check should not trigger another alert
      await service.performHealthChecks();
      expect(alertHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle alert handler errors gracefully', async () => {
      const failingHandler = vi.fn().mockRejectedValue(new Error('Handler failed'));
      const workingHandler = vi.fn();
      
      service.registerAlertHandler(failingHandler);
      service.registerAlertHandler(workingHandler);

      const checkFunction = vi.fn().mockRejectedValue(new Error('Service failed'));
      service.registerEndpoint(serviceName, checkFunction, { alertThreshold: 1 });

      // Should not throw despite handler failure
      await expect(service.performHealthChecks()).resolves.not.toThrow();
      
      expect(failingHandler).toHaveBeenCalled();
      expect(workingHandler).toHaveBeenCalled();
    });
  });

  describe('Monitoring Lifecycle', () => {
    it('should start and stop monitoring', () => {
      // Register a service first to have something to monitor
      const checkFunction = vi.fn().mockResolvedValue({
        serviceName,
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      service.registerEndpoint(serviceName, checkFunction);

      service.start();
      // Should be running (we can't easily test the interval)

      service.stop();
      // Should be stopped
      
      expect(service.isSystemHealthy()).toBe(true);
    });

    it('should perform initial health checks on start', async () => {
      const checkFunction = vi.fn().mockResolvedValue({
        serviceName,
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      service.registerEndpoint(serviceName, checkFunction);
      
      service.start();
      
      // Advance timers to trigger initial check
      vi.advanceTimersByTime(100);
      
      // Wait for promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(checkFunction).toHaveBeenCalled();
    });

    it('should not start monitoring twice', () => {
      service.start();
      service.start(); // Should not cause issues
      
      service.stop();
    });
  });

  describe('Configuration Management', () => {
    it('should update endpoint configuration', () => {
      const checkFunction = vi.fn().mockResolvedValue({
        serviceName,
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      service.registerEndpoint(serviceName, checkFunction, { alertThreshold: 3 });
      
      service.updateEndpointConfig(serviceName, { alertThreshold: 1 });
      
      // Configuration should be updated (we can't directly test this)
      expect(service.getServiceHealth(serviceName)).toBeNull(); // No check performed yet
    });

    it('should remove endpoints', () => {
      const checkFunction = vi.fn().mockResolvedValue({
        serviceName,
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      service.registerEndpoint(serviceName, checkFunction);
      service.removeEndpoint(serviceName);
      
      expect(service.getServiceHealth(serviceName)).toBeNull();
    });
  });

  describe('Utility Methods', () => {
    it('should check if service is healthy', async () => {
      const checkFunction = vi.fn().mockResolvedValue({
        serviceName,
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      service.registerEndpoint(serviceName, checkFunction);
      await service.performHealthChecks();

      expect(service.isServiceHealthy(serviceName)).toBe(true);
    });

    it('should check if service is not healthy', async () => {
      const checkFunction = vi.fn().mockRejectedValue(new Error('Service failed'));

      service.registerEndpoint(serviceName, checkFunction);
      await service.performHealthChecks();

      expect(service.isServiceHealthy(serviceName)).toBe(false);
    });

    it('should check if system is healthy', async () => {
      const checkFunction = vi.fn().mockResolvedValue({
        serviceName,
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      service.registerEndpoint(serviceName, checkFunction);
      await service.performHealthChecks();

      expect(service.isSystemHealthy()).toBe(true);
    });
  });

  describe('Default Alert Handlers', () => {
    it('should have console logger alert handler', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const alert: HealthAlert = {
        serviceName: 'test',
        status: HealthStatus.UNHEALTHY,
        message: 'Test alert',
        timestamp: new Date(),
        consecutiveFailures: 3,
      };

      defaultAlertHandlers.consoleLogger(alert);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[HealthCheck] test: Test alert',
        expect.objectContaining({
          status: HealthStatus.UNHEALTHY,
          consecutiveFailures: 3,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should have localStorage alert handler', () => {
      // Mock localStorage methods
      const mockGetItem = vi.fn().mockReturnValue('[]');
      const mockSetItem = vi.fn();
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: mockGetItem,
          setItem: mockSetItem,
        },
        writable: true,
      });

      const alert: HealthAlert = {
        serviceName: 'test',
        status: HealthStatus.UNHEALTHY,
        message: 'Test alert',
        timestamp: new Date(),
        consecutiveFailures: 3,
      };

      defaultAlertHandlers.localStorage(alert);

      expect(mockGetItem).toHaveBeenCalledWith('health-alerts');
      expect(mockSetItem).toHaveBeenCalledWith(
        'health-alerts',
        expect.stringContaining('"serviceName":"test"')
      );
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getHealthCheckService', () => {
      const instance1 = getHealthCheckService();
      const instance2 = getHealthCheckService();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance with initializeHealthCheckService', () => {
      const instance1 = getHealthCheckService();
      const instance2 = initializeHealthCheckService();
      
      expect(instance1).not.toBe(instance2);
      
      // Subsequent calls should return the new instance
      const instance3 = getHealthCheckService();
      expect(instance2).toBe(instance3);
    });

    it('should initialize with custom configuration', () => {
      const config = {
        interval: 60000,
        timeout: 10000,
      };

      const instance = initializeHealthCheckService(config);
      
      expect(instance).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on destroy', () => {
      const checkFunction = vi.fn().mockResolvedValue({
        serviceName,
        status: HealthStatus.HEALTHY,
        responseTime: 100,
        timestamp: new Date(),
      });

      service.registerEndpoint(serviceName, checkFunction);
      service.registerAlertHandler(() => {});
      
      service.start();
      service.destroy();
      
      expect(service.getServiceHealth(serviceName)).toBeNull();
      expect(service.getAllServiceHealth()).toHaveLength(0);
    });
  });
});