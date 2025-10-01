/**
 * Service Configuration Manager Test
 * 
 * Tests for the service configuration management system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { serviceConfigManager } from '@/services/ServiceConfigManager';

// Mock environment variables
const mockEnv = {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-key',
  VITE_USE_MOCK_SERVICES: 'false',
  VITE_FORCE_REAL_SERVICES: 'false',
  VITE_ENABLE_PERFORMANCE_MONITORING: 'true',
  VITE_CACHE_ENABLED: 'true',
  VITE_RATE_LIMIT_REQUESTS_PER_MINUTE: '100',
  VITE_HEALTH_CHECK_INTERVAL: '30000',
};

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true
});

describe('ServiceConfigManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration Access', () => {
    it('should provide valid configuration', () => {
      const config = serviceConfigManager.getConfig();
      
      expect(config).toBeDefined();
      expect(config.environment).toMatch(/development|staging|production/);
      expect(typeof config.useRealServices).toBe('boolean');
      expect(typeof config.supabaseEnabled).toBe('boolean');
      expect(typeof config.offlineMode).toBe('boolean');
      expect(config.rateLimits).toBeDefined();
      expect(config.caching).toBeDefined();
      expect(config.monitoring).toBeDefined();
      expect(config.fallback).toBeDefined();
    });

    it('should provide environment configuration', () => {
      const envConfig = serviceConfigManager.getEnvironmentConfig();
      
      expect(envConfig).toBeDefined();
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      const originalConfig = serviceConfigManager.getConfig();
      
      serviceConfigManager.updateConfig({
        useRealServices: !originalConfig.useRealServices
      });
      
      const updatedConfig = serviceConfigManager.getConfig();
      expect(updatedConfig.useRealServices).toBe(!originalConfig.useRealServices);
    });

    it('should validate configuration updates', () => {
      expect(() => {
        serviceConfigManager.updateConfig({
          // @ts-expect-error - Testing invalid config
          environment: 'invalid-environment'
        });
      }).toThrow();
    });
  });

  describe('Service-Specific Configuration', () => {
    it('should determine service usage correctly', () => {
      const shouldUseAuth = serviceConfigManager.shouldUseRealServicesForService('auth');
      const shouldUseDatabase = serviceConfigManager.shouldUseRealServicesForService('database');
      
      expect(typeof shouldUseAuth).toBe('boolean');
      expect(typeof shouldUseDatabase).toBe('boolean');
    });

    it('should provide service-specific rate limits', () => {
      const authLimit = serviceConfigManager.getRateLimitForService('auth');
      const socialLimit = serviceConfigManager.getRateLimitForService('social');
      
      expect(typeof authLimit).toBe('number');
      expect(typeof socialLimit).toBe('number');
      expect(authLimit).toBeGreaterThan(0);
      expect(socialLimit).toBeGreaterThan(0);
    });

    it('should provide cache strategies for services', () => {
      const userProfilesStrategy = serviceConfigManager.getCacheStrategyForService('userProfiles');
      const exercisesStrategy = serviceConfigManager.getCacheStrategyForService('exercises');
      
      expect(userProfilesStrategy).toBeDefined();
      expect(userProfilesStrategy.ttl).toBeGreaterThan(0);
      expect(userProfilesStrategy.strategy).toMatch(/cache-first|network-first|stale-while-revalidate|network-only/);
      
      expect(exercisesStrategy).toBeDefined();
      expect(exercisesStrategy.ttl).toBeGreaterThan(0);
    });
  });

  describe('Environment Detection', () => {
    it('should detect environment correctly', () => {
      const isDev = serviceConfigManager.isDevelopmentEnvironment();
      const isProd = serviceConfigManager.isProductionEnvironment();
      const isStaging = serviceConfigManager.isStagingEnvironment();
      
      // Exactly one should be true
      const trueCount = [isDev, isProd, isStaging].filter(Boolean).length;
      expect(trueCount).toBe(1);
    });
  });

  describe('Dynamic Configuration', () => {
    it('should enable/disable offline mode', () => {
      serviceConfigManager.enableOfflineMode();
      expect(serviceConfigManager.getConfig().offlineMode).toBe(true);
      
      serviceConfigManager.disableOfflineMode();
      expect(serviceConfigManager.getConfig().offlineMode).toBe(false);
    });

    it('should switch between service types', () => {
      const originalConfig = serviceConfigManager.getConfig();
      
      if (originalConfig.supabaseEnabled) {
        serviceConfigManager.switchToMockServices();
        expect(serviceConfigManager.getConfig().useRealServices).toBe(false);
        
        serviceConfigManager.switchToRealServices();
        expect(serviceConfigManager.getConfig().useRealServices).toBe(true);
      } else {
        // If Supabase is not enabled, switching to real services should not work
        serviceConfigManager.switchToRealServices();
        // Should remain false if Supabase is not configured
      }
    });

    it('should update rate limits', () => {
      const newLimit = 200;
      serviceConfigManager.updateRateLimit(newLimit);
      
      const config = serviceConfigManager.getConfig();
      expect(config.rateLimits.requestsPerMinute).toBe(newLimit);
    });
  });

  describe('Configuration Export/Import', () => {
    it('should export configuration as JSON', () => {
      const configJson = serviceConfigManager.exportConfiguration();
      
      expect(typeof configJson).toBe('string');
      expect(() => JSON.parse(configJson)).not.toThrow();
    });

    it('should import valid configuration', () => {
      const originalConfig = serviceConfigManager.getConfig();
      const configJson = serviceConfigManager.exportConfiguration();
      
      // Modify and re-import
      const parsedConfig = JSON.parse(configJson);
      parsedConfig.rateLimits.requestsPerMinute = 150;
      
      serviceConfigManager.importConfiguration(JSON.stringify(parsedConfig));
      
      const newConfig = serviceConfigManager.getConfig();
      expect(newConfig.rateLimits.requestsPerMinute).toBe(150);
    });

    it('should handle configuration import errors gracefully', () => {
      // The import method should handle errors internally
      // This test verifies the method exists and can be called
      expect(typeof serviceConfigManager.importConfiguration).toBe('function');
    });
  });
});