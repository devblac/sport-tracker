/**
 * Percentile System Types
 * Defines interfaces and types for the percentile calculation and comparison system
 */

export interface UserDemographics {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number; // in kg
  height: number; // in cm
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  body_fat_percentage?: number;
}

export interface ExercisePerformance {
  exercise_id: string;
  exercise_name: string;
  max_weight: number; // 1RM or max weight lifted
  max_reps: number; // max reps at bodyweight or specific weight
  max_volume: number; // highest single-session volume
  best_time?: number; // for timed exercises (seconds)
  best_distance?: number; // for distance exercises (meters)
  recorded_at: Date;
  bodyweight_at_time: number;
}

export interface PercentileSegment {
  id: string;
  name: string;
  age_min: number;
  age_max: number;
  gender: 'male' | 'female' | 'other' | 'all';
  weight_min?: number;
  weight_max?: number;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'all';
  sample_size: number;
  last_updated: Date;
}

export interface PercentileData {
  segment_id: string;
  exercise_id: string;
  metric_type: 'max_weight' | 'max_reps' | 'max_volume' | 'best_time' | 'best_distance';
  percentiles: {
    p5: number;
    p10: number;
    p25: number;
    p50: number; // median
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  mean: number;
  std_deviation: number;
  sample_size: number;
  last_updated: Date;
}

export interface UserPercentileRanking {
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  metric_type: 'max_weight' | 'max_reps' | 'max_volume' | 'best_time' | 'best_distance';
  user_value: number;
  percentile: number; // 0-100
  segment: PercentileSegment;
  global_rank?: number;
  segment_rank?: number;
  total_users_in_segment: number;
  comparison_data: {
    better_than_percentage: number;
    users_better_than: number;
    users_worse_than: number;
  };
  strength_level?: 'untrained' | 'novice' | 'intermediate' | 'advanced' | 'elite';
  calculated_at: Date;
}

export interface PercentileComparison {
  user_performance: UserPercentileRanking;
  peer_comparisons: {
    same_age_group: UserPercentileRanking;
    same_weight_class: UserPercentileRanking;
    same_experience: UserPercentileRanking;
    global: UserPercentileRanking;
  };
  improvement_suggestions: {
    next_percentile_target: number;
    value_needed: number;
    estimated_time_to_achieve: string;
    training_recommendations: string[];
  };
}

export interface StrengthStandards {
  exercise_id: string;
  exercise_name: string;
  standards: {
    untrained: number;
    novice: number;
    intermediate: number;
    advanced: number;
    elite: number;
  };
  unit: string;
  bodyweight_multiplier: boolean; // if true, standards are multiplied by bodyweight
  gender: 'male' | 'female';
  source: string;
  last_updated: Date;
}

export interface GlobalRanking {
  exercise_id: string;
  exercise_name: string;
  metric_type: 'max_weight' | 'max_reps' | 'max_volume' | 'best_time' | 'best_distance';
  rankings: Array<{
    rank: number;
    user_id: string;
    username: string;
    display_name: string;
    value: number;
    bodyweight?: number;
    relative_strength?: number; // value / bodyweight for strength exercises
    demographics: {
      age: number;
      gender: string;
      weight: number;
    };
    verified: boolean;
    recorded_at: Date;
  }>;
  total_participants: number;
  last_updated: Date;
}

export interface PercentileUpdateRequest {
  exercise_id: string;
  user_demographics: UserDemographics;
  performance_data: ExercisePerformance[];
  force_recalculation?: boolean;
}

export interface PercentileCalculationResult {
  success: boolean;
  user_rankings: UserPercentileRanking[];
  comparisons: PercentileComparison[];
  updated_segments: string[];
  calculation_time_ms: number;
  errors?: string[];
}

// Predefined demographic segments for common comparisons
export const DEMOGRAPHIC_SEGMENTS = {
  // Age groups
  YOUNG_ADULT: { age_min: 18, age_max: 25, name: 'Young Adult (18-25)' },
  ADULT: { age_min: 26, age_max: 35, name: 'Adult (26-35)' },
  MIDDLE_AGED: { age_min: 36, age_max: 45, name: 'Middle Aged (36-45)' },
  MATURE: { age_min: 46, age_max: 55, name: 'Mature (46-55)' },
  SENIOR: { age_min: 56, age_max: 99, name: 'Senior (56+)' },
  
  // Weight classes (kg)
  LIGHTWEIGHT: { weight_min: 0, weight_max: 70, name: 'Lightweight (<70kg)' },
  MIDDLEWEIGHT: { weight_min: 70, weight_max: 85, name: 'Middleweight (70-85kg)' },
  HEAVYWEIGHT: { weight_min: 85, weight_max: 100, name: 'Heavyweight (85-100kg)' },
  SUPER_HEAVYWEIGHT: { weight_min: 100, weight_max: 999, name: 'Super Heavyweight (100kg+)' }
} as const;

// Exercise categories for percentile calculations
export const PERCENTILE_EXERCISE_CATEGORIES = {
  POWERLIFTING: ['squat', 'bench_press', 'deadlift'],
  OLYMPIC_LIFTING: ['clean_and_jerk', 'snatch'],
  BODYWEIGHT: ['pull_ups', 'push_ups', 'dips'],
  CARDIO: ['running_5k', 'running_10k', 'marathon'],
  FUNCTIONAL: ['burpees', 'mountain_climbers', 'plank']
} as const;

// Strength level thresholds (as percentiles)
export const STRENGTH_LEVEL_THRESHOLDS = {
  UNTRAINED: 0,    // 0th percentile
  NOVICE: 25,      // 25th percentile
  INTERMEDIATE: 50, // 50th percentile
  ADVANCED: 75,    // 75th percentile
  ELITE: 90        // 90th percentile
} as const;