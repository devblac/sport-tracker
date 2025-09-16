// Analytics types for fitness tracking and performance metrics

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'max_1rm' | 'best_time';
  value: number;
  unit: string;
  achieved_at: Date;
  workout_id?: string;
  previous_record?: number;
  improvement_percentage?: number;
}

export interface WorkoutAnalytics {
  total_workouts: number;
  total_volume_kg: number;
  total_duration_minutes: number;
  average_workout_duration: number;
  workouts_this_week: number;
  workouts_this_month: number;
  unique_exercises: number;
  muscle_groups_this_week: number;
  consistency_score: number;
  improvement_rate: number;
}

export interface ExerciseAnalytics {
  exercise_id: string;
  exercise_name: string;
  total_sets: number;
  total_reps: number;
  total_volume_kg: number;
  max_weight: number;
  average_weight: number;
  frequency_per_week: number;
  last_performed: Date;
  progression_trend: 'improving' | 'stable' | 'declining';
}

export interface PerformanceMetrics {
  strength_score: number;
  endurance_score: number;
  consistency_score: number;
  volume_trend: 'increasing' | 'stable' | 'decreasing';
  intensity_trend: 'increasing' | 'stable' | 'decreasing';
  recovery_score: number;
}

export interface ProgressSnapshot {
  date: Date;
  total_workouts: number;
  total_volume_kg: number;
  body_weight?: number;
  strength_level: number;
  endurance_level: number;
  personal_records_count: number;
}

export interface ComparisonMetrics {
  period: 'week' | 'month' | 'quarter' | 'year';
  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface AnalyticsTimeframe {
  start_date: Date;
  end_date: Date;
  period_type: 'week' | 'month' | 'quarter' | 'year' | 'custom';
}