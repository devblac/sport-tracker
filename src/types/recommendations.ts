export interface WeightRecommendation {
  suggestedWeight: number;
  confidence: number; // 0-1 scale
  reasoning: string;
  previousBest: number;
  progressionType: 'linear' | 'percentage' | 'deload' | 'maintain';
}

export interface PlateauDetection {
  isPlateaued: boolean;
  plateauDuration: number; // weeks
  lastImprovement: Date | null;
  suggestions: string[];
}

export interface ExerciseRecommendation {
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