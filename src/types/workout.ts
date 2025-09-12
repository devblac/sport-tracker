/**
 * Workout Types
 * 
 * Type definitions for workout-related data structures.
 */

export type SetType = 
  | 'normal'
  | 'warmup'
  | 'failure'
  | 'dropset'
  | 'restpause'
  | 'cluster'
  | 'myorep'
  | 'amrap'
  | 'tempo'
  | 'isometric';

export interface SetData {
  id?: string;
  set_number?: number;
  type: SetType;
  
  // Performance data
  weight: number;
  reps: number;
  distance?: number; // For cardio exercises (meters)
  duration?: number; // For time-based exercises (seconds)
  
  // Subjective measures
  rpe?: number; // Rate of Perceived Exertion (1-10)
  
  // Set status
  completed: boolean;
  completed_at?: Date;
  skipped?: boolean;
  
  // Rest and timing
  rest_time?: number; // Actual rest taken (seconds)
  planned_rest_time?: number; // Planned rest (seconds)
  
  // Additional data for special set types
  drop_weight?: number; // For dropsets
  cluster_reps?: number[]; // For cluster sets
  tempo?: string; // Tempo notation (e.g., "3-1-2-1")
  hold_duration?: number; // For isometric sets (seconds)
  
  // Notes and feedback
  notes?: string;
  
  // Performance tracking
  isPersonalRecord?: boolean;
  estimated_1rm?: number;
  volume?: number; // weight * reps
}

export interface WorkoutExercise {
  exercise_id: string;
  exercise_name?: string;
  order: number;
  sets: SetData[];
  rest_time: number; // Default rest time between sets
  notes?: string;
  
  // Exercise configuration
  target_sets?: number;
  target_reps?: number;
  target_weight?: number;
  
  // Supersets and circuits
  superset_id?: string;
  circuit_id?: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  exercises: WorkoutExercise[];
  
  // Template information
  is_template: boolean;
  is_completed: boolean;
  template_id?: string; // If created from template
  
  // Timing
  started_at?: Date;
  completed_at?: Date;
  duration?: number; // Total workout duration in minutes
  
  // Performance metrics
  total_volume: number; // Total weight lifted
  total_sets: number;
  total_reps: number;
  
  // Metadata
  notes?: string;
  tags?: string[];
  difficulty_rating?: number; // 1-10 subjective difficulty
  
  // Workout type and categorization
  workout_type?: 'strength' | 'cardio' | 'hybrid' | 'flexibility' | 'sports';
  muscle_groups?: string[];
  equipment_used?: string[];
  
  // Social and sharing
  is_public?: boolean;
  shared_count?: number;
  
  // Tracking
  created_at: Date;
  updated_at: Date;
}

export interface WorkoutTemplate extends Omit<Workout, 'is_completed' | 'started_at' | 'completed_at' | 'duration' | 'total_volume' | 'total_sets' | 'total_reps'> {
  is_template: true;
  
  // Template-specific fields
  description?: string;
  estimated_duration?: number; // Estimated workout duration in minutes
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  
  // Usage statistics
  times_used?: number;
  average_rating?: number;
  
  // Template categorization
  category?: 'strength' | 'hypertrophy' | 'powerlifting' | 'bodybuilding' | 'crossfit' | 'cardio' | 'flexibility';
  program_name?: string; // If part of a training program
}

export interface WorkoutSummary {
  workout_id: string;
  workout_name: string;
  completed_at: Date;
  duration: number;
  
  // Performance summary
  total_volume: number;
  total_sets: number;
  total_reps: number;
  exercises_completed: number;
  
  // Personal records
  personal_records: Array<{
    exercise_id: string;
    exercise_name: string;
    record_type: '1rm' | 'volume' | 'reps' | 'duration';
    previous_value: number;
    new_value: number;
    improvement_percentage: number;
  }>;
  
  // Achievements unlocked
  achievements_unlocked: string[];
  
  // XP and gamification
  xp_earned: number;
  level_ups: number;
  
  // Social metrics
  share_count: number;
  likes_received: number;
}

export interface WorkoutStats {
  // Volume progression
  total_volume_lifted: number;
  volume_this_week: number;
  volume_this_month: number;
  volume_trend: 'increasing' | 'decreasing' | 'stable';
  
  // Frequency
  workouts_this_week: number;
  workouts_this_month: number;
  average_workouts_per_week: number;
  
  // Personal records
  total_personal_records: number;
  recent_personal_records: number; // Last 30 days
  
  // Consistency
  current_streak: number;
  longest_streak: number;
  consistency_percentage: number; // Based on planned vs actual workouts
  
  // Performance metrics
  average_workout_duration: number;
  average_sets_per_workout: number;
  average_reps_per_set: number;
  
  // Strength progression
  strength_score: number; // Calculated based on major lifts
  strength_trend: 'increasing' | 'decreasing' | 'stable';
}

export type WorkoutStatus = 'not_started' | 'in_progress' | 'paused' | 'completed' | 'cancelled';

export interface ActiveWorkout extends Workout {
  status: WorkoutStatus;
  current_exercise_index: number;
  current_set_index: number;
  rest_timer?: {
    start_time: Date;
    duration: number; // seconds
    is_active: boolean;
  };
  
  // Auto-save data
  last_saved_at: Date;
  auto_save_interval: number; // seconds
}