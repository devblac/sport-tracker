import { CircuitBreakerService, ServiceNames, setupDefaultCircuitBreakers } from './CircuitBreakerService';
import { HealthCheckService, HealthStatus, defaultAlertHandlers } from './HealthCheckService';

/**
 * Service monitoring integration that combines circuit breaker and health check services
 * Provides comprehensive service monitoring, fallback mechanisms, and alerting
 */
export class ServiceMonitoringIntegration {
  private circuitBreaker: CircuitBreakerService;
  private healthCheck: HealthCheckService;
  private isInitialized = false;

  constructor() {
    this.healthCheck = new HealthCheckService({
      interval: 30000, // 30 seconds
      timeout: 5000,   // 5 seconds
      alertThreshold: 3, // 3 consecutive failures
    });

    this.circuitBreaker = new CircuitBreakerService(this.healthCheck);
  }

  /**
   * Initialize the monitoring integration with default services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Setup default circuit breakers
    setupDefaultCircuitBreakers(this.circuitBreaker);

    // Setup health check endpoints for common services
    await this.setupHealthCheckEndpoints();

    // Register default alert handlers
    this.setupAlertHandlers();

    // Start monitoring
    this.healthCheck.start();

    this.isInitialized = true;
  }

  /**
   * Get the circuit breaker service
   */
  getCircuitBreaker(): CircuitBreakerService {
    return this.circuitBreaker;
  }

  /**
   * Get the health check service
   */
  getHealthCheck(): HealthCheckService {
    return this.healthCheck;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async executeWithProtection<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: (error: Error) => Promise<T> | T
  ): Promise<T> {
    const result = await this.circuitBreaker.execute(serviceName, operation, fallback);
    
    if (!result.success) {
      throw result.error || new Error(`Operation failed for service: ${serviceName}`);
    }
    
    return result.data as T;
  }

  /**
   * Check if a service is healthy
   */
  isServiceHealthy(serviceName: string): boolean {
    // Check both circuit breaker state and health check status
    const circuitState = this.circuitBreaker.getState(serviceName);
    const healthStatus = this.healthCheck.getServiceHealth(serviceName);
    
    return circuitState === 'closed' && 
           (healthStatus?.status === HealthStatus.HEALTHY || healthStatus === null);
  }

  /**
   * Get comprehensive service status
   */
  getServiceStatus(serviceName: string): {
    circuitBreaker: any;
    healthCheck: any;
    overall: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const circuitStatus = this.circuitBreaker.getServiceStatus(serviceName);
    const healthStatus = this.healthCheck.getServiceHealth(serviceName);
    
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (circuitStatus?.state === 'open' || healthStatus?.status === HealthStatus.UNHEALTHY) {
      overall = 'unhealthy';
    } else if (circuitStatus?.state === 'half_open' || healthStatus?.status === HealthStatus.DEGRADED) {
      overall = 'degraded';
    }
    
    return {
      circuitBreaker: circuitStatus,
      healthCheck: healthStatus,
      overall,
    };
  }

  /**
   * Get system-wide status
   */
  getSystemStatus(): {
    circuitBreakers: any[];
    healthChecks: any;
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, any>;
  } {
    const circuitStatuses = this.circuitBreaker.getAllServiceStatuses();
    const systemHealth = this.healthCheck.getSystemHealth();
    
    // Determine overall system status
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    const hasOpenCircuits = circuitStatuses.some(s => s.state === 'open');
    const hasUnhealthyServices = systemHealth.status === HealthStatus.UNHEALTHY;
    const hasDegradedServices = systemHealth.status === HealthStatus.DEGRADED || 
                               circuitStatuses.some(s => s.state === 'half_open');
    
    if (hasOpenCircuits || hasUnhealthyServices) {
      overall = 'unhealthy';
    } else if (hasDegradedServices) {
      overall = 'degraded';
    }
    
    // Get detailed service status
    const services: Record<string, any> = {};
    const allServiceNames = new Set([
      ...circuitStatuses.map(s => s.name),
      ...systemHealth.services.map(s => s.serviceName),
    ]);
    
    for (const serviceName of allServiceNames) {
      services[serviceName] = this.getServiceStatus(serviceName);
    }
    
    return {
      circuitBreakers: circuitStatuses,
      healthChecks: systemHealth,
      overall,
      services,
    };
  }

  /**
   * Setup health check endpoints for common services
   */
  private async setupHealthCheckEndpoints(): Promise<void> {
    // Supabase Database Health Check
    this.healthCheck.registerEndpoint(
      ServiceNames.SUPABASE_DATABASE,
      this.healthCheck.createDatabaseHealthCheck(
        ServiceNames.SUPABASE_DATABASE,
        async () => {
          // Simple query to test database connectivity
          // This would be replaced with actual Supabase client query
          return Promise.resolve(true);
        }
      ),
      {
        interval: 30000,
        timeout: 5000,
        alertThreshold: 2,
      }
    );

    // Supabase Auth Health Check
    this.healthCheck.registerEndpoint(
      ServiceNames.SUPABASE_AUTH,
      this.healthCheck.createServiceHealthCheck(
        ServiceNames.SUPABASE_AUTH,
        async () => {
          // Test auth service availability
          // This would be replaced with actual auth service check
          return Promise.resolve(true);
        },
        { type: 'auth' }
      ),
      {
        interval: 60000, // Less frequent for auth
        timeout: 3000,
        alertThreshold: 3,
      }
    );

    // AWS Lambda Health Check (if configured)
    if (this.isAWSConfigured()) {
      this.healthCheck.registerEndpoint(
        ServiceNames.AWS_LAMBDA,
        this.healthCheck.createServiceHealthCheck(
          ServiceNames.AWS_LAMBDA,
          async () => {
            // Test Lambda service availability
            // This would ping a health check Lambda function
            return Promise.resolve(true);
          },
          { type: 'lambda' }
        ),
        {
          interval: 120000, // 2 minutes for external service
          timeout: 10000,   // Longer timeout for Lambda cold starts
          alertThreshold: 2,
        }
      );
    }

    // External API Health Check
    this.healthCheck.registerEndpoint(
      ServiceNames.EXTERNAL_API,
      this.healthCheck.createHttpHealthCheck(
        ServiceNames.EXTERNAL_API,
        'https://httpbin.org/status/200', // Example health check endpoint
        200,
        5000
      ),
      {
        interval: 300000, // 5 minutes for external APIs
        timeout: 10000,
        alertThreshold: 3,
      }
    );
  }

  /**
   * Setup alert handlers for monitoring
   */
  private setupAlertHandlers(): void {
    // Console logging for development
    this.healthCheck.registerAlertHandler(defaultAlertHandlers.consoleLogger);
    
    // Local storage for debugging
    this.healthCheck.registerAlertHandler(defaultAlertHandlers.localStorage);
    
    // Custom alert handler for circuit breaker integration
    this.healthCheck.registerAlertHandler(async (alert) => {
      // If a service becomes unhealthy, we might want to manually open its circuit breaker
      if (alert.status === HealthStatus.UNHEALTHY && alert.consecutiveFailures >= 3) {
        const circuitStatus = this.circuitBreaker.getServiceStatus(alert.serviceName);
        if (circuitStatus && circuitStatus.state === 'closed') {
          console.warn(`Health check indicates ${alert.serviceName} is unhealthy, circuit breaker may open soon`);
        }
      }
      
      // If a service recovers, log the recovery
      if (alert.status === HealthStatus.HEALTHY) {
        console.info(`Service ${alert.serviceName} has recovered and is healthy again`);
      }
    });
  }

  /**
   * Check if AWS services are configured
   */
  private isAWSConfigured(): boolean {
    // Check environment variables or configuration for AWS setup
    return !!(
      process.env.VITE_AWS_REGION ||
      process.env.VITE_AWS_ACCESS_KEY_ID ||
      (globalThis as any).AWS_CONFIG_ENABLED
    );
  }

  /**
   * Create a monitored service wrapper
   */
  createMonitoredService<T extends Record<string, any>>(
    serviceName: string,
    service: T,
    fallbackService?: Partial<T>
  ): T {
    const monitoredService = {} as T;
    
    // Wrap each method of the service with circuit breaker protection
    for (const [methodName, method] of Object.entries(service)) {
      if (typeof method === 'function') {
        monitoredService[methodName as keyof T] = (async (...args: any[]) => {
          const fallbackMethod = fallbackService?.[methodName as keyof T];
          
          return this.executeWithProtection(
            serviceName,
            () => method.apply(service, args),
            fallbackMethod ? () => (fallbackMethod as Function).apply(fallbackService, args) : undefined
          );
        }) as T[keyof T];
      } else {
        // Copy non-function properties as-is
        monitoredService[methodName as keyof T] = method;
      }
    }
    
    return monitoredService;
  }

  /**
   * Register a custom service for monitoring
   */
  registerService(
    serviceName: string,
    healthCheck: () => Promise<boolean>,
    circuitBreakerConfig?: any,
    fallback?: (error: Error) => any
  ): void {
    // Register with circuit breaker
    this.circuitBreaker.register(serviceName, circuitBreakerConfig, fallback, healthCheck);
    
    // Register with health check service
    const healthCheckFn = this.healthCheck.createServiceHealthCheck(
      serviceName,
      healthCheck,
      { custom: true }
    );
    
    this.healthCheck.registerEndpoint(serviceName, healthCheckFn);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.healthCheck.stop();
    this.circuitBreaker.destroy();
    this.isInitialized = false;
  }

  /**
   * Get monitoring metrics for dashboard
   */
  getMonitoringMetrics(): {
    timestamp: Date;
    systemStatus: string;
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    openCircuits: number;
    halfOpenCircuits: number;
    averageResponseTime: number;
    totalRequests: number;
    successRate: number;
  } {
    const systemStatus = this.getSystemStatus();
    const circuitStatuses = systemStatus.circuitBreakers;
    
    const totalRequests = circuitStatuses.reduce((sum, s) => sum + s.totalRequests, 0);
    const successfulRequests = circuitStatuses.reduce((sum, s) => sum + s.successfulRequests, 0);
    const averageResponseTime = circuitStatuses.length > 0 
      ? circuitStatuses.reduce((sum, s) => sum + s.averageResponseTime, 0) / circuitStatuses.length
      : 0;
    
    return {
      timestamp: new Date(),
      systemStatus: systemStatus.overall,
      totalServices: Object.keys(systemStatus.services).length,
      healthyServices: Object.values(systemStatus.services).filter(s => s.overall === 'healthy').length,
      degradedServices: Object.values(systemStatus.services).filter(s => s.overall === 'degraded').length,
      unhealthyServices: Object.values(systemStatus.services).filter(s => s.overall === 'unhealthy').length,
      openCircuits: circuitStatuses.filter(s => s.state === 'open').length,
      halfOpenCircuits: circuitStatuses.filter(s => s.state === 'half_open').length,
      averageResponseTime,
      totalRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
    };
  }
}

// Singleton instance for global use
let serviceMonitoringInstance: ServiceMonitoringIntegration | null = null;

/**
 * Get the singleton service monitoring integration instance
 */
export function getServiceMonitoring(): ServiceMonitoringIntegration {
  if (!serviceMonitoringInstance) {
    serviceMonitoringInstance = new ServiceMonitoringIntegration();
  }
  return serviceMonitoringInstance;
}

/**
 * Initialize service monitoring integration
 */
export async function initializeServiceMonitoring(): Promise<ServiceMonitoringIntegration> {
  if (serviceMonitoringInstance) {
    await serviceMonitoringInstance.shutdown();
  }
  
  serviceMonitoringInstance = new ServiceMonitoringIntegration();
  await serviceMonitoringInstance.initialize();
  
  return serviceMonitoringInstance;
}

/**
 * Graceful degradation strategies for different service types
 */
export const degradationStrategies = {
  /**
   * Database service degradation
   */
  database: {
    level1: () => ({
      message: 'Using cached data, some features may be limited',
      disabledFeatures: ['real-time-sync', 'social-features'],
      fallbackBehavior: 'cache-only',
    }),
    level2: () => ({
      message: 'Offline mode active, data will sync when connection is restored',
      disabledFeatures: ['real-time-sync', 'social-features', 'leaderboards', 'profile-sync'],
      fallbackBehavior: 'offline-mode',
    }),
    level3: () => ({
      message: 'Limited functionality available, please try again later',
      disabledFeatures: ['all-online-features', 'data-sync', 'cloud-backup', 'social-interactions', 'real-time-updates'],
      fallbackBehavior: 'read-only',
    }),
  },

  /**
   * Authentication service degradation
   */
  auth: {
    level1: () => ({
      message: 'Authentication temporarily unavailable, using guest mode',
      disabledFeatures: ['profile-sync', 'social-features'],
      fallbackBehavior: 'guest-mode',
    }),
    level2: () => ({
      message: 'Please log in again when service is restored',
      disabledFeatures: ['all-user-features'],
      fallbackBehavior: 'offline-only',
    }),
  },

  /**
   * External API degradation
   */
  external: {
    level1: () => ({
      message: 'Some features may be slower than usual',
      disabledFeatures: ['advanced-analytics'],
      fallbackBehavior: 'reduced-functionality',
    }),
    level2: () => ({
      message: 'External services unavailable, core features still work',
      disabledFeatures: ['external-integrations', 'advanced-features'],
      fallbackBehavior: 'core-only',
    }),
  },
};