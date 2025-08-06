/**
 * Supabase Percentile Service
 * 
 * Client-side service that interacts with Supabase for percentile data.
 * Uses cached daily calculations instead of real-time computation.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Workout, WorkoutExercise } from '../types/workoutModels';
import { User } from '../types/userModels';
import { Exercise } from '../types/exerciseModels';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface SupabasePercentileResult {
  user_id: string;
  exercise_id: string;
  segment_id: number;
  metric_type: 'weight' | 'oneRM' | 'volume' | 'relative_strength';
  percentile_value: number;
  rank_position: number;
  total_users: number;
  user_value: number;
  is_personal_best: boolean;
  calculated_at: string;
  segment?: {
    name: string;
    description: string;
  };
}

export interface ExerciseStatistics {
  exercise_id: string;
  segment_id: number;
  metric_type: string;
  total_users: number;
  average_value: number;
  median_value: number;
  top_performance: number;
  percentile_95: number;
  percentile_75: number;
  percentile_50: number;
  percentile_25: number;
  calculated_at: string;
}

export interface UserPerformanceData {
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  estimated_one_rm: number;
  body_weight: number;
  workout_date: string;
  user_age: number;
  user_gender: string;
  user_weight: number;
  experience_level: string;
}

export class SupabasePercentileService {
  private supabase: SupabaseClient;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Submit workout data to Supabase for percentile calculation
   */
  async submitWorkoutData(
    workout: Workout,
    exercises: Exercise[],
    user: User
  ): Promise<void> {
    if (!user.profile) {
      throw new Error('User profile is required for percentile calculations');
    }

    const performanceData: UserPerformanceData[] = [];

    for (const workoutExercise of workout.exercises) {
      const exercise = exercises.find(e => e.id === workoutExercise.exerciseId);
      if (!exercise || !workoutExercise.sets || workoutExercise.sets.length === 0) {
        continue;
      }

      // Find the best set (highest estimated 1RM)
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
        user_id: user.id,
        exercise_id: workoutExercise.exerciseId,
        exercise_name: exercise.name,
        weight: bestSet.weight,
        reps: bestSet.reps,
        estimated_one_rm: estimatedOneRM,
        body_weight: user.profile.weight || 70,
        workout_date: (workout.completedAt || new Date()).toISOString().split('T')[0],
        user_age: user.profile.age || 25,
        user_gender: user.profile.gender || 'other',
        user_weight: user.profile.weight || 70,
        experience_level: this.determineExperienceLevel(user.profile.totalWorkouts || 0)
      });
    }

    if (performanceData.length === 0) return;

    // Insert performance data
    const { error } = await this.supabase
      .from('user_performances')
      .insert(performanceData);

    if (error) {
      console.error('Failed to submit workout data:', error);
      throw error;
    }

    // Clear cache for affected exercises
    performanceData.forEach(data => {
      this.clearCacheForExercise(data.exercise_id);
    });
  }

  /**
   * Get user's percentiles for a specific exercise
   */
  async getUserExercisePercentiles(
    userId: string,
    exerciseId: string
  ): Promise<SupabasePercentileResult[]> {
    const cacheKey = `percentiles_${userId}_${exerciseId}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from('user_percentiles')
      .select(`
        *,
        segment:percentile_segments(name, description)
      `)
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .order('metric_type');

    if (error) {
      console.error('Failed to fetch user percentiles:', error);
      return [];
    }

    // Cache the result
    this.setCache(cacheKey, data || []);
    return data || [];
  }

  /**
   * Get exercise statistics for comparison
   */
  async getExerciseStatistics(exerciseId: string): Promise<ExerciseStatistics[]> {
    const cacheKey = `stats_${exerciseId}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from('exercise_statistics')
      .select('*')
      .eq('exercise_id', exerciseId)
      .order('segment_id');

    if (error) {
      console.error('Failed to fetch exercise statistics:', error);
      return [];
    }

    this.setCache(cacheKey, data || []);
    return data || [];
  }

  /**
   * Get top performers for an exercise in a specific segment
   */
  async getTopPerformers(
    exerciseId: string,
    segmentId: number,
    metric: string,
    limit: number = 10
  ): Promise<SupabasePercentileResult[]> {
    const cacheKey = `top_${exerciseId}_${segmentId}_${metric}_${limit}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from('user_percentiles')
      .select(`
        *,
        segment:percentile_segments(name, description)
      `)
      .eq('exercise_id', exerciseId)
      .eq('segment_id', segmentId)
      .eq('metric_type', metric)
      .order('percentile_value', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch top performers:', error);
      return [];
    }

    this.setCache(cacheKey, data || []);
    return data || [];
  }

  /**
   * Get user's overall percentile across all exercises
   */
  async getUserOverallPercentile(userId: string): Promise<{
    overallPercentile: number;
    strongestExercises: Array<{ exerciseId: string; percentile: number; metric: string }>;
    improvementAreas: Array<{ exerciseId: string; percentile: number; metric: string }>;
    totalExercises: number;
  }> {
    const cacheKey = `overall_${userId}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from('user_percentiles')
      .select('exercise_id, metric_type, percentile_value')
      .eq('user_id', userId);

    if (error || !data || data.length === 0) {
      const defaultResult = {
        overallPercentile: 50,
        strongestExercises: [],
        improvementAreas: [],
        totalExercises: 0
      };
      this.setCache(cacheKey, defaultResult);
      return defaultResult;
    }

    const allPercentiles = data.map(d => d.percentile_value);
    const overallPercentile = Math.round(
      allPercentiles.reduce((sum, p) => sum + p, 0) / allPercentiles.length
    );

    const exercisePercentiles = data.map(d => ({
      exerciseId: d.exercise_id,
      percentile: d.percentile_value,
      metric: d.metric_type
    }));

    const sorted = exercisePercentiles.sort((a, b) => b.percentile - a.percentile);

    const result = {
      overallPercentile,
      strongestExercises: sorted.slice(0, 5),
      improvementAreas: sorted.slice(-5).reverse(),
      totalExercises: new Set(data.map(d => d.exercise_id)).size
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get available demographic segments
   */
  async getSegments(): Promise<any[]> {
    const cacheKey = 'segments';
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from('percentile_segments')
      .select('*')
      .order('name');

    if (error) {
      console.error('Failed to fetch segments:', error);
      return [];
    }

    // Cache segments for longer (they rarely change)
    this.setCache(cacheKey, data || [], 24 * 60 * 60 * 1000); // 24 hours
    return data || [];
  }

  /**
   * Get the latest percentile calculation job status
   */
  async getLatestJobStatus(): Promise<any> {
    const { data, error } = await this.supabase
      .from('percentile_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Failed to fetch job status:', error);
      return null;
    }

    return data;
  }

  /**
   * Trigger manual percentile calculation (for testing or immediate updates)
   */
  async triggerPercentileCalculation(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.functions.invoke('calculate-percentiles', {
        body: { manual: true }
      });

      if (error) {
        console.error('Failed to trigger calculation:', error);
        return false;
      }

      // Clear all caches after calculation
      this.clearAllCache();
      return data?.success || false;
    } catch (error) {
      console.error('Error triggering calculation:', error);
      return false;
    }
  }

  // Private helper methods
  private determineExperienceLevel(totalWorkouts: number): string {
    if (totalWorkouts < 20) return 'beginner';
    if (totalWorkouts < 100) return 'intermediate';
    if (totalWorkouts < 300) return 'advanced';
    return 'expert';
  }

  private getFromCache(key: string): any {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  private setCache(key: string, value: any, duration: number = this.CACHE_DURATION): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + duration);
  }

  private clearCacheForExercise(exerciseId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(exerciseId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    });
  }

  private clearAllCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// Singleton instance
export const supabasePercentileService = new SupabasePercentileService();