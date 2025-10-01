/**
 * Supabase Service
 * 
 * Comprehensive service layer for all Supabase database operations.
 * Provides type-safe, validated, and optimized database interactions.
 */

import { supabase } from '@/lib/supabase';
import { ValidationService } from '@/db/services/ValidationService';
import { logger } from '@/utils/logger';
import type { 
  User as SupabaseUser,
  Session 
} from '@supabase/supabase-js';

// ============================================================================
// Core Database Service
// ============================================================================

export class SupabaseService {
  private static instance: SupabaseService;

  private constructor() {}

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // ============================================================================
  // User Profile Operations
  // ============================================================================

  async getUserProfile(userId: string) {
    try {
      ValidationService.checkRateLimit(userId, 'getUserProfile', 50, 60000);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Failed to get user profile', { error, userId });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('getUserProfile error', { error, userId });
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: any) {
    try {
      ValidationService.checkRateLimit(userId, 'updateUserProfile', 10, 60000);
      
      // Validate input data
      const validatedData = ValidationService.validateUserProfile(updates);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update user profile', { error, userId });
        throw error;
      }

      logger.info('User profile updated', { userId });
      return data;
    } catch (error) {
      logger.error('updateUserProfile error', { error, userId });
      throw error;
    }
  }

  async createUserProfile(profileData: any) {
    try {
      const validatedData = ValidationService.validateUserProfile(profileData);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          ...validatedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create user profile', { error });
        throw error;
      }

      logger.info('User profile created', { userId: data.id });
      return data;
    } catch (error) {
      logger.error('createUserProfile error', { error });
      throw error;
    }
  }

  // ============================================================================
  // Workout Operations
  // ============================================================================

  async createWorkoutSession(userId: string, workoutData: any) {
    try {
      ValidationService.checkRateLimit(userId, 'createWorkout', 20, 60000);
      ValidationService.validateOwnership(workoutData.user_id || userId, userId);
      
      const validatedData = ValidationService.validateWorkout(workoutData);
      
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          ...validatedData,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create workout session', { error, userId });
        throw error;
      }

      logger.info('Workout session created', { userId, workoutId: data.id });
      return data;
    } catch (error) {
      logger.error('createWorkoutSession error', { error, userId });
      throw error;
    }
  }

  async getUserWorkouts(userId: string, limit = 50, offset = 0) {
    try {
      ValidationService.checkRateLimit(userId, 'getUserWorkouts', 100, 60000);
      
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          template:workout_templates(*)
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Failed to get user workouts', { error, userId });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('getUserWorkouts error', { error, userId });
      throw error;
    }
  }

  async updateWorkoutSession(userId: string, workoutId: string, updates: any) {
    try {
      ValidationService.checkRateLimit(userId, 'updateWorkout', 30, 60000);
      
      // Verify ownership
      const { data: existingWorkout } = await supabase
        .from('workout_sessions')
        .select('user_id')
        .eq('id', workoutId)
        .single();

      if (existingWorkout) {
        ValidationService.validateOwnership(existingWorkout.user_id, userId);
      }

      const { data, error } = await supabase
        .from('workout_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', workoutId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update workout session', { error, userId, workoutId });
        throw error;
      }

      logger.info('Workout session updated', { userId, workoutId });
      return data;
    } catch (error) {
      logger.error('updateWorkoutSession error', { error, userId, workoutId });
      throw error;
    }
  }

  // ============================================================================
  // Exercise Operations
  // ============================================================================

  async getExercises(filters: any = {}, limit = 100, offset = 0) {
    try {
      let query = supabase
        .from('exercises')
        .select(`
          *,
          category:exercise_categories(*),
          equipment:equipment_types(*)
        `)
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.equipment_id) {
        query = query.eq('equipment_id', filters.equipment_id);
      }
      if (filters.difficulty_level) {
        query = query.eq('difficulty_level', filters.difficulty_level);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,name_es.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to get exercises', { error, filters });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('getExercises error', { error, filters });
      throw error;
    }
  }

  async getExerciseById(exerciseId: string) {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          *,
          category:exercise_categories(*),
          equipment:equipment_types(*)
        `)
        .eq('id', exerciseId)
        .single();

      if (error) {
        logger.error('Failed to get exercise', { error, exerciseId });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('getExerciseById error', { error, exerciseId });
      throw error;
    }
  }

  // ============================================================================
  // Social Operations
  // ============================================================================

  async createSocialPost(userId: string, postData: any) {
    try {
      ValidationService.checkRateLimit(userId, 'createPost', 10, 60000);
      
      const validatedData = ValidationService.validateSocialPost(postData);
      
      const { data, error } = await supabase
        .from('social_posts')
        .insert({
          ...validatedData,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          user:user_profiles(*)
        `)
        .single();

      if (error) {
        logger.error('Failed to create social post', { error, userId });
        throw error;
      }

      logger.info('Social post created', { userId, postId: data.id });
      return data;
    } catch (error) {
      logger.error('createSocialPost error', { error, userId });
      throw error;
    }
  }

  async getSocialFeed(userId: string, limit = 20, offset = 0) {
    try {
      ValidationService.checkRateLimit(userId, 'getSocialFeed', 50, 60000);
      
      // Get posts from friends and public posts
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          user:user_profiles(*),
          likes_count,
          comments_count
        `)
        .or(`visibility.eq.public,user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Failed to get social feed', { error, userId });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('getSocialFeed error', { error, userId });
      throw error;
    }
  }

  async likePost(userId: string, postId: string) {
    try {
      ValidationService.checkRateLimit(userId, 'likePost', 100, 60000);
      
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        throw new Error('Post already liked');
      }

      // Create like
      const { error: likeError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId,
          created_at: new Date().toISOString()
        });

      if (likeError) {
        logger.error('Failed to like post', { error: likeError, userId, postId });
        throw likeError;
      }

      // Update likes count
      const { error: updateError } = await supabase.rpc('increment_post_likes', {
        post_id: postId
      });

      if (updateError) {
        logger.error('Failed to update likes count', { error: updateError, postId });
      }

      logger.info('Post liked', { userId, postId });
    } catch (error) {
      logger.error('likePost error', { error, userId, postId });
      throw error;
    }
  }

  async unlikePost(userId: string, postId: string) {
    try {
      ValidationService.checkRateLimit(userId, 'unlikePost', 100, 60000);
      
      // Remove like
      const { error: unlikeError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (unlikeError) {
        logger.error('Failed to unlike post', { error: unlikeError, userId, postId });
        throw unlikeError;
      }

      // Update likes count
      const { error: updateError } = await supabase.rpc('decrement_post_likes', {
        post_id: postId
      });

      if (updateError) {
        logger.error('Failed to update likes count', { error: updateError, postId });
      }

      logger.info('Post unliked', { userId, postId });
    } catch (error) {
      logger.error('unlikePost error', { error, userId, postId });
      throw error;
    }
  }

  // ============================================================================
  // XP and Achievements Operations
  // ============================================================================

  async addXPTransaction(userId: string, xpData: any) {
    try {
      ValidationService.checkRateLimit(userId, 'addXP', 50, 60000);
      
      const { data, error } = await supabase
        .from('xp_transactions')
        .insert({
          user_id: userId,
          amount: xpData.amount,
          source: xpData.source,
          source_id: xpData.source_id,
          description: xpData.description,
          base_amount: xpData.base_amount || xpData.amount,
          multiplier: xpData.multiplier || 1.0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to add XP transaction', { error, userId });
        throw error;
      }

      // Update user's total XP
      await this.updateUserXP(userId, xpData.amount);

      logger.info('XP transaction added', { userId, amount: xpData.amount });
      return data;
    } catch (error) {
      logger.error('addXPTransaction error', { error, userId });
      throw error;
    }
  }

  async updateUserXP(userId: string, xpAmount: number) {
    try {
      const { error } = await supabase.rpc('update_user_xp', {
        user_id: userId,
        xp_amount: xpAmount
      });

      if (error) {
        logger.error('Failed to update user XP', { error, userId, xpAmount });
        throw error;
      }
    } catch (error) {
      logger.error('updateUserXP error', { error, userId, xpAmount });
      throw error;
    }
  }

  async getUserAchievements(userId: string) {
    try {
      ValidationService.checkRateLimit(userId, 'getUserAchievements', 20, 60000);
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to get user achievements', { error, userId });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('getUserAchievements error', { error, userId });
      throw error;
    }
  }

  async unlockAchievement(userId: string, achievementId: string, progress: any = {}) {
    try {
      ValidationService.checkRateLimit(userId, 'unlockAchievement', 10, 60000);
      
      // Check if already unlocked
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .eq('is_completed', true)
        .single();

      if (existing) {
        throw new Error('Achievement already unlocked');
      }

      // Get achievement details for XP reward
      const { data: achievement } = await supabase
        .from('achievements')
        .select('xp_reward')
        .eq('id', achievementId)
        .single();

      // Unlock achievement
      const { data, error } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: userId,
          achievement_id: achievementId,
          progress,
          is_completed: true,
          completed_at: new Date().toISOString(),
          xp_earned: achievement?.xp_reward || 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to unlock achievement', { error, userId, achievementId });
        throw error;
      }

      // Add XP transaction if achievement has reward
      if (achievement?.xp_reward > 0) {
        await this.addXPTransaction(userId, {
          amount: achievement.xp_reward,
          source: 'achievement',
          source_id: achievementId,
          description: `Achievement unlocked: ${achievementId}`,
          base_amount: achievement.xp_reward
        });
      }

      logger.info('Achievement unlocked', { userId, achievementId });
      return data;
    } catch (error) {
      logger.error('unlockAchievement error', { error, userId, achievementId });
      throw error;
    }
  }

  // ============================================================================
  // Streak Operations
  // ============================================================================

  async getUserStreaks(userId: string) {
    try {
      ValidationService.checkRateLimit(userId, 'getUserStreaks', 20, 60000);
      
      const { data, error } = await supabase
        .from('streak_schedules')
        .select(`
          *,
          periods:streak_periods(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to get user streaks', { error, userId });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('getUserStreaks error', { error, userId });
      throw error;
    }
  }

  async createStreakSchedule(userId: string, scheduleData: any) {
    try {
      ValidationService.checkRateLimit(userId, 'createStreak', 5, 60000);
      
      const { data, error } = await supabase
        .from('streak_schedules')
        .insert({
          user_id: userId,
          name: scheduleData.name,
          description: scheduleData.description,
          target_days_per_week: scheduleData.target_days_per_week,
          scheduled_days: scheduleData.scheduled_days,
          is_flexible: scheduleData.is_flexible,
          rest_days: scheduleData.rest_days || [],
          color: scheduleData.color || '#3B82F6',
          icon: scheduleData.icon || '💪',
          is_active: scheduleData.is_active || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create streak schedule', { error, userId });
        throw error;
      }

      logger.info('Streak schedule created', { userId, scheduleId: data.id });
      return data;
    } catch (error) {
      logger.error('createStreakSchedule error', { error, userId });
      throw error;
    }
  }

  // ============================================================================
  // Real-time Subscriptions
  // ============================================================================

  subscribeToUserUpdates(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`user_updates_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_profiles',
        filter: `id=eq.${userId}`
      }, callback)
      .subscribe();
  }

  subscribeToSocialFeed(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`social_feed_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'social_posts'
      }, callback)
      .subscribe();
  }

  unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      logger.error('Supabase health check failed', { error });
      return false;
    }
  }

  async getCurrentUser(): Promise<SupabaseUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      logger.error('Failed to get current user', { error });
      return null;
    }
  }

  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      logger.error('Failed to get current session', { error });
      return null;
    }
  }
}

// Export singleton instance
export const supabaseService = SupabaseService.getInstance();