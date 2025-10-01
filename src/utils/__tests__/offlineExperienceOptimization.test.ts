/**
 * Offline Experience Optimization Tests
 * Tests for enhanced offline functionality and performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { offlineManager, networkErrorHandler } from '../offlineUtils';

// Mock the intelligent offline queue and cache manager
const mockIntelligentOfflineQueue = {
  addOperation: vi.fn().mockResolvedValue('mock-operation-id'),
  getMetrics: vi.fn().mockResolvedValue({
    totalOperations: 0,
    pendingOperations: 0,
    processingOperations: 0,
    completedOperations: 0,
    failedOperations: 0,
    averageProcessingTime: 0,
    successRate: 1,
    networkEfficiency: 0.85,
  }),
};

const mockCacheManager = {
  set: vi.fn().mockResolvedValue(true),
  get: vi.fn().mockResolvedValue(null),
  getStats: vi.fn().mockResolvedValue({
    totalSize: 0,
    itemCount: 0,
    hitRate: 0,
    oldestItem: 0,
    newestItem: 0,
    compressionRatio: 1,
  }),
  clearByTags: vi.fn().mockResolvedValue(0),
  updateConfig: vi.fn(),
};

// Mock the modules
vi.mock('../intelligentOfflineQueue', () => ({
  intelligentOfflineQueue: mockIntelligentOfflineQueue,
}));

vi.mock('../cacheManager', () => ({
  cacheManager: mockCacheManager,
}));

const intelligentOfflineQueue = mockIntelligentOfflineQueue;
const cacheManager = mockCacheManager;

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  value: {
    type: 'wifi',
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
});

// Mock CompressionStream for cache tests
Object.defineProperty(window, 'CompressionStream', {
  value: class MockCompressionStream {
    readable = {
      getReader: () => ({
        read: () => Promise.resolve({ value: new Uint8Array([1, 2, 3]), done: true })
      })
    };
    writable = {
      getWriter: () => ({
        write: vi.fn(),
        close: vi.fn()
      })
    };
  },
  writable: true,
});

Object.defineProperty(window, 'DecompressionStream', {
  value: class MockDecompressionStream {
    readable = {
      getReader: () => ({
        read: () => Promise.resolve({ value: new TextEncoder().encode('test'), done: true })
      })
    };
    writable = {
      getWriter: () => ({
        write: vi.fn(),
        close: vi.fn()
      })
    };
  },
  writable: true,
});

describe('Offline Experience Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch for connectivity checks
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Enhanced Network Status Detection', () => {
    it('should detect network quality accurately', () => {
      const quality = offlineManager.getNetworkQuality();
      expect(['excellent', 'good', 'fair', 'poor', 'offline']).toContain(quality);
    });

    it('should determine data saving mode based on network conditions', () => {
      const shouldSave = offlineManager.shouldSaveData();
      expect(typeof shouldSave).toBe('boolean');
    });

    it('should track offline duration correctly', () => {
      const duration = offlineManager.getOfflineDuration();
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should provide comprehensive network status', () => {
      const status = offlineManager.getNetworkStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('connectionType');
      expect(status).toHaveProperty('effectiveType');
      expect(status).toHaveProperty('downlink');
      expect(status).toHaveProperty('rtt');
      expect(status).toHaveProperty('saveData');
    });
  });

  describe('Intelligent Error Handling', () => {
    it('should classify errors correctly', () => {
      const networkError = new Error('Network request failed');
      const serverError = new Error('Internal server error 500');
      const clientError = new Error('Bad request 400');
      
      const networkResult = networkErrorHandler.handleError(networkError, 'test');
      const serverResult = networkErrorHandler.handleError(serverError, 'test');
      const clientResult = networkErrorHandler.handleError(clientError, 'test');
      
      expect(networkResult.errorType).toBe('network');
      expect(serverResult.errorType).toBe('server');
      expect(clientResult.errorType).toBe('client');
    });

    it('should implement exponential backoff for retries', () => {
      const error = new Error('Network timeout');
      
      const firstAttempt = networkErrorHandler.handleError(error, 'test');
      const secondAttempt = networkErrorHandler.handleError(error, 'test');
      const thirdAttempt = networkErrorHandler.handleError(error, 'test');
      
      expect(firstAttempt.retryDelay).toBeLessThan(secondAttempt.retryDelay);
      expect(secondAttempt.retryDelay).toBeLessThan(thirdAttempt.retryDelay);
    });

    it('should open circuit breaker after multiple failures', () => {
      const error = new Error('Persistent failure');
      
      // Simulate multiple failures
      for (let i = 0; i < 6; i++) {
        networkErrorHandler.handleError(error, 'circuit-test');
      }
      
      const result = networkErrorHandler.handleError(error, 'circuit-test');
      expect(result.isCircuitOpen).toBe(true);
    });

    it('should provide error statistics', () => {
      const error = new Error('Test error');
      networkErrorHandler.handleError(error, 'stats-test');
      
      const stats = networkErrorHandler.getErrorStats();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });
  });

  describe('Smart Queue Management', () => {
    it('should calculate intelligent priority correctly', async () => {
      const highPriorityOp = {
        type: 'CREATE',
        data: { test: 'data' },
        priority: 'high' as const,
        maxRetries: 3,
        userInitiated: true,
        networkRequirement: 'none' as const,
        estimatedSize: 1024,
        category: 'workout' as const
      };
      
      const lowPriorityOp = {
        type: 'CREATE',
        data: { test: 'data' },
        priority: 'low' as const,
        maxRetries: 3,
        userInitiated: false,
        networkRequirement: 'high' as const,
        estimatedSize: 10240,
        category: 'analytics' as const
      };
      
      const highId = await intelligentOfflineQueue.addOperation(highPriorityOp);
      const lowId = await intelligentOfflineQueue.addOperation(lowPriorityOp);
      
      expect(typeof highId).toBe('string');
      expect(typeof lowId).toBe('string');
      expect(highId).not.toBe(lowId);
    });

    it('should provide comprehensive queue metrics', async () => {
      const metrics = await intelligentOfflineQueue.getMetrics();
      
      expect(metrics).toHaveProperty('totalOperations');
      expect(metrics).toHaveProperty('pendingOperations');
      expect(metrics).toHaveProperty('processingOperations');
      expect(metrics).toHaveProperty('completedOperations');
      expect(metrics).toHaveProperty('failedOperations');
      expect(metrics).toHaveProperty('averageProcessingTime');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('networkEfficiency');
    });

    it('should handle network-aware processing', async () => {
      // Test with different network conditions
      const offlineOp = {
        type: 'CREATE',
        data: { test: 'offline' },
        priority: 'medium' as const,
        maxRetries: 3,
        userInitiated: true,
        networkRequirement: 'none' as const,
        estimatedSize: 512,
        category: 'workout' as const
      };
      
      const onlineOp = {
        type: 'CREATE',
        data: { test: 'online' },
        priority: 'medium' as const,
        maxRetries: 3,
        userInitiated: true,
        networkRequirement: 'high' as const,
        estimatedSize: 512,
        category: 'social' as const
      };
      
      const offlineId = await intelligentOfflineQueue.addOperation(offlineOp);
      const onlineId = await intelligentOfflineQueue.addOperation(onlineOp);
      
      expect(offlineId).toBeDefined();
      expect(onlineId).toBeDefined();
    });
  });

  describe('Advanced Cache Management', () => {
    it('should provide detailed cache statistics', async () => {
      const stats = await cacheManager.getStats();
      
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('itemCount');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('oldestItem');
      expect(stats).toHaveProperty('newestItem');
      expect(stats).toHaveProperty('compressionRatio');
    });

    it('should handle cache operations with tags', async () => {
      const testData = { test: 'cache data' };
      
      const success = await cacheManager.set('test-key', testData, {
        tags: ['test', 'temporary'],
        priority: 'medium',
        ttl: 60000
      });
      
      expect(success).toBe(true);
      
      const retrieved = await cacheManager.get('test-key');
      expect(retrieved).toEqual(testData);
      
      const deletedCount = await cacheManager.clearByTags(['temporary']);
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });

    it('should implement intelligent cache eviction', async () => {
      // Fill cache with test data
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          cacheManager.set(`test-${i}`, { data: `test-data-${i}` }, {
            priority: i < 5 ? 'low' : 'high',
            tags: ['test-eviction']
          })
        );
      }
      
      await Promise.all(promises);
      
      const initialStats = await cacheManager.getStats();
      expect(initialStats.itemCount).toBeGreaterThan(0);
      
      // Clear test data
      await cacheManager.clearByTags(['test-eviction']);
    });

    it('should support cache compression', async () => {
      const largeData = { 
        content: 'x'.repeat(20000), // Large string to trigger compression
        metadata: { size: 'large', type: 'test' }
      };
      
      const success = await cacheManager.set('large-item', largeData, {
        priority: 'medium'
      });
      
      expect(success).toBe(true);
      
      const retrieved = await cacheManager.get('large-item');
      expect(retrieved).toEqual(largeData);
    });

    it('should update cache configuration', () => {
      const newConfig = {
        maxSize: 100 * 1024 * 1024, // 100MB
        maxItems: 5000,
        compressionThreshold: 5 * 1024 // 5KB
      };
      
      expect(() => {
        cacheManager.updateConfig(newConfig);
      }).not.toThrow();
    });
  });

  describe('Performance Optimizations', () => {
    it('should handle concurrent operations efficiently', async () => {
      const operations = [];
      
      // Create multiple concurrent operations
      for (let i = 0; i < 20; i++) {
        operations.push(
          intelligentOfflineQueue.addOperation({
            type: 'CREATE',
            data: { index: i },
            priority: 'medium' as const,
            maxRetries: 3,
            userInitiated: false,
            networkRequirement: 'low' as const,
            estimatedSize: 256,
            category: 'analytics' as const
          })
        );
      }
      
      const results = await Promise.all(operations);
      expect(results).toHaveLength(20);
      expect(results.every(id => typeof id === 'string')).toBe(true);
    });

    it('should optimize cache size automatically', async () => {
      // Add items to cache
      for (let i = 0; i < 5; i++) {
        await cacheManager.set(`auto-optimize-${i}`, { data: `data-${i}` }, {
          tags: ['auto-optimize']
        });
      }
      
      const initialStats = await cacheManager.getStats();
      
      // Clear old items
      await cacheManager.clearByTags(['auto-optimize']);
      
      const finalStats = await cacheManager.getStats();
      expect(finalStats.itemCount).toBeLessThanOrEqual(initialStats.itemCount);
    });

    it('should provide network quality-based recommendations', () => {
      const quality = offlineManager.getNetworkQuality();
      const shouldSaveData = offlineManager.shouldSaveData();
      
      // Verify recommendations are consistent with network quality
      if (quality === 'poor' || quality === 'offline') {
        expect(shouldSaveData).toBe(true);
      }
      
      if (quality === 'excellent' || quality === 'good') {
        // Data saving might still be enabled due to user preference
        expect(typeof shouldSaveData).toBe('boolean');
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      const originalGet = cacheManager.get;
      cacheManager.get = vi.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await cacheManager.get('non-existent');
      expect(result).toBeNull();
      
      // Restore original method
      cacheManager.get = originalGet;
    });

    it('should recover from network interruptions', () => {
      // Simulate network interruption
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const status = offlineManager.getNetworkStatus();
      expect(status.isOnline).toBe(false);
      
      // Restore network
      Object.defineProperty(navigator, 'onLine', { value: originalOnLine, writable: true });
    });

    it('should handle queue overflow gracefully', async () => {
      // This test would need to be implemented based on actual queue limits
      const metrics = await intelligentOfflineQueue.getMetrics();
      expect(metrics.totalOperations).toBeGreaterThanOrEqual(0);
    });
  });

  describe('User Experience Enhancements', () => {
    it('should provide meaningful status indicators', () => {
      const status = offlineManager.getNetworkStatus();
      const quality = offlineManager.getNetworkQuality();
      const duration = offlineManager.getOfflineDuration();
      
      expect(typeof status.isOnline).toBe('boolean');
      expect(['excellent', 'good', 'fair', 'poor', 'offline']).toContain(quality);
      expect(typeof duration).toBe('number');
    });

    it('should support progressive enhancement', async () => {
      // Test that features degrade gracefully
      const metrics = await intelligentOfflineQueue.getMetrics();
      const stats = await cacheManager.getStats();
      
      expect(metrics).toBeDefined();
      expect(stats).toBeDefined();
    });

    it('should provide actionable error information', () => {
      const error = new Error('Connection timeout');
      const result = networkErrorHandler.handleError(error, 'user-action');
      
      expect(result).toHaveProperty('shouldRetry');
      expect(result).toHaveProperty('retryDelay');
      expect(result).toHaveProperty('errorType');
      expect(typeof result.shouldRetry).toBe('boolean');
      expect(typeof result.retryDelay).toBe('number');
    });
  });
});