/**
 * ExercisePerformanceService - Enhanced exercise performance tracking with Supabase integration
 * 
 * Provides comprehensive exercise performance tracking, personal record detection,
 * progress analytics, and intelligent exercise recommendations.
 */

import { supabaseService } from './SupabaseService';
import { dbManager } from '@/db/IndexedDBManager';
import type { Workout, WorkoutExercise, SetData } from '@/schemas/workout';
import { logger } from '@/utils/logger';

export interface ExercisePerformance {
  id: string;
  user_id: string;
  exercise_id: string;
  workout_session_id?: string;
  sets_data: SetData[];
  max_weight: number;
  total_volume: number;
  total_reps: number;
  one_rep_max: number;
  is_pr_weight: boolean;
  is_pr_volume: boolean;
  is_pr_reps: boolean;
  performed_at: Date;
}

export interface PersonalRecord {
  id: string;
  exercise_id: string;
  exercise_name: string;
  type: 'weight' | 'volume' | 'reps' | 'one_rep_max';
  value: number;
  previous_value: number;
  improvement: number;
  improvement_percentage: number;
  achieved_at: Date;
  workout_session_id: string;
  set_data?: SetData;
}

export interface ExerciseProgress {
  exercise_id: string;
  exercise_name: string;
  first_performed: Date;
  last_performed: Date;
  total_sessions: number;
  total_volume: number;
  total_reps: number;
  total_sets: number;
  current_max_weight: number;
  current_one_rep_max: number;
  progress_trend: 'improving' | 'stable' | 'declining';
  recent_performances: ExercisePerformance[];
  personal_records: PersonalRecord[];
}

export interface ExerciseRecommendation {
  exercise_id: string;
  exercise_name: string;
  recommendation_type: 'weight_increase' | 'volume_increase' | 'deload' | 'form_focus' | 'rest_needed';
  suggested_weight?: number;
  suggested_reps?: number;
  suggested_sets?: number;
  confidence: number;
  reasoning: string;
  based_on_sessions: number;
}

export interface ProgressAnalytics {
  total_exercises_tracked: number;
  total_personal_records: number;
  recent_prs: PersonalRecord[];
  strongest_exercises: Array<{
    exercise_id: string;
    exercise_name: string;
    relative_strength: number;
    percentile: number;
  }>;
  improvement_areas: Array<{
    exercise_id: string;
    exercise_name: string;
    stagnation_days: number;
    suggested_action: string;
  }>;
  volume_trends: Array<{
    date: string;
    total_volume: number;
    exercise_count: number;
  }>;
}

export class ExercisePerformanceService {
  private static instance: ExercisePerformanceService;
  private performanceCache: Map<string, ExercisePerformance[]> = new Map();
  private prCache: Map<string, PersonalRecord[]> = new Map();

  private constructor() {}

  public static getInstance(): ExercisePerformanceService {
    if (!ExercisePerformanceService.instance) {
      ExercisePerformanceService.instance = new ExercisePerformanceService();
    }
    return ExercisePerformanceService.instance;
  }

  // ============================================================================
  // Performance Recording
  // ============================================================================

  async recordExercisePerformance(
    userId: string,
    exerciseId: string,
    workoutSessionId: string,
    setsData: SetData[]
  ): Promise<ExercisePerformance> {
    try {
      logger.info('Recording exercise performance', { userId, exerciseId, workoutSessionId });

      // Calculate performance metrics
      const completedSets = setsData.filter(set => set.completed);
      const maxWeight = Math.max(...completedSets.map(set => set.weight || 0));
      const totalVolume = completedSets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
      const totalReps = completedSets.reduce((sum, set) => sum + (set.reps || 0), 0);
      const oneRepMax = this.calculateOneRepMax(maxWeight, Math.max(...completedSets.map(set => set.reps || 0)));

      // Check for personal records
      const prChecks = await this.checkForPersonalRecords(userId, exerciseId, {
        maxWeight,
        totalVolume,
        totalReps,
        oneRepMax
      });

      // Create performance record
      const performance: ExercisePerformance = {
        id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        exercise_id: exerciseId,
        workout_session_id: workoutSessionId,
        sets_data: setsData,
        max_weight: maxWeight,
        total_volume: totalVolume,
        total_reps: totalReps,
        one_rep_max: oneRepMax,
        is_pr_weight: prChecks.isWeightPR,
        is_pr_volume: prChecks.isVolumePR,
        is_pr_reps: prChecks.isRepsPR,
        performed_at: new Date()
      };

      // Save to local database
      await this.savePerformanceLocally(performance);

      // Sync to Supabase if online
      if (navigator.onLine) {
        await this.syncPerformanceToSupabase(performance);
      }

      // Update cache
      this.updatePerformanceCache(userId, performance);

      // Record personal records if any
      if (prChecks.personalRecords.length > 0) {
        await this.recordPersonalRecords(prChecks.personalRecords);
      }

      logger.info('Exercise performance recorded successfully', {
        performanceId: performance.id,
        maxWeight,
        totalVolume,
        personalRecords: prChecks.personalRecords.length
      });

      return performance;

    } catch (error) {
      logger.error('Error recording exercise performance', { error, userId, exerciseId });
      throw error;
    }
  }

  async recordWorkoutPerformances(userId: string, workout: Workout): Promise<ExercisePerformance[]> {
    const performances: ExercisePerformance[] = [];

    for (const exercise of workout.exercises) {
      try {
        const performance = await this.recordExercisePerformance(
          userId,
          exercise.exercise_id,
          workout.id,
          exercise.sets
        );
        performances.push(performance);
      } catch (error) {
        logger.error('Error recording performance for exercise', { 
          error, 
          exerciseId: exercise.exercise_id 
        });
      }
    }

    return performances;
  }

  // ============================================================================
  // Personal Records Management
  // ============================================================================

  private async checkForPersonalRecords(
    userId: string,
    exerciseId: string,
    metrics: {
      maxWeight: number;
      totalVolume: number;
      totalReps: number;
      oneRepMax: number;
    }
  ): Promise<{
    isWeightPR: boolean;
    isVolumePR: boolean;
    isRepsPR: boolean;
    personalRecords: Omit<PersonalRecord, 'id'>[];
  }> {
    try {
      // Get previous best performances
      const previousBests = await this.getPreviousBestPerformances(userId, exerciseId);
      
      const personalRecords: Omit<PersonalRecord, 'id'>[] = [];
      let isWeightPR = false;
      let isVolumePR = false;
      let isRepsPR = false;

      // Check weight PR
      if (metrics.maxWeight > (previousBests.maxWeight || 0)) {
        isWeightPR = true;
        personalRecords.push({
          exercise_id: exerciseId,
          exercise_name: await this.getExerciseName(exerciseId),
          type: 'weight',
          value: metrics.maxWeight,
          previous_value: previousBests.maxWeight || 0,
          improvement: metrics.maxWeight - (previousBests.maxWeight || 0),
          improvement_percentage: previousBests.maxWeight 
            ? ((metrics.maxWeight - previousBests.maxWeight) / previousBests.maxWeight) * 100 
            : 100,
          achieved_at: new Date(),
          workout_session_id: '', // Will be set by caller
        });
      }

      // Check volume PR
      if (metrics.totalVolume > (previousBests.totalVolume || 0)) {
        isVolumePR = true;
        personalRecords.push({
          exercise_id: exerciseId,
          exercise_name: await this.getExerciseName(exerciseId),
          type: 'volume',
          value: metrics.totalVolume,
          previous_value: previousBests.totalVolume || 0,
          improvement: metrics.totalVolume - (previousBests.totalVolume || 0),
          improvement_percentage: previousBests.totalVolume 
            ? ((metrics.totalVolume - previousBests.totalVolume) / previousBests.totalVolume) * 100 
            : 100,
          achieved_at: new Date(),
          workout_session_id: '',
        });
      }

      // Check reps PR
      if (metrics.totalReps > (previousBests.totalReps || 0)) {
        isRepsPR = true;
        personalRecords.push({
          exercise_id: exerciseId,
          exercise_name: await this.getExerciseName(exerciseId),
          type: 'reps',
          value: metrics.totalReps,
          previous_value: previousBests.totalReps || 0,
          improvement: metrics.totalReps - (previousBests.totalReps || 0),
          improvement_percentage: previousBests.totalReps 
            ? ((metrics.totalReps - previousBests.totalReps) / previousBests.totalReps) * 100 
            : 100,
          achieved_at: new Date(),
          workout_session_id: '',
        });
      }

      // Check one rep max PR
      if (metrics.oneRepMax > (previousBests.oneRepMax || 0)) {
        personalRecords.push({
          exercise_id: exerciseId,
          exercise_name: await this.getExerciseName(exerciseId),
          type: 'one_rep_max',
          value: metrics.oneRepMax,
          previous_value: previousBests.oneRepMax || 0,
          improvement: metrics.oneRepMax - (previousBests.oneRepMax || 0),
          improvement_percentage: previousBests.oneRepMax 
            ? ((metrics.oneRepMax - previousBests.oneRepMax) / previousBests.oneRepMax) * 100 
            : 100,
          achieved_at: new Date(),
          workout_session_id: '',
        });
      }

      return {
        isWeightPR,
        isVolumePR,
        isRepsPR,
        personalRecords
      };

    } catch (error) {
      logger.error('Error checking for personal records', { error, userId, exerciseId });
      return {
        isWeightPR: false,
        isVolumePR: false,
        isRepsPR: false,
        personalRecords: []
      };
    }
  }

  private async getPreviousBestPerformances(userId: string, exerciseId: string): Promise<{
    maxWeight: number;
    totalVolume: number;
    totalReps: number;
    oneRepMax: number;
  }> {
    try {
      // Try to get from Supabase first
      if (navigator.onLine) {
        const { data, error } = await supabaseService.supabase
          .from('exercise_performances')
          .select('max_weight, total_volume, total_reps, one_rep_max')
          .eq('user_id', userId)
          .eq('exercise_id', exerciseId)
          .order('performed_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return {
            maxWeight: Math.max(...data.map(p => p.max_weight || 0)),
            totalVolume: Math.max(...data.map(p => p.total_volume || 0)),
            totalReps: Math.max(...data.map(p => p.total_reps || 0)),
            oneRepMax: Math.max(...data.map(p => p.one_rep_max || 0))
          };
        }
      }

      // Fallback to local data
      await dbManager.init();
      const localPerformances = await dbManager.getAll<ExercisePerformance>('exercisePerformances');
      const userExercisePerformances = localPerformances.filter(
        p => p.user_id === userId && p.exercise_id === exerciseId
      );

      if (userExercisePerformances.length === 0) {
        return { maxWeight: 0, totalVolume: 0, totalReps: 0, oneRepMax: 0 };
      }

      return {
        maxWeight: Math.max(...userExercisePerformances.map(p => p.max_weight)),
        totalVolume: Math.max(...userExercisePerformances.map(p => p.total_volume)),
        totalReps: Math.max(...userExercisePerformances.map(p => p.total_reps)),
        oneRepMax: Math.max(...userExercisePerformances.map(p => p.one_rep_max))
      };

    } catch (error) {
      logger.error('Error getting previous best performances', { error, userId, exerciseId });
      return { maxWeight: 0, totalVolume: 0, totalReps: 0, oneRepMax: 0 };
    }
  }

  private async recordPersonalRecords(personalRecords: Omit<PersonalRecord, 'id'>[]): Promise<void> {
    for (const pr of personalRecords) {
      try {
        const personalRecord: PersonalRecord = {
          ...pr,
          id: `pr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        // Save locally
        await dbManager.init();
        await dbManager.put('personalRecords', personalRecord);

        // Sync to Supabase if online
        if (navigator.onLine) {
          // Personal records would be stored in a separate table or as part of user achievements
          logger.info('Personal record achieved', {
            exerciseId: pr.exercise_id,
            type: pr.type,
            value: pr.value,
            improvement: pr.improvement
          });
        }

      } catch (error) {
        logger.error('Error recording personal record', { error, pr });
      }
    }
  }

  // ============================================================================
  // Progress Analytics
  // ============================================================================

  async getExerciseProgress(userId: string, exerciseId: string): Promise<ExerciseProgress | null> {
    try {
      const performances = await this.getUserExercisePerformances(userId, exerciseId);
      
      if (performances.length === 0) {
        return null;
      }

      const exerciseName = await this.getExerciseName(exerciseId);
      const personalRecords = await this.getExercisePersonalRecords(userId, exerciseId);

      // Calculate aggregated metrics
      const totalVolume = performances.reduce((sum, p) => sum + p.total_volume, 0);
      const totalReps = performances.reduce((sum, p) => sum + p.total_reps, 0);
      const totalSets = performances.reduce((sum, p) => sum + p.sets_data.filter(s => s.completed).length, 0);

      // Get current bests
      const currentMaxWeight = Math.max(...performances.map(p => p.max_weight));
      const currentOneRepMax = Math.max(...performances.map(p => p.one_rep_max));

      // Analyze progress trend
      const progressTrend = this.analyzeProgressTrend(performances);

      // Get recent performances (last 10)
      const recentPerformances = performances
        .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
        .slice(0, 10);

      return {
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        first_performed: new Date(Math.min(...performances.map(p => new Date(p.performed_at).getTime()))),
        last_performed: new Date(Math.max(...performances.map(p => new Date(p.performed_at).getTime()))),
        total_sessions: performances.length,
        total_volume,
        total_reps,
        total_sets,
        current_max_weight: currentMaxWeight,
        current_one_rep_max: currentOneRepMax,
        progress_trend: progressTrend,
        recent_performances: recentPerformances,
        personal_records: personalRecords
      };

    } catch (error) {
      logger.error('Error getting exercise progress', { error, userId, exerciseId });
      return null;
    }
  }

  async getUserProgressAnalytics(userId: string, daysBack: number = 90): Promise<ProgressAnalytics> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      // Get all user performances
      const allPerformances = await this.getAllUserPerformances(userId);
      const recentPerformances = allPerformances.filter(
        p => new Date(p.performed_at) >= cutoffDate
      );

      // Get all personal records
      const allPersonalRecords = await this.getAllUserPersonalRecords(userId);
      const recentPRs = allPersonalRecords
        .filter(pr => new Date(pr.achieved_at) >= cutoffDate)
        .sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime())
        .slice(0, 10);

      // Calculate strongest exercises (by relative strength/percentile)
      const strongestExercises = await this.calculateStrongestExercises(userId, recentPerformances);

      // Identify improvement areas (exercises with stagnation)
      const improvementAreas = await this.identifyImprovementAreas(userId, allPerformances);

      // Calculate volume trends
      const volumeTrends = this.calculateVolumeTrends(recentPerformances, daysBack);

      // Get unique exercises tracked
      const uniqueExercises = new Set(allPerformances.map(p => p.exercise_id));

      return {
        total_exercises_tracked: uniqueExercises.size,
        total_personal_records: allPersonalRecords.length,
        recent_prs: recentPRs,
        strongest_exercises: strongestExercises,
        improvement_areas: improvementAreas,
        volume_trends: volumeTrends
      };

    } catch (error) {
      logger.error('Error getting user progress analytics', { error, userId });
      return {
        total_exercises_tracked: 0,
        total_personal_records: 0,
        recent_prs: [],
        strongest_exercises: [],
        improvement_areas: [],
        volume_trends: []
      };
    }
  }

  // ============================================================================
  // Exercise Recommendations
  // ============================================================================

  async getExerciseRecommendations(userId: string, exerciseId: string): Promise<ExerciseRecommendation[]> {
    try {
      const progress = await this.getExerciseProgress(userId, exerciseId);
      
      if (!progress || progress.recent_performances.length < 3) {
        return [];
      }

      const recommendations: ExerciseRecommendation[] = [];
      const exerciseName = progress.exercise_name;

      // Analyze recent performance trend
      const recentPerfs = progress.recent_performances.slice(0, 5);
      const avgRecentWeight = recentPerfs.reduce((sum, p) => sum + p.max_weight, 0) / recentPerfs.length;
      const avgRecentVolume = recentPerfs.reduce((sum, p) => sum + p.total_volume, 0) / recentPerfs.length;

      // Weight progression recommendation
      if (progress.progress_trend === 'stable' || progress.progress_trend === 'improving') {
        const daysSinceLastPR = this.getDaysSinceLastPR(progress.personal_records, 'weight');
        
        if (daysSinceLastPR > 14) { // No weight PR in 2 weeks
          const suggestedIncrease = this.calculateWeightIncrease(avgRecentWeight);
          recommendations.push({
            exercise_id: exerciseId,
            exercise_name: exerciseName,
            recommendation_type: 'weight_increase',
            suggested_weight: avgRecentWeight + suggestedIncrease,
            confidence: 0.8,
            reasoning: `You've been consistent at ${avgRecentWeight}kg. Try increasing by ${suggestedIncrease}kg.`,
            based_on_sessions: recentPerfs.length
          });
        }
      }

      // Volume recommendation
      if (progress.progress_trend === 'stable') {
        const daysSinceLastVolumePR = this.getDaysSinceLastPR(progress.personal_records, 'volume');
        
        if (daysSinceLastVolumePR > 21) { // No volume PR in 3 weeks
          recommendations.push({
            exercise_id: exerciseId,
            exercise_name: exerciseName,
            recommendation_type: 'volume_increase',
            suggested_sets: Math.ceil(avgRecentVolume / avgRecentWeight / 8) + 1, // Add one set
            confidence: 0.7,
            reasoning: 'Consider adding an extra set to increase training volume.',
            based_on_sessions: recentPerfs.length
          });
        }
      }

      // Deload recommendation
      if (progress.progress_trend === 'declining') {
        recommendations.push({
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          recommendation_type: 'deload',
          suggested_weight: avgRecentWeight * 0.9, // 10% deload
          confidence: 0.9,
          reasoning: 'Performance has been declining. Consider a deload week.',
          based_on_sessions: recentPerfs.length
        });
      }

      // Rest recommendation
      const daysSinceLastSession = Math.floor(
        (Date.now() - new Date(progress.last_performed).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastSession > 7) {
        recommendations.push({
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          recommendation_type: 'rest_needed',
          confidence: 0.6,
          reasoning: `It's been ${daysSinceLastSession} days since your last session. Consider getting back to training.`,
          based_on_sessions: progress.total_sessions
        });
      }

      return recommendations;

    } catch (error) {
      logger.error('Error getting exercise recommendations', { error, userId, exerciseId });
      return [];
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private calculateOneRepMax(weight: number, reps: number): number {
    if (reps === 1) return weight;
    if (reps === 0 || weight === 0) return 0;
    
    // Using Brzycki formula: 1RM = weight / (1.0278 - 0.0278 × reps)
    return Math.round(weight / (1.0278 - 0.0278 * reps));
  }

  private analyzeProgressTrend(performances: ExercisePerformance[]): 'improving' | 'stable' | 'declining' {
    if (performances.length < 3) return 'stable';

    // Sort by date
    const sortedPerfs = performances.sort(
      (a, b) => new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime()
    );

    // Compare recent vs older performances
    const recentCount = Math.min(3, Math.floor(sortedPerfs.length / 3));
    const recent = sortedPerfs.slice(-recentCount);
    const older = sortedPerfs.slice(0, recentCount);

    const recentAvgWeight = recent.reduce((sum, p) => sum + p.max_weight, 0) / recent.length;
    const olderAvgWeight = older.reduce((sum, p) => sum + p.max_weight, 0) / older.length;

    const improvement = (recentAvgWeight - olderAvgWeight) / olderAvgWeight;

    if (improvement > 0.05) return 'improving'; // 5% improvement
    if (improvement < -0.05) return 'declining'; // 5% decline
    return 'stable';
  }

  private getDaysSinceLastPR(personalRecords: PersonalRecord[], type: string): number {
    const prsOfType = personalRecords.filter(pr => pr.type === type);
    if (prsOfType.length === 0) return Infinity;

    const lastPR = prsOfType.sort(
      (a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime()
    )[0];

    return Math.floor((Date.now() - new Date(lastPR.achieved_at).getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateWeightIncrease(currentWeight: number): number {
    // Progressive overload recommendations
    if (currentWeight < 50) return 2.5; // 2.5kg for lighter weights
    if (currentWeight < 100) return 5;   // 5kg for moderate weights
    return 10; // 10kg for heavier weights
  }

  private calculateVolumeTrends(performances: ExercisePerformance[], daysBack: number): Array<{
    date: string;
    total_volume: number;
    exercise_count: number;
  }> {
    const trends: Record<string, { total_volume: number; exercise_count: number }> = {};

    performances.forEach(perf => {
      const date = new Date(perf.performed_at).toISOString().split('T')[0];
      if (!trends[date]) {
        trends[date] = { total_volume: 0, exercise_count: 0 };
      }
      trends[date].total_volume += perf.total_volume;
      trends[date].exercise_count += 1;
    });

    return Object.entries(trends)
      .map(([date, data]) => ({
        date,
        total_volume: data.total_volume,
        exercise_count: data.exercise_count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async calculateStrongestExercises(
    userId: string, 
    performances: ExercisePerformance[]
  ): Promise<Array<{
    exercise_id: string;
    exercise_name: string;
    relative_strength: number;
    percentile: number;
  }>> {
    // This would typically compare against population data
    // For now, we'll use a simplified calculation based on user's own data
    const exerciseStrengths: Record<string, { maxWeight: number; avgWeight: number }> = {};

    performances.forEach(perf => {
      if (!exerciseStrengths[perf.exercise_id]) {
        exerciseStrengths[perf.exercise_id] = { maxWeight: 0, avgWeight: 0 };
      }
      exerciseStrengths[perf.exercise_id].maxWeight = Math.max(
        exerciseStrengths[perf.exercise_id].maxWeight,
        perf.max_weight
      );
    });

    // Calculate average for each exercise
    Object.keys(exerciseStrengths).forEach(exerciseId => {
      const exercisePerfs = performances.filter(p => p.exercise_id === exerciseId);
      exerciseStrengths[exerciseId].avgWeight = 
        exercisePerfs.reduce((sum, p) => sum + p.max_weight, 0) / exercisePerfs.length;
    });

    // Convert to array and sort by max weight
    const strongest = await Promise.all(
      Object.entries(exerciseStrengths)
        .sort(([,a], [,b]) => b.maxWeight - a.maxWeight)
        .slice(0, 5)
        .map(async ([exerciseId, data]) => ({
          exercise_id: exerciseId,
          exercise_name: await this.getExerciseName(exerciseId),
          relative_strength: data.maxWeight,
          percentile: 85 // Placeholder - would calculate against population data
        }))
    );

    return strongest;
  }

  private async identifyImprovementAreas(
    userId: string, 
    performances: ExercisePerformance[]
  ): Promise<Array<{
    exercise_id: string;
    exercise_name: string;
    stagnation_days: number;
    suggested_action: string;
  }>> {
    const exerciseLastImprovement: Record<string, Date> = {};

    // Find last improvement for each exercise
    performances.forEach(perf => {
      if (perf.is_pr_weight || perf.is_pr_volume || perf.is_pr_reps) {
        const currentLast = exerciseLastImprovement[perf.exercise_id];
        const perfDate = new Date(perf.performed_at);
        
        if (!currentLast || perfDate > currentLast) {
          exerciseLastImprovement[perf.exercise_id] = perfDate;
        }
      }
    });

    // Calculate stagnation and suggest actions
    const improvementAreas = await Promise.all(
      Object.entries(exerciseLastImprovement)
        .map(async ([exerciseId, lastImprovement]) => {
          const stagnationDays = Math.floor(
            (Date.now() - lastImprovement.getTime()) / (1000 * 60 * 60 * 24)
          );

          let suggestedAction = 'Continue current training';
          if (stagnationDays > 30) {
            suggestedAction = 'Consider changing rep ranges or adding volume';
          }
          if (stagnationDays > 60) {
            suggestedAction = 'Try a deload week or technique focus';
          }

          return {
            exercise_id: exerciseId,
            exercise_name: await this.getExerciseName(exerciseId),
            stagnation_days: stagnationDays,
            suggested_action: suggestedAction
          };
        })
    );

    return improvementAreas
      .filter(area => area.stagnation_days > 21) // Only show if stagnant for 3+ weeks
      .sort((a, b) => b.stagnation_days - a.stagnation_days)
      .slice(0, 5);
  }

  // ============================================================================
  // Data Access Methods
  // ============================================================================

  private async getUserExercisePerformances(userId: string, exerciseId: string): Promise<ExercisePerformance[]> {
    try {
      // Try Supabase first
      if (navigator.onLine) {
        const { data, error } = await supabaseService.supabase
          .from('exercise_performances')
          .select('*')
          .eq('user_id', userId)
          .eq('exercise_id', exerciseId)
          .order('performed_at', { ascending: false });

        if (!error && data) {
          return data.map(this.convertSupabasePerformance);
        }
      }

      // Fallback to local data
      await dbManager.init();
      const allPerformances = await dbManager.getAll<ExercisePerformance>('exercisePerformances');
      return allPerformances.filter(p => p.user_id === userId && p.exercise_id === exerciseId);

    } catch (error) {
      logger.error('Error getting user exercise performances', { error, userId, exerciseId });
      return [];
    }
  }

  private async getAllUserPerformances(userId: string): Promise<ExercisePerformance[]> {
    try {
      // Try Supabase first
      if (navigator.onLine) {
        const { data, error } = await supabaseService.supabase
          .from('exercise_performances')
          .select('*')
          .eq('user_id', userId)
          .order('performed_at', { ascending: false });

        if (!error && data) {
          return data.map(this.convertSupabasePerformance);
        }
      }

      // Fallback to local data
      await dbManager.init();
      const allPerformances = await dbManager.getAll<ExercisePerformance>('exercisePerformances');
      return allPerformances.filter(p => p.user_id === userId);

    } catch (error) {
      logger.error('Error getting all user performances', { error, userId });
      return [];
    }
  }

  private async getExercisePersonalRecords(userId: string, exerciseId: string): Promise<PersonalRecord[]> {
    try {
      await dbManager.init();
      const allPRs = await dbManager.getAll<PersonalRecord>('personalRecords');
      return allPRs.filter(pr => pr.exercise_id === exerciseId);
    } catch (error) {
      logger.error('Error getting exercise personal records', { error, userId, exerciseId });
      return [];
    }
  }

  private async getAllUserPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    try {
      await dbManager.init();
      const allPRs = await dbManager.getAll<PersonalRecord>('personalRecords');
      return allPRs; // Would filter by user_id if stored in PR records
    } catch (error) {
      logger.error('Error getting all user personal records', { error, userId });
      return [];
    }
  }

  private async getExerciseName(exerciseId: string): Promise<string> {
    // This would typically fetch from exercises table
    // For now, return the ID as name
    return exerciseId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // ============================================================================
  // Storage Methods
  // ============================================================================

  private async savePerformanceLocally(performance: ExercisePerformance): Promise<void> {
    try {
      await dbManager.init();
      await dbManager.put('exercisePerformances', performance);
    } catch (error) {
      logger.error('Error saving performance locally', { error, performanceId: performance.id });
    }
  }

  private async syncPerformanceToSupabase(performance: ExercisePerformance): Promise<void> {
    try {
      const supabasePerformance = this.convertToSupabasePerformance(performance);
      
      const { error } = await supabaseService.supabase
        .from('exercise_performances')
        .upsert(supabasePerformance);

      if (error) {
        throw error;
      }

      logger.info('Performance synced to Supabase', { performanceId: performance.id });

    } catch (error) {
      logger.error('Error syncing performance to Supabase', { error, performanceId: performance.id });
    }
  }

  private convertToSupabasePerformance(performance: ExercisePerformance): any {
    return {
      id: performance.id,
      user_id: performance.user_id,
      exercise_id: performance.exercise_id,
      workout_session_id: performance.workout_session_id,
      sets_data: performance.sets_data,
      max_weight: performance.max_weight,
      total_volume: performance.total_volume,
      total_reps: performance.total_reps,
      one_rep_max: performance.one_rep_max,
      is_pr_weight: performance.is_pr_weight,
      is_pr_volume: performance.is_pr_volume,
      is_pr_reps: performance.is_pr_reps,
      performed_at: performance.performed_at.toISOString()
    };
  }

  private convertSupabasePerformance(supabasePerformance: any): ExercisePerformance {
    return {
      id: supabasePerformance.id,
      user_id: supabasePerformance.user_id,
      exercise_id: supabasePerformance.exercise_id,
      workout_session_id: supabasePerformance.workout_session_id,
      sets_data: supabasePerformance.sets_data,
      max_weight: supabasePerformance.max_weight,
      total_volume: supabasePerformance.total_volume,
      total_reps: supabasePerformance.total_reps,
      one_rep_max: supabasePerformance.one_rep_max,
      is_pr_weight: supabasePerformance.is_pr_weight,
      is_pr_volume: supabasePerformance.is_pr_volume,
      is_pr_reps: supabasePerformance.is_pr_reps,
      performed_at: new Date(supabasePerformance.performed_at)
    };
  }

  private updatePerformanceCache(userId: string, performance: ExercisePerformance): void {
    const cacheKey = `${userId}-${performance.exercise_id}`;
    const cached = this.performanceCache.get(cacheKey) || [];
    cached.unshift(performance);
    
    // Keep only last 50 performances per exercise
    if (cached.length > 50) {
      cached.splice(50);
    }
    
    this.performanceCache.set(cacheKey, cached);
  }

  // ============================================================================
  // Public API
  // ============================================================================

  async getPersonalRecords(userId: string, exerciseId?: string): Promise<PersonalRecord[]> {
    if (exerciseId) {
      return this.getExercisePersonalRecords(userId, exerciseId);
    }
    return this.getAllUserPersonalRecords(userId);
  }

  async getRecentPersonalRecords(userId: string, limit: number = 10): Promise<PersonalRecord[]> {
    const allPRs = await this.getAllUserPersonalRecords(userId);
    return allPRs
      .sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime())
      .slice(0, limit);
  }

  clearCache(): void {
    this.performanceCache.clear();
    this.prCache.clear();
  }
}

export const exercisePerformanceService = ExercisePerformanceService.getInstance();