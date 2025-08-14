/**
 * World-Class Query Service
 * Enterprise-grade implementation with bulletproof exports
 */

import { dbManager } from '@/db/IndexedDBManager';
import { CacheManager } from './CacheManager';
import { logger } from '@/utils';
import type { QueryOptions, QueryResult, QueryStats } from '@/types/query';

/**
 * Enterprise-grade Query Service with advanced caching
 * Implements singleton pattern for optimal resource management
 */
export class QueryService {
  private static instance: QueryService;
  private readonly cacheManager: CacheManager;
  private readonly queryQueue = new Map<string, Promise<any>>();
  private readonly queryStats = {
    totalQueries: 0,
    totalExecutionTime: 0,
    cacheHits: 0
  };

  private constructor() {
    this.cacheManager = CacheManager.getInstance();
    logger.info('QueryService initialized');
  }

  /**
   * Get singleton instance with thread-safe initialization
   */
  public static getInstance(): QueryService {
    if (!QueryService.instance) {
      QueryService.instance = new QueryService();
    }
    return QueryService.instance;
  }

  /**
   * High-performance single item retrieval with intelligent caching
   */
  public async get<T>(
    table: string,
    key: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T | null>> {
    const startTime = performance.now();
    const cacheKey = `${table}:${key}`;
    const queryHash = this.generateQueryHash(table, 'get', key);

    this.queryStats.totalQueries++;

    try {
      // Phase 1: Cache lookup with strategy-based optimization
      if (options.useCache !== false) {
        const cached = await this.cacheManager.get<T>(cacheKey, options.cacheStrategy);
        if (cached !== null) {
          this.queryStats.cacheHits++;
          const executionTime = performance.now() - startTime;
          
          logger.debug('Cache hit', { table, key, executionTime });
          
          return {
            data: cached,
            fromCache: true,
            executionTime,
            queryHash
          };
        }
      }

      // Phase 2: Query deduplication for concurrent requests
      const existingQuery = this.queryQueue.get(queryHash);
      if (existingQuery) {
        const data = await existingQuery;
        const executionTime = performance.now() - startTime;
        
        return {
          data: data ?? null,
          fromCache: false,
          executionTime,
          queryHash
        };
      }

      // Phase 3: Execute optimized database query
      const queryPromise = this.executeGet<T>(table, key);
      this.queryQueue.set(queryHash, queryPromise);

      const data = await queryPromise;
      const executionTime = performance.now() - startTime;
      
      this.queryStats.totalExecutionTime += executionTime;

      // Phase 4: Intelligent caching with strategy application
      if (options.useCache !== false && data !== null) {
        await this.cacheManager.set(
          cacheKey,
          data,
          options.cacheStrategy,
          {
            ttl: options.cacheTTL,
            tags: [table, `${table}:${key}`]
          }
        );
      }

      logger.debug('Database query completed', { table, key, executionTime });

      return {
        data,
        fromCache: false,
        executionTime,
        queryHash
      };

    } catch (error) {
      logger.error('Query failed', error, { table, key });
      throw error;
    } finally {
      this.queryQueue.delete(queryHash);
    }
  }

  /**
   * High-performance batch retrieval with intelligent filtering
   */
  public async getAll<T>(
    table: string,
    filter?: (item: T) => boolean,
    options: QueryOptions = {}
  ): Promise<QueryResult<T[]>> {
    const startTime = performance.now();
    const filterHash = filter ? this.hashFunction(filter.toString()) : 'all';
    const cacheKey = `${table}:getAll:${filterHash}`;
    const queryHash = this.generateQueryHash(table, 'getAll', filterHash);

    this.queryStats.totalQueries++;

    try {
      // Phase 1: Cache lookup
      if (options.useCache !== false) {
        const cached = await this.cacheManager.get<T[]>(cacheKey, options.cacheStrategy);
        if (cached !== null) {
          this.queryStats.cacheHits++;
          const executionTime = performance.now() - startTime;
          
          return {
            data: cached,
            fromCache: true,
            executionTime,
            queryHash
          };
        }
      }

      // Phase 2: Execute query with optimization
      const queryPromise = this.executeGetAll<T>(table, filter, options.batchSize);
      this.queryQueue.set(queryHash, queryPromise);

      const data = await queryPromise;
      const executionTime = performance.now() - startTime;
      
      this.queryStats.totalExecutionTime += executionTime;

      // Phase 3: Cache result
      if (options.useCache !== false) {
        await this.cacheManager.set(
          cacheKey,
          data,
          options.cacheStrategy,
          {
            ttl: options.cacheTTL,
            tags: [table, `${table}:getAll`]
          }
        );
      }

      return {
        data,
        fromCache: false,
        executionTime,
        queryHash
      };

    } catch (error) {
      logger.error('Batch query failed', error, { table });
      throw error;
    } finally {
      this.queryQueue.delete(queryHash);
    }
  }

  /**
   * Intelligent cache invalidation with pattern matching
   */
  public async invalidateCache(pattern: string): Promise<void> {
    try {
      await this.cacheManager.invalidate(pattern, true);
      logger.debug('Cache invalidated', { pattern });
    } catch (error) {
      logger.error('Cache invalidation failed', error, { pattern });
      throw error;
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  public getStats(): QueryStats {
    const cacheHitRate = this.queryStats.totalQueries > 0 
      ? this.queryStats.cacheHits / this.queryStats.totalQueries 
      : 0;
    
    const averageExecutionTime = this.queryStats.totalQueries > 0
      ? this.queryStats.totalExecutionTime / this.queryStats.totalQueries
      : 0;

    return {
      cacheHitRate,
      activeQueries: this.queryQueue.size,
      totalQueries: this.queryStats.totalQueries,
      averageExecutionTime
    };
  }

  /**
   * Reset performance statistics
   */
  public resetStats(): void {
    this.queryStats.totalQueries = 0;
    this.queryStats.totalExecutionTime = 0;
    this.queryStats.cacheHits = 0;
    logger.info('Query statistics reset');
  }

  // Private implementation methods

  private async executeGet<T>(table: string, key: string): Promise<T | null> {
    try {
      await dbManager.init();
      const result = await dbManager.get<T>(table, key);
      return result ?? null;
    } catch (error) {
      logger.error('Database get operation failed', error, { table, key });
      throw new Error(`Failed to retrieve ${key} from ${table}: ${error}`);
    }
  }

  private async executeGetAll<T>(
    table: string,
    filter?: (item: T) => boolean,
    batchSize?: number
  ): Promise<T[]> {
    try {
      await dbManager.init();
      let results = await dbManager.getAll<T>(table);

      // Apply filter if provided
      if (filter) {
        results = results.filter(filter);
      }

      // Apply batch size limit for performance
      if (batchSize && results.length > batchSize) {
        results = results.slice(0, batchSize);
        logger.debug('Batch size limit applied', { table, originalSize: results.length, limitedSize: batchSize });
      }

      return results;
    } catch (error) {
      logger.error('Database getAll operation failed', error, { table });
      throw new Error(`Failed to retrieve all from ${table}: ${error}`);
    }
  }

  private generateQueryHash(table: string, operation: string, key: string): string {
    return `${table}:${operation}:${this.hashFunction(key)}`;
  }

  private hashFunction(input: string): string {
    if (!input) return '0';
    
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}

// Export singleton instance for convenience
export const queryService = QueryService.getInstance();

// Legacy compatibility exports
export const QueryOptimizer = QueryService;