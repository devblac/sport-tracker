/**
 * Optimized Query Batcher
 * Reduces database connections and improves performance
 */

interface BatchedQuery<T> {
  id: string;
  operation: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  priority: number;
  timestamp: number;
}

export class QueryBatcher {
  private queue: BatchedQuery<any>[] = [];
  private processing = false;
  private batchTimer?: NodeJS.Timeout;

  constructor(
    private config: {
      maxBatchSize: number;
      batchTimeout: number;
      maxConcurrency: number;
    }
  ) {}

  /**
   * Add query to batch with automatic processing
   */
  async addQuery<T>(
    operation: () => Promise<T>,
    options: {
      id?: string;
      priority?: number;
    } = {}
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const query: BatchedQuery<T> = {
        id: options.id || `query_${Date.now()}_${Math.random()}`,
        operation,
        resolve,
        reject,
        priority: options.priority || 0,
        timestamp: Date.now()
      };

      this.queue.push(query);
      this.scheduleProcessing();
    });
  }

  /**
   * Process batches with concurrency control
   */
  private scheduleProcessing(): void {
    if (this.processing) return;

    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Process immediately if batch is full
    if (this.queue.length >= this.config.maxBatchSize) {
      this.processBatch();
      return;
    }

    // Schedule processing after timeout
    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.config.batchTimeout);
  }

  private async processBatch(): void {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      // Sort by priority (higher first)
      this.queue.sort((a, b) => b.priority - a.priority);

      // Take batch
      const batch = this.queue.splice(0, this.config.maxBatchSize);

      // Process with concurrency control
      await this.executeConcurrentBatch(batch);

    } finally {
      this.processing = false;

      // Schedule next batch if queue not empty
      if (this.queue.length > 0) {
        this.scheduleProcessing();
      }
    }
  }

  private async executeConcurrentBatch(batch: BatchedQuery<any>[]): Promise<void> {
    const semaphore = new Array(this.config.maxConcurrency).fill(null);
    
    const executeQuery = async (query: BatchedQuery<any>) => {
      // Wait for available slot
      while (true) {
        const slotIndex = semaphore.findIndex(slot => slot === null);
        if (slotIndex !== -1) {
          semaphore[slotIndex] = query.id;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      try {
        const result = await query.operation();
        query.resolve(result);
      } catch (error) {
        query.reject(error as Error);
      } finally {
        // Release slot
        const slotIndex = semaphore.indexOf(query.id);
        if (slotIndex !== -1) {
          semaphore[slotIndex] = null;
        }
      }
    };

    // Execute all queries concurrently
    await Promise.allSettled(batch.map(executeQuery));
  }

  /**
   * Get current queue statistics
   */
  getStats(): {
    queueLength: number;
    processing: boolean;
    oldestQuery: number | null;
  } {
    const oldestQuery = this.queue.length > 0 
      ? Date.now() - Math.min(...this.queue.map(q => q.timestamp))
      : null;

    return {
      queueLength: this.queue.length,
      processing: this.processing,
      oldestQuery
    };
  }

  /**
   * Clear queue and reject pending queries
   */
  clear(): void {
    const error = new Error('Query batch cleared');
    this.queue.forEach(query => query.reject(error));
    this.queue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }
  }
}