/**
 * Achievement Service
 * 
 * Comprehensive service for managing achievements, progress tracking,
 * and achievement unlocking with real Supabase integration.
 */

import { supabaseService } from './SupabaseService';
import { realGamificationService } from './RealGamificationService';
import { logger } from '@/utils/logger';
import { allFitnessAchievements } from '@/data/fitnessAchievements';
import { validateFitnessAchievement } from '@/utils/fitnessAchievementValidators';
import type { 
  Achievement, 
  UserAchievement, 
  AchievementUnlock,
  GamificationStats,
  AchievementCategory,
  AchievementRarity
} from '@/types/gamification';
import type { AchievementValidationContext } from '@/utils/fitnessAchievementValidators';

export interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  isUnlocked: boolean;
  currentValue: number;
  targetValue: number;
  metadata?: Record<string, any>;
}

export interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
  recentUnlocks: Achievement[];
  nearCompletion: Array<{ achievement: Achievement; progress: number }>;
  categoryStats: Record<AchievementCategory, {
    total: number;
    unlocked: number;
    percentage: number;
  }>;
  rarityStats: Record<AchievementRarity, {
    total: number;
    unlocked: number;
    percentage: number;
  }>;
}

export class AchievementService {
  private static instance: AchievementService;
  private achievementCache: Map<string, Achievement> = new Map();
  private userAchievementCache: Map<string, UserAchievement[]> = new Map();
  private lastCacheUpdate: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.initializeAchievements();
  }

  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private async initializeAchievements(): Promise<void> {
    try {
      // Load achievements from static data first
      allFitnessAchievements.forEach(achievement => {
        this.achievementCache.set(achievement.id, achievement);
      });

      // Sync with database achievements
      await this.syncAchievementsWithDatabase();
      
      logger.info('Achievement service initialized', { 
        totalAchievements: this.achievementCache.size 
      });
    } catch (error) {
      logger.error('Failed to initialize achievements', { error });
    }
  }

  private async syncAchievementsWithDatabase(): Promise<void> {
    try {
      const dbAchievements = await realGamificationService.getAvailableAchievements();
      
      // Update cache with database achievements
      dbAchievements.forEach(achievement => {
        this.achievementCache.set(achievement.id, achievement);
      });

      // Add any missing achievements to database
      const dbAchievementIds = new Set(dbAchievements.map(a => a.id));
      const missingAchievements = allFitnessAchievements.filter(
        a => !dbAchievementIds.has(a.id)
      );

      if (missingAchievements.length > 0) {
        logger.info('Adding missing achievements to database', { 
          count: missingAchievements.length 
        });
        
        for (const achievement of missingAchievements) {
          await this.addAchievementToDatabase(achievement);
        }
      }
    } catch (error) {
      logger.warn('Failed to sync achievements with database, using static data', { error });
    }
  }

  private async addAchievementToDatabase(achievement: Achievement): Promise<void> {
    try {
      const { error } = await supabaseService.supabase
        .from('achievements')
        .insert({
          key: achievement.id,
          name: achievement.name,
          name_es: achievement.name, // TODO: Add Spanish translations
          description: achievement.description,
          description_es: achievement.description, // TODO: Add Spanish translations
          category: achievement.category,
          rarity: achievement.rarity,
          xp_reward: achievement.rewards.xp,
          requirements: achievement.requirements,
          icon: achievement.icon,
          color: this.getRarityColor(achievement.rarity),
          is_active: true,
          is_secret: achievement.isSecret,
          sort_order: achievement.sortOrder
        });

      if (error) throw error;
      
      logger.debug('Added achievement to database', { achievementId: achievement.id });
    } catch (error) {
      logger.error('Failed to add achievement to database', { 
        error, 
        achievementId: achievement.id 
      });
    }
  }

  private getRarityColor(rarity: AchievementRarity): string {
    const colors = {
      common: '#6B7280',
      uncommon: '#10B981',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
      mythic: '#EC4899'
    };
    return colors[rarity];
  }

  // ============================================================================
  // Achievement Management
  // ============================================================================

  async getAllAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievementCache.values())
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getAchievementById(achievementId: string): Promise<Achievement | null> {
    return this.achievementCache.get(achievementId) || null;
  }

  async getAchievementsByCategory(category: AchievementCategory): Promise<Achievement[]> {
    return Array.from(this.achievementCache.values())
      .filter(a => a.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getAchievementsByRarity(rarity: AchievementRarity): Promise<Achievement[]> {
    return Array.from(this.achievementCache.values())
      .filter(a => a.rarity === rarity)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // ============================================================================
  // User Achievement Management
  // ============================================================================

  async getUserAchievements(userId: string, forceRefresh = false): Promise<UserAchievement[]> {
    const cacheKey = userId;
    const lastUpdate = this.lastCacheUpdate.get(cacheKey) || 0;
    const now = Date.now();

    // Return cached data if still valid
    if (!forceRefresh && (now - lastUpdate) < this.CACHE_TTL) {
      const cached = this.userAchievementCache.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const userAchievements = await realGamificationService.getUserAchievements(userId);
      
      // Update cache
      this.userAchievementCache.set(cacheKey, userAchievements);
      this.lastCacheUpdate.set(cacheKey, now);
      
      return userAchievements;
    } catch (error) {
      logger.error('Failed to get user achievements', { error, userId });
      return this.userAchievementCache.get(cacheKey) || [];
    }
  }

  async getUnlockedAchievements(userId: string): Promise<Achievement[]> {
    try {
      const userAchievements = await this.getUserAchievements(userId);
      const unlockedIds = userAchievements
        .filter(ua => ua.is_completed)
        .map(ua => ua.achievement_id);

      const achievements = await this.getAllAchievements();
      return achievements.filter(a => unlockedIds.includes(a.id));
    } catch (error) {
      logger.error('Failed to get unlocked achievements', { error, userId });
      return [];
    }
  }

  async getLockedAchievements(userId: string): Promise<Achievement[]> {
    try {
      const userAchievements = await this.getUserAchievements(userId);
      const unlockedIds = new Set(
        userAchievements
          .filter(ua => ua.is_completed)
          .map(ua => ua.achievement_id)
      );

      const achievements = await this.getAllAchievements();
      return achievements.filter(a => !unlockedIds.has(a.id));
    } catch (error) {
      logger.error('Failed to get locked achievements', { error, userId });
      return [];
    }
  }

  // ============================================================================
  // Achievement Progress Tracking
  // ============================================================================

  async calculateAchievementProgress(
    userId: string, 
    achievementId: string,
    context?: Partial<AchievementValidationContext>
  ): Promise<AchievementProgress | null> {
    try {
      const achievement = await this.getAchievementById(achievementId);
      if (!achievement) return null;

      const userAchievements = await this.getUserAchievements(userId);
      const userAchievement = userAchievements.find(ua => ua.achievement_id === achievementId);

      // If already unlocked, return completed progress
      if (userAchievement?.is_completed) {
        return {
          achievement,
          progress: 1,
          isUnlocked: true,
          currentValue: userAchievement.current_progress || 0,
          targetValue: userAchievement.target_progress || 1,
          metadata: userAchievement.metadata
        };
      }

      // Build validation context
      const validationContext = await this.buildValidationContext(userId, context);
      
      // Calculate progress using validators
      const result = validateFitnessAchievement(
        achievement,
        userAchievement || this.createEmptyUserAchievement(userId, achievementId),
        validationContext
      );

      return {
        achievement,
        progress: result.progress,
        isUnlocked: result.isUnlocked,
        currentValue: result.currentValue,
        targetValue: result.targetValue,
        metadata: result.metadata
      };
    } catch (error) {
      logger.error('Failed to calculate achievement progress', { 
        error, 
        userId, 
        achievementId 
      });
      return null;
    }
  }

  async calculateAllAchievementProgress(
    userId: string,
    context?: Partial<AchievementValidationContext>
  ): Promise<AchievementProgress[]> {
    try {
      const achievements = await this.getAllAchievements();
      const validationContext = await this.buildValidationContext(userId, context);
      const userAchievements = await this.getUserAchievements(userId);
      
      const progressList: AchievementProgress[] = [];

      for (const achievement of achievements) {
        const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
        
        // If already unlocked, add completed progress
        if (userAchievement?.is_completed) {
          progressList.push({
            achievement,
            progress: 1,
            isUnlocked: true,
            currentValue: userAchievement.current_progress || 0,
            targetValue: userAchievement.target_progress || 1,
            metadata: userAchievement.metadata
          });
          continue;
        }

        // Calculate progress using validators
        const result = validateFitnessAchievement(
          achievement,
          userAchievement || this.createEmptyUserAchievement(userId, achievement.id),
          validationContext
        );

        progressList.push({
          achievement,
          progress: result.progress,
          isUnlocked: result.isUnlocked,
          currentValue: result.currentValue,
          targetValue: result.targetValue,
          metadata: result.metadata
        });
      }

      return progressList;
    } catch (error) {
      logger.error('Failed to calculate all achievement progress', { error, userId });
      return [];
    }
  }

  private async buildValidationContext(
    userId: string,
    context?: Partial<AchievementValidationContext>
  ): Promise<AchievementValidationContext> {
    try {
      // Get user stats from gamification service
      const userStats = await realGamificationService.getUserStats?.(userId) || {} as GamificationStats;
      
      // Get recent workouts if not provided
      let recentWorkouts = context?.recentWorkouts;
      if (!recentWorkouts) {
        try {
          recentWorkouts = await supabaseService.getUserWorkouts(userId, 50);
        } catch (error) {
          logger.warn('Failed to get recent workouts for achievement validation', { error });
          recentWorkouts = [];
        }
      }

      // Get personal records if not provided
      let personalRecords = context?.personalRecords;
      if (!personalRecords) {
        try {
          const { data } = await supabaseService.supabase
            .from('exercise_performances')
            .select('*')
            .eq('user_id', userId)
            .eq('is_personal_record', true)
            .order('created_at', { ascending: false });
          
          personalRecords = data || [];
        } catch (error) {
          logger.warn('Failed to get personal records for achievement validation', { error });
          personalRecords = [];
        }
      }

      // Get user profile if not provided
      let userProfile = context?.userProfile;
      if (!userProfile) {
        try {
          userProfile = await supabaseService.getUserProfile(userId);
        } catch (error) {
          logger.warn('Failed to get user profile for achievement validation', { error });
          userProfile = {};
        }
      }

      return {
        userStats,
        recentWorkouts,
        personalRecords,
        userProfile,
        eventData: context?.eventData
      };
    } catch (error) {
      logger.error('Failed to build validation context', { error, userId });
      return {
        userStats: {} as GamificationStats,
        recentWorkouts: [],
        personalRecords: [],
        userProfile: {}
      };
    }
  }

  private createEmptyUserAchievement(userId: string, achievementId: string): UserAchievement {
    return {
      id: `temp_${userId}_${achievementId}`,
      user_id: userId,
      achievement_id: achievementId,
      is_completed: false,
      current_progress: 0,
      target_progress: 1,
      progress_data: {},
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // ============================================================================
  // Achievement Unlocking
  // ============================================================================

  async checkAndUnlockAchievements(
    userId: string,
    eventType: string,
    eventData?: any
  ): Promise<Achievement[]> {
    try {
      const context = await this.buildValidationContext(userId, { eventData });
      const progressList = await this.calculateAllAchievementProgress(userId, context);
      
      const newlyUnlocked: Achievement[] = [];

      for (const progress of progressList) {
        if (progress.isUnlocked && !progress.isUnlocked) {
          // Achievement should be unlocked
          const unlocked = await this.unlockAchievement(
            userId, 
            progress.achievement.id,
            progress.currentValue,
            progress.metadata
          );
          
          if (unlocked) {
            newlyUnlocked.push(progress.achievement);
          }
        }
      }

      if (newlyUnlocked.length > 0) {
        logger.info('Achievements unlocked', { 
          userId, 
          eventType, 
          count: newlyUnlocked.length,
          achievements: newlyUnlocked.map(a => a.id)
        });

        // Clear cache to force refresh
        this.userAchievementCache.delete(userId);
      }

      return newlyUnlocked;
    } catch (error) {
      logger.error('Failed to check and unlock achievements', { error, userId, eventType });
      return [];
    }
  }

  async unlockAchievement(
    userId: string,
    achievementId: string,
    currentValue?: number,
    metadata?: any
  ): Promise<boolean> {
    try {
      const achievement = await this.getAchievementById(achievementId);
      if (!achievement) {
        logger.warn('Cannot unlock unknown achievement', { achievementId });
        return false;
      }

      // Use the real gamification service to unlock
      const result = await realGamificationService.checkAndUnlockAchievement(
        userId,
        achievement.id,
        metadata
      );

      if (result) {
        // Award XP for achievement unlock
        await realGamificationService.awardXP(
          userId,
          'achievement_unlocked',
          achievementId
        );

        // Clear cache
        this.userAchievementCache.delete(userId);

        logger.info('Achievement unlocked', { 
          userId, 
          achievementId, 
          xpAwarded: achievement.rewards.xp 
        });

        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to unlock achievement', { error, userId, achievementId });
      return false;
    }
  }

  // ============================================================================
  // Achievement Statistics
  // ============================================================================

  async getAchievementStats(userId: string): Promise<AchievementStats> {
    try {
      const allAchievements = await this.getAllAchievements();
      const unlockedAchievements = await this.getUnlockedAchievements(userId);
      const progressList = await this.calculateAllAchievementProgress(userId);

      // Calculate basic stats
      const totalAchievements = allAchievements.length;
      const unlockedCount = unlockedAchievements.length;
      const completionPercentage = (unlockedCount / totalAchievements) * 100;

      // Get recent unlocks (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const userAchievements = await this.getUserAchievements(userId);
      const recentUnlockIds = userAchievements
        .filter(ua => 
          ua.is_completed && 
          ua.completed_at && 
          new Date(ua.completed_at) > thirtyDaysAgo
        )
        .map(ua => ua.achievement_id);

      const recentUnlocks = allAchievements.filter(a => recentUnlockIds.includes(a.id));

      // Get near completion achievements (>75% progress)
      const nearCompletion = progressList
        .filter(p => !p.isUnlocked && p.progress > 0.75)
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 10)
        .map(p => ({ achievement: p.achievement, progress: p.progress }));

      // Calculate category stats
      const categoryStats: Record<AchievementCategory, any> = {} as any;
      const categories: AchievementCategory[] = ['strength', 'consistency', 'social', 'milestone', 'exploration', 'mastery', 'community'];
      
      for (const category of categories) {
        const categoryAchievements = allAchievements.filter(a => a.category === category);
        const categoryUnlocked = unlockedAchievements.filter(a => a.category === category);
        
        categoryStats[category] = {
          total: categoryAchievements.length,
          unlocked: categoryUnlocked.length,
          percentage: categoryAchievements.length > 0 
            ? (categoryUnlocked.length / categoryAchievements.length) * 100 
            : 0
        };
      }

      // Calculate rarity stats
      const rarityStats: Record<AchievementRarity, any> = {} as any;
      const rarities: AchievementRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
      
      for (const rarity of rarities) {
        const rarityAchievements = allAchievements.filter(a => a.rarity === rarity);
        const rarityUnlocked = unlockedAchievements.filter(a => a.rarity === rarity);
        
        rarityStats[rarity] = {
          total: rarityAchievements.length,
          unlocked: rarityUnlocked.length,
          percentage: rarityAchievements.length > 0 
            ? (rarityUnlocked.length / rarityAchievements.length) * 100 
            : 0
        };
      }

      return {
        totalAchievements,
        unlockedAchievements: unlockedCount,
        completionPercentage,
        recentUnlocks,
        nearCompletion,
        categoryStats,
        rarityStats
      };
    } catch (error) {
      logger.error('Failed to get achievement stats', { error, userId });
      return {
        totalAchievements: 0,
        unlockedAchievements: 0,
        completionPercentage: 0,
        recentUnlocks: [],
        nearCompletion: [],
        categoryStats: {} as any,
        rarityStats: {} as any
      };
    }
  }

  // ============================================================================
  // Achievement Sharing
  // ============================================================================

  async shareAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      const achievement = await this.getAchievementById(achievementId);
      if (!achievement) return false;

      // Check if user has unlocked this achievement
      const userAchievements = await this.getUserAchievements(userId);
      const userAchievement = userAchievements.find(ua => 
        ua.achievement_id === achievementId && ua.is_completed
      );

      if (!userAchievement) {
        logger.warn('Cannot share locked achievement', { userId, achievementId });
        return false;
      }

      // Create social post for achievement
      const { error } = await supabaseService.supabase
        .from('social_posts')
        .insert({
          user_id: userId,
          type: 'achievement',
          content: `Just unlocked the "${achievement.name}" achievement! 🏆`,
          data: {
            achievement_id: achievementId,
            achievement_name: achievement.name,
            achievement_rarity: achievement.rarity,
            achievement_icon: achievement.icon
          },
          visibility: 'friends'
        });

      if (error) throw error;

      // Award XP for social interaction
      await realGamificationService.awardXP(userId, 'social_interaction', achievementId);

      logger.info('Achievement shared', { userId, achievementId });
      return true;
    } catch (error) {
      logger.error('Failed to share achievement', { error, userId, achievementId });
      return false;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  async clearUserCache(userId: string): Promise<void> {
    this.userAchievementCache.delete(userId);
    this.lastCacheUpdate.delete(userId);
  }

  async refreshAchievements(): Promise<void> {
    await this.syncAchievementsWithDatabase();
  }
}

// Export singleton instance
export const achievementService = AchievementService.getInstance();
export default achievementService;