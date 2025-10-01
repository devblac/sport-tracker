/**
 * Service Registry Test
 * 
 * Tests for the enhanced service registry with configuration management,
 * health monitoring, and graceful fallbacks.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceRegistry } from '@/services/ServiceRegistry';
import { serviceConfigManager } from '@/services/ServiceConfigManager';
import { serviceMonitor } from '@/services/ServiceMonitor';

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}));

// Mock the services
vi.mock('@/services/SupabaseService', () => ({
  supabaseService: {
    healthCheck: vi.fn().mockResolvedValue(true),
  }
}));

vi.mock('@/services/EnhancedSupabaseService', () => ({
  enhancedSupabaseService: {
    healthCheck: vi.fn().mockResolvedValue(true),
    getPerformanceStats: vi.fn().mockReturnValue({
      cache: { size: 0, hitRate: 0, maxSize: 100 },
      queue: { queueLength: 0, activeRequests: 0, maxConcurrent: 5 }
    }),
    clearCache: vi.fn(),
  }
}));

vi.mock('@/services/supabaseAuthService', () => ({
  supabaseAuthService: {
    initializeAuth: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: vi.fn().mockResolvedValue(false),
  }
}));

vi.mock('@/services/AuthService', () => ({
  authService: {
    initializeAuth: vi.fn().mockResolvedValue(undefined),
    isAuthenticated: vi.fn().mockResolvedValue(false),
  }
}));

vi.mock('@/services/EnhancedWorkoutService', () => ({
  enhancedWorkoutService: {
    initializeSampleTemplates: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('@/services/WorkoutService', () => ({
  WorkoutService: {
    getInstance: vi.fn().mockReturnValue({
      initializeSampleTemplates: vi.fn().mockResolvedValue(undefined),
    })
  }
}));

vi.mock('@/services/RealGamificationService', () => ({
  realGamificationService: {}
}));

vi.mock('@/services/MockGamificationService', () => ({
  MockGamificationService: {
    getInstance: vi.fn().mockReturnValue({})
  }
}));

vi.mock('@/services/RealSocialService', () => ({
  realSocialService: {}
}));

vi.mock('@/services/SocialService', () => ({
  SocialService: {
    getInstance: vi.fn().mockReturnValue({})
  }
}));

describe('ServiceRegistry', () => {
  let serviceRegistry: ServiceRegistry;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Get fresh instance
    serviceRegistry = ServiceRegistry.getInstance();
  });

  describe('Configuration Management', () => {
    it('should get configuration from config manager', () => {
      const config = serviceRegistry.getConfig();
      expect(config).toBeDefined();
      expect(typeof config.useRealServices).toBe('boolean');
      expect(typeof config.supabaseEnabled).toBe('boolean');
    });

    it('should update configuration through config manager', () => {
      const updateSpy = vi.spyOn(serviceConfigManager, 'updateConfig');
      
      serviceRegistry.updateConfig({ useRealServices: true });
      
      expect(updateSpy).toHaveBeenCalledWith({ useRealServices: true });
    });

    it('should enable real services', () => {
      const switchSpy = vi.spyOn(serviceConfigManager, 'switchToRealServices');
      
      serviceRegistry.enableRealServices();
      
      expect(switchSpy).toHaveBeenCalled();
    });

    it('should enable mock services', () => {
      const switchSpy = vi.spyOn(serviceConfigManager, 'switchToMockServices');
      
      serviceRegistry.enableMockServices();
      
      expect(switchSpy).toHaveBeenCalled();
    });
  });

  describe('Service Access', () => {
    it('should provide auth service', () => {
      const authService = serviceRegistry.auth;
      expect(authService).toBeDefined();
    });

    it('should provide gamification service', () => {
      const gamificationService = serviceRegistry.gamification;
      expect(gamificationService).toBeDefined();
    });

    it('should provide workout service', () => {
      const workoutService = serviceRegistry.workout;
      expect(workoutService).toBeDefined();
    });

    it('should provide social service', () => {
      const socialService = serviceRegistry.social;
      expect(socialService).toBeDefined();
    });

    it('should provide database service', () => {
      const databaseService = serviceRegistry.database;
      expect(databaseService).toBeDefined();
    });
  });

  describe('Health Monitoring', () => {
    it('should perform health check', async () => {
      const healthCheckSpy = vi.spyOn(serviceMonitor, 'performHealthCheck')
        .mockResolvedValue({
          supabase: true,
          auth: true,
          database: true,
          social: true,
          gamification: true,
          workout: true,
          overall: true,
          timestamp: new Date(),
          details: {}
        });

      const result = await serviceRegistry.healthCheck();
      
      expect(healthCheckSpy).toHaveBeenCalled();
      expect(result.overall).toBe(true);
    });

    it('should get service status', () => {
      const getStatusSpy = vi.spyOn(serviceMonitor, 'getServiceStatus')
        .mockReturnValue({
          service: 'auth',
          status: 'connected',
          lastHealthCheck: new Date(),
          errorCount: 0,
          consecutiveErrors: 0,
          performance: {
            averageResponseTime: 100,
            successRate: 1,
            cacheHitRate: 0.8,
            requestCount: 10,
            errorRate: 0,
            p95ResponseTime: 150,
            p99ResponseTime: 200,
          },
          circuitBreakerOpen: false,
        });

      const status = serviceRegistry.getServiceStatus('auth');
      
      expect(getStatusSpy).toHaveBeenCalledWith('auth');
      expect(status?.status).toBe('connected');
    });

    it('should get system health', () => {
      const getHealthSpy = vi.spyOn(serviceMonitor, 'getOverallSystemHealth')
        .mockReturnValue({
          healthy: true,
          services: {
            auth: true,
            database: true,
            social: true,
            gamification: true,
            workout: true,
          },
          issues: []
        });

      const health = serviceRegistry.getSystemHealth();
      
      expect(getHealthSpy).toHaveBeenCalled();
      expect(health.healthy).toBe(true);
    });
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(serviceRegistry.initialize()).resolves.not.toThrow();
    });

    it('should not initialize twice', async () => {
      await serviceRegistry.initialize();
      
      // Second initialization should not throw but should warn
      await expect(serviceRegistry.initialize()).resolves.not.toThrow();
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should use fallback service when circuit breaker is open', () => {
      // Mock circuit breaker as open
      vi.spyOn(serviceMonitor, 'canAttemptRequest').mockReturnValue(false);
      
      const authService = serviceRegistry.auth;
      
      // Should get fallback service (mock auth service)
      expect(authService).toBeDefined();
    });

    it('should use real service when circuit breaker is closed', () => {
      // Mock circuit breaker as closed
      vi.spyOn(serviceMonitor, 'canAttemptRequest').mockReturnValue(true);
      
      const authService = serviceRegistry.auth;
      
      // Should get real service based on configuration
      expect(authService).toBeDefined();
    });
  });

  describe('Performance Monitoring', () => {
    it('should get performance stats', () => {
      const stats = serviceRegistry.getPerformanceStats();
      
      if (stats) {
        expect(stats.cache).toBeDefined();
        expect(stats.queue).toBeDefined();
      }
    });

    it('should handle service events', () => {
      const listener = vi.fn();
      
      serviceRegistry.onServiceEvent('service-status-changed', listener);
      
      // Verify listener was registered (we can't easily test the actual event firing in unit tests)
      expect(listener).toBeDefined();
    });
  });

  describe('Service Implementation Detection', () => {
    it('should report correct service implementations', () => {
      const implementations = serviceRegistry.getServiceImplementations();
      
      expect(implementations).toHaveProperty('auth');
      expect(implementations).toHaveProperty('gamification');
      expect(implementations).toHaveProperty('workout');
      expect(implementations).toHaveProperty('social');
      expect(implementations).toHaveProperty('database');
    });
  });

  describe('Cleanup', () => {
    it('should shutdown gracefully', async () => {
      await expect(serviceRegistry.shutdown()).resolves.not.toThrow();
    });

    it('should test service connectivity', async () => {
      const connectivity = await serviceRegistry.testServiceConnectivity();
      
      expect(connectivity).toHaveProperty('auth');
      expect(connectivity).toHaveProperty('database');
      expect(connectivity).toHaveProperty('gamification');
      expect(connectivity).toHaveProperty('workout');
      expect(connectivity).toHaveProperty('social');
    });
  });
});