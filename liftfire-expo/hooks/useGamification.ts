/**
 * Gamification Hook - MVP Version
 * 
 * Manages user XP, level, streak, and achievements.
 * Provides functions to update gamification data after workout completion.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateLevel, getLevelInfo, calculateWorkoutXP } from '../lib/gamification';
import { updateStreakAfterWorkout } from '../lib/streaks';
import { checkNewAchievements, getAchievementProgress } from '../lib/achievements';
import type { User, Achievement, UserStats } from '../types';

interface GamificationData {
  xp: number;
  level: number;
  levelProgress: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  loading: boolean;
  error: string | null;
}

interface UseGamificationReturn extends GamificationData {
  refreshGamification: () => Promise<void>;
  updateAfterWorkout: (workoutId: string, durationMinutes: number, exerciseCount: number) => Promise<void>;
}

/**
 * Hook for managing gamification features
 * 
 * Fetches and manages user XP, level, streak, and achievements.
 * Provides function to update gamification data after workout completion.
 */
export function useGamification(): UseGamificationReturn {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(100);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user gamification data from Supabase
   */
  const fetchGamificationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Fetch user profile with XP and streak data
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('xp, level, current_streak, longest_streak')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Update XP and level
      const userXP = profile?.xp || 0;
      const userLevel = profile?.level || 1;
      setXp(userXP);
      setLevel(userLevel);

      // Calculate level progress
      const levelInfo = getLevelInfo(userXP);
      setLevelProgress(levelInfo.progress);
      setXpToNextLevel(levelInfo.xpToNextLevel);

      // Update streak data
      setCurrentStreak(profile?.current_streak || 0);
      setLongestStreak(profile?.longest_streak || 0);

      // Fetch user achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (achievementsError) throw achievementsError;

      setAchievements(achievementsData || []);
    } catch (err) {
      console.error('Error fetching gamification data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update gamification data after workout completion
   * 
   * This function:
   * 1. Calculates XP earned from the workout
   * 2. Updates user XP and level
   * 3. Recalculates streak
   * 4. Checks for new achievements
   * 5. Awards new achievements
   */
  const updateAfterWorkout = useCallback(async (
    workoutId: string,
    durationMinutes: number,
    exerciseCount: number
  ) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Fetch all workout dates for streak calculation
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (workoutsError) throw workoutsError;

      const workoutDates = workouts?.map(w => new Date(w.completed_at)) || [];

      // Calculate new streak
      const streakUpdate = updateStreakAfterWorkout(workoutDates);

      // Calculate XP earned
      const xpEarned = calculateWorkoutXP(
        durationMinutes,
        exerciseCount,
        streakUpdate.current_streak
      );

      // Update workout with XP earned
      const { error: workoutUpdateError } = await supabase
        .from('workouts')
        .update({ xp_earned: xpEarned })
        .eq('id', workoutId);

      if (workoutUpdateError) throw workoutUpdateError;

      // Calculate new total XP and level
      const newTotalXP = xp + xpEarned;
      const newLevel = calculateLevel(newTotalXP);

      // Update user profile
      const { error: profileUpdateError } = await supabase
        .from('users')
        .update({
          xp: newTotalXP,
          level: newLevel,
          current_streak: streakUpdate.current_streak,
          longest_streak: streakUpdate.longest_streak,
        })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      // Check for new achievements
      const workoutCount = workouts?.length || 0;
      const userStats: UserStats = {
        workoutCount,
        currentStreak: streakUpdate.current_streak,
        longestStreak: streakUpdate.longest_streak,
        totalXP: newTotalXP,
        level: newLevel,
      };

      const unlockedAchievementTypes = achievements.map(a => a.achievement_type);
      const newAchievementTypes = checkNewAchievements(userStats, unlockedAchievementTypes);

      // Award new achievements
      if (newAchievementTypes.length > 0) {
        const newAchievements = newAchievementTypes.map(type => {
          const definition = getAchievementProgress(userStats, unlockedAchievementTypes)
            .find(a => a.type === type);

          return {
            user_id: user.id,
            achievement_type: type,
            title: definition?.title || type,
            description: definition?.description || '',
          };
        });

        const { error: achievementsError } = await supabase
          .from('achievements')
          .insert(newAchievements);

        if (achievementsError) {
          console.error('Error awarding achievements:', achievementsError);
        }
      }

      // Refresh gamification data
      await fetchGamificationData();
    } catch (err) {
      console.error('Error updating gamification after workout:', err);
      throw err;
    }
  }, [xp, achievements, fetchGamificationData]);

  /**
   * Refresh gamification data
   */
  const refreshGamification = useCallback(async () => {
    await fetchGamificationData();
  }, [fetchGamificationData]);

  // Fetch data on mount
  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  return {
    xp,
    level,
    levelProgress,
    xpToNextLevel,
    currentStreak,
    longestStreak,
    achievements,
    loading,
    error,
    refreshGamification,
    updateAfterWorkout,
  };
}
