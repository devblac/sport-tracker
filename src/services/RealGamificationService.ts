/**
 * Real Gamification Service
 * 
 * Production-ready gamification service using Supabase backend.
 * Replaces MockGamificationService with real database operations.
 */

import { supabaseService } from './SupabaseService';
import { logger } from '@/utils/logger';
import type { 
  Achievement, 
  UserAchievement, 
  XPTransaction,
  StreakReward 
} from '@/types/gamification';

export interface XPSource {
  workout_completed: number;
  achievement_unlocked: number;
  streak_milestone: number;
  social_interaction: number;
  first_workout: number;
  personal_record: number;
  challenge_completed: number;
  friend_referral: number;
}

export interface LevelConfig {
  xpRequired: number;
  rewards: string[];
  title: string;
}

export class RealGamificationService {
  private static instance: RealGamificationService;
  
  private readonly XP_SOURCES: XPSource = {
    workout_completed: 50,
    achievement_unlocked: 100,
    streak_milestone: 25,
    social_interaction: 10,
    first_workout: 100,
    personal_record: 75,
    challenge_completed: 200,
    friend_referral: 150
  };

  private readonly LEVEL_CONFIG: Record<number, LevelConfig> = {
    1: { xpRequired: 0, rewards: [], title: 'Beginner' },
    2: { xpRequired: 1000, rewards: ['streak_shield'], title: 'Novice' },
    3: { xpRequired: 2500, rewards: ['custom_avatar'], title: 'Apprentice' },
    4: { xpRequired: 5000, rewards: ['workout_templates'], title: 'Intermediate' },
    5: { xpRequired: 10000, rewards: ['advanced_stats'], title: 'Advanced' },
    10: { xpRequired: 25000, rewards: ['premium_features'], title: 'Expert' },
    15: { xpRequired: 50000, rewards: ['mentor_badge'], title: 'Master' },
    20: { xpRequired: 100000, rewards: ['legend_status'], title: 'Legend' }
  };

  private constructor() {}

  public static getInstance(): RealGamificationService {
    if (!RealGamificationService.instance) {
      RealGamificationService.instance = new RealGamificationService();
    }
    return RealGamificationService.instance;
  }

  // ============================================================================
  // XP Management
  // ============================================================================

  async awardXP(userId: string, source: keyof XPSource, sourceId?: string, multiplier = 1): Promise<XPTransaction> {
    try {
      const baseAmount = this.XP_SOURCES[source];
      const finalAmount = Math.floor(baseAmount * multiplier);

      const transaction = await supabaseService.addXPTransaction(userId, {
        amount: finalAmount,
        source,
        source_id: sourceId,
        description: this.getXPDescription(source, finalAmount),
        base_amount: baseAmount,
        multiplier
      });

      // Check for level up
      await this.checkLevelUp(userId);

      logger.info('XP awarded', { userId, source, amount: finalAmount });
      return transaction;
    } catch (error) {
      logger.error('Failed to award XP', { error, userId, source });
      throw error;
    }
  }

  async getUserXP(userId: string): Promise<{ totalXP: number; currentLevel: number; currentXP: number }> {
    try {
      const profile = await supabaseService.getUserProfile(userId);
      
      return {
        totalXP: profile.total_xp || 0,
        currentLevel: profile.current_level || 1,
        currentXP: profile.current_xp || 0
      };
    } catch (error) {
      logger.error('Failed to get user XP', { error, userId });
      throw error;
    }
  }

  async getXPHistory(userId: string, limit = 50): Promise<XPTransaction[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('xp_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to get XP history', { error, userId });
      throw error;
    }
  }

  private async checkLevelUp(userId: string): Promise<boolean> {
    try {
      const { totalXP, currentLevel } = await this.getUserXP(userId);
      const newLevel = this.calculateLevel(totalXP);

      if (newLevel > currentLevel) {
        // Level up occurred
        await this.handleLevelUp(userId, currentLevel, newLevel);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to check level up', { error, userId });
      return false;
    }
  }

  private async handleLevelUp(userId: string, oldLevel: number, newLevel: number): Promise<void> {
    try {
      // Award level up achievement
      await this.checkAndUnlockAchievement(userId, 'level_up', { 
        old_level: oldLevel, 
        new_level: newLevel 
      });

      // Award milestone achievements
      if (newLevel === 5) {
        await this.checkAndUnlockAchievement(userId, 'level_5_milestone');
      } else if (newLevel === 10) {
        await this.checkAndUnlockAchievement(userId, 'level_10_milestone');
      } else if (newLevel === 20) {
        await this.checkAndUnlockAchievement(userId, 'level_20_milestone');
      }

      logger.info('Level up handled', { userId, oldLevel, newLevel });
    } catch (error) {
      logger.error('Failed to handle level up', { error, userId });
    }
  }

  private calculateLevel(totalXP: number): number {
    // Every 1000 XP = 1 level
    return Math.floor(totalXP / 1000) + 1;
  }

  private getXPDescription(source: keyof XPSource, amount: number): string {
    const descriptions: Record<keyof XPSource, string> = {
      workout_completed: `Completed workout (+${amount} XP)`,
      achievement_unlocked: `Achievement unlocked (+${amount} XP)`,
      streak_milestone: `Streak milestone reached (+${amount} XP)`,
      social_interaction: `Social interaction (+${amount} XP)`,
      first_workout: `First workout completed (+${amount} XP)`,
      personal_record: `Personal record set (+${amount} XP)`,
      challenge_completed: `Challenge completed (+${amount} XP)`,
      friend_referral: `Friend referred (+${amount} XP)`
    };

    return descriptions[source];
  }

  // ============================================================================
  // Achievement Management
  // ============================================================================

  async checkAndUnlockAchievement(userId: string, achievementKey: string, progress: any = {}): Promise<UserAchievement | null> {
    try {
      // Get achievement definition
      const { data: achievement, error: achievementError } = await supabaseService.supabase
        .from('achievements')
        .select('*')
        .eq('key', achievementKey)
        .single();

      if (achievementError || !achievement) {
        logger.warn('Achievement not found', { achievementKey });
        return null;
      }

      // Check if already unlocked
      const { data: existingAchievement } = await supabaseService.supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .eq('is_completed', true)
        .single();

      if (existingAchievement) {
        return existingAchievement;
      }

      // Check if requirements are met
      const requirementsMet = await this.checkAchievementRequirements(userId, achievement.requirements, progress);

      if (requirementsMet) {
        return await supabaseService.unlockAchievement(userId, achievement.id, progress);
      }

      return null;
    } catch (error) {
      logger.error('Failed to check achievement', { error, userId, achievementKey });
      return null;
    }
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      return await supabaseService.getUserAchievements(userId);
    } catch (error) {
      logger.error('Failed to get user achievements', { error, userId });
      throw error;
    }
  }

  async getAvailableAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to get available achievements', { error });
      throw error;
    }
  }

  private async checkAchievementRequirements(userId: string, requirements: any, progress: any): Promise<boolean> {
    try {
      if (!requirements || typeof requirements !== 'object') {
        return true;
      }

      // Check workout count requirements
      if (requirements.workout_count) {
        const workouts = await supabaseService.getUserWorkouts(userId, requirements.workout_count);
        if (workouts.length < requirements.workout_count) {
          return false;
        }
      }

      // Check streak requirements
      if (requirements.streak_length) {
        const currentStreak = await this.getCurrentStreak(userId);
        if (currentStreak < requirements.streak_length) {
          return false;
        }
      }

      // Check XP requirements
      if (requirements.total_xp) {
        const { totalXP } = await this.getUserXP(userId);
        if (totalXP < requirements.total_xp) {
          return false;
        }
      }

      // Check level requirements
      if (requirements.level) {
        const { currentLevel } = await this.getUserXP(userId);
        if (currentLevel < requirements.level) {
          return false;
        }
      }

      // Check social requirements
      if (requirements.social_posts) {
        const { data: posts } = await supabaseService.supabase
          .from('social_posts')
          .select('id')
          .eq('user_id', userId)
          .limit(requirements.social_posts);
        
        if (!posts || posts.length < requirements.social_posts) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Failed to check achievement requirements', { error, userId });
      return false;
    }
  }

  // ============================================================================
  // Streak Management
  // ============================================================================

  async getCurrentStreak(userId: string): Promise<number> {
    try {
      const { data, error } = await supabaseService.supabase.rpc('get_user_current_streak', {
        user_id: userId
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      logger.error('Failed to get current streak', { error, userId });
      return 0;
    }
  }

  async awardStreakMilestone(userId: string, streakLength: number): Promise<void> {
    try {
      // Award XP for streak milestone
      await this.awardXP(userId, 'streak_milestone', undefined, Math.floor(streakLength / 7));

      // Check for streak achievements
      if (streakLength === 7) {
        await this.checkAndUnlockAchievement(userId, 'week_streak');
      } else if (streakLength === 30) {
        await this.checkAndUnlockAchievement(userId, 'month_streak');
      } else if (streakLength === 100) {
        await this.checkAndUnlockAchievement(userId, 'hundred_day_streak');
      }

      logger.info('Streak milestone awarded', { userId, streakLength });
    } catch (error) {
      logger.error('Failed to award streak milestone', { error, userId, streakLength });
    }
  }

  // ============================================================================
  // Workout Integration
  // ============================================================================

  async handleWorkoutCompleted(userId: string, workoutId: string, workoutData: any): Promise<void> {
    try {
      // Award base workout XP
      let multiplier = 1;

      // Bonus for first workout
      const workouts = await supabaseService.getUserWorkouts(userId, 1);
      if (workouts.length === 1) {
        await this.awardXP(userId, 'first_workout', workoutId);
        await this.checkAndUnlockAchievement(userId, 'first_workout');
      } else {
        // Check for personal records
        if (workoutData.personal_records?.length > 0) {
          multiplier += 0.5; // 50% bonus for PR
          await this.awardXP(userId, 'personal_record', workoutId);
        }

        // Check for streak bonus
        const currentStreak = await this.getCurrentStreak(userId);
        if (currentStreak >= 7) {
          multiplier += 0.25; // 25% bonus for active streak
        }

        await this.awardXP(userId, 'workout_completed', workoutId, multiplier);
      }

      // Check workout-related achievements
      await this.checkWorkoutAchievements(userId, workoutData);

      logger.info('Workout completion handled', { userId, workoutId });
    } catch (error) {
      logger.error('Failed to handle workout completion', { error, userId, workoutId });
    }
  }

  private async checkWorkoutAchievements(userId: string, workoutData: any): Promise<void> {
    try {
      // Check total workout count achievements
      const totalWorkouts = await supabaseService.getUserWorkouts(userId, 1000);
      
      if (totalWorkouts.length === 10) {
        await this.checkAndUnlockAchievement(userId, 'ten_workouts');
      } else if (totalWorkouts.length === 50) {
        await this.checkAndUnlockAchievement(userId, 'fifty_workouts');
      } else if (totalWorkouts.length === 100) {
        await this.checkAndUnlockAchievement(userId, 'hundred_workouts');
      }

      // Check volume achievements
      if (workoutData.total_volume_kg >= 1000) {
        await this.checkAndUnlockAchievement(userId, 'heavy_lifter');
      }

      // Check duration achievements
      if (workoutData.duration_seconds >= 3600) { // 1 hour
        await this.checkAndUnlockAchievement(userId, 'endurance_warrior');
      }
    } catch (error) {
      logger.error('Failed to check workout achievements', { error, userId });
    }
  }

  // ============================================================================
  // Social Integration
  // ============================================================================

  async handleSocialInteraction(userId: string, interactionType: 'like' | 'comment' | 'share', targetId: string): Promise<void> {
    try {
      await this.awardXP(userId, 'social_interaction', targetId);

      // Check social achievements
      const { data: interactions } = await supabaseService.supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', userId)
        .limit(100);

      if (interactions && interactions.length >= 50) {
        await this.checkAndUnlockAchievement(userId, 'social_butterfly');
      }

      logger.info('Social interaction handled', { userId, interactionType, targetId });
    } catch (error) {
      logger.error('Failed to handle social interaction', { error, userId });
    }
  }

  // ============================================================================
  // Leaderboards
  // ============================================================================

  async getXPLeaderboard(limit = 10): Promise<any[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('user_profiles')
        .select('id, username, display_name, total_xp, current_level')
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to get XP leaderboard', { error });
      throw error;
    }
  }

  async getUserRank(userId: string): Promise<number> {
    try {
      const { data, error } = await supabaseService.supabase.rpc('get_user_xp_rank', {
        user_id: userId
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      logger.error('Failed to get user rank', { error, userId });
      return 0;
    }
  }

  // ============================================================================
  // User Statistics
  // ============================================================================

  async getUserStats(userId: string): Promise<any> {
    try {
      const profile = await supabaseService.getUserProfile(userId);
      const workouts = await supabaseService.getUserWorkouts(userId, 1000);
      const currentStreak = await this.getCurrentStreak(userId);
      
      // Calculate additional stats
      const totalWorkouts = workouts.length;
      const totalVolumeKg = workouts.reduce((sum, w) => sum + (w.total_volume_kg || 0), 0);
      const totalWorkoutTimeMinutes = workouts.reduce((sum, w) => sum + (w.duration_seconds || 0), 0) / 60;
      
      // Get unique exercises
      const uniqueExercises = new Set();
      workouts.forEach(workout => {
        workout.exercises?.forEach(exercise => {
          uniqueExercises.add(exercise.exercise_id);
        });
      });

      // Calculate longest streak
      let longestStreak = 0;
      let currentStreakCount = 0;
      const sortedWorkouts = workouts
        .map(w => new Date(w.created_at))
        .sort((a, b) => a.getTime() - b.getTime());

      for (let i = 0; i < sortedWorkouts.length; i++) {
        if (i === 0) {
          currentStreakCount = 1;
        } else {
          const daysDiff = Math.floor(
            (sortedWorkouts[i].getTime() - sortedWorkouts[i - 1].getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysDiff === 1) {
            currentStreakCount++;
          } else {
            longestStreak = Math.max(longestStreak, currentStreakCount);
            currentStreakCount = 1;
          }
        }
      }
      longestStreak = Math.max(longestStreak, currentStreakCount);

      // Calculate time-based stats
      const now = new Date();
      const earlyWorkouts = workouts.filter(w => {
        const workoutTime = new Date(w.created_at);
        return workoutTime.getHours() < 7;
      }).length;

      const lateWorkouts = workouts.filter(w => {
        const workoutTime = new Date(w.created_at);
        return workoutTime.getHours() >= 21;
      }).length;

      const shortWorkouts = workouts.filter(w => (w.duration_seconds || 0) < 1800).length; // < 30 min
      const longestWorkoutMinutes = Math.max(...workouts.map(w => (w.duration_seconds || 0) / 60), 0);

      const midnightWorkouts = workouts.filter(w => {
        const workoutTime = new Date(w.created_at);
        return workoutTime.getHours() === 0;
      }).length;

      // Get first workout date
      const firstWorkoutDate = sortedWorkouts.length > 0 ? sortedWorkouts[0] : null;

      return {
        userId,
        level: profile.current_level || 1,
        totalXP: profile.total_xp || 0,
        currentStreak,
        longestStreak,
        totalWorkouts,
        totalVolumeKg,
        totalWorkoutTimeMinutes,
        uniqueExercises: uniqueExercises.size,
        earlyWorkouts,
        lateWorkouts,
        shortWorkouts,
        longestWorkoutMinutes,
        midnightWorkouts,
        firstWorkoutDate,
        lastActive: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to get user stats', { error, userId });
      return {
        userId,
        level: 1,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        totalVolumeKg: 0,
        totalWorkoutTimeMinutes: 0,
        uniqueExercises: 0,
        earlyWorkouts: 0,
        lateWorkouts: 0,
        shortWorkouts: 0,
        longestWorkoutMinutes: 0,
        midnightWorkouts: 0,
        firstWorkoutDate: null,
        lastActive: new Date(),
        updatedAt: new Date()
      };
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  getLevelConfig(level: number): LevelConfig {
    return this.LEVEL_CONFIG[level] || { 
      xpRequired: level * 1000, 
      rewards: [], 
      title: `Level ${level}` 
    };
  }

  getXPForNextLevel(currentXP: number, currentLevel: number): number {
    const nextLevelXP = currentLevel * 1000;
    return Math.max(0, nextLevelXP - currentXP);
  }

  calculateProgress(currentXP: number, currentLevel: number): number {
    const levelStartXP = (currentLevel - 1) * 1000;
    const levelEndXP = currentLevel * 1000;
    const progressXP = currentXP - levelStartXP;
    const totalLevelXP = levelEndXP - levelStartXP;
    
    return Math.min(100, Math.max(0, (progressXP / totalLevelXP) * 100));
  }
}

// Export singleton instance
export const realGamificationService = RealGamificationService.getInstance();