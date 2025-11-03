// Core type definitions for LiftFire MVP
import { z } from 'zod';

export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  notes?: string;
  duration_minutes?: number;
  xp_earned: number;
  completed_at: string;
  created_at: string;
  synced: boolean;
  exercises?: Exercise[];
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  friend?: User;
}

export interface Like {
  id: string;
  user_id: string;
  workout_id: string;
  created_at: string;
}

export interface FriendWorkout extends Workout {
  user?: User;
  likes_count?: number;
  liked_by_me?: boolean;
}

export interface LeaderboardEntry {
  username: string;
  xp_week: number;
  workouts_week: number;
  rank: number;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description?: string;
  unlocked_at: string;
}

// Achievement definition (for checking unlock conditions)
export interface AchievementDefinition {
  type: string;
  title: string;
  description: string;
  icon: string;
  checkUnlock: (stats: UserStats) => boolean;
}

// User stats for achievement checking
export interface UserStats {
  workoutCount: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
}

// Validation schemas for workout creation and updates
export const CreateWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100, 'Workout name too long'),
  notes: z.string().max(500, 'Notes too long').optional(),
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute').max(600, 'Duration too long').optional(),
  exercises: z.array(z.object({
    name: z.string().min(1, 'Exercise name is required').max(100, 'Exercise name too long'),
    sets: z.number().min(1, 'Sets must be at least 1').max(50, 'Too many sets'),
    reps: z.number().min(1, 'Reps must be at least 1').max(1000, 'Too many reps'),
    weight: z.number().min(0, 'Weight cannot be negative').max(2000, 'Weight too high').optional(),
    notes: z.string().max(200, 'Exercise notes too long').optional(),
  })).min(1, 'At least one exercise is required'),
});

export const UpdateWorkoutSchema = CreateWorkoutSchema.partial().extend({
  id: z.string().uuid('Invalid workout ID'),
});

export const CreateExerciseSchema = z.object({
  workout_id: z.string().uuid('Invalid workout ID'),
  name: z.string().min(1, 'Exercise name is required').max(100, 'Exercise name too long'),
  sets: z.number().min(1, 'Sets must be at least 1').max(50, 'Too many sets'),
  reps: z.number().min(1, 'Reps must be at least 1').max(1000, 'Too many reps'),
  weight: z.number().min(0, 'Weight cannot be negative').max(2000, 'Weight too high').optional(),
  notes: z.string().max(200, 'Exercise notes too long').optional(),
});

export type CreateWorkoutInput = z.infer<typeof CreateWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof UpdateWorkoutSchema>;
export type CreateExerciseInput = z.infer<typeof CreateExerciseSchema>;
