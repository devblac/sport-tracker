/**
 * Database Performance Optimizer
 * Implements intelligent indexing and query optimization for IndexedDB
 */

interface IndexConfig {
  storeName: string;
  indexName: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
  priority: 'high' | 'medium' | 'low';
}

interface QueryOptimization {
  storeName: string;
  operation: 'get' | 'getAll' | 'count' | 'query';
  indexUsed?: string;
  executionTime: number;
  resultCount: number;
  timestamp: number;
}

class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private queryMetrics = new Map<string, QueryOptimization[]>();
  private indexConfigs: IndexConfig[] = [
    // User-related indexes
    {
      storeName: 'users',
      indexName: 'by_email',
      keyPath: 'email',
      options: { unique: true },
      priority: 'high'
    },
    {
      storeName: 'users',
      indexName: 'by_role',
      keyPath: 'role',
      priority: 'medium'
    },
    {
      storeName: 'users',
      indexName: 'by_created_at',
      keyPath: 'created_at',
      priority: 'low'
    },

    // Exercise-related indexes
    {
      storeName: 'exercises',
      indexName: 'by_category',
      keyPath: 'category',
      priority: 'high'
    },
    {
      storeName: 'exercises',
      indexName: 'by_body_parts',
      keyPath: 'body_parts',
      options: { multiEntry: true },
      priority: 'high'
    },
    {
      storeName: 'exercises',
      indexName: 'by_muscle_groups',
      keyPath: 'muscle_groups',
      options: { multiEntry: true },
      priority: 'high'
    },
    {
      storeName: 'exercises',
      indexName: 'by_equipment',
      keyPath: 'equipment',
      priority: 'medium'
    },
    {
      storeName: 'exercises',
      indexName: 'by_difficulty',
      keyPath: 'difficulty_level',
      priority: 'medium'
    },
    {
      storeName: 'exercises',
      indexName: 'by_name_category',
      keyPath: ['name', 'category'],
      priority: 'high'
    },

    // Workout-related indexes
    {
      storeName: 'workouts',
      indexName: 'by_user_id',
      keyPath: 'user_id',
      priority: 'high'
    },
    {
      storeName: 'workouts',
      indexName: 'by_completed_at',
      keyPath: 'completed_at',
      priority: 'high'
    },
    {
      storeName: 'workouts',
      indexName: 'by_is_template',
      keyPath: 'is_template',
      priority: 'medium'
    },
    {
      storeName: 'workouts',
      indexName: 'by_user_completed',
      keyPath: ['user_id', 'completed_at'],
      priority: 'high'
    },
    {
      storeName: 'workouts',
      indexName: 'by_user_template',
      keyPath: ['user_id', 'is_template'],
      priority: 'medium'
    },

    // Exercise history indexes
    {
      storeName: 'exercise_history',
      indexName: 'by_user_exercise',
      keyPath: ['user_id', 'exercise_id'],
      priority: 'high'
    },
    {
      storeName: 'exercise_history',
      indexName: 'by_workout_id',
      keyPath: 'workout_id',
      priority: 'high'
    },
    {
      storeName: 'exercise_history',
      indexName: 'by_completed_at',
      keyPath: 'completed_at',
      priority: 'medium'
    },
    {
      storeName: 'exercise_history',
      indexName: 'by_user_date',
      keyPath: ['user_id', 'completed_at'],
      priority: 'high'
    },

    // Personal records indexes
    {
      storeName: 'personal_records',
      indexName: 'by_user_exercise',
      keyPath: ['user_id', 'exercise_id'],
      options: { unique: true },
      priority: 'high'
    },
    {
      storeName: 'personal_records',
      indexName: 'by_record_type',
      keyPath: 'record_type',
      priority: 'medium'
    },
    {
      storeName: 'personal_records',
      indexName: 'by_achieved_at',
      keyPath: 'achieved_at',
      priority: 'low'
    },

    // Social-related indexes
    {
      storeName: 'gym_friends',
      indexName: 'by_user_id',
      keyPath: 'user_id',
      priority: 'high'
    },
    {
      storeName: 'gym_friends',
      indexName: 'by_friend_id',
      keyPath: 'friend_id',
      priority: 'high'
    },
    {
      storeName: 'gym_friends',
      indexName: 'by_status',
      keyPath: 'status',
      priority: 'medium'
    },
    {
      storeName: 'gym_friends',
      indexName: 'by_user_status',
      keyPath: ['user_id', 'status'],
      priority: 'high'
    },

    // Social posts indexes
    {
      storeName: 'social_posts',
      indexName: 'by_user_id',
      keyPath: 'user_id',
      priority: 'high'
    },
    {
      storeName: 'social_posts',
      indexName: 'by_created_at',
      keyPath: 'created_at',
      priority: 'high'
    },
    {
      storeName: 'social_posts',
      indexName: 'by_type',
      keyPath: 'type',
      priority: 'medium'
    },
    {
      storeName: 'social_posts',
      indexName: 'by_visibility',
      keyPath: 'visibility',
      priority: 'medium'
    },
    {
      storeName: 'social_posts',
      indexName: 'by_user_date',
      keyPath: ['user_id', 'created_at'],
      priority: 'high'
    },

    // Achievements indexes
    {
      storeName: 'user_achievements',
      indexName: 'by_user_id',
      keyPath: 'user_id',
      priority: 'high'
    },
    {
      storeName: 'user_achievements',
      indexName: 'by_achievement_id',
      keyPath: 'achievement_id',
      priority: 'medium'
    },
    {
      storeName: 'user_achievements',
      indexName: 'by_unlocked_at',
      keyPath: 'unlocked_at',
      priority: 'low'
    },
    {
      storeName: 'user_achievements',
      indexName: 'by_user_unlocked',
      keyPath: ['user_id', 'unlocked_at'],
      priority: 'high'
    },

    // Streaks indexes
    {
      storeName: 'user_streaks',
      indexName: 'by_user_id',
      keyPath: 'user_id',
      options: { unique: true },
      priority: 'high'
    },
    {
      storeName: 'user_streaks',
      indexName: 'by_current_streak',
      keyPath: 'current_streak',
      priority: 'medium'
    },
    {
      storeName: 'user_streaks',
      indexName: 'by_last_workout_date',
      keyPath: 'last_workout_date',
      priority: 'medium'
    }
  ];

  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  /**
   * Create optimized indexes for a database
   */
  async createOptimizedIndexes(db: IDBDatabase): Promise<void> {
    const transaction = db.transaction(db.objectStoreNames, 'readwrite');
    
    for (const config of this.indexConfigs) {
      try {
        const store = transaction.objectStore(config.storeName);
        
        // Check if index already exists
        if (!store.indexNames.contains(config.indexName)) {
          store.createIndex(config.indexName, config.keyPath, config.options);
          console.log(`Created index: ${config.indexName} on ${config.storeName}`);
        }
      } catch (error) {
        console.warn(`Failed to create index ${config.indexName}:`, error);
      }
    }

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get optimal index for a query
   */
  getOptimalIndex(storeName: string, queryKeys: string[]): string | null {
    const storeIndexes = this.indexConfigs.filter(config => config.storeName === storeName);
    
    // Find exact match first
    for (const config of storeIndexes) {
      const indexKeys = Array.isArray(config.keyPath) ? config.keyPath : [config.keyPath];
      if (this.arraysEqual(indexKeys, queryKeys)) {
        return config.indexName;
      }
    }

    // Find partial match with highest priority
    let bestMatch: IndexConfig | null = null;
    for (const config of storeIndexes) {
      const indexKeys = Array.isArray(config.keyPath) ? config.keyPath : [config.keyPath];
      if (this.isPartialMatch(indexKeys, queryKeys)) {
        if (!bestMatch || this.getPriorityScore(config.priority) > this.getPriorityScore(bestMatch.priority)) {
          bestMatch = config;
        }
      }
    }

    return bestMatch?.indexName || null;
  }

  /**
   * Record query performance metrics
   */
  recordQueryMetrics(
    storeName: string,
    operation: string,
    executionTime: number,
    resultCount: number,
    indexUsed?: string
  ): void {
    const metric: QueryOptimization = {
      storeName,
      operation: operation as any,
      indexUsed,
      executionTime,
      resultCount,
      timestamp: Date.now()
    };

    const storeMetrics = this.queryMetrics.get(storeName) || [];
    storeMetrics.push(metric);
    
    // Keep only last 100 metrics per store
    if (storeMetrics.length > 100) {
      storeMetrics.shift();
    }
    
    this.queryMetrics.set(storeName, storeMetrics);
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): {
    storeName: string;
    avgExecutionTime: number;
    totalQueries: number;
    indexUsageRate: number;
    slowQueries: number;
  }[] {
    const analytics: any[] = [];

    for (const [storeName, metrics] of this.queryMetrics.entries()) {
      const totalQueries = metrics.length;
      const avgExecutionTime = metrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries;
      const indexedQueries = metrics.filter(m => m.indexUsed).length;
      const indexUsageRate = indexedQueries / totalQueries;
      const slowQueries = metrics.filter(m => m.executionTime > 100).length;

      analytics.push({
        storeName,
        avgExecutionTime: Math.round(avgExecutionTime * 100) / 100,
        totalQueries,
        indexUsageRate: Math.round(indexUsageRate * 100) / 100,
        slowQueries
      });
    }

    return analytics.sort((a, b) => b.avgExecutionTime - a.avgExecutionTime);
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): {
    storeName: string;
    recommendation: string;
    impact: 'high' | 'medium' | 'low';
    suggestedIndex?: IndexConfig;
  }[] {
    const recommendations: any[] = [];
    const analytics = this.getPerformanceAnalytics();

    for (const analytic of analytics) {
      // Recommend indexes for stores with low index usage
      if (analytic.indexUsageRate < 0.5 && analytic.totalQueries > 10) {
        recommendations.push({
          storeName: analytic.storeName,
          recommendation: `Low index usage rate (${analytic.indexUsageRate}%). Consider adding more specific indexes.`,
          impact: 'high'
        });
      }

      // Recommend optimization for slow queries
      if (analytic.slowQueries > analytic.totalQueries * 0.2) {
        recommendations.push({
          storeName: analytic.storeName,
          recommendation: `${analytic.slowQueries} slow queries detected. Review query patterns and indexes.`,
          impact: 'medium'
        });
      }

      // Recommend composite indexes for frequently queried combinations
      const storeMetrics = this.queryMetrics.get(analytic.storeName) || [];
      const frequentPatterns = this.analyzeQueryPatterns(storeMetrics);
      
      for (const pattern of frequentPatterns) {
        if (pattern.frequency > 5 && !this.hasCompositeIndex(analytic.storeName, pattern.keys)) {
          recommendations.push({
            storeName: analytic.storeName,
            recommendation: `Frequent query pattern detected: ${pattern.keys.join(', ')}. Consider composite index.`,
            impact: 'medium',
            suggestedIndex: {
              storeName: analytic.storeName,
              indexName: `by_${pattern.keys.join('_')}`,
              keyPath: pattern.keys,
              priority: 'medium'
            }
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Optimize query execution with best practices
   */
  async optimizeQuery<T>(
    store: IDBObjectStore,
    queryType: 'get' | 'getAll' | 'count',
    keyOrRange?: IDBValidKey | IDBKeyRange,
    indexName?: string
  ): Promise<T[]> {
    const startTime = performance.now();
    let result: T[] = [];
    let actualIndexUsed = indexName;

    try {
      if (indexName && store.indexNames.contains(indexName)) {
        const index = store.index(indexName);
        
        switch (queryType) {
          case 'get':
            const singleResult = await this.promisifyRequest(index.get(keyOrRange));
            result = singleResult ? [singleResult] : [];
            break;
          case 'getAll':
            result = await this.promisifyRequest(index.getAll(keyOrRange));
            break;
          case 'count':
            const count = await this.promisifyRequest(index.count(keyOrRange));
            result = [count as any];
            break;
        }
      } else {
        // Fallback to store query without index
        actualIndexUsed = undefined;
        
        switch (queryType) {
          case 'get':
            const singleResult = await this.promisifyRequest(store.get(keyOrRange));
            result = singleResult ? [singleResult] : [];
            break;
          case 'getAll':
            result = await this.promisifyRequest(store.getAll(keyOrRange));
            break;
          case 'count':
            const count = await this.promisifyRequest(store.count(keyOrRange));
            result = [count as any];
            break;
        }
      }

      const executionTime = performance.now() - startTime;
      this.recordQueryMetrics(
        store.name,
        queryType,
        executionTime,
        result.length,
        actualIndexUsed
      );

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordQueryMetrics(store.name, queryType, executionTime, 0, actualIndexUsed);
      throw error;
    }
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }

  private isPartialMatch(indexKeys: string[], queryKeys: string[]): boolean {
    return queryKeys.every(key => indexKeys.includes(key));
  }

  private getPriorityScore(priority: string): number {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private analyzeQueryPatterns(metrics: QueryOptimization[]): {
    keys: string[];
    frequency: number;
  }[] {
    // This would analyze actual query patterns from metrics
    // For now, return empty array
    return [];
  }

  private hasCompositeIndex(storeName: string, keys: string[]): boolean {
    return this.indexConfigs.some(config => 
      config.storeName === storeName && 
      Array.isArray(config.keyPath) && 
      this.arraysEqual(config.keyPath, keys)
    );
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.queryMetrics.clear();
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): string {
    const data = {
      metrics: Object.fromEntries(this.queryMetrics),
      analytics: this.getPerformanceAnalytics(),
      recommendations: this.getOptimizationRecommendations(),
      timestamp: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }
}

// Export singleton instance
export const databaseOptimizer = DatabaseOptimizer.getInstance();

// Utility functions for common query optimizations
export const QueryOptimizations = {
  /**
   * Optimize range queries with proper key ranges
   */
  createOptimalKeyRange(
    lowerBound?: any,
    upperBound?: any,
    lowerOpen = false,
    upperOpen = false
  ): IDBKeyRange | undefined {
    if (lowerBound !== undefined && upperBound !== undefined) {
      return IDBKeyRange.bound(lowerBound, upperBound, lowerOpen, upperOpen);
    } else if (lowerBound !== undefined) {
      return IDBKeyRange.lowerBound(lowerBound, lowerOpen);
    } else if (upperBound !== undefined) {
      return IDBKeyRange.upperBound(upperBound, upperOpen);
    }
    return undefined;
  },

  /**
   * Create compound key for composite indexes
   */
  createCompoundKey(...values: any[]): any[] {
    return values.filter(v => v !== undefined && v !== null);
  },

  /**
   * Optimize pagination queries
   */
  createPaginationRange(
    lastKey: any,
    direction: 'next' | 'prev' = 'next'
  ): IDBKeyRange {
    return direction === 'next' 
      ? IDBKeyRange.lowerBound(lastKey, true)
      : IDBKeyRange.upperBound(lastKey, true);
  }
};