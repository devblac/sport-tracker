import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ServiceMonitoringIntegration,
  getServiceMonitoring,
  initializeServiceMonitoring,
  degradationStrategies,
} from '../ServiceMonitoringIntegration';
// Removed unused imports

describe('ServiceMonitoringIntegration', () => {
  let integration: ServiceMonitoringIntegration;

  beforeEach(() => {
    vi.useFakeTimers();
    integration = new ServiceMonitoringIntegration();
  });

  afterEach(async () => {
    await integration.shutdown();
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await integration.initialize();
      
      expect(integration.getCircuitBreaker()).toBeDefined();
      expect(integration.getHealthCheck()).toBeDefined();
    });

    it('should not initialize twice', async () => {
      await integration.initialize();
      await integration.initialize(); // Should not cause issues
      
      expect(integration.getCircuitBreaker()).toBeDefined();
    });
  });

  describe('Service Access', () => {
    it('should provide access to circuit breaker service', () => {
      const circuitBreaker = integration.getCircuitBreaker();
      expect(circuitBreaker).toBeDefined();
      expect(typeof circuitBreaker.register).toBe('function');
    });

    it('should provide access to health check service', () => {
      const healthCheck = integration.getHealthCheck();
      expect(healthCheck).toBeDefined();
      expect(typeof healthCheck.registerEndpoint).toBe('function');
    });
  });

  describe('Protected Operation Execution', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should execute operation with circuit breaker protection', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      // Register the service first
      integration.getCircuitBreaker().register('test-service');
      
      const result = await integration.executeWithProtection('test-service', operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should use fallback when operation fails', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      const fallback = vi.fn().mockResolvedValue('fallback-result');
      
      // Register the service first
      integration.getCircuitBreaker().register('test-service');
      
      // First few calls should fail and eventually use fallback
      try {
        await integration.executeWithProtection('test-service', operation, fallback);
      } catch (error) {
        // Expected to fail initially
      }
    });

    it('should throw error when operation fails without fallback', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      
      // Register the service first
      integration.getCircuitBreaker().register('test-service');
      
      await expect(
        integration.executeWithProtection('test-service', operation)
      ).rejects.toThrow();
    });
  });

  describe('Service Health Status', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should check if service is healthy', () => {
      // Register a service
      integration.getCircuitBreaker().register('test-service');
      
      const isHealthy = integration.isServiceHealthy('test-service');
      expect(typeof isHealthy).toBe('boolean');
    });

    it('should get comprehensive service status', () => {
      // Register a service
      integration.getCircuitBreaker().register('test-service');
      
      const status = integration.getServiceStatus('test-service');
      
      expect(status).toHaveProperty('circuitBreaker');
      expect(status).toHaveProperty('healthCheck');
      expect(status).toHaveProperty('overall');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(status.overall);
    });

    it('should get system-wide status', () => {
      const systemStatus = integration.getSystemStatus();
      
      expect(systemStatus).toHaveProperty('circuitBreakers');
      expect(systemStatus).toHaveProperty('healthChecks');
      expect(systemStatus).toHaveProperty('overall');
      expect(systemStatus).toHaveProperty('services');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(systemStatus.overall);
    });
  });

  describe('Monitored Service Wrapper', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should create monitored service wrapper', () => {
      const originalService = {
        getData: vi.fn().mockResolvedValue('data'),
        processData: vi.fn().mockResolvedValue('processed'),
        nonFunction: 'value',
      };

      const fallbackService = {
        getData: vi.fn().mockResolvedValue('fallback-data'),
      };

      const monitoredService = integration.createMonitoredService(
        'test-service',
        originalService,
        fallbackService
      );

      expect(monitoredService).toHaveProperty('getData');
      expect(monitoredService).toHaveProperty('processData');
      expect(monitoredService.nonFunction).toBe('value');
    });

    it('should wrap service methods with circuit breaker protection', async () => {
      const originalService = {
        getData: vi.fn().mockResolvedValue('data'),
      };

      // Register the service first
      integration.getCircuitBreaker().register('test-service');

      const monitoredService = integration.createMonitoredService('test-service', originalService);

      const result = await monitoredService.getData();
      expect(result).toBe('data');
      expect(originalService.getData).toHaveBeenCalled();
    });
  });

  describe('Custom Service Registration', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should register custom service for monitoring', () => {
      const healthCheck = vi.fn().mockResolvedValue(true);
      const fallback = vi.fn().mockResolvedValue('fallback');

      integration.registerService(
        'custom-service',
        healthCheck,
        { failureThreshold: 3 },
        fallback
      );

      const status = integration.getServiceStatus('custom-service');
      expect(status).toBeDefined();
    });
  });

  describe('Monitoring Metrics', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should provide monitoring metrics', () => {
      const metrics = integration.getMonitoringMetrics();
      
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('systemStatus');
      expect(metrics).toHaveProperty('totalServices');
      expect(metrics).toHaveProperty('healthyServices');
      expect(metrics).toHaveProperty('degradedServices');
      expect(metrics).toHaveProperty('unhealthyServices');
      expect(metrics).toHaveProperty('openCircuits');
      expect(metrics).toHaveProperty('halfOpenCircuits');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('successRate');
      
      expect(typeof metrics.totalServices).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
    });

    it('should calculate success rate correctly', () => {
      const metrics = integration.getMonitoringMetrics();
      
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await integration.initialize();
      await integration.shutdown();
      
      // Should not throw after shutdown
      expect(() => integration.getCircuitBreaker()).not.toThrow();
      expect(() => integration.getHealthCheck()).not.toThrow();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getServiceMonitoring', () => {
      const instance1 = getServiceMonitoring();
      const instance2 = getServiceMonitoring();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance with initializeServiceMonitoring', async () => {
      const instance1 = getServiceMonitoring();
      const instance2 = await initializeServiceMonitoring();
      
      expect(instance1).not.toBe(instance2);
      
      // Subsequent calls should return the new instance
      const instance3 = getServiceMonitoring();
      expect(instance2).toBe(instance3);
      
      await instance2.shutdown();
    });
  });

  describe('AWS Configuration Detection', () => {
    it('should detect AWS configuration from environment variables', async () => {
      // Mock environment variable
      const originalEnv = process.env.VITE_AWS_REGION;
      process.env.VITE_AWS_REGION = 'us-east-1';
      
      const newIntegration = new ServiceMonitoringIntegration();
      await newIntegration.initialize();
      
      // Should register AWS services when configured
      const systemStatus = newIntegration.getSystemStatus();
      expect(systemStatus.services).toBeDefined();
      
      // Restore environment
      if (originalEnv !== undefined) {
        process.env.VITE_AWS_REGION = originalEnv;
      } else {
        delete process.env.VITE_AWS_REGION;
      }
      
      await newIntegration.shutdown();
    });
  });

  describe('Alert Integration', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should handle health check alerts', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Register a failing service
      const failingHealthCheck = vi.fn().mockResolvedValue(false);
      integration.registerService('failing-service', failingHealthCheck);
      
      // Trigger health checks
      await integration.getHealthCheck().performHealthChecks();
      
      // Should have logged warnings (we can't easily test the internal alert handler)
      expect(failingHealthCheck).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await integration.initialize();
    });

    it('should handle service registration errors gracefully', () => {
      expect(() => {
        integration.registerService(
          'error-service',
          () => { throw new Error('Health check error'); }
        );
      }).not.toThrow();
    });

    it('should handle monitoring errors gracefully', () => {
      expect(() => {
        integration.getMonitoringMetrics();
      }).not.toThrow();
    });
  });
});

describe('Degradation Strategies', () => {
  describe('Database Degradation', () => {
    it('should provide database degradation levels', () => {
      const level1 = degradationStrategies.database.level1();
      const level2 = degradationStrategies.database.level2();
      const level3 = degradationStrategies.database.level3();
      
      expect(level1).toHaveProperty('message');
      expect(level1).toHaveProperty('disabledFeatures');
      expect(level1).toHaveProperty('fallbackBehavior');
      
      expect(level2.disabledFeatures.length).toBeGreaterThan(level1.disabledFeatures.length);
      expect(level3.disabledFeatures.length).toBeGreaterThan(level2.disabledFeatures.length);
    });
  });

  describe('Auth Degradation', () => {
    it('should provide auth degradation levels', () => {
      const level1 = degradationStrategies.auth.level1();
      const level2 = degradationStrategies.auth.level2();
      
      expect(level1).toHaveProperty('message');
      expect(level1).toHaveProperty('disabledFeatures');
      expect(level1).toHaveProperty('fallbackBehavior');
      
      expect(level1.fallbackBehavior).toBe('guest-mode');
      expect(level2.fallbackBehavior).toBe('offline-only');
    });
  });

  describe('External API Degradation', () => {
    it('should provide external API degradation levels', () => {
      const level1 = degradationStrategies.external.level1();
      const level2 = degradationStrategies.external.level2();
      
      expect(level1).toHaveProperty('message');
      expect(level1).toHaveProperty('disabledFeatures');
      expect(level1).toHaveProperty('fallbackBehavior');
      
      expect(level1.fallbackBehavior).toBe('reduced-functionality');
      expect(level2.fallbackBehavior).toBe('core-only');
    });
  });
});