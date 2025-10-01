/**
 * Cache Manager
 * Intelligent cache management with size optimization and cleanup strategies
 */

import { dbManager } from '@/db/IndexedDBManager';

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: number;
  tags?: string[];
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxItems: number; // Maximum number of items
  defaultTTL: number; // Default time to live in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  compressionThreshold: number; // Compress items larger than this size
}

export interface CacheStats {
  totalSize: number;
  itemCount: number;
  hitRate: number;
  oldestItem: number;
  newestItem: number;
  compressionRatio: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  maxItems: 10000,
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  compressionThreshold: 10 * 1024, // 10KB
};

export class CacheManager {
  private static instance: CacheManager;
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private hitCount = 0;
  private missCount = 0;
  private compressionEnabled = false;

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeCache();
  }

  public static getInstance(config?: Partial<CacheConfig>): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }

  /**
   * Initialize cache system
   */
  private async initializeCache(): Promise<void> {
    try {
      await dbManager.init();
      
      // Check if compression is available
      this.compressionEnabled = 'CompressionStream' in window;
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      // Perform initial cleanup
      await this.performCleanup();
      
      console.log('[CacheManager] Cache initialized', {
        maxSize: this.formatBytes(this.config.maxSize),
        maxItems: this.config.maxItems,
        compressionEnabled: this.compressionEnabled
      });
      
    } catch (error) {
      console.error('[CacheManager] Failed to initialize cache:', error);
    }
  }

  /**
   * Set cache entry
   */
  async set(
    key: string, 
    data: any, 
    options: {
      ttl?: number;
      priority?: CacheEntry['priority'];
      tags?: string[];
    } = {}
  ): Promise<boolean> {
    try {
      const serializedData = JSON.stringify(data);
      const size = new Blob([serializedData]).size;
      
      // Check if item is too large
      if (size > this.config.maxSize * 0.1) { // Don't allow items larger than 10% of cache
        console.warn(`[CacheManager] Item too large to cache: ${key} (${this.formatBytes(size)})`);
        return false;
      }

      // Compress if needed and available
      let finalData = serializedData;
      let isCompressed = false;
      
      if (this.compressionEnabled && size > this.config.compressionThreshold) {
        try {
          finalData = await this.compressData(serializedData);
          isCompressed = true;
        } catch (error) {
          console.warn('[CacheManager] Compression failed, storing uncompressed:', error);
        }
      }

      const entry: CacheEntry = {
        key,
        data: finalData,
        timestamp: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        size: new Blob([finalData]).size,
        priority: options.priority || 'medium',
        expiresAt: options.ttl ? Date.now() + options.ttl : Date.now() + this.config.defaultTTL,
        tags: options.tags,
      };

      // Add compression metadata
      if (isCompressed) {
        entry.tags = [...(entry.tags || []), '__compressed__'];
      }

      // Check cache limits before adding
      await this.ensureCacheSpace(entry.size);

      // Store the entry
      await dbManager.put('cache', entry);
      
      console.log(`[CacheManager] Cached: ${key} (${this.formatBytes(entry.size)}${isCompressed ? ', compressed' : ''})`);
      return true;
      
    } catch (error) {
      console.error('[CacheManager] Failed to set cache entry:', error);
      return false;
    }
  }

  /**
   * Get cache entry
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const entry = await dbManager.get<CacheEntry>('cache', key);
      
      if (!entry) {
        this.missCount++;
        return null;
      }

      // Check if expired
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        await this.delete(key);
        this.missCount++;
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      await dbManager.put('cache', entry);

      // Decompress if needed
      let data = entry.data;
      if (entry.tags?.includes('__compressed__')) {
        try {
          data = await this.decompressData(entry.data);
        } catch (error) {
          console.error('[CacheManager] Decompression failed:', error);
          await this.delete(key);
          this.missCount++;
          return null;
        }
      }

      this.hitCount++;
      return JSON.parse(data);
      
    } catch (error) {
      console.error('[CacheManager] Failed to get cache entry:', error);
      this.missCount++;
      return null;
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<boolean> {
    try {
      await dbManager.delete('cache', key);
      return true;
    } catch (error) {
      console.error('[CacheManager] Failed to delete cache entry:', error);
      return false;
    }
  }

  /**
   * Clear cache by tags
   */
  async clearByTags(tags: string[]): Promise<number> {
    try {
      const allEntries = await dbManager.getAll<CacheEntry>('cache');
      let deletedCount = 0;

      for (const entry of allEntries) {
        if (entry.tags && tags.some(tag => entry.tags!.includes(tag))) {
          await this.delete(entry.key);
          deletedCount++;
        }
      }

      console.log(`[CacheManager] Cleared ${deletedCount} entries by tags:`, tags);
      return deletedCount;
      
    } catch (error) {
      console.error('[CacheManager] Failed to clear cache by tags:', error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    try {
      const allEntries = await dbManager.getAll<CacheEntry>('cache');
      
      for (const entry of allEntries) {
        await dbManager.delete('cache', entry.key);
      }

      console.log(`[CacheManager] Cleared all cache (${allEntries.length} entries)`);
      return true;
      
    } catch (error) {
      console.error('[CacheManager] Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const allEntries = await dbManager.getAll<CacheEntry>('cache');
      
      const totalSize = allEntries.reduce((sum, entry) => sum + entry.size, 0);
      const compressedEntries = allEntries.filter(entry => entry.tags?.includes('__compressed__'));
      const originalSizes = await Promise.all(
        compressedEntries.map(async entry => {
          try {
            const decompressed = await this.decompressData(entry.data);
            return new Blob([decompressed]).size;
          } catch (error) {
            console.warn('Failed to decompress entry for size calculation:', error);
            return entry.size;
          }
        })
      );
      
      const originalSize = compressedEntries.reduce((sum, entry, index) => sum + originalSizes[index], 0);
      const compressedSize = compressedEntries.reduce((sum, entry) => sum + entry.size, 0);
      
      const compressionRatio = originalSize > 0 ? compressedSize / originalSize : 1;
      
      const timestamps = allEntries.map(entry => entry.timestamp);
      const oldestItem = timestamps.length > 0 ? Math.min(...timestamps) : 0;
      const newestItem = timestamps.length > 0 ? Math.max(...timestamps) : 0;
      
      const totalRequests = this.hitCount + this.missCount;
      const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;

      return {
        totalSize,
        itemCount: allEntries.length,
        hitRate,
        oldestItem,
        newestItem,
        compressionRatio,
      };
      
    } catch (error) {
      console.error('[CacheManager] Failed to get cache stats:', error);
      return {
        totalSize: 0,
        itemCount: 0,
        hitRate: 0,
        oldestItem: 0,
        newestItem: 0,
        compressionRatio: 1,
      };
    }
  }

  /**
   * Ensure cache has space for new entry
   */
  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const stats = await this.getStats();
    
    // Check if we need to free up space
    if (stats.totalSize + requiredSize > this.config.maxSize || 
        stats.itemCount >= this.config.maxItems) {
      
      await this.performEviction(requiredSize);
    }
  }

  /**
   * Perform intelligent cache eviction using multiple strategies
   */
  private async performEviction(requiredSize: number): Promise<void> {
    try {
      const allEntries = await dbManager.getAll<CacheEntry>('cache');
      
      // Calculate eviction scores for each entry
      const entriesWithScores = allEntries.map(entry => ({
        entry,
        score: this.calculateEvictionScore(entry)
      }));

      // Sort by eviction score (lower score = more likely to be evicted)
      entriesWithScores.sort((a, b) => a.score - b.score);

      let freedSize = 0;
      let evictedCount = 0;
      const targetSize = requiredSize * 1.2; // Evict 20% more to prevent immediate re-eviction
      
      // Evict entries starting from lowest score
      for (const { entry } of entriesWithScores) {
        if (freedSize >= targetSize) {
          break;
        }

        // Don't evict critical items unless we're in emergency mode
        if (entry.priority === 'critical' && freedSize < requiredSize) {
          continue;
        }

        await this.delete(entry.key);
        freedSize += entry.size;
        evictedCount++;
      }

      console.log(`[CacheManager] Intelligent eviction: ${evictedCount} entries, freed ${this.formatBytes(freedSize)}`);
      
    } catch (error) {
      console.error('[CacheManager] Cache eviction failed:', error);
    }
  }

  /**
   * Calculate eviction score for cache entry
   * Lower score = more likely to be evicted
   */
  private calculateEvictionScore(entry: CacheEntry): number {
    let score = 0;
    const now = Date.now();
    
    // Priority weight (critical items get high scores)
    const priorityWeights = { critical: 1000, high: 100, medium: 50, low: 10 };
    score += priorityWeights[entry.priority];
    
    // Access frequency weight
    const daysSinceCreation = (now - entry.timestamp) / (1000 * 60 * 60 * 24);
    const accessFrequency = entry.accessCount / Math.max(daysSinceCreation, 1);
    score += accessFrequency * 20;
    
    // Recency weight (recently accessed items get higher scores)
    const hoursSinceAccess = (now - entry.lastAccessed) / (1000 * 60 * 60);
    score += Math.max(0, 100 - hoursSinceAccess);
    
    // Size efficiency (smaller items per access get higher scores)
    const sizeEfficiency = entry.accessCount / Math.max(entry.size / 1024, 1);
    score += sizeEfficiency * 5;
    
    // Expiration proximity (items close to expiring get lower scores)
    if (entry.expiresAt) {
      const hoursUntilExpiry = (entry.expiresAt - now) / (1000 * 60 * 60);
      if (hoursUntilExpiry < 24) {
        score -= (24 - hoursUntilExpiry) * 2;
      }
    }
    
    // Tag-based adjustments
    if (entry.tags) {
      if (entry.tags.includes('essential')) score += 200;
      if (entry.tags.includes('temporary')) score -= 50;
      if (entry.tags.includes('__compressed__')) score += 30; // Compressed items are more valuable
    }
    
    return Math.max(0, score);
  }

  /**
   * Perform intelligent cache cleanup
   */
  private async performCleanup(): Promise<void> {
    try {
      const allEntries = await dbManager.getAll<CacheEntry>('cache');
      const now = Date.now();
      let cleanedCount = 0;
      let freedSize = 0;

      // Phase 1: Remove expired entries
      for (const entry of allEntries) {
        if (entry.expiresAt && now > entry.expiresAt) {
          await this.delete(entry.key);
          cleanedCount++;
          freedSize += entry.size;
        }
      }

      // Phase 2: Remove stale entries (not accessed in a long time)
      const staleThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days
      const remainingEntries = await dbManager.getAll<CacheEntry>('cache');
      
      for (const entry of remainingEntries) {
        const daysSinceAccess = now - entry.lastAccessed;
        
        // Remove stale entries based on priority
        let staleLimit = staleThreshold;
        switch (entry.priority) {
          case 'critical': staleLimit = staleThreshold * 3; break; // 90 days
          case 'high': staleLimit = staleThreshold * 2; break;     // 60 days
          case 'medium': staleLimit = staleThreshold; break;       // 30 days
          case 'low': staleLimit = staleThreshold * 0.5; break;    // 15 days
        }
        
        if (daysSinceAccess > staleLimit && entry.priority !== 'critical') {
          await this.delete(entry.key);
          cleanedCount++;
          freedSize += entry.size;
        }
      }

      // Phase 3: Optimize cache size if still over limits
      const stats = await this.getStats();
      if (stats.totalSize > this.config.maxSize || stats.itemCount > this.config.maxItems) {
        const targetReduction = Math.max(
          stats.totalSize - this.config.maxSize * 0.8, // Target 80% of max size
          0
        );
        
        if (targetReduction > 0) {
          await this.performEviction(targetReduction);
        }
      }

      // Phase 4: Defragmentation - recompress large uncompressed items
      if (this.compressionEnabled) {
        await this.performDefragmentation();
      }

      if (cleanedCount > 0) {
        console.log(`[CacheManager] Cleanup completed: ${cleanedCount} entries removed, ${this.formatBytes(freedSize)} freed`);
      }
      
    } catch (error) {
      console.error('[CacheManager] Cache cleanup failed:', error);
    }
  }

  /**
   * Perform cache defragmentation by recompressing large items
   */
  private async performDefragmentation(): Promise<void> {
    try {
      const allEntries = await dbManager.getAll<CacheEntry>('cache');
      let defragmentedCount = 0;
      let spaceSaved = 0;

      for (const entry of allEntries) {
        // Skip already compressed items
        if (entry.tags?.includes('__compressed__')) {
          continue;
        }

        // Only defragment large items that would benefit from compression
        if (entry.size > this.config.compressionThreshold) {
          try {
            const originalSize = entry.size;
            const compressedData = await this.compressData(entry.data);
            const compressedSize = new Blob([compressedData]).size;

            // Only update if compression provides significant savings (>20%)
            if (compressedSize < originalSize * 0.8) {
              const updatedEntry: CacheEntry = {
                ...entry,
                data: compressedData,
                size: compressedSize,
                tags: [...(entry.tags || []), '__compressed__']
              };

              await dbManager.put('cache', updatedEntry);
              defragmentedCount++;
              spaceSaved += (originalSize - compressedSize);
            }
          } catch (error) {
            console.warn(`[CacheManager] Failed to compress entry ${entry.key}:`, error);
          }
        }
      }

      if (defragmentedCount > 0) {
        console.log(`[CacheManager] Defragmentation: ${defragmentedCount} items compressed, ${this.formatBytes(spaceSaved)} saved`);
      }
    } catch (error) {
      console.error('[CacheManager] Defragmentation failed:', error);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Compress data using CompressionStream
   */
  private async compressData(data: string): Promise<string> {
    if (!this.compressionEnabled) {
      throw new Error('Compression not available');
    }

    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write data
    writer.write(new TextEncoder().encode(data));
    writer.close();

    // Read compressed data
    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    // Convert to base64 string
    const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      compressed.set(chunk, offset);
      offset += chunk.length;
    }

    return btoa(String.fromCharCode(...compressed));
  }

  /**
   * Decompress data using DecompressionStream
   */
  private async decompressData(compressedData: string): Promise<string> {
    if (!this.compressionEnabled) {
      throw new Error('Decompression not available');
    }

    // Convert from base64
    const compressed = Uint8Array.from(atob(compressedData), c => c.charCodeAt(0));

    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write compressed data
    writer.write(compressed);
    writer.close();

    // Read decompressed data
    const chunks: Uint8Array[] = [];
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    // Convert back to string
    const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      decompressed.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder().decode(decompressed);
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[CacheManager] Configuration updated:', newConfig);
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    console.log('[CacheManager] Cache manager destroyed');
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();