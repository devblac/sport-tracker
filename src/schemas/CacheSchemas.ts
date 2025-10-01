/**
 * Enhanced Zod Schemas for Cache Services
 * Provides runtime type validation and better type safety
 */

import { z } from 'zod';

// Base cache entry schema
export const CacheEntrySchema = z.object({
  key: z.string().min(1),
  data: z.any(),
  timestamp: z.date(),
  ttl: z.number().positive(),
  tags: z.array(z.string()).default([]),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  accessCount: z.number().nonnegative().default(0),
  lastAccessed: z.date(),
  size: z.number().nonnegative(),
  version: z.number().positive().default(1),
  dependencies: z.array(z.string()).default([])
});

export type CacheEntry<T = any> = z.infer<typeof CacheEntrySchema> & {
  data: T;
};

// Cache configuration schema
export const CacheConfigurationSchema = z.object({
  memoryMaxSize: z.number().positive().default(50 * 1024 * 1024),
  localStorageMaxSize: z.number().positive().default(10 * 1024 * 1024),
  serviceWorkerMaxSize: z.number().positive().default(100 * 1024 * 1024),
  defaultTTL: z.number().positive().default(5 * 60 * 1000),
  enableServiceWorker: z.boolean().default(true),
  enableLocalStorage: z.boolean().default(true),
  enableIntelligentPrefetch: z.boolean().default(true),
  optimizationInterval: z.number().positive().default(5 * 60 * 1000)
});

export type CacheConfiguration = z.infer<typeof CacheConfigurationSchema>;

// Query optimizer configuration schema
export const QueryOptimizerConfigSchema = z.object({
  cacheMaxSize: z.number().positive().default(50 * 1024 * 1024),
  cacheDefaultTTL: z.number().positive().default(5 * 60 * 1000),
  batchSize: z.number().positive().default(10),
  batchTimeout: z.number().positive().default(100),
  slowQueryThreshold: z.number().positive().default(1000),
  enableQueryAnalysis: z.boolean().default(true),
  enableBatching: z.boolean().default(true),
  enableCaching: z.boolean().default(true)
});

export type QueryOptimizerConfig = z.infer<typeof QueryOptimizerConfigSchema>;

// Service monitoring configuration schema
export const ServiceMonitoringConfigSchema = z.object({
  healthCheckInterval: z.number().positive().default(30000),
  healthCheckTimeout: z.number().positive().default(5000),
  alertThreshold: z.number().positive().default(3),
  circuitBreakerFailureThreshold: z.number().positive().default(5),
  circuitBreakerRecoveryTimeout: z.number().positive().default(60000),
  enableMetrics: z.boolean().default(true),
  enableAlerts: z.boolean().default(true)
});

export type ServiceMonitoringConfig = z.infer<typeof ServiceMonitoringConfigSchema>;

// Validation utilities
export class SchemaValidator {
  static validateCacheEntry<T>(entry: unknown): CacheEntry<T> {
    const result = CacheEntrySchema.safeParse(entry);
    if (!result.success) {
      throw new Error(`Invalid cache entry: ${result.error.message}`);
    }
    return result.data as CacheEntry<T>;
  }

  static validateCacheConfig(config: unknown): CacheConfiguration {
    const result = CacheConfigurationSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid cache configuration: ${result.error.message}`);
    }
    return result.data;
  }

  static validateQueryConfig(config: unknown): QueryOptimizerConfig {
    const result = QueryOptimizerConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid query optimizer configuration: ${result.error.message}`);
    }
    return result.data;
  }

  static validateServiceConfig(config: unknown): ServiceMonitoringConfig {
    const result = ServiceMonitoringConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid service monitoring configuration: ${result.error.message}`);
    }
    return result.data;
  }
}