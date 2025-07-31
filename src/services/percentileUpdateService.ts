/**
 * Percentile Update Service
 * Manages the updating and maintenance of percentile data across demographic segments
 */

import {
  PercentileSegment,
  PercentileData,
  ExercisePerformance,
  UserDemographics,
  PercentileUpdateRequest,
  DEMOGRAPHIC_SEGMENTS
} from '../types/percentiles';
import { PercentileCalculator } from './percentileCalculator';

interface UpdateSchedule {
  segment_id: string;
  exercise_id: string;
  last_updated: Date;
  next_update_due: Date;
  update_frequency_hours: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface UpdateJob {
  id: string;
  segment_id: string;
  exercise_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  records_processed: number;
  performance_data: ExercisePerformance[];
}

export class PercentileUpdateService {
  private static updateQueue: UpdateJob[] = [];
  private static isProcessing = false;
  private static updateSchedules: Map<string, UpdateSchedule> = new Map();

  /**
   * Schedules percentile updates for new user performance data
   */
  static async schedulePercentileUpdate(request: PercentileUpdateRequest): Promise<{
    success: boolean;
    jobs_scheduled: number;
    estimated_completion: Date;
    error?: string;
  }> {
    try {
      const relevantSegments = this.findRelevantSegments(request.user_demographics);
      let jobsScheduled = 0;

      for (const segment of relevantSegments) {
        const jobId = `${segment.id}_${request.exercise_id}_${Date.now()}`;
        
        const updateJob: UpdateJob = {
          id: jobId,
          segment_id: segment.id,
          exercise_id: request.exercise_id,
          status: 'pending',
          records_processed: 0,
          performance_data: request.performance_data
        };

        this.updateQueue.push(updateJob);
        jobsScheduled++;

        // Update schedule tracking
        const scheduleKey = `${segment.id}_${request.exercise_id}`;
        this.updateSchedules.set(scheduleKey, {
          segment_id: segment.id,
          exercise_id: request.exercise_id,
          last_updated: new Date(),
          next_update_due: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          update_frequency_hours: this.getUpdateFrequency(segment),
          priority: this.calculateUpdatePriority(segment, request.performance_data.length)
        });
      }

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processUpdateQueue();
      }

      const estimatedCompletion = new Date(Date.now() + jobsScheduled * 30 * 1000); // 30 seconds per job

      return {
        success: true,
        jobs_scheduled: jobsScheduled,
        estimated_completion: estimatedCompletion
      };

    } catch (error) {
      console.error('Error scheduling percentile update:', error);
      return {
        success: false,
        jobs_scheduled: 0,
        estimated_completion: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Processes the update queue
   */
  private static async processUpdateQueue(): Promise<void> {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`Starting to process ${this.updateQueue.length} percentile update jobs`);

    while (this.updateQueue.length > 0) {
      // Sort queue by priority
      this.updateQueue.sort((a, b) => {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const scheduleA = this.updateSchedules.get(`${a.segment_id}_${a.exercise_id}`);
        const scheduleB = this.updateSchedules.get(`${b.segment_id}_${b.exercise_id}`);
        
        const priorityA = priorityOrder[scheduleA?.priority || 'low'];
        const priorityB = priorityOrder[scheduleB?.priority || 'low'];
        
        return priorityB - priorityA;
      });

      const job = this.updateQueue.shift()!;
      await this.processUpdateJob(job);
    }

    this.isProcessing = false;
    console.log('Finished processing percentile update queue');
  }

  /**
   * Processes a single update job
   */
  private static async processUpdateJob(job: UpdateJob): Promise<void> {
    try {
      job.status = 'running';
      job.started_at = new Date();

      console.log(`Processing percentile update for segment ${job.segment_id}, exercise ${job.exercise_id}`);

      // Get existing performance data for the segment (mock implementation)
      const existingData = await this.getExistingPerformanceData(job.segment_id, job.exercise_id);
      
      // Combine with new data
      const allData = [...existingData, ...job.performance_data];
      
      // Update percentiles
      const updatedPercentiles = await PercentileCalculator.updateSegmentPercentiles(
        job.segment_id,
        job.exercise_id,
        allData
      );

      // Save updated percentiles (mock implementation)
      await this.savePercentileData(updatedPercentiles);

      job.status = 'completed';
      job.completed_at = new Date();
      job.records_processed = allData.length;

      console.log(`Completed percentile update for segment ${job.segment_id}, exercise ${job.exercise_id}. Processed ${job.records_processed} records.`);

    } catch (error) {
      job.status = 'failed';
      job.error_message = error instanceof Error ? error.message : 'Unknown error';
      job.completed_at = new Date();

      console.error(`Failed to process percentile update job ${job.id}:`, error);
    }
  }

  /**
   * Gets existing performance data for a segment (mock implementation)
   */
  private static async getExistingPerformanceData(
    segmentId: string,
    exerciseId: string
  ): Promise<ExercisePerformance[]> {
    // In a real implementation, this would query the database
    // For now, return mock data
    const mockData: ExercisePerformance[] = [];
    const baseValue = this.getBaseValueForExercise(exerciseId);
    
    // Generate 100-1000 mock records
    const recordCount = Math.floor(Math.random() * 900) + 100;
    
    for (let i = 0; i < recordCount; i++) {
      mockData.push({
        exercise_id: exerciseId,
        exercise_name: exerciseId.replace('_', ' '),
        max_weight: baseValue + (Math.random() - 0.5) * baseValue * 0.8,
        max_reps: Math.floor(Math.random() * 20) + 5,
        max_volume: baseValue * (Math.random() * 5 + 2),
        recorded_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        bodyweight_at_time: 70 + Math.random() * 40
      });
    }

    return mockData;
  }

  /**
   * Saves percentile data (mock implementation)
   */
  private static async savePercentileData(percentileData: PercentileData): Promise<void> {
    // In a real implementation, this would save to database
    console.log('Saving percentile data:', {
      segment_id: percentileData.segment_id,
      exercise_id: percentileData.exercise_id,
      sample_size: percentileData.sample_size,
      median: percentileData.percentiles.p50
    });
  }

  /**
   * Gets base value for exercise (for mock data generation)
   */
  private static getBaseValueForExercise(exerciseId: string): number {
    const baseValues: Record<string, number> = {
      'squat': 100,
      'bench_press': 80,
      'deadlift': 120,
      'pull_ups': 8,
      'push_ups': 25,
      'running_5k': 1500,
      'plank': 120
    };

    return baseValues[exerciseId] || 50;
  }

  /**
   * Finds relevant demographic segments for a user
   */
  private static findRelevantSegments(demographics: UserDemographics): PercentileSegment[] {
    const segments: PercentileSegment[] = [];

    // Age-based segments
    Object.entries(DEMOGRAPHIC_SEGMENTS).forEach(([key, ageGroup]) => {
      if ('age_min' in ageGroup && 'age_max' in ageGroup) {
        if (demographics.age >= ageGroup.age_min && demographics.age <= ageGroup.age_max) {
          segments.push({
            id: `age_${key.toLowerCase()}`,
            name: ageGroup.name,
            age_min: ageGroup.age_min,
            age_max: ageGroup.age_max,
            gender: 'all',
            sample_size: 1000,
            last_updated: new Date()
          });
        }
      }
    });

    // Weight-based segments
    Object.entries(DEMOGRAPHIC_SEGMENTS).forEach(([key, weightClass]) => {
      if ('weight_min' in weightClass && 'weight_max' in weightClass) {
        if (demographics.weight >= weightClass.weight_min && demographics.weight <= weightClass.weight_max) {
          segments.push({
            id: `weight_${key.toLowerCase()}`,
            name: weightClass.name,
            age_min: 0,
            age_max: 99,
            gender: 'all',
            weight_min: weightClass.weight_min,
            weight_max: weightClass.weight_max,
            sample_size: 800,
            last_updated: new Date()
          });
        }
      }
    });

    // Global segment
    segments.push({
      id: 'global_all',
      name: 'Global (All Users)',
      age_min: 0,
      age_max: 99,
      gender: 'all',
      sample_size: 10000,
      last_updated: new Date()
    });

    return segments;
  }

  /**
   * Calculates update frequency based on segment characteristics
   */
  private static getUpdateFrequency(segment: PercentileSegment): number {
    // More specific segments update less frequently
    if (segment.id.includes('global')) return 6; // 6 hours
    if (segment.id.includes('age') && segment.id.includes('gender')) return 12; // 12 hours
    if (segment.id.includes('weight') && segment.id.includes('gender')) return 12; // 12 hours
    return 24; // 24 hours for most segments
  }

  /**
   * Calculates update priority based on segment and data volume
   */
  private static calculateUpdatePriority(
    segment: PercentileSegment,
    dataCount: number
  ): UpdateSchedule['priority'] {
    // Global segments are high priority
    if (segment.id.includes('global')) return 'high';
    
    // Large data updates are higher priority
    if (dataCount > 100) return 'high';
    if (dataCount > 50) return 'medium';
    
    return 'low';
  }

  /**
   * Gets update queue status
   */
  static getUpdateQueueStatus(): {
    queue_length: number;
    is_processing: boolean;
    completed_jobs_last_hour: number;
    failed_jobs_last_hour: number;
    next_scheduled_updates: UpdateSchedule[];
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get next scheduled updates
    const nextUpdates = Array.from(this.updateSchedules.values())
      .filter(schedule => schedule.next_update_due > now)
      .sort((a, b) => a.next_update_due.getTime() - b.next_update_due.getTime())
      .slice(0, 10);

    return {
      queue_length: this.updateQueue.length,
      is_processing: this.isProcessing,
      completed_jobs_last_hour: 0, // Would track from job history
      failed_jobs_last_hour: 0, // Would track from job history
      next_scheduled_updates: nextUpdates
    };
  }

  /**
   * Forces immediate update for specific segment and exercise
   */
  static async forceUpdate(
    segmentId: string,
    exerciseId: string
  ): Promise<{ success: boolean; job_id?: string; error?: string }> {
    try {
      const jobId = `force_${segmentId}_${exerciseId}_${Date.now()}`;
      
      // Get performance data for forced update
      const performanceData = await this.getExistingPerformanceData(segmentId, exerciseId);
      
      const updateJob: UpdateJob = {
        id: jobId,
        segment_id: segmentId,
        exercise_id: exerciseId,
        status: 'pending',
        records_processed: 0,
        performance_data: performanceData
      };

      // Add to front of queue with high priority
      this.updateQueue.unshift(updateJob);

      // Update schedule with critical priority
      const scheduleKey = `${segmentId}_${exerciseId}`;
      this.updateSchedules.set(scheduleKey, {
        segment_id: segmentId,
        exercise_id: exerciseId,
        last_updated: new Date(),
        next_update_due: new Date(Date.now() + 24 * 60 * 60 * 1000),
        update_frequency_hours: 6,
        priority: 'critical'
      });

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processUpdateQueue();
      }

      return {
        success: true,
        job_id: jobId
      };

    } catch (error) {
      console.error('Error forcing percentile update:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets job status by ID
   */
  static getJobStatus(jobId: string): UpdateJob | null {
    return this.updateQueue.find(job => job.id === jobId) || null;
  }

  /**
   * Cleans up completed jobs older than specified hours
   */
  static cleanupCompletedJobs(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const initialLength = this.updateQueue.length;
    
    this.updateQueue = this.updateQueue.filter(job => {
      if (job.status === 'completed' || job.status === 'failed') {
        return !job.completed_at || job.completed_at > cutoffTime;
      }
      return true; // Keep pending and running jobs
    });

    const cleanedCount = initialLength - this.updateQueue.length;
    console.log(`Cleaned up ${cleanedCount} completed jobs older than ${olderThanHours} hours`);
    
    return cleanedCount;
  }
}