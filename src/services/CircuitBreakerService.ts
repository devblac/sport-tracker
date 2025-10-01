import { z } from 'zod';
import { HealthCheckService, HealthStatus, HealthCheckResult } from './HealthCheckService';

// Circuit breaker configuration schema
const CircuitBreakerConfigSchema = z.object({
  failureThreshold: z.number().positive().default(5),
  recoveryTimeout: z.number().positive().default(60000), // 1 minute
  monitoringPeriod: z.number().positive().default(10000), // 10 seconds
  expectedErrors: z.array(z.string()).default([]),
  fallbackEnabled: z.boolean().default(true),
});

export type CircuitBreakerConfig = z.infer<typeof CircuitBreakerConfigSchema>;

// Circuit breaker states
export enum CircuitBreakerState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing, rejecting calls
  HALF_OPEN = 'half_open' // Testing if service recovered
}

// Circuit breaker result
export interface CircuitBreakerResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  state: CircuitBreakerState;
  fallbackUsed: boolean;
  executionTime: number;
}

// Health check result
export interface HealthCheckResult {
  serviceName: string;
  healthy: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
}

// Service status
export interface ServiceStatus {
  name: string;
  state: CircuitBreakerState;
  failureCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
}

// Fallback function type
export type FallbackFunction<T> = (error: Error) => Promise<T> | T;

// Circuit breaker statistics
interface CircuitBreakerStats {
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  lastStateChange: number;
  responseTimes: number[];
  totalRequests: number;
}

/**
 * Circuit breaker service for protecting against cascading failures
 * Implements automatic fallback mechanisms and service health monitoring
 */
export class CircuitBreakerService {
  private circuits = new Map<string, CircuitBreakerStats>();
  private configs = new Map<string, CircuitBreakerConfig>();
  private fallbacks = new Map<string, FallbackFunction<any>>();
  private healthChecks = new Map<string, () => Promise<boolean>>();
  private monitoringInterval: NodeJS.Timeout;
  private healthCheckService?: HealthCheckService;

  constructor(healthCheckService?: HealthCheckService) {
    this.healthCheckService = healthCheckService;
    
    // Start monitoring interval
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Register a service with circuit breaker protection
   */
  register<T>(
    serviceName: string,
    config?: Partial<CircuitBreakerConfig>,
    fallback?: FallbackFunction<T>,
    healthCheck?: () => Promise<boolean>
  ): void {
    const validatedConfig = CircuitBreakerConfigSchema.parse(config || {});
    
    this.configs.set(serviceName, validatedConfig);
    this.circuits.set(serviceName, {
      failureCount: 0,
      successCount: 0,
      lastStateChange: Date.now(),
      responseTimes: [],
      totalRequests: 0,
    });

    if (fallback) {
      this.fallbacks.set(serviceName, fallback);
    }

    if (healthCheck) {
      this.healthChecks.set(serviceName, healthCheck);
      
      // Also register with health check service if available
      if (this.healthCheckService) {
        const circuitHealthCheck = this.healthCheckService.createServiceHealthCheck(
          `circuit-breaker-${serviceName}`,
          healthCheck,
          { circuitBreaker: true, originalService: serviceName }
        );
        
        this.healthCheckService.registerEndpoint(
          `circuit-breaker-${serviceName}`,
          circuitHealthCheck,
          {
            interval: validatedConfig.monitoringPeriod,
            timeout: 5000,
            alertThreshold: validatedConfig.failureThreshold,
          }
        );
      }
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: FallbackFunction<T>
  ): Promise<CircuitBreakerResult<T>> {
    const startTime = Date.now();
    const config = this.configs.get(serviceName);
    const stats = this.circuits.get(serviceName);

    if (!config || !stats) {
      throw new Error(`Service ${serviceName} not registered with circuit breaker`);
    }

    const currentState = this.getState(serviceName);
    stats.totalRequests++;

    // If circuit is open, check if we should try again
    if (currentState === CircuitBreakerState.OPEN) {
      const timeSinceLastFailure = Date.now() - (stats.lastFailureTime || 0);
      
      if (timeSinceLastFailure < config.recoveryTimeout) {
        // Still in timeout period, use fallback if available
        return this.handleFallback(serviceName, new Error('Circuit breaker is OPEN'), fallback, startTime);
      } else {
        // Try to transition to half-open
        this.transitionToHalfOpen(serviceName);
      }
    }

    // If circuit is half-open, only allow limited requests
    if (currentState === CircuitBreakerState.HALF_OPEN) {
      // In half-open state, we allow one request to test the service
      const recentRequests = this.getRecentRequests(serviceName);
      if (recentRequests > 0) {
        return this.handleFallback(serviceName, new Error('Circuit breaker is HALF_OPEN - testing in progress'), fallback, startTime);
      }
    }

    try {
      const result = await operation();
      const executionTime = Date.now() - startTime;
      
      this.recordSuccess(serviceName, executionTime);
      
      return {
        success: true,
        data: result,
        state: this.getState(serviceName),
        fallbackUsed: false,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const appError = error instanceof Error ? error : new Error(String(error));
      
      this.recordFailure(serviceName, appError, executionTime);
      
      // Check if we should open the circuit
      if (this.shouldOpenCircuit(serviceName)) {
        this.openCircuit(serviceName);
      }

      return this.handleFallback(serviceName, appError, fallback, startTime);
    }
  }

  /**
   * Get current state of a circuit breaker
   */
  getState(serviceName: string): CircuitBreakerState {
    const config = this.configs.get(serviceName);
    const stats = this.circuits.get(serviceName);

    if (!config || !stats) {
      return CircuitBreakerState.CLOSED;
    }

    // Check if circuit should be open
    if (stats.failureCount >= config.failureThreshold) {
      const timeSinceLastFailure = Date.now() - (stats.lastFailureTime || 0);
      
      if (timeSinceLastFailure < config.recoveryTimeout) {
        return CircuitBreakerState.OPEN;
      } else {
        return CircuitBreakerState.HALF_OPEN;
      }
    }

    return CircuitBreakerState.CLOSED;
  }

  /**
   * Get service status and statistics
   */
  getServiceStatus(serviceName: string): ServiceStatus | null {
    const config = this.configs.get(serviceName);
    const stats = this.circuits.get(serviceName);

    if (!config || !stats) {
      return null;
    }

    const averageResponseTime = stats.responseTimes.length > 0
      ? stats.responseTimes.reduce((sum, time) => sum + time, 0) / stats.responseTimes.length
      : 0;

    return {
      name: serviceName,
      state: this.getState(serviceName),
      failureCount: stats.failureCount,
      lastFailureTime: stats.lastFailureTime ? new Date(stats.lastFailureTime) : undefined,
      lastSuccessTime: stats.lastSuccessTime ? new Date(stats.lastSuccessTime) : undefined,
      totalRequests: stats.totalRequests,
      successfulRequests: stats.successCount,
      failedRequests: stats.failureCount,
      averageResponseTime,
    };
  }

  /**
   * Get all service statuses
   */
  getAllServiceStatuses(): ServiceStatus[] {
    const statuses: ServiceStatus[] = [];
    
    for (const serviceName of this.configs.keys()) {
      const status = this.getServiceStatus(serviceName);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }

  /**
   * Manually reset a circuit breaker
   */
  reset(serviceName: string): void {
    const stats = this.circuits.get(serviceName);
    if (stats) {
      stats.failureCount = 0;
      stats.lastFailureTime = undefined;
      stats.lastStateChange = Date.now();
    }
  }

  /**
   * Perform health checks on all registered services
   */
  async performHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const [serviceName, healthCheck] of this.healthChecks) {
      const startTime = Date.now();
      
      try {
        const healthy = await healthCheck();
        const responseTime = Date.now() - startTime;
        
        results.push({
          serviceName,
          healthy,
          responseTime,
          timestamp: new Date(),
        });

        // If service is healthy and circuit is open, consider recovery
        if (healthy) {
          const currentState = this.getState(serviceName);
          if (currentState === CircuitBreakerState.OPEN) {
            this.transitionToHalfOpen(serviceName);
          }
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        results.push({
          serviceName,
          healthy: false,
          responseTime,
          error: errorMessage,
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * Update configuration for a service
   */
  updateConfig(serviceName: string, config: Partial<CircuitBreakerConfig>): void {
    const existingConfig = this.configs.get(serviceName);
    if (existingConfig) {
      const newConfig = { ...existingConfig, ...config };
      const validatedConfig = CircuitBreakerConfigSchema.parse(newConfig);
      this.configs.set(serviceName, validatedConfig);
    }
  }

  /**
   * Record a successful operation
   */
  private recordSuccess(serviceName: string, executionTime: number): void {
    const stats = this.circuits.get(serviceName);
    if (stats) {
      stats.successCount++;
      stats.lastSuccessTime = Date.now();
      
      // Only add positive execution times
      if (executionTime > 0) {
        stats.responseTimes.push(executionTime);
      }
      
      // Keep only recent response times (last 100)
      if (stats.responseTimes.length > 100) {
        stats.responseTimes = stats.responseTimes.slice(-100);
      }

      // Reset failure count on success in half-open state
      if (this.getState(serviceName) === CircuitBreakerState.HALF_OPEN) {
        stats.failureCount = 0;
        stats.lastStateChange = Date.now();
      }
    }
  }

  /**
   * Record a failed operation
   */
  private recordFailure(serviceName: string, error: Error, executionTime: number): void {
    const config = this.configs.get(serviceName);
    const stats = this.circuits.get(serviceName);
    
    if (!config || !stats) return;

    // Check if this is an expected error that shouldn't count as failure
    const isExpectedError = config.expectedErrors.some(expectedError => 
      error.message.includes(expectedError) || error.name.includes(expectedError)
    );

    if (!isExpectedError) {
      stats.failureCount++;
      stats.lastFailureTime = Date.now();
      
      // Only add positive execution times
      if (executionTime > 0) {
        stats.responseTimes.push(executionTime);
      }
      
      // Keep only recent response times
      if (stats.responseTimes.length > 100) {
        stats.responseTimes = stats.responseTimes.slice(-100);
      }
    }
  }

  /**
   * Check if circuit should be opened
   */
  private shouldOpenCircuit(serviceName: string): boolean {
    const config = this.configs.get(serviceName);
    const stats = this.circuits.get(serviceName);
    
    if (!config || !stats) return false;

    return stats.failureCount >= config.failureThreshold;
  }

  /**
   * Open the circuit breaker
   */
  private openCircuit(serviceName: string): void {
    const stats = this.circuits.get(serviceName);
    if (stats) {
      stats.lastStateChange = Date.now();
    }
  }

  /**
   * Transition circuit to half-open state
   */
  private transitionToHalfOpen(serviceName: string): void {
    const stats = this.circuits.get(serviceName);
    if (stats) {
      stats.lastStateChange = Date.now();
    }
  }

  /**
   * Get number of recent requests in monitoring period
   */
  private getRecentRequests(serviceName: string): number {
    const config = this.configs.get(serviceName);
    const stats = this.circuits.get(serviceName);
    
    if (!config || !stats) return 0;

    const cutoffTime = Date.now() - config.monitoringPeriod;
    return stats.responseTimes.filter(time => time > cutoffTime).length;
  }

  /**
   * Handle fallback execution
   */
  private async handleFallback<T>(
    serviceName: string,
    error: Error,
    fallback?: FallbackFunction<T>,
    startTime?: number
  ): Promise<CircuitBreakerResult<T>> {
    const executionTime = startTime ? Date.now() - startTime : 0;
    const config = this.configs.get(serviceName);
    
    // Try provided fallback first, then registered fallback
    let fallbackFn: FallbackFunction<T> | undefined;
    
    if (fallback) {
      fallbackFn = fallback;
    } else {
      fallbackFn = this.fallbacks.get(serviceName);
    }
    
    if (fallbackFn && config?.fallbackEnabled) {
      try {
        const fallbackResult = await fallbackFn(error);
        return {
          success: true,
          data: fallbackResult,
          state: this.getState(serviceName),
          fallbackUsed: true,
          executionTime,
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
          state: this.getState(serviceName),
          fallbackUsed: true,
          executionTime,
        };
      }
    }

    return {
      success: false,
      error,
      state: this.getState(serviceName),
      fallbackUsed: false,
      executionTime,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.circuits.clear();
    this.configs.clear();
    this.fallbacks.clear();
    this.healthChecks.clear();
  }
}

/**
 * Circuit breaker error class
 */
export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly serviceName: string,
    public readonly state: CircuitBreakerState
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

// Singleton instance for global use
let circuitBreakerServiceInstance: CircuitBreakerService | null = null;

/**
 * Get the singleton circuit breaker service instance
 */
export function getCircuitBreakerService(): CircuitBreakerService {
  if (!circuitBreakerServiceInstance) {
    circuitBreakerServiceInstance = new CircuitBreakerService();
  }
  return circuitBreakerServiceInstance;
}

/**
 * Initialize circuit breaker service
 */
export function initializeCircuitBreakerService(): CircuitBreakerService {
  if (circuitBreakerServiceInstance) {
    circuitBreakerServiceInstance.destroy();
  }
  circuitBreakerServiceInstance = new CircuitBreakerService();
  return circuitBreakerServiceInstance;
}

// Pre-configured circuit breakers for common services
export const ServiceNames = {
  SUPABASE_DATABASE: 'supabase_database',
  SUPABASE_AUTH: 'supabase_auth',
  SUPABASE_STORAGE: 'supabase_storage',
  AWS_LAMBDA: 'aws_lambda',
  AWS_S3: 'aws_s3',
  EXTERNAL_API: 'external_api',
} as const;

/**
 * Setup default circuit breakers for common services
 */
export function setupDefaultCircuitBreakers(circuitBreaker: CircuitBreakerService): void {
  // Supabase Database - Conservative settings for free tier
  circuitBreaker.register(
    ServiceNames.SUPABASE_DATABASE,
    {
      failureThreshold: 3,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 10000,
      expectedErrors: ['PGRST116'], // PostgREST connection errors
      fallbackEnabled: true,
    },
    async (error: Error) => {
      // Fallback to cached data or offline mode
      console.warn('Database circuit breaker activated, using fallback:', error.message);
      return null; // Return cached data or trigger offline mode
    },
    async () => {
      // Simple health check - could be a lightweight query
      return true; // Implement actual health check
    }
  );

  // Supabase Auth
  circuitBreaker.register(
    ServiceNames.SUPABASE_AUTH,
    {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 15000,
      expectedErrors: ['AuthError', 'NetworkError'],
      fallbackEnabled: true,
    },
    async (error: Error) => {
      console.warn('Auth circuit breaker activated:', error.message);
      // Fallback to guest mode or cached auth state
      return { user: null, session: null };
    }
  );

  // AWS Lambda
  circuitBreaker.register(
    ServiceNames.AWS_LAMBDA,
    {
      failureThreshold: 3,
      recoveryTimeout: 45000, // 45 seconds
      monitoringPeriod: 10000,
      expectedErrors: ['TimeoutError', 'ThrottlingException'],
      fallbackEnabled: true,
    },
    async (error: Error) => {
      console.warn('Lambda circuit breaker activated:', error.message);
      // Fallback to local processing or skip non-critical operations
      return { processed: false, reason: 'service_unavailable' };
    }
  );

  // External APIs
  circuitBreaker.register(
    ServiceNames.EXTERNAL_API,
    {
      failureThreshold: 5,
      recoveryTimeout: 120000, // 2 minutes
      monitoringPeriod: 20000,
      expectedErrors: ['NetworkError', 'TimeoutError'],
      fallbackEnabled: true,
    },
    async (error: Error) => {
      console.warn('External API circuit breaker activated:', error.message);
      // Fallback to cached data or disable feature
      return { data: null, cached: true };
    }
  );
}