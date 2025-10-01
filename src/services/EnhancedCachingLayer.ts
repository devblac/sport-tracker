/**
 * Enhanced Caching Layer
 * 
 * Multi-level caching system optimized for Supabase free tier with intelligent
 * cache invalidation, performance metrics, and service worker integration.
 */

import { logger } from '@/utils/logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  ttl: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  accessCount: number;
  lastAccessed: Date;
  size: number;
  version: number;
  dependencies: string[];
}

interface CacheLevel {
  name: string;
  storage: CacheStorage;
  maxSize: number;
  defaultTTL: number;
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'priority';
}

interface CacheMetrics {
  level: string;
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
  averageAccessTime: number;
  evictionCount: number;
  lastOptimization: Date;
}

interface CacheInvalidationRule {
  pattern: RegExp;
  dependencies: string[];
  cascadeInvalidation: boolean;
  maxAge?: number;
}

interface CacheConfiguration {
  memoryMaxSize: number;
  localStorageMaxSize: number;
  serviceWorkerMaxSize: number;
  defaultTTL: number;
  enableServiceWorker: boolean;
  enableLocalStorage: boolean;
  enableIntelligentPrefetch: boolean;
  optimizationInterval: number;
}

interface CachePerformanceReport {
  overallHitRate: number;
  levelMetrics: CacheMetrics[];
  topKeys: Array<{ key: string; hitCount: number; size: number }>;
  slowestKeys: Array<{ key: string; averageTime: number }>;
  recommendations: string[];
  memoryUsage: {
    total: number;
    byLevel: Record<string, number>;
    percentage: number;
  };
}

// ============================================================================
// Cache Storage Implementations
// ============================================================================

abstract class CacheStorage {
  abstract get<T>(key: string): Promise<CacheEntry<T> | null>;
  abstract set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract clear(): Promise<void>;
  abstract keys(): Promise<string[]>;
  abstract size(): Promise<number>;
}

class MemoryCacheStorage extends CacheStorage {
  private cache = new Map<string, CacheEntry>();

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    return this.cache.get(key) as CacheEntry<T> || null;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async size(): Promise<number> {
    return this.cache.size;
  }
}

class LocalStorageCacheStorage extends CacheStorage {
  private prefix = 'enhanced_cache_';

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logger.error('LocalStorage cache get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (error) {
      logger.error('LocalStorage cache set error', { key, error });
      // Handle quota exceeded error
      if (error instanceof DOMException && error.code === 22) {
        await this.cleanup();
        try {
          localStorage.setItem(this.prefix + key, JSON.stringify(entry));
        } catch (retryError) {
          logger.error('LocalStorage cache set retry failed', { key, error: retryError });
        }
      }
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    keys.forEach(key => localStorage.removeItem(this.prefix + key));
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }

  private async cleanup(): Promise<void> {
    const keys = await this.keys();
    const entries: Array<{ key: string; entry: CacheEntry }> = [];

    for (const key of keys) {
      const entry = await this.get(key);
      if (entry) {
        entries.push({ key, entry });
      }
    }

    // Remove expired entries first
    const now = Date.now();
    const expiredKeys = entries
      .filter(({ entry }) => now - entry.timestamp.getTime() > entry.ttl)
      .map(({ key }) => key);

    for (const key of expiredKeys) {
      await this.delete(key);
    }

    // If still need space, remove LRU entries
    if (expiredKeys.length === 0) {
      const sortedEntries = entries
        .sort((a, b) => a.entry.lastAccessed.getTime() - b.entry.lastAccessed.getTime())
        .slice(0, Math.floor(entries.length * 0.2)); // Remove 20% of entries

      for (const { key } of sortedEntries) {
        await this.delete(key);
      }
    }
  }
}

class ServiceWorkerCacheStorage extends CacheStorage {
  private cacheName = 'enhanced-cache-v1';

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    if (!('caches' in window)) return null;

    try {
      const cache = await caches.open(this.cacheName);
      const response = await cache.match(key);
      
      if (response) {
        const entry = await response.json();
        return entry as CacheEntry<T>;
      }
      return null;
    } catch (error) {
      logger.error('ServiceWorker cache get error', { key, error });
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(this.cacheName);
      const response = new Response(JSON.stringify(entry), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(key, response);
    } catch (error) {
      logger.error('ServiceWorker cache set error', { key, error });
    }
  }

  async delete(key: string): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(this.cacheName);
      await cache.delete(key);
    } catch (error) {
      logger.error('ServiceWorker cache delete error', { key, error });
    }
  }

  async clear(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      await caches.delete(this.cacheName);
    } catch (error) {
      logger.error('ServiceWorker cache clear error', { error });
    }
  }

  async keys(): Promise<string[]> {
    if (!('caches' in window)) return [];

    try {
      const cache = await caches.open(this.cacheName);
      const requests = await cache.keys();
      return requests.map(request => request.url);
    } catch (error) {
      logger.error('ServiceWorker cache keys error', { error });
      return [];
    }
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }
}

// ============================================================================
// Enhanced Caching Layer
// ============================================================================

export class EnhancedCachingLayer {
  private static instance: EnhancedCachingLayer;
  private config: CacheConfiguration;
  private levels: CacheLevel[];
  private metrics: Map<string, CacheMetrics> = new Map();
  private invalidationRules: CacheInvalidationRule[] = [];
  private optimizationTimer?: NodeJS.Timeout;

  private constructor(config?: Partial<CacheConfiguration>) {
    this.config = {
      memoryMaxSize: 50 * 1024 * 1024, // 50MB
      localStorageMaxSize: 10 * 1024 * 1024, // 10MB
      serviceWorkerMaxSize: 100 * 1024 * 1024, // 100MB
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      enableServiceWorker: true,
      enableLocalStorage: true,
      enableIntelligentPrefetch: true,
      optimizationInterval: 5 * 60 * 1000, // 5 minutes
      ...config
    };

    this.initializeLevels();
    this.initializeInvalidationRules();
    this.startOptimization();
  }

  public static getInstance(config?: Partial<CacheConfiguration>): EnhancedCachingLayer {
    if (!EnhancedCachingLayer.instance) {
      EnhancedCachingLayer.instance = new EnhancedCachingLayer(config);
    }
    return EnhancedCachingLayer.instance;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get data from cache with multi-level fallback
   */
  async get<T>(key: string, options: {
    skipLevels?: string[];
    updateAccessStats?: boolean;
  } = {}): Promise<T | null> {
    const startTime = Date.now();
    
    for (const level of this.levels) {
      if (options.skipLevels?.includes(level.name)) {
        continue;
      }

      try {
        const entry = await level.storage.get<T>(key);
        
        if (entry && this.isEntryValid(entry)) {
          // Update access statistics
          if (options.updateAccessStats !== false) {
            entry.accessCount++;
            entry.lastAccessed = new Date();
            await level.storage.set(key, entry);
          }

          // Update metrics
          this.updateHitMetrics(level.name, Date.now() - startTime);

          // Promote to higher levels if beneficial
          await this.promoteEntry(key, entry, level.name);

          logger.debug('Cache hit', { key, level: level.name, accessCount: entry.accessCount });
          return entry.data;
        }
      } catch (error) {
        logger.error('Cache get error', { key, level: level.name, error });
      }
    }

    // Cache miss
    this.updateMissMetrics();
    logger.debug('Cache miss', { key });
    return null;
  }

  /**
   * Set data in cache with intelligent level selection
   */
  async set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      priority?: CacheEntry['priority'];
      tags?: string[];
      dependencies?: string[];
      targetLevels?: string[];
    } = {}
  ): Promise<void> {
    const now = new Date();
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      ttl: options.ttl || this.config.defaultTTL,
      tags: options.tags || [],
      priority: options.priority || 'medium',
      accessCount: 1,
      lastAccessed: now,
      size: this.estimateSize(data),
      version: 1,
      dependencies: options.dependencies || []
    };

    const targetLevels = options.targetLevels || this.selectOptimalLevels(entry);

    for (const levelName of targetLevels) {
      const level = this.levels.find(l => l.name === levelName);
      if (level) {
        try {
          await level.storage.set(key, entry);
          logger.debug('Cache set', { key, level: levelName, size: entry.size });
        } catch (error) {
          logger.error('Cache set error', { key, level: levelName, error });
        }
      }
    }

    // Trigger eviction if needed
    await this.enforceCapacityLimits();
  }

  /**
   * Invalidate cache entries with intelligent dependency resolution
   */
  async invalidate(
    keyOrPattern: string | RegExp,
    options: {
      byTags?: string[];
      cascadeInvalidation?: boolean;
      targetLevels?: string[];
    } = {}
  ): Promise<void> {
    const targetLevels = options.targetLevels || this.levels.map(l => l.name);
    const keysToInvalidate = new Set<string>();

    // Find keys to invalidate
    for (const levelName of targetLevels) {
      const level = this.levels.find(l => l.name === levelName);
      if (!level) continue;

      try {
        const allKeys = await level.storage.keys();
        
        for (const key of allKeys) {
          let shouldInvalidate = false;

          // Check key pattern match
          if (keyOrPattern instanceof RegExp) {
            shouldInvalidate = keyOrPattern.test(key);
          } else if (typeof keyOrPattern === 'string') {
            shouldInvalidate = key === keyOrPattern;
          }

          // Check tag match
          if (!shouldInvalidate && options.byTags) {
            const entry = await level.storage.get(key);
            if (entry && entry.tags.some(tag => options.byTags!.includes(tag))) {
              shouldInvalidate = true;
            }
          }

          if (shouldInvalidate) {
            keysToInvalidate.add(key);
          }
        }
      } catch (error) {
        logger.error('Cache invalidation error', { level: levelName, error });
      }
    }

    // Handle cascade invalidation
    if (options.cascadeInvalidation) {
      const dependentKeys = await this.findDependentKeys(Array.from(keysToInvalidate));
      dependentKeys.forEach(key => keysToInvalidate.add(key));
    }

    // Perform invalidation
    for (const key of keysToInvalidate) {
      for (const levelName of targetLevels) {
        const level = this.levels.find(l => l.name === levelName);
        if (level) {
          try {
            await level.storage.delete(key);
          } catch (error) {
            logger.error('Cache delete error', { key, level: levelName, error });
          }
        }
      }
    }

    logger.info('Cache invalidated', { 
      pattern: keyOrPattern.toString(), 
      keysCount: keysToInvalidate.size,
      cascade: options.cascadeInvalidation 
    });
  }

  /**
   * Prefetch data based on usage patterns
   */
  async prefetch(
    keys: string[],
    dataLoader: (key: string) => Promise<any>,
    options: {
      priority?: CacheEntry['priority'];
      ttl?: number;
      maxConcurrent?: number;
    } = {}
  ): Promise<void> {
    if (!this.config.enableIntelligentPrefetch) {
      return;
    }

    const maxConcurrent = options.maxConcurrent || 3;
    const semaphore = new Array(maxConcurrent).fill(null);
    
    const prefetchPromises = keys.map(async (key, index) => {
      // Wait for available slot
      await new Promise(resolve => {
        const checkSlot = () => {
          const slotIndex = semaphore.findIndex(slot => slot === null);
          if (slotIndex !== -1) {
            semaphore[slotIndex] = key;
            resolve(slotIndex);
          } else {
            setTimeout(checkSlot, 10);
          }
        };
        checkSlot();
      });

      try {
        // Check if already cached
        const cached = await this.get(key);
        if (!cached) {
          const data = await dataLoader(key);
          await this.set(key, data, {
            priority: options.priority || 'low',
            ttl: options.ttl,
            tags: ['prefetched']
          });
          logger.debug('Prefetch completed', { key });
        }
      } catch (error) {
        logger.error('Prefetch failed', { key, error });
      } finally {
        // Release slot
        const slotIndex = semaphore.indexOf(key);
        if (slotIndex !== -1) {
          semaphore[slotIndex] = null;
        }
      }
    });

    await Promise.allSettled(prefetchPromises);
  }

  /**
   * Get comprehensive performance report
   */
  async getPerformanceReport(): Promise<CachePerformanceReport> {
    const levelMetrics = Array.from(this.metrics.values());
    const overallHitRate = this.calculateOverallHitRate(levelMetrics);

    // Get top performing keys
    const topKeys = await this.getTopKeys();
    const slowestKeys = await this.getSlowestKeys();

    // Generate recommendations
    const recommendations = this.generateRecommendations(levelMetrics);

    // Calculate memory usage
    const memoryUsage = await this.calculateMemoryUsage();

    return {
      overallHitRate,
      levelMetrics,
      topKeys,
      slowestKeys,
      recommendations,
      memoryUsage
    };
  }

  /**
   * Optimize cache performance
   */
  async optimize(): Promise<void> {
    logger.info('Starting cache optimization');

    // Remove expired entries
    await this.removeExpiredEntries();

    // Apply eviction policies
    await this.applyEvictionPolicies();

    // Optimize level distribution
    await this.optimizeLevelDistribution();

    // Update metrics
    await this.updateAllMetrics();

    logger.info('Cache optimization completed');
  }

  /**
   * Clear all cache levels
   */
  async clear(): Promise<void> {
    for (const level of this.levels) {
      try {
        await level.storage.clear();
        logger.debug('Cache level cleared', { level: level.name });
      } catch (error) {
        logger.error('Cache clear error', { level: level.name, error });
      }
    }

    this.resetMetrics();
    logger.info('All cache levels cleared');
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }

    await this.optimize();
    logger.info('Enhanced caching layer shutdown complete');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private initializeLevels(): void {
    this.levels = [
      {
        name: 'memory',
        storage: new MemoryCacheStorage(),
        maxSize: this.config.memoryMaxSize,
        defaultTTL: this.config.defaultTTL,
        evictionPolicy: 'lru'
      }
    ];

    if (this.config.enableLocalStorage) {
      this.levels.push({
        name: 'localStorage',
        storage: new LocalStorageCacheStorage(),
        maxSize: this.config.localStorageMaxSize,
        defaultTTL: this.config.defaultTTL * 2,
        evictionPolicy: 'lfu'
      });
    }

    if (this.config.enableServiceWorker) {
      this.levels.push({
        name: 'serviceWorker',
        storage: new ServiceWorkerCacheStorage(),
        maxSize: this.config.serviceWorkerMaxSize,
        defaultTTL: this.config.defaultTTL * 4,
        evictionPolicy: 'ttl'
      });
    }

    // Initialize metrics for each level
    this.levels.forEach(level => {
      this.metrics.set(level.name, {
        level: level.name,
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        totalSize: 0,
        entryCount: 0,
        averageAccessTime: 0,
        evictionCount: 0,
        lastOptimization: new Date()
      });
    });
  }

  private initializeInvalidationRules(): void {
    this.invalidationRules = [
      {
        pattern: /^user_profile:/,
        dependencies: ['user_workouts:', 'user_achievements:', 'user_streaks:'],
        cascadeInvalidation: true
      },
      {
        pattern: /^workout_session:/,
        dependencies: ['user_stats:', 'exercise_history:'],
        cascadeInvalidation: true
      },
      {
        pattern: /^exercise:/,
        dependencies: ['workout_templates:', 'exercise_recommendations:'],
        cascadeInvalidation: false
      }
    ];
  }

  private isEntryValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp.getTime()) < entry.ttl;
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // UTF-16 characters
    } catch {
      return 1024; // Default size estimate
    }
  }

  private selectOptimalLevels(entry: CacheEntry): string[] {
    const levels: string[] = [];

    // Always cache in memory for fast access
    levels.push('memory');

    // Cache in localStorage for medium-term persistence
    if (this.config.enableLocalStorage && entry.priority !== 'low') {
      levels.push('localStorage');
    }

    // Cache in serviceWorker for long-term persistence
    if (this.config.enableServiceWorker && 
        (entry.priority === 'high' || entry.priority === 'critical')) {
      levels.push('serviceWorker');
    }

    return levels;
  }

  private async promoteEntry(key: string, entry: CacheEntry, currentLevel: string): Promise<void> {
    // Promote frequently accessed entries to faster levels
    if (entry.accessCount > 5 && currentLevel !== 'memory') {
      try {
        const memoryLevel = this.levels.find(l => l.name === 'memory');
        if (memoryLevel) {
          await memoryLevel.storage.set(key, entry);
          logger.debug('Entry promoted to memory', { key, accessCount: entry.accessCount });
        }
      } catch (error) {
        logger.error('Entry promotion failed', { key, error });
      }
    }
  }

  private async enforceCapacityLimits(): Promise<void> {
    for (const level of this.levels) {
      try {
        const currentSize = await this.calculateLevelSize(level);
        if (currentSize > level.maxSize) {
          await this.evictEntries(level, currentSize - level.maxSize);
        }
      } catch (error) {
        logger.error('Capacity enforcement failed', { level: level.name, error });
      }
    }
  }

  private async calculateLevelSize(level: CacheLevel): number {
    try {
      const keys = await level.storage.keys();
      let totalSize = 0;

      for (const key of keys) {
        const entry = await level.storage.get(key);
        if (entry) {
          totalSize += entry.size;
        }
      }

      return totalSize;
    } catch (error) {
      logger.error('Level size calculation failed', { level: level.name, error });
      return 0;
    }
  }

  private async evictEntries(level: CacheLevel, targetSize: number): Promise<void> {
    const keys = await level.storage.keys();
    const entries: Array<{ key: string; entry: CacheEntry }> = [];

    for (const key of keys) {
      const entry = await level.storage.get(key);
      if (entry) {
        entries.push({ key, entry });
      }
    }

    // Sort by eviction policy
    let sortedEntries: Array<{ key: string; entry: CacheEntry }>;
    
    switch (level.evictionPolicy) {
      case 'lru':
        sortedEntries = entries.sort((a, b) => 
          a.entry.lastAccessed.getTime() - b.entry.lastAccessed.getTime()
        );
        break;
      case 'lfu':
        sortedEntries = entries.sort((a, b) => 
          a.entry.accessCount - b.entry.accessCount
        );
        break;
      case 'ttl':
        sortedEntries = entries.sort((a, b) => 
          (a.entry.timestamp.getTime() + a.entry.ttl) - 
          (b.entry.timestamp.getTime() + b.entry.ttl)
        );
        break;
      case 'priority':
        const priorityOrder = { 'low': 0, 'medium': 1, 'high': 2, 'critical': 3 };
        sortedEntries = entries.sort((a, b) => 
          priorityOrder[a.entry.priority] - priorityOrder[b.entry.priority]
        );
        break;
      default:
        sortedEntries = entries;
    }

    let evictedSize = 0;
    let evictedCount = 0;

    for (const { key, entry } of sortedEntries) {
      if (evictedSize >= targetSize) break;

      await level.storage.delete(key);
      evictedSize += entry.size;
      evictedCount++;
    }

    // Update metrics
    const metrics = this.metrics.get(level.name);
    if (metrics) {
      metrics.evictionCount += evictedCount;
    }

    logger.debug('Entries evicted', { 
      level: level.name, 
      count: evictedCount, 
      size: evictedSize 
    });
  }

  private async findDependentKeys(keys: string[]): Promise<string[]> {
    const dependentKeys: string[] = [];

    for (const key of keys) {
      for (const rule of this.invalidationRules) {
        if (rule.pattern.test(key) && rule.cascadeInvalidation) {
          for (const dependency of rule.dependencies) {
            // Find keys matching dependency pattern
            for (const level of this.levels) {
              try {
                const allKeys = await level.storage.keys();
                const matchingKeys = allKeys.filter(k => k.startsWith(dependency));
                dependentKeys.push(...matchingKeys);
              } catch (error) {
                logger.error('Dependency resolution failed', { dependency, error });
              }
            }
          }
        }
      }
    }

    return [...new Set(dependentKeys)]; // Remove duplicates
  }

  private updateHitMetrics(levelName: string, accessTime: number): void {
    const metrics = this.metrics.get(levelName);
    if (metrics) {
      metrics.hitCount++;
      metrics.averageAccessTime = 
        (metrics.averageAccessTime * (metrics.hitCount - 1) + accessTime) / metrics.hitCount;
      metrics.hitRate = metrics.hitCount / (metrics.hitCount + metrics.missCount);
    }
  }

  private updateMissMetrics(): void {
    this.levels.forEach(level => {
      const metrics = this.metrics.get(level.name);
      if (metrics) {
        metrics.missCount++;
        metrics.hitRate = metrics.hitCount / (metrics.hitCount + metrics.missCount);
      }
    });
  }

  private calculateOverallHitRate(levelMetrics: CacheMetrics[]): number {
    const totalHits = levelMetrics.reduce((sum, m) => sum + m.hitCount, 0);
    const totalRequests = levelMetrics.reduce((sum, m) => sum + m.hitCount + m.missCount, 0);
    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }

  private async getTopKeys(): Promise<Array<{ key: string; hitCount: number; size: number }>> {
    const keyStats = new Map<string, { hitCount: number; size: number }>();

    for (const level of this.levels) {
      try {
        const keys = await level.storage.keys();
        for (const key of keys) {
          const entry = await level.storage.get(key);
          if (entry) {
            const existing = keyStats.get(key) || { hitCount: 0, size: 0 };
            keyStats.set(key, {
              hitCount: Math.max(existing.hitCount, entry.accessCount),
              size: entry.size
            });
          }
        }
      } catch (error) {
        logger.error('Top keys calculation failed', { level: level.name, error });
      }
    }

    return Array.from(keyStats.entries())
      .map(([key, stats]) => ({ key, ...stats }))
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 10);
  }

  private async getSlowestKeys(): Promise<Array<{ key: string; averageTime: number }>> {
    // This would require tracking access times per key
    // For now, return empty array as placeholder
    return [];
  }

  private generateRecommendations(levelMetrics: CacheMetrics[]): string[] {
    const recommendations: string[] = [];

    const overallHitRate = this.calculateOverallHitRate(levelMetrics);
    if (overallHitRate < 0.5) {
      recommendations.push('Low cache hit rate - consider increasing TTL or cache size');
    }

    const memoryMetrics = levelMetrics.find(m => m.level === 'memory');
    if (memoryMetrics && memoryMetrics.evictionCount > 100) {
      recommendations.push('High memory cache eviction - consider increasing memory cache size');
    }

    const avgAccessTime = levelMetrics.reduce((sum, m) => sum + m.averageAccessTime, 0) / levelMetrics.length;
    if (avgAccessTime > 10) {
      recommendations.push('High average access time - optimize cache key structure');
    }

    return recommendations;
  }

  private async calculateMemoryUsage(): Promise<{
    total: number;
    byLevel: Record<string, number>;
    percentage: number;
  }> {
    const byLevel: Record<string, number> = {};
    let total = 0;

    for (const level of this.levels) {
      const size = await this.calculateLevelSize(level);
      byLevel[level.name] = size;
      total += size;
    }

    const maxTotal = this.levels.reduce((sum, level) => sum + level.maxSize, 0);
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

    return { total, byLevel, percentage };
  }

  private async removeExpiredEntries(): Promise<void> {
    const now = Date.now();

    for (const level of this.levels) {
      try {
        const keys = await level.storage.keys();
        const expiredKeys: string[] = [];

        for (const key of keys) {
          const entry = await level.storage.get(key);
          if (entry && !this.isEntryValid(entry)) {
            expiredKeys.push(key);
          }
        }

        for (const key of expiredKeys) {
          await level.storage.delete(key);
        }

        logger.debug('Expired entries removed', { 
          level: level.name, 
          count: expiredKeys.length 
        });
      } catch (error) {
        logger.error('Expired entry removal failed', { level: level.name, error });
      }
    }
  }

  private async applyEvictionPolicies(): Promise<void> {
    for (const level of this.levels) {
      const currentSize = await this.calculateLevelSize(level);
      if (currentSize > level.maxSize * 0.8) { // Start eviction at 80% capacity
        await this.evictEntries(level, currentSize - level.maxSize * 0.7); // Evict to 70%
      }
    }
  }

  private async optimizeLevelDistribution(): Promise<void> {
    // Move frequently accessed items to faster levels
    // This is a simplified implementation
    const memoryLevel = this.levels.find(l => l.name === 'memory');
    const localStorageLevel = this.levels.find(l => l.name === 'localStorage');

    if (!memoryLevel || !localStorageLevel) return;

    try {
      const localStorageKeys = await localStorageLevel.storage.keys();
      const promotionCandidates: Array<{ key: string; entry: CacheEntry }> = [];

      for (const key of localStorageKeys) {
        const entry = await localStorageLevel.storage.get(key);
        if (entry && entry.accessCount > 10) {
          promotionCandidates.push({ key, entry });
        }
      }

      // Promote top candidates to memory
      const topCandidates = promotionCandidates
        .sort((a, b) => b.entry.accessCount - a.entry.accessCount)
        .slice(0, 10);

      for (const { key, entry } of topCandidates) {
        await memoryLevel.storage.set(key, entry);
        logger.debug('Entry promoted to memory during optimization', { key });
      }
    } catch (error) {
      logger.error('Level distribution optimization failed', { error });
    }
  }

  private async updateAllMetrics(): Promise<void> {
    for (const level of this.levels) {
      try {
        const metrics = this.metrics.get(level.name);
        if (metrics) {
          metrics.totalSize = await this.calculateLevelSize(level);
          metrics.entryCount = await level.storage.size();
          metrics.lastOptimization = new Date();
        }
      } catch (error) {
        logger.error('Metrics update failed', { level: level.name, error });
      }
    }
  }

  private resetMetrics(): void {
    this.levels.forEach(level => {
      this.metrics.set(level.name, {
        level: level.name,
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        totalSize: 0,
        entryCount: 0,
        averageAccessTime: 0,
        evictionCount: 0,
        lastOptimization: new Date()
      });
    });
  }

  private startOptimization(): void {
    this.optimizationTimer = setInterval(async () => {
      try {
        await this.optimize();
      } catch (error) {
        logger.error('Scheduled optimization failed', { error });
      }
    }, this.config.optimizationInterval);
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const enhancedCachingLayer = EnhancedCachingLayer.getInstance();

// ============================================================================
// Utility functions for easy integration
// ============================================================================

/**
 * Get data from enhanced cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  return enhancedCachingLayer.get<T>(key);
}

/**
 * Set data in enhanced cache
 */
export async function setCached<T>(
  key: string,
  data: T,
  options?: {
    ttl?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
  }
): Promise<void> {
  return enhancedCachingLayer.set(key, data, options);
}

/**
 * Invalidate cached data
 */
export async function invalidateCache(
  keyOrPattern: string | RegExp,
  options?: { byTags?: string[]; cascadeInvalidation?: boolean }
): Promise<void> {
  return enhancedCachingLayer.invalidate(keyOrPattern, options);
}

/**
 * Get cache performance report
 */
export async function getCachePerformanceReport() {
  return enhancedCachingLayer.getPerformanceReport();
}