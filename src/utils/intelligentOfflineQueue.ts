/**
 * Intelligent Offline Queue
 * Advanced queue system with smart prioritization and network-aware processing
 */

import { offlineManager, networkErrorHandler } from './offlineUtils';
import { dbManager } from '@/db/IndexedDBManager';
import type { SyncOperation } from './syncQueue';

export interface QueueOperation extends SyncOperation {
  networkRequirement: 'none' | 'low' | 'medium' | 'high';
  userInitiated: boolean;
  dependencies?: string[];
  estimatedSize: number;
  category: 'workout' | 'social' | 'settings' | 'media' | 'analytics';
}

export interface QueueConfig {
  maxConcurrentOperations: number;
  networkAwareProcessing: boolean;
  adaptiveBatching: boolean;
  priorityBoostThreshold: number; // milliseconds
  maxQueueSize: number;
  compressionEnabled: boolean;
}

export interface QueueMetrics {
  totalOperations: number;
  pendingOperations: number;
  processingOperations: number;
  completedOperations: number;
  failedOperations: number;
  averageProcessingTime: number;
  successRate: number;
  networkEfficiency: number;
}

const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrentOperations: 3,
  networkAwareProcessing: true,
  adaptiveBatching: true,
  priorityBoostThreshold: 300000, // 5 minutes
  maxQueueSize: 1000,
  compressionEnabled: true,
};

export class IntelligentOfflineQueue {
  private static instance: IntelligentOfflineQueue;
  private config: QueueConfig;
  private processingOperations = new Set<string>();
  private listeners: Set<(operation: QueueOperation) => void> = new Set();
  private metricsListeners: Set<(metrics: QueueMetrics) => void> = new Set();
  private isProcessing = false;
  private processingTimer?: NodeJS.Timeout;
  private lastProcessingTime = new Map<string, number>();
  private operationDependencies = new Map<string, Set<string>>();

  private constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeQueue();
  }

  public static getInstance(config?: Partial<QueueConfig>): IntelligentOfflineQueue {
    if (!IntelligentOfflineQueue.instance) {
      IntelligentOfflineQueue.instance = new IntelligentOfflineQueue(config);
    }
    return IntelligentOfflineQueue.instance;
  }

  /**
   * Initialize the intelligent queue
   */
  private async initializeQueue(): Promise<void> {
    try {
      await dbManager.init();
      
      // Listen for network changes
      if (this.config.networkAwareProcessing) {
        offlineManager.addNetworkListener(this.handleNetworkChange.bind(this));
        offlineManager.addOfflineListener(this.handleOfflineChange.bind(this));
      }

      // Start processing
      this.startIntelligentProcessing();
      
      console.log('[IntelligentOfflineQueue] Queue initialized with config:', this.config);
      
    } catch (error) {
      console.error('[IntelligentOfflineQueue] Failed to initialize queue:', error);
    }
  }

  /**
   * Add operation to queue with intelligent prioritization
   */
  async addOperation(
    operation: Omit<QueueOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>,
    options: {
      immediate?: boolean;
      dependencies?: string[];
      estimatedProcessingTime?: number;
    } = {}
  ): Promise<string> {
    try {
      // Check queue size limits
      const currentSize = await this.getQueueSize();
      if (currentSize >= this.config.maxQueueSize) {
        await this.performQueueCleanup();
      }

      // Calculate intelligent priority
      const intelligentPriority = this.calculateIntelligentPriority(operation);

      const queueOperation: QueueOperation = {
        ...operation,
        id: this.generateOperationId(),
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
        priority: intelligentPriority,
      };

      // Handle dependencies
      if (options.dependencies?.length) {
        this.operationDependencies.set(queueOperation.id, new Set(options.dependencies));
      }

      // Compress large operations if enabled
      if (this.config.compressionEnabled && queueOperation.estimatedSize > 10240) {
        queueOperation.data = await this.compressOperationData(queueOperation.data);
      }

      // Store operation
      await dbManager.put('intelligentQueue', queueOperation);
      
      console.log(`[IntelligentOfflineQueue] Operation queued: ${queueOperation.id} (priority: ${intelligentPriority})`);
      
      // Notify listeners
      this.notifyListeners(queueOperation);
      this.updateMetrics();

      // Process immediately if requested and conditions are met
      if (options.immediate && this.canProcessImmediately(queueOperation)) {
        this.processOperationImmediately(queueOperation);
      }

      return queueOperation.id;
      
    } catch (error) {
      console.error('[IntelligentOfflineQueue] Failed to add operation:', error);
      throw error;
    }
  }

  /**
   * Calculate intelligent priority based on multiple factors
   */
  private calculateIntelligentPriority(operation: Partial<QueueOperation>): QueueOperation['priority'] {
    let score = 0;

    // Base priority from operation
    const basePriority = operation.priority || 'medium';
    const baseScores = { low: 1, medium: 2, high: 3 };
    score += baseScores[basePriority] * 10;

    // User-initiated operations get higher priority
    if (operation.userInitiated) {
      score += 15;
    }

    // Category-based scoring with enhanced weights
    const categoryScores = {
      workout: 25,    // Highest priority for workout data
      social: 12,     // Medium-high priority for social features
      settings: 18,   // High priority for settings
      media: 8,       // Medium priority for media
      analytics: 3    // Lowest priority for analytics
    };
    score += categoryScores[operation.category || 'analytics'];

    // Network requirement consideration with current network quality
    const networkQuality = offlineManager.getNetworkQuality();
    const networkScores = {
      none: 15,      // Offline operations get highest boost
      low: 12,       // Low network requirement
      medium: 8,     // Medium network requirement
      high: 4        // High network requirement gets penalty
    };
    score += networkScores[operation.networkRequirement || 'medium'];

    // Network quality adjustment
    if (networkQuality === 'poor' || networkQuality === 'offline') {
      // Boost offline-capable operations when network is poor
      if (operation.networkRequirement === 'none') {
        score += 10;
      } else {
        score -= 5; // Penalize network-dependent operations
      }
    }

    // Size consideration with more granular scoring
    if (operation.estimatedSize) {
      if (operation.estimatedSize < 512) score += 8;      // Very small
      else if (operation.estimatedSize < 2048) score += 5; // Small
      else if (operation.estimatedSize < 10240) score += 2; // Medium
      else score -= 3; // Large operations get penalty
    }

    // Time-based urgency (operations waiting longer get priority boost)
    const age = Date.now() - (operation.timestamp || Date.now());
    if (age > 600000) score += 10; // 10+ minutes old
    else if (age > 300000) score += 5; // 5+ minutes old
    else if (age > 60000) score += 2; // 1+ minute old

    // Convert score to priority with more nuanced thresholds
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  /**
   * Start intelligent processing with network awareness
   */
  private async startIntelligentProcessing(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    console.log('[IntelligentOfflineQueue] Starting intelligent processing');

    const processLoop = async () => {
      try {
        if (!this.isProcessing) {
          return;
        }

        const networkStatus = offlineManager.getNetworkStatus();
        const networkQuality = offlineManager.getNetworkQuality();
        
        // Get operations suitable for current network conditions
        const suitableOperations = await this.getSuitableOperations(networkStatus, networkQuality);
        
        if (suitableOperations.length === 0) {
          // No suitable operations, wait longer
          this.processingTimer = setTimeout(processLoop, this.calculateWaitTime(networkQuality));
          return;
        }

        // Process operations in intelligent batches
        await this.processIntelligentBatch(suitableOperations, networkQuality);
        
        // Calculate next processing interval
        const waitTime = this.calculateWaitTime(networkQuality);
        this.processingTimer = setTimeout(processLoop, waitTime);
        
      } catch (error) {
        console.error('[IntelligentOfflineQueue] Processing error:', error);
        
        // Exponential backoff on errors
        const errorWaitTime = Math.min(30000, 5000 * Math.pow(2, Math.random()));
        this.processingTimer = setTimeout(processLoop, errorWaitTime);
      }
    };

    // Start processing loop
    processLoop();
  }

  /**
   * Get operations suitable for current network conditions
   */
  private async getSuitableOperations(
    networkStatus: any, 
    networkQuality: string
  ): Promise<QueueOperation[]> {
    try {
      const allOperations = await dbManager.getAll<QueueOperation>('intelligentQueue');
      
      const pendingOperations = allOperations
        .filter(op => op.status === 'pending' || (op.status === 'failed' && this.shouldRetry(op)))
        .filter(op => !this.processingOperations.has(op.id))
        .filter(op => this.areDependenciesMet(op.id));

      // Filter by network requirements
      const suitableOperations = pendingOperations.filter(op => {
        if (!networkStatus.isOnline && op.networkRequirement !== 'none') {
          return false;
        }

        // Network quality filtering
        switch (networkQuality) {
          case 'poor':
            return op.networkRequirement === 'none' || op.networkRequirement === 'low';
          case 'fair':
            return op.networkRequirement !== 'high';
          case 'good':
          case 'excellent':
            return true;
          case 'offline':
            return op.networkRequirement === 'none';
          default:
            return true;
        }
      });

      // Apply priority boost for old operations
      const now = Date.now();
      suitableOperations.forEach(op => {
        if (now - op.timestamp > this.config.priorityBoostThreshold) {
          if (op.priority === 'low') op.priority = 'medium';
          else if (op.priority === 'medium') op.priority = 'high';
        }
      });

      // Sort by priority and timestamp
      return this.sortOperationsByPriority(suitableOperations);
      
    } catch (error) {
      console.error('[IntelligentOfflineQueue] Failed to get suitable operations:', error);
      return [];
    }
  }

  /**
   * Sort operations by intelligent priority
   */
  private sortOperationsByPriority(operations: QueueOperation[]): QueueOperation[] {
    return operations.sort((a, b) => {
      // Priority first
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // User-initiated operations next
      if (a.userInitiated !== b.userInitiated) {
        return b.userInitiated ? 1 : -1;
      }

      // Category importance
      const categoryOrder = { workout: 5, settings: 4, social: 3, media: 2, analytics: 1 };
      const categoryDiff = (categoryOrder[b.category] || 0) - (categoryOrder[a.category] || 0);
      if (categoryDiff !== 0) return categoryDiff;

      // Timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Process intelligent batch of operations
   */
  private async processIntelligentBatch(
    operations: QueueOperation[], 
    networkQuality: string
  ): Promise<void> {
    // Calculate batch size based on network quality and current load
    const batchSize = this.calculateOptimalBatchSize(networkQuality);
    const batch = operations.slice(0, batchSize);

    // Process batch with concurrency control
    const concurrency = Math.min(this.config.maxConcurrentOperations, batch.length);
    const chunks = this.chunkArray(batch, concurrency);

    for (const chunk of chunks) {
      const promises = chunk.map(operation => this.processOperationSafely(operation));
      await Promise.allSettled(promises);
    }

    // Update metrics after batch processing
    this.updateMetrics();
  }

  /**
   * Calculate optimal batch size based on network conditions
   */
  private calculateOptimalBatchSize(networkQuality: string): number {
    const baseBatchSize = 5;
    const currentLoad = this.processingOperations.size;
    const maxConcurrency = this.config.maxConcurrentOperations;
    
    // Adjust base size based on current load
    const loadAdjustedSize = Math.max(1, baseBatchSize - currentLoad);
    
    switch (networkQuality) {
      case 'excellent':
        return Math.min(loadAdjustedSize * 2, maxConcurrency);
      case 'good':
        return Math.min(loadAdjustedSize, maxConcurrency);
      case 'fair':
        return Math.min(Math.max(1, Math.floor(loadAdjustedSize * 0.7)), maxConcurrency);
      case 'poor':
        return Math.min(Math.max(1, Math.floor(loadAdjustedSize * 0.4)), 2);
      case 'offline':
        return 1; // Process offline operations one by one
      default:
        return Math.min(loadAdjustedSize, maxConcurrency);
    }
  }

  /**
   * Calculate wait time between processing cycles
   */
  private calculateWaitTime(networkQuality: string): number {
    const baseWaitTime = 2000; // 2 seconds
    
    switch (networkQuality) {
      case 'excellent':
        return baseWaitTime * 0.5;
      case 'good':
        return baseWaitTime;
      case 'fair':
        return baseWaitTime * 1.5;
      case 'poor':
        return baseWaitTime * 3;
      case 'offline':
        return baseWaitTime * 5;
      default:
        return baseWaitTime;
    }
  }

  /**
   * Process operation safely with error handling
   */
  private async processOperationSafely(operation: QueueOperation): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Mark as processing
      this.processingOperations.add(operation.id);
      await this.updateOperationStatus(operation.id, 'processing');

      // Process the operation
      await this.executeOperation(operation);

      // Mark as completed
      await this.updateOperationStatus(operation.id, 'completed');
      
      // Track processing time
      this.lastProcessingTime.set(operation.id, Date.now() - startTime);
      
      console.log(`[IntelligentOfflineQueue] Operation completed: ${operation.id}`);
      
    } catch (error) {
      console.error(`[IntelligentOfflineQueue] Operation failed: ${operation.id}`, error);
      
      // Handle error intelligently
      const errorHandling = networkErrorHandler.handleError(error as Error, operation.category);
      
      if (errorHandling.shouldRetry && operation.retryCount < operation.maxRetries) {
        // Schedule retry
        const updatedOperation: QueueOperation = {
          ...operation,
          retryCount: operation.retryCount + 1,
          status: 'pending',
          error: (error as Error).message,
        };
        
        await dbManager.put('intelligentQueue', updatedOperation);
        
        // Delay next processing if needed
        if (errorHandling.retryDelay > 0) {
          setTimeout(() => {
            this.processingOperations.delete(operation.id);
          }, errorHandling.retryDelay);
        } else {
          this.processingOperations.delete(operation.id);
        }
      } else {
        // Mark as permanently failed
        await this.updateOperationStatus(operation.id, 'failed', (error as Error).message);
        this.processingOperations.delete(operation.id);
      }
    } finally {
      this.processingOperations.delete(operation.id);
    }
  }

  /**
   * Execute operation based on type and category
   */
  private async executeOperation(operation: QueueOperation): Promise<void> {
    // Decompress data if needed
    let data = operation.data;
    if (this.config.compressionEnabled && this.isCompressed(operation.data)) {
      data = await this.decompressOperationData(operation.data);
    }

    // Execute based on category and type
    switch (operation.category) {
      case 'workout':
        await this.executeWorkoutOperation(operation.type, data);
        break;
      case 'social':
        await this.executeSocialOperation(operation.type, data);
        break;
      case 'settings':
        await this.executeSettingsOperation(operation.type, data);
        break;
      case 'media':
        await this.executeMediaOperation(operation.type, data);
        break;
      case 'analytics':
        await this.executeAnalyticsOperation(operation.type, data);
        break;
      default:
        throw new Error(`Unknown operation category: ${operation.category}`);
    }
  }

  /**
   * Execute workout operations
   */
  private async executeWorkoutOperation(type: string, data: any): Promise<void> {
    // Simulate workout API calls
    const endpoint = `/api/workouts${type === 'UPDATE' ? `/${data.id}` : ''}`;
    const method = type === 'CREATE' ? 'POST' : type === 'UPDATE' ? 'PUT' : 'DELETE';
    
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: type !== 'DELETE' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Workout operation failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Execute social operations
   */
  private async executeSocialOperation(type: string, data: any): Promise<void> {
    // Simulate social API calls
    console.log(`[IntelligentOfflineQueue] Social ${type} operation executed with data:`, data);
  }

  /**
   * Execute settings operations
   */
  private async executeSettingsOperation(type: string, data: any): Promise<void> {
    // Simulate settings API calls
    console.log(`[IntelligentOfflineQueue] Settings ${type} operation executed with data:`, data);
  }

  /**
   * Execute media operations
   */
  private async executeMediaOperation(type: string, data: any): Promise<void> {
    // Simulate media API calls
    console.log(`[IntelligentOfflineQueue] Media ${type} operation executed with data:`, data);
  }

  /**
   * Execute analytics operations
   */
  private async executeAnalyticsOperation(type: string, data: any): Promise<void> {
    // Simulate analytics API calls
    console.log(`[IntelligentOfflineQueue] Analytics ${type} operation executed with data:`, data);
  }

  /**
   * Check if dependencies are met
   */
  private areDependenciesMet(operationId: string): boolean {
    const dependencies = this.operationDependencies.get(operationId);
    if (!dependencies || dependencies.size === 0) {
      return true;
    }

    // Check if all dependencies are completed
    // This would need to be implemented based on your specific dependency tracking
    return true; // Simplified for now
  }

  /**
   * Check if operation should be retried
   */
  private shouldRetry(operation: QueueOperation): boolean {
    return operation.retryCount < operation.maxRetries;
  }

  /**
   * Utility methods
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private generateOperationId(): string {
    return `iq-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private async compressOperationData(data: any): Promise<string> {
    // Implement compression logic
    return JSON.stringify(data); // Simplified for now
  }

  private async decompressOperationData(data: string): Promise<any> {
    // Implement decompression logic
    return JSON.parse(data); // Simplified for now
  }

  private isCompressed(data: any): boolean {
    // Check if data is compressed
    return false; // Simplified for now
  }

  private async updateOperationStatus(
    operationId: string, 
    status: QueueOperation['status'], 
    error?: string
  ): Promise<void> {
    try {
      const operation = await dbManager.get<QueueOperation>('intelligentQueue', operationId);
      if (operation) {
        operation.status = status;
        if (error) operation.error = error;
        await dbManager.put('intelligentQueue', operation);
        this.notifyListeners(operation);
      }
    } catch (error) {
      console.error('[IntelligentOfflineQueue] Failed to update operation status:', error);
    }
  }

  private async getQueueSize(): Promise<number> {
    try {
      const operations = await dbManager.getAll<QueueOperation>('intelligentQueue');
      return operations.length;
    } catch (error) {
      return 0;
    }
  }

  private async performQueueCleanup(): Promise<void> {
    try {
      const operations = await dbManager.getAll<QueueOperation>('intelligentQueue');
      const completedOperations = operations.filter(op => op.status === 'completed');
      
      // Remove old completed operations
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      const toDelete = completedOperations.filter(op => op.timestamp < cutoffTime);
      
      for (const operation of toDelete) {
        await dbManager.delete('intelligentQueue', operation.id);
      }
      
      console.log(`[IntelligentOfflineQueue] Cleaned up ${toDelete.length} old operations`);
    } catch (error) {
      console.error('[IntelligentOfflineQueue] Queue cleanup failed:', error);
    }
  }

  private canProcessImmediately(operation: QueueOperation): boolean {
    return this.processingOperations.size < this.config.maxConcurrentOperations &&
           offlineManager.getNetworkQuality() !== 'offline';
  }

  private async processOperationImmediately(operation: QueueOperation): Promise<void> {
    // Process operation immediately without waiting for batch
    this.processOperationSafely(operation);
  }

  private handleNetworkChange(status: any): void {
    console.log('[IntelligentOfflineQueue] Network status changed:', status);
    // Adjust processing strategy based on network change
    if (status.isOnline && this.processingOperations.size === 0) {
      // Trigger processing when coming back online
      this.startIntelligentProcessing();
    }
  }

  private handleOfflineChange(isOffline: boolean): void {
    console.log('[IntelligentOfflineQueue] Offline status changed:', isOffline);
    // Adjust processing strategy based on offline status
    if (!isOffline) {
      // Reset retry attempts when back online
      this.startIntelligentProcessing();
    }
  }

  private notifyListeners(operation: QueueOperation): void {
    this.listeners.forEach(listener => {
      try {
        listener(operation);
      } catch (error) {
        console.error('[IntelligentOfflineQueue] Listener error:', error);
      }
    });
  }

  private async updateMetrics(): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      this.metricsListeners.forEach(listener => {
        try {
          listener(metrics);
        } catch (error) {
          console.error('[IntelligentOfflineQueue] Metrics listener error:', error);
        }
      });
    } catch (error) {
      console.error('[IntelligentOfflineQueue] Failed to update metrics:', error);
    }
  }

  /**
   * Public API methods
   */
  async getMetrics(): Promise<QueueMetrics> {
    try {
      const operations = await dbManager.getAll<QueueOperation>('intelligentQueue');
      
      const totalOperations = operations.length;
      const pendingOperations = operations.filter(op => op.status === 'pending').length;
      const processingOperations = operations.filter(op => op.status === 'processing').length;
      const completedOperations = operations.filter(op => op.status === 'completed').length;
      const failedOperations = operations.filter(op => op.status === 'failed').length;
      
      const processingTimes = Array.from(this.lastProcessingTime.values());
      const averageProcessingTime = processingTimes.length > 0 
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
        : 0;
      
      const successRate = totalOperations > 0 
        ? completedOperations / (completedOperations + failedOperations) 
        : 1;
      
      const networkEfficiency = this.calculateNetworkEfficiency();

      return {
        totalOperations,
        pendingOperations,
        processingOperations,
        completedOperations,
        failedOperations,
        averageProcessingTime,
        successRate,
        networkEfficiency,
      };
    } catch (error) {
      console.error('[IntelligentOfflineQueue] Failed to get metrics:', error);
      return {
        totalOperations: 0,
        pendingOperations: 0,
        processingOperations: 0,
        completedOperations: 0,
        failedOperations: 0,
        averageProcessingTime: 0,
        successRate: 1,
        networkEfficiency: 1,
      };
    }
  }

  private calculateNetworkEfficiency(): number {
    // Calculate network efficiency based on success rates and processing times
    // This is a simplified calculation
    return 0.85; // Placeholder
  }

  addListener(listener: (operation: QueueOperation) => void): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (operation: QueueOperation) => void): void {
    this.listeners.delete(listener);
  }

  addMetricsListener(listener: (metrics: QueueMetrics) => void): void {
    this.metricsListeners.add(listener);
  }

  removeMetricsListener(listener: (metrics: QueueMetrics) => void): void {
    this.metricsListeners.delete(listener);
  }

  stopProcessing(): void {
    this.isProcessing = false;
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
      this.processingTimer = undefined;
    }
  }

  destroy(): void {
    this.stopProcessing();
    this.listeners.clear();
    this.metricsListeners.clear();
    this.operationDependencies.clear();
    this.processingOperations.clear();
    this.lastProcessingTime.clear();
  }
}

// Export singleton instance
export const intelligentOfflineQueue = IntelligentOfflineQueue.getInstance();