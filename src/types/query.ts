/**
 * World-Class Query System Types
 * Bulletproof type definitions for enterprise-grade caching
 */

export interface QueryOptions {
  readonly useCache?: boolean;
  readonly cacheStrategy?: string;
  readonly cacheTTL?: number;
  readonly prefetch?: readonly string[];
  readonly batchSize?: number;
  readonly timeout?: number;
}

export interface QueryResult<T> {
  readonly data: T;
  readonly fromCache: boolean;
  readonly executionTime: number;
  readonly queryHash: string;
}

export interface QueryStats {
  readonly cacheHitRate: number;
  readonly activeQueries: number;
  readonly totalQueries: number;
  readonly averageExecutionTime: number;
}

export interface CacheInvalidationOptions {
  readonly pattern: string;
  readonly byTag?: boolean;
  readonly force?: boolean;
}

export interface QueryMetrics {
  readonly startTime: number;
  readonly endTime: number;
  readonly executionTime: number;
  readonly cacheHit: boolean;
  readonly queryHash: string;
}