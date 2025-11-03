// Exercise library with default exercises
// Simplified for MVP - basic exercise data only

import { ExerciseLibraryItem } from '../types';

// Default exercise library (20 essential exercises)
export const DEFAULT_EXERCISES: ExerciseLibraryItem[] = [
  // CHEST
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'strength',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    equipment: 'barbell',
    difficulty: 3,
    instructions: 'Lie on bench, grip bar shoulder-width apart, lower to chest, press up',
  },
  {
    id: 'push-ups',
    name: 'Push-ups',
    category: 'strength',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    equipment: 'bodyweight',
    difficulty: 1,
    instructions: 'Start in plank position, lower chest to ground, push back up',
  },
  {
    id: 'dumbbell-press',
    name: 'Dumbbell Bench Press',
    category: 'strength',
    muscle_groups: ['chest', 'triceps', 'shoulders'],
    equipment: 'dumbbell',
    difficulty: 2,
    instructions: 'Use dumbbells instead of barbell for greater range of motion',
  },
  
  // BACK
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'strength',
    muscle_groups: ['back', 'glutes', 'hamstrings'],
    equipment: 'barbell',
    difficulty: 4,
    instructions: 'Stand with feet hip-width, grip bar, lift by extending hips and knees',
  },
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    category: 'strength',
    muscle_groups: ['back', 'biceps'],
    equipment: 'bodyweight',
    difficulty: 4,
    instructions: 'Hang from bar, pull body up until chin over bar',
  },
  {
    id: 'bent-over-row',
    name: 'Bent-over Row',
    category: 'strength',
    muscle_groups: ['back', 'biceps'],
    equipment: 'barbell',
    difficulty: 3,
    instructions: 'Bend at hips, pull bar to lower chest',
  },
  
  // LEGS
  {
    id: 'squat',
    name: 'Squat',
    category: 'strength',
    muscle_groups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: 'barbell',
    difficulty: 4,
    instructions: 'Stand with bar on shoulders, squat down and up',
  },
  {
    id: 'lunges',
    name: 'Lunges',
    category: 'strength',
    muscle_groups: ['quadriceps', 'glutes'],
    equipment: 'bodyweight',
    difficulty: 2,
    instructions: 'Step forward into lunge position, return to start',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'strength',
    muscle_groups: ['quadriceps', 'glutes'],
    equipment: 'machine',
    difficulty: 2,
    instructions: 'Sit in machine, press weight with legs',
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'strength',
    muscle_groups: ['hamstrings', 'glutes'],
    equipment: 'barbell',
    difficulty: 3,
    instructions: 'Keep legs straight, hinge at hips, lower bar',
  },
  
  // SHOULDERS
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: 'strength',
    muscle_groups: ['shoulders', 'triceps'],
    equipment: 'barbell',
    difficulty: 3,
    instructions: 'Press bar from shoulders to overhead',
  },
  {
    id: 'lateral-raises',
    name: 'Lateral Raises',
    category: 'strength',
    muscle_groups: ['shoulders'],
    equipment: 'dumbbell',
    difficulty: 2,
    instructions: 'Raise dumbbells to sides until parallel to floor',
  },
  
  // ARMS
  {
    id: 'bicep-curls',
    name: 'Bicep Curls',
    category: 'strength',
    muscle_groups: ['biceps'],
    equipment: 'dumbbell',
    difficulty: 1,
    instructions: 'Curl dumbbells up, squeeze biceps',
  },
  {
    id: 'tricep-dips',
    name: 'Tricep Dips',
    category: 'strength',
    muscle_groups: ['triceps', 'chest'],
    equipment: 'bodyweight',
    difficulty: 2,
    instructions: 'Lower and raise body using triceps',
  },
  {
    id: 'hammer-curls',
    name: 'Hammer Curls',
    category: 'strength',
    muscle_groups: ['biceps', 'forearms'],
    equipment: 'dumbbell',
    difficulty: 1,
    instructions: 'Curl dumbbells with neutral grip',
  },
  
  // CORE
  {
    id: 'plank',
    name: 'Plank',
    category: 'strength',
    muscle_groups: ['core'],
    equipment: 'bodyweight',
    difficulty: 1,
    instructions: 'Hold plank position, keep body straight',
  },
  {
    id: 'crunches',
    name: 'Crunches',
    category: 'strength',
    muscle_groups: ['core'],
    equipment: 'bodyweight',
    difficulty: 1,
    instructions: 'Lie on back, curl upper body towards knees',
  },
  
  // CARDIO
  {
    id: 'running',
    name: 'Running',
    category: 'cardio',
    muscle_groups: ['legs'],
    equipment: 'none',
    difficulty: 2,
    instructions: 'Run at steady pace for duration',
  },
  {
    id: 'cycling',
    name: 'Cycling',
    category: 'cardio',
    muscle_groups: ['legs'],
    equipment: 'machine',
    difficulty: 2,
    instructions: 'Cycle at steady pace for duration',
  },
  {
    id: 'jump-rope',
    name: 'Jump Rope',
    category: 'cardio',
    muscle_groups: ['legs', 'shoulders'],
    equipment: 'other',
    difficulty: 2,
    instructions: 'Jump rope continuously for duration',
  },
];

// Filter exercises by category
export const getExercisesByCategory = (category: string): ExerciseLibraryItem[] => {
  return DEFAULT_EXERCISES.filter(ex => ex.category === category);
};

// Filter exercises by muscle group
export const getExercisesByMuscleGroup = (muscleGroup: string): ExerciseLibraryItem[] => {
  return DEFAULT_EXERCISES.filter(ex => 
    ex.muscle_groups.includes(muscleGroup)
  );
};

// Filter exercises by equipment
export const getExercisesByEquipment = (equipment: string): ExerciseLibraryItem[] => {
  return DEFAULT_EXERCISES.filter(ex => ex.equipment === equipment);
};

// Search exercises by name
export const searchExercises = (query: string): ExerciseLibraryItem[] => {
  const lowerQuery = query.toLowerCase();
  return DEFAULT_EXERCISES.filter(ex =>
    ex.name.toLowerCase().includes(lowerQuery)
  );
};

// Get exercise by ID
export const getExerciseById = (id: string): ExerciseLibraryItem | undefined => {
  return DEFAULT_EXERCISES.find(ex => ex.id === id);
};
