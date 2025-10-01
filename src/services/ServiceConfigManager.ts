/**
 * Service Configuration Manager
 * 
 * Manages service configuration, environment variable parsing, and validation.
 * Provides centralized configuration management for the service registry.
 */

import { 
  ServiceConfigSchema, 
  EnvironmentConfigSchema,
  type ServiceConfig,
  type EnvironmentConfig 
} from '@/schemas/serviceConfig';
import { logger } from '@/utils/logger';

export class ServiceConfigManager {
  private static instance: ServiceConfigManager;
  private config: ServiceConfig;
  private environmentConfig: EnvironmentConfig;

  private constructor() {
    this.environmentConfig = this.parseEnvironmentVariables();
    this.config = this.buildServiceConfig();
    this.validateConfiguration();
  }

  public static getInstance(): ServiceConfigManager {
    if (!ServiceConfigManager.instance) {
      ServiceConfigManager.instance = new ServiceConfigManager();
    }
    return ServiceConfigManager.instance;
  }

  // ============================================================================
  // Configuration Access
  // ============================================================================

  getConfig(): ServiceConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ServiceConfig>): void {
    const newConfig = { ...this.config, ...updates };
    
    try {
      const validatedConfig = ServiceConfigSchema.parse(newConfig);
      this.config = validatedConfig;
      logger.info('Service configuration updated', { updates });
    } catch (error) {
      logger.error('Invalid service configuration update', { error, updates });
      throw new Error('Invalid service configuration');
    }
  }

  getEnvironmentConfig(): EnvironmentConfig {
    return { ...this.environmentConfig };
  }

  // ============================================================================
  // Environment Variable Parsing
  // ============================================================================

  private parseEnvironmentVariables(): EnvironmentConfig {
    const envVars = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_USE_MOCK_SERVICES: import.meta.env.VITE_USE_MOCK_SERVICES,
      VITE_FORCE_REAL_SERVICES: import.meta.env.VITE_FORCE_REAL_SERVICES,
      VITE_ENABLE_PERFORMANCE_MONITORING: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING,
      VITE_CACHE_ENABLED: import.meta.env.VITE_CACHE_ENABLED,
      VITE_RATE_LIMIT_REQUESTS_PER_MINUTE: import.meta.env.VITE_RATE_LIMIT_REQUESTS_PER_MINUTE,
      VITE_HEALTH_CHECK_INTERVAL: import.meta.env.VITE_HEALTH_CHECK_INTERVAL,
    };

    try {
      return EnvironmentConfigSchema.parse(envVars);
    } catch (error) {
      logger.warn('Invalid environment configuration, using defaults', { error });
      return {};
    }
  }

  // ============================================================================
  // Service Configuration Building
  // ============================================================================

  private buildServiceConfig(): ServiceConfig {
    const environment = this.determineEnvironment();
    const useRealServices = this.shouldUseRealServices();
    const supabaseEnabled = this.isSupabaseEnabled();

    const baseConfig = {
      environment,
      useRealServices,
      supabaseEnabled,
      offlineMode: !navigator.onLine,
      rateLimits: this.buildRateLimitConfig(),
      caching: this.buildCacheConfig(),
      monitoring: this.buildMonitoringConfig(),
      fallback: this.buildFallbackConfig(),
    };

    try {
      return ServiceConfigSchema.parse(baseConfig);
    } catch (error) {
      logger.error('Failed to build service configuration', { error });
      // Return minimal safe configuration
      return ServiceConfigSchema.parse({});
    }
  }

  private determineEnvironment(): 'development' | 'staging' | 'production' {
    if (import.meta.env.PROD) {
      return 'production';
    }
    
    if (import.meta.env.MODE === 'staging') {
      return 'staging';
    }
    
    return 'development';
  }

  private shouldUseRealServices(): boolean {
    // Explicit override to use mock services
    if (this.environmentConfig.VITE_USE_MOCK_SERVICES === 'true') {
      return false;
    }

    // Explicit override to use real services
    if (this.environmentConfig.VITE_FORCE_REAL_SERVICES === 'true') {
      return true;
    }

    // Default behavior based on environment
    const environment = this.determineEnvironment();
    
    switch (environment) {
      case 'production':
        return true;
      case 'staging':
        return true;
      case 'development':
        return this.isSupabaseEnabled(); // Use real services in dev only if Supabase is configured
      default:
        return false;
    }
  }

  private isSupabaseEnabled(): boolean {
    const supabaseUrl = this.environmentConfig.VITE_SUPABASE_URL;
    const supabaseKey = this.environmentConfig.VITE_SUPABASE_ANON_KEY;
    
    return !!(supabaseUrl && supabaseKey);
  }

  private buildRateLimitConfig() {
    const requestsPerMinute = this.environmentConfig.VITE_RATE_LIMIT_REQUESTS_PER_MINUTE
      ? parseInt(this.environmentConfig.VITE_RATE_LIMIT_REQUESTS_PER_MINUTE, 10)
      : undefined;

    return {
      requestsPerMinute: requestsPerMinute || (this.config?.environment === 'production' ? 100 : 60),
      burstLimit: this.config?.environment === 'production' ? 20 : 10,
      backoffStrategy: 'exponential' as const,
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    };
  }

  private buildCacheConfig() {
    const cacheEnabled = this.environmentConfig.VITE_CACHE_ENABLED !== 'false';
    
    return {
      enabled: cacheEnabled,
      defaultTTL: 300000, // 5 minutes
      maxSize: 100,
      strategies: {
        userProfiles: {
          ttl: 300000, // 5 minutes
          strategy: 'stale-while-revalidate' as const
        },
        exercises: {
          ttl: 3600000, // 1 hour
          strategy: 'cache-first' as const
        },
        workouts: {
          ttl: 60000, // 1 minute
          strategy: 'network-first' as const
        },
        social: {
          ttl: 30000, // 30 seconds
          strategy: 'network-only' as const
        },
        achievements: {
          ttl: 600000, // 10 minutes
          strategy: 'cache-first' as const
        },
      },
    };
  }

  private buildMonitoringConfig() {
    const performanceMonitoring = this.environmentConfig.VITE_ENABLE_PERFORMANCE_MONITORING !== 'false';
    const healthCheckInterval = this.environmentConfig.VITE_HEALTH_CHECK_INTERVAL
      ? parseInt(this.environmentConfig.VITE_HEALTH_CHECK_INTERVAL, 10)
      : 30000;

    return {
      enabled: true,
      healthCheckInterval,
      performanceTracking: performanceMonitoring,
      errorReporting: true,
      metricsCollection: performanceMonitoring,
    };
  }

  private buildFallbackConfig() {
    return {
      enabled: true,
      gracefulDegradation: true,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000, // 1 minute
      retryOnFailure: true,
    };
  }

  // ============================================================================
  // Configuration Validation
  // ============================================================================

  private validateConfiguration(): void {
    try {
      ServiceConfigSchema.parse(this.config);
      logger.info('Service configuration validated successfully', {
        environment: this.config.environment,
        useRealServices: this.config.useRealServices,
        supabaseEnabled: this.config.supabaseEnabled
      });
    } catch (error) {
      logger.error('Service configuration validation failed', { error });
      throw new Error('Invalid service configuration');
    }
  }

  // ============================================================================
  // Configuration Utilities
  // ============================================================================

  isProductionEnvironment(): boolean {
    return this.config.environment === 'production';
  }

  isDevelopmentEnvironment(): boolean {
    return this.config.environment === 'development';
  }

  isStagingEnvironment(): boolean {
    return this.config.environment === 'staging';
  }

  shouldUseRealServicesForService(serviceName: string): boolean {
    // Special cases for specific services
    switch (serviceName) {
      case 'auth':
        return this.config.useRealServices && this.config.supabaseEnabled;
      case 'database':
        return this.config.supabaseEnabled;
      case 'social':
      case 'gamification':
        return this.config.useRealServices && this.config.supabaseEnabled;
      case 'workout':
        return this.config.useRealServices;
      default:
        return this.config.useRealServices;
    }
  }

  getRateLimitForService(serviceName: string): number {
    // Service-specific rate limits
    const baseLimit = this.config.rateLimits.requestsPerMinute;
    
    switch (serviceName) {
      case 'auth':
        return Math.floor(baseLimit * 0.1); // 10% of base limit for auth
      case 'social':
        return Math.floor(baseLimit * 0.3); // 30% for social features
      case 'workout':
        return Math.floor(baseLimit * 0.4); // 40% for workout operations
      case 'gamification':
        return Math.floor(baseLimit * 0.2); // 20% for gamification
      default:
        return baseLimit;
    }
  }

  getCacheStrategyForService(serviceName: string) {
    return this.config.caching.strategies[serviceName as keyof typeof this.config.caching.strategies] 
      || {
        ttl: this.config.caching.defaultTTL,
        strategy: 'network-first' as const
      };
  }

  // ============================================================================
  // Dynamic Configuration Updates
  // ============================================================================

  enableOfflineMode(): void {
    this.updateConfig({ offlineMode: true });
  }

  disableOfflineMode(): void {
    this.updateConfig({ offlineMode: false });
  }

  switchToMockServices(): void {
    this.updateConfig({ useRealServices: false });
    logger.info('Switched to mock services');
  }

  switchToRealServices(): void {
    if (!this.config.supabaseEnabled) {
      logger.warn('Cannot switch to real services: Supabase not configured');
      return;
    }
    
    this.updateConfig({ useRealServices: true });
    logger.info('Switched to real services');
  }

  updateRateLimit(requestsPerMinute: number): void {
    const rateLimits = {
      ...this.config.rateLimits,
      requestsPerMinute
    };
    this.updateConfig({ rateLimits });
  }

  // ============================================================================
  // Configuration Export/Import
  // ============================================================================

  exportConfiguration(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfiguration(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      const validatedConfig = ServiceConfigSchema.parse(importedConfig);
      this.config = validatedConfig;
      logger.info('Configuration imported successfully');
    } catch (error) {
      logger.error('Failed to import configuration', { error });
      throw new Error('Invalid configuration format');
    }
  }
}

// Export singleton instance
export const serviceConfigManager = ServiceConfigManager.getInstance();