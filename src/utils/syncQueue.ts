/**
 * Sync Queue System
 * Manages offline operations and synchronization with retry logic
 */

import { dbManager } from '@/db/IndexedDBManager';

export interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'workout' | 'exercise' | 'profile' | 'settings';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  nextRetryAt?: number;
}

export interface SyncQueueConfig {
  maxRetries: number;
  baseRetryDelay: number; // milliseconds
  maxRetryDelay: number; // milliseconds
  batchSize: number;
  processingTimeout: number; // milliseconds
}

const DEFAULT_CONFIG: SyncQueueConfig = {
  maxRetries: 5,
  baseRetryDelay: 1000, // 1 second
  maxRetryDelay: 300000, // 5 minutes
  batchSize: 10,
  processingTimeout: 30000, // 30 seconds
};

export class SyncQueue {
  private static instance: SyncQueue;
  private config: SyncQueueConfig;
  private isProcessing = false;
  private processingTimer?: NodeJS.Timeout;
  private listeners: Set<(operation: SyncOperation) => void> = new Set();

  private constructor(config: Partial<SyncQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeDatabase();
  }

  public static getInstance(config?: Partial<SyncQueueConfig>): SyncQueue {
    if (!SyncQueue.instance) {
      SyncQueue.instance = new SyncQueue(config);
    }
    return SyncQueue.instance;
  }

  /**
   * Initialize the sync queue database
   */
  private async initializeDatabase(): Promise<void> {
    try {
      await dbManager.init();
      // The sync_queue store should be defined in IndexedDBManager
      console.log('[SyncQueue] Database initialized');
    } catch (error) {
      console.error('[SyncQueue] Database initialization failed:', error);
    }
  }

  /**
   * Add an operation to the sync queue
   */
  async addOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    const syncOperation: SyncOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    try {
      await dbManager.put('sync_queue', syncOperation);
      console.log('[SyncQueue] Operation added:', syncOperation.id);
      
      // Notify listeners
      this.notifyListeners(syncOperation);
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this.startProcessing();
      }

      return syncOperation.id;
    } catch (error) {
      console.error('[SyncQueue] Failed to add operation:', error);
      throw error;
    }
  }

  /**
   * Get all pending operations
   */
  async getPendingOperations(): Promise<SyncOperation[]> {
    try {
      const allOperations = await dbManager.getAll<SyncOperation>('sync_queue');
      return allOperations
        .filter(op => op.status === 'pending' || op.status === 'failed')
        .sort((a, b) => {
          // Sort by priority first, then by timestamp
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.timestamp - b.timestamp;
        });
    } catch (error) {
      console.error('[SyncQueue] Failed to get pending operations:', error);
      return [];
    }
  }

  /**
   * Get operations by status
   */
  async getOperationsByStatus(status: SyncOperation['status']): Promise<SyncOperation[]> {
    try {
      const allOperations = await dbManager.getAll<SyncOperation>('sync_queue');
      return allOperations.filter(op => op.status === status);
    } catch (error) {
      console.error('[SyncQueue] Failed to get operations by status:', error);
      return [];
    }
  }

  /**
   * Update operation status
   */
  async updateOperationStatus(
    operationId: string, 
    status: SyncOperation['status'], 
    error?: string
  ): Promise<void> {
    try {
      const operation = await dbManager.get<SyncOperation>('sync_queue', operationId);
      if (!operation) {
        throw new Error(`Operation not found: ${operationId}`);
      }

      const updatedOperation: SyncOperation = {
        ...operation,
        status,
        error,
      };

      await dbManager.put('sync_queue', updatedOperation);
      this.notifyListeners(updatedOperation);
      
      console.log(`[SyncQueue] Operation ${operationId} status updated to ${status}`);
    } catch (error) {
      console.error('[SyncQueue] Failed to update operation status:', error);
      throw error;
    }
  }

  /**
   * Remove completed operations
   */
  async cleanupCompletedOperations(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      const allOperations = await dbManager.getAll<SyncOperation>('sync_queue');
      
      const operationsToDelete = allOperations.filter(op => 
        op.status === 'completed' && op.timestamp < cutoffTime
      );

      for (const operation of operationsToDelete) {
        await dbManager.delete('sync_queue', operation.id);
      }

      console.log(`[SyncQueue] Cleaned up ${operationsToDelete.length} completed operations`);
      return operationsToDelete.length;
    } catch (error) {
      console.error('[SyncQueue] Failed to cleanup completed operations:', error);
      return 0;
    }
  }

  /**
   * Start processing the queue
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    console.log('[SyncQueue] Starting queue processing');

    try {
      await this.processQueue();
    } catch (error) {
      console.error('[SyncQueue] Queue processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Stop processing the queue
   */
  stopProcessing(): void {
    this.isProcessing = false;
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
      this.processingTimer = undefined;
    }
    console.log('[SyncQueue] Queue processing stopped');
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    while (this.isProcessing) {
      try {
        const pendingOperations = await this.getPendingOperations();
        
        if (pendingOperations.length === 0) {
          // No pending operations, wait before checking again
          await this.sleep(5000); // 5 seconds
          continue;
        }

        // Process operations in batches
        const batch = pendingOperations.slice(0, this.config.batchSize);
        await this.processBatch(batch);

        // Small delay between batches
        await this.sleep(1000);
        
      } catch (error) {
        console.error('[SyncQueue] Error processing queue:', error);
        await this.sleep(5000); // Wait before retrying
      }
    }
  }

  /**
   * Process a batch of operations
   */
  private async processBatch(operations: SyncOperation[]): Promise<void> {
    const promises = operations.map(operation => this.processOperation(operation));
    await Promise.allSettled(promises);
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: SyncOperation): Promise<void> {
    // Check if operation should be retried
    if (operation.nextRetryAt && Date.now() < operation.nextRetryAt) {
      return; // Not time to retry yet
    }

    // Check if max retries exceeded
    if (operation.retryCount >= operation.maxRetries) {
      await this.updateOperationStatus(operation.id, 'failed', 'Max retries exceeded');
      return;
    }

    try {
      // Mark as processing
      await this.updateOperationStatus(operation.id, 'processing');

      // Process the operation based on type and entity
      await this.executeOperation(operation);

      // Mark as completed
      await this.updateOperationStatus(operation.id, 'completed');
      
      console.log(`[SyncQueue] Operation ${operation.id} completed successfully`);
      
    } catch (error) {
      console.error(`[SyncQueue] Operation ${operation.id} failed:`, error);
      
      // Increment retry count and calculate next retry time
      const updatedOperation: SyncOperation = {
        ...operation,
        retryCount: operation.retryCount + 1,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        nextRetryAt: this.calculateNextRetryTime(operation.retryCount + 1),
      };

      await dbManager.put('sync_queue', updatedOperation);
      this.notifyListeners(updatedOperation);
    }
  }

  /**
   * Execute the actual operation
   */
  private async executeOperation(operation: SyncOperation): Promise<void> {
    const { type, entity, data } = operation;

    // This would integrate with your actual API calls
    // For now, we'll simulate the operations
    
    switch (entity) {
      case 'workout':
        await this.syncWorkoutOperation(type, data);
        break;
      case 'exercise':
        await this.syncExerciseOperation(type, data);
        break;
      case 'profile':
        await this.syncProfileOperation(type, data);
        break;
      case 'settings':
        await this.syncSettingsOperation(type, data);
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  /**
   * Sync workout operations
   */
  private async syncWorkoutOperation(type: SyncOperation['type'], data: any): Promise<void> {
    // Simulate API call
    const response = await fetch(`/api/workouts${type === 'UPDATE' ? `/${data.id}` : ''}`, {
      method: type === 'CREATE' ? 'POST' : type === 'UPDATE' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: type !== 'DELETE' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`[SyncQueue] Workout ${type} operation completed`);
  }

  /**
   * Sync exercise operations
   */
  private async syncExerciseOperation(type: SyncOperation['type'], data: any): Promise<void> {
    // Similar implementation for exercises
    console.log(`[SyncQueue] Exercise ${type} operation simulated`);
  }

  /**
   * Sync profile operations
   */
  private async syncProfileOperation(type: SyncOperation['type'], data: any): Promise<void> {
    // Similar implementation for profile
    console.log(`[SyncQueue] Profile ${type} operation simulated`);
  }

  /**
   * Sync settings operations
   */
  private async syncSettingsOperation(type: SyncOperation['type'], data: any): Promise<void> {
    // Similar implementation for settings
    console.log(`[SyncQueue] Settings ${type} operation simulated`);
  }

  /**
   * Calculate next retry time using exponential backoff
   */
  private calculateNextRetryTime(retryCount: number): number {
    const delay = Math.min(
      this.config.baseRetryDelay * Math.pow(2, retryCount - 1),
      this.config.maxRetryDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    
    return Date.now() + delay + jitter;
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add listener for operation updates
   */
  addListener(listener: (operation: SyncOperation) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove listener
   */
  removeListener(listener: (operation: SyncOperation) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(operation: SyncOperation): void {
    this.listeners.forEach(listener => {
      try {
        listener(operation);
      } catch (error) {
        console.error('[SyncQueue] Listener error:', error);
      }
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    try {
      const allOperations = await dbManager.getAll<SyncOperation>('sync_queue');
      
      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: allOperations.length,
      };

      allOperations.forEach(op => {
        stats[op.status]++;
      });

      return stats;
    } catch (error) {
      // Silently handle database not ready errors during initialization
      if (error instanceof Error && error.message.includes('object stores was not found')) {
        return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
      }
      console.error('[SyncQueue] Failed to get queue stats:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    }
  }
}

// Export singleton instance
export const syncQueue = SyncQueue.getInstance();