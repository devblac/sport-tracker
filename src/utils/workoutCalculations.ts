import type { Workout, WorkoutExercise, SetData } from '@/types';
import { logger } from './logger';

/**
 * Calculate volume for a single set (weight × reps)
 */
export function calculateSetVolume(set: SetData): number {
  if (set.type === 'warmup' || !set.completed) {
    return 0;
  }
  return set.weight * set.reps;
}

/**
 * Calculate total volume for an exercise (sum of all completed sets)
 */
export function calculateExerciseVolume(workoutExercise: WorkoutExercise): number {
  return workoutExercise.sets
    .filter(set => set.completed && set.type !== 'warmup')
    .reduce((total, set) => total + calculateSetVolume(set), 0);
}

/**
 * Calculate total volume for entire workout
 */
export function calculateWorkoutVolume(workout: Workout): number {
  return workout.exercises.reduce((total, exercise) => {
    return total + calculateExerciseVolume(exercise);
  }, 0);
}

/**
 * Calculate total number of working sets (excluding warmup sets)
 */
export function calculateWorkingSets(workout: Workout): number {
  return workout.exercises.reduce((total, exercise) => {
    const workingSets = exercise.sets.filter(set => 
      set.completed && set.type !== 'warmup'
    ).length;
    return total + workingSets;
  }, 0);
}

/**
 * Calculate total number of reps (excluding warmup sets)
 */
export function calculateTotalReps(workout: Workout): number {
  return workout.exercises.reduce((total, exercise) => {
    const exerciseReps = exercise.sets
      .filter(set => set.completed && set.type !== 'warmup')
      .reduce((reps, set) => reps + set.reps, 0);
    return total + exerciseReps;
  }, 0);
}

/**
 * Calculate workout duration in seconds
 */
export function calculateWorkoutDuration(workout: Workout): number {
  if (!workout.started_at) return 0;
  
  const endTime = workout.completed_at || new Date();
  const startTime = workout.started_at;
  
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
}

/**
 * Calculate estimated 1RM using Epley formula
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  // Validate inputs
  if (weight < 0 || reps < 0 || !Number.isFinite(weight) || !Number.isFinite(reps)) {
    return 0;
  }
  
  if (reps === 1) return weight;
  if (reps === 0 || weight === 0) return 0;
  
  // Standard Epley formula: 1RM = weight × (1 + reps/30)
  const oneRM = weight * (1 + reps / 30);
  
  // Ensure result is finite and positive
  return Number.isFinite(oneRM) && oneRM > 0 ? Math.round(oneRM) : 0;
}

/**
 * Calculate relative intensity (% of 1RM)
 */
export function calculateRelativeIntensity(weight: number, reps: number, oneRepMax: number): number {
  if (oneRepMax === 0) return 0;
  return Math.round((weight / oneRepMax) * 100);
}

/**
 * Calculate average RPE for an exercise
 */
export function calculateAverageRPE(workoutExercise: WorkoutExercise): number | null {
  const setsWithRPE = workoutExercise.sets.filter(set => 
    set.completed && set.rpe !== undefined && set.type !== 'warmup'
  );
  
  if (setsWithRPE.length === 0) return null;
  
  const totalRPE = setsWithRPE.reduce((sum, set) => sum + (set.rpe || 0), 0);
  return Math.round((totalRPE / setsWithRPE.length) * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate workout intensity score (average RPE weighted by volume)
 */
export function calculateWorkoutIntensity(workout: Workout): number | null {
  let totalWeightedRPE = 0;
  let totalVolume = 0;
  
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (set.completed && set.rpe && set.type !== 'warmup') {
        const setVolume = calculateSetVolume(set);
        totalWeightedRPE += set.rpe * setVolume;
        totalVolume += setVolume;
      }
    }
  }
  
  if (totalVolume === 0) return null;
  
  return Math.round((totalWeightedRPE / totalVolume) * 10) / 10;
}

/**
 * Calculate rest time between sets
 */
export function calculateRestTime(previousSet: SetData, currentSet: SetData): number {
  if (!previousSet.ended_at || !currentSet.started_at) return 0;
  
  return Math.floor((currentSet.started_at.getTime() - previousSet.ended_at.getTime()) / 1000);
}

/**
 * Calculate average rest time for an exercise
 */
export function calculateAverageRestTime(workoutExercise: WorkoutExercise): number {
  const restTimes: number[] = [];
  
  for (let i = 1; i < workoutExercise.sets.length; i++) {
    const restTime = calculateRestTime(workoutExercise.sets[i - 1], workoutExercise.sets[i]);
    if (restTime > 0) {
      restTimes.push(restTime);
    }
  }
  
  if (restTimes.length === 0) return 0;
  
  return Math.round(restTimes.reduce((sum, time) => sum + time, 0) / restTimes.length);
}

/**
 * Calculate tonnage (total weight moved) for workout
 */
export function calculateTonnage(workout: Workout): number {
  return workout.exercises.reduce((total, exercise) => {
    const exerciseTonnage = exercise.sets
      .filter(set => set.completed && set.type !== 'warmup')
      .reduce((tonnage, set) => tonnage + (set.weight * set.reps), 0);
    return total + exerciseTonnage;
  }, 0);
}

/**
 * Calculate workout completion percentage
 */
export function calculateWorkoutCompletion(workout: Workout): number {
  if (workout.exercises.length === 0) return 0;
  
  let totalSets = 0;
  let completedSets = 0;
  
  workout.exercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      totalSets++;
      if (set.completed) completedSets++;
    });
  });
  
  return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
}

/**
 * Find personal records in a workout
 */
export interface PersonalRecord {
  exerciseId: string;
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'max_1rm';
  value: number;
  setData: SetData;
  previousRecord?: number;
}

export function findPersonalRecords(
  workout: Workout, 
  previousRecords: Record<string, Record<string, number>> = {}
): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  
  // Only find records if previous records are provided
  if (Object.keys(previousRecords).length === 0) {
    return records;
  }
  
  workout.exercises.forEach(exercise => {
    const exerciseRecords = previousRecords[exercise.exercise_id] || {};
    
    // Only check for records if this exercise has previous records
    if (Object.keys(exerciseRecords).length === 0) {
      return;
    }
    
    const workingSets = exercise.sets.filter(set => set.completed && set.type !== 'warmup');
    
    // Skip if no working sets
    if (workingSets.length === 0) {
      return;
    }
    
    // Find the best values in this workout
    const maxWeight = Math.max(...workingSets.map(set => set.weight));
    const maxReps = Math.max(...workingSets.map(set => set.reps));
    const max1RM = Math.max(...workingSets.map(set => calculateOneRepMax(set.weight, set.reps)));
    
    // Check for max weight record
    const currentMaxWeight = exerciseRecords.max_weight;
    if (currentMaxWeight !== undefined && maxWeight > currentMaxWeight) {
      const bestWeightSet = workingSets.find(set => set.weight === maxWeight)!;
      records.push({
        exerciseId: exercise.exercise_id,
        type: 'max_weight',
        value: maxWeight,
        setData: bestWeightSet,
        previousRecord: currentMaxWeight,
      });
    }
    
    // Check for max reps record
    const currentMaxReps = exerciseRecords.max_reps;
    if (currentMaxReps !== undefined && maxReps > currentMaxReps) {
      const bestRepsSet = workingSets.find(set => set.reps === maxReps)!;
      records.push({
        exerciseId: exercise.exercise_id,
        type: 'max_reps',
        value: maxReps,
        setData: bestRepsSet,
        previousRecord: currentMaxReps,
      });
    }
    
    // Check for max 1RM record
    const currentMax1RM = exerciseRecords.max_1rm;
    if (currentMax1RM !== undefined && max1RM > currentMax1RM) {
      const best1RMSet = workingSets.find(set => calculateOneRepMax(set.weight, set.reps) === max1RM)!;
      records.push({
        exerciseId: exercise.exercise_id,
        type: 'max_1rm',
        value: max1RM,
        setData: best1RMSet,
        previousRecord: currentMax1RM,
      });
    }
    
    // Check for max volume record
    const exerciseVolume = calculateExerciseVolume(exercise);
    const currentMaxVolume = exerciseRecords.max_volume;
    if (currentMaxVolume !== undefined && exerciseVolume > currentMaxVolume) {
      records.push({
        exerciseId: exercise.exercise_id,
        type: 'max_volume',
        value: exerciseVolume,
        setData: exercise.sets[0], // Use first set as reference
        previousRecord: currentMaxVolume,
      });
    }
  });
  
  return records;
}

/**
 * Calculate workout metrics summary
 */
export interface WorkoutMetrics {
  duration: number; // seconds
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  tonnage: number;
  averageIntensity: number | null;
  completion: number; // percentage
  personalRecords: PersonalRecord[];
}

export function calculateWorkoutMetrics(
  workout: Workout,
  previousRecords?: Record<string, Record<string, number>>
): WorkoutMetrics {
  try {
    // Validate workout input
    if (!workout || !workout.exercises || !Array.isArray(workout.exercises)) {
      throw new Error('Invalid workout data');
    }

    return {
      duration: calculateWorkoutDuration(workout),
      totalVolume: calculateWorkoutVolume(workout),
      totalSets: calculateWorkingSets(workout),
      totalReps: calculateTotalReps(workout),
      tonnage: calculateTonnage(workout),
      averageIntensity: calculateWorkoutIntensity(workout),
      completion: calculateWorkoutCompletion(workout),
      personalRecords: findPersonalRecords(workout, previousRecords || {}),
    };
  } catch (error) {
    logger.error('Error calculating workout metrics', error);
    return {
      duration: 0,
      totalVolume: 0,
      totalSets: 0,
      totalReps: 0,
      tonnage: 0,
      averageIntensity: null,
      completion: 0,
      personalRecords: [],
    };
  }
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

/**
 * Format weight with appropriate units
 */
export function formatWeight(weight: number, unit: 'kg' | 'lbs' = 'kg'): string {
  return `${weight}${unit}`;
}

/**
 * Format volume with appropriate units
 */
export function formatVolume(volume: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k${unit}`;
  }
  return `${volume}${unit}`;
}