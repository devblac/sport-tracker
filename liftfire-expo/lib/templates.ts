// Workout templates library
// Simplified for MVP - 4 default templates

import { WorkoutTemplate } from '../types';

// Default workout templates
export const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'template-push',
    user_id: 'system', // System templates
    name: 'Push Day',
    notes: 'Chest, shoulders, and triceps workout',
    is_template: true,
    category: 'strength',
    difficulty: 3,
    estimated_duration: 60,
    exercises: [
      {
        id: 'ex-1',
        exercise_id: 'bench-press',
        name: 'Bench Press',
        sets: 4,
        reps: 8,
        weight: null,
        notes: 'Warm up first',
      },
      {
        id: 'ex-2',
        exercise_id: 'overhead-press',
        name: 'Overhead Press',
        sets: 3,
        reps: 10,
        weight: null,
        notes: '',
      },
      {
        id: 'ex-3',
        exercise_id: 'lateral-raises',
        name: 'Lateral Raises',
        sets: 3,
        reps: 12,
        weight: null,
        notes: '',
      },
      {
        id: 'ex-4',
        exercise_id: 'tricep-dips',
        name: 'Tricep Dips',
        sets: 3,
        reps: 12,
        weight: null,
        notes: 'Bodyweight or weighted',
      },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-pull',
    user_id: 'system',
    name: 'Pull Day',
    notes: 'Back and biceps workout',
    is_template: true,
    category: 'strength',
    difficulty: 3,
    estimated_duration: 60,
    exercises: [
      {
        id: 'ex-1',
        exercise_id: 'deadlift',
        name: 'Deadlift',
        sets: 4,
        reps: 6,
        weight: null,
        notes: 'Focus on form',
      },
      {
        id: 'ex-2',
        exercise_id: 'pull-ups',
        name: 'Pull-ups',
        sets: 3,
        reps: 10,
        weight: null,
        notes: 'Use assistance if needed',
      },
      {
        id: 'ex-3',
        exercise_id: 'bent-over-row',
        name: 'Bent-over Row',
        sets: 3,
        reps: 10,
        weight: null,
        notes: '',
      },
      {
        id: 'ex-4',
        exercise_id: 'bicep-curls',
        name: 'Bicep Curls',
        sets: 3,
        reps: 12,
        weight: null,
        notes: '',
      },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-legs',
    user_id: 'system',
    name: 'Leg Day',
    notes: 'Complete lower body workout',
    is_template: true,
    category: 'strength',
    difficulty: 4,
    estimated_duration: 70,
    exercises: [
      {
        id: 'ex-1',
        exercise_id: 'squat',
        name: 'Squat',
        sets: 4,
        reps: 8,
        weight: null,
        notes: 'Go deep',
      },
      {
        id: 'ex-2',
        exercise_id: 'romanian-deadlift',
        name: 'Romanian Deadlift',
        sets: 3,
        reps: 10,
        weight: null,
        notes: 'Feel the hamstring stretch',
      },
      {
        id: 'ex-3',
        exercise_id: 'leg-press',
        name: 'Leg Press',
        sets: 3,
        reps: 12,
        weight: null,
        notes: '',
      },
      {
        id: 'ex-4',
        exercise_id: 'lunges',
        name: 'Lunges',
        sets: 3,
        reps: 10,
        weight: null,
        notes: 'Each leg',
      },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-fullbody',
    user_id: 'system',
    name: 'Full Body',
    notes: 'Complete full body workout for beginners',
    is_template: true,
    category: 'strength',
    difficulty: 2,
    estimated_duration: 50,
    exercises: [
      {
        id: 'ex-1',
        exercise_id: 'squat',
        name: 'Squat',
        sets: 3,
        reps: 10,
        weight: null,
        notes: '',
      },
      {
        id: 'ex-2',
        exercise_id: 'bench-press',
        name: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: null,
        notes: '',
      },
      {
        id: 'ex-3',
        exercise_id: 'bent-over-row',
        name: 'Bent-over Row',
        sets: 3,
        reps: 10,
        weight: null,
        notes: '',
      },
      {
        id: 'ex-4',
        exercise_id: 'overhead-press',
        name: 'Overhead Press',
        sets: 3,
        reps: 10,
        weight: null,
        notes: '',
      },
      {
        id: 'ex-5',
        exercise_id: 'plank',
        name: 'Plank',
        sets: 3,
        reps: 1,
        weight: null,
        notes: 'Hold for 30-60 seconds',
      },
    ],
    created_at: new Date().toISOString(),
  },
];

// Get all templates (system + user templates)
export const getAllTemplates = (): WorkoutTemplate[] => {
  return DEFAULT_TEMPLATES;
};

// Get template by ID
export const getTemplateById = (id: string): WorkoutTemplate | undefined => {
  return DEFAULT_TEMPLATES.find(t => t.id === id);
};

// Filter templates by category
export const getTemplatesByCategory = (category: string): WorkoutTemplate[] => {
  return DEFAULT_TEMPLATES.filter(t => t.category === category);
};

// Filter templates by difficulty
export const getTemplatesByDifficulty = (difficulty: number): WorkoutTemplate[] => {
  return DEFAULT_TEMPLATES.filter(t => t.difficulty === difficulty);
};
