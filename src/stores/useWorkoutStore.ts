import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from './middleware';
import { Workout, WorkoutExercise, SetData } from '@/types';
import { storage, generateId } from '@/utils';

interface WorkoutState {
  // State
  workouts: Workout[];
  templates: Workout[];
  activeWorkout: Workout | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createWorkout: (name: string, exercises?: WorkoutExercise[]) => Workout;
  startWorkout: (workoutId: string | null, templateId?: string) => void;
  completeWorkout: () => void;
  cancelWorkout: () => void;
  addExerciseToWorkout: (workoutId: string, exercise: WorkoutExercise) => void;
  removeExerciseFromWorkout: (workoutId: string, exerciseId: string) => void;
  updateExerciseInWorkout: (workoutId: string, exerciseId: string, updates: Partial<WorkoutExercise>) => void;
  logSet: (exerciseId: string, setData: SetData) => void;
  updateSet: (exerciseId: string, setIndex: number, setData: Partial<SetData>) => void;
  createTemplate: (name: string, exercises?: WorkoutExercise[]) => Workout;
  updateTemplate: (templateId: string, updates: Partial<Workout>) => void;
  deleteTemplate: (templateId: string) => void;
  clearError: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  logger({ enabled: true, collapsed: true, storeName: 'WorkoutStore' })(
    persist(
      (set, get) => ({
        // Initial state
        workouts: [],
        templates: [
          // Default templates
          {
            id: 'template-1',
            user_id: 'system',
            name: 'Push Day',
            exercises: [
              {
                exercise_id: 'bench-press',
                order: 0,
                sets: [],
                rest_time: 90,
                notes: '',
              },
            ],
            is_template: true,
            is_completed: false,
            total_volume: 0,
          },
        ],
        activeWorkout: null,
        isLoading: false,
        error: null,

        // Actions
        createWorkout: (name, exercises = []) => {
          const newWorkout: Workout = {
            id: generateId(),
            user_id: 'current-user',
            name,
            exercises,
            is_template: false,
            is_completed: false,
            started_at: new Date(),
            total_volume: 0,
          };

          set((state) => ({
            ...state,
            workouts: [...state.workouts, newWorkout],
          }));

          return newWorkout;
        },

        startWorkout: (workoutId, templateId) => {
          let workout: Workout | null = null;
          const state = get();

          if (workoutId) {
            workout = state.workouts.find(w => w.id === workoutId) || null;
          } else if (templateId) {
            const template = state.templates.find(t => t.id === templateId);
            
            if (template) {
              workout = {
                id: generateId(),
                user_id: 'current-user',
                name: template.name,
                exercises: JSON.parse(JSON.stringify(template.exercises)),
                is_template: false,
                is_completed: false,
                template_id: templateId,
                started_at: new Date(),
                total_volume: 0,
              };

              set((state) => ({
                ...state,
                workouts: [...state.workouts, workout!],
                activeWorkout: workout,
              }));
              return;
            }
          } else {
            workout = state.createWorkout('New Workout');
          }

          set((state) => ({
            ...state,
            activeWorkout: workout,
          }));
        },

        completeWorkout: () => {
          const { activeWorkout, workouts } = get();
          if (!activeWorkout) return;

          const workoutIndex = workouts.findIndex(w => w.id === activeWorkout.id);
          if (workoutIndex !== -1) {
            const updatedWorkouts = [...workouts];
            updatedWorkouts[workoutIndex] = {
              ...updatedWorkouts[workoutIndex],
              is_completed: true,
              completed_at: new Date(),
            };

            set((state) => ({
              ...state,
              workouts: updatedWorkouts,
              activeWorkout: null,
            }));
          }
        },

        cancelWorkout: () => {
          set((state) => ({
            ...state,
            activeWorkout: null,
          }));
        },

        addExerciseToWorkout: (workoutId, exercise) => {
          const state = get();
          const workoutIndex = state.workouts.findIndex(w => w.id === workoutId);
          
          if (workoutIndex !== -1) {
            const updatedWorkouts = [...state.workouts];
            exercise.order = updatedWorkouts[workoutIndex].exercises.length;
            updatedWorkouts[workoutIndex] = {
              ...updatedWorkouts[workoutIndex],
              exercises: [...updatedWorkouts[workoutIndex].exercises, exercise],
            };

            const updates: any = { workouts: updatedWorkouts };

            if (state.activeWorkout && state.activeWorkout.id === workoutId) {
              updates.activeWorkout = {
                ...state.activeWorkout,
                exercises: [...state.activeWorkout.exercises, exercise],
              };
            }

            set((state) => ({ ...state, ...updates }));
          }
        },

        removeExerciseFromWorkout: (workoutId, exerciseId) => {
          const state = get();
          const workoutIndex = state.workouts.findIndex(w => w.id === workoutId);
          
          if (workoutIndex !== -1) {
            const updatedWorkouts = [...state.workouts];
            updatedWorkouts[workoutIndex] = {
              ...updatedWorkouts[workoutIndex],
              exercises: updatedWorkouts[workoutIndex].exercises.filter(e => e.exercise_id !== exerciseId),
            };

            const updates: any = { workouts: updatedWorkouts };

            if (state.activeWorkout && state.activeWorkout.id === workoutId) {
              updates.activeWorkout = {
                ...state.activeWorkout,
                exercises: state.activeWorkout.exercises.filter(e => e.exercise_id !== exerciseId),
              };
            }

            set((state) => ({ ...state, ...updates }));
          }
        },

        updateExerciseInWorkout: (workoutId, exerciseId, updates) => {
          // Simplified version - just clear error for now
          set((state) => ({ ...state, error: null }));
        },

        logSet: (exerciseId, setData) => {
          const { activeWorkout } = get();
          if (!activeWorkout) return;

          const exerciseIndex = activeWorkout.exercises.findIndex(e => e.exercise_id === exerciseId);
          if (exerciseIndex !== -1) {
            const updatedExercises = [...activeWorkout.exercises];
            updatedExercises[exerciseIndex] = {
              ...updatedExercises[exerciseIndex],
              sets: [...updatedExercises[exerciseIndex].sets, {
                ...setData,
                completed: true,
                completed_at: new Date(),
              }],
            };

            set((state) => ({
              ...state,
              activeWorkout: {
                ...state.activeWorkout!,
                exercises: updatedExercises,
              },
            }));
          }
        },

        updateSet: (exerciseId, setIndex, setData) => {
          // Simplified version - just clear error for now
          set((state) => ({ ...state, error: null }));
        },

        createTemplate: (name, exercises = []) => {
          const newTemplate: Workout = {
            id: `template-${generateId()}`,
            user_id: 'current-user',
            name,
            exercises,
            is_template: true,
            is_completed: false,
            total_volume: 0,
          };

          set((state) => ({
            ...state,
            templates: [...state.templates, newTemplate],
          }));

          return newTemplate;
        },

        updateTemplate: (templateId, updates) => {
          const state = get();
          const templateIndex = state.templates.findIndex(t => t.id === templateId);
          
          if (templateIndex !== -1) {
            const updatedTemplates = [...state.templates];
            updatedTemplates[templateIndex] = {
              ...updatedTemplates[templateIndex],
              ...updates,
            };

            set((state) => ({
              ...state,
              templates: updatedTemplates,
            }));
          }
        },

        deleteTemplate: (templateId) => {
          set((state) => ({
            ...state,
            templates: state.templates.filter(t => t.id !== templateId),
          }));
        },

        clearError: () => {
          set((state) => ({
            ...state,
            error: null,
          }));
        },
      }),
      {
        name: 'fitness-workout-storage',
        storage: {
          getItem: (name) => {
            const value = storage.get(name);
            return Promise.resolve(value);
          },
          setItem: (name, value) => {
            storage.set(name, value);
            return Promise.resolve();
          },
          removeItem: (name) => {
            storage.remove(name);
            return Promise.resolve();
          },
        },
      }
    )
  )
);