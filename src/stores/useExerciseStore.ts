import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from './middleware';
import { Exercise } from '@/types';
import { storage } from '@/utils';

interface ExerciseState {
  // State
  exercises: Exercise[];
  isLoading: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  
  // Actions
  fetchExercises: () => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
  searchExercises: (query: string, filters?: ExerciseFilters) => Exercise[];
  syncExercises: () => Promise<void>;
  clearError: () => void;
}

export interface ExerciseFilters {
  category?: string;
  bodyParts?: string[];
  muscleGroups?: string[];
  equipment?: string;
  difficulty?: number;
  type?: 'machine' | 'dumbbell' | 'barbell';
}

// Mock exercise data
const mockExercises: Exercise[] = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    type: 'barbell',
    category: 'Chest',
    body_parts: ['Chest'],
    muscle_groups: ['Pectoralis Major', 'Triceps', 'Anterior Deltoid'],
    equipment: 'Barbell',
    difficulty_level: 3,
    instructions: 'Lie on a flat bench, grip the bar with hands slightly wider than shoulder-width apart, lower the bar to your chest, then push it back up.',
    gif_url: 'https://example.com/bench-press.gif',
    muscle_diagram_url: 'https://example.com/bench-press-muscles.png',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
  },
  {
    id: 'squat',
    name: 'Squat',
    type: 'barbell',
    category: 'Legs',
    body_parts: ['Legs'],
    muscle_groups: ['Quadriceps', 'Hamstrings', 'Glutes'],
    equipment: 'Barbell',
    difficulty_level: 4,
    instructions: 'Stand with feet shoulder-width apart, barbell across upper back, bend knees and hips to lower your body, then return to standing position.',
    gif_url: 'https://example.com/squat.gif',
    muscle_diagram_url: 'https://example.com/squat-muscles.png',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    type: 'barbell',
    category: 'Back',
    body_parts: ['Back', 'Legs'],
    muscle_groups: ['Erector Spinae', 'Hamstrings', 'Glutes', 'Trapezius'],
    equipment: 'Barbell',
    difficulty_level: 5,
    instructions: 'Stand with feet hip-width apart, bend at hips and knees to grip the bar, then stand up by driving through heels and extending hips and knees.',
    gif_url: 'https://example.com/deadlift.gif',
    muscle_diagram_url: 'https://example.com/deadlift-muscles.png',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
  },
];

export const useExerciseStore = create<ExerciseState>()(
  logger({ enabled: true, collapsed: true, storeName: 'ExerciseStore' })(
    persist(
      (set, get) => ({
        // Initial state
        exercises: [],
        isLoading: false,
        lastSyncTime: null,
        error: null,

        // Actions
        fetchExercises: async () => {
          set((state) => ({
            ...state,
            isLoading: true,
            error: null,
          }));

          try {
            // In a real app, this would be an API call
            // For now, we'll use mock data
            await new Promise(resolve => setTimeout(resolve, 500));

            set((state) => ({
              ...state,
              exercises: mockExercises,
              isLoading: false,
              lastSyncTime: new Date(),
            }));
          } catch (error) {
            set((state) => ({
              ...state,
              error: 'Failed to fetch exercises',
              isLoading: false,
            }));
          }
        },

        getExerciseById: (id) => {
          return get().exercises.find(exercise => exercise.id === id);
        },

        searchExercises: (query, filters) => {
          const { exercises } = get();
          
          return exercises.filter(exercise => {
            // Text search
            const matchesQuery = query
              ? exercise.name.toLowerCase().includes(query.toLowerCase()) ||
                exercise.category.toLowerCase().includes(query.toLowerCase()) ||
                exercise.muscle_groups.some(muscle => 
                  muscle.toLowerCase().includes(query.toLowerCase())
                )
              : true;
            
            // Filters
            const matchesCategory = filters?.category
              ? exercise.category === filters.category
              : true;
            
            const matchesBodyParts = filters?.bodyParts?.length
              ? filters.bodyParts.some(part => exercise.body_parts.includes(part))
              : true;
            
            const matchesMuscleGroups = filters?.muscleGroups?.length
              ? filters.muscleGroups.some(muscle => exercise.muscle_groups.includes(muscle))
              : true;
            
            const matchesEquipment = filters?.equipment
              ? exercise.equipment === filters.equipment
              : true;
            
            const matchesDifficulty = filters?.difficulty
              ? exercise.difficulty_level === filters.difficulty
              : true;
            
            const matchesType = filters?.type
              ? exercise.type === filters.type
              : true;
            
            return matchesQuery && matchesCategory && matchesBodyParts && 
                   matchesMuscleGroups && matchesEquipment && matchesDifficulty &&
                   matchesType;
          });
        },

        syncExercises: async () => {
          const { lastSyncTime } = get();
          
          set((state) => ({
            ...state,
            isLoading: true,
            error: null,
          }));

          try {
            // In a real app, this would be an API call with the lastSyncTime
            // For now, we'll just simulate a sync
            await new Promise(resolve => setTimeout(resolve, 500));

            // If we had new or updated exercises, we would merge them here
            // For now, we'll just update the lastSyncTime
            set((state) => ({
              ...state,
              isLoading: false,
              lastSyncTime: new Date(),
            }));
          } catch (error) {
            set((state) => ({
              ...state,
              error: 'Failed to sync exercises',
              isLoading: false,
            }));
          }
        },

        clearError: () => {
          set((state) => ({
            ...state,
            error: null,
          }));
        },
      }),
      {
        name: 'fitness-exercise-storage',
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