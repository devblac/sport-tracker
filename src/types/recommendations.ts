/**
 * Recommendation System Types
 * Defines interfaces and types for the AI recommendation engine
 */

export interface WorkoutHistory {
  workout_id: string;
  date: Date;
  exercises: ExerciseHistory[];
  total_volume: number;
  duration_minutes: number;
  perceived_exertion: number; // 1-10 scale
  notes?: string;
}

export interface ExerciseHistory {
  exercise_id: string;
  exercise_name: string;
  sets: SetHistory[];
  total_volume: number;
  max_weight: number;
  total_reps: number;
  average_rpe?: number; // Rate of Perceived Exertion
}

export interface SetHistory {
  set_number: number;
  weight: number;
  reps: number;
  rpe?: number; // 1-10 scale
  rest_seconds?: number;
  completed: boolean;
  failure?: boolean;
  notes?: string;
}

export interface WeightSuggestion {
  exercise_id: string;
  exercise_name: string;
  suggested_weight: number;
  confidence: number; // 0-1 scale
  reasoning: string;
  progression_type: 'linear' | 'percentage' | 'deload' | 'maintain';
  alternative_weights?: {
    conservative: number;
    aggressive: number;
  };
  expected_reps?: number;
  target_rpe?: number;
}

export interface RepsSuggestion {
  exercise_id: string;
  exercise_name: string;
  weight: number;
  suggested_reps: number;
  rep_range: {
    min: number;
    max: number;
  };
  confidence: number;
  reasoning: string;
  target_rpe: number;
}

export interface PlateauDetection {
  exercise_id: string;
  exercise_name: string;
  plateau_detected: boolean;
  plateau_duration_weeks: number;
  plateau_type: 'strength' | 'volume' | 'endurance';
  last_improvement_date?: Date;
  stagnant_metric: 'max_weight' | 'total_volume' | 'max_reps';
  current_value: number;
  previous_best: number;
  confidence: number; // 0-1 scale
  suggested_interventions: PlateauIntervention[];
}

export interface PlateauIntervention {
  type: 'deload' | 'technique_focus' | 'volume_increase' | 'frequency_change' | 'exercise_variation' | 'rest_increase';
  description: string;
  duration_weeks: number;
  expected_outcome: string;
  priority: 'high' | 'medium' | 'low';
  implementation_details: string[];
}

export interface WeaknessAnalysis {
  muscle_group: string;
  weakness_score: number; // 0-1 scale (1 = most weak)
  contributing_factors: string[];
  affected_exercises: string[];
  recommended_exercises: ExerciseRecommendation[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ExerciseRecommendation {
  exercise_id: string;
  exercise_name: string;
  exercise_type: 'strength' | 'mobility' | 'corrective' | 'accessory';
  target_muscle_groups: string[];
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  equipment_needed: string[];
  recommended_sets: number;
  recommended_reps: string; // e.g., "8-12", "3x5", "AMRAP"
  frequency_per_week: number;
  reasoning: string;
  video_url?: string;
  instructions: string[];
}

export interface WorkoutRecommendation {
  workout_type: 'strength' | 'hypertrophy' | 'endurance' | 'recovery' | 'technique';
  recommended_exercises: ExerciseRecommendation[];
  estimated_duration: number; // minutes
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  focus_areas: string[];
  reasoning: string;
  optimal_timing: 'morning' | 'afternoon' | 'evening' | 'flexible';
  prerequisites?: string[];
}

export interface ProgressionRecommendation {
  exercise_id: string;
  exercise_name: string;
  current_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  next_milestone: {
    target_weight?: number;
    target_reps?: number;
    target_volume?: number;
    estimated_weeks: number;
  };
  progression_strategy: {
    type: 'linear' | 'double_progression' | 'periodized' | 'autoregulated';
    description: string;
    weekly_increases: {
      weight?: number;
      reps?: number;
      sets?: number;
    };
  };
  deload_recommendations: {
    frequency_weeks: number;
    intensity_reduction: number; // percentage
    volume_reduction: number; // percentage
  };
}

export interface RecommendationContext {
  user_id: string;
  user_demographics: {
    age: number;
    gender: 'male' | 'female' | 'other';
    experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    training_frequency: number; // days per week
    available_time: number; // minutes per session
    equipment_access: string[];
    goals: ('strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_fitness')[];
    injuries?: string[];
    preferences?: {
      exercise_types: string[];
      avoid_exercises: string[];
      preferred_rep_ranges: string[];
    };
  };
  recent_workouts: WorkoutHistory[];
  performance_trends: {
    exercise_id: string;
    trend: 'improving' | 'stagnant' | 'declining';
    trend_strength: number; // 0-1 scale
    weeks_analyzed: number;
  }[];
  recovery_status: {
    overall_fatigue: number; // 1-10 scale
    muscle_soreness: Record<string, number>; // muscle_group -> soreness level
    sleep_quality: number; // 1-10 scale
    stress_level: number; // 1-10 scale
    last_rest_day: Date;
  };
}

export interface RecommendationResult {
  weight_suggestions: WeightSuggestion[];
  reps_suggestions: RepsSuggestion[];
  plateau_detections: PlateauDetection[];
  weakness_analyses: WeaknessAnalysis[];
  workout_recommendations: WorkoutRecommendation[];
  progression_recommendations: ProgressionRecommendation[];
  general_advice: {
    priority: 'high' | 'medium' | 'low';
    category: 'training' | 'recovery' | 'nutrition' | 'technique';
    message: string;
    action_items: string[];
  }[];
  confidence_score: number; // Overall confidence in recommendations
  last_updated: Date;
}

// Algorithm configuration types
export interface AlgorithmConfig {
  weight_progression: {
    linear_increase_percentage: number;
    plateau_threshold_weeks: number;
    deload_percentage: number;
    max_weekly_increase: number;
  };
  plateau_detection: {
    minimum_data_points: number;
    stagnation_threshold_weeks: number;
    improvement_threshold_percentage: number;
    confidence_threshold: number;
  };
  weakness_analysis: {
    comparison_percentile_threshold: number;
    muscle_imbalance_threshold: number;
    exercise_frequency_weight: number;
    performance_weight: number;
  };
  recommendation_weights: {
    recent_performance: number;
    historical_trends: number;
    user_preferences: number;
    recovery_status: number;
    goal_alignment: number;
  };
}

// Machine learning model types (for future implementation)
export interface MLModelPrediction {
  model_name: string;
  prediction_type: 'weight' | 'reps' | 'volume' | 'performance';
  predicted_value: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  feature_importance: Record<string, number>;
  model_version: string;
  prediction_date: Date;
}

export interface TrainingLoad {
  date: Date;
  acute_load: number; // 7-day rolling average
  chronic_load: number; // 28-day rolling average
  acr_ratio: number; // Acute:Chronic ratio
  training_stress: number;
  recovery_score: number;
  readiness_score: number;
}

// Constants for muscle groups and exercise categories
export const MUSCLE_GROUPS = {
  CHEST: 'chest',
  BACK: 'back',
  SHOULDERS: 'shoulders',
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  FOREARMS: 'forearms',
  CORE: 'core',
  GLUTES: 'glutes',
  QUADRICEPS: 'quadriceps',
  HAMSTRINGS: 'hamstrings',
  CALVES: 'calves'
} as const;

export const EXERCISE_CATEGORIES = {
  COMPOUND: 'compound',
  ISOLATION: 'isolation',
  UNILATERAL: 'unilateral',
  BODYWEIGHT: 'bodyweight',
  CARDIO: 'cardio',
  MOBILITY: 'mobility',
  CORRECTIVE: 'corrective'
} as const;

export const PROGRESSION_TYPES = {
  LINEAR: 'linear',
  DOUBLE_PROGRESSION: 'double_progression',
  PERIODIZED: 'periodized',
  AUTOREGULATED: 'autoregulated'
} as const;