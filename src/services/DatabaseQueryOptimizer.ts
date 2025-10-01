/**
 * Database Query Optimizer
 * 
 * Optimizes database queries for Supabase free tier by implementing query analysis,
 * caching, batch processing, and performance monitoring.
 */

import { connectionPoolManager } from './ConnectionPoolManager';
import { logger } from '@/utils/logger';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface QueryCacheEntry {
  key: string;
  result: any;
  timestamp: Date;
  ttl: number;
  hitCount: number;
  size: number;
}

interface QueryMetrics {
  queryId: string;
  operation: string;
  table: string;
  executionTime: number;
  resultSize: number;
  cacheHit: boolean;
  timestamp: Date;
  error?: string;
}

interface BatchOperation {
  id: string;
  operations: (() => Promise<any>)[];
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  maxBatchSize: number;
}

interface QueryOptimizationConfig {
  cacheMaxSize: number; // in MB
  cacheDefaultTTL: number; // in milliseconds
  batchSize: number;
  batchTimeout: number;
  slowQueryThreshold: number; // in milliseconds
  enableQueryAnalysis: boolean;
  enableBatching: boolean;
  enableCaching: boolean;
}

interface QueryAnalysis {
  queryId: string;
  operation: string;
  table: string;
  estimatedCost: number;
  suggestedOptimizations: string[];
  indexRecommendations: string[];
}

interface PerformanceReport {
  totalQueries: number;
  averageExecutionTime: number;
  cacheHitRate: number;
  slowQueries: QueryMetrics[];
  topTables: { table: string; queryCount: number; avgTime: number }[];
  optimizationSuggestions: string[];
}

// ============================================================================
// Database Query Optimizer
// ============================================================================

export class DatabaseQueryOptimizer {
  private static instance: DatabaseQueryOptimizer;
  private config: QueryOptimizationConfig;
  private queryCache: Map<string, QueryCacheEntry> = new Map();
  private queryMetrics: QueryMetrics[] = [];
  private batchQueue: Map<string, BatchOperation> = new Map();
  private batchTimer?: NodeJS.Timeout;
  private currentCacheSize = 0; // in bytes

  private constructor(config?: Partial<QueryOptimizationConfig>) {
    this.config = {
      cacheMaxSize: 50 * 1024 * 1024, // 50MB
      cacheDefaultTTL: 5 * 60 * 1000, // 5 minutes
      batchSize: 10,
      batchTimeout: 100, // 100ms
      slowQueryThreshold: 1000, // 1 second
      enableQueryAnalysis: true,
      enableBatching: true,
      enableCaching: true,
      ...config
    };

    this.startBatchProcessor();
    this.startCacheCleanup();
  }

  public static getInstance(config?: Partial<QueryOptimizationConfig>): DatabaseQueryOptimizer {
    if (!DatabaseQueryOptimizer.instance) {
      DatabaseQueryOptimizer.instance = new DatabaseQueryOptimizer(config);
    }
    return DatabaseQueryOptimizer.instance;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Execute an optimized query with caching and performance monitoring
   */
  async executeOptimizedQuery<T>(
    operation: () => Promise<T>,
    queryId: string,
    options: {
      table?: string;
      cacheTTL?: number;
      enableCache?: boolean;
      priority?: 'low' | 'normal' | 'high';
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(queryId, options);
    
    try {
      // Check cache first if enabled
      if (this.config.enableCaching && options.enableCache !== false) {
        const cachedResult = this.getCachedResult<T>(cacheKey);
        if (cachedResult !== null) {
          this.recordMetrics({
            queryId,
            operation: 'SELECT',
            table: options.table || 'unknown',
            executionTime: Date.now() - startTime,
            resultSize: this.estimateSize(cachedResult),
            cacheHit: true,
            timestamp: new Date()
          });
          return cachedResult;
        }
      }

      // Execute query with connection pooling
      const result = await connectionPoolManager.executeQuery(
        operation,
        `optimized_${queryId}`
      );

      const executionTime = Date.now() - startTime;

      // Cache result if enabled and within size limits
      if (this.config.enableCaching && options.enableCache !== false) {
        this.cacheResult(
          cacheKey,
          result,
          options.cacheTTL || this.config.cacheDefaultTTL
        );
      }

      // Record metrics
      this.recordMetrics({
        queryId,
        operation: this.extractOperation(queryId),
        table: options.table || 'unknown',
        executionTime,
        resultSize: this.estimateSize(result),
        cacheHit: false,
        timestamp: new Date()
      });

      // Analyze query performance if enabled
      if (this.config.enableQueryAnalysis && executionTime > this.config.slowQueryThreshold) {
        await this.analyzeSlowQuery(queryId, options.table || 'unknown', executionTime);
      }

      return result;
    } catch (error) {
      this.recordMetrics({
        queryId,
        operation: this.extractOperation(queryId),
        table: options.table || 'unknown',
        executionTime: Date.now() - startTime,
        resultSize: 0,
        cacheHit: false,
        timestamp: new Date(),
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Execute multiple queries in batches to reduce connection overhead
   */
  async executeBatchQueries<T>(
    operations: Array<{
      operation: () => Promise<T>;
      queryId: string;
      options?: { table?: string; priority?: 'low' | 'normal' | 'high' };
    }>,
    batchOptions: {
      maxBatchSize?: number;
      timeout?: number;
    } = {}
  ): Promise<T[]> {
    if (!this.config.enableBatching || operations.length <= 1) {
      // Execute individually if batching disabled or single operation
      return Promise.all(
        operations.map(op => 
          this.executeOptimizedQuery(op.operation, op.queryId, op.options)
        )
      );
    }

    const batchSize = batchOptions.maxBatchSize || this.config.batchSize;
    const results: T[] = [];

    // Process operations in batches
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(op => 
          this.executeOptimizedQuery(op.operation, op.queryId, op.options)
        )
      );
      
      results.push(...batchResults);

      // Small delay between batches to avoid overwhelming the connection pool
      if (i + batchSize < operations.length) {
        await this.sleep(10);
      }
    }

    return results;
  }

  /**
   * Analyze query performance and provide optimization suggestions
   */
  async analyzeQuery(
    queryId: string,
    table: string,
    operation: string
  ): Promise<QueryAnalysis> {
    const analysis: QueryAnalysis = {
      queryId,
      operation,
      table,
      estimatedCost: 0,
      suggestedOptimizations: [],
      indexRecommendations: []
    };

    // Get query metrics for this query
    const queryMetrics = this.queryMetrics.filter(m => m.queryId === queryId);
    
    if (queryMetrics.length > 0) {
      const avgExecutionTime = queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / queryMetrics.length;
      analysis.estimatedCost = avgExecutionTime;

      // Provide optimization suggestions based on performance
      if (avgExecutionTime > this.config.slowQueryThreshold) {
        analysis.suggestedOptimizations.push('Consider adding database indexes');
        analysis.suggestedOptimizations.push('Review query filters and joins');
        analysis.suggestedOptimizations.push('Consider query result pagination');
      }

      // Check cache hit rate
      const cacheHitRate = queryMetrics.filter(m => m.cacheHit).length / queryMetrics.length;
      if (cacheHitRate < 0.5) {
        analysis.suggestedOptimizations.push('Consider increasing cache TTL');
        analysis.suggestedOptimizations.push('Review cache key generation strategy');
      }

      // Table-specific recommendations
      if (table === 'workout_sessions' || table === 'social_posts') {
        analysis.indexRecommendations.push(`CREATE INDEX IF NOT EXISTS idx_${table}_user_id ON ${table}(user_id)`);
        analysis.indexRecommendations.push(`CREATE INDEX IF NOT EXISTS idx_${table}_created_at ON ${table}(created_at DESC)`);
      }
    }

    return analysis;
  }

  /**
   * Get performance report with optimization suggestions
   */
  getPerformanceReport(): PerformanceReport {
    const totalQueries = this.queryMetrics.length;
    const averageExecutionTime = totalQueries > 0 
      ? this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries 
      : 0;

    const cacheHitRate = totalQueries > 0
      ? this.queryMetrics.filter(m => m.cacheHit).length / totalQueries
      : 0;

    const slowQueries = this.queryMetrics
      .filter(m => m.executionTime > this.config.slowQueryThreshold)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    // Aggregate by table
    const tableStats = new Map<string, { count: number; totalTime: number }>();
    this.queryMetrics.forEach(m => {
      const stats = tableStats.get(m.table) || { count: 0, totalTime: 0 };
      stats.count++;
      stats.totalTime += m.executionTime;
      tableStats.set(m.table, stats);
    });

    const topTables = Array.from(tableStats.entries())
      .map(([table, stats]) => ({
        table,
        queryCount: stats.count,
        avgTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, 5);

    const optimizationSuggestions: string[] = [];
    
    if (cacheHitRate < 0.3) {
      optimizationSuggestions.push('Low cache hit rate - consider reviewing cache strategy');
    }
    
    if (averageExecutionTime > this.config.slowQueryThreshold / 2) {
      optimizationSuggestions.push('High average query time - review database indexes');
    }
    
    if (slowQueries.length > totalQueries * 0.1) {
      optimizationSuggestions.push('High number of slow queries - consider query optimization');
    }

    return {
      totalQueries,
      averageExecutionTime,
      cacheHitRate,
      slowQueries,
      topTables,
      optimizationSuggestions
    };
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
    this.currentCacheSize = 0;
    logger.info('Query cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    entryCount: number;
    hitRate: number;
    topEntries: Array<{ key: string; hitCount: number; size: number }>;
  } {
    const entries = Array.from(this.queryCache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0);
    const totalRequests = this.queryMetrics.length;
    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    const topEntries = entries
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 10)
      .map(entry => ({
        key: entry.key,
        hitCount: entry.hitCount,
        size: entry.size
      }));

    return {
      size: this.currentCacheSize,
      maxSize: this.config.cacheMaxSize,
      entryCount: this.queryCache.size,
      hitRate,
      topEntries
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private generateCacheKey(queryId: string, options: any): string {
    return `${queryId}_${JSON.stringify(options)}`;
  }

  private getCachedResult<T>(cacheKey: string): T | null {
    const entry = this.queryCache.get(cacheKey);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.queryCache.delete(cacheKey);
      this.currentCacheSize -= entry.size;
      return null;
    }

    // Update hit count
    entry.hitCount++;
    
    return entry.result as T;
  }

  private cacheResult(cacheKey: string, result: any, ttl: number): void {
    const size = this.estimateSize(result);
    
    // Don't cache if result is too large
    if (size > this.config.cacheMaxSize * 0.1) { // Don't cache items larger than 10% of max cache
      return;
    }

    // Ensure we have space in cache
    this.ensureCacheSpace(size);

    const entry: QueryCacheEntry = {
      key: cacheKey,
      result,
      timestamp: new Date(),
      ttl,
      hitCount: 0,
      size
    };

    this.queryCache.set(cacheKey, entry);
    this.currentCacheSize += size;
  }

  private ensureCacheSpace(requiredSize: number): void {
    while (this.currentCacheSize + requiredSize > this.config.cacheMaxSize && this.queryCache.size > 0) {
      // Remove least recently used entry (simple LRU)
      let oldestEntry: { key: string; timestamp: Date } | null = null;
      
      for (const [key, entry] of this.queryCache.entries()) {
        if (!oldestEntry || entry.timestamp < oldestEntry.timestamp) {
          oldestEntry = { key, timestamp: entry.timestamp };
        }
      }

      if (oldestEntry) {
        const entry = this.queryCache.get(oldestEntry.key);
        if (entry) {
          this.currentCacheSize -= entry.size;
          this.queryCache.delete(oldestEntry.key);
        }
      }
    }
  }

  private recordMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }
  }

  private async analyzeSlowQuery(queryId: string, table: string, executionTime: number): Promise<void> {
    logger.warn('Slow query detected', {
      queryId,
      table,
      executionTime,
      threshold: this.config.slowQueryThreshold
    });

    // Could implement more sophisticated analysis here
    // For now, just log the slow query for manual review
  }

  private extractOperation(queryId: string): string {
    // Extract operation type from query ID
    if (queryId.includes('select') || queryId.includes('get')) return 'SELECT';
    if (queryId.includes('insert') || queryId.includes('create')) return 'INSERT';
    if (queryId.includes('update')) return 'UPDATE';
    if (queryId.includes('delete')) return 'DELETE';
    return 'UNKNOWN';
  }

  private estimateSize(obj: any): number {
    // Simple size estimation - in production, could use more sophisticated methods
    try {
      return JSON.stringify(obj).length * 2; // Rough estimate including overhead
    } catch {
      return 1024; // Default size if can't stringify
    }
  }

  private startBatchProcessor(): void {
    if (!this.config.enableBatching) return;

    this.batchTimer = setInterval(() => {
      this.processBatchQueue();
    }, this.config.batchTimeout);
  }

  private async processBatchQueue(): Promise<void> {
    if (this.batchQueue.size === 0) return;

    const batches = Array.from(this.batchQueue.values());
    this.batchQueue.clear();

    for (const batch of batches) {
      try {
        await Promise.all(batch.operations.map(op => op()));
      } catch (error) {
        logger.error('Batch processing failed', { batchId: batch.id, error });
      }
    }
  }

  private startCacheCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.queryCache.entries()) {
      if (now - entry.timestamp.getTime() > entry.ttl) {
        expiredKeys.push(key);
        this.currentCacheSize -= entry.size;
      }
    }

    expiredKeys.forEach(key => this.queryCache.delete(key));

    if (expiredKeys.length > 0) {
      logger.debug('Cleaned up expired cache entries', { count: expiredKeys.length });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Shutdown the optimizer and clean up resources
   */
  async shutdown(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    // Process any remaining batches
    await this.processBatchQueue();

    // Clear cache
    this.clearCache();

    logger.info('Database Query Optimizer shutdown complete');
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const databaseQueryOptimizer = DatabaseQueryOptimizer.getInstance();

// ============================================================================
// Utility functions for easy integration
// ============================================================================

/**
 * Execute an optimized query with automatic caching and performance monitoring
 */
export async function executeOptimizedQuery<T>(
  operation: () => Promise<T>,
  queryId: string,
  options?: {
    table?: string;
    cacheTTL?: number;
    enableCache?: boolean;
    priority?: 'low' | 'normal' | 'high';
  }
): Promise<T> {
  return databaseQueryOptimizer.executeOptimizedQuery(operation, queryId, options);
}

/**
 * Execute multiple queries in optimized batches
 */
export async function executeBatchQueries<T>(
  operations: Array<{
    operation: () => Promise<T>;
    queryId: string;
    options?: { table?: string; priority?: 'low' | 'normal' | 'high' };
  }>,
  batchOptions?: {
    maxBatchSize?: number;
    timeout?: number;
  }
): Promise<T[]> {
  return databaseQueryOptimizer.executeBatchQueries(operations, batchOptions);
}

/**
 * Get query performance report
 */
export function getQueryPerformanceReport() {
  return databaseQueryOptimizer.getPerformanceReport();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return databaseQueryOptimizer.getCacheStats();
}