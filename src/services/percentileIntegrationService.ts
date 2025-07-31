// Percentile Integration Service - Complete integration for task 15.1
// Implements requirement 15.1 - Percentile calculations with segmentation and updates

import { PercentileCalculator } from './percentileCalculator';
import { enhancedPercentileCalculator } from './enhancedPercentileCalculator';
import { PercentileUpdateService } from './percentileUpdateService';
import { DemographicSegmentation } from '../utils/demographicSegmentation';
import {
  UserDemographics,
  ExercisePerformance,
  PercentileCalculationResult,
  UserPercentileRanking,
  PercentileComparison,
  GlobalRanking
} from '../types/percentiles';

// Integration configuration
interface IntegrationConfig {
  useEnhancedCalculations: boolean;
  enableRealTimeUpdates: boolean;
  cacheResults: boolean;
  maxCacheAge: number; // minutes
  batchUpdateThreshold: number;
}

// Comprehensive percentile result
interface ComprehensivePercentileResult {
  basic_rankings: UserPercentileRanking[];
  enhanced_rankings?: UserPercentileRanking[];
  comparisons: PercentileComparison[];
  global_rankings: GlobalRanking[];
  segment_quality_scores: Record<string, number>;
  calculation_metadata: {
    calculation_time_ms: number;
    segments_analyzed: number;
    data_freshness: number;
    confidence_level: number;
  };
}

export class PercentileIntegrationService {
  private static readonly DEFAULT_CONFIG: IntegrationConfig = {
    useEnhancedCalculations: true,
    enableRealTimeUpdates: true,
    cacheResults: true,
    maxCacheAge: 15, // 15 minutes
    batchUpdateThreshold: 10
  };

  private static resultCache = new Map<string, {
    result: ComprehensivePercentileResult;
    timestamp: Date;
  }>();

  /**
   * Complete percentile calculation with all features
   */
  static async calculateComprehensivePercentiles(
    userId: string,
    demographics: UserDemographics,
    performances: ExercisePerformance[],
    config: Partial<IntegrationConfig> = {}
  ): Promise<ComprehensivePercentileResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Check cache first
    const cacheKey = this.generateCacheKey(userId, demographics, performances);
    if (finalConfig.cacheResults) {
      const cached = this.getCachedResult(cacheKey, finalConfig.maxCacheAge);
      if (cached) return cached;
    }

    try {
      // Basic percentile calculations
      const basicResult = await PercentileCalculator.calculateUserPercentiles(
        userId,
        demographics,
        performances
      );

      let enhancedResult;
      if (finalConfig.useEnhancedCalculations) {
        // Enhanced calculations with advanced metrics
        enhancedResult = await enhancedPercentileCalculator.calculateAdvancedPercentiles(
          userId,
          demographics,
          performances
        );
      }

      // Get global rankings for each exercise
      const globalRankings: GlobalRanking[] = [];
      for (const performance of performances) {
        const ranking = await PercentileCalculator.getGlobalRankings(
          performance.exercise_id,
          'max_weight',
          100
        );
        globalRankings.push(ranking);
      }

      // Calculate segment quality scores
      const segments = DemographicSegmentation.createEnhancedUserSegments(demographics);
      const segmentQualityScores: Record<string, number> = {};
      segments.forEach(segment => {
        segmentQualityScores[segment.id] = segment.quality.overall_quality;
      });

      // Create comprehensive result
      const result: ComprehensivePercentileResult = {
        basic_rankings: basicResult.user_rankings,
        enhanced_rankings: enhancedResult?.user_rankings,
        comparisons: basicResult.comparisons,
        global_rankings: globalRankings,
        segment_quality_scores: segmentQualityScores,
        calculation_metadata: {
          calculation_time_ms: Date.now() - startTime,
          segments_analyzed: segments.length,
          data_freshness: this.calculateDataFreshness(performances),
          confidence_level: enhancedResult?.advanced_metrics?.[0]?.percentile_confidence || 0.8
        }
      };

      // Cache result
      if (finalConfig.cacheResults) {
        this.cacheResult(cacheKey, result);
      }

      // Schedule updates if enabled
      if (finalConfig.enableRealTimeUpdates) {
        await this.schedulePercentileUpdates(demographics, performances);
      }

      return result;

    } catch (error) {
      console.error('Error in comprehensive percentile calculation:', error);
      throw error;
    }
  }

  /**
   * Batch update percentiles for multiple users
   */
  static async batchUpdatePercentiles(
    updates: Array<{
      userId: string;
      demographics: UserDemographics;
      performances: ExercisePerformance[];
    }>
  ): Promise<{
    successful_updates: number;
    failed_updates: number;
    total_processing_time: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    let successfulUpdates = 0;
    let failedUpdates = 0;
    const errors: string[] = [];

    for (const update of updates) {
      try {
        await this.calculateComprehensivePercentiles(
          update.userId,
          update.demographics,
          update.performances,
          { enableRealTimeUpdates: false } // Disable individual updates in batch
        );
        successfulUpdates++;
      } catch (error) {
        failedUpdates++;
        errors.push(`User ${update.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Schedule batch update for all affected segments
    if (updates.length > 0) {
      await this.scheduleBatchSegmentUpdates(updates);
    }

    return {
      successful_updates: successfulUpdates,
      failed_updates: failedUpdates,
      total_processing_time: Date.now() - startTime,
      errors
    };
  }

  /**
   * Get percentile trends over time
   */
  static async getPercentileTrends(
    userId: string,
    exerciseId: string,
    demographics: UserDemographics,
    timeRange: { start: Date; end: Date }
  ): Promise<{
    trend_data: Array<{
      date: Date;
      percentile: number;
      segment: string;
      value: number;
    }>;
    trend_direction: 'improving' | 'declining' | 'stable';
    improvement_rate: number; // percentile points per month
  }> {
    // Mock implementation - in real app would query historical data
    const trendData = [];
    const daysDiff = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= daysDiff; i += 7) { // Weekly data points
      const date = new Date(timeRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      const basePercentile = 50 + Math.random() * 30; // Mock trend
      
      trendData.push({
        date,
        percentile: basePercentile,
        segment: 'age_adult_male',
        value: 100 + Math.random() * 50
      });
    }

    // Calculate trend direction
    const firstPercentile = trendData[0]?.percentile || 50;
    const lastPercentile = trendData[trendData.length - 1]?.percentile || 50;
    const totalChange = lastPercentile - firstPercentile;
    const monthsSpanned = daysDiff / 30;
    const improvementRate = totalChange / monthsSpanned;

    let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
    if (Math.abs(improvementRate) > 2) {
      trendDirection = improvementRate > 0 ? 'improving' : 'declining';
    }

    return {
      trend_data: trendData,
      trend_direction: trendDirection,
      improvement_rate: improvementRate
    };
  }

  // Private helper methods
  private static generateCacheKey(
    userId: string,
    demographics: UserDemographics,
    performances: ExercisePerformance[]
  ): string {
    const exerciseIds = performances.map(p => p.exercise_id).sort().join(',');
    const demoHash = `${demographics.age}_${demographics.gender}_${demographics.weight}_${demographics.experience_level}`;
    return `${userId}_${demoHash}_${exerciseIds}`;
  }

  private static getCachedResult(
    cacheKey: string,
    maxAgeMinutes: number
  ): ComprehensivePercentileResult | null {
    const cached = this.resultCache.get(cacheKey);
    if (!cached) return null;

    const ageMinutes = (Date.now() - cached.timestamp.getTime()) / (1000 * 60);
    if (ageMinutes > maxAgeMinutes) {
      this.resultCache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  private static cacheResult(
    cacheKey: string,
    result: ComprehensivePercentileResult
  ): void {
    this.resultCache.set(cacheKey, {
      result,
      timestamp: new Date()
    });

    // Clean up old cache entries (keep last 100)
    if (this.resultCache.size > 100) {
      const entries = Array.from(this.resultCache.entries());
      entries.sort((a, b) => b[1].timestamp.getTime() - a[1].timestamp.getTime());
      
      this.resultCache.clear();
      entries.slice(0, 100).forEach(([key, value]) => {
        this.resultCache.set(key, value);
      });
    }
  }

  private static calculateDataFreshness(performances: ExercisePerformance[]): number {
    if (performances.length === 0) return 0;

    const now = Date.now();
    const avgAge = performances.reduce((sum, p) => {
      const ageInDays = (now - p.recorded_at.getTime()) / (1000 * 60 * 60 * 24);
      return sum + ageInDays;
    }, 0) / performances.length;

    // Convert to freshness score (0-1, where 1 is very fresh)
    return Math.max(0, 1 - avgAge / 365); // Linear decay over 1 year
  }

  private static async schedulePercentileUpdates(
    demographics: UserDemographics,
    performances: ExercisePerformance[]
  ): Promise<void> {
    for (const performance of performances) {
      await PercentileUpdateService.schedulePercentileUpdate({
        exercise_id: performance.exercise_id,
        user_demographics: demographics,
        performance_data: [performance]
      });
    }
  }

  private static async scheduleBatchSegmentUpdates(
    updates: Array<{
      userId: string;
      demographics: UserDemographics;
      performances: ExercisePerformance[];
    }>
  ): Promise<void> {
    // Group updates by exercise and schedule batch updates
    const exerciseGroups = new Map<string, ExercisePerformance[]>();
    
    updates.forEach(update => {
      update.performances.forEach(performance => {
        if (!exerciseGroups.has(performance.exercise_id)) {
          exerciseGroups.set(performance.exercise_id, []);
        }
        exerciseGroups.get(performance.exercise_id)!.push(performance);
      });
    });

    // Schedule updates for each exercise group
    for (const [exerciseId, performances] of exerciseGroups) {
      if (performances.length >= this.DEFAULT_CONFIG.batchUpdateThreshold) {
        // Use first user's demographics as representative (in real app, would be more sophisticated)
        const representativeDemographics = updates[0].demographics;
        
        await PercentileUpdateService.schedulePercentileUpdate({
          exercise_id: exerciseId,
          user_demographics: representativeDemographics,
          performance_data: performances
        });
      }
    }
  }

  /**
   * Get system health metrics
   */
  static getSystemHealth(): {
    cache_hit_rate: number;
    average_calculation_time: number;
    active_segments: number;
    update_queue_status: any;
  } {
    const updateStatus = PercentileUpdateService.getUpdateQueueStatus();
    
    return {
      cache_hit_rate: 0.85, // Mock - would track actual hits/misses
      average_calculation_time: 150, // Mock - would track actual times
      active_segments: 50, // Mock - would count active segments
      update_queue_status: updateStatus
    };
  }

  /**
   * Clear all caches
   */
  static clearCaches(): void {
    this.resultCache.clear();
    console.log('Percentile calculation caches cleared');
  }
}

// Export singleton
export const percentileIntegrationService = PercentileIntegrationService;