import { useState, useEffect, useCallback, useRef } from 'react';
import { QueryOptimizer } from '@/services/QueryService';
import type { QueryOptions, QueryResult } from '@/types/query';
import { PrefetchManager } from '@/services/PrefetchManager';

export interface UseOptimizedQueryOptions extends QueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UseOptimizedQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fromCache: boolean;
  executionTime: number;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export const useOptimizedQuery = <T>(
  table: string,
  key: string,
  options: UseOptimizedQueryOptions = {}
): UseOptimizedQueryResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);

  const queryOptimizer = useRef(QueryOptimizer.getInstance());
  const prefetchManager = useRef(PrefetchManager.getInstance());
  const abortController = useRef<AbortController | null>(null);

  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    onSuccess,
    onError,
    ...queryOptions
  } = options;

  const executeQuery = useCallback(async () => {
    if (!enabled || !table || !key) return;

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      // Record behavior for prefetch learning
      prefetchManager.current.recordBehavior({
        userId: 'current_user', // This should come from auth context
        action: 'query',
        resource: `${table}:${key}`,
        context: { table, key }
      });

      // Execute optimized query
      const result: QueryResult<T> = await queryOptimizer.current.get<T>(
        table,
        key,
        queryOptions
      );

      if (!abortController.current.signal.aborted) {
        setData(result.data);
        setFromCache(result.fromCache);
        setExecutionTime(result.executionTime);
        
        if (result.data && onSuccess) {
          onSuccess(result.data);
        }

        // Trigger prefetch for related data
        await prefetchManager.current.triggerPrefetch(`${table}:${key}`, {
          table,
          key,
          userId: 'current_user'
        });
      }
    } catch (err) {
      if (!abortController.current.signal.aborted) {
        const error = err instanceof Error ? err : new Error('Query failed');
        setError(error);
        
        if (onError) {
          onError(error);
        }
      }
    } finally {
      if (!abortController.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [table, key, enabled, onSuccess, onError, queryOptions]);

  const refetch = useCallback(async () => {
    await executeQuery();
  }, [executeQuery]);

  const invalidate = useCallback(async () => {
    await queryOptimizer.current.invalidateCache(`${table}:${key}`);
    await executeQuery();
  }, [table, key, executeQuery]);

  // Initial query execution
  useEffect(() => {
    executeQuery();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [executeQuery]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (!loading) {
        executeQuery();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, loading, executeQuery]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(() => {
      if (!loading) {
        executeQuery();
      }
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, loading, executeQuery]);

  return {
    data,
    loading,
    error,
    fromCache,
    executionTime,
    refetch,
    invalidate
  };
};

export const useOptimizedQueryAll = <T>(
  table: string,
  filter?: (item: T) => boolean,
  options: UseOptimizedQueryOptions = {}
): UseOptimizedQueryResult<T[]> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);

  const queryOptimizer = useRef(QueryOptimizer.getInstance());
  const prefetchManager = useRef(PrefetchManager.getInstance());
  const abortController = useRef<AbortController | null>(null);

  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    onSuccess,
    onError,
    ...queryOptions
  } = options;

  const executeQuery = useCallback(async () => {
    if (!enabled || !table) return;

    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      // Record behavior
      prefetchManager.current.recordBehavior({
        userId: 'current_user',
        action: 'queryAll',
        resource: `${table}:getAll`,
        context: { table, hasFilter: !!filter }
      });

      const result: QueryResult<T[]> = await queryOptimizer.current.getAll<T>(
        table,
        filter,
        queryOptions
      );

      if (!abortController.current.signal.aborted) {
        setData(result.data);
        setFromCache(result.fromCache);
        setExecutionTime(result.executionTime);
        
        if (onSuccess) {
          onSuccess(result.data);
        }

        // Trigger prefetch
        await prefetchManager.current.triggerPrefetch(`${table}:getAll`, {
          table,
          userId: 'current_user'
        });
      }
    } catch (err) {
      if (!abortController.current.signal.aborted) {
        const error = err instanceof Error ? err : new Error('Query failed');
        setError(error);
        
        if (onError) {
          onError(error);
        }
      }
    } finally {
      if (!abortController.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [table, filter, enabled, onSuccess, onError, queryOptions]);

  const refetch = useCallback(async () => {
    await executeQuery();
  }, [executeQuery]);

  const invalidate = useCallback(async () => {
    await queryOptimizer.current.invalidateCache(`${table}:getAll`);
    await executeQuery();
  }, [table, executeQuery]);

  // Initial execution
  useEffect(() => {
    executeQuery();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [executeQuery]);

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (!loading) {
        executeQuery();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, loading, executeQuery]);

  // Interval refetch
  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(() => {
      if (!loading) {
        executeQuery();
      }
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, loading, executeQuery]);

  return {
    data,
    loading,
    error,
    fromCache,
    executionTime,
    refetch,
    invalidate
  };
};