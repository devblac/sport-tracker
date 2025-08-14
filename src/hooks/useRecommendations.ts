import { useState, useEffect, useCallback } from 'react';
import { RecommendationEngine } from '@/services/RecommendationEngine';
import type { 
  WeightRecommendation, 
  PlateauDetection, 
  ExerciseRecommendation 
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