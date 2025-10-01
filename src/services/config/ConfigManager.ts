/**
 * Configuration Management
 * Centralized configuration with validation and environment support
 */

import { z } from 'zod';

// Environment-specific configuration schema
const EnvironmentConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_SUPABASE_URL: z.string().url('Invalid URL format').optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  VITE_AWS_REGION: z.string().optional(),
  VITE_AWS_ACCESS_KEY_ID: z.string().optional(),
  VITE_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').pipe(z.boolean()).default(false),
  VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

// Application configuration schema
const AppConfigSchema = z.object({
  cache: z.object({
    memoryMaxSize: z.number().positive().default(50 * 1024 * 1024),
    localStorageMaxSize: z.number().positive().default(10 * 1024 * 1024),
    serviceWorkerMaxSize: z.number().positive().default(100 * 1024 * 1024),
    defaultTTL: z.number().positive().default(5 * 60 * 1000),
    enableServiceWorker: z.boolean().default(true),
    enableLocalStorage: z.boolean().default(true)
  }),
  
  database: z.object({
    maxConnections: z.number().positive().default(10),
    connectionTimeout: z.number().positive().default(30000),
    queryTimeout: z.number().positive().default(10000),
    retryAttempts: z.number().nonnegative().default(3),
    batchSize: z.number().positive().default(10)
  }),

  monitoring: z.object({
    healthCheckInterval: z.number().positive().default(30000),
    metricsRetention: z.number().positive().default(24 * 60 * 60 * 1000),
    alertThreshold: z.number().positive().default(3),
    enableCircuitBreaker: z.boolean().default(true)
  }),

  features: z.object({
    enableOfflineMode: z.boolean().default(true),
    enableSocialFeatures: z.boolean().default(true),
    enableAnalytics: z.boolean().default(false),
    enableExperiments: z.boolean().default(false)
  })
});

export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

export class ConfigManager {
  private static instance: ConfigManager;
  private envConfig: EnvironmentConfig;
  private appConfig: AppConfig;
  private overrides = new Map<string, any>();

  private constructor() {
    this.envConfig = this.loadEnvironmentConfig();
    this.appConfig = this.loadApplicationConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Get environment configuration
   */
  getEnvConfig(): EnvironmentConfig {
    return { ...this.envConfig };
  }

  /**
   * Get application configuration
   */
  getAppConfig(): AppConfig {
    return this.applyOverrides(this.appConfig);
  }

  /**
   * Get specific configuration section
   */
  get<K extends keyof AppConfig>(section: K): AppConfig[K] {
    return this.getAppConfig()[section];
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    return this.get('features')[feature];
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig(): AppConfig['database'] {
    return this.get('database');
  }

  /**
   * Get cache configuration
   */
  getCacheConfig(): AppConfig['cache'] {
    return this.get('cache');
  }

  /**
   * Get monitoring configuration
   */
  getMonitoringConfig(): AppConfig['monitoring'] {
    return this.get('monitoring');
  }

  /**
   * Override configuration values (useful for testing)
   */
  override(path: string, value: any): void {
    this.overrides.set(path, value);
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.overrides.clear();
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      EnvironmentConfigSchema.parse(this.envConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map((e: z.ZodIssue) => `Environment: ${e.path.join('.')}: ${e.message}`));
      }
    }

    try {
      AppConfigSchema.parse(this.appConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map((e: z.ZodIssue) => `Application: ${e.path.join('.')}: ${e.message}`));
      }
    }

    // Custom validation rules
    if (this.appConfig.cache.memoryMaxSize > 100 * 1024 * 1024) {
      errors.push('Memory cache size should not exceed 100MB for optimal performance');
    }

    if (this.appConfig.database.maxConnections > 20) {
      errors.push('Database connections should not exceed 20 for Supabase free tier');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get configuration summary for debugging
   */
  getSummary(): Record<string, any> {
    return {
      environment: this.envConfig.NODE_ENV,
      features: this.appConfig.features,
      cache: {
        memorySize: `${Math.round(this.appConfig.cache.memoryMaxSize / 1024 / 1024)}MB`,
        ttl: `${this.appConfig.cache.defaultTTL / 1000}s`
      },
      database: {
        maxConnections: this.appConfig.database.maxConnections,
        timeout: `${this.appConfig.database.connectionTimeout / 1000}s`
      },
      overrides: Object.fromEntries(this.overrides)
    };
  }

  private loadEnvironmentConfig(): EnvironmentConfig {
    const env = {
      NODE_ENV: import.meta.env.NODE_ENV,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_AWS_REGION: import.meta.env.VITE_AWS_REGION,
      VITE_AWS_ACCESS_KEY_ID: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
      VITE_LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL
    };

    const result = EnvironmentConfigSchema.safeParse(env);
    if (!result.success) {
      console.warn('Environment configuration validation failed:', result.error);
      return EnvironmentConfigSchema.parse({});
    }

    return result.data;
  }

  private loadApplicationConfig(): AppConfig {
    // Load from localStorage if available (for user preferences)
    let storedConfig = {};
    try {
      const stored = localStorage.getItem('app-config');
      if (stored) {
        storedConfig = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load stored configuration:', error);
    }

    // Environment-specific defaults
    const environmentDefaults = this.getEnvironmentDefaults();

    // Merge configurations
    const config = {
      ...environmentDefaults,
      ...storedConfig
    };

    const result = AppConfigSchema.safeParse(config);
    if (!result.success) {
      console.warn('Application configuration validation failed:', result.error);
      return AppConfigSchema.parse({});
    }

    return result.data;
  }

  private getEnvironmentDefaults(): Partial<AppConfig> {
    const env = this.envConfig.NODE_ENV;

    switch (env) {
      case 'development':
        return {
          cache: { 
            defaultTTL: 1 * 60 * 1000,
            memoryMaxSize: 50 * 1024 * 1024,
            localStorageMaxSize: 10 * 1024 * 1024,
            serviceWorkerMaxSize: 100 * 1024 * 1024,
            enableServiceWorker: true,
            enableLocalStorage: true
          },
          database: { 
            maxConnections: 5,
            connectionTimeout: 30000,
            queryTimeout: 10000,
            retryAttempts: 3,
            batchSize: 10
          },
          monitoring: { 
            healthCheckInterval: 10000,
            metricsRetention: 24 * 60 * 60 * 1000,
            alertThreshold: 3,
            enableCircuitBreaker: true
          },
          features: { 
            enableOfflineMode: true,
            enableSocialFeatures: true,
            enableAnalytics: false, 
            enableExperiments: true 
          }
        };

      case 'staging':
        return {
          cache: { 
            defaultTTL: 2 * 60 * 1000,
            memoryMaxSize: 50 * 1024 * 1024,
            localStorageMaxSize: 10 * 1024 * 1024,
            serviceWorkerMaxSize: 100 * 1024 * 1024,
            enableServiceWorker: true,
            enableLocalStorage: true
          },
          database: { 
            maxConnections: 8,
            connectionTimeout: 30000,
            queryTimeout: 10000,
            retryAttempts: 3,
            batchSize: 10
          },
          monitoring: { 
            healthCheckInterval: 30000,
            metricsRetention: 24 * 60 * 60 * 1000,
            alertThreshold: 3,
            enableCircuitBreaker: true
          },
          features: { 
            enableOfflineMode: true,
            enableSocialFeatures: true,
            enableAnalytics: true, 
            enableExperiments: true 
          }
        };

      case 'production':
        return {
          cache: { 
            defaultTTL: 5 * 60 * 1000,
            memoryMaxSize: 50 * 1024 * 1024,
            localStorageMaxSize: 10 * 1024 * 1024,
            serviceWorkerMaxSize: 100 * 1024 * 1024,
            enableServiceWorker: true,
            enableLocalStorage: true
          },
          database: { 
            maxConnections: 10,
            connectionTimeout: 30000,
            queryTimeout: 10000,
            retryAttempts: 3,
            batchSize: 10
          },
          monitoring: { 
            healthCheckInterval: 30000,
            metricsRetention: 24 * 60 * 60 * 1000,
            alertThreshold: 3,
            enableCircuitBreaker: true
          },
          features: { 
            enableOfflineMode: true,
            enableSocialFeatures: true,
            enableAnalytics: true, 
            enableExperiments: false 
          }
        };

      default:
        return {};
    }
  }

  private applyOverrides(config: AppConfig): AppConfig {
    let result = { ...config };

    for (const [path, value] of this.overrides) {
      const keys = path.split('.');
      let current: any = result;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
    }

    return result;
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();