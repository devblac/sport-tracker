/**
 * Connection Pool Manager
 * 
 * Manages database connections with strict limits optimized for Supabase free tier.
 * Implements connection pooling, timeout handling, retry logic, and health monitoring.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ConnectionPoolConfig {
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  retryAttempts: number;
  backoffMultiplier: number;
  healthCheckInterval: number;
  maxQueueSize: number;
}

interface ConnectionInfo {
  id: string;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
  queryCount: number;
}

interface QueuedRequest {
  id: string;
  operation: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  createdAt: Date;
  timeout: NodeJS.Timeout;
}

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  queuedRequests: number;
  totalQueries: number;
  averageResponseTime: number;
  errorRate: number;
  lastHealthCheck: Date;
  isHealthy: boolean;
}

interface RetryConfig {
  attempt: number;
  maxAttempts: number;
  delay: number;
  error: Error;
}

// ============================================================================
// Connection Pool Manager
// ============================================================================

export class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private config: ConnectionPoolConfig;
  private connections: Map<string, ConnectionInfo> = new Map();
  private requestQueue: QueuedRequest[] = [];
  private metrics: ConnectionMetrics;
  private healthCheckTimer?: NodeJS.Timeout;
  private isShuttingDown = false;

  private constructor(config?: Partial<ConnectionPoolConfig>) {
    this.config = {
      maxConnections: 10, // Conservative for Supabase free tier (~20 max)
      idleTimeout: 30000, // 30 seconds
      connectionTimeout: 5000, // 5 seconds
      retryAttempts: 3,
      backoffMultiplier: 2,
      healthCheckInterval: 60000, // 1 minute
      maxQueueSize: 50,
      ...config
    };

    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      queuedRequests: 0,
      totalQueries: 0,
      averageResponseTime: 0,
      errorRate: 0,
      lastHealthCheck: new Date(),
      isHealthy: true
    };

    this.isShuttingDown = false; // Reset shutdown state
    this.connections.clear();
    this.requestQueue = [];

    this.startHealthChecking();
    this.startIdleConnectionCleanup();
  }

  public static getInstance(config?: Partial<ConnectionPoolConfig>): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager(config);
    }
    return ConnectionPoolManager.instance;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Execute a database operation with connection pooling
   */
  async executeQuery<T>(
    operation: () => Promise<T>,
    operationName = 'unknown',
    priority = 'normal'
  ): Promise<T> {
    if (this.isShuttingDown) {
      throw new Error('Connection pool is shutting down');
    }

    const startTime = Date.now();
    
    try {
      // Check if we can execute immediately
      if (this.canExecuteImmediately()) {
        return await this.executeWithConnection(operation, operationName, startTime);
      }

      // Queue the request if pool is full
      return await this.queueRequest(operation, operationName, priority, startTime);
    } catch (error) {
      this.updateErrorMetrics();
      logger.error('Query execution failed', { 
        error, 
        operationName,
        metrics: this.getMetrics()
      });
      throw error;
    }
  }

  /**
   * Execute with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName = 'unknown',
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig: RetryConfig = {
      attempt: 1,
      maxAttempts: this.config.retryAttempts,
      delay: 1000,
      error: new Error('Unknown error'),
      ...customRetryConfig
    };

    while (retryConfig.attempt <= retryConfig.maxAttempts) {
      try {
        return await this.executeQuery(operation, operationName);
      } catch (error) {
        retryConfig.error = error as Error;
        
        if (retryConfig.attempt === retryConfig.maxAttempts) {
          logger.error('Max retry attempts reached', {
            operationName,
            attempts: retryConfig.attempt,
            error: retryConfig.error
          });
          throw retryConfig.error;
        }

        // Check if error is retryable
        if (!this.isRetryableError(retryConfig.error)) {
          logger.warn('Non-retryable error encountered', {
            operationName,
            error: retryConfig.error
          });
          throw retryConfig.error;
        }

        // Calculate delay with exponential backoff
        const delay = retryConfig.delay * Math.pow(this.config.backoffMultiplier, retryConfig.attempt - 1);
        
        logger.warn('Retrying operation after delay', {
          operationName,
          attempt: retryConfig.attempt,
          delay,
          error: retryConfig.error.message
        });

        await this.sleep(delay);
        retryConfig.attempt++;
      }
    }

    throw retryConfig.error;
  }

  /**
   * Get current connection pool metrics
   */
  getMetrics(): ConnectionMetrics {
    return {
      ...this.metrics,
      activeConnections: this.getActiveConnectionCount(),
      queuedRequests: this.requestQueue.length
    };
  }

  /**
   * Get connection pool health status
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    metrics: ConnectionMetrics;
    issues: string[];
  }> {
    const issues: string[] = [];
    const metrics = this.getMetrics();

    // Check connection limits
    if (metrics.activeConnections >= this.config.maxConnections * 0.9) {
      issues.push('Connection pool near capacity');
    }

    // Check queue size
    if (metrics.queuedRequests >= this.config.maxQueueSize * 0.8) {
      issues.push('Request queue near capacity');
    }

    // Check error rate
    if (metrics.errorRate > 0.1) { // 10% error rate threshold
      issues.push('High error rate detected');
    }

    // Test database connectivity
    try {
      await this.performHealthCheck();
    } catch (error) {
      issues.push('Database connectivity issues');
      logger.error('Health check failed', { error });
    }

    const isHealthy = issues.length === 0;

    return {
      isHealthy,
      metrics,
      issues
    };
  }

  /**
   * Gracefully shutdown the connection pool
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down connection pool');
    this.isShuttingDown = true;

    // Clear health check timer
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Wait for queued requests to complete or timeout
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (this.requestQueue.length > 0 && (Date.now() - startTime) < shutdownTimeout) {
      await this.sleep(100);
    }

    // Cancel remaining queued requests
    this.requestQueue.forEach(request => {
      clearTimeout(request.timeout);
      request.reject(new Error('Connection pool shutdown'));
    });
    this.requestQueue = [];

    // Clear connections
    this.connections.clear();

    logger.info('Connection pool shutdown complete');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private canExecuteImmediately(): boolean {
    return this.getActiveConnectionCount() < this.config.maxConnections;
  }

  private async executeWithConnection<T>(
    operation: () => Promise<T>,
    operationName: string,
    startTime: number
  ): Promise<T> {
    const connectionId = this.createConnection();
    
    try {
      const result = await Promise.race([
        operation(),
        this.createTimeoutPromise(this.config.connectionTimeout)
      ]);

      this.updateSuccessMetrics(startTime);
      return result;
    } finally {
      this.releaseConnection(connectionId);
    }
  }

  private async queueRequest<T>(
    operation: () => Promise<T>,
    operationName: string,
    priority: string,
    startTime: number
  ): Promise<T> {
    if (this.requestQueue.length >= this.config.maxQueueSize) {
      throw new Error('Request queue is full');
    }

    return new Promise<T>((resolve, reject) => {
      const requestId = this.generateId();
      
      const timeout = setTimeout(() => {
        this.removeFromQueue(requestId);
        reject(new Error('Request timeout in queue'));
      }, this.config.connectionTimeout * 2);

      const queuedRequest: QueuedRequest = {
        id: requestId,
        operation: async () => {
          return await this.executeWithConnection(operation, operationName, startTime);
        },
        resolve,
        reject,
        createdAt: new Date(),
        timeout
      };

      // Insert based on priority (simple FIFO for now)
      this.requestQueue.push(queuedRequest);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    while (this.requestQueue.length > 0 && this.canExecuteImmediately()) {
      const request = this.requestQueue.shift();
      if (!request) break;

      clearTimeout(request.timeout);

      try {
        const result = await request.operation();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }
  }

  private createConnection(): string {
    const connectionId = this.generateId();
    const connection: ConnectionInfo = {
      id: connectionId,
      createdAt: new Date(),
      lastUsed: new Date(),
      isActive: true,
      queryCount: 0
    };

    this.connections.set(connectionId, connection);
    this.metrics.totalConnections++;

    logger.debug('Connection created', { 
      connectionId, 
      activeConnections: this.getActiveConnectionCount() 
    });

    return connectionId;
  }

  private releaseConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isActive = false;
      connection.lastUsed = new Date();
      connection.queryCount++;
    }

    // Process any queued requests
    this.processQueue();

    logger.debug('Connection released', { 
      connectionId, 
      activeConnections: this.getActiveConnectionCount() 
    });
  }

  private removeFromQueue(requestId: string): void {
    const index = this.requestQueue.findIndex(req => req.id === requestId);
    if (index !== -1) {
      const request = this.requestQueue.splice(index, 1)[0];
      clearTimeout(request.timeout);
    }
  }

  private getActiveConnectionCount(): number {
    return Array.from(this.connections.values()).filter(conn => conn.isActive).length;
  }

  private startHealthChecking(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck();
        this.cleanupIdleConnections();
      } catch (error) {
        logger.error('Health check failed', { error });
        this.metrics.isHealthy = false;
      }
    }, this.config.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simple health check query
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      this.metrics.isHealthy = true;
      this.metrics.lastHealthCheck = new Date();
      
      logger.debug('Health check passed', { 
        responseTime: Date.now() - startTime 
      });
    } catch (error) {
      this.metrics.isHealthy = false;
      throw error;
    }
  }

  private startIdleConnectionCleanup(): void {
    setInterval(() => {
      this.cleanupIdleConnections();
    }, this.config.idleTimeout / 2);
  }

  private cleanupIdleConnections(): void {
    const now = Date.now();
    const connectionsToRemove: string[] = [];

    this.connections.forEach((connection, id) => {
      if (!connection.isActive && 
          (now - connection.lastUsed.getTime()) > this.config.idleTimeout) {
        connectionsToRemove.push(id);
      }
    });

    connectionsToRemove.forEach(id => {
      this.connections.delete(id);
      logger.debug('Idle connection cleaned up', { connectionId: id });
    });
  }

  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  private updateSuccessMetrics(startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.metrics.totalQueries++;
    
    // Update average response time (simple moving average)
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalQueries - 1) + responseTime) / 
      this.metrics.totalQueries;
  }

  private updateErrorMetrics(): void {
    this.metrics.totalQueries++;
    // Error rate calculation would need more sophisticated tracking
    // For now, we'll update it in the health check
  }

  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'connection timeout',
      'network error',
      'temporary failure',
      'rate limit',
      'service unavailable'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError)
    );
  }

  private generateId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const connectionPoolManager = ConnectionPoolManager.getInstance();

// ============================================================================
// Utility functions for easy integration
// ============================================================================

/**
 * Execute a Supabase query with connection pooling
 */
export async function executePooledQuery<T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> {
  return connectionPoolManager.executeQuery(operation, operationName);
}

/**
 * Execute a Supabase query with retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName?: string,
  maxRetries?: number
): Promise<T> {
  return connectionPoolManager.executeWithRetry(
    operation, 
    operationName, 
    maxRetries ? { maxAttempts: maxRetries } : undefined
  );
}

/**
 * Get connection pool health status
 */
export async function getPoolHealth() {
  return connectionPoolManager.getHealthStatus();
}

/**
 * Get connection pool metrics
 */
export function getPoolMetrics() {
  return connectionPoolManager.getMetrics();
}