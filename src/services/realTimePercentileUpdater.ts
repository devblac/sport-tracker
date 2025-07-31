// Real-Time Percentile Updater Service
// Implements requirement 15.1 - Real-time percentile updates and maintenance

import {
  PercentileSegment,
  PercentileData,
  ExercisePerformance,
  UserDemographics,
  PercentileUpdateRequest
} from '../types/percentiles';
import { enhancedPercentileCalculator } from './enhancedPercentileCalculator';
import { DemographicSegmentation } from '../utils/demographicSegmentation';

// Real-time update configuration
interface UpdateConfig {
  batchSize: number;
  maxUpdateFrequency: number; // minutes
  priorityThreshold: number; // number of updates to trigger priority processing
  maxQueueSize: number;
  enableSmartBatching: boolean;
}

// Update queue item
interface UpdateQueueItem {
  id: string;
  segment_id: string;
  exercise_id: string;
  user_demographics: UserDemographics;
  performance_data: ExercisePerformance;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
  attempts: number;
  last_attempt?: Date;
  error_message?: string;
}

// Update statistics
interface UpdateStats {
  total_updates_processed: number;
  successful_updates: number;
  failed_updates: number;
  average_processing_time_ms: number;
  queue_length: number;
  last_update_time: Date;
  updates_per_minute: number;
}

// Segment update status
interface SegmentUpdateStatus {
  segment_id: string;
  exercise_id: string;
  last_updated: Date;
  next_scheduled_update: Date;
  pending_updates: number;
  update_frequency_minutes: number;
  is_updating: boolean;
  last_update_duration_ms: number;
}

export class RealTimePercentileUpdater {
  private static readonly DEFAULT_CONFIG: UpdateConfig = {
    batchSize: 50,
    maxUpdateFrequency: 5, // 5 minutes
    priorityThreshold: 20,
    maxQueueSize: 10000,
    enableSmartBatching: true
  };

  private static config: UpdateConfig = this.DEFAULT_CONFIG;
  private static updateQueue: UpdateQueueItem[] = [];
  private static isProcessing = false;
  private static stats: UpdateStats = {
    total_updates_processed: 0,
    successful_updates: 0,
    failed_updates: 0,
    average_processing_time_ms: 0,
    queue_length: 0,
    last_update_time: new Date(),
    updates_per_minute: 0
  };
  private static segmentStatus = new Map<string, SegmentUpdateStatus>();
  private static processingTimes: number[] = [];

  // Event listeners for real-time updates
  private static listeners = new Map<string, ((data: any) => void)[]>();

  /**
   * Initializes the real-time updater with configuration
   */
  static initialize(config: Partial<UpdateConfig> = {}): void {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    
    // Start background processing
    this.startBackgroundProcessor();
    
    // Start statistics collection
    this.startStatsCollection();
    
    console.log('Real-time percentile updater initialized with config:', this.config);
  }

  /**
   * Queues a performance update for real-time processing
   */
  static queueUpdate(
    userDemographics: UserDemographics,
    performance: ExercisePerformance,
    priority: UpdateQueueItem['priority'] = 'medium'
  ): string {
    // Find relevant segments for this user
    const segments = DemographicSegmentation.getMostSpecificSegments(userDemographics);
    const updateIds: string[] = [];

    segments.slice(0, 5).forEach(segment => { // Limit to top 5 segments
      const updateId = this.generateUpdateId();
      
      const queueItem: UpdateQueueItem = {
        id: updateId,
        segment_id: segment.id,
        exercise_id: performance.exercise_id,
        user_demographics: userDemographics,
        performance_data: performance,
        priority,
        created_at: new Date(),
        attempts: 0
      };

      // Check queue size limit
      if (this.updateQueue.length >= this.config.maxQueueSize) {
        // Remove oldest low priority items
        this.updateQueue = this.updateQueue
          .filter(item => item.priority !== 'low')
          .slice(-(this.config.maxQueueSize - 1));
      }

      this.updateQueue.push(queueItem);
      updateIds.push(updateId);

      // Update segment status
      this.updateSegmentStatus(segment.id, performance.exercise_id);
    });

    // Trigger immediate processing for high priority updates
    if (priority === 'critical' || priority === 'high') {
      this.processHighPriorityUpdates();
    }

    this.stats.queue_length = this.updateQueue.length;
    
    return updateIds[0]; // Return first update ID
  }

  /**
   * Processes high priority updates immediately
   */
  private static async processHighPriorityUpdates(): Promise<void> {
    const highPriorityItems = this.updateQueue.filter(
      item => item.priority === 'critical' || item.priority === 'high'
    );

    if (highPriorityItems.length === 0) return;

    console.log(`Processing ${highPriorityItems.length} high priority updates immediately`);

    for (const item of highPriorityItems) {
      await this.processUpdateItem(item);
      
      // Remove from queue
      this.updateQueue = this.updateQueue.filter(queueItem => queueItem.id !== item.id);
    }

    this.stats.queue_length = this.updateQueue.length;
  }

  /**
   * Starts background processing of update queue
   */
  private static startBackgroundProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessing && this.updateQueue.length > 0) {
        await this.processBatch();
      }
    }, this.config.maxUpdateFrequency * 60 * 1000); // Convert minutes to milliseconds
  }

  /**
   * Processes a batch of updates
   */
  private static async processBatch(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // Sort queue by priority and age
      this.updateQueue.sort((a, b) => {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // If same priority, process older items first
        return a.created_at.getTime() - b.created_at.getTime();
      });

      // Determine batch size
      const batchSize = this.config.enableSmartBatching 
        ? this.calculateSmartBatchSize()
        : this.config.batchSize;

      const batch = this.updateQueue.splice(0, batchSize);
      
      if (batch.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`Processing batch of ${batch.length} percentile updates`);

      // Group updates by segment and exercise for efficient processing
      const groupedUpdates = this.groupUpdatesBySegmentExercise(batch);

      // Process each group
      for (const [key, items] of groupedUpdates.entries()) {
        await this.processUpdateGroup(key, items);
      }

      // Update statistics
      this.stats.total_updates_processed += batch.length;
      this.stats.last_update_time = new Date();
      this.stats.queue_length = this.updateQueue.length;

      const processingTime = Date.now() - startTime;
      this.processingTimes.push(processingTime);
      
      // Keep only last 100 processing times for average calculation
      if (this.processingTimes.length > 100) {
        this.processingTimes = this.processingTimes.slice(-100);
      }
      
      this.stats.average_processing_time_ms = 
        this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;

      console.log(`Batch processing completed in ${processingTime}ms`);

    } catch (error) {
      console.error('Error processing update batch:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Calculates smart batch size based on current conditions
   */
  private static calculateSmartBatchSize(): number {
    const queueLength = this.updateQueue.length;
    const avgProcessingTime = this.stats.average_processing_time_ms;
    
    // Increase batch size if queue is growing and processing is fast
    if (queueLength > 100 && avgProcessingTime < 5000) {
      return Math.min(this.config.batchSize * 2, 100);
    }
    
    // Decrease batch size if processing is slow
    if (avgProcessingTime > 15000) {
      return Math.max(Math.floor(this.config.batchSize / 2), 10);
    }
    
    return this.config.batchSize;
  }

  /**
   * Groups updates by segment and exercise for efficient batch processing
   */
  private static groupUpdatesBySegmentExercise(
    updates: UpdateQueueItem[]
  ): Map<string, UpdateQueueItem[]> {
    const groups = new Map<string, UpdateQueueItem[]>();
    
    updates.forEach(update => {
      const key = `${update.segment_id}_${update.exercise_id}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key)!.push(update);
    });
    
    return groups;
  }

  /**
   * Processes a group of updates for the same segment and exercise
   */
  private static async processUpdateGroup(
    groupKey: string,
    updates: UpdateQueueItem[]
  ): Promise<void> {
    const [segmentId, exerciseId] = groupKey.split('_');
    const startTime = Date.now();

    try {
      // Mark segment as updating
      const status = this.segmentStatus.get(groupKey);
      if (status) {
        status.is_updating = true;
      }

      // Collect all performance data for this group
      const performanceData = updates.map(update => update.performance_data);
      
      // Get existing percentile data
      const existingData = await this.getExistingPercentileData(segmentId, exerciseId);
      
      // Combine with new data
      const allData = existingData ? [...existingData, ...performanceData] : performanceData;
      
      // Calculate updated percentiles using enhanced calculator
      const updatedPercentiles = await this.calculateEnhancedPercentiles(
        segmentId,
        exerciseId,
        allData
      );

      // Save updated percentiles
      await this.savePercentileData(updatedPercentiles);

      // Mark all updates in group as successful
      updates.forEach(update => {
        update.attempts++;
        this.stats.successful_updates++;
      });

      // Notify listeners
      this.notifyListeners('percentile_updated', {
        segment_id: segmentId,
        exercise_id: exerciseId,
        updated_data: updatedPercentiles,
        updates_processed: updates.length
      });

      // Update segment status
      if (status) {
        status.is_updating = false;
        status.last_updated = new Date();
        status.last_update_duration_ms = Date.now() - startTime;
        status.pending_updates = Math.max(0, status.pending_updates - updates.length);
      }

      console.log(`Successfully processed ${updates.length} updates for ${groupKey}`);

    } catch (error) {
      console.error(`Error processing update group ${groupKey}:`, error);
      
      // Mark updates as failed and retry if attempts < 3
      updates.forEach(update => {
        update.attempts++;
        update.last_attempt = new Date();
        update.error_message = error instanceof Error ? error.message : 'Unknown error';
        
        if (update.attempts < 3) {
          // Re-queue for retry with lower priority
          update.priority = update.priority === 'critical' ? 'high' : 
                           update.priority === 'high' ? 'medium' : 'low';
          this.updateQueue.push(update);
        } else {
          this.stats.failed_updates++;
        }
      });

      // Update segment status
      const status = this.segmentStatus.get(groupKey);
      if (status) {
        status.is_updating = false;
      }
    }
  }

  /**
   * Processes a single update item
   */
  private static async processUpdateItem(item: UpdateQueueItem): Promise<void> {
    const startTime = Date.now();
    
    try {
      item.attempts++;
      item.last_attempt = new Date();

      // Get existing data and calculate updated percentiles
      const existingData = await this.getExistingPercentileData(item.segment_id, item.exercise_id);
      const allData = existingData ? [...existingData, item.performance_data] : [item.performance_data];
      
      const updatedPercentiles = await this.calculateEnhancedPercentiles(
        item.segment_id,
        item.exercise_id,
        allData
      );

      await this.savePercentileData(updatedPercentiles);

      this.stats.successful_updates++;
      
      // Notify listeners
      this.notifyListeners('percentile_updated', {
        segment_id: item.segment_id,
        exercise_id: item.exercise_id,
        updated_data: updatedPercentiles,
        processing_time_ms: Date.now() - startTime
      });

    } catch (error) {
      console.error(`Error processing update item ${item.id}:`, error);
      
      item.error_message = error instanceof Error ? error.message : 'Unknown error';
      
      if (item.attempts < 3) {
        // Re-queue for retry
        this.updateQueue.push(item);
      } else {
        this.stats.failed_updates++;
      }
    }
  }

  /**
   * Gets existing percentile data (mock implementation)
   */
  private static async getExistingPercentileData(
    segmentId: string,
    exerciseId: string
  ): Promise<ExercisePerformance[] | null> {
    // Mock implementation - in real app would query database
    // Return null to simulate no existing data for simplicity
    return null;
  }

  /**
   * Calculates enhanced percentiles
   */
  private static async calculateEnhancedPercentiles(
    segmentId: string,
    exerciseId: string,
    performanceData: ExercisePerformance[]
  ): Promise<PercentileData> {
    // Use enhanced calculator for better accuracy
    const sortedValues = performanceData
      .map(p => p.max_weight)
      .sort((a, b) => a - b);

    if (sortedValues.length === 0) {
      throw new Error('No performance data provided');
    }

    // Calculate percentiles
    const percentiles = {
      p5: this.calculatePercentileValue(sortedValues, 5),
      p10: this.calculatePercentileValue(sortedValues, 10),
      p25: this.calculatePercentileValue(sortedValues, 25),
      p50: this.calculatePercentileValue(sortedValues, 50),
      p75: this.calculatePercentileValue(sortedValues, 75),
      p90: this.calculatePercentileValue(sortedValues, 90),
      p95: this.calculatePercentileValue(sortedValues, 95),
      p99: this.calculatePercentileValue(sortedValues, 99)
    };

    // Calculate statistics
    const mean = sortedValues.reduce((sum, val) => sum + val, 0) / sortedValues.length;
    const variance = sortedValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sortedValues.length;
    const stdDeviation = Math.sqrt(variance);

    return {
      segment_id: segmentId,
      exercise_id: exerciseId,
      metric_type: 'max_weight',
      percentiles,
      mean,
      std_deviation: stdDeviation,
      sample_size: sortedValues.length,
      last_updated: new Date()
    };
  }

  /**
   * Calculates a specific percentile value
   */
  private static calculatePercentileValue(sortedData: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedData.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sortedData[lower];
    }

    const weight = index - lower;
    return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
  }

  /**
   * Saves percentile data (mock implementation)
   */
  private static async savePercentileData(percentileData: PercentileData): Promise<void> {
    // Mock implementation - in real app would save to database
    console.log('Saving real-time percentile update:', {
      segment_id: percentileData.segment_id,
      exercise_id: percentileData.exercise_id,
      sample_size: percentileData.sample_size,
      median: percentileData.percentiles.p50
    });
  }

  /**
   * Updates segment status tracking
   */
  private static updateSegmentStatus(segmentId: string, exerciseId: string): void {
    const key = `${segmentId}_${exerciseId}`;
    const existing = this.segmentStatus.get(key);

    if (existing) {
      existing.pending_updates++;
    } else {
      this.segmentStatus.set(key, {
        segment_id: segmentId,
        exercise_id: exerciseId,
        last_updated: new Date(0), // Never updated
        next_scheduled_update: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        pending_updates: 1,
        update_frequency_minutes: 5,
        is_updating: false,
        last_update_duration_ms: 0
      });
    }
  }

  /**
   * Starts statistics collection
   */
  private static startStatsCollection(): void {
    setInterval(() => {
      // Calculate updates per minute
      const now = Date.now();
      const oneMinuteAgo = now - 60 * 1000;
      
      // This is a simplified calculation - in real implementation would track actual timestamps
      this.stats.updates_per_minute = Math.round(this.stats.successful_updates / 60);
      
    }, 60 * 1000); // Update every minute
  }

  /**
   * Adds event listener for real-time updates
   */
  static addEventListener(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Removes event listener
   */
  static removeEventListener(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Notifies listeners of events
   */
  private static notifyListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Gets current update statistics
   */
  static getUpdateStats(): UpdateStats {
    return { ...this.stats };
  }

  /**
   * Gets segment update statuses
   */
  static getSegmentStatuses(): SegmentUpdateStatus[] {
    return Array.from(this.segmentStatus.values());
  }

  /**
   * Forces immediate update for specific segment and exercise
   */
  static forceUpdate(segmentId: string, exerciseId: string): void {
    // Create a high priority update item
    const updateId = this.generateUpdateId();
    
    const queueItem: UpdateQueueItem = {
      id: updateId,
      segment_id: segmentId,
      exercise_id: exerciseId,
      user_demographics: {
        age: 30,
        gender: 'male',
        weight: 75,
        height: 175,
        experience_level: 'intermediate'
      }, // Mock demographics for force update
      performance_data: {
        exercise_id: exerciseId,
        exercise_name: exerciseId.replace('_', ' '),
        max_weight: 100,
        max_reps: 10,
        max_volume: 1000,
        recorded_at: new Date(),
        bodyweight_at_time: 75
      }, // Mock performance data
      priority: 'critical',
      created_at: new Date(),
      attempts: 0
    };

    this.updateQueue.unshift(queueItem); // Add to front of queue
    this.processHighPriorityUpdates(); // Process immediately
  }

  /**
   * Clears the update queue (for testing/maintenance)
   */
  static clearQueue(): number {
    const clearedCount = this.updateQueue.length;
    this.updateQueue = [];
    this.stats.queue_length = 0;
    return clearedCount;
  }

  /**
   * Generates unique update ID
   */
  private static generateUpdateId(): string {
    return `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Gets configuration
   */
  static getConfig(): UpdateConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  static updateConfig(newConfig: Partial<UpdateConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Real-time updater configuration updated:', this.config);
  }
}

// Export singleton instance
export const realTimePercentileUpdater = RealTimePercentileUpdater;