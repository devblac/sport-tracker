/**
 * Enterprise-Grade Feature Flag Manager
 * Dynamic feature toggling with A/B testing capabilities
 * Built for high-performance, real-time feature management
 */

import { analyticsManager } from './AnalyticsManager';
import { logger } from '@/utils';

export type FeatureFlagValue = boolean | string | number | object;

export interface FeatureFlag {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly value: FeatureFlagValue;
  readonly rolloutPercentage: number; // 0-100
  readonly targetAudience?: {
    userIds?: string[];
    userTraits?: Record<string, any>;
    segments?: string[];
  };
  readonly schedule?: {
    startDate?: Date;
    endDate?: Date;
  };
  readonly metadata: {
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly createdBy: string;
    readonly version: number;
  };
}

export interface FeatureFlagConfig {
  readonly apiEndpoint?: string;
  readonly refreshInterval?: number;
  readonly enableLocalStorage?: boolean;
  readonly enableAnalytics?: boolean;
  readonly defaultFlags?: Record<string, FeatureFlagValue>;
}

export interface FeatureFlagStats {
  readonly totalFlags: number;
  readonly enabledFlags: number;
  readonly evaluations: number;
  readonly cacheHits: number;
  readonly lastRefresh: number;
}

/**
 * High-performance Feature Flag Manager with intelligent caching
 */
export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: Map<string, FeatureFlag> = new Map();
  private evaluationCache: Map<string, { value: FeatureFlagValue; timestamp: number }> = new Map();
  private userId: string | null = null;
  private userTraits: Record<string, any> = {};
  
  // Performance tracking
  private stats = {
    totalFlags: 0,
    enabledFlags: 0,
    evaluations: 0,
    cacheHits: 0,
    lastRefresh: 0
  };

  // Configuration
  private config: FeatureFlagConfig = {
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    enableLocalStorage: true,
    enableAnalytics: true,
    defaultFlags: {}
  };

  private constructor() {
    this.initializeDefaultFlags();
    this.loadFromLocalStorage();
    this.startPeriodicRefresh();
    logger.info('FeatureFlagManager initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  /**
   * Initialize with configuration
   */
  public initialize(config: Partial<FeatureFlagConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.defaultFlags) {
      Object.entries(this.config.defaultFlags).forEach(([key, value]) => {
        this.setFlag(key, {
          key,
          name: key,
          description: `Default flag: ${key}`,
          enabled: true,
          value,
          rolloutPercentage: 100,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system',
            version: 1
          }
        });
      });
    }

    logger.info('FeatureFlagManager configured', { config: this.config });
  }

  /**
   * Set user context for personalized flags
   */
  public setUser(userId: string, traits: Record<string, any> = {}): void {
    this.userId = userId;
    this.userTraits = traits;
    
    // Clear evaluation cache when user changes
    this.evaluationCache.clear();
    
    logger.debug('User context set', { userId, traits });
  }

  /**
   * Evaluate feature flag with intelligent caching
   */
  public isEnabled(flagKey: string, defaultValue: boolean = false): boolean {
    const result = this.evaluate(flagKey, defaultValue);
    return Boolean(result);
  }

  /**
   * Get feature flag value with type safety
   */
  public getValue<T extends FeatureFlagValue>(
    flagKey: string, 
    defaultValue: T
  ): T {
    return this.evaluate(flagKey, defaultValue) as T;
  }

  /**
   * Evaluate feature flag with comprehensive logic
   */
  public evaluate<T extends FeatureFlagValue>(
    flagKey: string, 
    defaultValue: T
  ): T {
    this.stats.evaluations++;

    // Check cache first
    const cacheKey = `${flagKey}:${this.userId || 'anonymous'}`;
    const cached = this.evaluationCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < 60000) { // 1 minute cache
      this.stats.cacheHits++;
      return cached.value as T;
    }

    // Get flag definition
    const flag = this.flags.get(flagKey);
    if (!flag) {
      logger.debug('Flag not found, using default', { flagKey, defaultValue });
      return defaultValue;
    }

    // Evaluate flag
    const result = this.evaluateFlag(flag, defaultValue);
    
    // Cache result
    this.evaluationCache.set(cacheKey, {
      value: result,
      timestamp: Date.now()
    });

    // Track analytics
    if (this.config.enableAnalytics) {
      analyticsManager.trackFeature('feature_flag', 'evaluated', {
        flag_key: flagKey,
        flag_value: result,
        user_id: this.userId,
        rollout_percentage: flag.rolloutPercentage
      });
    }

    logger.debug('Flag evaluated', { flagKey, result, flag });
    return result;
  }

  /**
   * Set or update a feature flag
   */
  public setFlag(flagKey: string, flag: Omit<FeatureFlag, 'key'>): void {
    const fullFlag: FeatureFlag = {
      key: flagKey,
      ...flag
    };

    this.flags.set(flagKey, fullFlag);
    this.updateStats();
    
    // Clear related cache entries
    this.clearCacheForFlag(flagKey);
    
    // Save to localStorage
    if (this.config.enableLocalStorage) {
      this.saveToLocalStorage();
    }

    logger.debug('Flag set', { flagKey, flag: fullFlag });
  }

  /**
   * Remove a feature flag
   */
  public removeFlag(flagKey: string): void {
    this.flags.delete(flagKey);
    this.clearCacheForFlag(flagKey);
    this.updateStats();
    
    if (this.config.enableLocalStorage) {
      this.saveToLocalStorage();
    }

    logger.debug('Flag removed', { flagKey });
  }

  /**
   * Get all feature flags
   */
  public getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get feature flag statistics
   */
  public getStats(): FeatureFlagStats {
    return {
      totalFlags: this.stats.totalFlags,
      enabledFlags: this.stats.enabledFlags,
      evaluations: this.stats.evaluations,
      cacheHits: this.stats.cacheHits,
      lastRefresh: this.stats.lastRefresh
    };
  }

  /**
   * Refresh flags from remote source
   */
  public async refresh(): Promise<void> {
    try {
      if (this.config.apiEndpoint) {
        // In a real implementation, this would fetch from your feature flag service
        // For now, we'll simulate with local data
        logger.debug('Refreshing flags from remote source');
      }

      this.stats.lastRefresh = Date.now();
      this.evaluationCache.clear(); // Clear cache after refresh
      
      logger.info('Feature flags refreshed');
    } catch (error) {
      logger.error('Failed to refresh feature flags', error);
    }
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.evaluationCache.clear();
    logger.debug('Feature flag cache cleared');
  }

  // Private helper methods

  private evaluateFlag<T extends FeatureFlagValue>(
    flag: FeatureFlag, 
    defaultValue: T
  ): T {
    // Check if flag is globally disabled
    if (!flag.enabled) {
      return defaultValue;
    }

    // Check schedule constraints
    if (flag.schedule) {
      const now = new Date();
      if (flag.schedule.startDate && now < flag.schedule.startDate) {
        return defaultValue;
      }
      if (flag.schedule.endDate && now > flag.schedule.endDate) {
        return defaultValue;
      }
    }

    // Check target audience
    if (flag.targetAudience) {
      if (!this.matchesTargetAudience(flag.targetAudience)) {
        return defaultValue;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const userHash = this.getUserHash(flag.key);
      if (userHash > flag.rolloutPercentage) {
        return defaultValue;
      }
    }

    // Return flag value
    return flag.value as T;
  }

  private matchesTargetAudience(audience: NonNullable<FeatureFlag['targetAudience']>): boolean {
    // Check user ID targeting
    if (audience.userIds && this.userId) {
      if (audience.userIds.includes(this.userId)) {
        return true;
      }
    }

    // Check user traits targeting
    if (audience.userTraits) {
      const matches = Object.entries(audience.userTraits).every(([key, value]) => {
        return this.userTraits[key] === value;
      });
      if (matches) {
        return true;
      }
    }

    // Check segment targeting
    if (audience.segments) {
      // In a real implementation, this would check user segments
      // For now, we'll assume no segment matching
      return false;
    }

    return false;
  }

  private getUserHash(flagKey: string): number {
    const input = `${this.userId || 'anonymous'}:${flagKey}`;
    let hash = 0;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash) % 100;
  }

  private clearCacheForFlag(flagKey: string): void {
    const keysToDelete: string[] = [];
    
    for (const cacheKey of this.evaluationCache.keys()) {
      if (cacheKey.startsWith(`${flagKey}:`)) {
        keysToDelete.push(cacheKey);
      }
    }
    
    keysToDelete.forEach(key => this.evaluationCache.delete(key));
  }

  private updateStats(): void {
    this.stats.totalFlags = this.flags.size;
    this.stats.enabledFlags = Array.from(this.flags.values())
      .filter(flag => flag.enabled).length;
  }

  private initializeDefaultFlags(): void {
    // Initialize with some common feature flags
    const defaultFlags: Record<string, FeatureFlagValue> = {
      'new_workout_ui': false,
      'ai_recommendations_v2': false,
      'social_features': true,
      'premium_content': false,
      'dark_mode_default': false,
      'analytics_enabled': true,
      'cache_monitoring': true,
      'real_time_features': true
    };

    Object.entries(defaultFlags).forEach(([key, value]) => {
      this.setFlag(key, {
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Default system flag: ${key}`,
        enabled: true,
        value,
        rolloutPercentage: 100,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          version: 1
        }
      });
    });
  }

  private loadFromLocalStorage(): void {
    if (!this.config.enableLocalStorage) return;

    try {
      const stored = localStorage.getItem('feature_flags');
      if (stored) {
        const flags = JSON.parse(stored);
        Object.entries(flags).forEach(([key, flag]: [string, any]) => {
          this.flags.set(key, {
            ...flag,
            metadata: {
              ...flag.metadata,
              createdAt: new Date(flag.metadata.createdAt),
              updatedAt: new Date(flag.metadata.updatedAt)
            }
          });
        });
        
        this.updateStats();
        logger.debug('Feature flags loaded from localStorage');
      }
    } catch (error) {
      logger.error('Failed to load feature flags from localStorage', error);
    }
  }

  private saveToLocalStorage(): void {
    if (!this.config.enableLocalStorage) return;

    try {
      const flagsObject = Object.fromEntries(this.flags.entries());
      localStorage.setItem('feature_flags', JSON.stringify(flagsObject));
    } catch (error) {
      logger.error('Failed to save feature flags to localStorage', error);
    }
  }

  private startPeriodicRefresh(): void {
    if (this.config.refreshInterval && this.config.refreshInterval > 0) {
      setInterval(() => {
        this.refresh();
      }, this.config.refreshInterval);
    }
  }
}

// Export singleton instance
export const featureFlagManager = FeatureFlagManager.getInstance();