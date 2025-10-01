/**
 * Database Query Optimizer Tests
 * 
 * Comprehensive test suite for the DatabaseQueryOptimizer service.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { 
  DatabaseQueryOptimizer, 
  executeOptimizedQuery, 
  executeBatchQueries,
  getQueryPerformanceReport,
  getCacheStats
} from '../DatabaseQueryOptimizer';

// Mock the Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));

// Mock the connection pool manager
vi.mock('../ConnectionPoolManager', () => ({
  connectionPoolManager: {
    executeQuery: vi.fn()
  }
}));

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('DatabaseQueryOptimizer', () => {
  let optimizer: DatabaseQueryOptimizer;
  let mockExecuteQuery: Mock;

  beforeEach(async () => {
    // Reset singleton instance for each test
    (DatabaseQueryOptimizer as any).instance = undefined;
    
    // Import the mocked module
    const { connectionPoolManager } = await import('../ConnectionPoolManager');
    mockExecuteQuery = connectionPoolManager.executeQuery as Mock;
    mockExecuteQuery.mockClear();
    
    optimizer = DatabaseQueryOptimizer.getInstance({
      cacheMaxSize: 1024 * 1024, // 1MB for testing
      cacheDefaultTTL: 1000, // 1 second for testing
      batchSize: 3,
      batchTimeout: 50,
      slowQueryThreshold: 100,
      enableQueryAnalysis: true,
      enableBatching: true,
      enableCaching: true
    });
  });

  afterEach(async () => {
    await optimizer.shutdown();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a singleton instance', () => {
      const instance1 = DatabaseQueryOptimizer.getInstance();
      const instance2 = DatabaseQueryOptimizer.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default configuration', () => {
      const stats = optimizer.getCacheStats();
      expect(stats.entryCount).toBe(0);
      expect(stats.size).toBe(0);
    });
  });

  describe('Query Execution with Caching', () => {
    it('should execute query and cache result', async () => {
      const mockResult = { data: [{ id: 1, name: 'test' }] };
      mockExecuteQuery.mockResolvedValue(mockResult);

      const result = await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'test-query',
        { table: 'test_table', enableCache: true }
      );

      expect(result).toEqual(mockResult);
      expect(mockExecuteQuery).toHaveBeenCalledOnce();

      // Check cache stats
      const stats = optimizer.getCacheStats();
      expect(stats.entryCount).toBe(1);
    });

    it('should return cached result on second call', async () => {
      const mockResult = { data: [{ id: 1, name: 'test' }] };
      mockExecuteQuery.mockResolvedValue(mockResult);

      // First call
      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'cached-query',
        { table: 'test_table', enableCache: true }
      );

      // Second call should use cache
      const result = await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'cached-query',
        { table: 'test_table', enableCache: true }
      );

      expect(result).toEqual(mockResult);
      expect(mockExecuteQuery).toHaveBeenCalledOnce(); // Should only be called once
    });

    it('should not cache when caching is disabled', async () => {
      const mockResult = { data: [{ id: 1, name: 'test' }] };
      mockExecuteQuery.mockResolvedValue(mockResult);

      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'no-cache-query',
        { table: 'test_table', enableCache: false }
      );

      const stats = optimizer.getCacheStats();
      expect(stats.entryCount).toBe(0);
    });

    it('should handle cache expiration', async () => {
      const mockResult = { data: [{ id: 1, name: 'test' }] };
      mockExecuteQuery.mockResolvedValue(mockResult);

      // First call with short TTL
      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'expire-query',
        { table: 'test_table', cacheTTL: 10 } // 10ms TTL
      );

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      // Second call should execute query again
      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'expire-query',
        { table: 'test_table', cacheTTL: 10 }
      );

      expect(mockExecuteQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('Batch Query Processing', () => {
    it('should execute multiple queries in batches', async () => {
      const mockResults = [
        { data: [{ id: 1 }] },
        { data: [{ id: 2 }] },
        { data: [{ id: 3 }] },
        { data: [{ id: 4 }] }
      ];

      mockExecuteQuery.mockImplementation((op) => op());

      const operations = mockResults.map((result, index) => ({
        operation: () => Promise.resolve(result),
        queryId: `batch-query-${index}`,
        options: { table: 'test_table' }
      }));

      const results = await optimizer.executeBatchQueries(operations, {
        maxBatchSize: 2
      });

      expect(results).toEqual(mockResults);
      expect(mockExecuteQuery).toHaveBeenCalledTimes(4);
    });

    it('should handle batch processing with different priorities', async () => {
      const operations = [
        {
          operation: () => Promise.resolve({ data: 'high' }),
          queryId: 'high-priority',
          options: { priority: 'high' as const }
        },
        {
          operation: () => Promise.resolve({ data: 'normal' }),
          queryId: 'normal-priority',
          options: { priority: 'normal' as const }
        }
      ];

      mockExecuteQuery.mockImplementation((op) => op());

      const results = await optimizer.executeBatchQueries(operations);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ data: 'high' });
      expect(results[1]).toEqual({ data: 'normal' });
    });

    it('should fall back to individual execution when batching is disabled', async () => {
      await optimizer.shutdown();
      optimizer = DatabaseQueryOptimizer.getInstance({
        enableBatching: false
      });

      const operations = [
        {
          operation: () => Promise.resolve({ data: 'test1' }),
          queryId: 'no-batch-1'
        },
        {
          operation: () => Promise.resolve({ data: 'test2' }),
          queryId: 'no-batch-2'
        }
      ];

      mockExecuteQuery.mockImplementation((op) => op());

      const results = await optimizer.executeBatchQueries(operations);

      expect(results).toHaveLength(2);
      expect(mockExecuteQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('Query Analysis and Performance Monitoring', () => {
    it('should analyze slow queries', async () => {
      const slowOperation = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'slow' }), 150)
      );

      mockExecuteQuery.mockImplementation((op) => op());

      await optimizer.executeOptimizedQuery(
        slowOperation,
        'slow-query',
        { table: 'slow_table' }
      );

      const analysis = await optimizer.analyzeQuery('slow-query', 'slow_table', 'SELECT');
      
      expect(analysis.queryId).toBe('slow-query');
      expect(analysis.table).toBe('slow_table');
      expect(analysis.suggestedOptimizations.length).toBeGreaterThan(0);
    });

    it('should generate performance report', async () => {
      const mockResult = { data: 'test' };
      mockExecuteQuery.mockResolvedValue(mockResult);

      // Execute several queries
      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'perf-query-1',
        { table: 'table1' }
      );

      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'perf-query-2',
        { table: 'table2' }
      );

      const report = optimizer.getPerformanceReport();

      expect(report.totalQueries).toBe(2);
      expect(report.averageExecutionTime).toBeGreaterThanOrEqual(0);
      expect(report.topTables).toHaveLength(2);
    });

    it('should track cache hit rates', async () => {
      const mockResult = { data: 'cached' };
      mockExecuteQuery.mockResolvedValue(mockResult);

      // First call - cache miss
      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'hit-rate-query',
        { table: 'cache_table' }
      );

      // Second call - cache hit
      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'hit-rate-query',
        { table: 'cache_table' }
      );

      const report = optimizer.getPerformanceReport();
      expect(report.cacheHitRate).toBe(0.5); // 1 hit out of 2 queries
    });
  });

  describe('Cache Management', () => {
    it('should evict least recently used entries when cache is full', async () => {
      // Create a small cache for testing
      await optimizer.shutdown();
      optimizer = DatabaseQueryOptimizer.getInstance({
        cacheMaxSize: 100, // Very small cache
        cacheDefaultTTL: 10000 // Long TTL
      });

      const largeResult = { data: 'x'.repeat(50) }; // Large result
      mockExecuteQuery.mockResolvedValue(largeResult);

      // Fill cache beyond capacity
      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(largeResult),
        'large-query-1',
        { enableCache: true }
      );

      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(largeResult),
        'large-query-2',
        { enableCache: true }
      );

      const stats = optimizer.getCacheStats();
      expect(stats.entryCount).toBeLessThanOrEqual(2);
    });

    it('should clear cache when requested', async () => {
      const mockResult = { data: 'test' };
      mockExecuteQuery.mockResolvedValue(mockResult);

      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'clear-test',
        { enableCache: true }
      );

      let stats = optimizer.getCacheStats();
      expect(stats.entryCount).toBe(1);

      optimizer.clearCache();

      stats = optimizer.getCacheStats();
      expect(stats.entryCount).toBe(0);
      expect(stats.size).toBe(0);
    });

    it('should provide detailed cache statistics', async () => {
      const mockResult = { data: 'stats-test' };
      mockExecuteQuery.mockResolvedValue(mockResult);

      // Execute query multiple times to generate hits
      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'stats-query',
        { enableCache: true }
      );

      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'stats-query',
        { enableCache: true }
      );

      const stats = optimizer.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('entryCount');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('topEntries');
      expect(stats.topEntries).toHaveLength(1);
      expect(stats.topEntries[0].hitCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle query execution errors', async () => {
      const error = new Error('Database connection failed');
      mockExecuteQuery.mockRejectedValue(error);

      await expect(
        optimizer.executeOptimizedQuery(
          () => Promise.reject(error),
          'error-query',
          { table: 'error_table' }
        )
      ).rejects.toThrow('Database connection failed');

      const report = optimizer.getPerformanceReport();
      expect(report.totalQueries).toBe(1);
    });

    it('should handle batch processing errors gracefully', async () => {
      const operations = [
        {
          operation: () => Promise.resolve({ data: 'success' }),
          queryId: 'success-query'
        },
        {
          operation: () => Promise.reject(new Error('Batch error')),
          queryId: 'error-query'
        }
      ];

      mockExecuteQuery.mockImplementation((op) => op());

      // Should not throw, but handle errors internally
      const results = await Promise.allSettled(
        operations.map(op => 
          optimizer.executeOptimizedQuery(op.operation, op.queryId)
        )
      );

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });

  describe('Utility Functions', () => {
    it('should execute optimized query via utility function', async () => {
      const mockResult = { data: 'utility-test' };
      mockExecuteQuery.mockResolvedValue(mockResult);

      const result = await executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'utility-query',
        { table: 'utility_table' }
      );

      expect(result).toEqual(mockResult);
    });

    it('should execute batch queries via utility function', async () => {
      const operations = [
        {
          operation: () => Promise.resolve({ data: 'batch1' }),
          queryId: 'utility-batch-1'
        },
        {
          operation: () => Promise.resolve({ data: 'batch2' }),
          queryId: 'utility-batch-2'
        }
      ];

      mockExecuteQuery.mockImplementation((op) => op());

      const results = await executeBatchQueries(operations);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ data: 'batch1' });
      expect(results[1]).toEqual({ data: 'batch2' });
    });

    it('should get performance report via utility function', async () => {
      const mockResult = { data: 'report-test' };
      mockExecuteQuery.mockResolvedValue(mockResult);

      await executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'report-query'
      );

      const report = getQueryPerformanceReport();
      expect(report.totalQueries).toBeGreaterThan(0);
    });

    it('should get cache stats via utility function', async () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('entryCount');
    });
  });

  describe('Shutdown and Cleanup', () => {
    it('should shutdown gracefully', async () => {
      const mockResult = { data: 'shutdown-test' };
      mockExecuteQuery.mockResolvedValue(mockResult);

      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'shutdown-query',
        { enableCache: true }
      );

      let stats = optimizer.getCacheStats();
      expect(stats.entryCount).toBe(1);

      await optimizer.shutdown();

      stats = optimizer.getCacheStats();
      expect(stats.entryCount).toBe(0);
    });
  });

  describe('Query Analysis Features', () => {
    it('should provide index recommendations for common tables', async () => {
      // First execute a query to generate metrics
      const mockResult = { data: 'workout-data' };
      mockExecuteQuery.mockResolvedValue(mockResult);

      await optimizer.executeOptimizedQuery(
        () => Promise.resolve(mockResult),
        'workout-query',
        { table: 'workout_sessions' }
      );

      const analysis = await optimizer.analyzeQuery(
        'workout-query',
        'workout_sessions',
        'SELECT'
      );

      expect(analysis.indexRecommendations.length).toBeGreaterThan(0);
      expect(analysis.indexRecommendations.some(rec => 
        rec.includes('idx_workout_sessions_user_id')
      )).toBe(true);
    });

    it('should suggest optimizations for slow queries', async () => {
      // Simulate slow query metrics
      const slowOperation = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'slow' }), 200)
      );

      mockExecuteQuery.mockImplementation((op) => op());

      await optimizer.executeOptimizedQuery(
        slowOperation,
        'optimization-query',
        { table: 'slow_table' }
      );

      const analysis = await optimizer.analyzeQuery(
        'optimization-query',
        'slow_table',
        'SELECT'
      );

      expect(analysis.suggestedOptimizations).toContain('Consider adding database indexes');
      expect(analysis.suggestedOptimizations).toContain('Review query filters and joins');
    });
  });
});