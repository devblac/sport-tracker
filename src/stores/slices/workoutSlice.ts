import type { StateCreator } from 'zustand';
import type { Workout, WorkoutExercise, SetData } from '@/schemas/workout';
import type { WorkoutId, ExerciseId } from '@/types/branded';
import { logger } from '@/utils';

// Slice state interface
export interface WorkoutSlice {
  // State
  workouts: Map<WorkoutId, Workout>;
  templates: Map<WorkoutId, Workout>;
  activeWorkoutId: WorkoutId | null;
  isLoading: boolean;
  error: string | null;
  
  // Computed getters
  getActiveWorkout: () => Workout | null;
  getWorkoutById: (id: WorkoutId) => Workout | null;
  getTemplateById: (id: WorkoutId) => Workout | null;
  getWorkoutsByUserId: (userId: string) => Workout[];
  
  // Actions
  setWorkouts: (workouts: Workout[]) => void;
  setTemplates: (templates: Workout[]) => void;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (id: WorkoutId, updates: Partial<Workout>) => void;
  removeWorkout: (id: WorkoutId) => void;
  setActiveWorkout: (id: WorkoutId | null) => void;
  
  // Exercise actions
  addExerciseToWorkout: (workoutId: WorkoutId, exercise: WorkoutExercise) => void;
  removeExerciseFromWorkout: (workoutId: WorkoutId, exerciseId: ExerciseId) => void;
  updateExerciseInWorkout: (workoutId: WorkoutId, exerciseId: ExerciseId, updates: Partial<WorkoutExercise>) => void;
  
  // Set actions
  addSetToExercise: (workoutId: WorkoutId, exerciseId: ExerciseId, setData: SetData) => void;
  updateSetInExercise: (workoutId: WorkoutId, exerciseId: ExerciseId, setIndex: number, updates: Partial<SetData>) => void;
  removeSetFromExercise: (workoutId: WorkoutId, exerciseId: ExerciseId, setIndex: number) => void;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Initial state
const initialState = {
  workouts: new Map<WorkoutId, Workout>(),
  templates: new Map<WorkoutId, Workout>(),
  activeWorkoutId: null,
  isLoading: false,
  error: null,
};

// Create the slice
export const createWorkoutSlice: StateCreator<
  WorkoutSlice,
  [],
  [],
  WorkoutSlice
> = (set, get) => ({
  ...initialState,

  // Computed getters
  getActiveWorkout: () => {
    const { activeWorkoutId, workouts } = get();
    return activeWorkoutId ? workouts.get(activeWorkoutId) || null : null;
  },

  getWorkoutById: (id: WorkoutId) => {
    return get().workouts.get(id) || null;
  },

  getTemplateById: (id: WorkoutId) => {
    return get().templates.get(id) || null;
  },

  getWorkoutsByUserId: (userId: string) => {
    const { workouts } = get();
    return Array.from(workouts.values()).filter(workout => workout.user_id === userId);
  },

  // Actions
  setWorkouts: (workouts: Workout[]) => {
    set((state) => ({
      ...state,
      workouts: new Map(workouts.map(w => [w.id as WorkoutId, w])),
    }));
  },

  setTemplates: (templates: Workout[]) => {
    set((state) => ({
      ...state,
      templates: new Map(templates.map(t => [t.id as WorkoutId, t])),
    }));
  },

  addWorkout: (workout: Workout) => {
    set((state) => {
      const newWorkouts = new Map(state.workouts);
      newWorkouts.set(workout.id as WorkoutId, workout);
      return {
        ...state,
        workouts: newWorkouts,
      };
    });
    logger.info('Workout added', { workoutId: workout.id });
  },

  updateWorkout: (id: WorkoutId, updates: Partial<Workout>) => {
    set((state) => {
      const workout = state.workouts.get(id);
      if (!workout) return state;

      const updatedWorkout = { ...workout, ...updates };
      const newWorkouts = new Map(state.workouts);
      newWorkouts.set(id, updatedWorkout);

      return {
        ...state,
        workouts: newWorkouts,
      };
    });
    logger.info('Workout updated', { workoutId: id, updates });
  },

  removeWorkout: (id: WorkoutId) => {
    set((state) => {
      const newWorkouts = new Map(state.workouts);
      newWorkouts.delete(id);
      
      return {
        ...state,
        workouts: newWorkouts,
        activeWorkoutId: state.activeWorkoutId === id ? null : state.activeWorkoutId,
      };
    });
    logger.info('Workout removed', { workoutId: id });
  },

  setActiveWorkout: (id: WorkoutId | null) => {
    set((state) => ({
      ...state,
      activeWorkoutId: id,
    }));
    logger.info('Active workout changed', { workoutId: id });
  },

  // Exercise actions
  addExerciseToWorkout: (workoutId: WorkoutId, exercise: WorkoutExercise) => {
    set((state) => {
      const workout = state.workouts.get(workoutId);
      if (!workout) return state;

      const updatedWorkout = {
        ...workout,
        exercises: [...workout.exercises, exercise],
      };

      const newWorkouts = new Map(state.workouts);
      newWorkouts.set(workoutId, updatedWorkout);

      return {
        ...state,
        workouts: newWorkouts,
      };
    });
    logger.info('Exercise added to workout', { workoutId, exerciseId: exercise.exercise_id });
  },

  removeExerciseFromWorkout: (workoutId: WorkoutId, exerciseId: ExerciseId) => {
    set((state) => {
      const workout = state.workouts.get(workoutId);
      if (!workout) return state;

      const updatedWorkout = {
        ...workout,
        exercises: workout.exercises.filter(e => e.exercise_id !== exerciseId),
      };

      const newWorkouts = new Map(state.workouts);
      newWorkouts.set(workoutId, updatedWorkout);

      return {
        ...state,
        workouts: newWorkouts,
      };
    });
    logger.info('Exercise removed from workout', { workoutId, exerciseId });
  },

  updateExerciseInWorkout: (workoutId: WorkoutId, exerciseId: ExerciseId, updates: Partial<WorkoutExercise>) => {
    set((state) => {
      const workout = state.workouts.get(workoutId);
      if (!workout) return state;

      const updatedWorkout = {
        ...workout,
        exercises: workout.exercises.map(exercise =>
          exercise.exercise_id === exerciseId
            ? { ...exercise, ...updates }
            : exercise
        ),
      };

      const newWorkouts = new Map(state.workouts);
      newWorkouts.set(workoutId, updatedWorkout);

      return {
        ...state,
        workouts: newWorkouts,
      };
    });
    logger.info('Exercise updated in workout', { workoutId, exerciseId, updates });
  },

  // Set actions
  addSetToExercise: (workoutId: WorkoutId, exerciseId: ExerciseId, setData: SetData) => {
    set((state) => {
      const workout = state.workouts.get(workoutId);
      if (!workout) return state;

      const updatedWorkout = {
        ...workout,
        exercises: workout.exercises.map(exercise =>
          exercise.exercise_id === exerciseId
            ? { ...exercise, sets: [...exercise.sets, setData] }
            : exercise
        ),
      };

      const newWorkouts = new Map(state.workouts);
      newWorkouts.set(workoutId, updatedWorkout);

      return {
        ...state,
        workouts: newWorkouts,
      };
    });
    logger.info('Set added to exercise', { workoutId, exerciseId });
  },

  updateSetInExercise: (workoutId: WorkoutId, exerciseId: ExerciseId, setIndex: number, updates: Partial<SetData>) => {
    set((state) => {
      const workout = state.workouts.get(workoutId);
      if (!workout) return state;

      const updatedWorkout = {
        ...workout,
        exercises: workout.exercises.map(exercise =>
          exercise.exercise_id === exerciseId
            ? {
                ...exercise,
                sets: exercise.sets.map((set, index) =>
                  index === setIndex ? { ...set, ...updates } : set
                ),
              }
            : exercise
        ),
      };

      const newWorkouts = new Map(state.workouts);
      newWorkouts.set(workoutId, updatedWorkout);

      return {
        ...state,
        workouts: newWorkouts,
      };
    });
    logger.info('Set updated in exercise', { workoutId, exerciseId, setIndex, updates });
  },

  removeSetFromExercise: (workoutId: WorkoutId, exerciseId: ExerciseId, setIndex: number) => {
    set((state) => {
      const workout = state.workouts.get(workoutId);
      if (!workout) return state;

      const updatedWorkout = {
        ...workout,
        exercises: workout.exercises.map(exercise =>
          exercise.exercise_id === exerciseId
            ? {
                ...exercise,
                sets: exercise.sets.filter((_, index) => index !== setIndex),
              }
            : exercise
        ),
      };

      const newWorkouts = new Map(state.workouts);
      newWorkouts.set(workoutId, updatedWorkout);

      return {
        ...state,
        workouts: newWorkouts,
      };
    });
    logger.info('Set removed from exercise', { workoutId, exerciseId, setIndex });
  },

  // Utility actions
  setLoading: (loading: boolean) => {
    set((state) => ({ ...state, isLoading: loading }));
  },

  setError: (error: string | null) => {
    set((state) => ({ ...state, error }));
  },

  clearError: () => {
    set((state) => ({ ...state, error: null }));
  },

  reset: () => {
    set(() => ({ ...initialState }));
    logger.info('Workout store reset');
  },
});