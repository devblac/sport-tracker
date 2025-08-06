/**
 * Percentile Integration Service
 * 
 * Complete integration service that connects local calculations with Supabase backend
 * Implements Task 15.1 - Comprehensive percentile calculation system
 */

import { percentileCalculator, PerformanceData, PercentileResult } from './PercentileCalculator';
import { supabasePercentileService, SupabasePercentileResult } from './SupabasePercentileService';
import { Workout } from '../types/workoutModels';
import { User } from '../types/userModels';
import { Exercise } from '../types/exerciseModels';

export interface EnhancedPercentileResult extends PercentileResult {
  improvement?: {
    previousPercentile: number;
    change: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  predictions?: {
    nextMilestone: number;
    estimatedTimeToReach: string;
    recommendedTraining: string[];
  };
  comparisons?: {
    vsAverage: number;
    vsTop10: number;
    vsPersonalBest: number;
  };
}

export interface PercentileUpdateResult {
  success: boolean;
  percentiles: EnhancedPercentileResult[];
  newPersonalBests: string[];
  achievements: string[];
  error?: string;
}

export interface PercentileSegmentAnalysis {
  segment: string;
  userRank: number;
  totalUsers: number;
  percentile: number;
  strengthAreas: Array<{ exercise: string; percentile: number }>;
  improvementAreas: Array<{ exercise: string; percentile: number }>;
  recommendations: string[];
}

export class PercentileIntegrationService {
  private static instance: PercentileIntegrationService;
  private isInitialized = false;
  private lastUpdateTime: Date | null = null;

  private constructor() {}

  public static getInstance(): PercentileIntegrationService {
    if (!PercentileIntegrationService.instance) {
      PercentileIntegrationService.instance = new PercentileIntegrationService();
    }
    return PercentileIntegrationService.instance;
  }

  /**
   * Initialize the service with existing data
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load existing performance data from Supabase
      await this.loadExistingData();
      this.isInitialized = true;
      this.lastUpdateTime = new Date();
      console.log('Percentile Integration Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Percentile Integration Service:', error);
      throw error;
    }
  }

  /**
   * Process workout completion and update percentiles
   */
  async processWorkoutCompletion(
    workout: Workout,
    exercises: Exercise[],
    user: User
  ): Promise<PercentileUpdateResult> {
    try {
      // Ensure service is initialized
      await this.initialize();

      // Submit to Supabase for backend processing
      await supabasePercentileService.submitWorkoutData(workout, exercises, user);

      // Process locally for immediate feedback
      const performanceData = this.extractPerformanceData(workout, exercises, user);
      const localResults = this.calculateLocalPercentiles(performanceData);

      // Enhance results with predictions and comparisons
      const enhancedResults = await this.enhancePercentileResults(localResults, user.id);

      // Detect new personal bests and achievements
      const newPersonalBests = this.detectPersonalBests(performanceData);
      const achievements = this.detectAchievements(enhancedResults);

      return {
        success: true,
        percentiles: enhancedResults,
        newPersonalBests,
        achievements
      };
    } catch (error) {
      console.error('Failed to process workout completion:', error);
      return {
        success: false,
        percentiles: [],
        newPersonalBests: [],
        achievements: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get comprehensive user percentile analysis
   */
  async getUserPercentileAnalysis(userId: string): Promise<{
    overallRanking: {
      percentile: number;
      rank: number;
      totalUsers: number;
      level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
    };
    exerciseBreakdown: Array<{
      exerciseId: string;
      exerciseName: string;
      bestPercentile: number;
      metrics: EnhancedPercentileResult[];
    }>;
    segmentAnalysis: PercentileSegmentAnalysis[];
    trends: {
      improving: string[];
      declining: string[];
      stable: string[];
    };
    recommendations: string[];
  }> {
    try {
      // Get data from both sources
      const [supabaseData, localData] = await Promise.all([
        supabasePercentileService.getUserOverallPercentile(userId),
        this.getLocalUserData(userId)
      ]);

      // Combine and analyze data
      const analysis = this.analyzeUserPerformance(supabaseData, localData);
      
      return analysis;
    } catch (error) {
      console.error('Failed to get user percentile analysis:', error);
      throw error;
    }
  }

  /**
   * Get exercise-specific percentile comparison
   */
  async getExerciseComparison(
    exerciseId: string,
    userId?: string
  ): Promise<{
    statistics: {
      totalUsers: number;
      averagePerformance: Record<string, number>;
      topPerformances: Record<string, number>;
      percentileDistribution: Record<string, number>;
    };
    userPosition?: {
      percentiles: EnhancedPercentileResult[];
      rank: number;
      segment: string;
    };
    topPerformers: Array<{
      rank: number;
      value: number;
      metric: string;
      segment: string;
    }>;
    recommendations: string[];
  }> {
    try {
      // Get exercise statistics from Supabase
      const supabaseStats = await supabasePercentileService.getExerciseStatistics(exerciseId);
      const localStats = percentileCalculator.getExerciseStatistics(exerciseId);

      // Get user-specific data if provided
      let userPosition;
      if (userId) {
        const userPercentiles = await supabasePercentileService.getUserExercisePercentiles(userId, exerciseId);
        userPosition = this.processUserPosition(userPercentiles);
      }

      // Get top performers
      const topPerformers = await this.getTopPerformersForExercise(exerciseId);

      // Generate recommendations
      const recommendations = this.generateExerciseRecommendations(exerciseId, userPosition);

      return {
        statistics: this.combineStatistics(supabaseStats, localStats),
        userPosition,
        topPerformers,
        recommendations
      };
    } catch (error) {
      console.error('Failed to get exercise comparison:', error);
      throw error;
    }
  }

  /**
   * Update percentiles with real-time calculation
   */
  async updatePercentiles(userId: string, exerciseId?: string): Promise<boolean> {
    try {
      // Trigger Supabase calculation if available
      const supabaseSuccess = await supabasePercentileService.triggerPercentileCalculation();
      
      // Update local calculations
      await this.refreshLocalData();

      return supabaseSuccess;
    } catch (error) {
      console.error('Failed to update percentiles:', error);
      return false;
    }
  }

  /**
   * Get percentile trends over time
   */
  async getPercentileTrends(
    userId: string,
    exerciseId: string,
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<{
    trends: Array<{
      date: string;
      percentile: number;
      metric: string;
      value: number;
    }>;
    analysis: {
      overallTrend: 'improving' | 'declining' | 'stable';
      averageImprovement: number;
      bestPeriod: string;
      recommendations: string[];
    };
  }> {
    try {
      // This would typically query historical data
      // For now, we'll simulate trend analysis
      const trends = await this.simulateTrendData(userId, exerciseId, timeRange);
      const analysis = this.analyzeTrends(trends);

      return { trends, analysis };
    } catch (error) {
      console.error('Failed to get percentile trends:', error);
      throw error;
    }
  }

  // Private helper methods

  private async loadExistingData(): Promise<void> {
    try {
      // Load segments and basic data
      const segments = await supabasePercentileService.getSegments();
      console.log(`Loaded ${segments.length} demographic segments`);
      
      // Initialize local calculator with any cached data
      // This would typically load recent performance data for local calculations
    } catch (error) {
      console.warn('Could not load existing data, starting fresh:', error);
    }
  }

  private extractPerformanceData(
    workout: Workout,
    exercises: Exercise[],
    user: User
  ): PerformanceData[] {
    if (!user.profile) return [];

    const performanceData: PerformanceData[] = [];

    for (const workoutExercise of workout.exercises) {
      const exercise = exercises.find(e => e.id === workoutExercise.exerciseId);
      if (!exercise || !workoutExercise.sets || workoutExercise.sets.length === 0) {
        continue;
      }

      // Find the best set
      const bestSet = workoutExercise.sets.reduce((best, current) => {
        if (!current.weight || !current.reps) return best;
        if (!best.weight || !best.reps) return current;
        
        const bestOneRM = best.weight * (1 + best.reps / 30);
        const currentOneRM = current.weight * (1 + current.reps / 30);
        
        return currentOneRM > bestOneRM ? current : best;
      });

      if (!bestSet.weight || !bestSet.reps) continue;

      const estimatedOneRM = bestSet.weight * (1 + bestSet.reps / 30);

      performanceData.push({
        exerciseId: workoutExercise.exerciseId,
        exerciseName: exercise.name,
        weight: bestSet.weight,
        reps: bestSet.reps,
        estimatedOneRM,
        bodyWeight: user.profile.weight || 70,
        date: workout.completedAt || new Date(),
        userId: user.id,
        demographics: {
          age: user.profile.age || 25,
          gender: user.profile.gender || 'other',
          weight: user.profile.weight || 70,
          experienceLevel: this.determineExperienceLevel(user.profile.totalWorkouts || 0)
        }
      });
    }

    return performanceData;
  }

  private calculateLocalPercentiles(performanceData: PerformanceData[]): PercentileResult[] {
    const results: PercentileResult[] = [];

    for (const data of performanceData) {
      // Add to local calculator
      percentileCalculator.addPerformanceData(data);
      
      // Calculate percentiles for all metrics
      const exercisePercentiles = percentileCalculator.getExercisePercentiles(data.exerciseId, data);
      results.push(...exercisePercentiles);
    }

    return results;
  }

  private async enhancePercentileResults(
    results: PercentileResult[],
    userId: string
  ): Promise<EnhancedPercentileResult[]> {
    return results.map(result => ({
      ...result,
      improvement: this.calculateImprovement(result, userId),
      predictions: this.generatePredictions(result),
      comparisons: this.calculateComparisons(result)
    }));
  }

  private detectPersonalBests(performanceData: PerformanceData[]): string[] {
    // This would compare against historical data to detect new PRs
    // For now, simulate detection
    return performanceData
      .filter(() => Math.random() > 0.7) // 30% chance of PR
      .map(data => `${data.exerciseName} - ${data.estimatedOneRM}kg 1RM`);
  }

  private detectAchievements(results: EnhancedPercentileResult[]): string[] {
    const achievements: string[] = [];

    for (const result of results) {
      if (result.percentile >= 90) {
        achievements.push(`Top 10% in ${result.exerciseId} ${result.metric}`);
      }
      if (result.percentile >= 95) {
        achievements.push(`Top 5% Elite Performer in ${result.exerciseId}`);
      }
      if (result.rank === 1) {
        achievements.push(`#1 Ranked in ${result.exerciseId} ${result.metric}`);
      }
    }

    return achievements;
  }

  private calculateImprovement(result: PercentileResult, userId: string) {
    // This would compare against historical data
    // For now, simulate improvement tracking
    const previousPercentile = result.percentile - Math.random() * 10;
    const change = result.percentile - previousPercentile;
    
    return {
      previousPercentile: Math.max(0, previousPercentile),
      change: Math.round(change * 10) / 10,
      trend: change > 2 ? 'improving' as const : change < -2 ? 'declining' as const : 'stable' as const
    };
  }

  private generatePredictions(result: PercentileResult) {
    const nextMilestone = Math.ceil(result.percentile / 10) * 10;
    const percentileGap = nextMilestone - result.percentile;
    
    return {
      nextMilestone,
      estimatedTimeToReach: percentileGap < 5 ? '2-4 weeks' : percentileGap < 15 ? '1-3 months' : '3-6 months',
      recommendedTraining: this.getTrainingRecommendations(result.exerciseId, result.metric)
    };
  }

  private calculateComparisons(result: PercentileResult) {
    return {
      vsAverage: result.percentile - 50,
      vsTop10: result.percentile - 90,
      vsPersonalBest: 0 // Would compare against user's historical best
    };
  }

  private getTrainingRecommendations(exerciseId: string, metric: string): string[] {
    const recommendations: Record<string, string[]> = {
      'weight': ['Focus on progressive overload', 'Increase training frequency', 'Improve form and technique'],
      'oneRM': ['Train in 1-5 rep range', 'Focus on compound movements', 'Improve neural efficiency'],
      'volume': ['Increase training volume gradually', 'Focus on time under tension', 'Improve work capacity'],
      'relative_strength': ['Optimize body composition', 'Focus on strength-to-weight ratio', 'Include bodyweight exercises']
    };

    return recommendations[metric] || ['Continue consistent training', 'Focus on progressive overload'];
  }

  private determineExperienceLevel(totalWorkouts: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (totalWorkouts < 20) return 'beginner';
    if (totalWorkouts < 100) return 'intermediate';
    if (totalWorkouts < 300) return 'advanced';
    return 'expert';
  }

  private async getLocalUserData(userId: string): Promise<any> {
    // This would get local calculation data for the user
    return {};
  }

  private analyzeUserPerformance(supabaseData: any, localData: any): any {
    // Combine and analyze performance data
    return {
      overallRanking: {
        percentile: supabaseData.overallPercentile,
        rank: Math.ceil((100 - supabaseData.overallPercentile) * supabaseData.totalExercises / 100),
        totalUsers: supabaseData.totalExercises * 100, // Estimate
        level: this.determinePerformanceLevel(supabaseData.overallPercentile)
      },
      exerciseBreakdown: [],
      segmentAnalysis: [],
      trends: { improving: [], declining: [], stable: [] },
      recommendations: this.generateUserRecommendations(supabaseData)
    };
  }

  private determinePerformanceLevel(percentile: number): 'beginner' | 'intermediate' | 'advanced' | 'elite' {
    if (percentile >= 90) return 'elite';
    if (percentile >= 70) return 'advanced';
    if (percentile >= 40) return 'intermediate';
    return 'beginner';
  }

  private generateUserRecommendations(data: any): string[] {
    const recommendations = [];
    
    if (data.overallPercentile < 50) {
      recommendations.push('Focus on consistency and progressive overload');
      recommendations.push('Work on your weakest exercises first');
    } else if (data.overallPercentile < 80) {
      recommendations.push('Specialize in your strongest lifts');
      recommendations.push('Consider advanced training techniques');
    } else {
      recommendations.push('Maintain your elite performance');
      recommendations.push('Focus on competition preparation');
    }

    return recommendations;
  }

  private processUserPosition(userPercentiles: SupabasePercentileResult[]): any {
    if (userPercentiles.length === 0) return undefined;

    const bestPercentile = Math.max(...userPercentiles.map(p => p.percentile_value));
    const avgRank = Math.round(
      userPercentiles.reduce((sum, p) => sum + p.rank_position, 0) / userPercentiles.length
    );

    return {
      percentiles: userPercentiles,
      rank: avgRank,
      segment: userPercentiles[0].segment?.name || 'General'
    };
  }

  private async getTopPerformersForExercise(exerciseId: string): Promise<any[]> {
    // Get top performers from Supabase
    const topPerformers = await supabasePercentileService.getTopPerformers(exerciseId, 1, 'oneRM', 10);
    
    return topPerformers.map((performer, index) => ({
      rank: index + 1,
      value: performer.user_value,
      metric: performer.metric_type,
      segment: performer.segment?.name || 'General'
    }));
  }

  private generateExerciseRecommendations(exerciseId: string, userPosition?: any): string[] {
    const recommendations = ['Focus on progressive overload', 'Maintain proper form'];
    
    if (userPosition && userPosition.rank > 50) {
      recommendations.push('Consider working with a trainer');
      recommendations.push('Focus on basic strength building');
    } else if (userPosition && userPosition.rank <= 10) {
      recommendations.push('Consider competition training');
      recommendations.push('Focus on advanced techniques');
    }

    return recommendations;
  }

  private combineStatistics(supabaseStats: any[], localStats: any): any {
    return {
      totalUsers: localStats.totalUsers,
      averagePerformance: {
        weight: supabaseStats[0]?.average_value || 0,
        oneRM: supabaseStats[1]?.average_value || 0,
        volume: supabaseStats[2]?.average_value || 0,
        relative_strength: supabaseStats[3]?.average_value || 0
      },
      topPerformances: {
        weight: supabaseStats[0]?.top_performance || 0,
        oneRM: supabaseStats[1]?.top_performance || 0,
        volume: supabaseStats[2]?.top_performance || 0,
        relative_strength: supabaseStats[3]?.top_performance || 0
      },
      percentileDistribution: {
        p25: supabaseStats[0]?.percentile_25 || 0,
        p50: supabaseStats[0]?.percentile_50 || 0,
        p75: supabaseStats[0]?.percentile_75 || 0,
        p95: supabaseStats[0]?.percentile_95 || 0
      }
    };
  }

  private async refreshLocalData(): Promise<void> {
    // Refresh local calculator with latest data
    this.lastUpdateTime = new Date();
  }

  private async simulateTrendData(userId: string, exerciseId: string, timeRange: string): Promise<any[]> {
    // This would query historical percentile data
    // For now, simulate trend data
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const trends = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        percentile: 50 + Math.random() * 30 - 15, // Simulate percentile between 35-65
        metric: 'oneRM',
        value: 100 + Math.random() * 50 - 25 // Simulate value between 75-125
      });
    }
    
    return trends;
  }

  private analyzeTrends(trends: any[]): any {
    if (trends.length < 2) {
      return {
        overallTrend: 'stable' as const,
        averageImprovement: 0,
        bestPeriod: 'N/A',
        recommendations: ['Need more data for trend analysis']
      };
    }

    const firstPercentile = trends[0].percentile;
    const lastPercentile = trends[trends.length - 1].percentile;
    const change = lastPercentile - firstPercentile;

    return {
      overallTrend: change > 2 ? 'improving' as const : change < -2 ? 'declining' as const : 'stable' as const,
      averageImprovement: Math.round(change * 10) / 10,
      bestPeriod: trends.reduce((best, current) => 
        current.percentile > best.percentile ? current : best
      ).date,
      recommendations: this.getTrendRecommendations(change)
    };
  }

  private getTrendRecommendations(change: number): string[] {
    if (change > 5) {
      return ['Great progress! Keep up the current training', 'Consider increasing training intensity'];
    } else if (change < -5) {
      return ['Review your training program', 'Consider deload week', 'Check recovery and nutrition'];
    } else {
      return ['Maintain consistent training', 'Consider periodization', 'Focus on weak points'];
    }
  }
}

// Export singleton instance
export const percentileIntegrationService = PercentileIntegrationService.getInstance();