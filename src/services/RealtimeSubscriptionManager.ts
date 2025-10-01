/**
 * Realtime Subscription Manager
 * 
 * Optimized real-time subscription management with lifecycle control,
 * memory leak prevention, and selective subscription based on user activity.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { EventBus } from '@/utils/EventBus';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface SubscriptionConfig {
  id: string;
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: any) => void;
  priority: 'high' | 'medium' | 'low';
  userActivity: 'active' | 'background' | 'inactive';
  maxAge?: number; // milliseconds
  batchable?: boolean;
}

export interface SubscriptionMetrics {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  errorCount: number;
  status: 'active' | 'paused' | 'error' | 'cleanup';
}

export interface BatchedUpdate {
  table: string;
  updates: any[];
  timestamp: Date;
}

// ============================================================================
// Realtime Subscription Manager
// ============================================================================

export class RealtimeSubscriptionManager {
  private static instance: RealtimeSubscriptionManager;
  private subscriptions = new Map<string, any>();
  private subscriptionConfigs = new Map<string, SubscriptionConfig>();
  private subscriptionMetrics = new Map<string, SubscriptionMetrics>();
  private batchedUpdates = new Map<string, BatchedUpdate>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private batchProcessingInterval: NodeJS.Timeout | null = null;
  private userActivityLevel: 'active' | 'background' | 'inactive' = 'active';
  private lastUserActivity = Date.now();

  // Configuration
  private readonly config = {
    maxSubscriptions: 20,
    cleanupInterval: 30000, // 30 seconds
    batchProcessingInterval: 1000, // 1 second
    inactivityThreshold: 300000, // 5 minutes
    backgroundThreshold: 60000, // 1 minute
    maxSubscriptionAge: 3600000, // 1 hour
    maxErrorsBeforeCleanup: 5,
    priorityLimits: {
      high: 10,
      medium: 6,
      low: 4
    }
  };

  private constructor() {
    this.startCleanupProcess();
    this.startBatchProcessing();
    this.setupUserActivityTracking();
  }

  public static getInstance(): RealtimeSubscriptionManager {
    if (!RealtimeSubscriptionManager.instance) {
      RealtimeSubscriptionManager.instance = new RealtimeSubscriptionManager();
    }
    return RealtimeSubscriptionManager.instance;
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  /**
   * Create optimized subscription with lifecycle management
   */
  subscribe(config: SubscriptionConfig): string {
    try {
      // Check subscription limits
      if (!this.canCreateSubscription(config.priority)) {
        logger.warn('Subscription limit reached', { 
          priority: config.priority,
          current: this.subscriptions.size,
          max: this.config.maxSubscriptions
        });
        return '';
      }

      // Check if user activity level allows this subscription
      if (!this.shouldCreateSubscription(config.userActivity)) {
        logger.debug('Subscription deferred due to user activity', {
          userActivity: this.userActivityLevel,
          requiredActivity: config.userActivity
        });
        return '';
      }

      // Create optimized callback with batching and error handling
      const optimizedCallback = this.createOptimizedCallback(config);

      // Create Supabase subscription
      const channel = supabase
        .channel(`optimized_${config.id}`)
        .on('postgres_changes', {
          event: config.event,
          schema: 'public',
          table: config.table,
          filter: config.filter
        }, optimizedCallback)
        .subscribe((status) => {
          this.handleSubscriptionStatus(config.id, status);
        });

      // Store subscription and metadata
      this.subscriptions.set(config.id, channel);
      this.subscriptionConfigs.set(config.id, config);
      this.subscriptionMetrics.set(config.id, {
        id: config.id,
        createdAt: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        errorCount: 0,
        status: 'active'
      });

      logger.info('Subscription created', { 
        id: config.id,
        table: config.table,
        priority: config.priority
      });

      return config.id;
    } catch (error) {
      logger.error('Failed to create subscription', { error, config });
      return '';
    }
  }

  /**
   * Unsubscribe and cleanup resources
   */
  unsubscribe(subscriptionId: string): boolean {
    try {
      const channel = this.subscriptions.get(subscriptionId);
      if (!channel) {
        return false;
      }

      // Remove from Supabase
      supabase.removeChannel(channel);

      // Cleanup local state
      this.subscriptions.delete(subscriptionId);
      this.subscriptionConfigs.delete(subscriptionId);
      this.subscriptionMetrics.delete(subscriptionId);

      logger.info('Subscription removed', { id: subscriptionId });
      return true;
    } catch (error) {
      logger.error('Failed to unsubscribe', { error, subscriptionId });
      return false;
    }
  }

  /**
   * Batch unsubscribe multiple subscriptions
   */
  unsubscribeMultiple(subscriptionIds: string[]): number {
    let successCount = 0;
    for (const id of subscriptionIds) {
      if (this.unsubscribe(id)) {
        successCount++;
      }
    }
    return successCount;
  }

  /**
   * Unsubscribe all subscriptions
   */
  unsubscribeAll(): void {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    this.unsubscribeMultiple(subscriptionIds);
    logger.info('All subscriptions removed', { count: subscriptionIds.length });
  }

  // ============================================================================
  // User Activity Tracking
  // ============================================================================

  /**
   * Update user activity level
   */
  updateUserActivity(): void {
    this.lastUserActivity = Date.now();
    const previousLevel = this.userActivityLevel;
    this.userActivityLevel = 'active';

    if (previousLevel !== 'active') {
      this.reactivateSubscriptions();
      logger.debug('User activity resumed', { previousLevel });
    }
  }

  /**
   * Set user to background mode
   */
  setBackgroundMode(): void {
    this.userActivityLevel = 'background';
    this.optimizeForBackground();
    logger.debug('User entered background mode');
  }

  /**
   * Set user to inactive mode
   */
  setInactiveMode(): void {
    this.userActivityLevel = 'inactive';
    this.pauseLowPrioritySubscriptions();
    logger.debug('User entered inactive mode');
  }

  // ============================================================================
  // Subscription Optimization
  // ============================================================================

  /**
   * Create optimized callback with batching and error handling
   */
  private createOptimizedCallback(config: SubscriptionConfig) {
    return (payload: any) => {
      try {
        const metrics = this.subscriptionMetrics.get(config.id);
        if (metrics) {
          metrics.lastActivity = new Date();
          metrics.messageCount++;
        }

        // Handle batching for batchable subscriptions
        if (config.batchable) {
          this.addToBatch(config.table, payload);
        } else {
          // Execute callback immediately for high-priority subscriptions
          config.callback(payload);
        }

        // Emit event for monitoring
        EventBus.emit('subscription-message', {
          subscriptionId: config.id,
          table: config.table,
          payload
        });

      } catch (error) {
        this.handleSubscriptionError(config.id, error);
      }
    };
  }

  /**
   * Add update to batch for processing
   */
  private addToBatch(table: string, payload: any): void {
    const existing = this.batchedUpdates.get(table);
    if (existing) {
      existing.updates.push(payload);
      existing.timestamp = new Date();
    } else {
      this.batchedUpdates.set(table, {
        table,
        updates: [payload],
        timestamp: new Date()
      });
    }
  }

  /**
   * Process batched updates
   */
  private processBatchedUpdates(): void {
    for (const [table, batch] of this.batchedUpdates.entries()) {
      try {
        // Find subscriptions for this table that are batchable
        const batchableSubscriptions = Array.from(this.subscriptionConfigs.values())
          .filter(config => config.table === table && config.batchable);

        // Execute callbacks with batched data
        for (const config of batchableSubscriptions) {
          config.callback({
            eventType: 'batch',
            table,
            updates: batch.updates,
            count: batch.updates.length
          });
        }

        // Clear processed batch
        this.batchedUpdates.delete(table);

      } catch (error) {
        logger.error('Error processing batched updates', { error, table });
      }
    }
  }

  // ============================================================================
  // Lifecycle Management
  // ============================================================================

  /**
   * Check if subscription can be created based on limits
   */
  private canCreateSubscription(priority: 'high' | 'medium' | 'low'): boolean {
    const currentCount = this.subscriptions.size;
    const maxAllowed = this.config.maxSubscriptions;

    if (currentCount >= maxAllowed) {
      // Try to cleanup old subscriptions first
      this.cleanupOldSubscriptions();
      return this.subscriptions.size < maxAllowed;
    }

    // Check priority-based limits
    const priorityCount = Array.from(this.subscriptionConfigs.values())
      .filter(config => config.priority === priority).length;
    
    return priorityCount < this.config.priorityLimits[priority];
  }

  /**
   * Check if subscription should be created based on user activity
   */
  private shouldCreateSubscription(requiredActivity: 'active' | 'background' | 'inactive'): boolean {
    const activityLevels = { active: 3, background: 2, inactive: 1 };
    const currentLevel = activityLevels[this.userActivityLevel];
    const requiredLevel = activityLevels[requiredActivity];
    
    return currentLevel >= requiredLevel;
  }

  /**
   * Handle subscription status changes
   */
  private handleSubscriptionStatus(subscriptionId: string, status: string): void {
    const metrics = this.subscriptionMetrics.get(subscriptionId);
    if (metrics) {
      if (status === 'SUBSCRIBED') {
        metrics.status = 'active';
      } else if (status === 'CHANNEL_ERROR') {
        metrics.status = 'error';
        metrics.errorCount++;
      }
    }

    logger.debug('Subscription status changed', { subscriptionId, status });
  }

  /**
   * Handle subscription errors
   */
  private handleSubscriptionError(subscriptionId: string, error: any): void {
    const metrics = this.subscriptionMetrics.get(subscriptionId);
    if (metrics) {
      metrics.errorCount++;
      
      // Cleanup subscription if too many errors
      if (metrics.errorCount >= this.config.maxErrorsBeforeCleanup) {
        logger.warn('Cleaning up subscription due to errors', { 
          subscriptionId, 
          errorCount: metrics.errorCount 
        });
        this.unsubscribe(subscriptionId);
      }
    }

    logger.error('Subscription error', { error, subscriptionId });
  }

  // ============================================================================
  // Background Optimization
  // ============================================================================

  /**
   * Optimize subscriptions for background mode
   */
  private optimizeForBackground(): void {
    for (const [id, config] of this.subscriptionConfigs.entries()) {
      if (config.priority === 'low' && config.userActivity === 'active') {
        // Pause low-priority active subscriptions in background
        const metrics = this.subscriptionMetrics.get(id);
        if (metrics) {
          metrics.status = 'paused';
        }
      }
    }
  }

  /**
   * Pause low-priority subscriptions when inactive
   */
  private pauseLowPrioritySubscriptions(): void {
    const lowPriorityIds = Array.from(this.subscriptionConfigs.entries())
      .filter(([_, config]) => config.priority === 'low')
      .map(([id, _]) => id);

    for (const id of lowPriorityIds) {
      const metrics = this.subscriptionMetrics.get(id);
      if (metrics) {
        metrics.status = 'paused';
      }
    }

    logger.debug('Paused low-priority subscriptions', { count: lowPriorityIds.length });
  }

  /**
   * Reactivate subscriptions when user becomes active
   */
  private reactivateSubscriptions(): void {
    for (const [id, metrics] of this.subscriptionMetrics.entries()) {
      if (metrics.status === 'paused') {
        metrics.status = 'active';
      }
    }
  }

  // ============================================================================
  // Cleanup and Maintenance
  // ============================================================================

  /**
   * Start automatic cleanup process
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Start batch processing
   */
  private startBatchProcessing(): void {
    this.batchProcessingInterval = setInterval(() => {
      this.processBatchedUpdates();
    }, this.config.batchProcessingInterval);
  }

  /**
   * Setup user activity tracking
   */
  private setupUserActivityTracking(): void {
    // Track user activity level based on last activity
    setInterval(() => {
      const timeSinceActivity = Date.now() - this.lastUserActivity;
      
      if (timeSinceActivity > this.config.inactivityThreshold) {
        if (this.userActivityLevel !== 'inactive') {
          this.setInactiveMode();
        }
      } else if (timeSinceActivity > this.config.backgroundThreshold) {
        if (this.userActivityLevel === 'active') {
          this.setBackgroundMode();
        }
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Perform cleanup of old and unused subscriptions
   */
  private performCleanup(): void {
    this.cleanupOldSubscriptions();
    this.cleanupErroredSubscriptions();
    this.cleanupBatchedUpdates();
  }

  /**
   * Cleanup old subscriptions
   */
  private cleanupOldSubscriptions(): void {
    const now = Date.now();
    const toCleanup: string[] = [];

    for (const [id, metrics] of this.subscriptionMetrics.entries()) {
      const age = now - metrics.createdAt.getTime();
      const config = this.subscriptionConfigs.get(id);
      
      if (config?.maxAge && age > config.maxAge) {
        toCleanup.push(id);
      } else if (age > this.config.maxSubscriptionAge) {
        // Default cleanup for very old subscriptions
        const timeSinceActivity = now - metrics.lastActivity.getTime();
        if (timeSinceActivity > this.config.inactivityThreshold) {
          toCleanup.push(id);
        }
      }
    }

    if (toCleanup.length > 0) {
      this.unsubscribeMultiple(toCleanup);
      logger.info('Cleaned up old subscriptions', { count: toCleanup.length });
    }
  }

  /**
   * Cleanup subscriptions with too many errors
   */
  private cleanupErroredSubscriptions(): void {
    const toCleanup = Array.from(this.subscriptionMetrics.entries())
      .filter(([_, metrics]) => metrics.errorCount >= this.config.maxErrorsBeforeCleanup)
      .map(([id, _]) => id);

    if (toCleanup.length > 0) {
      this.unsubscribeMultiple(toCleanup);
      logger.info('Cleaned up errored subscriptions', { count: toCleanup.length });
    }
  }

  /**
   * Cleanup old batched updates
   */
  private cleanupBatchedUpdates(): void {
    const now = Date.now();
    const maxAge = 30000; // 30 seconds

    for (const [table, batch] of this.batchedUpdates.entries()) {
      const age = now - batch.timestamp.getTime();
      if (age > maxAge) {
        this.batchedUpdates.delete(table);
      }
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get subscription metrics
   */
  getMetrics(): SubscriptionMetrics[] {
    return Array.from(this.subscriptionMetrics.values());
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptionCount(): number {
    return Array.from(this.subscriptionMetrics.values())
      .filter(metrics => metrics.status === 'active').length;
  }

  /**
   * Get subscription by ID
   */
  getSubscription(id: string): any {
    return this.subscriptions.get(id);
  }

  /**
   * Check if subscription exists
   */
  hasSubscription(id: string): boolean {
    return this.subscriptions.has(id);
  }

  /**
   * Get current user activity level
   */
  getUserActivityLevel(): 'active' | 'background' | 'inactive' {
    return this.userActivityLevel;
  }

  /**
   * Destroy manager and cleanup all resources
   */
  destroy(): void {
    // Cleanup intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.batchProcessingInterval) {
      clearInterval(this.batchProcessingInterval);
      this.batchProcessingInterval = null;
    }

    // Unsubscribe all
    this.unsubscribeAll();

    // Clear all data
    this.subscriptions.clear();
    this.subscriptionConfigs.clear();
    this.subscriptionMetrics.clear();
    this.batchedUpdates.clear();

    logger.info('RealtimeSubscriptionManager destroyed');
  }
}

// Export singleton instance
export const realtimeSubscriptionManager = RealtimeSubscriptionManager.getInstance();