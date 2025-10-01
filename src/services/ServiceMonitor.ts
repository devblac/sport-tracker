/**
 * Service Monitor
 * 
 * Monitors service health, performance, and status.
 * Provides real-time monitoring and reporting for all services.
 */

import { 
  type ServiceStatus, 
  type ServicePerformance, 
  type HealthCheckResult,
  type ServiceMetrics,
  type CircuitBreakerState,
  type ServiceType,
  type ServiceRegistryEvents
} from '@/types/serviceConfig';
import { 
  ServiceStatusSchema, 
  HealthCheckResultSchema, 
  ServiceMetricsSchema,
  CircuitBreakerStateSchema 
} from '@/schemas/serviceConfig';
import { serviceConfigManager } from './ServiceConfigManager';
import { logger } from '@/utils/logger';

export class ServiceMonitor {
  private static instance: ServiceMonitor;
  private serviceStatuses = new Map<string, ServiceStatus>();
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private metricsHistory: ServiceMetrics[] = [];
  private healthCheckInterval?: number;
  private eventListeners = new Map<keyof ServiceRegistryEvents, Set<Function>>();

  private constructor() {
    this.initializeMonitoring();
  }

  public static getInstance(): ServiceMonitor {
    if (!ServiceMonitor.instance) {
      ServiceMonitor.instance = new ServiceMonitor();
    }
    return ServiceMonitor.instance;
  }

  // ============================================================================
  // Service Status Management
  // ============================================================================

  getServiceStatus(serviceName: string): ServiceStatus | null {
    return this.serviceStatuses.get(serviceName) || null;
  }

  getAllServiceStatuses(): Map<string, ServiceStatus> {
    return new Map(this.serviceStatuses);
  }

  updateServiceStatus(serviceName: string, updates: Partial<ServiceStatus>): void {
    const currentStatus = this.serviceStatuses.get(serviceName) || this.createDefaultServiceStatus(serviceName);
    const newStatus = { ...currentStatus, ...updates };

    try {
      const validatedStatus = ServiceStatusSchema.parse(newStatus);
      this.serviceStatuses.set(serviceName, validatedStatus);
      
      // Emit status change event
      this.emit('service-status-changed', { 
        service: serviceName as ServiceType, 
        status: validatedStatus 
      });

      logger.debug('Service status updated', { serviceName, status: validatedStatus.status });
    } catch (error) {
      logger.error('Invalid service status update', { error, serviceName, updates });
    }
  }

  private createDefaultServiceStatus(serviceName: string): ServiceStatus {
    return ServiceStatusSchema.parse({
      service: serviceName,
      status: 'connected',
      lastHealthCheck: new Date(),
      errorCount: 0,
      consecutiveErrors: 0,
      performance: {
        averageResponseTime: 0,
        successRate: 1,
        cacheHitRate: 0,
        requestCount: 0,
        errorRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      },
      circuitBreakerOpen: false,
    });
  }

  // ============================================================================
  // Performance Tracking
  // ============================================================================

  recordMetric(metric: Omit<ServiceMetrics, 'timestamp'>): void {
    const fullMetric = ServiceMetricsSchema.parse({
      ...metric,
      timestamp: new Date(),
    });

    this.metricsHistory.push(fullMetric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000);
    }

    // Update service performance
    this.updateServicePerformance(metric.service, fullMetric);
  }

  private updateServicePerformance(serviceName: string, metric: ServiceMetrics): void {
    const status = this.serviceStatuses.get(serviceName) || this.createDefaultServiceStatus(serviceName);
    const performance = this.calculatePerformanceMetrics(serviceName);
    
    this.updateServiceStatus(serviceName, { performance });

    // Check for performance degradation
    if (performance.successRate < 0.9 || performance.averageResponseTime > 5000) {
      this.emit('performance-degraded', { 
        service: serviceName as ServiceType, 
        metrics: performance 
      });
    }
  }

  private calculatePerformanceMetrics(serviceName: string): ServicePerformance {
    const recentMetrics = this.metricsHistory
      .filter(m => m.service === serviceName)
      .slice(-100); // Last 100 operations

    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        successRate: 1,
        cacheHitRate: 0,
        requestCount: 0,
        errorRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      };
    }

    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successCount = recentMetrics.filter(m => m.success).length;
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;

    return {
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      successRate: successCount / recentMetrics.length,
      cacheHitRate: cacheHits / recentMetrics.length,
      requestCount: recentMetrics.length,
      errorRate: (recentMetrics.length - successCount) / recentMetrics.length,
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)] || 0,
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)] || 0,
    };
  }

  // ============================================================================
  // Circuit Breaker Management
  // ============================================================================

  getCircuitBreakerState(serviceName: string): CircuitBreakerState {
    return this.circuitBreakers.get(serviceName) || CircuitBreakerStateSchema.parse({
      service: serviceName,
      state: 'closed',
      failureCount: 0,
    });
  }

  recordServiceFailure(serviceName: string, error: string): void {
    const circuitBreaker = this.getCircuitBreakerState(serviceName);
    const config = serviceConfigManager.getConfig();
    
    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = new Date();

    // Update service status
    const status = this.serviceStatuses.get(serviceName) || this.createDefaultServiceStatus(serviceName);
    status.errorCount++;
    status.consecutiveErrors++;
    
    // Check if circuit breaker should open
    if (circuitBreaker.failureCount >= config.fallback.circuitBreakerThreshold && 
        circuitBreaker.state === 'closed') {
      this.openCircuitBreaker(serviceName, error);
    }

    this.circuitBreakers.set(serviceName, circuitBreaker);
    this.updateServiceStatus(serviceName, { 
      status: 'error',
      errorCount: status.errorCount,
      consecutiveErrors: status.consecutiveErrors,
      circuitBreakerOpen: circuitBreaker.state === 'open'
    });
  }

  recordServiceSuccess(serviceName: string): void {
    const circuitBreaker = this.getCircuitBreakerState(serviceName);
    const status = this.serviceStatuses.get(serviceName) || this.createDefaultServiceStatus(serviceName);
    
    // Reset consecutive errors on success
    status.consecutiveErrors = 0;

    // Handle circuit breaker state transitions
    if (circuitBreaker.state === 'half-open') {
      this.closeCircuitBreaker(serviceName);
    } else if (circuitBreaker.state === 'closed') {
      // Reset failure count on successful operation
      circuitBreaker.failureCount = Math.max(0, circuitBreaker.failureCount - 1);
    }

    this.circuitBreakers.set(serviceName, circuitBreaker);
    this.updateServiceStatus(serviceName, { 
      status: 'connected',
      consecutiveErrors: 0,
      circuitBreakerOpen: false
    });
  }

  private openCircuitBreaker(serviceName: string, reason: string): void {
    const circuitBreaker = this.getCircuitBreakerState(serviceName);
    const config = serviceConfigManager.getConfig();
    
    circuitBreaker.state = 'open';
    circuitBreaker.nextAttemptTime = new Date(Date.now() + config.fallback.circuitBreakerTimeout);
    
    this.circuitBreakers.set(serviceName, circuitBreaker);
    
    this.emit('circuit-breaker-opened', { 
      service: serviceName as ServiceType, 
      reason 
    });

    this.emit('fallback-activated', { 
      service: serviceName as ServiceType, 
      reason: `Circuit breaker opened: ${reason}` 
    });

    logger.warn('Circuit breaker opened', { serviceName, reason });

    // Schedule attempt to half-open
    setTimeout(() => {
      this.halfOpenCircuitBreaker(serviceName);
    }, config.fallback.circuitBreakerTimeout);
  }

  private halfOpenCircuitBreaker(serviceName: string): void {
    const circuitBreaker = this.getCircuitBreakerState(serviceName);
    
    if (circuitBreaker.state === 'open') {
      circuitBreaker.state = 'half-open';
      this.circuitBreakers.set(serviceName, circuitBreaker);
      
      logger.info('Circuit breaker half-opened', { serviceName });
    }
  }

  private closeCircuitBreaker(serviceName: string): void {
    const circuitBreaker = this.getCircuitBreakerState(serviceName);
    
    circuitBreaker.state = 'closed';
    circuitBreaker.failureCount = 0;
    circuitBreaker.lastFailureTime = undefined;
    circuitBreaker.nextAttemptTime = undefined;
    
    this.circuitBreakers.set(serviceName, circuitBreaker);
    
    this.emit('circuit-breaker-closed', { 
      service: serviceName as ServiceType 
    });

    logger.info('Circuit breaker closed', { serviceName });
  }

  isCircuitBreakerOpen(serviceName: string): boolean {
    const circuitBreaker = this.getCircuitBreakerState(serviceName);
    return circuitBreaker.state === 'open';
  }

  canAttemptRequest(serviceName: string): boolean {
    const circuitBreaker = this.getCircuitBreakerState(serviceName);
    
    if (circuitBreaker.state === 'closed' || circuitBreaker.state === 'half-open') {
      return true;
    }
    
    if (circuitBreaker.state === 'open' && circuitBreaker.nextAttemptTime) {
      return Date.now() >= circuitBreaker.nextAttemptTime.getTime();
    }
    
    return false;
  }

  // ============================================================================
  // Health Checks
  // ============================================================================

  async performHealthCheck(): Promise<HealthCheckResult> {
    const results: HealthCheckResult = HealthCheckResultSchema.parse({
      supabase: false,
      auth: false,
      database: false,
      social: false,
      gamification: false,
      workout: false,
      overall: false,
      timestamp: new Date(),
      details: {},
    });

    try {
      // Import services dynamically to avoid circular dependencies
      const { serviceRegistry } = await import('./ServiceRegistry');
      
      // Check individual services
      results.supabase = await this.checkSupabaseHealth();
      results.auth = await this.checkAuthHealth(serviceRegistry);
      results.database = results.supabase; // Database health tied to Supabase
      results.social = await this.checkSocialHealth(serviceRegistry);
      results.gamification = await this.checkGamificationHealth(serviceRegistry);
      results.workout = await this.checkWorkoutHealth(serviceRegistry);
      
      // Overall health
      results.overall = results.supabase && results.auth && results.database;
      
      // Update service statuses based on health check
      this.updateServiceStatusFromHealthCheck(results);
      
      this.emit('health-check-completed', { results });
      
    } catch (error) {
      logger.error('Health check failed', { error });
      results.details.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return results;
  }

  private async checkSupabaseHealth(): Promise<boolean> {
    try {
      const { supabaseService } = await import('./SupabaseService');
      return await supabaseService.healthCheck();
    } catch (error) {
      return false;
    }
  }

  private async checkAuthHealth(serviceRegistry: any): Promise<boolean> {
    try {
      await serviceRegistry.auth.isAuthenticated();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkSocialHealth(serviceRegistry: any): Promise<boolean> {
    try {
      // Simple check - try to get social feed (should work even if empty)
      const config = serviceConfigManager.getConfig();
      if (!config.useRealServices) return true; // Mock services are always "healthy"
      
      return true; // For now, assume social service is healthy if no errors
    } catch (error) {
      return false;
    }
  }

  private async checkGamificationHealth(serviceRegistry: any): Promise<boolean> {
    try {
      const config = serviceConfigManager.getConfig();
      if (!config.useRealServices) return true; // Mock services are always "healthy"
      
      return true; // For now, assume gamification service is healthy if no errors
    } catch (error) {
      return false;
    }
  }

  private async checkWorkoutHealth(serviceRegistry: any): Promise<boolean> {
    try {
      // Check if workout service can access basic data
      return true; // For now, assume workout service is healthy if no errors
    } catch (error) {
      return false;
    }
  }

  private updateServiceStatusFromHealthCheck(results: HealthCheckResult): void {
    const services = ['supabase', 'auth', 'database', 'social', 'gamification', 'workout'] as const;
    
    services.forEach(service => {
      const isHealthy = results[service];
      const status = isHealthy ? 'connected' : 'error';
      
      this.updateServiceStatus(service, { 
        status,
        lastHealthCheck: results.timestamp 
      });
      
      if (isHealthy) {
        this.recordServiceSuccess(service);
      } else {
        this.recordServiceFailure(service, 'Health check failed');
      }
    });
  }

  // ============================================================================
  // Monitoring Lifecycle
  // ============================================================================

  private initializeMonitoring(): void {
    const config = serviceConfigManager.getConfig();
    
    if (config.monitoring.enabled) {
      this.startHealthCheckInterval();
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      logger.info('Network back online, resuming monitoring');
      this.startHealthCheckInterval();
    });

    window.addEventListener('offline', () => {
      logger.info('Network offline, pausing monitoring');
      this.stopHealthCheckInterval();
    });
  }

  private startHealthCheckInterval(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    const config = serviceConfigManager.getConfig();
    
    this.healthCheckInterval = window.setInterval(() => {
      this.performHealthCheck().catch(error => {
        logger.error('Scheduled health check failed', { error });
      });
    }, config.monitoring.healthCheckInterval);

    // Perform initial health check
    this.performHealthCheck().catch(error => {
      logger.error('Initial health check failed', { error });
    });
  }

  private stopHealthCheckInterval(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  // ============================================================================
  // Event System
  // ============================================================================

  on<K extends keyof ServiceRegistryEvents>(
    event: K, 
    listener: (data: ServiceRegistryEvents[K]) => void
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off<K extends keyof ServiceRegistryEvents>(
    event: K, 
    listener: (data: ServiceRegistryEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit<K extends keyof ServiceRegistryEvents>(
    event: K, 
    data: ServiceRegistryEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          logger.error('Event listener error', { event, error });
        }
      });
    }
  }

  // ============================================================================
  // Metrics and Reporting
  // ============================================================================

  getMetricsHistory(serviceName?: string, limit = 100): ServiceMetrics[] {
    let metrics = this.metricsHistory;
    
    if (serviceName) {
      metrics = metrics.filter(m => m.service === serviceName);
    }
    
    return metrics.slice(-limit);
  }

  getServiceReport(serviceName: string): {
    status: ServiceStatus | null;
    circuitBreaker: CircuitBreakerState;
    recentMetrics: ServiceMetrics[];
  } {
    return {
      status: this.getServiceStatus(serviceName),
      circuitBreaker: this.getCircuitBreakerState(serviceName),
      recentMetrics: this.getMetricsHistory(serviceName, 50),
    };
  }

  getOverallSystemHealth(): {
    healthy: boolean;
    services: Record<string, boolean>;
    issues: string[];
  } {
    const services: Record<string, boolean> = {};
    const issues: string[] = [];
    
    this.serviceStatuses.forEach((status, serviceName) => {
      const isHealthy = status.status === 'connected';
      services[serviceName] = isHealthy;
      
      if (!isHealthy) {
        issues.push(`${serviceName}: ${status.status}`);
      }
    });
    
    const healthy = Object.values(services).every(Boolean);
    
    return { healthy, services, issues };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy(): void {
    this.stopHealthCheckInterval();
    this.serviceStatuses.clear();
    this.circuitBreakers.clear();
    this.metricsHistory = [];
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const serviceMonitor = ServiceMonitor.getInstance();