import { serviceConfigManager } from './ServiceConfigManager';
import { serviceMonitor } from './ServiceMonitor';
import { logger } from '@/utils/logger';
import type { 
  User as SupabaseUser,
  Session,
  PostgrestError 
} from '@supabase/supabase-js';

// ============================================================================
// Enhanced Cache Implementation
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

class IntelligentCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const config = serviceConfigManager.getConfig();
    const actualTTL = ttl || config.caching.defaultTTL;

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: actualTTL,
      key
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getStats(): { size: number; hitRate: number; maxSize: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      maxSize: this.maxSize
    };
  }
}

// ============================================================================
// Connection Pool and Request Queue
// ============================================================================

interface QueuedRequest {
  id: string;
  operation: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: number;
  timestamp: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private activeRequests = 0;
  private maxConcurrentRequests: number;

  constructor(maxConcurrentRequests = 5) {
    this.maxConcurrentRequests = maxConcurrentRequests;
  }

  async enqueue<T>(
    operation: () => Promise<T>, 
    priority = 0,
    id?: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        id: id || `req_${Date.now()}_${Math.random()}`,
        operation,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      };

      this.queue.push(request);
      this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first
      
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.activeRequests >= this.maxConcurrentRequests) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const request = this.queue.shift();
      if (!request) break;

      this.activeRequests++;
      
      this.executeRequest(request).finally(() => {
        this.activeRequests--;
        this.processQueue(); // Process next requests
      });
    }

    this.processing = false;
  }

  private async executeRequest(request: QueuedRequest): Promise<void> {
    try {
      const result = await request.operation();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    }
  }

  getQueueStats(): { queueLength: number; activeRequests: number; maxConcurrent: number } {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrentRequests
    };
  }
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    serviceName: string,
    operationName: string,
    maxRetries?: number
  ): Promise<T> {
    const config = serviceConfigManager.getConfig();
    const retries = maxRetries || config.rateLimits.maxRetries;
    const baseDelay = config.rateLimits.baseDelay;
    const maxDelay = config.rateLimits.maxDelay;

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;

        // Record successful operation
        serviceMonitor.recordMetric({
          service: serviceName,
          operation: operationName,
          duration,
          success: true,
          retryCount: attempt
        });

        serviceMonitor.recordServiceSuccess(serviceName);
        return result;

      } catch (error) {
        lastError = error as Error;
        const duration = Date.now() - Date.now(); // This would be tracked properly in real implementation

        // Record failed operation
        serviceMonitor.recordMetric({
          service: serviceName,
          operation: operationName,
          duration,
          success: false,
          error: lastError.message,
          retryCount: attempt
        });

        // Don't retry on final attempt
        if (attempt === retries) {
          serviceMonitor.recordServiceFailure(serviceName, lastError.message);
          break;
        }

        // Check if we should retry based on error type
        if (!this.shouldRetry(error)) {
          serviceMonitor.recordServiceFailure(serviceName, lastError.message);
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt),
          maxDelay
        );

        logger.warn(`Retrying operation after ${delay}ms`, {
          serviceName,
          operationName,
          attempt: attempt + 1,
          maxRetries: retries,
          error: lastError.message
        });

        await this.delay(delay);
      }
    }

    throw lastError;
  }

  private static shouldRetry(error: any): boolean {
    // Don't retry on authentication errors
    if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
      return false;
    }

    // Don't retry on validation errors
    if (error?.code === 'PGRST116') {
      return false;
    }

    // Retry on network errors, timeouts, and server errors
    return true;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Enhanced Supabase Service
// ============================================================================

export class EnhancedSupabaseService {
  private static instance: EnhancedSupabaseService;
  private cache: IntelligentCache;
  private requestQueue: RequestQueue;

  private constructor() {
    const config = serviceConfigManager.getConfig();
    this.cache = new IntelligentCache(config.caching.maxSize);
    this.requestQueue = new RequestQueue(5); // Max 5 concurrent requests for free tier
  }

  public static getInstance(): EnhancedSupabaseService {
    if (!EnhancedSupabaseService.instance) {
      EnhancedSupabaseService.instance = new EnhancedSupabaseService();
    }
    return EnhancedSupabaseService.instance;
  }

  // ============================================================================
  // Batch Operations
  // ============================================================================

  async batchGetUserProfiles(userIds: string[]): Promise<any[]> {
    const cacheKey = `batch_profiles_${userIds.sort().join(',')}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      serviceMonitor.recordMetric({
        service: 'database',
        operation: 'batchGetUserProfiles',
        duration: 0,
        success: true,
        cacheHit: true
      });
      return cached;
    }

    return this.requestQueue.enqueue(async () => {
      return RetryManager.withRetry(async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .in('id', userIds);

        if (error) {
          logger.error('Failed to batch get user profiles', { error, userIds });
          throw error;
        }

        // Cache the result
        const config = serviceConfigManager.getConfig();
        const strategy = config.caching.strategies.userProfiles;
        this.cache.set(cacheKey, data, strategy.ttl);

        return data;
      }, 'database', 'batchGetUserProfiles');
    }, 1); // High priority for user data
  }

  async batchCreateWorkoutSessions(workoutSessions: any[]): Promise<any[]> {
    return this.requestQueue.enqueue(async () => {
      return RetryManager.withRetry(async () => {
        // Validate all sessions first
        const validatedSessions = workoutSessions.map(session => 
          ValidationService.validateWorkout(session)
        );

        const { data, error } = await supabase
          .from('workout_sessions')
          .insert(validatedSessions.map(session => ({
            ...session,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })))
          .select();

        if (error) {
          logger.error('Failed to batch create workout sessions', { error });
          throw error;
        }

        // Invalidate related caches
        this.invalidateWorkoutCaches(validatedSessions[0]?.user_id);

        return data;
      }, 'database', 'batchCreateWorkoutSessions');
    }, 2); // Medium priority
  }

  async batchUpdateXPTransactions(transactions: any[]): Promise<any[]> {
    return this.requestQueue.enqueue(async () => {
      return RetryManager.withRetry(async () => {
        const { data, error } = await supabase
          .from('xp_transactions')
          .insert(transactions.map(tx => ({
            ...tx,
            created_at: new Date().toISOString()
          })))
          .select();

        if (error) {
          logger.error('Failed to batch create XP transactions', { error });
          throw error;
        }

        // Update user XP totals
        const userXPUpdates = new Map<string, number>();
        transactions.forEach(tx => {
          const current = userXPUpdates.get(tx.user_id) || 0;
          userXPUpdates.set(tx.user_id, current + tx.amount);
        });

        // Batch update user XP
        for (const [userId, totalXP] of userXPUpdates) {
          await this.updateUserXP(userId, totalXP);
        }

        return data;
      }, 'database', 'batchUpdateXPTransactions');
    }, 1); // High priority for gamification
  }

  // ============================================================================
  // Cached Operations
  // ============================================================================

  async getCachedUserProfile(userId: string): Promise<any> {
    const cacheKey = `user_profile_${userId}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      serviceMonitor.recordMetric({
        service: 'database',
        operation: 'getUserProfile',
        duration: 0,
        success: true,
        cacheHit: true
      });
      return cached;
    }

    return this.requestQueue.enqueue(async () => {
      return RetryManager.withRetry(async () => {
        ValidationService.checkRateLimit(userId, 'getUserProfile', 50, 60000);
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          logger.error('Failed to get user profile', { error, userId });
          throw error;
        }

        // Cache the result
        const config = serviceConfigManager.getConfig();
        const strategy = config.caching.strategies.userProfiles;
        this.cache.set(cacheKey, data, strategy.ttl);

        return data;
      }, 'database', 'getUserProfile');
    }, 1); // High priority
  }

  async getCachedExercises(filters: any = {}): Promise<any[]> {
    const cacheKey = `exercises_${JSON.stringify(filters)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      serviceMonitor.recordMetric({
        service: 'database',
        operation: 'getExercises',
        duration: 0,
        success: true,
        cacheHit: true
      });
      return cached;
    }

    return this.requestQueue.enqueue(async () => {
      return RetryManager.withRetry(async () => {
        let query = supabase
          .from('exercises')
          .select(`
            *,
            category:exercise_categories(*),
            equipment:equipment_types(*)
          `);

        // Apply filters
        if (filters.category_id) {
          query = query.eq('category_id', filters.category_id);
        }
        if (filters.equipment_id) {
          query = query.eq('equipment_id', filters.equipment_id);
        }
        if (filters.difficulty_level) {
          query = query.eq('difficulty_level', filters.difficulty_level);
        }
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,name_es.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) {
          logger.error('Failed to get exercises', { error, filters });
          throw error;
        }

        // Cache the result with longer TTL for exercises
        const config = serviceConfigManager.getConfig();
        const strategy = config.caching.strategies.exercises;
        this.cache.set(cacheKey, data, strategy.ttl);

        return data;
      }, 'database', 'getExercises');
    }, 0); // Lower priority for reference data
  }

  // ============================================================================
  // Optimized Social Operations
  // ============================================================================

  async getOptimizedSocialFeed(userId: string, limit = 20, offset = 0): Promise<any[]> {
    const cacheKey = `social_feed_${userId}_${limit}_${offset}`;
    
    // For social feeds, use shorter cache or network-first strategy
    const config = serviceConfigManager.getConfig();
    const strategy = config.caching.strategies.social;
    
    if (strategy.strategy === 'cache-first') {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        serviceMonitor.recordMetric({
          service: 'database',
          operation: 'getSocialFeed',
          duration: 0,
          success: true,
          cacheHit: true
        });
        return cached;
      }
    }

    return this.requestQueue.enqueue(async () => {
      return RetryManager.withRetry(async () => {
        ValidationService.checkRateLimit(userId, 'getSocialFeed', 50, 60000);
        
        // Optimized query with selective fields
        const { data, error } = await supabase
          .from('social_posts')
          .select(`
            id,
            content,
            post_type,
            visibility,
            created_at,
            likes_count,
            comments_count,
            user:user_profiles!inner(
              id,
              display_name,
              avatar_url
            )
          `)
          .or(`visibility.eq.public,user_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          logger.error('Failed to get social feed', { error, userId });
          throw error;
        }

        // Cache with appropriate strategy
        if (strategy.strategy !== 'network-only') {
          this.cache.set(cacheKey, data, strategy.ttl);
        }

        return data;
      }, 'database', 'getSocialFeed');
    }, 1); // Medium priority
  }

  // ============================================================================
  // Connection Pool Management
  // ============================================================================

  async executeWithConnectionPool<T>(
    operation: () => Promise<T>,
    priority = 0
  ): Promise<T> {
    return this.requestQueue.enqueue(operation, priority);
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  invalidateCache(pattern: string): void {
    // Simple pattern matching for cache invalidation
    const keysToDelete: string[] = [];
    
    for (const [key] of (this.cache as any).cache.entries()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    logger.debug('Cache invalidated', { pattern, keysDeleted: keysToDelete.length });
  }

  private invalidateWorkoutCaches(userId?: string): void {
    if (userId) {
      this.invalidateCache(`workout_${userId}`);
      this.invalidateCache(`user_workouts_${userId}`);
    } else {
      this.invalidateCache('workout_');
    }
  }

  private invalidateUserCaches(userId: string): void {
    this.invalidateCache(`user_profile_${userId}`);
    this.invalidateCache(`user_achievements_${userId}`);
    this.invalidateCache(`user_streaks_${userId}`);
  }

  // ============================================================================
  // Enhanced Operations with Fallback
  // ============================================================================

  async updateUserXP(userId: string, xpAmount: number): Promise<void> {
    return this.requestQueue.enqueue(async () => {
      return RetryManager.withRetry(async () => {
        const { error } = await supabase.rpc('update_user_xp', {
          user_id: userId,
          xp_amount: xpAmount
        });

        if (error) {
          logger.error('Failed to update user XP', { error, userId, xpAmount });
          throw error;
        }

        // Invalidate user caches
        this.invalidateUserCaches(userId);
      }, 'database', 'updateUserXP');
    }, 1); // High priority for XP updates
  }

  // ============================================================================
  // Health Check and Monitoring
  // ============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      logger.error('Enhanced Supabase health check failed', { error });
      return false;
    }
  }

  // ============================================================================
  // Performance Monitoring
  // ============================================================================

  getPerformanceStats(): {
    cache: { size: number; hitRate: number; maxSize: number };
    queue: { queueLength: number; activeRequests: number; maxConcurrent: number };
  } {
    return {
      cache: this.cache.getStats(),
      queue: this.requestQueue.getQueueStats()
    };
  }

  // ============================================================================
  // Cleanup and Resource Management
  // ============================================================================

  clearCache(): void {
    this.cache.clear();
    logger.info('Enhanced Supabase service cache cleared');
  }

  destroy(): void {
    this.clearCache();
    // Additional cleanup would go here
  }
}

// Export singleton instance
export const enhancedSupabaseService = EnhancedSupabaseService.getInstance();