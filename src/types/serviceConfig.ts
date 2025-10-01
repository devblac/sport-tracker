/**
 * Service Configuration Types
 * 
 * Type definitions for service registry configuration and monitoring.
 */

export interface ServiceConfig {
  environment: 'development' | 'staging' | 'production';
  useRealServices: boolean;
  supabaseEnabled: boolean;
  offlineMode: boolean;
  rateLimits: RateLimitConfig;
  caching: CacheConfig;
  monitoring: MonitoringConfig;
  fallback: FallbackConfig;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
  backoffStrategy: 'exponential' | 'linear';
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export interface CacheConfig {
  enabled: boolean;
  defaultTTL: number;
  maxSize: number;
  strategies: {
    userProfiles: CacheStrategy;
    exercises: CacheStrategy;
    workouts: CacheStrategy;
    social: CacheStrategy;
    achievements: CacheStrategy;
  };
}

export interface CacheStrategy {
  ttl: number;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';
  maxAge?: number;
  staleWhileRevalidate?: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  healthCheckInterval: number;
  performanceTracking: boolean;
  errorReporting: boolean;
  metricsCollection: boolean;
}

export interface FallbackConfig {
  enabled: boolean;
  gracefulDegradation: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  retryOnFailure: boolean;
}

export interface ServiceStatus {
  service: string;
  status: 'connected' | 'fallback' | 'error' | 'degraded';
  lastHealthCheck: Date;
  errorCount: number;
  consecutiveErrors: number;
  performance: ServicePerformance;
  circuitBreakerOpen: boolean;
}

export interface ServicePerformance {
  averageResponseTime: number;
  successRate: number;
  cacheHitRate: number;
  requestCount: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface HealthCheckResult {
  supabase: boolean;
  auth: boolean;
  database: boolean;
  social: boolean;
  gamification: boolean;
  workout: boolean;
  overall: boolean;
  timestamp: Date;
  details: Record<string, any>;
}

export interface ServiceMetrics {
  timestamp: Date;
  service: string;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  cacheHit?: boolean;
  retryCount?: number;
}

export interface CircuitBreakerState {
  service: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

export type ServiceType = 'auth' | 'gamification' | 'workout' | 'social' | 'database' | 'notifications';

export interface ServiceRegistryEvents {
  'service-status-changed': { service: ServiceType; status: ServiceStatus };
  'health-check-completed': { results: HealthCheckResult };
  'circuit-breaker-opened': { service: ServiceType; reason: string };
  'circuit-breaker-closed': { service: ServiceType };
  'fallback-activated': { service: ServiceType; reason: string };
  'performance-degraded': { service: ServiceType; metrics: ServicePerformance };
}