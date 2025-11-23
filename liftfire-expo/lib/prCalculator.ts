import { supabase } from './supabase';

/**
 * Calculate estimated 1RM (one-rep max) using the Epley formula
 * Formula: weight × (1 + reps / 30)
 * 
 * @param weight - Weight lifted in the exercise
 * @param reps - Number of repetitions performed
 * @returns Estimated 1RM value
 */
export const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
};

/**
 * Detect if a new personal record was achieved for a specific exercise
 * 
 * @param userId - User ID
 * @param exerciseId - Exercise identifier (can be exercise name or ID)
 * @param weight - Weight lifted
 * @param reps - Number of repetitions performed
 * @returns Promise<boolean> - True if this is a new PR, false otherwise
 */
export const detectPR = async (
  userId: string,
  exerciseId: string,
  weight: number,
  reps: number
): Promise<boolean> => {
  const new1RM = calculate1RM(weight, reps);
  
  // Get previous best PR for this exercise
  const { data: previousPR, error } = await supabase
    .from('personal_records')
    .select('estimated_1rm')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .order('estimated_1rm', { ascending: false })
    .limit(1)
    .single();
  
  // If no previous PR exists, this is the first PR
  if (error || !previousPR) return true;
  
  // Check if new 1RM is better than previous best
  return new1RM > previousPR.estimated_1rm;
};

/**
 * Calculate improvement percentage between two 1RM values
 * 
 * @param oldValue - Previous 1RM value
 * @param newValue - New 1RM value
 * @returns Improvement percentage (e.g., 5.5 for 5.5% improvement)
 */
export const calculateImprovement = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return 100;
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Save a new personal record to the database
 * 
 * @param userId - User ID
 * @param exerciseId - Exercise identifier
 * @param exerciseName - Exercise name
 * @param weight - Weight lifted
 * @param reps - Number of repetitions
 * @param workoutId - Associated workout ID
 * @returns Promise<PersonalRecord | null> - The created PR or null on error
 */
export const savePR = async (
  userId: string,
  exerciseId: string,
  exerciseName: string,
  weight: number,
  reps: number,
  workoutId: string
) => {
  const estimated1RM = calculate1RM(weight, reps);
  
  const { data, error } = await supabase
    .from('personal_records')
    .insert({
      user_id: userId,
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      weight,
      reps,
      estimated_1rm: estimated1RM,
      workout_id: workoutId,
      achieved_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('[savePR] Failed to save PR:', error);
    return null;
  }
  
  return data;
};

/**
 * Compare current exercise performance against user's personal record
 * Returns comparison data useful for UI display (badges, progress indicators)
 * 
 * @param userId - User ID
 * @param exerciseId - Exercise identifier
 * @param weight - Current weight lifted
 * @param reps - Current reps performed
 * @returns Promise<PRComparison> - Comparison data including if it's a PR and improvement percentage
 */
export const compareToPR = async (
  userId: string,
  exerciseId: string,
  weight: number,
  reps: number
): Promise<{
  isNewPR: boolean;
  currentEstimated1RM: number;
  previousBest1RM: number | null;
  improvement: number | null;
  percentageOfPR: number | null;
}> => {
  const currentEstimated1RM = calculate1RM(weight, reps);
  
  // Get previous best PR
  const { data: previousPR, error } = await supabase
    .from('personal_records')
    .select('estimated_1rm')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .order('estimated_1rm', { ascending: false })
    .limit(1)
    .single();
  
  // No previous PR exists
  if (error || !previousPR) {
    return {
      isNewPR: true,
      currentEstimated1RM,
      previousBest1RM: null,
      improvement: null,
      percentageOfPR: null,
    };
  }
  
  const previousBest1RM = previousPR.estimated_1rm;
  const isNewPR = currentEstimated1RM > previousBest1RM;
  const improvement = isNewPR ? calculateImprovement(previousBest1RM, currentEstimated1RM) : null;
  const percentageOfPR = (currentEstimated1RM / previousBest1RM) * 100;
  
  return {
    isNewPR,
    currentEstimated1RM,
    previousBest1RM,
    improvement,
    percentageOfPR,
  };
};

/**
 * Get the user's personal record for a specific exercise
 * 
 * @param userId - User ID
 * @param exerciseId - Exercise identifier
 * @returns Promise<PersonalRecord | null> - The PR record or null if none exists
 */
export const getPRForExercise = async (
  userId: string,
  exerciseId: string
): Promise<any | null> => {
  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .order('estimated_1rm', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data;
};

/**
 * Detect and save PRs for all exercises in a workout
 * 
 * @param userId - User ID
 * @param workoutId - Workout ID
 * @param exercises - Array of exercises from the workout
 * @returns Promise<Array<{ exerciseName: string; improvement: number }>> - Array of PRs achieved
 */
export const detectAndSavePRs = async (
  userId: string,
  workoutId: string,
  exercises: Array<{ name: string; sets: number; reps: number; weight?: number }>
) => {
  const prsAchieved: Array<{ exerciseName: string; improvement: number }> = [];
  
  // Process each exercise
  for (const exercise of exercises) {
    // Skip exercises without weight
    if (!exercise.weight || exercise.weight <= 0) continue;
    
    // Use exercise name as ID (normalized)
    const exerciseId = exercise.name.toLowerCase().trim();
    
    try {
      // Check if this is a PR
      const isPR = await detectPR(userId, exerciseId, exercise.weight, exercise.reps);
      
      if (isPR) {
        // Get previous best to calculate improvement
        const { data: previousPR } = await supabase
          .from('personal_records')
          .select('estimated_1rm')
          .eq('user_id', userId)
          .eq('exercise_id', exerciseId)
          .order('estimated_1rm', { ascending: false })
          .limit(1)
          .single();
        
        const new1RM = calculate1RM(exercise.weight, exercise.reps);
        const improvement = previousPR 
          ? calculateImprovement(previousPR.estimated_1rm, new1RM)
          : 100; // First PR = 100% improvement
        
        // Save the PR
        const savedPR = await savePR(
          userId,
          exerciseId,
          exercise.name,
          exercise.weight,
          exercise.reps,
          workoutId
        );
        
        if (savedPR) {
          prsAchieved.push({
            exerciseName: exercise.name,
            improvement,
          });
        }
      }
    } catch (error) {
      console.error(`[detectAndSavePRs] Failed to process PR for ${exercise.name}:`, error);
      // Continue processing other exercises even if one fails
    }
  }
  
  return prsAchieved;
};
