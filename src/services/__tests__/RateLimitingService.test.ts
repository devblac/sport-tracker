import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  RateLimitingService, 
  RateLimitOperation, 
  RateLimitError,
  getRateLimitingService,
  initializeRateLimitingService
} from '../RateLimitingService';

describe('RateLimitingService', () => {
  let service: RateLimitingService;
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.useFakeTimers();
    service = new RateLimitingService();
  });

  afterEach(() => {
    service.destroy();
    vi.useRealTimers();
  });

  describe('Rate Limit Checking', () => {
    it('should allow requests within limits', async () => {
      const result = await service.checkRateLimit(userId, RateLimitOperation.API_GENERAL);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(100); // Not consumed yet
      expect(result.headers['X-RateLimit-Limit']).toBe('100');
      expect(result.headers['X-RateLimit-Remaining']).toBe('100');
    });

    it('should deny requests when limit exceeded', async () => {
      // Make requests up to the limit (5 for login)
      for (let i = 0; i < 5; i++) {
        await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);
      }

      const result = await service.checkRateLimit(userId, RateLimitOperation.LOGIN);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.headers['Retry-After']).toBeDefined();
    });

    it('should reset limits after window expires', async () => {
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);
      }

      // Verify limit is exceeded
      let result = await service.checkRateLimit(userId, RateLimitOperation.LOGIN);
      expect(result.allowed).toBe(false);

      // Advance time past the window (15 minutes for login)
      vi.advanceTimersByTime(16 * 60 * 1000);

      // Should be allowed again
      result = await service.checkRateLimit(userId, RateLimitOperation.LOGIN);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5); // Window reset, not consumed yet
    });

    it('should handle different users independently', async () => {
      const user1 = 'user1';
      const user2 = 'user2';

      // Exhaust limit for user1
      for (let i = 0; i < 5; i++) {
        await service.consumeRateLimit(user1, RateLimitOperation.LOGIN);
      }

      // User1 should be blocked
      const result1 = await service.checkRateLimit(user1, RateLimitOperation.LOGIN);
      expect(result1.allowed).toBe(false);

      // User2 should still be allowed
      const result2 = await service.checkRateLimit(user2, RateLimitOperation.LOGIN);
      expect(result2.allowed).toBe(true);
    });

    it('should handle different operations independently', async () => {
      // Exhaust login limit
      for (let i = 0; i < 5; i++) {
        await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);
      }

      // Login should be blocked
      const loginResult = await service.checkRateLimit(userId, RateLimitOperation.LOGIN);
      expect(loginResult.allowed).toBe(false);

      // API general should still be allowed
      const apiResult = await service.checkRateLimit(userId, RateLimitOperation.API_GENERAL);
      expect(apiResult.allowed).toBe(true);
    });
  });

  describe('Rate Limit Consumption', () => {
    it('should consume rate limit when allowed', async () => {
      const result = await service.consumeRateLimit(userId, RateLimitOperation.API_GENERAL);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99); // 100 - 1 (consumed)
    });

    it('should throw RateLimitError when limit exceeded', async () => {
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);
      }

      // Next request should throw
      await expect(
        service.consumeRateLimit(userId, RateLimitOperation.LOGIN)
      ).rejects.toThrow(RateLimitError);
    });

    it('should include rate limit result in error', async () => {
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);
      }

      try {
        await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);
        expect.fail('Should have thrown RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        const rateLimitError = error as RateLimitError;
        expect(rateLimitError.rateLimitResult.allowed).toBe(false);
        expect(rateLimitError.rateLimitResult.remaining).toBe(0);
        expect(rateLimitError.rateLimitResult.retryAfter).toBeGreaterThan(0);
      }
    });
  });

  describe('Rate Limit Status', () => {
    it('should return status without consuming', async () => {
      // Get initial status
      const status1 = await service.getRateLimitStatus(userId, RateLimitOperation.LOGIN);
      expect(status1.remaining).toBe(5);

      // Get status again - should be the same
      const status2 = await service.getRateLimitStatus(userId, RateLimitOperation.LOGIN);
      expect(status2.remaining).toBe(5);

      // Actually consume one
      await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);

      // Status should now show one less
      const status3 = await service.getRateLimitStatus(userId, RateLimitOperation.LOGIN);
      expect(status3.remaining).toBe(4);
    });

    it('should return correct status for new user', async () => {
      const status = await service.getRateLimitStatus('new-user', RateLimitOperation.LOGIN);
      
      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(5);
      expect(status.retryAfter).toBeUndefined();
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset rate limit for specific operation', async () => {
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);
      }

      // Verify limit is exceeded
      let status = await service.getRateLimitStatus(userId, RateLimitOperation.LOGIN);
      expect(status.allowed).toBe(false);

      // Reset the limit
      await service.resetRateLimit(userId, RateLimitOperation.LOGIN);

      // Should be allowed again
      status = await service.getRateLimitStatus(userId, RateLimitOperation.LOGIN);
      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(5);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration for operation', () => {
      const newConfig = {
        windowMs: 30000, // 30 seconds
        maxRequests: 10,
        message: 'Custom message',
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
      };

      service.updateConfig(RateLimitOperation.LOGIN, newConfig);
      
      const configs = service.getConfigs();
      expect(configs[RateLimitOperation.LOGIN]).toEqual(newConfig);
    });

    it('should validate configuration schema', () => {
      const invalidConfig = {
        windowMs: -1000, // Invalid: negative
        maxRequests: 10,
      };

      expect(() => {
        service.updateConfig(RateLimitOperation.LOGIN, invalidConfig as any);
      }).toThrow();
    });
  });

  describe('Custom Keys', () => {
    it('should handle custom keys for granular rate limiting', async () => {
      const customKey1 = 'endpoint1';
      const customKey2 = 'endpoint2';

      // Exhaust limit for endpoint1
      for (let i = 0; i < 100; i++) {
        await service.consumeRateLimit(userId, RateLimitOperation.API_GENERAL, customKey1);
      }

      // endpoint1 should be blocked
      const result1 = await service.checkRateLimit(userId, RateLimitOperation.API_GENERAL, customKey1);
      expect(result1.allowed).toBe(false);

      // endpoint2 should still be allowed
      const result2 = await service.checkRateLimit(userId, RateLimitOperation.API_GENERAL, customKey2);
      expect(result2.allowed).toBe(true);

      // General API without custom key should also be allowed
      const result3 = await service.checkRateLimit(userId, RateLimitOperation.API_GENERAL);
      expect(result3.allowed).toBe(true);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide accurate statistics', async () => {
      // Make some requests
      await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);
      await service.consumeRateLimit('user2', RateLimitOperation.API_GENERAL);
      await service.consumeRateLimit(userId, RateLimitOperation.WORKOUT_CREATE);

      const stats = service.getStatistics();
      
      expect(stats.totalKeys).toBe(3);
      expect(stats.activeWindows).toBe(3);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should clean up expired entries', async () => {
      // Make a request
      await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);
      
      let stats = service.getStatistics();
      expect(stats.totalKeys).toBe(1);

      // Advance time past the window
      vi.advanceTimersByTime(16 * 60 * 1000);

      // Trigger cleanup by advancing cleanup interval
      vi.advanceTimersByTime(5 * 60 * 1000);

      stats = service.getStatistics();
      expect(stats.totalKeys).toBe(0);
    });
  });

  describe('Headers Generation', () => {
    it('should generate correct rate limit headers', async () => {
      const result = await service.checkRateLimit(userId, RateLimitOperation.LOGIN);
      
      expect(result.headers).toHaveProperty('X-RateLimit-Limit');
      expect(result.headers).toHaveProperty('X-RateLimit-Remaining');
      expect(result.headers).toHaveProperty('X-RateLimit-Reset');
      expect(result.headers['X-RateLimit-Limit']).toBe('5');
      expect(result.headers['X-RateLimit-Remaining']).toBe('5'); // LOGIN limit is 5
    });

    it('should include Retry-After header when limit exceeded', async () => {
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);
      }

      const result = await service.checkRateLimit(userId, RateLimitOperation.LOGIN);
      
      expect(result.headers).toHaveProperty('Retry-After');
      expect(parseInt(result.headers['Retry-After'])).toBeGreaterThan(0);
    });
  });

  describe('Sliding Window Algorithm', () => {
    it('should implement proper sliding window behavior', async () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      // Make 3 requests at the start
      for (let i = 0; i < 3; i++) {
        await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);
      }

      // Advance time by 8 minutes (half the window)
      vi.advanceTimersByTime(8 * 60 * 1000);

      // Make 2 more requests (total 5, at the limit)
      for (let i = 0; i < 2; i++) {
        await service.consumeRateLimit(userId, RateLimitOperation.LOGIN);
      }

      // Should be at the limit now
      let result = await service.checkRateLimit(userId, RateLimitOperation.LOGIN);
      expect(result.allowed).toBe(false);

      // Advance time by another 8 minutes (16 total, past the first 3 requests)
      vi.advanceTimersByTime(8 * 60 * 1000);

      // The first 3 requests should have expired, allowing new requests
      result = await service.checkRateLimit(userId, RateLimitOperation.LOGIN);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3); // 5 - 2 (the remaining requests), check doesn't consume
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown operation', async () => {
      await expect(
        service.checkRateLimit(userId, 'unknown_operation' as RateLimitOperation)
      ).rejects.toThrow('Rate limit configuration not found');
    });

    it('should handle malformed user IDs gracefully', async () => {
      const result = await service.checkRateLimit('', RateLimitOperation.LOGIN);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getRateLimitingService', () => {
      const instance1 = getRateLimitingService();
      const instance2 = getRateLimitingService();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance with initializeRateLimitingService', () => {
      const instance1 = getRateLimitingService();
      const instance2 = initializeRateLimitingService();
      
      expect(instance1).not.toBe(instance2);
      
      // Subsequent calls should return the new instance
      const instance3 = getRateLimitingService();
      expect(instance2).toBe(instance3);
    });

    it('should accept custom configurations in initialization', () => {
      const customConfig = {
        [RateLimitOperation.LOGIN]: {
          windowMs: 60000,
          maxRequests: 10,
          message: 'Custom login limit',
        },
      };

      const service = initializeRateLimitingService(customConfig);
      const configs = service.getConfigs();
      
      expect(configs[RateLimitOperation.LOGIN].maxRequests).toBe(10);
      expect(configs[RateLimitOperation.LOGIN].windowMs).toBe(60000);
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources on destroy', () => {
      const service = new RateLimitingService();
      const stats = service.getStatistics();
      
      service.destroy();
      
      // After destroy, statistics should show empty state
      const finalStats = service.getStatistics();
      expect(finalStats.totalKeys).toBe(0);
    });
  });
});