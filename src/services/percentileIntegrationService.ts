/**
 * Percentile Integration Service
 * 
 * Integrates percentile calculations with the main fitness app,
 * handling workout completion processing and user analysis.
 */

import { Workout } from '@/types/workout';
import { Exercise } from '@/types';
import { User } from '@/types';
import { UserDemographics, UserPercentileRanking, ExercisePerformance } from '@/types/percentiles';
import { GlobalPercentilesService } from './GlobalPercentilesService';
import { supabasePercentileService } from './SupabasePercentileService';
import { realTimePercentileUpdater } from './realTimePercentileUpdater';

export interface WorkoutProcessingResult {
  percentiles: UserPercentileRanking[];
  newPersonalBests: string[];
  achievements: string[];
  rankingChanges: Array<{
    exercise_id: string;
    previous_percentile: number;
    new_percentile: number;
    change: number;
  }>;
  processingTime: number;
}

export interface UserPercentileAnalysis {
  overallRanking: {
    percentile: number;
    rank: number;
    totalUsers: number;
    level: string;
  };
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  recommendations: string[];
  strongestExercises: Array<{
    exercise_id: string;
    exercise_name: string;
    percentile: number;
    segment: string;
  }>;
  improvementAreas: Array<{
    exercise_id: string;
    exercise_name: string;
    percentile: number;
    potential: number;
  }>;
}

export interface ExerciseComparison {
  exercise_id: string;
  exercise_name: string;
  userPosition: {
    percentile: number;
    rank: number;
    totalUsers: number;
  };
  statistics: {
    totalUsers: number;
    averagePerformance: {
      weight: number;
      oneRM: number;
      volume: number;
    };
    topPerformances: {
      weight: number;
      oneRM: number;
      volume: number;
    };
  };
  topPerformers: Array<{
    rank: number;
    value: number;
    metric: string;
    segment: string;
  }>;
  recommendations: string[];
}

export interface PercentileTrends {
  exercise_id: string;
  trends: Array<{
    date: Date;
    percentile: number;
    rank: number;
    value: number;
  }>;
  analysis: {
    overallTrend: 'improving' | 'declining' | 'stable';
    averageImprovement: number;
    bestPeriod: string;
    recommendations: string[];
  };
}

export interface EnhancedPercentileResult {
  percentiles: UserPercentileRanking[];
  achievements: string[];
}

class PercentileIntegrationService {
  private globalService: GlobalPercentilesService;

  constructor() {
    this.globalService = GlobalPercentilesService.getInstance();
  }

  /**
   * Process workout completion and update percentiles
   */
  async processWorkoutCompletion(
    workout: Workout,
    exercises: Exercise[],
    user: User
  ): Promise<WorkoutProcessingResult> {
    const startTime = Date.now();

    try {
      // Extract user demographics
      const demographics: UserDemographics = {
        age: user.profile?.age || 25,
        gender: (user.profile?.gender as 'male' | 'female' | 'other') || 'other',
        weight: user.profile?.weight || 70,
        height: user.profile?.height || 170,
        experience_level: this.determineExperienceLevel(user.profile?.totalWorkouts || 0)
      };

      // Update percentiles using the global service
      const updateResult = await this.globalService.updatePercentilesWithWorkout(
        workout,
        exercises,
        user
      );

      // Submit data to Supabase for long-term storage
      await supabasePercentileService.submitWorkoutData(workout, exercises, user);

      // Detect achievements based on percentile improvements
      const achievements = this.detectPercentileAchievements(updateResult.ranking_changes);

      const result: WorkoutProcessingResult = {
        percentiles: updateResult.updated_percentiles,
        newPersonalBests: updateResult.new_achievements,
        achievements,
        rankingChanges: updateResult.ranking_changes,
        processingTime: Date.now() - startTime
      };

      return result;

    } catch (error) {
      console.error('Error processing workout completion:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive user percentile analysis
   */
  async getUserPercentileAnalysis(userId: string): Promise<UserPercentileAnalysis> {
    try {
      // Mock user demographics for demo
      const demographics: UserDemographics = {
        age: 28,
        gender: 'male',
        weight: 75,
        height: 175,
        experience_level: 'intermediate'
      };

      // Get global percentiles
      const globalData = await this.globalService.getGlobalPercentiles(userId, demographics);

      // Calculate overall ranking
      const averagePercentile = Math.round(
        globalData.user_rankings.reduce((sum, r) => sum + r.percentile, 0) / 
        globalData.user_rankings.length
      );

      const overallRanking = {
        percentile: averagePercentile,
        rank: Math.floor((100 - averagePercentile) / 100 * 50000), // Estimate from 50k users
        totalUsers: 50000,
        level: this.getPerformanceLevel(averagePercentile)
      };

      // Analyze trends (mock data for demo)
      const trends = {
        improving: ['bench_press', 'squat'],
        declining: ['deadlift'],
        stable: ['overhead_press', 'barbell_row']
      };

      // Get strongest exercises
      const strongestExercises = globalData.user_rankings
        .sort((a, b) => b.percentile - a.percentile)
        .slice(0, 5)
        .map(ranking => ({
          exercise_id: ranking.exercise_id,
          exercise_name: ranking.exercise_name,
          percentile: ranking.percentile,
          segment: ranking.segment.name
        }));

      // Get improvement areas
      const improvementAreas = globalData.user_rankings
        .sort((a, b) => a.percentile - b.percentile)
        .slice(0, 3)
        .map(ranking => ({
          exercise_id: ranking.exercise_id,
          exercise_name: ranking.exercise_name,
          percentile: ranking.percentile,
          potential: Math.min(ranking.percentile + 20, 90) // Potential improvement
        }));

      return {
        overallRanking,
        trends,
        recommendations: globalData.recommendations.training_focus,
        strongestExercises,
        improvementAreas
      };

    } catch (error) {
      console.error('Error getting user percentile analysis:', error);
      throw error;
    }
  }

  /**
   * Get exercise-specific comparison data
   */
  async getExerciseComparison(exerciseId: string, userId: string): Promise<ExerciseComparison> {
    try {
      // Get exercise global data
      const exerciseData = await this.globalService.getExerciseGlobalData(exerciseId);

      // Mock user position for demo
      const userPosition = {
        percentile: 72,
        rank: 1400,
        totalUsers: 5000
      };

      // Calculate statistics
      const statistics = {
        totalUsers: exerciseData.total_participants,
        averagePerformance: {
          weight: exerciseData.global_statistics.mean,
          oneRM: exerciseData.global_statistics.mean * 1.1,
          volume: exerciseData.global_statistics.mean * 8
        },
        topPerformances: {
          weight: exerciseData.global_statistics.top_1_percent,
          oneRM: exerciseData.global_statistics.top_1_percent * 1.1,
          volume: exerciseData.global_statistics.top_1_percent * 8
        }
      };

      // Get top performers
      const topPerformers = exerciseData.demographic_breakdown
        .flatMap(breakdown => breakdown.top_performers.slice(0, 2))
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 10)
        .map(performer => ({
          rank: performer.rank,
          value: performer.value,
          metric: 'weight',
          segment: 'Global'
        }));

      // Generate recommendations
      const recommendations = [
        `Focus on progressive overload to improve your ${exerciseId.replace('_', ' ')} performance`,
        `Your current percentile suggests intermediate level - consider advanced techniques`,
        `Compare with users in your demographic segment for more targeted goals`
      ];

      return {
        exercise_id: exerciseId,
        exercise_name: exerciseData.exercise_name,
        userPosition,
        statistics,
        topPerformers,
        recommendations
      };

    } catch (error) {
      console.error('Error getting exercise comparison:', error);
      throw error;
    }
  }

  /**
   * Get percentile trends for an exercise
   */
  async getPercentileTrends(userId: string, exerciseId: string): Promise<PercentileTrends> {
    try {
      // Mock trend data for demo
      const trends = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        
        return {
          date,
          percentile: 60 + Math.sin(i * 0.5) * 10 + i * 2, // Upward trend with variation
          rank: 2000 - i * 50,
          value: 80 + i * 2.5
        };
      });

      const analysis = {
        overallTrend: 'improving' as const,
        averageImprovement: 2.5,
        bestPeriod: 'Last 3 months',
        recommendations: [
          'Maintain current training consistency',
          'Consider increasing training frequency',
          'Focus on technique refinement for continued improvement'
        ]
      };

      return {
        exercise_id: exerciseId,
        trends,
        analysis
      };

    } catch (error) {
      console.error('Error getting percentile trends:', error);
      throw error;
    }
  }

  /**
   * Detect achievements based on percentile changes
   */
  private detectPercentileAchievements(rankingChanges: Array<{
    exercise_id: string;
    previous_percentile: number;
    new_percentile: number;
    change: number;
  }>): string[] {
    const achievements: string[] = [];

    rankingChanges.forEach(change => {
      // Significant improvement achievement
      if (change.change >= 10) {
        achievements.push(`Big Leap: Improved ${change.exercise_id} by ${change.change} percentiles!`);
      }

      // Milestone achievements
      if (change.previous_percentile < 75 && change.new_percentile >= 75) {
        achievements.push(`Advanced Level: Reached 75th percentile in ${change.exercise_id}!`);
      }

      if (change.previous_percentile < 90 && change.new_percentile >= 90) {
        achievements.push(`Elite Status: Reached 90th percentile in ${change.exercise_id}!`);
      }

      if (change.previous_percentile < 95 && change.new_percentile >= 95) {
        achievements.push(`Top Tier: Reached 95th percentile in ${change.exercise_id}!`);
      }
    });

    return achievements;
  }

  /**
   * Determine experience level based on total workouts
   */
  private determineExperienceLevel(totalWorkouts: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (totalWorkouts < 20) return 'beginner';
    if (totalWorkouts < 100) return 'intermediate';
    if (totalWorkouts < 300) return 'advanced';
    return 'expert';
  }

  /**
   * Get performance level label based on percentile
   */
  private getPerformanceLevel(percentile: number): string {
    if (percentile >= 95) return 'Elite';
    if (percentile >= 85) return 'Advanced';
    if (percentile >= 65) return 'Above Average';
    if (percentile >= 35) return 'Average';
    return 'Below Average';
  }

  /**
   * Calculate percentile improvement potential
   */
  calculateImprovementPotential(
    currentPercentile: number,
    demographics: UserDemographics,
    exerciseId: string
  ): {
    nextTarget: number;
    timeEstimate: string;
    difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
    recommendations: string[];
  } {
    // Determine next realistic target
    let nextTarget = 50;
    if (currentPercentile >= 90) nextTarget = 95;
    else if (currentPercentile >= 75) nextTarget = 90;
    else if (currentPercentile >= 50) nextTarget = 75;
    else nextTarget = 50;

    // Estimate time based on current level and target
    const percentileGap = nextTarget - currentPercentile;
    let timeEstimate = '3-6 months';
    let difficulty: 'easy' | 'moderate' | 'hard' | 'extreme' = 'moderate';

    if (percentileGap <= 10) {
      timeEstimate = '1-3 months';
      difficulty = 'easy';
    } else if (percentileGap <= 25) {
      timeEstimate = '3-6 months';
      difficulty = 'moderate';
    } else if (percentileGap <= 40) {
      timeEstimate = '6-12 months';
      difficulty = 'hard';
    } else {
      timeEstimate = '12+ months';
      difficulty = 'extreme';
    }

    // Generate recommendations based on demographics and current level
    const recommendations = [];
    
    if (demographics.experience_level === 'beginner') {
      recommendations.push('Focus on form and consistency');
      recommendations.push('Follow a structured program');
    } else if (demographics.experience_level === 'intermediate') {
      recommendations.push('Implement progressive overload');
      recommendations.push('Consider periodization');
    } else {
      recommendations.push('Use advanced techniques');
      recommendations.push('Focus on weak points');
    }

    if (currentPercentile < 50) {
      recommendations.push('Build foundational strength');
    } else if (currentPercentile < 75) {
      recommendations.push('Increase training frequency');
    } else {
      recommendations.push('Fine-tune technique');
      recommendations.push('Consider competition preparation');
    }

    return {
      nextTarget,
      timeEstimate,
      difficulty,
      recommendations
    };
  }
}

// Singleton instance
export const percentileIntegrationService = new PercentileIntegrationService();