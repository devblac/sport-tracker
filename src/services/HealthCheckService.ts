import { z } from 'zod';

// Health check configuration schema
const HealthCheckConfigSchema = z.object({
  interval: z.number().positive().default(30000), // 30 seconds
  timeout: z.number().positive().default(5000), // 5 seconds
  retryAttempts: z.number().min(0).default(3),
  alertThreshold: z.number().min(1).default(3), // Consecutive failures before alert
});

export type HealthCheckConfig = z.infer<typeof HealthCheckConfigSchema>;

// Health check status
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

// Health check result
export interface HealthCheckResult {
  serviceName: string;
  status: HealthStatus;
  responseTime: number;
  timestamp: Date;
  error?: string;
  metadata?: Record<string, any>;
}

// Service health endpoint
export interface HealthEndpoint {
  name: string;
  url?: string;
  check: () => Promise<HealthCheckResult>;
  config: HealthCheckConfig;
  lastResult?: HealthCheckResult;
  consecutiveFailures: number;
  isAlerting: boolean;
}

// Health check alert
export interface HealthAlert {
  serviceName: string;
  status: HealthStatus;
  message: string;
  timestamp: Date;
  consecutiveFailures: number;
  lastError?: string;
}

// Alert handler function type
export type AlertHandler = (alert: HealthAlert) => Promise<void> | void;

/**
 * Health check service for monitoring service endpoints and status
 * Provides health check endpoints and service status monitoring
 */
export class HealthCheckService {
  private endpoints = new Map<string, HealthEndpoint>();
  private alertHandlers: AlertHandler[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private globalConfig: Partial<HealthCheckConfig> = {}) {}

  /**
   * Register a health check endpoint
   */
  registerEndpoint(
    serviceName: string,
    checkFunction: () => Promise<HealthCheckResult>,
    config?: Partial<HealthCheckConfig>,
    url?: string
  ): void {
    const mergedConfig = HealthCheckConfigSchema.parse({
      ...this.globalConfig,
      ...config,
    });

    this.endpoints.set(serviceName, {
      name: serviceName,
      url,
      check: checkFunction,
      config: mergedConfig,
      consecutiveFailures: 0,
      isAlerting: false,
    });
  }

  /**
   * Register an alert handler
   */
  registerAlertHandler(handler: AlertHandler): void {
    this.alertHandlers.push(handler);
  }

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Perform initial health checks
    this.performHealthChecks();

    // Set up monitoring interval
    const minInterval = Math.min(
      ...Array.from(this.endpoints.values()).map(e => e.config.interval)
    );

    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, minInterval || 30000);
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Perform health checks on all registered endpoints
   */
  async performHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    const promises: Promise<void>[] = [];

    for (const endpoint of this.endpoints.values()) {
      const promise = this.checkEndpoint(endpoint).then(result => {
        results.push(result);
      });
      promises.push(promise);
    }

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * Get health status for a specific service
   */
  getServiceHealth(serviceName: string): HealthCheckResult | null {
    const endpoint = this.endpoints.get(serviceName);
    return endpoint?.lastResult || null;
  }

  /**
   * Get health status for all services
   */
  getAllServiceHealth(): HealthCheckResult[] {
    return Array.from(this.endpoints.values())
      .map(endpoint => endpoint.lastResult)
      .filter((result): result is HealthCheckResult => result !== undefined);
  }

  /**
   * Get overall system health status
   */
  getSystemHealth(): {
    status: HealthStatus;
    services: HealthCheckResult[];
    summary: {
      total: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
      unknown: number;
    };
  } {
    const services = this.getAllServiceHealth();
    
    const summary = {
      total: services.length,
      healthy: services.filter(s => s.status === HealthStatus.HEALTHY).length,
      degraded: services.filter(s => s.status === HealthStatus.DEGRADED).length,
      unhealthy: services.filter(s => s.status === HealthStatus.UNHEALTHY).length,
      unknown: services.filter(s => s.status === HealthStatus.UNKNOWN).length,
    };

    let overallStatus: HealthStatus;
    
    if (summary.unhealthy > 0) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (summary.degraded > 0) {
      overallStatus = HealthStatus.DEGRADED;
    } else if (summary.healthy > 0) {
      overallStatus = HealthStatus.HEALTHY;
    } else {
      overallStatus = HealthStatus.UNKNOWN;
    }

    return {
      status: overallStatus,
      services,
      summary,
    };
  }

  /**
   * Create a health check endpoint for HTTP services
   */
  createHttpHealthCheck(
    serviceName: string,
    url: string,
    expectedStatus = 200,
    timeout = 5000
  ): () => Promise<HealthCheckResult> {
    return async (): Promise<HealthCheckResult> => {
      const startTime = Date.now();
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'HealthCheckService/1.0',
          },
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        const status = response.status === expectedStatus 
          ? HealthStatus.HEALTHY 
          : HealthStatus.DEGRADED;

        return {
          serviceName,
          status,
          responseTime,
          timestamp: new Date(),
          metadata: {
            httpStatus: response.status,
            expectedStatus,
            url,
          },
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        return {
          serviceName,
          status: HealthStatus.UNHEALTHY,
          responseTime,
          timestamp: new Date(),
          error: errorMessage,
          metadata: {
            url,
            timeout,
          },
        };
      }
    };
  }

  /**
   * Create a health check for database connectivity
   */
  createDatabaseHealthCheck(
    serviceName: string,
    testQuery: () => Promise<any>
  ): () => Promise<HealthCheckResult> {
    return async (): Promise<HealthCheckResult> => {
      const startTime = Date.now();
      
      try {
        await testQuery();
        const responseTime = Date.now() - startTime;

        return {
          serviceName,
          status: HealthStatus.HEALTHY,
          responseTime,
          timestamp: new Date(),
          metadata: {
            type: 'database',
          },
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        return {
          serviceName,
          status: HealthStatus.UNHEALTHY,
          responseTime,
          timestamp: new Date(),
          error: errorMessage,
          metadata: {
            type: 'database',
          },
        };
      }
    };
  }

  /**
   * Create a health check for service availability
   */
  createServiceHealthCheck(
    serviceName: string,
    serviceCheck: () => Promise<boolean>,
    metadata?: Record<string, any>
  ): () => Promise<HealthCheckResult> {
    return async (): Promise<HealthCheckResult> => {
      const startTime = Date.now();
      
      try {
        const isHealthy = await serviceCheck();
        const responseTime = Date.now() - startTime;

        return {
          serviceName,
          status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
          responseTime,
          timestamp: new Date(),
          metadata,
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        return {
          serviceName,
          status: HealthStatus.UNHEALTHY,
          responseTime,
          timestamp: new Date(),
          error: errorMessage,
          metadata,
        };
      }
    };
  }

  /**
   * Update endpoint configuration
   */
  updateEndpointConfig(serviceName: string, config: Partial<HealthCheckConfig>): void {
    const endpoint = this.endpoints.get(serviceName);
    if (endpoint) {
      endpoint.config = HealthCheckConfigSchema.parse({
        ...endpoint.config,
        ...config,
      });
    }
  }

  /**
   * Remove a health check endpoint
   */
  removeEndpoint(serviceName: string): void {
    this.endpoints.delete(serviceName);
  }

  /**
   * Check if service is healthy
   */
  isServiceHealthy(serviceName: string): boolean {
    const health = this.getServiceHealth(serviceName);
    return health?.status === HealthStatus.HEALTHY;
  }

  /**
   * Check if system is healthy
   */
  isSystemHealthy(): boolean {
    const systemHealth = this.getSystemHealth();
    return systemHealth.status === HealthStatus.HEALTHY;
  }

  /**
   * Perform health check on a specific endpoint
   */
  private async checkEndpoint(endpoint: HealthEndpoint): Promise<HealthCheckResult> {
    try {
      const result = await this.executeWithTimeout(
        endpoint.check(),
        endpoint.config.timeout
      );

      endpoint.lastResult = result;

      // Handle success - reset failure count
      if (result.status === HealthStatus.HEALTHY) {
        if (endpoint.consecutiveFailures > 0) {
          endpoint.consecutiveFailures = 0;
          
          // Send recovery alert if was alerting
          if (endpoint.isAlerting) {
            endpoint.isAlerting = false;
            await this.sendAlert({
              serviceName: endpoint.name,
              status: HealthStatus.HEALTHY,
              message: `Service ${endpoint.name} has recovered`,
              timestamp: new Date(),
              consecutiveFailures: 0,
            });
          }
        }
      } else {
        // Handle failure
        endpoint.consecutiveFailures++;
        
        // Send alert if threshold reached
        if (endpoint.consecutiveFailures >= endpoint.config.alertThreshold && !endpoint.isAlerting) {
          endpoint.isAlerting = true;
          await this.sendAlert({
            serviceName: endpoint.name,
            status: result.status,
            message: `Service ${endpoint.name} is ${result.status.toLowerCase()}`,
            timestamp: new Date(),
            consecutiveFailures: endpoint.consecutiveFailures,
            lastError: result.error,
          });
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const result: HealthCheckResult = {
        serviceName: endpoint.name,
        status: HealthStatus.UNHEALTHY,
        responseTime: endpoint.config.timeout,
        timestamp: new Date(),
        error: errorMessage,
      };

      endpoint.lastResult = result;
      endpoint.consecutiveFailures++;

      // Send alert if threshold reached
      if (endpoint.consecutiveFailures >= endpoint.config.alertThreshold && !endpoint.isAlerting) {
        endpoint.isAlerting = true;
        await this.sendAlert({
          serviceName: endpoint.name,
          status: HealthStatus.UNHEALTHY,
          message: `Service ${endpoint.name} health check failed`,
          timestamp: new Date(),
          consecutiveFailures: endpoint.consecutiveFailures,
          lastError: errorMessage,
        });
      }

      return result;
    }
  }

  /**
   * Execute a promise with timeout
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Send alert to all registered handlers
   */
  private async sendAlert(alert: HealthAlert): Promise<void> {
    const promises = this.alertHandlers.map(async handler => {
      try {
        await handler(alert);
      } catch (error) {
        console.error('Alert handler failed:', error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.endpoints.clear();
    this.alertHandlers.length = 0;
  }
}

/**
 * Default alert handlers
 */
export const defaultAlertHandlers = {
  /**
   * Console logger alert handler
   */
  consoleLogger: (alert: HealthAlert): void => {
    const level = alert.status === HealthStatus.HEALTHY ? 'info' : 'warn';
    console[level](`[HealthCheck] ${alert.serviceName}: ${alert.message}`, {
      status: alert.status,
      consecutiveFailures: alert.consecutiveFailures,
      timestamp: alert.timestamp,
      error: alert.lastError,
    });
  },

  /**
   * Local storage alert handler (for debugging)
   */
  localStorage: (alert: HealthAlert): void => {
    try {
      const alerts = JSON.parse(localStorage.getItem('health-alerts') || '[]');
      alerts.push({
        ...alert,
        timestamp: alert.timestamp.toISOString(),
      });
      
      // Keep only last 100 alerts
      if (alerts.length > 100) {
        alerts.splice(0, alerts.length - 100);
      }
      
      localStorage.setItem('health-alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to store health alert:', error);
    }
  },
};

// Singleton instance for global use
let healthCheckServiceInstance: HealthCheckService | null = null;

/**
 * Get the singleton health check service instance
 */
export function getHealthCheckService(): HealthCheckService {
  if (!healthCheckServiceInstance) {
    healthCheckServiceInstance = new HealthCheckService();
  }
  return healthCheckServiceInstance;
}

/**
 * Initialize health check service with configuration
 */
export function initializeHealthCheckService(config?: Partial<HealthCheckConfig>): HealthCheckService {
  if (healthCheckServiceInstance) {
    healthCheckServiceInstance.destroy();
  }
  healthCheckServiceInstance = new HealthCheckService(config);
  return healthCheckServiceInstance;
}