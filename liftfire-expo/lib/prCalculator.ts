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
