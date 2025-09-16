import { logger } from '@/utils/logger';

export interface MediaItem {
  id: string;
  url: string;
  type: 'gif' | 'image' | 'video';
  category: 'exercise_gif' | 'muscle_diagram' | 'thumbnail' | 'instruction_image';
  size?: number;
  cached: boolean;
  lastAccessed?: Date;
}

export interface CacheStats {
  totalSize: number;
  itemCount: number;
  maxSize: number;
  hitRate: number;
}

class MediaService {
  private cache: Map<string, Blob> = new Map();
  private metadata: Map<string, MediaItem> = new Map();
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly CACHE_NAME = 'exercise-media-v1';
  private hitCount = 0;
  private missCount = 0;

  constructor() {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      // Load metadata from localStorage
      const savedMetadata = localStorage.getItem('media-metadata');
      if (savedMetadata) {
        const parsed = JSON.parse(savedMetadata);
        this.metadata = new Map(Object.entries(parsed));
      }

      // Initialize service worker cache
      if ('caches' in window) {
        await caches.open(this.CACHE_NAME);
      }

      logger.info('MediaService initialized', {
        cachedItems: this.metadata.size,
        cacheSupported: 'caches' in window
      });
    } catch (error) {
      logger.error('Failed to initialize MediaService', error);
    }
  }

  /**
   * Get media with lazy loading and caching
   */
  async getMedia(url: string, type: MediaItem['type'], category: MediaItem['category']): Promise<string> {
    const mediaId = this.generateMediaId(url);
    
    try {
      // Check memory cache first
      const cached = this.cache.get(mediaId);
      if (cached) {
        this.hitCount++;
        this.updateLastAccessed(mediaId);
        return URL.createObjectURL(cached);
      }

      // Check service worker cache
      if ('caches' in window) {
        const cache = await caches.open(this.CACHE_NAME);
        const response = await cache.match(url);
        
        if (response) {
          const blob = await response.blob();
          this.cache.set(mediaId, blob);
          this.hitCount++;
          this.updateLastAccessed(mediaId);
          return URL.createObjectURL(blob);
        }
      }

      // Fetch from network
      this.missCount++;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.status}`);
      }

      const blob = await response.blob();
      
      // Cache the media
      await this.cacheMedia(url, blob, type, category);
      
      return URL.createObjectURL(blob);
    } catch (error) {
      logger.error('Failed to get media', { url, error });
      // Return original URL as fallback
      return url;
    }
  }

  /**
   * Preload media for better UX
   */
  async preloadMedia(urls: string[], type: MediaItem['type'], category: MediaItem['category']): Promise<void> {
    const preloadPromises = urls.map(async (url) => {
      try {
        await this.getMedia(url, type, category);
      } catch (error) {
        logger.warn('Failed to preload media', { url, error });
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Cache media with size management
   */
  private async cacheMedia(url: string, blob: Blob, type: MediaItem['type'], category: MediaItem['category']): Promise<void> {
    const mediaId = this.generateMediaId(url);
    
    // Check if we need to free up space
    await this.ensureCacheSpace(blob.size);
    
    // Store in memory cache
    this.cache.set(mediaId, blob);
    
    // Store in service worker cache
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.CACHE_NAME);
        const response = new Response(blob);
        await cache.put(url, response);
      } catch (error) {
        logger.warn('Failed to cache in service worker', { url, error });
      }
    }
    
    // Update metadata
    const mediaItem: MediaItem = {
      id: mediaId,
      url,
      type,
      category,
      size: blob.size,
      cached: true,
      lastAccessed: new Date()
    };
    
    this.metadata.set(mediaId, mediaItem);
    this.saveMetadata();
    
    logger.debug('Media cached', { url, size: blob.size, type, category });
  }

  /**
   * Ensure we have enough cache space
   */
  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const currentSize = this.getCurrentCacheSize();
    
    if (currentSize + requiredSize <= this.MAX_CACHE_SIZE) {
      return;
    }

    // Remove least recently used items
    const sortedItems = Array.from(this.metadata.values())
      .filter(item => item.cached)
      .sort((a, b) => {
        const aTime = a.lastAccessed?.getTime() || 0;
        const bTime = b.lastAccessed?.getTime() || 0;
        return aTime - bTime;
      });

    let freedSpace = 0;
    const itemsToRemove: string[] = [];

    for (const item of sortedItems) {
      if (freedSpace >= requiredSize) break;
      
      itemsToRemove.push(item.id);
      freedSpace += item.size || 0;
    }

    // Remove items from caches
    for (const itemId of itemsToRemove) {
      await this.removeFromCache(itemId);
    }

    logger.info('Cache space freed', { 
      itemsRemoved: itemsToRemove.length, 
      spaceFreed: freedSpace 
    });
  }

  /**
   * Remove item from all caches
   */
  private async removeFromCache(mediaId: string): Promise<void> {
    const item = this.metadata.get(mediaId);
    if (!item) return;

    // Remove from memory cache
    this.cache.delete(mediaId);

    // Remove from service worker cache
    if ('caches' in window && item.url) {
      try {
        const cache = await caches.open(this.CACHE_NAME);
        await cache.delete(item.url);
      } catch (error) {
        logger.warn('Failed to remove from service worker cache', { mediaId, error });
      }
    }

    // Remove from metadata
    this.metadata.delete(mediaId);
    this.saveMetadata();
  }

  /**
   * Get current cache size
   */
  private getCurrentCacheSize(): number {
    return Array.from(this.metadata.values())
      .filter(item => item.cached)
      .reduce((total, item) => total + (item.size || 0), 0);
  }

  /**
   * Update last accessed time
   */
  private updateLastAccessed(mediaId: string): void {
    const item = this.metadata.get(mediaId);
    if (item) {
      item.lastAccessed = new Date();
      this.metadata.set(mediaId, item);
    }
  }

  /**
   * Generate consistent media ID from URL
   */
  private generateMediaId(url: string): string {
    // Simple hash function for URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Save metadata to localStorage
   */
  private saveMetadata(): void {
    try {
      const metadataObj = Object.fromEntries(this.metadata);
      localStorage.setItem('media-metadata', JSON.stringify(metadataObj));
    } catch (error) {
      logger.warn('Failed to save media metadata', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const totalRequests = this.hitCount + this.missCount;
    return {
      totalSize: this.getCurrentCacheSize(),
      itemCount: this.metadata.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0
    };
  }

  /**
   * Clear all cached media
   */
  async clearCache(): Promise<void> {
    try {
      // Clear memory cache
      this.cache.clear();

      // Clear service worker cache
      if ('caches' in window) {
        await caches.delete(this.CACHE_NAME);
        await caches.open(this.CACHE_NAME);
      }

      // Clear metadata
      this.metadata.clear();
      localStorage.removeItem('media-metadata');

      // Reset stats
      this.hitCount = 0;
      this.missCount = 0;

      logger.info('Media cache cleared');
    } catch (error) {
      logger.error('Failed to clear media cache', error);
    }
  }

  /**
   * Prefetch exercise media based on usage patterns
   */
  async prefetchExerciseMedia(exerciseIds: string[]): Promise<void> {
    // This would typically fetch from your exercise service
    // For now, we'll simulate the URLs
    const mediaUrls: string[] = [];
    
    exerciseIds.forEach(id => {
      mediaUrls.push(`/api/exercises/${id}/gif`);
      mediaUrls.push(`/api/exercises/${id}/muscle-diagram`);
    });

    await this.preloadMedia(mediaUrls, 'gif', 'exercise_gif');
  }
}

export const mediaService = new MediaService();