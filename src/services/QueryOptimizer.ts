import { dbManager } from '@/db/IndexedDBManager';
import { CacheManager } from './CacheManager';
import { logger } from '@/utils';

export interface QueryOptions {
  useCache?: boolean;
  cacheStrategy?: string;
  cacheTTL?: number;
  prefetch?: string[];
  batchSize?: number;
  timeout?: number;
}

export interface QueryResult<T> {
  data: T;
  fromCache: boolean;
  executionTime: number;
  queryHash: string;
}

export interface BatchQuery {
  table: string;
  operation: 'get' | 'getAll' | 'query';
  key?: string;
  filter?: (item: any) => boolean;
  cacheKey?: string;
}

export class QueryOptimizer {
  private static instance: QueryOptimizer;
  private cacheManager: CacheManager;
  private queryQueue: Map<string, Promise<any>> = new Map();
  private batchQueue: BatchQuery[] = [];

  private constructor() {
    this.cacheManager = CacheManager.getInstance();
  }

  public static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  /**
   * Optimized single item retrieval with caching
   */
  async get<T>(
    table: string,
    key: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T | null>> {
    const startTime = Date.now();
    const cacheKey = `${table}:${key}`;
    const queryHash = this.generateQueryHash(table, 'get', key);

    // Check cache first if enabled
    if (options.useCache !== false) {
      const cached = await this.cacheManager.get<T>(cacheKey, options.cacheStrategy);
      if (cached !== null) {
        return {
          data: cached,
          fromCache: true,
          executionTime: Date.now() - startTime,
          queryHash
        };
      }
    }

    // Deduplicate identical queries
    const existingQuery = this.queryQueue.get(queryHash);
    if (existingQuery) {
      const data = await existingQuery;
      return {
        data: data || null,
        fromCache: false,
        executionTime: Date.now() - startTime,
        queryHash
      };
    }

    // Execute query
    const queryPromise = this.executeGet<T>(table, key);
    this.queryQueue.set(queryHash, queryPromise);

    try {
      const data = await queryPromise;

      // Cache result if enabled
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

      // Trigger prefetching if specified
      if (options.prefetch && options.prefetch.length > 0) {
        this.prefetchRelated(options.prefetch, options).catch(error => {
          logger.error('Prefetch failed', error);
        });
      }

      return {
        data,
        fromCache: false,
        executionTime: Date.now() - startTime,
        queryHash
      };
    } finally {
      this.queryQueue.delete(queryHash);
    }
  }

  /**
   * Optimized batch retrieval with intelligent caching
   */
  async getAll<T>(
    table: string,
    filter?: (item: T) => boolean,
    options: QueryOptions = {}
  ): Promise<QueryResult<T[]>> {
    const startTime = Date.now();
    const filterHash = filter ? this.hashFunction(filter.toString()) : 'all';
    const cacheKey = `${table}:getAll:${filterHash}`;
    const queryHash = this.generateQueryHash(table, 'getAll', filterHash);

    // Check cache first
    if (options.useCache !== false) {
      const cached = await this.cacheManager.get<T[]>(cacheKey, options.cacheStrategy);
      if (cached !== null) {
        return {
          data: cached,
          fromCache: true,
          executionTime: Date.now() - startTime,
          queryHash
        };
      }
    }

    // Deduplicate identical queries
    const existingQuery = this.queryQueue.get(queryHash);
    if (existingQuery) {
      const data = await existingQuery;
      return {
        data,
        fromCache: false,
        executionTime: Date.now() - startTime,
        queryHash
      };
    }

    // Execute query
    const queryPromise = this.executeGetAll<T>(table, filter, options.batchSize);
    this.queryQueue.set(queryHash, queryPromise);

    try {
      const data = await queryPromise;

      // Cache result
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
        executionTime: Date.now() - startTime,
        queryHash
      };
    } finally {
      this.queryQueue.delete(queryHash);
    }
  }

  /**
   * Batch multiple queries for optimal performance
   */
  async batchQuery(queries: BatchQuery[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const startTime = Date.now();

    // Group queries by table for optimal execution
    const queryGroups = this.groupQueriesByTable(queries);

    // Execute queries in parallel by table
    const executionPromises = Array.from(queryGroups.entries()).map(
      async ([table, tableQueries]) => {
        const tableResults = await this.executeBatchForTable(table, tableQueries);
        for (const [key, value] of tableResults.entries()) {
          results.set(key, value);
        }
      }
    );

    await Promise.all(executionPromises);

    logger.debug('Batch query completed', {
      queryCount: queries.length,
      executionTime: Date.now() - startTime,
      resultCount: results.size
    });

    return results;
  }

  /**
   * Intelligent prefetching based on usage patterns
   */
  async prefetchRelated(keys: string[], options: QueryOptions = {}): Promise<void> {
    const prefetchPromises = keys.map(async (key) => {
      const [table, id] = key.split(':');
      if (table && id) {
        try {
          await this.get(table, id, {
            ...options,
            useCache: true // Always use cache for prefetching
          });
        } catch (error) {
          logger.error('Prefetch failed for key', { key, error });
        }
      }
    });

    await Promise.allSettled(prefetchPromises);
  }

  /**
   * Invalidate cache for specific table or pattern
   */
  async invalidateCache(pattern: string): Promise<void> {
    await this.cacheManager.invalidate(pattern, true);
    logger.debug('Cache invalidated', { pattern });
  }

  /**
   * Get query performance statistics
   */
  getStats() {
    return {
      cache: this.cacheManager.getStats(),
      activeQueries: this.queryQueue.size,
      batchQueueSize: this.batchQueue.length
    };
  }

  // Private helper methods

  private async executeGet<T>(table: string, key: string): Promise<T | null> {
    try {
      await dbManager.init();
      return await dbManager.get<T>(table, key);
    } catch (error) {
      logger.error('Database get failed', { table, key, error });
      throw error;
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

      if (filter) {
        results = results.filter(filter);
      }

      // Apply batch size limit if specified
      if (batchSize && results.length > batchSize) {
        results = results.slice(0, batchSize);
      }

      return results;
    } catch (error) {
      logger.error('Database getAll failed', { table, error });
      throw error;
    }
  }

  private groupQueriesByTable(queries: BatchQuery[]): Map<string, BatchQuery[]> {
    const groups = new Map<string, BatchQuery[]>();

    for (const query of queries) {
      const existing = groups.get(query.table) || [];
      existing.push(query);
      groups.set(query.table, existing);
    }

    return groups;
  }

  private async executeBatchForTable(
    _table: string,
    queries: BatchQuery[]
  ): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    // Execute queries in parallel
    const queryPromises = queries.map(async (query) => {
      const cacheKey = query.cacheKey || `${query.table}:${query.key || 'batch'}`;
      
      try {
        let result: any;

        switch (query.operation) {
          case 'get':
            if (query.key) {
              result = await this.executeGet(query.table, query.key);
            }
            break;

          case 'getAll':
            result = await this.executeGetAll(query.table, query.filter);
            break;

          case 'query':
            // Custom query logic would go here
            result = await this.executeGetAll(query.table, query.filter);
            break;
        }

        results.set(cacheKey, result);
      } catch (error) {
        logger.error('Batch query item failed', { query, error });
        results.set(cacheKey, null);
      }
    });

    await Promise.all(queryPromises);
    return results;
  }

  private generateQueryHash(table: string, operation: string, key: string): string {
    return `${table}:${operation}:${this.hashFunction(key)}`;
  }

  private hashFunction(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}