/**
 * Test Utilities and Helpers
 * Provides common testing utilities for service tests
 */

import { vi } from 'vitest';

export class TestHelpers {
  /**
   * Create mock timer that can be controlled in tests
   */
  static createMockTimer() {
    const timers = new Map<NodeJS.Timeout, { callback: () => void; delay: number }>();
    let currentTime = 0;

    const mockSetTimeout = vi.fn((callback: () => void, delay: number) => {
      const id = Symbol('timer') as any;
      timers.set(id, { callback, delay });
      return id;
    });

    const mockClearTimeout = vi.fn((id: NodeJS.Timeout) => {
      timers.delete(id);
    });

    const advanceTime = (ms: number) => {
      currentTime += ms;
      for (const [id, timer] of timers.entries()) {
        if (currentTime >= timer.delay) {
          timer.callback();
          timers.delete(id);
        }
      }
    };

    return {
      setTimeout: mockSetTimeout,
      clearTimeout: mockClearTimeout,
      advanceTime,
      getCurrentTime: () => currentTime,
      getPendingTimers: () => Array.from(timers.keys())
    };
  }

  /**
   * Create mock storage that behaves like localStorage
   */
  static createMockStorage() {
    const storage = new Map<string, string>();
    let quotaExceeded = false;

    return {
      getItem: vi.fn((key: string) => storage.get(key) || null),
      setItem: vi.fn((key: string, value: string) => {
        if (quotaExceeded) {
          throw new DOMException('QuotaExceededError');
        }
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
      key: vi.fn((index: number) => Array.from(storage.keys())[index] || null),
      get length() { return storage.size; },
      setQuotaExceeded: (exceeded: boolean) => { quotaExceeded = exceeded; },
      getStorage: () => new Map(storage)
    };
  }

  /**
   * Create mock fetch for HTTP testing
   */
  static createMockFetch() {
    const responses = new Map<string, Response>();
    let defaultResponse: Response | null = null;

    const mockFetch = vi.fn(async (url: string | Request) => {
      const urlString = typeof url === 'string' ? url : url.url;
      return responses.get(urlString) || defaultResponse || new Response('Not Found', { status: 404 });
    });

    return {
      fetch: mockFetch,
      setResponse: (url: string, response: Response) => responses.set(url, response),
      setDefaultResponse: (response: Response) => { defaultResponse = response; },
      clearResponses: () => responses.clear()
    };
  }

  /**
   * Create mock cache API
   */
  static createMockCacheAPI() {
    const caches = new Map<string, Map<string, Response>>();

    const mockCache = {
      match: vi.fn(async (request: string) => {
        for (const cache of caches.values()) {
          if (cache.has(request)) {
            return cache.get(request);
          }
        }
        return undefined;
      }),
      put: vi.fn(async (request: string, response: Response) => {
        // Add to first cache or create default
        const firstCache = caches.values().next().value || new Map();
        firstCache.set(request, response);
      }),
      delete: vi.fn(async (request: string) => {
        for (const cache of caches.values()) {
          cache.delete(request);
        }
      }),
      keys: vi.fn(async () => {
        const allKeys: string[] = [];
        for (const cache of caches.values()) {
          allKeys.push(...cache.keys());
        }
        return allKeys.map(key => ({ url: key }));
      })
    };

    const mockCaches = {
      open: vi.fn(async (name: string) => {
        if (!caches.has(name)) {
          caches.set(name, new Map());
        }
        return mockCache;
      }),
      delete: vi.fn(async (name: string) => {
        return caches.delete(name);
      })
    };

    return {
      caches: mockCaches,
      cache: mockCache,
      getCacheContents: (name: string) => caches.get(name) || new Map(),
      clearAllCaches: () => caches.clear()
    };
  }

  /**
   * Wait for all pending promises to resolve
   */
  static async flushPromises(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  /**
   * Create test data generators
   */
  static createDataGenerator() {
    let counter = 0;

    return {
      generateCacheEntry: (overrides: any = {}) => ({
        key: `test-key-${++counter}`,
        data: { id: counter, name: `Test ${counter}` },
        timestamp: new Date(),
        ttl: 5000,
        tags: ['test'],
        priority: 'medium' as const,
        accessCount: 1,
        lastAccessed: new Date(),
        size: 100,
        version: 1,
        dependencies: [],
        ...overrides
      }),

      generateQueryMetrics: (overrides: any = {}) => ({
        queryId: `query-${++counter}`,
        operation: 'SELECT',
        table: 'test_table',
        executionTime: 100,
        resultSize: 1024,
        cacheHit: false,
        timestamp: new Date(),
        ...overrides
      }),

      generateHealthCheckResult: (overrides: any = {}) => ({
        serviceName: `service-${counter}`,
        status: 'healthy' as const,
        responseTime: 50,
        timestamp: new Date(),
        ...overrides
      })
    };
  }

  /**
   * Assert that async operation completes within timeout
   */
  static async assertTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    message = 'Operation timed out'
  ): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    return Promise.race([operation, timeout]);
  }

  /**
   * Mock console methods and capture output
   */
  static mockConsole() {
    const logs: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = vi.fn((...args) => {
      logs.push(args.join(' '));
    });

    console.warn = vi.fn((...args) => {
      warnings.push(args.join(' '));
    });

    console.error = vi.fn((...args) => {
      errors.push(args.join(' '));
    });

    return {
      getLogs: () => [...logs],
      getWarnings: () => [...warnings],
      getErrors: () => [...errors],
      restore: () => {
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
      }
    };
  }
}