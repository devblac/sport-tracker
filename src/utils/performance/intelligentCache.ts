/**
 * Intelligent Caching System
 * Implements smart caching strategies with predictive prefetching and adaptive cache management
 */

interface CacheStrategy {
  name: string;
  pattern: RegExp | string;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';
  maxAge?: number;
  maxEntries?: number;
  priority: 'high' | 'medium' | 'low';
  networkTimeoutSeconds?: number;
}

interface CacheMetrics {
  url: string;
  hitCount: number;
  missCount: number;
  lastAccessed: number;
  averageLoadTime: number;
  cacheStrategy: string;
  priority: number;
}

interface PrefetchPrediction {
  url: string;
  probability: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

class IntelligentCacheManager {
  private static instance: IntelligentCacheManager;
  private cacheMetrics = new Map<string, CacheMetrics>();
  private userBehaviorPatterns = new Map<string, number>();
  private prefetchQueue: PrefetchPrediction[] = [];
  private isProcessingPrefetch = false;

  private cacheStrategies: CacheStrategy[] = [
    // Static assets - Cache First with long TTL
    {
      name: 'static-assets',
      pattern: /\.(js|css|woff2?|ttf|eot)$/,
      strategy: 'cache-first',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      maxEntries: 100,
      priority: 'high'
    },

    // Images - Cache First with medium TTL
    {
      name: 'images',
      pattern: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
      strategy: 'cache-first',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxEntries: 200,
      priority: 'medium'
    },

    // API calls - Network First with short timeout
    {
      name: 'api-calls',
      pattern: /\/api\//,
      strategy: 'network-first',
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxEntries: 50,
      priority: 'high',
      networkTimeoutSeconds: 3
    },

    // Exercise data - Stale While Revalidate
    {
      name: 'exercise-data',
      pattern: /\/exercises/,
      strategy: 'stale-while-revalidate',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 100,
      priority: 'high'
    },

    // Workout data - Network First with fallback
    {
      name: 'workout-data',
      pattern: /\/workouts/,
      strategy: 'network-first',
      maxAge: 60 * 60 * 1000, // 1 hour
      maxEntries: 50,
      priority: 'high',
      networkTimeoutSeconds: 5
    },

    // Social content - Stale While Revalidate
    {
      name: 'social-content',
      pattern: /\/social/,
      strategy: 'stale-while-revalidate',
      maxAge: 15 * 60 * 1000, // 15 minutes
      maxEntries: 30,
      priority: 'medium'
    },

    // User profiles - Network First
    {
      name: 'user-profiles',
      pattern: /\/users/,
      strategy: 'network-first',
      maxAge: 30 * 60 * 1000, // 30 minutes
      maxEntries: 20,
      priority: 'medium',
      networkTimeoutSeconds: 3
    },

    // Analytics data - Network First
    {
      name: 'analytics',
      pattern: /\/analytics/,
      strategy: 'network-first',
      maxAge: 10 * 60 * 1000, // 10 minutes
      maxEntries: 20,
      priority: 'low',
      networkTimeoutSeconds: 5
    }
  ];

  static getInstance(): IntelligentCacheManager {
    if (!IntelligentCacheManager.instance) {
      IntelligentCacheManager.instance = new IntelligentCacheManager();
    }
    return IntelligentCacheManager.instance;
  }

  /**
   * Get the appropriate cache strategy for a URL
   */
  getCacheStrategy(url: string): CacheStrategy | null {
    for (const strategy of this.cacheStrategies) {
      if (typeof strategy.pattern === 'string') {
        if (url.includes(strategy.pattern)) {
          return strategy;
        }
      } else if (strategy.pattern.test(url)) {
        return strategy;
      }
    }
    return null;
  }

  /**
   * Handle fetch request with intelligent caching
   */
  async handleFetch(request: Request): Promise<Response> {
    const url = request.url;
    const strategy = this.getCacheStrategy(url);
    
    if (!strategy) {
      return fetch(request);
    }

    const startTime = performance.now();
    let response: Response;
    let cacheHit = false;

    try {
      switch (strategy.strategy) {
        case 'cache-first':
          response = await this.cacheFirst(request, strategy);
          break;
        case 'network-first':
          response = await this.networkFirst(request, strategy);
          break;
        case 'stale-while-revalidate':
          response = await this.staleWhileRevalidate(request, strategy);
          break;
        case 'network-only':
          response = await fetch(request);
          break;
        case 'cache-only':
          response = await this.cacheOnly(request, strategy);
          break;
        default:
          response = await fetch(request);
      }

      const loadTime = performance.now() - startTime;
      this.updateCacheMetrics(url, cacheHit, loadTime, strategy.name);
      this.updateUserBehaviorPatterns(url);
      
      return response;
    } catch (error) {
      const loadTime = performance.now() - startTime;
      this.updateCacheMetrics(url, false, loadTime, strategy.name);
      throw error;
    }
  }

  private async cacheFirst(request: Request, strategy: CacheStrategy): Promise<Response> {
    const cache = await caches.open(strategy.name);
    const cachedResponse = await cache.match(request);

    if (cachedResponse && !this.isCacheExpired(cachedResponse, strategy.maxAge)) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await this.putInCache(cache, request, networkResponse.clone(), strategy);
      }
      return networkResponse;
    } catch (error) {
      if (cachedResponse) {
        return cachedResponse; // Return stale cache as fallback
      }
      throw error;
    }
  }

  private async networkFirst(request: Request, strategy: CacheStrategy): Promise<Response> {
    const cache = await caches.open(strategy.name);
    
    try {
      const networkPromise = fetch(request);
      const timeoutPromise = strategy.networkTimeoutSeconds 
        ? this.createTimeoutPromise(strategy.networkTimeoutSeconds * 1000)
        : null;

      const networkResponse = timeoutPromise 
        ? await Promise.race([networkPromise, timeoutPromise])
        : await networkPromise;

      if (networkResponse.ok) {
        await this.putInCache(cache, request, networkResponse.clone(), strategy);
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }

  private async staleWhileRevalidate(request: Request, strategy: CacheStrategy): Promise<Response> {
    const cache = await caches.open(strategy.name);
    const cachedResponse = await cache.match(request);

    // Always try to update cache in background
    const networkPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        await this.putInCache(cache, request, networkResponse.clone(), strategy);
      }
      return networkResponse;
    }).catch(() => {
      // Silently handle network failures
    });

    // Return cached version immediately if available
    if (cachedResponse) {
      return cachedResponse;
    }

    // If no cache, wait for network
    return await networkPromise;
  }

  private async cacheOnly(request: Request, strategy: CacheStrategy): Promise<Response> {
    const cache = await caches.open(strategy.name);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw new Error('No cached response available');
  }

  private async putInCache(
    cache: Cache, 
    request: Request, 
    response: Response, 
    strategy: CacheStrategy
  ): Promise<void> {
    // Add cache headers
    const responseWithHeaders = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'sw-cache-timestamp': Date.now().toString(),
        'sw-cache-strategy': strategy.name
      }
    });

    await cache.put(request, responseWithHeaders);
    await this.enforceMaxEntries(cache, strategy.maxEntries);
  }

  private isCacheExpired(response: Response, maxAge?: number): boolean {
    if (!maxAge) return false;
    
    const cacheTimestamp = response.headers.get('sw-cache-timestamp');
    if (!cacheTimestamp) return true;
    
    const age = Date.now() - parseInt(cacheTimestamp);
    return age > maxAge;
  }

  private async enforceMaxEntries(cache: Cache, maxEntries?: number): Promise<void> {
    if (!maxEntries) return;

    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;

    // Remove oldest entries
    const entriesToRemove = keys.length - maxEntries;
    const keysToRemove = keys.slice(0, entriesToRemove);
    
    await Promise.all(keysToRemove.map(key => cache.delete(key)));
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), timeout);
    });
  }

  private updateCacheMetrics(
    url: string, 
    cacheHit: boolean, 
    loadTime: number, 
    strategy: string
  ): void {
    const existing = this.cacheMetrics.get(url) || {
      url,
      hitCount: 0,
      missCount: 0,
      lastAccessed: 0,
      averageLoadTime: 0,
      cacheStrategy: strategy,
      priority: 0
    };

    if (cacheHit) {
      existing.hitCount++;
    } else {
      existing.missCount++;
    }

    existing.lastAccessed = Date.now();
    existing.averageLoadTime = (existing.averageLoadTime + loadTime) / 2;
    
    this.cacheMetrics.set(url, existing);
  }

  private updateUserBehaviorPatterns(url: string): void {
    const count = this.userBehaviorPatterns.get(url) || 0;
    this.userBehaviorPatterns.set(url, count + 1);
  }

  /**
   * Predict and prefetch likely next resources
   */
  async predictAndPrefetch(): Promise<void> {
    if (this.isProcessingPrefetch) return;
    
    this.isProcessingPrefetch = true;
    
    try {
      const predictions = this.generatePrefetchPredictions();
      this.prefetchQueue = predictions.sort((a, b) => b.probability - a.probability);
      
      // Process high priority prefetches immediately
      const highPriorityPrefetches = this.prefetchQueue
        .filter(p => p.priority === 'high')
        .slice(0, 3); // Limit to 3 high priority prefetches
      
      await Promise.all(
        highPriorityPrefetches.map(prediction => this.prefetchResource(prediction.url))
      );
      
      // Schedule medium and low priority prefetches
      this.scheduleLowPriorityPrefetches();
    } finally {
      this.isProcessingPrefetch = false;
    }
  }

  private generatePrefetchPredictions(): PrefetchPrediction[] {
    const predictions: PrefetchPrediction[] = [];
    const currentPath = new URL(self.location.href).pathname;
    
    // Predict based on user behavior patterns
    for (const [url, accessCount] of this.userBehaviorPatterns.entries()) {
      if (url === currentPath) continue;
      
      const probability = Math.min(accessCount / 10, 1); // Normalize to 0-1
      let priority: 'high' | 'medium' | 'low' = 'low';
      
      if (probability > 0.7) priority = 'high';
      else if (probability > 0.4) priority = 'medium';
      
      predictions.push({
        url,
        probability,
        priority,
        reason: `Frequently accessed (${accessCount} times)`
      });
    }

    // Add route-based predictions
    const routePredictions = this.getRoutePredictions(currentPath);
    predictions.push(...routePredictions);
    
    return predictions;
  }

  private getRoutePredictions(currentPath: string): PrefetchPrediction[] {
    const predictions: PrefetchPrediction[] = [];
    
    // Define common navigation patterns
    const navigationPatterns: { [key: string]: string[] } = {
      '/': ['/workout', '/progress', '/exercises'],
      '/workout': ['/exercises', '/workout-player', '/progress'],
      '/exercises': ['/workout', '/exercise-detail'],
      '/progress': ['/workout', '/analytics'],
      '/social': ['/profile', '/friends'],
      '/profile': ['/settings', '/social']
    };
    
    const likelyNextRoutes = navigationPatterns[currentPath] || [];
    
    likelyNextRoutes.forEach((route, index) => {
      predictions.push({
        url: route,
        probability: 0.8 - (index * 0.2), // Decreasing probability
        priority: index === 0 ? 'high' : 'medium',
        reason: `Common navigation pattern from ${currentPath}`
      });
    });
    
    return predictions;
  }

  private async prefetchResource(url: string): Promise<void> {
    try {
      const request = new Request(url, { mode: 'cors' });
      const response = await fetch(request);
      
      if (response.ok) {
        const strategy = this.getCacheStrategy(url);
        if (strategy) {
          const cache = await caches.open(strategy.name);
          await this.putInCache(cache, request, response, strategy);
        }
      }
    } catch (error) {
      console.warn(`Failed to prefetch ${url}:`, error);
    }
  }

  private scheduleLowPriorityPrefetches(): void {
    const lowPriorityPrefetches = this.prefetchQueue
      .filter(p => p.priority !== 'high')
      .slice(0, 5); // Limit to 5 low priority prefetches
    
    // Schedule with delays to avoid overwhelming the network
    lowPriorityPrefetches.forEach((prediction, index) => {
      setTimeout(() => {
        this.prefetchResource(prediction.url);
      }, (index + 1) * 1000); // 1 second intervals
    });
  }

  /**
   * Get cache performance analytics
   */
  getCacheAnalytics(): {
    totalRequests: number;
    cacheHitRate: number;
    averageLoadTime: number;
    strategiesPerformance: { [key: string]: any };
  } {
    const metrics = Array.from(this.cacheMetrics.values());
    const totalRequests = metrics.reduce((sum, m) => sum + m.hitCount + m.missCount, 0);
    const totalHits = metrics.reduce((sum, m) => sum + m.hitCount, 0);
    const cacheHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
    const averageLoadTime = metrics.reduce((sum, m) => sum + m.averageLoadTime, 0) / metrics.length;
    
    const strategiesPerformance: { [key: string]: any } = {};
    
    for (const strategy of this.cacheStrategies) {
      const strategyMetrics = metrics.filter(m => m.cacheStrategy === strategy.name);
      const strategyRequests = strategyMetrics.reduce((sum, m) => sum + m.hitCount + m.missCount, 0);
      const strategyHits = strategyMetrics.reduce((sum, m) => sum + m.hitCount, 0);
      
      strategiesPerformance[strategy.name] = {
        requests: strategyRequests,
        hitRate: strategyRequests > 0 ? strategyHits / strategyRequests : 0,
        averageLoadTime: strategyMetrics.reduce((sum, m) => sum + m.averageLoadTime, 0) / strategyMetrics.length || 0
      };
    }
    
    return {
      totalRequests,
      cacheHitRate,
      averageLoadTime: averageLoadTime || 0,
      strategiesPerformance
    };
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    this.cacheMetrics.clear();
    this.userBehaviorPatterns.clear();
  }

  /**
   * Optimize cache based on usage patterns
   */
  async optimizeCaches(): Promise<void> {
    // Remove unused cache entries
    for (const strategy of this.cacheStrategies) {
      const cache = await caches.open(strategy.name);
      const keys = await cache.keys();
      
      for (const request of keys) {
        const metrics = this.cacheMetrics.get(request.url);
        
        // Remove entries that haven't been accessed in a long time
        if (metrics && Date.now() - metrics.lastAccessed > 7 * 24 * 60 * 60 * 1000) {
          await cache.delete(request);
          this.cacheMetrics.delete(request.url);
        }
      }
    }
  }
}

// Export singleton instance
export const intelligentCache = IntelligentCacheManager.getInstance();

// Service Worker integration
export function setupIntelligentCaching(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'CACHE_ANALYTICS_REQUEST') {
        const analytics = intelligentCache.getCacheAnalytics();
        event.ports[0].postMessage({ type: 'CACHE_ANALYTICS_RESPONSE', data: analytics });
      }
    });
  }
}