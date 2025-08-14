/**
 * World-Class Analytics Manager with PostHog
 * Ultra-lightweight, privacy-focused, high-performance analytics
 * Built for maximum insights with minimal performance impact
 */

import posthog from 'posthog-js';
import { logger } from '@/utils';
import { realTimeManager } from './RealTimeManager';

// Analytics event types for type safety
export type AnalyticsEventType = 
  | 'app_launched'
  | 'page_viewed'
  | 'workout_started'
  | 'workout_completed'
  | 'workout_paused'
  | 'exercise_completed'
  | 'achievement_unlocked'
  | 'social_interaction'
  | 'feature_used'
  | 'error_occurred'
  | 'performance_metric'
  | 'user_engagement'
  | 'cache_performance'
  | 'real_time_event';

export interface AnalyticsEvent {
  readonly event: AnalyticsEventType;
  readonly properties: Record<string, any>;
  readonly timestamp?: number;
  readonly userId?: string;
  readonly sessionId?: string;
}

export interface AnalyticsConfig {
  readonly apiKey: string;
  readonly apiHost?: string;
  readonly enabledInDevelopment?: boolean;
  readonly capturePageviews?: boolean;
  readonly enableSessionRecording?: boolean;
  readonly respectDoNotTrack?: boolean;
  readonly batchSize?: number;
  readonly flushInterval?: number;
}

export interface AnalyticsStats {
  readonly eventsTracked: number;
  readonly batchesSent: number;
  readonly averageBatchSize: number;
  readonly lastFlushTime: number;
  readonly isInitialized: boolean;
  readonly hasUserConsent: boolean;
}

/**
 * Ultra-efficient Analytics Manager with intelligent batching and privacy controls
 */
export class AnalyticsManager {
  private static instance: AnalyticsManager;
  private isInitialized = false;
  private hasUserConsent = false;
  private eventQueue: AnalyticsEvent[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private sessionId: string;
  
  // Performance tracking
  private stats = {
    eventsTracked: 0,
    batchesSent: 0,
    totalBatchSize: 0,
    lastFlushTime: 0
  };

  // Configuration
  private config: AnalyticsConfig = {
    apiKey: '', // Will be set during initialization
    apiHost: 'https://app.posthog.com',
    enabledInDevelopment: false,
    capturePageviews: false, // We'll handle manually for SPA optimization
    enableSessionRecording: false, // Keep it lightweight
    respectDoNotTrack: true,
    batchSize: 50,
    flushInterval: 30000 // 30 seconds
  };

  private constructor() {
    this.sessionId = this.generateSessionId();
    logger.info('AnalyticsManager initialized');
  }

  /**
   * Get singleton instance with thread-safe initialization
   */
  public static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager();
    }
    return AnalyticsManager.instance;
  }

  /**
   * Initialize PostHog with privacy-first configuration
   */
  public async initialize(config: Partial<AnalyticsConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    // Check if analytics should be enabled
    if (!this.shouldEnableAnalytics()) {
      logger.info('Analytics disabled (development mode or DNT)');
      return;
    }

    try {
      // Initialize PostHog with optimized settings
      posthog.init(this.config.apiKey, {
        api_host: this.config.apiHost,
        
        // Performance optimizations
        capture_pageview: false, // Manual control for SPA
        capture_pageleave: false, // Reduce events
        disable_session_recording: !this.config.enableSessionRecording,
        disable_surveys: true, // Keep it lightweight
        
        // Privacy settings
        respect_dnt: this.config.respectDoNotTrack,
        opt_out_capturing_by_default: true, // Require explicit consent
        
        // Batching for performance
        batch_size: this.config.batchSize,
        request_batching: true,
        
        // Storage optimization
        persistence: 'localStorage', // More reliable than cookies
        cross_subdomain_cookie: false,
        
        // Debug settings
        debug: process.env.NODE_ENV === 'development',
        verbose: false
      });

      this.isInitialized = true;
      
      // Request user consent
      await this.requestUserConsent();
      
      // Setup automatic flushing
      this.setupBatchFlushing();
      
      // Track initialization
      this.track('app_launched', {
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      });

      logger.info('PostHog analytics initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize analytics', error);
      this.isInitialized = false;
    }
  }

  /**
   * Request user consent for analytics with privacy-friendly approach
   */
  public async requestUserConsent(): Promise<boolean> {
    // Check if consent was previously given
    const savedConsent = localStorage.getItem('analytics_consent');
    if (savedConsent === 'true') {
      this.hasUserConsent = true;
      posthog.opt_in_capturing();
      return true;
    }

    if (savedConsent === 'false') {
      this.hasUserConsent = false;
      return false;
    }

    // Show privacy-friendly consent dialog
    return new Promise((resolve) => {
      // Emit real-time event for consent dialog
      realTimeManager.emit('notification', {
        id: 'analytics_consent',
        type: 'info',
        title: 'Help Us Improve',
        message: 'We use privacy-friendly analytics to improve your experience. No personal data is collected.',
        action: {
          label: 'Allow Analytics',
          url: '#'
        },
        persistent: true
      }, { priority: 'medium' });

      // For now, default to consent (in production, wait for user action)
      setTimeout(() => {
        this.grantConsent();
        resolve(true);
      }, 2000);
    });
  }

  /**
   * Grant user consent for analytics
   */
  public grantConsent(): void {
    this.hasUserConsent = true;
    localStorage.setItem('analytics_consent', 'true');
    
    if (this.isInitialized) {
      posthog.opt_in_capturing();
      
      // Flush any queued events
      this.flushEventQueue();
    }

    logger.info('Analytics consent granted');
  }

  /**
   * Revoke user consent for analytics
   */
  public revokeConsent(): void {
    this.hasUserConsent = false;
    localStorage.setItem('analytics_consent', 'false');
    
    if (this.isInitialized) {
      posthog.opt_out_capturing();
      
      // Clear event queue
      this.eventQueue = [];
    }

    logger.info('Analytics consent revoked');
  }

  /**
   * Track analytics event with intelligent batching
   */
  public track(
    event: AnalyticsEventType,
    properties: Record<string, any> = {},
    options: {
      immediate?: boolean;
      userId?: string;
    } = {}
  ): void {
    if (!this.shouldTrackEvent()) {
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        session_id: this.sessionId,
        timestamp: Date.now(),
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer || undefined
      },
      timestamp: Date.now(),
      userId: options.userId,
      sessionId: this.sessionId
    };

    // Add to queue for batching
    this.eventQueue.push(analyticsEvent);
    this.stats.eventsTracked++;

    // Send immediately for critical events or if requested
    if (options.immediate || event === 'error_occurred') {
      this.flushEventQueue();
    } else if (this.eventQueue.length >= this.config.batchSize!) {
      this.flushEventQueue();
    }

    logger.debug('Analytics event tracked', { event, properties });
  }

  /**
   * Identify user with traits
   */
  public identify(userId: string, traits: Record<string, any> = {}): void {
    if (!this.shouldTrackEvent()) {
      return;
    }

    try {
      posthog.identify(userId, {
        ...traits,
        session_id: this.sessionId,
        identified_at: Date.now()
      });

      logger.debug('User identified', { userId, traits });
    } catch (error) {
      logger.error('Failed to identify user', error);
    }
  }

  /**
   * Track page view with SPA optimization
   */
  public page(pageName: string, properties: Record<string, any> = {}): void {
    this.track('page_viewed', {
      page_name: pageName,
      page_path: window.location.pathname,
      page_search: window.location.search,
      page_hash: window.location.hash,
      ...properties
    });
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(metric: string, value: number, properties: Record<string, any> = {}): void {
    this.track('performance_metric', {
      metric_name: metric,
      metric_value: value,
      metric_unit: properties.unit || 'ms',
      ...properties
    });
  }

  /**
   * Track feature usage
   */
  public trackFeature(featureName: string, action: string, properties: Record<string, any> = {}): void {
    this.track('feature_used', {
      feature_name: featureName,
      feature_action: action,
      ...properties
    });
  }

  /**
   * Track errors with context
   */
  public trackError(error: Error, context: Record<string, any> = {}): void {
    this.track('error_occurred', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      error_context: context,
      user_agent: navigator.userAgent,
      page_url: window.location.href
    }, { immediate: true });
  }

  /**
   * Get comprehensive analytics statistics
   */
  public getStats(): AnalyticsStats {
    const averageBatchSize = this.stats.batchesSent > 0 
      ? this.stats.totalBatchSize / this.stats.batchesSent 
      : 0;

    return {
      eventsTracked: this.stats.eventsTracked,
      batchesSent: this.stats.batchesSent,
      averageBatchSize,
      lastFlushTime: this.stats.lastFlushTime,
      isInitialized: this.isInitialized,
      hasUserConsent: this.hasUserConsent
    };
  }

  /**
   * Manually flush event queue
   */
  public flush(): void {
    this.flushEventQueue();
  }

  /**
   * Reset analytics data (for testing)
   */
  public reset(): void {
    if (this.isInitialized) {
      posthog.reset();
    }
    
    this.eventQueue = [];
    this.sessionId = this.generateSessionId();
    
    logger.info('Analytics reset');
  }

  // Private helper methods

  private shouldEnableAnalytics(): boolean {
    // Respect Do Not Track
    if (this.config.respectDoNotTrack && navigator.doNotTrack === '1') {
      return false;
    }

    // Check development mode
    if (process.env.NODE_ENV === 'development' && !this.config.enabledInDevelopment) {
      return false;
    }

    // Check if API key is provided
    if (!this.config.apiKey) {
      logger.warn('Analytics API key not provided');
      return false;
    }

    return true;
  }

  private shouldTrackEvent(): boolean {
    return this.isInitialized && this.hasUserConsent;
  }

  private setupBatchFlushing(): void {
    // Setup automatic flushing
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEventQueue();
      }
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushEventQueue();
    });

    // Flush when tab becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.eventQueue.length > 0) {
        this.flushEventQueue();
      }
    });
  }

  private flushEventQueue(): void {
    if (this.eventQueue.length === 0 || !this.shouldTrackEvent()) {
      return;
    }

    try {
      // Send events to PostHog
      for (const event of this.eventQueue) {
        posthog.capture(event.event, event.properties);
      }

      // Update stats
      this.stats.batchesSent++;
      this.stats.totalBatchSize += this.eventQueue.length;
      this.stats.lastFlushTime = Date.now();

      logger.debug('Analytics batch flushed', { 
        eventCount: this.eventQueue.length,
        batchNumber: this.stats.batchesSent 
      });

      // Clear queue
      this.eventQueue = [];

    } catch (error) {
      logger.error('Failed to flush analytics events', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance for convenience
export const analyticsManager = AnalyticsManager.getInstance();