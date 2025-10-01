export interface WeightRecommendation {
  suggestedWeight: number;
  confidence: number; // 0-1 scale
  reasoning: string;
  previousBest: number;
  progressionType: 'linear' | 'percentage' | 'deload' | 'maintain';
}

// Legacy interface - keeping for backward compatibility
export interface LegacyPlateauDetection {
  isPlateaued: boolean;
  plateauDuration: number; // weeks
  lastImprovement: Date | null;
  suggestions: string[];
}

// Legacy interface - keeping for backward compatibility
export interface LegacyExerciseRecommendation {
  exerciseId: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  targetMuscleGroup: string;
}

export interface PerformanceAnalysis {
  date: Date;
  bestSet: {
    weight: number;
    reps: number;
  };
  volume: number;
  oneRepMax: number;
  trend: 'improving' | 'maintaining' | 'declining';
}

export interface WorkoutSuggestion {
  type: 'exercise' | 'rest' | 'deload' | 'variation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  exerciseId?: string;
  reasoning: string;
}

// Extended types for comprehensive AI recommendations

export interface WorkoutHistory {
  id: string;
  date: Date;
  duration: number;
  total_volume: number;
  exercises: ExerciseHistory[];
  difficulty_rating?: number;
  energy_level?: number;
  mood_rating?: number;
}

export interface ExerciseHistory {
  exercise_id: string;
  exercise_name: string;
  sets: SetHistory[];
  max_weight: number;
  total_volume: number;
  total_reps: number;
  average_rpe?: number;
}

export interface SetHistory {
  weight: number;
  reps: number;
  rpe?: number;
  type: 'normal' | 'warmup' | 'failure' | 'dropset';
  completed: boolean;
}

export interface RecoveryStatus {
  overall_fatigue: number; // 1-10 scale
  muscle_soreness: number; // 1-10 scale
  sleep_quality: number; // 1-10 scale
  stress_level: number; // 1-10 scale
  last_rest_day: Date;
  consecutive_training_days: number;
}

export interface RecommendationContext {
  user_id: string;
  recent_workouts: WorkoutHistory[];
  recovery_status: RecoveryStatus;
  user_goals: string[];
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  available_equipment: string[];
  time_constraints: {
    max_workout_duration: number; // minutes
    sessions_per_week: number;
  };
}

// Enhanced plateau detection
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
  type: 'deload' | 'technique_focus' | 'frequency_change' | 'exercise_variation' | 'volume_increase' | 'rest_increase';
  description: string;
  duration_weeks: number;
  expected_outcome: string;
  priority: 'high' | 'medium' | 'low';
  implementation_details: string[];
}

// Weakness analysis
export interface WeaknessAnalysis {
  muscle_group: string;
  weakness_score: number; // 0-1 scale
  contributing_factors: string[];
  affected_exercises: string[];
  recommended_exercises: ExerciseRecommendation[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// Enhanced exercise recommendations
export interface ExerciseRecommendation {
  exercise_id: string;
  exercise_name: string;
  exercise_type: 'strength' | 'cardio' | 'flexibility' | 'balance';
  target_muscle_groups: string[];
  difficulty_level: number; // 1-5
  equipment_needed: string[];
  recommended_sets: number;
  recommended_reps: string; // e.g., "8-12", "30 seconds"
  frequency_per_week: number;
  reasoning: string;
  instructions: string[];
}

// Recovery recommendations
export interface RecoveryRecommendation {
  type: 'rest_day' | 'active_recovery' | 'sleep_optimization' | 'nutrition' | 'stress_management';
  title: string;
  description: string;
  duration: string;
  priority: 'high' | 'medium' | 'low';
  implementation_steps: string[];
  expected_benefits: string[];
}

// Comprehensive AI recommendations
export interface AIRecommendations {
  weight_suggestions: WeightRecommendation[];
  plateau_detections: PlateauDetection[];
  weakness_analyses: WeaknessAnalysis[];
  exercise_recommendations: ExerciseRecommendation[];
  recovery_recommendations: RecoveryRecommendation[];
  workout_suggestions: WorkoutSuggestion[];
  generated_at: Date;
  confidence_score: number; // Overall confidence in recommendations
}

// Muscle groups constants
export const MUSCLE_GROUPS = {
  CHEST: 'chest',
  BACK: 'back',
  SHOULDERS: 'shoulders',
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  FOREARMS: 'forearms',
  CORE: 'core',
  QUADRICEPS: 'quadriceps',
  HAMSTRINGS: 'hamstrings',
  GLUTES: 'glutes',
  CALVES: 'calves'
} as const;

export const EXERCISE_CATEGORIES = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  FLEXIBILITY: 'flexibility',
  BALANCE: 'balance',
  PLYOMETRIC: 'plyometric'
} as const;