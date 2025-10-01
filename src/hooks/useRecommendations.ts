import { useState, useEffect, useCallback } from 'react';
import { RecommendationEngine } from '@/services/RecommendationEngine';
import { AIRecommendationService } from '@/services/AIRecommendationService';
import { RecoveryRecommendationService } from '@/services/RecoveryRecommendationService';
import type { 
  WeightRecommendation, 
  PlateauDetection, 
  ExerciseRecommendation,
  AIRecommendations,
  RecoveryRecommendation
} from '@/types/recommendations';
import { useAuthStore } from '@/stores/useAuthStore';

export const useWeightRecommendation = (
  exerciseId: string,
  targetReps: number,
  currentSetNumber: number = 1
) => {
  const [recommendation, setRecommendation] = useState<WeightRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const getRecommendation = useCallback(async () => {
    if (!user?.id || !exerciseId) return;

    setLoading(true);
    setError(null);

    try {
      const engine = RecommendationEngine.getInstance();
      const result = await engine.getWeightRecommendation(
        user.id,
        exerciseId,
        targetReps,
        currentSetNumber
      );
      setRecommendation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendation');
    } finally {
      setLoading(false);
    }
  }, [user?.id, exerciseId, targetReps, currentSetNumber]);

  useEffect(() => {
    getRecommendation();
  }, [getRecommendation]);

  return {
    recommendation,
    loading,
    error,
    refresh: getRecommendation
  };
};

export const usePlateauDetection = (exerciseId: string) => {
  const [plateau, setPlateau] = useState<PlateauDetection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const checkPlateau = useCallback(async () => {
    if (!user?.id || !exerciseId) return;

    setLoading(true);
    setError(null);

    try {
      const engine = RecommendationEngine.getInstance();
      const result = await engine.detectPlateau(user.id, exerciseId);
      setPlateau(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect plateau');
    } finally {
      setLoading(false);
    }
  }, [user?.id, exerciseId]);

  useEffect(() => {
    checkPlateau();
  }, [checkPlateau]);

  return {
    plateau,
    loading,
    error,
    refresh: checkPlateau
  };
};

export const useExerciseRecommendations = (targetMuscleGroup?: string) => {
  const [recommendations, setRecommendations] = useState<ExerciseRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const getRecommendations = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const engine = RecommendationEngine.getInstance();
      const result = await engine.getExerciseRecommendations(user.id, targetMuscleGroup);
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, targetMuscleGroup]);

  useEffect(() => {
    getRecommendations();
  }, [getRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refresh: getRecommendations
  };
};

// New comprehensive AI recommendations hook
export const useAIRecommendations = (options?: {
  includeWeightSuggestions?: boolean;
  includePlateauDetection?: boolean;
  includeWeaknessAnalysis?: boolean;
  includeRecoveryRecommendations?: boolean;
  includeExerciseRecommendations?: boolean;
  weeksToAnalyze?: number;
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const generateRecommendations = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const aiService = AIRecommendationService.getInstance();
      const result = await aiService.generateRecommendations(user.id, user, options);
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI recommendations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user, options]);

  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refresh: generateRecommendations
  };
};

// Exercise-specific recommendations hook
export const useExerciseSpecificRecommendations = (
  exerciseId: string,
  targetReps: number = 10
) => {
  const [recommendations, setRecommendations] = useState<{
    weightRecommendation: WeightRecommendation;
    plateauDetection: PlateauDetection | null;
    suggestions: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const getRecommendations = useCallback(async () => {
    if (!user?.id || !exerciseId) return;

    setLoading(true);
    setError(null);

    try {
      const aiService = AIRecommendationService.getInstance();
      const result = await aiService.getExerciseSpecificRecommendations(
        user.id,
        exerciseId,
        targetReps
      );
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get exercise recommendations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, exerciseId, targetReps]);

  useEffect(() => {
    getRecommendations();
  }, [getRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refresh: getRecommendations
  };
};

// Recovery recommendations hook
export const useRecoveryRecommendations = () => {
  const [recommendations, setRecommendations] = useState<RecoveryRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const getRecoveryRecommendations = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const aiService = AIRecommendationService.getInstance();
      const context = await (aiService as any).buildRecommendationContext(user.id, user, 4); // 4 weeks
      const result = await RecoveryRecommendationService.analyzeRecoveryNeeds(context);
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recovery recommendations');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user]);

  useEffect(() => {
    getRecoveryRecommendations();
  }, [getRecoveryRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refresh: getRecoveryRecommendations
  };
};