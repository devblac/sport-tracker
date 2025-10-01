/**
 * Resource Usage Monitor
 * 
 * Monitors API calls, performance metrics, and resource usage for Supabase free tier
 * optimization with automatic alerts and usage pattern analysis.
 */

import { logger } from '@/utils/logger';
import { EventBus } from '@/utils/EventBus';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface APICallMetrics {
  endpoint: string;
  method: string;
  timestamp: Date;
  responseTime: number;
  success: boolean;
  errorCode?: string;
  dataSize?: number;
  cached?: boolean;
}

export interface ResourceUsage {
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
    averageResponseTime: number;
  };
  database: {
    reads: number;
    writes: number;
    storage: number; // bytes
    bandwidth: number; // bytes
  };
  realtime: {
    activeSubscriptions: number;
    messagesReceived: number;
    messagesSent: number;
  };
  auth: {
    activeUsers: number;
    authRequests: number;
  };
}

export interface FreeTierLimits {
  database: {
    maxRows: number;
    maxStorage: number; // bytes
    maxBandwidth: number; // bytes per month
  };
  apiCalls: {
    maxPerMinute: number;
    maxPerHour: number;
    maxPerDay: number;
  };
  realtime: {
    maxConcurrentConnections: number;
    maxMessagesPerMonth: number;
  };
  auth: {
    maxActiveUsers: number;
  };
}

export interface UsageAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  resource: string;
  message: string;
  currentUsage: number;
  limit: number;
  percentage: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface OptimizationSuggestion {
  id: string;
  category: 'caching' | 'batching' | 'subscription' | 'query' | 'general';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  estimatedSavings: string;
  implemented: boolean;
}

export interface PerformanceMetrics {
  timestamp: Date;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
}

// ============================================================================
// Resource Usage Monitor
// ============================================================================

export class ResourceUsageMonitor {
  private static instance: ResourceUsageMonitor;
  private apiCallHistory: APICallMetrics[] = [];
  private currentUsage: ResourceUsage = this.initializeUsage();
  private performanceHistory: PerformanceMetrics[] = [];
  private alerts: UsageAlert[] = [];
  private optimizationSuggestions: OptimizationSuggestion[] = [];
  
  // Monitoring intervals
  private metricsCollectionInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private optimizationAnalysisInterval: NodeJS.Timeout | null = null;

  // Free tier limits (Supabase free tier as of 2024)
  private readonly freeTierLimits: FreeTierLimits = {
    database: {
      maxRows: 500000,
      maxStorage: 500 * 1024 * 1024, // 500MB
      maxBandwidth: 5 * 1024 * 1024 * 1024 // 5GB per month
    },
    apiCalls: {
      maxPerMinute: 100,
      maxPerHour: 6000,
      maxPerDay: 144000
    },
    realtime: {
      maxConcurrentConnections: 200,
      maxMessagesPerMonth: 2000000
    },
    auth: {
      maxActiveUsers: 50000
    }
  };

  // Configuration
  private readonly config = {
    metricsCollectionInterval: 30000, // 30 seconds
    alertCheckInterval: 60000, // 1 minute
    cleanupInterval: 300000, // 5 minutes
    optimizationAnalysisInterval: 600000, // 10 minutes
    maxHistorySize: 10000,
    maxPerformanceHistorySize: 1000,
    alertThresholds: {
      warning: 0.8, // 80%
      critical: 0.95 // 95%
    },
    performanceThresholds: {
      maxResponseTime: 5000, // 5 seconds
      maxErrorRate: 0.05, // 5%
      minCacheHitRate: 0.7 // 70%
    }
  };

  private constructor() {
    this.startMonitoring();
    this.setupEventListeners();
    this.initializeOptimizationSuggestions();
  }

  public static getInstance(): ResourceUsageMonitor {
    if (!ResourceUsageMonitor.instance) {
      ResourceUsageMonitor.instance = new ResourceUsageMonitor();
    }
    return ResourceUsageMonitor.instance;
  }

  // ============================================================================
  // API Call Tracking
  // ============================================================================

  /**
   * Track API call metrics
   */
  trackAPICall(metrics: Omit<APICallMetrics, 'timestamp'>): void {
    const callMetrics: APICallMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.apiCallHistory.push(callMetrics);
    this.updateAPICallUsage(callMetrics);

    // Emit event for real-time monitoring
    EventBus.emit('api-call-tracked', callMetrics);

    // Check for immediate alerts
    this.checkAPICallLimits();

    // Cleanup old history if needed
    if (this.apiCallHistory.length > this.config.maxHistorySize) {
      this.apiCallHistory = this.apiCallHistory.slice(-this.config.maxHistorySize);
    }
  }

  /**
   * Update API call usage statistics
   */
  private updateAPICallUsage(metrics: APICallMetrics): void {
    this.currentUsage.apiCalls.total++;
    
    if (metrics.success) {
      this.currentUsage.apiCalls.successful++;
    } else {
      this.currentUsage.apiCalls.failed++;
    }

    if (metrics.cached) {
      this.currentUsage.apiCalls.cached++;
    }

    // Update average response time
    const total = this.currentUsage.apiCalls.total;
    const currentAvg = this.currentUsage.apiCalls.averageResponseTime;
    this.currentUsage.apiCalls.averageResponseTime = 
      (currentAvg * (total - 1) + metrics.responseTime) / total;
  }

  /**
   * Check API call limits and generate alerts
   */
  private checkAPICallLimits(): void {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    // Count calls in different time windows
    const callsLastMinute = this.apiCallHistory.filter(call => call.timestamp >= oneMinuteAgo).length;
    const callsLastHour = this.apiCallHistory.filter(call => call.timestamp >= oneHourAgo).length;
    const callsLastDay = this.apiCallHistory.filter(call => call.timestamp >= oneDayAgo).length;

    // Check limits and create alerts
    this.checkLimit('api_calls_minute', callsLastMinute, this.freeTierLimits.apiCalls.maxPerMinute, 'API calls per minute');
    this.checkLimit('api_calls_hour', callsLastHour, this.freeTierLimits.apiCalls.maxPerHour, 'API calls per hour');
    this.checkLimit('api_calls_day', callsLastDay, this.freeTierLimits.apiCalls.maxPerDay, 'API calls per day');
  }

  // ============================================================================
  // Database Usage Tracking
  // ============================================================================

  /**
   * Track database operation
   */
  trackDatabaseOperation(operation: 'read' | 'write', dataSize?: number): void {
    if (operation === 'read') {
      this.currentUsage.database.reads++;
    } else {
      this.currentUsage.database.writes++;
    }

    if (dataSize) {
      this.currentUsage.database.bandwidth += dataSize;
    }

    EventBus.emit('database-operation-tracked', { operation, dataSize });
  }

  /**
   * Update database storage usage
   */
  updateStorageUsage(storageBytes: number): void {
    this.currentUsage.database.storage = storageBytes;
    this.checkLimit('database_storage', storageBytes, this.freeTierLimits.database.maxStorage, 'Database storage');
  }

  // ============================================================================
  // Realtime Usage Tracking
  // ============================================================================

  /**
   * Track realtime subscription
   */
  trackRealtimeSubscription(active: number): void {
    this.currentUsage.realtime.activeSubscriptions = active;
    this.checkLimit('realtime_connections', active, this.freeTierLimits.realtime.maxConcurrentConnections, 'Realtime connections');
  }

  /**
   * Track realtime message
   */
  trackRealtimeMessage(direction: 'received' | 'sent'): void {
    if (direction === 'received') {
      this.currentUsage.realtime.messagesReceived++;
    } else {
      this.currentUsage.realtime.messagesSent++;
    }

    const totalMessages = this.currentUsage.realtime.messagesReceived + this.currentUsage.realtime.messagesSent;
    this.checkLimit('realtime_messages', totalMessages, this.freeTierLimits.realtime.maxMessagesPerMonth, 'Realtime messages');
  }

  // ============================================================================
  // Performance Metrics Collection
  // ============================================================================

  /**
   * Collect current performance metrics
   */
  private collectPerformanceMetrics(): void {
    const metrics: PerformanceMetrics = {
      timestamp: new Date(),
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCPUUsage(),
      networkLatency: this.getNetworkLatency(),
      cacheHitRate: this.getCacheHitRate(),
      errorRate: this.getErrorRate(),
      throughput: this.getThroughput()
    };

    this.performanceHistory.push(metrics);

    // Keep history size manageable
    if (this.performanceHistory.length > this.config.maxPerformanceHistorySize) {
      this.performanceHistory = this.performanceHistory.slice(-this.config.maxPerformanceHistorySize);
    }

    // Check performance thresholds
    this.checkPerformanceThresholds(metrics);

    EventBus.emit('performance-metrics-collected', metrics);
  }

  /**
   * Get memory usage (simplified for browser environment)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Get CPU usage (simplified estimation)
   */
  private getCPUUsage(): number {
    // In browser environment, we can't get actual CPU usage
    // This is a placeholder that could be enhanced with performance timing
    return 0;
  }

  /**
   * Get network latency from recent API calls
   */
  private getNetworkLatency(): number {
    const recentCalls = this.apiCallHistory.slice(-10);
    if (recentCalls.length === 0) return 0;
    
    const totalLatency = recentCalls.reduce((sum, call) => sum + call.responseTime, 0);
    return totalLatency / recentCalls.length;
  }

  /**
   * Calculate cache hit rate
   */
  private getCacheHitRate(): number {
    const recentCalls = this.apiCallHistory.slice(-100);
    if (recentCalls.length === 0) return 0;
    
    const cachedCalls = recentCalls.filter(call => call.cached).length;
    return cachedCalls / recentCalls.length;
  }

  /**
   * Calculate error rate
   */
  private getErrorRate(): number {
    const recentCalls = this.apiCallHistory.slice(-100);
    if (recentCalls.length === 0) return 0;
    
    const failedCalls = recentCalls.filter(call => !call.success).length;
    return failedCalls / recentCalls.length;
  }

  /**
   * Calculate throughput (requests per second)
   */
  private getThroughput(): number {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentCalls = this.apiCallHistory.filter(call => call.timestamp >= oneMinuteAgo);
    return recentCalls.length / 60; // requests per second
  }

  // ============================================================================
  // Alert Management
  // ============================================================================

  /**
   * Check usage limit and create alert if needed
   */
  private checkLimit(resource: string, current: number, limit: number, description: string): void {
    const percentage = current / limit;
    
    if (percentage >= this.config.alertThresholds.critical) {
      this.createAlert('critical', resource, `${description} usage is critical`, current, limit, percentage);
    } else if (percentage >= this.config.alertThresholds.warning) {
      this.createAlert('warning', resource, `${description} usage is high`, current, limit, percentage);
    }
  }

  /**
   * Check performance thresholds
   */
  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    if (metrics.networkLatency > this.config.performanceThresholds.maxResponseTime) {
      this.createAlert('warning', 'performance_latency', 'High network latency detected', 
        metrics.networkLatency, this.config.performanceThresholds.maxResponseTime, 
        metrics.networkLatency / this.config.performanceThresholds.maxResponseTime);
    }

    if (metrics.errorRate > this.config.performanceThresholds.maxErrorRate) {
      this.createAlert('critical', 'performance_errors', 'High error rate detected', 
        metrics.errorRate, this.config.performanceThresholds.maxErrorRate, 
        metrics.errorRate / this.config.performanceThresholds.maxErrorRate);
    }

    if (metrics.cacheHitRate < this.config.performanceThresholds.minCacheHitRate) {
      this.createAlert('info', 'performance_cache', 'Low cache hit rate', 
        metrics.cacheHitRate, this.config.performanceThresholds.minCacheHitRate, 
        metrics.cacheHitRate / this.config.performanceThresholds.minCacheHitRate);
    }
  }

  /**
   * Create usage alert
   */
  private createAlert(type: 'warning' | 'critical' | 'info', resource: string, message: string, 
                     current: number, limit: number, percentage: number): void {
    const alertId = `${resource}_${Date.now()}`;
    
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(alert => 
      alert.resource === resource && 
      alert.type === type && 
      !alert.acknowledged &&
      Date.now() - alert.timestamp.getTime() < 300000 // 5 minutes
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    const alert: UsageAlert = {
      id: alertId,
      type,
      resource,
      message,
      currentUsage: current,
      limit,
      percentage,
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.push(alert);
    
    logger.warn('Usage alert created', alert);
    EventBus.emit('usage-alert', alert);

    // Auto-acknowledge info alerts after 1 minute
    if (type === 'info') {
      setTimeout(() => {
        this.acknowledgeAlert(alertId);
      }, 60000);
    }
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      EventBus.emit('alert-acknowledged', alert);
      return true;
    }
    return false;
  }

  // ============================================================================
  // Optimization Suggestions
  // ============================================================================

  /**
   * Initialize optimization suggestions
   */
  private initializeOptimizationSuggestions(): void {
    this.optimizationSuggestions = [
      {
        id: 'enable_caching',
        category: 'caching',
        title: 'Enable Query Caching',
        description: 'Cache frequently accessed data to reduce API calls',
        impact: 'high',
        effort: 'medium',
        estimatedSavings: '30-50% reduction in API calls',
        implemented: false
      },
      {
        id: 'batch_operations',
        category: 'batching',
        title: 'Batch Database Operations',
        description: 'Group multiple operations into single requests',
        impact: 'high',
        effort: 'medium',
        estimatedSavings: '40-60% reduction in API calls',
        implemented: false
      },
      {
        id: 'optimize_subscriptions',
        category: 'subscription',
        title: 'Optimize Realtime Subscriptions',
        description: 'Use selective subscriptions based on user activity',
        impact: 'medium',
        effort: 'low',
        estimatedSavings: '20-30% reduction in realtime usage',
        implemented: false
      },
      {
        id: 'query_optimization',
        category: 'query',
        title: 'Optimize Database Queries',
        description: 'Use indexes and efficient query patterns',
        impact: 'medium',
        effort: 'high',
        estimatedSavings: '15-25% improvement in response time',
        implemented: false
      },
      {
        id: 'data_prefetching',
        category: 'general',
        title: 'Implement Data Prefetching',
        description: 'Preload data based on user behavior patterns',
        impact: 'medium',
        effort: 'high',
        estimatedSavings: '20-30% improvement in perceived performance',
        implemented: false
      }
    ];
  }

  /**
   * Analyze usage patterns and generate dynamic suggestions
   */
  private analyzeUsagePatternsAndSuggest(): void {
    const recentCalls = this.apiCallHistory.slice(-1000);
    
    // Analyze cache hit rate
    const cacheHitRate = this.getCacheHitRate();
    if (cacheHitRate < 0.5) {
      this.addDynamicSuggestion({
        id: 'improve_caching',
        category: 'caching',
        title: 'Improve Caching Strategy',
        description: `Current cache hit rate is ${(cacheHitRate * 100).toFixed(1)}%. Consider caching more frequently accessed data.`,
        impact: 'high',
        effort: 'medium',
        estimatedSavings: `${((0.7 - cacheHitRate) * 100).toFixed(0)}% reduction in API calls`,
        implemented: false
      });
    }

    // Analyze API call patterns
    const callsByEndpoint = this.groupCallsByEndpoint(recentCalls);
    const highVolumeEndpoints = Object.entries(callsByEndpoint)
      .filter(([_, calls]) => calls.length > 100)
      .map(([endpoint, _]) => endpoint);

    if (highVolumeEndpoints.length > 0) {
      this.addDynamicSuggestion({
        id: 'optimize_high_volume',
        category: 'general',
        title: 'Optimize High-Volume Endpoints',
        description: `Endpoints with high call volume: ${highVolumeEndpoints.join(', ')}. Consider optimization.`,
        impact: 'high',
        effort: 'medium',
        estimatedSavings: '25-40% reduction in API calls',
        implemented: false
      });
    }

    // Analyze error patterns
    const errorRate = this.getErrorRate();
    if (errorRate > 0.05) {
      this.addDynamicSuggestion({
        id: 'reduce_errors',
        category: 'general',
        title: 'Reduce Error Rate',
        description: `Current error rate is ${(errorRate * 100).toFixed(1)}%. Implement better error handling and retry logic.`,
        impact: 'medium',
        effort: 'medium',
        estimatedSavings: 'Improved user experience and reduced wasted API calls',
        implemented: false
      });
    }
  }

  /**
   * Group API calls by endpoint
   */
  private groupCallsByEndpoint(calls: APICallMetrics[]): Record<string, APICallMetrics[]> {
    return calls.reduce((groups, call) => {
      const key = `${call.method} ${call.endpoint}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(call);
      return groups;
    }, {} as Record<string, APICallMetrics[]>);
  }

  /**
   * Add dynamic optimization suggestion
   */
  private addDynamicSuggestion(suggestion: OptimizationSuggestion): void {
    // Check if suggestion already exists
    const exists = this.optimizationSuggestions.some(s => s.id === suggestion.id);
    if (!exists) {
      this.optimizationSuggestions.push(suggestion);
      EventBus.emit('optimization-suggestion', suggestion);
    }
  }

  /**
   * Mark optimization as implemented
   */
  markOptimizationImplemented(suggestionId: string): boolean {
    const suggestion = this.optimizationSuggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.implemented = true;
      EventBus.emit('optimization-implemented', suggestion);
      return true;
    }
    return false;
  }

  // ============================================================================
  // Background Monitoring
  // ============================================================================

  /**
   * Start monitoring processes
   */
  private startMonitoring(): void {
    this.metricsCollectionInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, this.config.metricsCollectionInterval);

    this.alertCheckInterval = setInterval(() => {
      this.checkAllLimits();
    }, this.config.alertCheckInterval);

    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, this.config.cleanupInterval);

    this.optimizationAnalysisInterval = setInterval(() => {
      this.analyzeUsagePatternsAndSuggest();
    }, this.config.optimizationAnalysisInterval);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for database metrics from DatabaseQueryOptimizer
    EventBus.on('database-metrics', (metrics) => {
      this.trackDatabaseOperation('read', 0); // Update based on actual metrics
    });

    // Listen for subscription metrics from RealtimeSubscriptionManager
    EventBus.on('subscription-message', (data) => {
      this.trackRealtimeMessage('received');
    });
  }

  /**
   * Check all usage limits
   */
  private checkAllLimits(): void {
    this.checkAPICallLimits();
    // Other limit checks are triggered by their respective tracking methods
  }

  /**
   * Cleanup old data
   */
  private cleanupOldData(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Cleanup old API call history
    this.apiCallHistory = this.apiCallHistory.filter(call => call.timestamp >= oneWeekAgo);
    
    // Cleanup old performance history
    this.performanceHistory = this.performanceHistory.filter(metrics => metrics.timestamp >= oneWeekAgo);
    
    // Cleanup acknowledged alerts older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => 
      !alert.acknowledged || alert.timestamp >= oneDayAgo
    );
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Initialize usage object
   */
  private initializeUsage(): ResourceUsage {
    return {
      apiCalls: {
        total: 0,
        successful: 0,
        failed: 0,
        cached: 0,
        averageResponseTime: 0
      },
      database: {
        reads: 0,
        writes: 0,
        storage: 0,
        bandwidth: 0
      },
      realtime: {
        activeSubscriptions: 0,
        messagesReceived: 0,
        messagesSent: 0
      },
      auth: {
        activeUsers: 0,
        authRequests: 0
      }
    };
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get current resource usage
   */
  getCurrentUsage(): ResourceUsage {
    return { ...this.currentUsage };
  }

  /**
   * Get free tier limits
   */
  getFreeTierLimits(): FreeTierLimits {
    return { ...this.freeTierLimits };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): UsageAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): UsageAlert[] {
    return [...this.alerts];
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): OptimizationSuggestion[] {
    return [...this.optimizationSuggestions];
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(limit?: number): PerformanceMetrics[] {
    const history = [...this.performanceHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get API call statistics
   */
  getAPICallStats(timeWindow?: number): {
    total: number;
    successful: number;
    failed: number;
    cached: number;
    averageResponseTime: number;
    callsByEndpoint: Record<string, number>;
  } {
    const windowStart = timeWindow ? new Date(Date.now() - timeWindow) : new Date(0);
    const relevantCalls = this.apiCallHistory.filter(call => call.timestamp >= windowStart);
    
    const callsByEndpoint = this.groupCallsByEndpoint(relevantCalls);
    const endpointCounts = Object.entries(callsByEndpoint).reduce((counts, [endpoint, calls]) => {
      counts[endpoint] = calls.length;
      return counts;
    }, {} as Record<string, number>);

    return {
      total: relevantCalls.length,
      successful: relevantCalls.filter(call => call.success).length,
      failed: relevantCalls.filter(call => !call.success).length,
      cached: relevantCalls.filter(call => call.cached).length,
      averageResponseTime: relevantCalls.length > 0 
        ? relevantCalls.reduce((sum, call) => sum + call.responseTime, 0) / relevantCalls.length 
        : 0,
      callsByEndpoint: endpointCounts
    };
  }

  /**
   * Reset usage statistics
   */
  resetUsage(): void {
    this.currentUsage = this.initializeUsage();
    this.apiCallHistory = [];
    this.performanceHistory = [];
    logger.info('Usage statistics reset');
  }

  /**
   * Destroy monitor and cleanup resources
   */
  destroy(): void {
    // Clear intervals
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = null;
    }
    
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.optimizationAnalysisInterval) {
      clearInterval(this.optimizationAnalysisInterval);
      this.optimizationAnalysisInterval = null;
    }

    // Clear data
    this.apiCallHistory = [];
    this.performanceHistory = [];
    this.alerts = [];
    this.optimizationSuggestions = [];
    this.currentUsage = this.initializeUsage();

    logger.info('ResourceUsageMonitor destroyed');
  }
}

// Export singleton instance
export const resourceUsageMonitor = ResourceUsageMonitor.getInstance();