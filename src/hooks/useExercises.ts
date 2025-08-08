import { useState, useEffect, useCallback } from 'react';
import { exerciseService } from '@/services/ExerciseService';
import type { Exercise, ExerciseFilter } from '@/schemas/exercise';
import { logger } from '@/utils';

interface UseExercisesState {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
}

interface UseExercisesReturn extends UseExercisesState {
  searchExercises: (filters: ExerciseFilter) => Promise<Exercise[]>;
  getExerciseById: (id: string) => Promise<Exercise | null>;
  getExerciseByIdSync: (id: string) => Exercise | null;
  refreshExercises: () => Promise<void>;
  createExercise: (exerciseData: any) => Promise<Exercise>;
  updateExercise: (id: string, updates: any) => Promise<Exercise>;
  deleteExercise: (id: string) => Promise<void>;
}

/**
 * Hook for managing exercise data with caching and error handling
 */
export function useExercises(): UseExercisesReturn {
  const [state, setState] = useState<UseExercisesState>({
    exercises: [],
    loading: true,
    error: null,
  });

  // Load all exercises
  const loadExercises = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await exerciseService.init();
      const exercises = await exerciseService.getAllExercises();
      
      setState({
        exercises,
        loading: false,
        error: null,
      });
      
      logger.info('Exercises loaded via hook', { count: exercises.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load exercises';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      logger.error('Failed to load exercises via hook', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // Search exercises with filters
  const searchExercises = useCallback(async (filters: ExerciseFilter): Promise<Exercise[]> => {
    try {
      const results = await exerciseService.searchExercises(filters);
      logger.debug('Exercise search completed', { filters, resultCount: results.length });
      return results;
    } catch (error) {
      logger.error('Exercise search failed', error);
      throw error;
    }
  }, []);

  // Get exercise by ID (async)
  const getExerciseById = useCallback(async (id: string): Promise<Exercise | null> => {
    try {
      if (!id) return null;
      const exercise = await exerciseService.getExerciseById(id);
      logger.debug('Exercise retrieved by ID', { id, found: !!exercise });
      return exercise;
    } catch (error) {
      logger.error('Failed to get exercise by ID', error);
      throw error;
    }
  }, []);

  // Get exercise by ID from cache (synchronous)
  const getExerciseByIdSync = useCallback((id: string): Exercise | null => {
    if (!id) return null;
    return state.exercises.find(exercise => exercise.id === id) || null;
  }, [state.exercises]);

  // Refresh exercises
  const refreshExercises = useCallback(async (): Promise<void> => {
    await loadExercises();
  }, [loadExercises]);

  // Create new exercise
  const createExercise = useCallback(async (exerciseData: any): Promise<Exercise> => {
    try {
      const newExercise = await exerciseService.createExercise(exerciseData);
      
      // Update local state
      setState(prev => ({
        ...prev,
        exercises: [...prev.exercises, newExercise],
      }));
      
      logger.info('Exercise created via hook', { id: newExercise.id, name: newExercise.name });
      return newExercise;
    } catch (error) {
      logger.error('Failed to create exercise via hook', error);
      throw error;
    }
  }, []);

  // Update exercise
  const updateExercise = useCallback(async (id: string, updates: any): Promise<Exercise> => {
    try {
      const updatedExercise = await exerciseService.updateExercise(id, updates);
      
      // Update local state
      setState(prev => ({
        ...prev,
        exercises: prev.exercises.map(ex => 
          ex.id === id ? updatedExercise : ex
        ),
      }));
      
      logger.info('Exercise updated via hook', { id, updates });
      return updatedExercise;
    } catch (error) {
      logger.error('Failed to update exercise via hook', error);
      throw error;
    }
  }, []);

  // Delete exercise
  const deleteExercise = useCallback(async (id: string): Promise<void> => {
    try {
      await exerciseService.deleteExercise(id);
      
      // Update local state
      setState(prev => ({
        ...prev,
        exercises: prev.exercises.filter(ex => ex.id !== id),
      }));
      
      logger.info('Exercise deleted via hook', { id });
    } catch (error) {
      logger.error('Failed to delete exercise via hook', error);
      throw error;
    }
  }, []);

  return {
    ...state,
    searchExercises,
    getExerciseById,
    getExerciseByIdSync,
    refreshExercises,
    createExercise,
    updateExercise,
    deleteExercise,
  };
}