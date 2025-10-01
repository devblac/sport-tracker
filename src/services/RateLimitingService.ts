import { z } from 'zod';

// Rate limit configuration schema
const RateLimitConfigSchema = z.object({
  windowMs: z.number().positive(),
  maxRequests: z.number().positive(),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
  message: z.string().optional(),
});

export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;

// Rate limit result interface
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  headers: Record<string, string>;
}

// Rate limit entry for sliding window
interface RateLimitEntry {
  count: number;
  windowStart: number;
  requests: number[];
}

// Operation-specific rate limits
export enum RateLimitOperation {
  LOGIN = 'login',
  SIGNUP = 'signup',
  PASSWORD_RESET = 'password_reset',
  WORKOUT_CREATE = 'workout_create',
  SOCIAL_POST = 'social_post',
  FRIEND_REQUEST = 'friend_request',
  API_GENERAL = 'api_general',
  DATABASE_QUERY = 'database_query',
  FILE_UPLOAD = 'file_upload',
}

// Default rate limit configurations
const DEFAULT_RATE_LIMITS: Record<RateLimitOperation, RateLimitConfig> = {
  [RateLimitOperation.LOGIN]: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts. Please try again later.',
  },
  [RateLimitOperation.SIGNUP]: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many signup attempts. Please try again later.',
  },
  [RateLimitOperation.PASSWORD_RESET]: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts. Please try again later.',
  },
  [RateLimitOperation.WORKOUT_CREATE]: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many workout creation requests. Please slow down.',
  },
  [RateLimitOperation.SOCIAL_POST]: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many social posts. Please wait before posting again.',
  },
  [RateLimitOperation.FRIEND_REQUEST]: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Too many friend requests. Please try again later.',
  },
  [RateLimitOperation.API_GENERAL]: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Rate limit exceeded. Please slow down your requests.',
  },
  [RateLimitOperation.DATABASE_QUERY]: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // Conservative for free tier
    message: 'Database query limit exceeded. Please wait.',
  },
  [RateLimitOperation.FILE_UPLOAD]: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many file uploads. Please wait before uploading again.',
  },
};

/**
 * Rate limiting service with sliding window algorithm
 * Protects free tier limits and provides user feedback
 */
export class RateLimitingService {
  private rateLimitStore = new Map<string, RateLimitEntry>();
  private configs: Map<RateLimitOperation, RateLimitConfig>;
  private cleanupInterval: NodeJS.Timeout;

  constructor(customConfigs?: Partial<Record<RateLimitOperation, RateLimitConfig>>) {
    this.configs = new Map();
    
    // Initialize with default configs
    Object.entries(DEFAULT_RATE_LIMITS).forEach(([operation, config]) => {
      this.configs.set(operation as RateLimitOperation, config);
    });

    // Override with custom configs if provided
    if (customConfigs) {
      Object.entries(customConfigs).forEach(([operation, config]) => {
        if (config) {
          this.configs.set(operation as RateLimitOperation, config);
        }
      });
    }

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request is allowed under rate limits (without consuming)
   */
  async checkRateLimit(
    userId: string,
    operation: RateLimitOperation,
    customKey?: string
  ): Promise<RateLimitResult> {
    const config = this.configs.get(operation);
    if (!config) {
      throw new Error(`Rate limit configuration not found for operation: ${operation}`);
    }

    const key = this.generateKey(userId, operation, customKey);
    const now = Date.now();
    
    let entry = this.rateLimitStore.get(key);
    
    if (!entry) {
      const headers = this.generateHeaders(config.maxRequests, config.maxRequests, now + config.windowMs);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        headers,
      };
    }

    // Clean old requests outside the window
    const windowStart = now - config.windowMs;
    const validRequests = entry.requests.filter(timestamp => timestamp > windowStart);
    
    const remaining = Math.max(0, config.maxRequests - validRequests.length);
    const allowed = validRequests.length < config.maxRequests;

    const resetTime = validRequests.length > 0 
      ? Math.max(...validRequests) + config.windowMs 
      : now + config.windowMs;
    
    const retryAfter = allowed ? undefined : Math.ceil((resetTime - now) / 1000);
    const headers = this.generateHeaders(config.maxRequests, remaining, resetTime, retryAfter);

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter,
      headers,
    };
  }

  /**
   * Consume a rate limit (mark a request as made)
   */
  async consumeRateLimit(
    userId: string,
    operation: RateLimitOperation,
    customKey?: string
  ): Promise<RateLimitResult> {
    const config = this.configs.get(operation);
    if (!config) {
      throw new Error(`Rate limit configuration not found for operation: ${operation}`);
    }

    const key = this.generateKey(userId, operation, customKey);
    const now = Date.now();
    
    let entry = this.rateLimitStore.get(key);
    
    if (!entry) {
      entry = {
        count: 0,
        windowStart: now,
        requests: [],
      };
      this.rateLimitStore.set(key, entry);
    }

    // Clean old requests outside the window
    const windowStart = now - config.windowMs;
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
    entry.count = entry.requests.length;

    const allowed = entry.count < config.maxRequests;
    
    if (!allowed) {
      const remaining = 0;
      const resetTime = Math.max(...entry.requests) + config.windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);
      const headers = this.generateHeaders(config.maxRequests, remaining, resetTime, retryAfter);
      
      const result = {
        allowed: false,
        remaining,
        resetTime,
        retryAfter,
        headers,
      };
      
      const message = config.message || 'Rate limit exceeded';
      throw new RateLimitError(message, result);
    }

    // Consume the rate limit
    entry.requests.push(now);
    entry.count++;

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetTime = Math.max(...entry.requests) + config.windowMs;
    const headers = this.generateHeaders(config.maxRequests, remaining, resetTime);

    return {
      allowed: true,
      remaining,
      resetTime,
      headers,
    };
  }

  /**
   * Get current rate limit status without consuming
   */
  async getRateLimitStatus(
    userId: string,
    operation: RateLimitOperation,
    customKey?: string
  ): Promise<RateLimitResult> {
    const config = this.configs.get(operation);
    if (!config) {
      throw new Error(`Rate limit configuration not found for operation: ${operation}`);
    }

    const key = this.generateKey(userId, operation, customKey);
    const now = Date.now();
    
    const entry = this.rateLimitStore.get(key);
    
    if (!entry) {
      const headers = this.generateHeaders(config.maxRequests, config.maxRequests, now + config.windowMs);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        headers,
      };
    }

    // Clean old requests outside the window
    const windowStart = now - config.windowMs;
    const validRequests = entry.requests.filter(timestamp => timestamp > windowStart);
    const remaining = Math.max(0, config.maxRequests - validRequests.length);
    const allowed = validRequests.length < config.maxRequests;

    const resetTime = validRequests.length > 0 
      ? Math.max(...validRequests) + config.windowMs 
      : now + config.windowMs;
    
    const retryAfter = allowed ? undefined : Math.ceil((resetTime - now) / 1000);
    const headers = this.generateHeaders(config.maxRequests, remaining, resetTime, retryAfter);

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter,
      headers,
    };
  }

  /**
   * Reset rate limit for a specific user and operation
   */
  async resetRateLimit(
    userId: string,
    operation: RateLimitOperation,
    customKey?: string
  ): Promise<void> {
    const key = this.generateKey(userId, operation, customKey);
    this.rateLimitStore.delete(key);
  }

  /**
   * Update rate limit configuration for an operation
   */
  updateConfig(operation: RateLimitOperation, config: RateLimitConfig): void {
    const validatedConfig = RateLimitConfigSchema.parse(config);
    this.configs.set(operation, validatedConfig);
  }

  /**
   * Get all current rate limit configurations
   */
  getConfigs(): Record<RateLimitOperation, RateLimitConfig> {
    const configs: Record<string, RateLimitConfig> = {};
    this.configs.forEach((config, operation) => {
      configs[operation] = config;
    });
    return configs as Record<RateLimitOperation, RateLimitConfig>;
  }

  /**
   * Get rate limit statistics
   */
  getStatistics(): {
    totalKeys: number;
    activeWindows: number;
    memoryUsage: number;
  } {
    const now = Date.now();
    let activeWindows = 0;
    
    this.rateLimitStore.forEach((entry, key) => {
      const operation = key.split(':')[1] as RateLimitOperation;
      const config = this.configs.get(operation);
      if (config && entry.requests.some(timestamp => timestamp > now - config.windowMs)) {
        activeWindows++;
      }
    });

    return {
      totalKeys: this.rateLimitStore.size,
      activeWindows,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.rateLimitStore.forEach((entry, key) => {
      const operation = key.split(':')[1] as RateLimitOperation;
      const config = this.configs.get(operation);
      
      if (config) {
        const windowStart = now - config.windowMs;
        entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
        entry.count = entry.requests.length;
        
        // Remove entries with no recent requests
        if (entry.requests.length === 0) {
          keysToDelete.push(key);
        }
      }
    });

    keysToDelete.forEach(key => {
      this.rateLimitStore.delete(key);
    });
  }

  /**
   * Generate cache key for rate limiting
   */
  private generateKey(userId: string, operation: RateLimitOperation, customKey?: string): string {
    const baseKey = `ratelimit:${operation}:${userId}`;
    return customKey ? `${baseKey}:${customKey}` : baseKey;
  }

  /**
   * Generate rate limit headers
   */
  private generateHeaders(
    limit: number,
    remaining: number,
    resetTime: number,
    retryAfter?: number
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
    };

    if (retryAfter !== undefined) {
      headers['Retry-After'] = retryAfter.toString();
    }

    return headers;
  }

  /**
   * Estimate memory usage of the rate limit store
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    this.rateLimitStore.forEach((entry, key) => {
      // Rough estimation: key size + entry object size
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += 24; // Base object overhead
      totalSize += entry.requests.length * 8; // Number array
    });

    return totalSize;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.rateLimitStore.clear();
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly rateLimitResult: RateLimitResult
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Singleton instance for global use
let rateLimitingServiceInstance: RateLimitingService | null = null;

/**
 * Get the singleton rate limiting service instance
 */
export function getRateLimitingService(): RateLimitingService {
  if (!rateLimitingServiceInstance) {
    rateLimitingServiceInstance = new RateLimitingService();
  }
  return rateLimitingServiceInstance;
}

/**
 * Initialize rate limiting service with custom configuration
 */
export function initializeRateLimitingService(
  customConfigs?: Partial<Record<RateLimitOperation, RateLimitConfig>>
): RateLimitingService {
  if (rateLimitingServiceInstance) {
    rateLimitingServiceInstance.destroy();
  }
  rateLimitingServiceInstance = new RateLimitingService(customConfigs);
  return rateLimitingServiceInstance;
}