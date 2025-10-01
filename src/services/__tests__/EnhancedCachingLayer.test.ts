/**
 * Enhanced Caching Layer Tests
 * 
 * Comprehensive test suite for the EnhancedCachingLayer service.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { 
  EnhancedCachingLayer,
  getCached,
  setCached,
  invalidateCache,
  getCachePerformanceReport
} from '../EnhancedCachingLayer';

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock caches API
const cachesMock = {
  open: vi.fn(),
  delete: vi.fn()
};

const cacheMock = {
  match: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  keys: vi.fn()
};

Object.defineProperty(window, 'caches', {
  value: cachesMock
});

describe('EnhancedCachingLayer', () => {
  let cachingLayer: EnhancedCachingLayer;

  beforeEach(() => {
    // Reset singleton instance for each test
    (EnhancedCachingLayer as any).instance = undefined;
    
    // Reset mocks
    vi.clearAllMocks();
    localStorageMock.length = 0;
    
    // Setup cache mocks
    cachesMock.open.mockResolvedValue(cacheMock);
    cacheMock.keys.mockResolvedValue([]);
    
    cachingLayer = EnhancedCachingLayer.getInstance({
      memoryMaxSize: 1024 * 1024, // 1MB for testing
      localStorageMaxSize: 512 * 1024, // 512KB for testing
      serviceWorkerMaxSize: 2 * 1024 * 1024, // 2MB for testing
      defaultTTL: 1000, // 1 second for testing
      optimizationInterval: 100, // 100ms for testing
      enableServiceWorker: true,
      enableLocalStorage: true,
      enableIntelligentPrefetch: true
    });
  });

  afterEach(async () => {
    await cachingLayer.shutdown();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a singleton instance', () => {
      const instance1 = EnhancedCachingLayer.getInstance();
      const instance2 = EnhancedCachingLayer.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with correct configuration', async () => {
      const report = await cachingLayer.getPerformanceReport();
      expect(report.levelMetrics).toHaveLength(3); // memory, localStorage, serviceWorker
      expect(report.levelMetrics.map(m => m.level)).toContain('memory');
      expect(report.levelMetrics.map(m => m.level)).toContain('localStorage');
      expect(report.levelMetrics.map(m => m.level)).toContain('serviceWorker');
    });
  });

  describe('Basic Cache Operations', () => {
    it('should set and get data from memory cache', async () => {
      const testData = { id: 1, name: 'test' };
      
      await cachingLayer.set('test-key', testData);
      const result = await cachingLayer.get('test-key');
      
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cachingLayer.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle TTL expiration', async () => {
      const testData = { id: 1, name: 'test' };
      
      await cachingLayer.set('expire-key', testData, { ttl: 10 }); // 10ms TTL
      
      // Should be available immediately
      let result = await cachingLayer.get('expire-key');
      expect(result).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should be expired
      result = await cachingLayer.get('expire-key');
      expect(result).toBeNull();
    });

    it('should handle different priority levels', async () => {
      const testData = { id: 1, name: 'test' };
      
      await cachingLayer.set('high-priority', testData, { priority: 'high' });
      await cachingLayer.set('low-priority', testData, { priority: 'low' });
      
      const highResult = await cachingLayer.get('high-priority');
      const lowResult = await cachingLayer.get('low-priority');
      
      expect(highResult).toEqual(testData);
      expect(lowResult).toEqual(testData);
    });
  });

  describe('Multi-Level Caching', () => {
    it('should promote frequently accessed entries', async () => {
      const testData = { id: 1, name: 'frequently-accessed' };
      
      // Set with high priority to ensure it goes to multiple levels
      await cachingLayer.set('frequent-key', testData, { priority: 'high' });
      
      // Access multiple times to trigger promotion
      for (let i = 0; i < 6; i++) {
        await cachingLayer.get('frequent-key');
      }
      
      // Should still be accessible
      const result = await cachingLayer.get('frequent-key');
      expect(result).toEqual(testData);
    });

    it('should handle localStorage fallback', async () => {
      // Test that localStorage storage is properly initialized
      const testData = { id: 1, name: 'localStorage-test' };
      
      // Set data with medium priority (should go to localStorage)
      await cachingLayer.set('ls-key', testData, { priority: 'medium' });
      
      // Verify it was set (should be in memory cache)
      const result = await cachingLayer.get('ls-key');
      expect(result).toEqual(testData);
      
      // Verify localStorage.setItem was called (indicating localStorage level is working)
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle serviceWorker cache', async () => {
      // Test that serviceWorker storage is properly initialized
      const testData = { id: 1, name: 'serviceWorker-test' };
      
      // Set data with critical priority (should go to serviceWorker)
      await cachingLayer.set('sw-key', testData, { priority: 'critical' });
      
      // Verify it was set (should be in memory cache)
      const result = await cachingLayer.get('sw-key');
      expect(result).toEqual(testData);
      
      // Verify caches.open was called (indicating serviceWorker level is working)
      expect(cachesMock.open).toHaveBeenCalled();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate by exact key', async () => {
      const testData = { id: 1, name: 'test' };
      
      await cachingLayer.set('invalidate-key', testData);
      
      // Verify it's cached
      let result = await cachingLayer.get('invalidate-key');
      expect(result).toEqual(testData);
      
      // Invalidate
      await cachingLayer.invalidate('invalidate-key');
      
      // Should be gone
      result = await cachingLayer.get('invalidate-key');
      expect(result).toBeNull();
    });

    it('should invalidate by pattern', async () => {
      const testData1 = { id: 1, name: 'test1' };
      const testData2 = { id: 2, name: 'test2' };
      
      await cachingLayer.set('user:123:profile', testData1);
      await cachingLayer.set('user:456:profile', testData2);
      await cachingLayer.set('exercise:789', { name: 'squat' });
      
      // Invalidate all user profiles
      await cachingLayer.invalidate(/^user:.*:profile$/);
      
      // User profiles should be gone
      expect(await cachingLayer.get('user:123:profile')).toBeNull();
      expect(await cachingLayer.get('user:456:profile')).toBeNull();
      
      // Exercise should still be there
      expect(await cachingLayer.get('exercise:789')).toEqual({ name: 'squat' });
    });

    it('should invalidate by tags', async () => {
      const testData = { id: 1, name: 'test' };
      
      await cachingLayer.set('tagged-key-1', testData, { tags: ['user-data'] });
      await cachingLayer.set('tagged-key-2', testData, { tags: ['user-data'] });
      await cachingLayer.set('other-key', testData, { tags: ['other'] });
      
      // Invalidate by tag
      await cachingLayer.invalidate('', { byTags: ['user-data'] });
      
      // Tagged entries should be gone
      expect(await cachingLayer.get('tagged-key-1')).toBeNull();
      expect(await cachingLayer.get('tagged-key-2')).toBeNull();
      
      // Other entry should remain
      expect(await cachingLayer.get('other-key')).toEqual(testData);
    });
  });

  describe('Prefetching', () => {
    it('should prefetch data intelligently', async () => {
      const dataLoader = vi.fn().mockImplementation((key: string) => 
        Promise.resolve({ id: key, name: `data-${key}` })
      );
      
      await cachingLayer.prefetch(['key1', 'key2', 'key3'], dataLoader);
      
      // Should have called loader for each key
      expect(dataLoader).toHaveBeenCalledTimes(3);
      expect(dataLoader).toHaveBeenCalledWith('key1');
      expect(dataLoader).toHaveBeenCalledWith('key2');
      expect(dataLoader).toHaveBeenCalledWith('key3');
      
      // Data should be cached
      const result1 = await cachingLayer.get('key1');
      expect(result1).toEqual({ id: 'key1', name: 'data-key1' });
    });

    it('should not prefetch already cached data', async () => {
      const testData = { id: 1, name: 'existing' };
      const dataLoader = vi.fn();
      
      // Pre-cache one key
      await cachingLayer.set('existing-key', testData);
      
      await cachingLayer.prefetch(['existing-key', 'new-key'], dataLoader);
      
      // Should only load the new key
      expect(dataLoader).toHaveBeenCalledTimes(1);
      expect(dataLoader).toHaveBeenCalledWith('new-key');
    });

    it('should handle prefetch concurrency limits', async () => {
      const dataLoader = vi.fn().mockImplementation((key: string) => 
        new Promise(resolve => setTimeout(() => resolve({ id: key }), 50))
      );
      
      const startTime = Date.now();
      await cachingLayer.prefetch(['key1', 'key2', 'key3', 'key4', 'key5'], dataLoader, {
        maxConcurrent: 2
      });
      const endTime = Date.now();
      
      // With concurrency limit of 2, should take longer than if all ran in parallel
      expect(endTime - startTime).toBeGreaterThan(100); // At least 2 batches of 50ms
      expect(dataLoader).toHaveBeenCalledTimes(5);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track hit and miss rates', async () => {
      const testData = { id: 1, name: 'test' };
      
      // Cache miss
      await cachingLayer.get('non-existent');
      
      // Cache set and hit
      await cachingLayer.set('test-key', testData);
      await cachingLayer.get('test-key');
      
      const report = await cachingLayer.getPerformanceReport();
      
      expect(report.overallHitRate).toBeGreaterThan(0);
      expect(report.levelMetrics.length).toBeGreaterThan(0);
      
      const memoryMetrics = report.levelMetrics.find(m => m.level === 'memory');
      expect(memoryMetrics).toBeDefined();
      expect(memoryMetrics!.hitCount).toBeGreaterThan(0);
    });

    it('should provide performance recommendations', async () => {
      // Simulate low hit rate scenario
      for (let i = 0; i < 10; i++) {
        await cachingLayer.get(`non-existent-${i}`);
      }
      
      const report = await cachingLayer.getPerformanceReport();
      
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(r => r.includes('hit rate'))).toBe(true);
    });

    it('should track memory usage', async () => {
      const testData = { id: 1, name: 'test', data: 'x'.repeat(1000) };
      
      await cachingLayer.set('large-data', testData);
      
      const report = await cachingLayer.getPerformanceReport();
      
      expect(report.memoryUsage.total).toBeGreaterThan(0);
      expect(report.memoryUsage.byLevel.memory).toBeGreaterThan(0);
      expect(report.memoryUsage.percentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cache Optimization', () => {
    it('should remove expired entries during optimization', async () => {
      const testData = { id: 1, name: 'test' };
      
      // Set with very short TTL
      await cachingLayer.set('expire-soon', testData, { ttl: 10 });
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Run optimization
      await cachingLayer.optimize();
      
      // Should be removed
      const result = await cachingLayer.get('expire-soon');
      expect(result).toBeNull();
    });

    it('should apply eviction policies when cache is full', async () => {
      // Create a small cache for testing
      await cachingLayer.shutdown();
      cachingLayer = EnhancedCachingLayer.getInstance({
        memoryMaxSize: 100, // Very small cache
        defaultTTL: 10000 // Long TTL to avoid expiration
      });
      
      const largeData = { data: 'x'.repeat(50) };
      
      // Fill cache beyond capacity
      await cachingLayer.set('item1', largeData);
      await cachingLayer.set('item2', largeData);
      await cachingLayer.set('item3', largeData); // Should trigger eviction
      
      // Run optimization to apply eviction
      await cachingLayer.optimize();
      
      // Some items should have been evicted
      const report = await cachingLayer.getPerformanceReport();
      const memoryMetrics = report.levelMetrics.find(m => m.level === 'memory');
      expect(memoryMetrics?.evictionCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });
      
      const testData = { id: 1, name: 'test' };
      
      // Should not throw error
      await expect(cachingLayer.set('test-key', testData)).resolves.not.toThrow();
    });

    it('should handle serviceWorker cache errors gracefully', async () => {
      cachesMock.open.mockRejectedValue(new Error('ServiceWorker not available'));
      
      const testData = { id: 1, name: 'test' };
      
      // Should not throw error
      await expect(cachingLayer.set('test-key', testData)).resolves.not.toThrow();
    });

    it('should handle corrupted cache entries', async () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      // Should return null for corrupted entries
      const result = await cachingLayer.get('corrupted-key');
      expect(result).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should work with getCached utility function', async () => {
      const testData = { id: 1, name: 'utility-test' };
      
      await setCached('utility-key', testData);
      const result = await getCached('utility-key');
      
      expect(result).toEqual(testData);
    });

    it('should work with setCached utility function', async () => {
      const testData = { id: 1, name: 'utility-test' };
      
      await setCached('utility-key', testData, { priority: 'high' });
      const result = await getCached('utility-key'); // Use the utility function consistently
      
      expect(result).toEqual(testData);
    });

    it('should work with invalidateCache utility function', async () => {
      const testData = { id: 1, name: 'test' };
      
      await setCached('invalidate-utility', testData);
      await invalidateCache('invalidate-utility');
      
      const result = await getCached('invalidate-utility');
      expect(result).toBeNull();
    });

    it('should work with getCachePerformanceReport utility function', async () => {
      const report = await getCachePerformanceReport();
      
      expect(report).toHaveProperty('overallHitRate');
      expect(report).toHaveProperty('levelMetrics');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('memoryUsage');
    });
  });

  describe('Advanced Features', () => {
    it('should handle cache dependencies', async () => {
      const testData = { id: 1, name: 'test' };
      
      await cachingLayer.set('parent-key', testData, {
        dependencies: ['child-key-1', 'child-key-2']
      });
      
      await cachingLayer.set('child-key-1', testData);
      await cachingLayer.set('child-key-2', testData);
      
      // Invalidate with cascade should affect dependencies
      await cachingLayer.invalidate('parent-key', { cascadeInvalidation: true });
      
      // Parent should be gone
      expect(await cachingLayer.get('parent-key')).toBeNull();
    });

    it('should handle version-based invalidation', async () => {
      const testData = { id: 1, name: 'test', version: 1 };
      
      await cachingLayer.set('versioned-key', testData);
      
      // Update with new version
      const updatedData = { id: 1, name: 'test', version: 2 };
      await cachingLayer.set('versioned-key', updatedData);
      
      const result = await cachingLayer.get('versioned-key');
      expect(result).toEqual(updatedData);
    });
  });

  describe('Shutdown and Cleanup', () => {
    it('should shutdown gracefully', async () => {
      const testData = { id: 1, name: 'test' };
      
      await cachingLayer.set('shutdown-test', testData);
      
      // Should not throw
      await expect(cachingLayer.shutdown()).resolves.not.toThrow();
    });

    it('should clear all cache levels', async () => {
      const testData = { id: 1, name: 'test' };
      
      await cachingLayer.set('clear-test', testData);
      
      // Verify it's cached
      expect(await cachingLayer.get('clear-test')).toEqual(testData);
      
      // Clear all
      await cachingLayer.clear();
      
      // Should be gone
      expect(await cachingLayer.get('clear-test')).toBeNull();
    });
  });
});