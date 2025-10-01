/**
 * Service Configuration Validation Schemas
 * 
 * Zod schemas for validating service configuration and monitoring data.
 */

import { z } from 'zod';

export const RateLimitConfigSchema = z.object({
  requestsPerMinute: z.number().min(1).max(1000).default(60),
  burstLimit: z.number().min(1).max(100).default(10),
  backoffStrategy: z.enum(['exponential', 'linear']).default('exponential'),
  maxRetries: z.number().min(0).max(10).default(3),
  baseDelay: z.number().min(100).max(5000).default(1000),
  maxDelay: z.number().min(1000).max(30000).default(10000),
});

export const CacheStrategySchema = z.object({
  ttl: z.number().min(1000).max(3600000).default(300000), // 5 minutes default
  strategy: z.enum(['cache-first', 'network-first', 'stale-while-revalidate', 'network-only']).default('network-first'),
  maxAge: z.number().min(1000).optional(),
  staleWhileRevalidate: z.number().min(1000).optional(),
});

export const CacheConfigSchema = z.object({
  enabled: z.boolean().default(true),
  defaultTTL: z.number().min(1000).max(3600000).default(300000),
  maxSize: z.number().min(10).max(1000).default(100),
  strategies: z.object({
    userProfiles: CacheStrategySchema.default({
      ttl: 300000, // 5 minutes
      strategy: 'stale-while-revalidate'
    }),
    exercises: CacheStrategySchema.default({
      ttl: 3600000, // 1 hour
      strategy: 'cache-first'
    }),
    workouts: CacheStrategySchema.default({
      ttl: 60000, // 1 minute
      strategy: 'network-first'
    }),
    social: CacheStrategySchema.default({
      ttl: 30000, // 30 seconds
      strategy: 'network-only'
    }),
    achievements: CacheStrategySchema.default({
      ttl: 600000, // 10 minutes
      strategy: 'cache-first'
    }),
  }),
});

export const MonitoringConfigSchema = z.object({
  enabled: z.boolean().default(true),
  healthCheckInterval: z.number().min(5000).max(300000).default(30000), // 30 seconds
  performanceTracking: z.boolean().default(true),
  errorReporting: z.boolean().default(true),
  metricsCollection: z.boolean().default(true),
});

export const FallbackConfigSchema = z.object({
  enabled: z.boolean().default(true),
  gracefulDegradation: z.boolean().default(true),
  circuitBreakerThreshold: z.number().min(1).max(20).default(5),
  circuitBreakerTimeout: z.number().min(5000).max(300000).default(60000), // 1 minute
  retryOnFailure: z.boolean().default(true),
});

export const ServiceConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  useRealServices: z.boolean().default(false),
  supabaseEnabled: z.boolean().default(false),
  offlineMode: z.boolean().default(false),
  rateLimits: RateLimitConfigSchema.default({}),
  caching: CacheConfigSchema.default({}),
  monitoring: MonitoringConfigSchema.default({}),
  fallback: FallbackConfigSchema.default({}),
});

export const ServicePerformanceSchema = z.object({
  averageResponseTime: z.number().min(0).default(0),
  successRate: z.number().min(0).max(1).default(1),
  cacheHitRate: z.number().min(0).max(1).default(0),
  requestCount: z.number().min(0).default(0),
  errorRate: z.number().min(0).max(1).default(0),
  p95ResponseTime: z.number().min(0).default(0),
  p99ResponseTime: z.number().min(0).default(0),
});

export const ServiceStatusSchema = z.object({
  service: z.string(),
  status: z.enum(['connected', 'fallback', 'error', 'degraded']).default('connected'),
  lastHealthCheck: z.date().default(() => new Date()),
  errorCount: z.number().min(0).default(0),
  consecutiveErrors: z.number().min(0).default(0),
  performance: ServicePerformanceSchema.default({}),
  circuitBreakerOpen: z.boolean().default(false),
});

export const HealthCheckResultSchema = z.object({
  supabase: z.boolean().default(false),
  auth: z.boolean().default(false),
  database: z.boolean().default(false),
  social: z.boolean().default(false),
  gamification: z.boolean().default(false),
  workout: z.boolean().default(false),
  overall: z.boolean().default(false),
  timestamp: z.date().default(() => new Date()),
  details: z.record(z.any()).default({}),
});

export const ServiceMetricsSchema = z.object({
  timestamp: z.date().default(() => new Date()),
  service: z.string(),
  operation: z.string(),
  duration: z.number().min(0),
  success: z.boolean(),
  error: z.string().optional(),
  cacheHit: z.boolean().optional(),
  retryCount: z.number().min(0).optional(),
});

export const CircuitBreakerStateSchema = z.object({
  service: z.string(),
  state: z.enum(['closed', 'open', 'half-open']).default('closed'),
  failureCount: z.number().min(0).default(0),
  lastFailureTime: z.date().optional(),
  nextAttemptTime: z.date().optional(),
});

// Environment variable validation
export const EnvironmentConfigSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  VITE_USE_MOCK_SERVICES: z.enum(['true', 'false']).optional(),
  VITE_FORCE_REAL_SERVICES: z.enum(['true', 'false']).optional(),
  VITE_ENABLE_PERFORMANCE_MONITORING: z.enum(['true', 'false']).optional(),
  VITE_CACHE_ENABLED: z.enum(['true', 'false']).optional(),
  VITE_RATE_LIMIT_REQUESTS_PER_MINUTE: z.string().regex(/^\d+$/).optional(),
  VITE_HEALTH_CHECK_INTERVAL: z.string().regex(/^\d+$/).optional(),
});

// Type exports
export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type CacheStrategy = z.infer<typeof CacheStrategySchema>;
export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>;
export type FallbackConfig = z.infer<typeof FallbackConfigSchema>;
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;
export type ServicePerformance = z.infer<typeof ServicePerformanceSchema>;
export type HealthCheckResult = z.infer<typeof HealthCheckResultSchema>;
export type ServiceMetrics = z.infer<typeof ServiceMetricsSchema>;
export type CircuitBreakerState = z.infer<typeof CircuitBreakerStateSchema>;
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;