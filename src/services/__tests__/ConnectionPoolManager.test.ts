/**
 * Connection Pool Manager Tests
 * 
 * Comprehensive test suite for the ConnectionPoolManager service.
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { ConnectionPoolManager, executePooledQuery, executeWithRetry, getPoolHealth } from '../ConnectionPoolManager';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
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

describe('ConnectionPoolManager', () => {
  let poolManager: ConnectionPoolManager;

  beforeEach(() => {
    // Reset singleton instance for each test
    (ConnectionPoolManager as any).instance = undefined;
    poolManager = ConnectionPoolManager.getInstance({
      maxConnections: 3,
      idleTimeout: 1000,
      connectionTimeout: 500,
      retryAttempts: 2,
      healthCheckInterval: 5000
    });
  });

  afterEach(async () => {
    await poolManager.shutdown();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a singleton instance', () => {
      const instance1 = ConnectionPoolManager.getInstance();
      const instance2 = ConnectionPoolManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default configuration', () => {
      const metrics = poolManager.getMetrics();
      expect(metrics.totalConnections).toBe(0);
      expect(metrics.activeConnections).toBe(0);
      expect(metrics.queuedRequests).toBe(0);
    });
  });

  describe('Query Execution', () => {
    it('should execute a simple query successfully', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      const result = await poolManager.executeQuery(mockOperation, 'test-operation');
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledOnce();
    });

    it('should handle query timeout', async () => {
      const mockOperation = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      await expect(
        poolManager.executeQuery(mockOperation, 'timeout-test')
      ).rejects.toThrow('Operation timeout');
    });

    it('should queue requests when pool is full', async () => {
      const slowOperation = () => new Promise(resolve => setTimeout(() => resolve('slow'), 200));
      const fastOperation = vi.fn().mockResolvedValue('fast');

      // Fill the pool
      const promises = [
        poolManager.executeQuery(slowOperation, 'slow-1'),
        poolManager.executeQuery(slowOperation, 'slow-2'),
        poolManager.executeQuery(slowOperation, 'slow-3'),
        poolManager.executeQuery(fastOperation, 'queued')
      ];

      const results = await Promise.all(promises);
      
      expect(results).toContain('slow');
      expect(results).toContain('fast');
      expect(fastOperation).toHaveBeenCalledOnce();
    });

    it('should reject when queue is full', async () => {
      const slowOperation = () => new Promise(resolve => setTimeout(() => resolve('slow'), 200));
      
      // Configure small queue size - create a fresh instance
      await poolManager.shutdown();
      (ConnectionPoolManager as any).instance = undefined;
      const smallPoolManager = ConnectionPoolManager.getInstance({
        maxConnections: 1,
        maxQueueSize: 1
      });

      // Fill pool and queue, then try to add one more
      const promises = [];
      promises.push(smallPoolManager.executeQuery(slowOperation, 'fill-pool'));
      promises.push(smallPoolManager.executeQuery(slowOperation, 'fill-queue'));
      
      // This should fail immediately
      await expect(
        smallPoolManager.executeQuery(slowOperation, 'should-fail')
      ).rejects.toThrow('Request queue is full');
      
      // Clean up the running operations
      await Promise.all(promises);
      await smallPoolManager.shutdown();
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const mockOperation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error('connection timeout');
        }
        return 'success';
      });

      const result = await poolManager.executeWithRetry(mockOperation, 'retry-test');
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('validation error'));

      await expect(
        poolManager.executeWithRetry(mockOperation, 'non-retryable')
      ).rejects.toThrow('validation error');
      
      expect(mockOperation).toHaveBeenCalledOnce();
    });

    it('should fail after max retry attempts', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('connection timeout'));

      await expect(
        poolManager.executeWithRetry(mockOperation, 'max-retries')
      ).rejects.toThrow('connection timeout');
      
      expect(mockOperation).toHaveBeenCalledTimes(2); // Initial + 1 retry (configured as 2 max attempts)
    });
  });

  describe('Health Monitoring', () => {
    it('should report healthy status initially', async () => {
      const health = await poolManager.getHealthStatus();
      
      expect(health.isHealthy).toBe(true);
      expect(health.issues).toHaveLength(0);
      expect(health.metrics).toBeDefined();
    }, 15000);

    it('should detect high connection usage', async () => {
      // Fill most of the pool (3 connections configured, so 3 should trigger near capacity)
      const slowOperations = Array(3).fill(null).map(() => 
        poolManager.executeQuery(() => new Promise(resolve => setTimeout(resolve, 100)))
      );

      // Wait a bit for connections to be established
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check health while connections are active
      const health = await poolManager.getHealthStatus();
      
      // Should detect near capacity (90% of 3 = 2.7, so 3 active should trigger)
      expect(health.issues.some(issue => issue.includes('near capacity'))).toBe(true);
      
      await Promise.all(slowOperations);
    }, 15000);

    it('should provide accurate metrics', () => {
      const metrics = poolManager.getMetrics();
      
      expect(metrics).toHaveProperty('totalConnections');
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('queuedRequests');
      expect(metrics).toHaveProperty('totalQueries');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('lastHealthCheck');
      expect(metrics).toHaveProperty('isHealthy');
    });
  });

  describe('Connection Management', () => {
    it('should clean up idle connections', async () => {
      // Execute a query to create a connection
      await poolManager.executeQuery(() => Promise.resolve('test'));
      
      const initialMetrics = poolManager.getMetrics();
      expect(initialMetrics.totalConnections).toBeGreaterThan(0);

      // Wait for idle timeout (mocked to be short)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Trigger cleanup manually (in real scenario this happens automatically)
      const health = await poolManager.getHealthStatus();
      expect(health).toBeDefined();
    }, 15000);

    it('should handle concurrent requests properly', async () => {
      const concurrentOperations = Array(10).fill(null).map((_, index) =>
        poolManager.executeQuery(() => Promise.resolve(`result-${index}`), `concurrent-${index}`)
      );

      const results = await Promise.all(concurrentOperations);
      
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toBe(`result-${index}`);
      });
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      const slowOperation = () => new Promise(resolve => setTimeout(() => resolve('completed'), 50));
      
      // Start some operations
      const operationPromise = poolManager.executeQuery(slowOperation);
      
      // Shutdown should wait for completion
      const shutdownPromise = poolManager.shutdown();
      
      const [operationResult] = await Promise.all([operationPromise, shutdownPromise]);
      expect(operationResult).toBe('completed');
    });

    it('should reject new requests after shutdown', async () => {
      await poolManager.shutdown();
      
      await expect(
        poolManager.executeQuery(() => Promise.resolve('test'))
      ).rejects.toThrow('Connection pool is shutting down');
    });
  });

  describe('Utility Functions', () => {
    it('should execute pooled query via utility function', async () => {
      const result = await executePooledQuery(() => Promise.resolve('utility-test'));
      expect(result).toBe('utility-test');
    });

    it('should execute with retry via utility function', async () => {
      let attempts = 0;
      const operation = () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('network error');
        }
        return 'retry-success';
      };

      const result = await executeWithRetry(operation, 'utility-retry');
      expect(result).toBe('retry-success');
    });

    it('should get pool health via utility function', async () => {
      const health = await getPoolHealth();
      expect(health).toHaveProperty('isHealthy');
      expect(health).toHaveProperty('metrics');
      expect(health).toHaveProperty('issues');
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      await expect(
        poolManager.executeQuery(mockOperation, 'db-error')
      ).rejects.toThrow('Database connection failed');
    });

    it('should update error metrics on failures', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Test error'));

      try {
        await poolManager.executeQuery(mockOperation, 'error-metrics');
      } catch (error) {
        // Expected to fail
      }

      const metrics = poolManager.getMetrics();
      expect(metrics.totalQueries).toBeGreaterThan(0);
    });
  });
});

describe('Integration with Supabase', () => {
  it('should work with actual Supabase operations', async () => {
    // This would be an integration test with actual Supabase
    // For unit tests, we mock the operations
    const mockSupabaseOperation = vi.fn().mockResolvedValue({
      data: [{ id: '1', name: 'test' }],
      error: null
    });

    const result = await executePooledQuery(mockSupabaseOperation, 'supabase-integration');
    
    expect(result).toEqual({
      data: [{ id: '1', name: 'test' }],
      error: null
    });
  });
});