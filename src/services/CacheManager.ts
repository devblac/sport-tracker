import { dbManager } from '@/db/IndexedDBManager';
import { logger } from '@/utils';

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStrategy {
  name: string;
  ttl: number;
  maxSize: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'priority';
  prefetchTrigger?: (key: string) => string[];
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  cacheSize: number;
  memoryUsage: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private strategies: Map<string, CacheStrategy> = new Map();
  private stats: CacheStats = {
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0,
    cacheSize: 0,
    memoryUsage: 0
  };

  private constructor() {
    this.initializeStrategies();
    this.startCleanupInterval();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private initializeStrategies() {
    // Exercise data - rarely changes, high priority
    this.strategies.set('exercises', {
      name: 'exercises',
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 1000,
      evictionPolicy: 'lru',
      prefetchTrigger: (key) => {
        // Prefetch related exercises when one is accessed
        const exerciseId = key.split(':')[1];
        return [`exercise_details:${exerciseId}`, `exercise_history:${exerciseId}`];
      }
    });

    // Workout data - medium priority, moderate TTL
    this.strategies.set('workouts', {
      name: 'workouts',
      ttl: 2 * 60 * 60 * 1000, // 2 hours
      maxSize: 500,
      evictionPolicy: 'lru'
    });

    // AI recommendations - high priority, short TTL
    this.strategies.set('recommendations', {
      name: 'recommendations',
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 200,
      evictionPolicy: 'ttl',
      prefetchTrigger: (key) => {
        // Prefetch related recommendations
        const parts = key.split(':');
        if (parts[0] === 'weight_rec') {
          const exerciseId = parts[1];
          return [
            `plateau_detection:${exerciseId}`,
            `exercise_recommendations:${parts[2]}` // userId
          ];
        }
        return [];
      }
    });

    // User data - critical priority, long TTL
    this.strategies.set('users', {
      name: 'users',
      ttl: 60 * 60 * 1000, // 1 hour
      maxSize: 100,
      evictionPolicy: 'priority'
    });

    // Templates - medium priority, long TTL
    this.strategies.set('templates', {
      name: 'templates',
      ttl: 12 * 60 * 60 * 1000, // 12 hours
      maxSize: 300,
      evictionPolicy: 'lfu'
    });

    // Analytics data - low priority, short TTL
    this.strategies.set('analytics', {
      name: 'analytics',
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 50,
      evictionPolicy: 'ttl'
    });
  }

  /**
   * Get data from cache with automatic strategy selection
   */
  async get<T>(key: string, strategyName?: string): Promise<T | null> {
    this.stats.totalRequests++;

    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isEntryValid(memoryEntry)) {
      this.updateAccessStats(memoryEntry);
      this.stats.totalHits++;
      this.updateHitRate();
      
      // Trigger prefetching if strategy supports it
      this.triggerPrefetch(key, strategyName);
      
      logger.debug('Cache hit (memory)', { key, strategy: strategyName });
      return memoryEntry.data;
    }

    // Try persistent cache
    try {
      await dbManager.init();
      const persistentEntry = await dbManager.get<CacheEntry<T>>('cache', key);
      
      if (persistentEntry && this.isEntryValid(persistentEntry)) {
        // Move to memory cache for faster access
        this.memoryCache.set(key, persistentEntry);
        this.updateAccessStats(persistentEntry);
        this.stats.totalHits++;
        this.updateHitRate();
        
        // Trigger prefetching
        this.triggerPrefetch(key, strategyName);
        
        logger.debug('Cache hit (persistent)', { key, strategy: strategyName });
        return persistentEntry.data;
      }
    } catch (error) {
      logger.error('Error reading from persistent cache', error);
    }

    // Cache miss
    this.stats.totalMisses++;
    this.updateHitRate();
    logger.debug('Cache miss', { key, strategy: strategyName });
    return null;
  }

  /**
   * Set data in cache with automatic strategy application
   */
  async set<T>(
    key: string, 
    data: T, 
    strategyName?: string, 
    options?: {
      ttl?: number;
      priority?: CacheEntry['priority'];
      tags?: string[];
    }
  ): Promise<void> {
    const strategy = strategyName ? this.strategies.get(strategyName) : this.inferStrategy(key);
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      ttl: options?.ttl || strategy?.ttl || 60 * 60 * 1000, // Default 1 hour
      tags: options?.tags || [],
      priority: options?.priority || 'medium',
      accessCount: 1,
      lastAccessed: now
    };

    // Add to memory cache
    this.memoryCache.set(key, entry);

    // Add to persistent cache
    try {
      await dbManager.init();
      await dbManager.put('cache', { ...entry, id: key });
    } catch (error) {
      logger.error('Error writing to persistent cache', error);
    }

    // Apply eviction policy if needed
    if (strategy) {
      await this.applyEvictionPolicy(strategy);
    }

    this.updateCacheStats();
    logger.debug('Cache set', { key, strategy: strategyName, ttl: entry.ttl });
  }

  /**
   * Invalidate cache entries by key or tags
   */
  async invalidate(keyOrTag: string, byTag: boolean = false): Promise<void> {
    if (byTag) {
      // Invalidate by tag
      const keysToRemove: string[] = [];
      
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.tags.includes(keyOrTag)) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        this.memoryCache.delete(key);
        try {
          await dbManager.init();
          await dbManager.delete('cache', key);
        } catch (error) {
          logger.error('Error deleting from persistent cache', error);
        }
      }

      logger.debug('Cache invalidated by tag', { tag: keyOrTag, count: keysToRemove.length });
    } else {
      // Invalidate by key
      this.memoryCache.delete(keyOrTag);
      try {
        await dbManager.init();
        await dbManager.delete('cache', keyOrTag);
      } catch (error) {
        logger.error('Error deleting from persistent cache', error);
      }

      logger.debug('Cache invalidated by key', { key: keyOrTag });
    }

    this.updateCacheStats();
  }

  /**
   * Prefetch data based on usage patterns
   */
  async prefetch(keys: string[], strategyName?: string): Promise<void> {
    const prefetchPromises = keys.map(async (key) => {
      // Only prefetch if not already cached
      const cached = await this.get(key, strategyName);
      if (!cached) {
        // This would trigger the actual data fetching
        // The calling service should handle the actual data loading
        logger.debug('Prefetch triggered', { key, strategy: strategyName });
      }
    });

    await Promise.allSettled(prefetchPromises);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      await dbManager.init();
      await dbManager.clear('cache');
    } catch (error) {
      logger.error('Error clearing persistent cache', error);
    }

    this.resetStats();
    logger.info('Cache cleared');
  }

  /**
   * Optimize cache by removing expired entries and applying eviction policies
   */
  async optimize(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isEntryValid(entry)) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      await this.invalidate(key);
    }

    // Apply eviction policies for each strategy
    for (const strategy of this.strategies.values()) {
      await this.applyEvictionPolicy(strategy);
    }

    this.updateCacheStats();
    logger.info('Cache optimized', { 
      expiredRemoved: expiredKeys.length,
      currentSize: this.memoryCache.size 
    });
  }

  // Private helper methods

  private isEntryValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  private updateAccessStats(entry: CacheEntry): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? this.stats.totalHits / this.stats.totalRequests 
      : 0;
    this.stats.missRate = 1 - this.stats.hitRate;
  }

  private updateCacheStats(): void {
    this.stats.cacheSize = this.memoryCache.size;
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.memoryCache.values()) {
      // Rough estimation of memory usage
      totalSize += JSON.stringify(entry).length * 2; // UTF-16 characters
    }
    return totalSize;
  }

  private inferStrategy(key: string): CacheStrategy | undefined {
    const keyParts = key.split(':');
    const prefix = keyParts[0];

    // Map key prefixes to strategies
    const strategyMap: Record<string, string> = {
      'exercise': 'exercises',
      'workout': 'workouts',
      'weight_rec': 'recommendations',
      'plateau_detection': 'recommendations',
      'exercise_recommendations': 'recommendations',
      'user': 'users',
      'template': 'templates',
      'analytics': 'analytics'
    };

    const strategyName = strategyMap[prefix];
    return strategyName ? this.strategies.get(strategyName) : undefined;
  }

  private async triggerPrefetch(key: string, strategyName?: string): Promise<void> {
    const strategy = strategyName ? this.strategies.get(strategyName) : this.inferStrategy(key);
    
    if (strategy?.prefetchTrigger) {
      const prefetchKeys = strategy.prefetchTrigger(key);
      if (prefetchKeys.length > 0) {
        // Don't await - prefetch in background
        this.prefetch(prefetchKeys, strategyName).catch(error => {
          logger.error('Prefetch failed', error);
        });
      }
    }
  }

  private async applyEvictionPolicy(strategy: CacheStrategy): Promise<void> {
    const strategyEntries = Array.from(this.memoryCache.entries())
      .filter(([key]) => this.inferStrategy(key)?.name === strategy.name)
      .map(([key, entry]) => ({ key, entry }));

    if (strategyEntries.length <= strategy.maxSize) {
      return; // No eviction needed
    }

    const toEvict = strategyEntries.length - strategy.maxSize;
    let entriesToRemove: string[] = [];

    switch (strategy.evictionPolicy) {
      case 'lru':
        entriesToRemove = strategyEntries
          .sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed)
          .slice(0, toEvict)
          .map(item => item.key);
        break;

      case 'lfu':
        entriesToRemove = strategyEntries
          .sort((a, b) => a.entry.accessCount - b.entry.accessCount)
          .slice(0, toEvict)
          .map(item => item.key);
        break;

      case 'ttl':
        entriesToRemove = strategyEntries
          .sort((a, b) => (a.entry.timestamp + a.entry.ttl) - (b.entry.timestamp + b.entry.ttl))
          .slice(0, toEvict)
          .map(item => item.key);
        break;

      case 'priority':
        const priorityOrder = { 'low': 0, 'medium': 1, 'high': 2, 'critical': 3 };
        entriesToRemove = strategyEntries
          .sort((a, b) => priorityOrder[a.entry.priority] - priorityOrder[b.entry.priority])
          .slice(0, toEvict)
          .map(item => item.key);
        break;
    }

    // Remove selected entries
    for (const key of entriesToRemove) {
      await this.invalidate(key);
    }

    logger.debug('Eviction applied', { 
      strategy: strategy.name, 
      policy: strategy.evictionPolicy, 
      removed: entriesToRemove.length 
    });
  }

  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.optimize().catch(error => {
        logger.error('Cache cleanup failed', error);
      });
    }, 5 * 60 * 1000);
  }

  private resetStats(): void {
    this.stats = {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      cacheSize: 0,
      memoryUsage: 0
    };
  }
}