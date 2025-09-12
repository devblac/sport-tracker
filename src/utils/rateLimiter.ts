import { logger } from './logger';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if an action is rate limited
   */
  isLimited(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now >= entry.resetTime) {
      // No entry or window expired, create new entry
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return false;
    }

    if (entry.count >= config.maxRequests) {
      logger.warn('Rate limit exceeded', { key, count: entry.count, maxRequests: config.maxRequests });
      return true;
    }

    // Increment counter
    entry.count++;
    return false;
  }

  /**
   * Record a successful request (if tracking is enabled)
   */
  recordSuccess(key: string, config: RateLimitConfig): void {
    if (config.skipSuccessfulRequests) return;
    // Success is already recorded in isLimited check
  }

  /**
   * Record a failed request (if tracking is enabled)
   */
  recordFailure(key: string, config: RateLimitConfig): void {
    if (config.skipFailedRequests) {
      // Decrement counter for failed requests if configured
      const entry = this.limits.get(key);
      if (entry && entry.count > 0) {
        entry.count--;
      }
    }
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, config: RateLimitConfig): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() >= entry.resetTime) {
      return config.maxRequests;
    }
    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get reset time for a key
   */
  getResetTime(key: string): number | null {
    const entry = this.limits.get(key);
    return entry ? entry.resetTime : null;
  }

  /**
   * Clear rate limit for a specific key
   */
  clear(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear();
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Destroy the rate limiter and clean up resources
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.limits.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Common rate limit configurations
export const RATE_LIMITS = {
  // API calls
  API_CALLS: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  
  // User actions
  WORKOUT_ACTIONS: { maxRequests: 30, windowMs: 60000 }, // 30 actions per minute
  SOCIAL_ACTIONS: { maxRequests: 20, windowMs: 60000 }, // 20 social actions per minute
  
  // Authentication
  LOGIN_ATTEMPTS: { maxRequests: 5, windowMs: 300000 }, // 5 attempts per 5 minutes
  
  // Data operations
  DATA_EXPORT: { maxRequests: 3, windowMs: 3600000 }, // 3 exports per hour
  BULK_OPERATIONS: { maxRequests: 5, windowMs: 300000 }, // 5 bulk ops per 5 minutes
} as const;

/**
 * Decorator for rate limiting methods
 */
export function rateLimit(config: RateLimitConfig, keyGenerator?: (...args: any[]) => string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator ? keyGenerator(...args) : `${target.constructor.name}.${propertyName}`;
      
      if (rateLimiter.isLimited(key, config)) {
        const resetTime = rateLimiter.getResetTime(key);
        const waitTime = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 0;
        
        throw new Error(`Rate limit exceeded. Try again in ${waitTime} seconds.`);
      }

      try {
        const result = await method.apply(this, args);
        rateLimiter.recordSuccess(key, config);
        return result;
      } catch (error) {
        rateLimiter.recordFailure(key, config);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Hook for using rate limiting in components
 */
export function useRateLimit(key: string, config: RateLimitConfig) {
  const checkLimit = () => rateLimiter.isLimited(key, config);
  const getRemaining = () => rateLimiter.getRemaining(key, config);
  const getResetTime = () => rateLimiter.getResetTime(key);
  
  return {
    isLimited: checkLimit,
    remaining: getRemaining,
    resetTime: getResetTime,
    clear: () => rateLimiter.clear(key),
  };
}