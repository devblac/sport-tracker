/**
 * Cache Performance Tests
 * 
 * Tests cache hit rates, eviction policies, and cache performance
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PerformanceTester } from '../../performance-tester';
import { testCachePerformance, createMockCache, setupPerformanceTestEnvironment } from '../../performance-test-utils';
import { CACHE_PERFORMANCE_TARGETS } from '../../performance-benchmarks';

describe('Cache Performance Tests', () => {
  let performanceTester: PerformanceTester;
  let cleanup: () => void;

  beforeEach(() => {
    const env = setupPerformanceTestEnvironment();
    cleanup = env.cleanup;
    performanceTester = new PerformanceTester();
  });

  afterEach(() => {
    performanceTester.dispose();
    cleanup();
  });

  describe('Cache Hit Rate Tests', () => {
    it('should achieve minimum cache hit rate with typical usage', () => {
      const cache = createMockCache();
      
      // Populate cache with test data
      for (let i = 0; i < 50; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      const operations = [
        // 70% cache hits, 30% misses
        ...Array(70).fill(0).map((_, i) => () => cache.get(`key-${i % 50}`)),
        ...Array(30).fill(0).map((_, i) => () => cache.get(`missing-key-${i}`))
      ];

      const result = testCachePerformance(cache, operations);

      expect(result.hitRate).toBeGreaterThanOrEqual(CACHE_PERFORMANCE_TARGETS.MIN_HIT_RATE);
      expect(result.missRate).toBeLessThanOrEqual(CACHE_PERFORMANCE_TARGETS.MAX_MISS_RATE);
    });

    it('should handle cache eviction properly', () => {
      const cache = createMockCache();
      
      // Fill cache beyond capacity to trigger evictions
      for (let i = 0; i < 150; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      const operations = [
        // Try to access all keys (some will be evicted)
        ...Array(150).fill(0).map((_, i) => () => cache.get(`key-${i}`))
      ];

      const result = testCachePerformance(cache, operations);

      expect(result.finalStats.evictions).toBeGreaterThan(0);
      expect(result.evictionRate).toBeLessThanOrEqual(CACHE_PERFORMANCE_TARGETS.MAX_EVICTION_RATE);
    });

    it('should maintain performance under high load', () => {
      const cache = createMockCache();
      
      // Populate cache
      for (let i = 0; i < 100; i++) {
        cache.set(`key-${i}`, { data: `value-${i}`, timestamp: Date.now() });
      }

      // High-frequency operations
      const operations = [];
      for (let i = 0; i < 1000; i++) {
        if (i % 10 === 0) {
          // 10% writes
          operations.push(() => cache.set(`key-${i % 100}`, { data: `updated-${i}`, timestamp: Date.now() }));
        } else {
          // 90% reads
          operations.push(() => cache.get(`key-${i % 100}`));
        }
      }

      const startTime = performance.now();
      const result = testCachePerformance(cache, operations);
      const endTime = performance.now();

      const operationTime = endTime - startTime;
      const avgOperationTime = operationTime / operations.length;

      expect(result.hitRate).toBeGreaterThanOrEqual(80); // High hit rate under load
      expect(avgOperationTime).toBeLessThan(1); // Less than 1ms per operation
    });
  });

  describe('Cache Memory Performance', () => {
    it('should not leak memory during cache operations', async () => {
      const cache = createMockCache();

      const memoryLeakResult = await performanceTester.detectMemoryLeaks(
        async () => {
          // Perform cache operations
          for (let i = 0; i < 100; i++) {
            cache.set(`temp-key-${i}`, { data: new Array(100).fill(i) });
            cache.get(`temp-key-${i}`);
          }
          
          // Clear cache to free memory
          cache.clear();
        },
        10
      );

      expect(memoryLeakResult.hasLeak).toBe(false);
    });

    it('should handle cache size limits efficiently', () => {
      const cache = createMockCache();
      const initialStats = cache.getStats();

      // Add items up to cache limit
      for (let i = 0; i < 100; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      // Add more items to trigger evictions
      for (let i = 100; i < 150; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      const finalStats = cache.getStats();
      
      expect(finalStats.evictions).toBeGreaterThan(0);
      expect(finalStats.evictions).toBe(50); // Should evict exactly 50 items
    });
  });

  describe('Cache Performance Metrics', () => {
    it('should provide accurate cache metrics', () => {
      const cache = createMockCache();
      
      // Set up known cache state
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const operations = [
        () => cache.get('key1'), // hit
        () => cache.get('key2'), // hit
        () => cache.get('key4'), // miss
        () => cache.get('key1'), // hit
        () => cache.get('key5'), // miss
      ];

      const result = testCachePerformance(cache, operations);

      expect(result.hitRate).toBe(60); // 3 hits out of 5 operations
      expect(result.missRate).toBe(40); // 2 misses out of 5 operations
      expect(result.finalStats.hits).toBe(3);
      expect(result.finalStats.misses).toBe(2);
    });

    it('should track cache performance over time', () => {
      const cache = createMockCache();
      const metrics: Array<{ hitRate: number; timestamp: number }> = [];

      // Simulate cache usage over time
      for (let round = 0; round < 5; round++) {
        // Add some data
        for (let i = 0; i < 20; i++) {
          cache.set(`round-${round}-key-${i}`, `value-${i}`);
        }

        // Access data with varying hit rates
        const operations = [];
        for (let i = 0; i < 50; i++) {
          if (i < 30) {
            // 60% hits - access existing keys
            operations.push(() => cache.get(`round-${round}-key-${i % 20}`));
          } else {
            // 40% misses - access non-existent keys
            operations.push(() => cache.get(`missing-${round}-${i}`));
          }
        }

        const result = testCachePerformance(cache, operations);
        metrics.push({
          hitRate: result.hitRate,
          timestamp: Date.now()
        });
      }

      // Verify consistent performance
      const avgHitRate = metrics.reduce((sum, m) => sum + m.hitRate, 0) / metrics.length;
      expect(avgHitRate).toBeGreaterThanOrEqual(50);
      
      // Verify all rounds had reasonable performance
      metrics.forEach(metric => {
        expect(metric.hitRate).toBeGreaterThanOrEqual(40);
        expect(metric.hitRate).toBeLessThanOrEqual(80);
      });
    });
  });

  describe('Cache Integration Performance', () => {
    it('should integrate cache metrics with performance tester', () => {
      const cache = createMockCache();
      
      // Populate cache
      for (let i = 0; i < 10; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      const cacheMetrics = performanceTester.testCachePerformance(cache);
      
      if (cacheMetrics) {
        expect(cacheMetrics.hitRate).toBeGreaterThanOrEqual(0);
        expect(cacheMetrics.missRate).toBeGreaterThanOrEqual(0);
        expect(cacheMetrics.evictions).toBeGreaterThanOrEqual(0);
        expect(cacheMetrics.hitRate + cacheMetrics.missRate).toBeLessThanOrEqual(100);
      }
    });

    it('should handle cache without stats gracefully', () => {
      const cacheWithoutStats = {
        get: (key: string) => `value-${key}`,
        set: (key: string, value: any) => {},
        delete: (key: string) => true,
        clear: () => {}
      };

      const cacheMetrics = performanceTester.testCachePerformance(cacheWithoutStats);
      expect(cacheMetrics).toBeUndefined();
    });
  });
});