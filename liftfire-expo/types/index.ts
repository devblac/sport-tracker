// Core type definitions for LiftFire MVP

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
