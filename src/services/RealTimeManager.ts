/**
 * World-Class Real-Time Manager
 * Ultra-lightweight, high-performance real-time system
 * Built for maximum efficiency and minimal resource usage
 */

import { logger } from '@/utils';
import { queryService } from './QueryService';

// Real-time event types
export type RealTimeEventType = 
  | 'workout_progress'
  | 'leaderboard_update'
  | 'achievement_unlocked'
  | 'social_activity'
  | 'challenge_update'
  | 'streak_milestone'
  | 'user_online'
  | 'notification';

export interface RealTimeEvent<T = any> {
  readonly id: string;
  readonly type: RealTimeEventType;
  readonly data: T;
  readonly timestamp: number;
  readonly userId?: string;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RealTimeSubscription {
  readonly id: string;
  readonly eventType: RealTimeEventType;
  readonly callback: (event: RealTimeEvent) => void;
  readonly options: SubscriptionOptions;
}

export interface SubscriptionOptions {
  readonly throttle?: number; // ms between updates
  readonly priority?: 'low' | 'medium' | 'high';
  readonly onlyWhenVisible?: boolean;
  readonly batchUpdates?: boolean;
}

export interface RealTimeStats {
  readonly activeSubscriptions: number;
  readonly eventsProcessed: number;
  readonly averageLatency: number;
  readonly memoryUsage: number;
  readonly isActive: boolean;
}

/**
 * Ultra-efficient Real-Time Manager with intelligent resource management
 */
export class RealTimeManager {
  private static instance: RealTimeManager;
  private subscriptions = new Map<string, RealTimeSubscription>();
  private eventQueue: RealTimeEvent[] = [];
  private isProcessing = false;
  private isVisible = true;
  private broadcastChannel: BroadcastChannel | null = null;
  private cleanupController = new AbortController();
  
  // Performance tracking
  private stats = {
    eventsProcessed: 0,
    totalLatency: 0,
    startTime: Date.now()
  };

  // Throttling and batching
  private throttledCallbacks = new Map<string, NodeJS.Timeout>();
  private batchedEvents = new Map<RealTimeEventType, RealTimeEvent[]>();
  private batchTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeBroadcastChannel();
    this.setupVisibilityHandling();
    this.setupPerformanceOptimizations();
    this.startEventProcessor();
    
    logger.info('RealTimeManager initialized with ultra-lightweight architecture');
  }

  /**
   * Get singleton instance with thread-safe initialization
   */
  public static getInstance(): RealTimeManager {
    if (!RealTimeManager.instance) {
      RealTimeManager.instance = new RealTimeManager();
    }
    return RealTimeManager.instance;
  }

  /**
   * Subscribe to real-time events with intelligent optimization
   */
  public subscribe<T>(
    eventType: RealTimeEventType,
    callback: (event: RealTimeEvent<T>) => void,
    options: SubscriptionOptions = {}
  ): string {
    const subscriptionId = this.generateId();
    
    const subscription: RealTimeSubscription = {
      id: subscriptionId,
      eventType,
      callback: callback as (event: RealTimeEvent) => void,
      options: {
        throttle: options.throttle || 16, // 60fps default
        priority: options.priority || 'medium',
        onlyWhenVisible: options.onlyWhenVisible ?? true,
        batchUpdates: options.batchUpdates ?? false,
        ...options
      }
    };

    this.subscriptions.set(subscriptionId, subscription);
    
    logger.debug('Real-time subscription created', { 
      eventType, 
      subscriptionId,
      options: subscription.options 
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from real-time events with automatic cleanup
   */
  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      // Clear any pending throttled callbacks
      const throttleId = this.throttledCallbacks.get(subscriptionId);
      if (throttleId) {
        clearTimeout(throttleId);
        this.throttledCallbacks.delete(subscriptionId);
      }

      this.subscriptions.delete(subscriptionId);
      
      logger.debug('Real-time subscription removed', { subscriptionId });
    }
  }

  /**
   * Emit real-time event with intelligent processing
   */
  public emit<T>(
    type: RealTimeEventType,
    data: T,
    options: {
      userId?: string;
      priority?: RealTimeEvent['priority'];
      broadcast?: boolean;
    } = {}
  ): void {
    const event: RealTimeEvent<T> = {
      id: this.generateId(),
      type,
      data,
      timestamp: Date.now(),
      userId: options.userId,
      priority: options.priority || 'medium'
    };

    // Add to processing queue
    this.eventQueue.push(event);

    // Broadcast to other tabs if requested
    if (options.broadcast && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch (error) {
        logger.warn('Failed to broadcast event', error);
      }
    }

    // Process immediately for critical events
    if (event.priority === 'critical') {
      this.processEventQueue();
    }

    logger.debug('Real-time event emitted', { type, priority: event.priority });
  }

  /**
   * Get comprehensive performance statistics
   */
  public getStats(): RealTimeStats {
    const memoryUsage = this.estimateMemoryUsage();
    const averageLatency = this.stats.eventsProcessed > 0 
      ? this.stats.totalLatency / this.stats.eventsProcessed 
      : 0;

    return {
      activeSubscriptions: this.subscriptions.size,
      eventsProcessed: this.stats.eventsProcessed,
      averageLatency,
      memoryUsage,
      isActive: this.isVisible && this.subscriptions.size > 0
    };
  }

  /**
   * Pause real-time processing for performance optimization
   */
  public pause(): void {
    this.isVisible = false;
    logger.debug('Real-time processing paused');
  }

  /**
   * Resume real-time processing
   */
  public resume(): void {
    this.isVisible = true;
    if (this.eventQueue.length > 0) {
      this.processEventQueue();
    }
    logger.debug('Real-time processing resumed');
  }

  /**
   * Clean up all resources
   */
  public destroy(): void {
    // Clear all subscriptions
    this.subscriptions.clear();
    
    // Clear all timeouts
    this.throttledCallbacks.forEach(timeout => clearTimeout(timeout));
    this.throttledCallbacks.clear();
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Close broadcast channel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }

    // Abort all cleanup operations
    this.cleanupController.abort();

    logger.info('RealTimeManager destroyed and cleaned up');
  }

  // Private implementation methods

  private initializeBroadcastChannel(): void {
    if ('BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('sport-tracker-realtime');
        
        this.broadcastChannel.addEventListener('message', (event) => {
          const realTimeEvent = event.data as RealTimeEvent;
          this.eventQueue.push(realTimeEvent);
          
          if (realTimeEvent.priority === 'critical') {
            this.processEventQueue();
          }
        });

        logger.debug('BroadcastChannel initialized for cross-tab communication');
      } catch (error) {
        logger.warn('BroadcastChannel not available', error);
      }
    }
  }

  private setupVisibilityHandling(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    }, { signal: this.cleanupController.signal });

    // Handle window focus/blur for additional optimization
    window.addEventListener('focus', () => this.resume(), 
      { signal: this.cleanupController.signal });
    window.addEventListener('blur', () => this.pause(), 
      { signal: this.cleanupController.signal });
  }

  private setupPerformanceOptimizations(): void {
    // Cleanup old events periodically
    setInterval(() => {
      this.cleanupOldEvents();
    }, 30000); // Every 30 seconds

    // Memory optimization
    setInterval(() => {
      this.optimizeMemory();
    }, 60000); // Every minute
  }

  private startEventProcessor(): void {
    let isProcessorRunning = false;
    
    const processEvents = () => {
      if (isProcessorRunning) return; // Prevent multiple processors
      
      if (this.isVisible && this.eventQueue.length > 0 && !this.isProcessing) {
        isProcessorRunning = true;
        this.processEventQueue().finally(() => {
          isProcessorRunning = false;
        });
      }
      
      // Use setTimeout instead of requestAnimationFrame to prevent infinite loops
      // Only schedule next check if we have active subscriptions
      if (this.subscriptions.size > 0) {
        setTimeout(processEvents, 16); // ~60fps
      }
    };

    // Start the processor
    setTimeout(processEvents, 16);
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || !this.isVisible) return;

    this.isProcessing = true;
    const startTime = performance.now();

    try {
      // Limit batch size to prevent overwhelming the system
      const maxBatchSize = 10;
      const eventsToProcess = this.eventQueue.splice(0, maxBatchSize);
      
      if (eventsToProcess.length === 0) {
        return;
      }

      // Process events in priority order
      const sortedEvents = eventsToProcess.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Process events with small delays to prevent blocking
      for (let i = 0; i < sortedEvents.length; i++) {
        const event = sortedEvents[i];
        this.processEvent(event);
        
        // Add small delay between events to prevent blocking
        if (i < sortedEvents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      // Update performance stats
      const processingTime = performance.now() - startTime;
      this.stats.eventsProcessed += sortedEvents.length;
      this.stats.totalLatency += processingTime;

      logger.debug(`Processed ${sortedEvents.length} events in ${processingTime.toFixed(2)}ms`);

    } catch (error) {
      logger.error('Error processing event queue', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private processEvent(event: RealTimeEvent): void {
    const relevantSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.eventType === event.type);

    for (const subscription of relevantSubscriptions) {
      // Skip if only visible and tab is hidden
      if (subscription.options.onlyWhenVisible && !this.isVisible) {
        continue;
      }

      if (subscription.options.batchUpdates) {
        this.addToBatch(event, subscription);
      } else if (subscription.options.throttle && subscription.options.throttle > 0) {
        this.throttleCallback(event, subscription);
      } else {
        // Execute immediately
        this.executeCallback(event, subscription);
      }
    }
  }

  private addToBatch(event: RealTimeEvent, subscription: RealTimeSubscription): void {
    if (!this.batchedEvents.has(event.type)) {
      this.batchedEvents.set(event.type, []);
    }

    this.batchedEvents.get(event.type)!.push(event);

    // Clear existing batch timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Set new batch timeout
    this.batchTimeout = setTimeout(() => {
      this.processBatchedEvents();
    }, subscription.options.throttle || 16);
  }

  private processBatchedEvents(): void {
    for (const [eventType, events] of this.batchedEvents.entries()) {
      const relevantSubscriptions = Array.from(this.subscriptions.values())
        .filter(sub => sub.eventType === eventType && sub.options.batchUpdates);

      for (const subscription of relevantSubscriptions) {
        // Execute callback with batched events
        try {
          for (const event of events) {
            subscription.callback(event);
          }
        } catch (error) {
          logger.error('Error executing batched callback', error);
        }
      }
    }

    // Clear batched events
    this.batchedEvents.clear();
    this.batchTimeout = null;
  }

  private throttleCallback(event: RealTimeEvent, subscription: RealTimeSubscription): void {
    const existingTimeout = this.throttledCallbacks.get(subscription.id);
    
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      this.executeCallback(event, subscription);
      this.throttledCallbacks.delete(subscription.id);
    }, subscription.options.throttle);

    this.throttledCallbacks.set(subscription.id, timeout);
  }

  private executeCallback(event: RealTimeEvent, subscription: RealTimeSubscription): void {
    try {
      subscription.callback(event);
    } catch (error) {
      logger.error('Error executing real-time callback', error, {
        eventType: event.type,
        subscriptionId: subscription.id
      });
    }
  }

  private cleanupOldEvents(): void {
    const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
    
    this.eventQueue = this.eventQueue.filter(event => 
      event.timestamp > cutoffTime || event.priority === 'critical'
    );
  }

  private optimizeMemory(): void {
    // Force garbage collection of completed callbacks
    this.throttledCallbacks.forEach((timeout, id) => {
      if (!this.subscriptions.has(id)) {
        clearTimeout(timeout);
        this.throttledCallbacks.delete(id);
      }
    });

    // Clear old batched events
    this.batchedEvents.clear();
  }

  private estimateMemoryUsage(): number {
    const subscriptionSize = this.subscriptions.size * 200; // Rough estimate
    const eventQueueSize = this.eventQueue.length * 150; // Rough estimate
    const throttleSize = this.throttledCallbacks.size * 50; // Rough estimate
    
    return subscriptionSize + eventQueueSize + throttleSize;
  }

  private generateId(): string {
    return `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance for convenience
export const realTimeManager = RealTimeManager.getInstance();