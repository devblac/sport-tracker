import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOfflineSync } from './useOfflineSync';
import { useAuth } from './useAuth';
import { 
  Workout, 
  Exercise, 
  CreateWorkoutInput, 
  UpdateWorkoutInput,
  CreateWorkoutSchema,
  UpdateWorkoutSchema 
} from '../types';
import { getLocalWorkouts, saveLocalWorkout, deleteLocalWorkout } from '../lib/database';
import { showSuccessToast, showErrorToast } from '../lib/toast';

interface WorkoutsState {
  workouts: Workout[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

interface UseWorkoutsReturn {
  // Data
  workouts: Workout[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  
  // Actions
  createWorkout: (data: CreateWorkoutInput) => Promise<{ success: boolean; workout?: Workout; error?: string }>;
  updateWorkout: (id: string, data: Partial<UpdateWorkoutInput>) => Promise<{ success: boolean; workout?: Workout; error?: string }>;
  deleteWorkout: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshWorkouts: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  getWorkoutById: (id: string) => Workout | undefined;
}

/**
 * Hook for managing workout CRUD operations with offline support
 * 
 * Features:
 * - Create, read, update, delete workouts
 * - Offline queue support for create/update/delete
 * - Local cache fallback when offline
 * - Optimistic updates for better UX
 * - Automatic sync when online
 */
export const useWorkouts = (): UseWorkoutsReturn => {
  const { user, isAuthenticated } = useAuth();
  const { queueOperation } = useOfflineSync();
  
  const [state, setState] = useState<WorkoutsState>({
    workouts: [],
    loading: true,
    error: null,
    refreshing: false,
  });

  // Load workouts on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadWorkouts();
    } else {
      setState({
        workouts: [],
        loading: false,
        error: null,
        refreshing: false,
      });
    }
  }, [isAuthenticated, user]);

  /**
   * Load workouts from Supabase with local cache fallback
   */
  const loadWorkouts = useCallback(async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Try to fetch from Supabase first
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          id,
          user_id,
          name,
          notes,
          comment,
          duration_minutes,
          xp_earned,
          completed_at,
          created_at,
          exercises (*)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (workoutsError) {
        throw workoutsError;
      }

      // Transform data to include exercises array
      const workouts: Workout[] = (workoutsData || []).map(workout => ({
        ...workout,
        synced: true, // Data from Supabase is considered synced
        exercises: workout.exercises || [],
      }));

      setState(prev => ({
        ...prev,
        workouts,
        loading: false,
        error: null,
      }));

    } catch (error) {
      console.error('[useWorkouts] Failed to load from Supabase, trying local cache:', error);
      
      try {
        // Fallback to local cache
        const localWorkouts = await getLocalWorkouts(user.id);
        setState(prev => ({
          ...prev,
          workouts: localWorkouts,
          loading: false,
          error: 'Using offline data. Will sync when online.',
        }));
      } catch (localError) {
        console.error('[useWorkouts] Failed to load local workouts:', localError);
        setState(prev => ({
          ...prev,
          workouts: [],
          loading: false,
          error: 'Failed to load workouts',
        }));
      }
    }
  }, [user]);

  /**
   * Refresh workouts (for pull-to-refresh)
   */
  const refreshWorkouts = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, refreshing: true, error: null }));
    
    try {
      await loadWorkouts();
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  }, [user, loadWorkouts]);

  /**
   * Create a new workout with offline support
   */
  const createWorkout = useCallback(async (data: CreateWorkoutInput) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Validate input
      const validatedData = CreateWorkoutSchema.parse(data);
      
      // Generate temporary ID for optimistic update
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate XP (basic calculation: 1 XP per minute + exercise bonus)
      const baseXP = validatedData.duration_minutes || 30;
      const exerciseBonus = validatedData.exercises.length * 5;
      const xpEarned = baseXP + exerciseBonus;

      // Create workout object
      const newWorkout: Workout = {
        id: tempId,
        user_id: user.id,
        name: validatedData.name,
        notes: validatedData.notes,
        comment: validatedData.comment,
        duration_minutes: validatedData.duration_minutes,
        xp_earned: xpEarned,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        synced: false,
        exercises: validatedData.exercises.map(exercise => ({
          id: `temp_ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workout_id: tempId,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          notes: exercise.notes,
          created_at: new Date().toISOString(),
        })),
      };

      // Optimistic update - add to local state immediately
      setState(prev => ({
        ...prev,
        workouts: [newWorkout, ...prev.workouts],
        error: null,
      }));

      // Save to local storage
      await saveLocalWorkout(newWorkout);

      // Queue for sync
      await queueOperation('CREATE_WORKOUT', 'workouts', tempId, {
        workout: newWorkout,
        exercises: newWorkout.exercises,
      });

      showSuccessToast(`Workout "${newWorkout.name}" created! +${xpEarned} XP`, 'Workout Completed');

      return { success: true, workout: newWorkout };

    } catch (error) {
      console.error('[useWorkouts] Failed to create workout:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create workout';
      setState(prev => ({ ...prev, error: errorMessage }));
      showErrorToast(errorMessage);
      
      return { success: false, error: errorMessage };
    }
  }, [user, queueOperation]);

  /**
   * Update an existing workout with offline support
   */
  const updateWorkout = useCallback(async (id: string, data: Partial<UpdateWorkoutInput>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Find existing workout
      const existingWorkout = state.workouts.find(w => w.id === id);
      if (!existingWorkout) {
        return { success: false, error: 'Workout not found' };
      }

      // Validate input
      const validatedData = UpdateWorkoutSchema.parse({ ...data, id });
      
      // Recalculate XP if duration or exercises changed
      let newXpEarned = existingWorkout.xp_earned;
      if (validatedData.duration_minutes !== undefined || validatedData.exercises !== undefined) {
        const duration = validatedData.duration_minutes ?? existingWorkout.duration_minutes ?? 30;
        const exercises = validatedData.exercises ?? existingWorkout.exercises ?? [];
        const baseXP = duration;
        const exerciseBonus = exercises.length * 5;
        newXpEarned = baseXP + exerciseBonus;
      }

      // Create updated workout
      const updatedWorkout: Workout = {
        ...existingWorkout,
        ...validatedData,
        xp_earned: newXpEarned,
        synced: false, // Mark as unsynced
        exercises: validatedData.exercises ? validatedData.exercises.map(exercise => ({
          id: `temp_ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workout_id: id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          notes: exercise.notes,
          created_at: new Date().toISOString(),
        })) : existingWorkout.exercises,
      };

      // Optimistic update
      setState(prev => ({
        ...prev,
        workouts: prev.workouts.map(w => w.id === id ? updatedWorkout : w),
        error: null,
      }));

      // Save to local storage
      await saveLocalWorkout(updatedWorkout);

      // Queue for sync
      await queueOperation('UPDATE_WORKOUT', 'workouts', id, {
        workout: updatedWorkout,
        exercises: updatedWorkout.exercises,
      });

      showSuccessToast('Workout updated successfully');

      return { success: true, workout: updatedWorkout };

    } catch (error) {
      console.error('[useWorkouts] Failed to update workout:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update workout';
      setState(prev => ({ ...prev, error: errorMessage }));
      showErrorToast(errorMessage);
      
      return { success: false, error: errorMessage };
    }
  }, [user, state.workouts, queueOperation]);

  /**
   * Delete a workout with offline support
   */
  const deleteWorkout = useCallback(async (id: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Find existing workout
      const existingWorkout = state.workouts.find(w => w.id === id);
      if (!existingWorkout) {
        return { success: false, error: 'Workout not found' };
      }

      // Optimistic update - remove from local state
      setState(prev => ({
        ...prev,
        workouts: prev.workouts.filter(w => w.id !== id),
        error: null,
      }));

      // Delete from local storage
      await deleteLocalWorkout(id);

      // Queue for sync (only if it was previously synced)
      if (existingWorkout.synced) {
        await queueOperation('DELETE_WORKOUT', 'workouts', id, { workout_id: id });
      }

      showSuccessToast('Workout deleted successfully');

      return { success: true };

    } catch (error) {
      console.error('[useWorkouts] Failed to delete workout:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete workout';
      setState(prev => ({ ...prev, error: errorMessage }));
      showErrorToast(errorMessage);
      
      // Revert optimistic update on error
      const existingWorkout = state.workouts.find(w => w.id === id);
      if (existingWorkout) {
        setState(prev => ({
          ...prev,
          workouts: [...prev.workouts, existingWorkout].sort((a, b) => 
            new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
          ),
        }));
      }
      
      return { success: false, error: errorMessage };
    }
  }, [user, state.workouts, queueOperation]);

  /**
   * Get workout by ID
   */
  const getWorkoutById = useCallback((id: string) => {
    return state.workouts.find(w => w.id === id);
  }, [state.workouts]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    workouts: state.workouts,
    loading: state.loading,
    error: state.error,
    refreshing: state.refreshing,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    refreshWorkouts,
    clearError,
    getWorkoutById,
  };
};