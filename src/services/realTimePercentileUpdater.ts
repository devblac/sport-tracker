/**
 * Real-time Percentile Updater
 * 
 * Handles real-time updates of percentile calculations with intelligent batching
 * and priority queuing for optimal performance.
 */

import { UserDemographics, ExercisePerformance } from '@/types/percentiles';
import { supabasePercentileService } from './SupabasePercentileService';

interface UpdateRequest {
  id: string;
  demographics: UserDemographics;
  performance: ExercisePerformance;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  retryCount: number;
}

interface UpdaterConfig {
  batchSize: number;
  maxUpdateFrequency: number; // seconds
  priorityThreshold: number; // high priority items processed immediately if queue < threshold
  maxQueueSize: number;
  enableSmartBatching: boolean;
}

export class RealTimePercentileUpdater {
  private updateQueue: UpdateRequest[] = [];
  private processing = false;
  private lastProcessTime = 0;
  private config: UpdaterConfig;
  private updateTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.config = {
      batchSize: 50,
      maxUpdateFrequency: 5,
      priorityThreshold: 20,
      maxQueueSize: 1000,
      enableSmartBatching: true
    };
  }

  /**
   * Initialize the updater with custom configuration
   */
  initialize(config: Partial<UpdaterConfig>): void {
    this.config = { ...this.config, ...config };
    this.startUpdateTimer();
  }

  /**
   * Queue a percentile update request
   */
  queueUpdate(
    demographics: UserDemographics,
    performance: ExercisePerformance,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    // Check queue size limit
    if (this.updateQueue.length >= this.config.maxQueueSize) {
      // Remove oldest low priority items
      this.updateQueue = this.updateQueue.filter(req => req.priority !== 'low').slice(-this.config.maxQueueSize * 0.8);
    }

    const updateRequest: UpdateRequest = {
      id: `${performance.exercise_id}_${demographics.age}_${demographics.gender}_${Date.now()}`,
      demographics,
      performance,
      priority,
      timestamp: new Date(),
      retryCount: 0
    };

    this.updateQueue.push(updateRequest);

    // Process high priority items immediately if queue is small
    if (priority === 'high' && this.updateQueue.length < this.config.priorityThreshold) {
      this.processUpdates();
    }
  }

  /**
   * Process queued updates
   */
  private async processUpdates(): Promise<void> {
    if (this.processing || this.updateQueue.length === 0) {
      return;
    }

    // Check frequency limit
    const now = Date.now();
    if (now - this.lastProcessTime < this.config.maxUpdateFrequency * 1000) {
      return;
    }

    this.processing = true;
    this.lastProcessTime = now;

    try {
      // Sort queue by priority and timestamp
      this.updateQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      // Process batch
      const batchSize = this.config.enableSmartBatching 
        ? this.calculateOptimalBatchSize()
        : this.config.batchSize;

      const batch = this.updateQueue.splice(0, batchSize);
      
      if (batch.length > 0) {
        await this.processBatch(batch);
      }
    } catch (error) {
      console.error('Error processing percentile updates:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a batch of update requests
   */
  private async processBatch(batch: UpdateRequest[]): Promise<void> {
    const results = await Promise.allSettled(
      batch.map(request => this.processUpdateRequest(request))
    );

    // Handle failed requests
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const request = batch[index];
        request.retryCount++;
        
        // Retry logic
        if (request.retryCount < 3) {
          request.priority = 'low'; // Lower priority for retries
          this.updateQueue.push(request);
        } else {
          console.error(`Failed to process update after 3 retries:`, request.id);
        }
      }
    });
  }

  /**
   * Process a single update request
   */
  private async processUpdateRequest(request: UpdateRequest): Promise<void> {
    try {
      // In a real implementation, this would update the percentile calculations
      // For now, we'll simulate the process
      
      // Simulate processing time based on priority
      const processingTime = request.priority === 'high' ? 50 : 
                           request.priority === 'medium' ? 100 : 200;
      
      await new Promise(resolve => setTimeout(resolve, processingTime));

      // Log successful processing
      console.log(`Processed percentile update: ${request.id} (${request.priority} priority)`);
      
      // In real implementation, would call:
      // await this.updatePercentileCalculations(request.demographics, request.performance);
      
    } catch (error) {
      console.error(`Failed to process update ${request.id}:`, error);
      throw error;
    }
  }

  /**
   * Calculate optimal batch size based on current conditions
   */
  private calculateOptimalBatchSize(): number {
    const queueLength = this.updateQueue.length;
    const highPriorityCount = this.updateQueue.filter(req => req.priority === 'high').length;
    
    // Increase batch size for large queues
    if (queueLength > 200) return Math.min(this.config.batchSize * 2, 100);
    
    // Smaller batches for high priority items
    if (highPriorityCount > 10) return Math.max(this.config.batchSize / 2, 10);
    
    return this.config.batchSize;
  }

  /**
   * Start the update timer
   */
  private startUpdateTimer(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(() => {
      this.processUpdates();
    }, this.config.maxUpdateFrequency * 1000);
  }

  /**
   * Stop the updater
   */
  stop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    totalItems: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    processing: boolean;
    lastProcessTime: Date;
  } {
    const priorityCounts = this.updateQueue.reduce((acc, req) => {
      acc[req.priority]++;
      return acc;
    }, { high: 0, medium: 0, low: 0 });

    return {
      totalItems: this.updateQueue.length,
      highPriority: priorityCounts.high,
      mediumPriority: priorityCounts.medium,
      lowPriority: priorityCounts.low,
      processing: this.processing,
      lastProcessTime: new Date(this.lastProcessTime)
    };
  }

  /**
   * Clear the update queue
   */
  clearQueue(): void {
    this.updateQueue = [];
  }

  /**
   * Force process all queued updates
   */
  async forceProcessAll(): Promise<void> {
    while (this.updateQueue.length > 0 && !this.processing) {
      await this.processUpdates();
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Update percentile calculations (placeholder for real implementation)
   */
  private async updatePercentileCalculations(
    demographics: UserDemographics,
    performance: ExercisePerformance
  ): Promise<void> {
    // This would integrate with the actual percentile calculation system
    // For now, we'll just log the operation
    console.log('Updating percentile calculations for:', {
      exercise: performance.exercise_id,
      demographics: `${demographics.age}y ${demographics.gender}`,
      performance: performance.max_weight
    });

    // In real implementation, this would:
    // 1. Update user's performance data
    // 2. Recalculate affected percentiles
    // 3. Update demographic segment statistics
    // 4. Trigger any necessary notifications or achievements
  }
}

// Singleton instance
export const realTimePercentileUpdater = new RealTimePercentileUpdater();