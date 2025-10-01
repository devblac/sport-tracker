/**
 * League Rewards Service
 * Integrates leagues with the gamification and rewards system
 */

import { dbManager } from '@/db/IndexedDBManager';
import { leagueManager } from './LeagueManager';
import { analyticsManager } from './AnalyticsManager';
import { logger } from '@/utils';
import type { UserLeagueStats, League } from '@/types/league';

export interface LeagueReward {
  id: string;
  type: 'weekly_position' | 'promotion' | 'relegation' | 'milestone' | 'streak';
  title: string;
  description: string;
  xpReward: number;
  badgeId?: string;
  titleId?: string;
  additionalRewards: string[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    position?: number;
    leagueLevel?: number;
    consecutiveWeeks?: number;
    totalPromotions?: number;
  };
}

export interface RewardResult {
  success: boolean;
  rewardsGranted: LeagueReward[];
  totalXP: number;
  errors: string[];
}

export class LeagueRewardsService {
  private static instance: LeagueRewardsService;
  private rewards: Map<string, LeagueReward> = new Map();

  private constructor() {
    this.initializeRewards();
  }

  public static getInstance(): LeagueRewardsService {
    if (!LeagueRewardsService.instance) {
      LeagueRewardsService.instance = new LeagueRewardsService();
    }
    return LeagueRewardsService.instance;
  }

  /**
   * Initialize the league rewards system
   */
  private initializeRewards(): void {
    const rewardDefinitions: Omit<LeagueReward, 'id'>[] = [
      // Weekly Position Rewards
      {
        type: 'weekly_position',
        title: 'Weekly Champion',
        description: 'Finish #1 in your league group',
        xpReward: 500,
        badgeId: 'weekly_champion',
        additionalRewards: ['Double XP weekend', 'Champion badge'],
        rarity: 'epic',
        requirements: { position: 1 }
      },
      {
        type: 'weekly_position',
        title: 'Top 3 Finisher',
        description: 'Finish in top 3 of your league group',
        xpReward: 300,
        badgeId: 'top_3_finisher',
        additionalRewards: ['Podium badge', 'XP bonus'],
        rarity: 'rare',
        requirements: { position: 3 }
      },
      {
        type: 'weekly_position',
        title: 'Promotion Zone',
        description: 'Finish in promotion zone (top 5)',
        xpReward: 200,
        badgeId: 'promotion_zone',
        additionalRewards: ['Promotion badge'],
        rarity: 'rare',
        requirements: { position: 5 }
      },

      // Promotion Rewards
      {
        type: 'promotion',
        title: 'League Climber',
        description: 'Get promoted to a higher league',
        xpReward: 400,
        badgeId: 'league_climber',
        additionalRewards: ['Promotion celebration', 'League badge'],
        rarity: 'rare',
        requirements: {}
      },
      {
        type: 'promotion',
        title: 'Gold League Graduate',
        description: 'Get promoted from Gold league',
        xpReward: 600,
        badgeId: 'gold_graduate',
        titleId: 'gold_graduate',
        additionalRewards: ['Exclusive title', 'Premium badge'],
        rarity: 'epic',
        requirements: { leagueLevel: 3 }
      },
      {
        type: 'promotion',
        title: 'Diamond Achiever',
        description: 'Reach Diamond league',
        xpReward: 1000,
        badgeId: 'diamond_achiever',
        titleId: 'diamond_achiever',
        additionalRewards: ['Legendary title', 'Diamond badge', 'Avatar frame'],
        rarity: 'legendary',
        requirements: { leagueLevel: 8 }
      },
      {
        type: 'promotion',
        title: 'Phoenix Rising',
        description: 'Reach the legendary Phoenix league',
        xpReward: 2000,
        badgeId: 'phoenix_rising',
        titleId: 'phoenix_champion',
        additionalRewards: ['Ultimate title', 'Phoenix badge', 'Exclusive avatar', 'Hall of Fame entry'],
        rarity: 'legendary',
        requirements: { leagueLevel: 10 }
      },

      // Milestone Rewards
      {
        type: 'milestone',
        title: 'Promotion Streak',
        description: 'Get promoted 3 weeks in a row',
        xpReward: 800,
        badgeId: 'promotion_streak',
        titleId: 'unstoppable',
        additionalRewards: ['Streak badge', 'Unstoppable title'],
        rarity: 'epic',
        requirements: { consecutiveWeeks: 3 }
      },
      {
        type: 'milestone',
        title: 'League Veteran',
        description: 'Participate in leagues for 10 weeks',
        xpReward: 500,
        badgeId: 'league_veteran',
        additionalRewards: ['Veteran badge', 'XP multiplier'],
        rarity: 'rare',
        requirements: { consecutiveWeeks: 10 }
      },
      {
        type: 'milestone',
        title: 'Promotion Master',
        description: 'Achieve 10 total promotions',
        xpReward: 1200,
        badgeId: 'promotion_master',
        titleId: 'promotion_master',
        additionalRewards: ['Master title', 'Exclusive badge', 'Achievement showcase'],
        rarity: 'legendary',
        requirements: { totalPromotions: 10 }
      }
    ];

    rewardDefinitions.forEach((reward, index) => {
      const id = `league_reward_${index + 1}`;
      this.rewards.set(id, { ...reward, id });
    });

    logger.info('League rewards system initialized', { rewards: this.rewards.size });
  }

  /**
   * Process rewards for a user after weekly results
   */
  async processWeeklyRewards(
    userId: string, 
    finalPosition: number, 
    wasPromoted: boolean,
    wasRelegated: boolean,
    currentLeague: League
  ): Promise<RewardResult> {
    try {
      await dbManager.init();
      
      const userStats = await dbManager.get<UserLeagueStats>('userLeagueStats', userId);
      if (!userStats) {
        throw new Error(`User stats not found for user: ${userId}`);
      }

      const rewardsToGrant: LeagueReward[] = [];
      let totalXP = 0;
      const errors: string[] = [];

      // Check weekly position rewards
      const positionRewards = this.getPositionRewards(finalPosition);
      rewardsToGrant.push(...positionRewards);

      // Check promotion rewards
      if (wasPromoted) {
        const promotionRewards = this.getPromotionRewards(currentLeague.level, userStats.promotions);
        rewardsToGrant.push(...promotionRewards);
      }

      // Check milestone rewards
      const milestoneRewards = await this.getMilestoneRewards(userStats);
      rewardsToGrant.push(...milestoneRewards);

      // Grant all rewards
      for (const reward of rewardsToGrant) {
        try {
          await this.grantReward(userId, reward);
          totalXP += reward.xpReward;
          
          // Track reward granted
          analyticsManager.track('league_reward_granted', {
            user_id: userId,
            reward_id: reward.id,
            reward_type: reward.type,
            xp_reward: reward.xpReward,
            rarity: reward.rarity,
            final_position: finalPosition,
            was_promoted: wasPromoted,
            league_level: currentLeague.level
          });
          
        } catch (error) {
          const errorMsg = `Error granting reward ${reward.id}: ${error}`;
          logger.error(errorMsg, error);
          errors.push(errorMsg);
        }
      }

      // Add XP to user's total
      if (totalXP > 0) {
        await this.addXPToUser(userId, totalXP, 'league_rewards');
      }

      logger.info('Weekly rewards processed', {
        userId,
        rewardsGranted: rewardsToGrant.length,
        totalXP,
        errors: errors.length
      });

      return {
        success: errors.length === 0,
        rewardsGranted,
        totalXP,
        errors
      };

    } catch (error) {
      logger.error('Error processing weekly rewards', error);
      return {
        success: false,
        rewardsGranted: [],
        totalXP: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get rewards based on final position
   */
  private getPositionRewards(finalPosition: number): LeagueReward[] {
    const rewards: LeagueReward[] = [];
    
    for (const reward of this.rewards.values()) {
      if (reward.type === 'weekly_position' && reward.requirements.position) {
        if (finalPosition <= reward.requirements.position) {
          rewards.push(reward);
        }
      }
    }
    
    return rewards;
  }

  /**
   * Get rewards for promotions
   */
  private getPromotionRewards(newLeagueLevel: number, totalPromotions: number): LeagueReward[] {
    const rewards: LeagueReward[] = [];
    
    for (const reward of this.rewards.values()) {
      if (reward.type === 'promotion') {
        // General promotion reward
        if (!reward.requirements.leagueLevel && !reward.requirements.totalPromotions) {
          rewards.push(reward);
        }
        
        // Specific league level rewards
        if (reward.requirements.leagueLevel === newLeagueLevel) {
          rewards.push(reward);
        }
        
        // Total promotions milestone
        if (reward.requirements.totalPromotions === totalPromotions) {
          rewards.push(reward);
        }
      }
    }
    
    return rewards;
  }

  /**
   * Get milestone rewards
   */
  private async getMilestoneRewards(userStats: UserLeagueStats): Promise<LeagueReward[]> {
    const rewards: LeagueReward[] = [];
    
    // Calculate total weeks in leagues (mock calculation)
    const totalWeeksInLeagues = userStats.weeksInCurrentLeague + 5; // Mock additional weeks
    
    for (const reward of this.rewards.values()) {
      if (reward.type === 'milestone') {
        if (reward.requirements.consecutiveWeeks && 
            totalWeeksInLeagues >= reward.requirements.consecutiveWeeks) {
          
          // Check if user already has this reward
          const alreadyHas = await this.userHasReward(userStats.userId, reward.id);
          if (!alreadyHas) {
            rewards.push(reward);
          }
        }
        
        if (reward.requirements.totalPromotions && 
            userStats.promotions >= reward.requirements.totalPromotions) {
          
          const alreadyHas = await this.userHasReward(userStats.userId, reward.id);
          if (!alreadyHas) {
            rewards.push(reward);
          }
        }
      }
    }
    
    return rewards;
  }

  /**
   * Grant a reward to a user
   */
  private async grantReward(userId: string, reward: LeagueReward): Promise<void> {
    try {
      // Create user achievement record
      const userAchievement = {
        id: `${userId}_${reward.id}_${Date.now()}`,
        userId,
        achievementId: reward.id,
        title: reward.title,
        description: reward.description,
        type: 'league',
        rarity: reward.rarity,
        xpReward: reward.xpReward,
        additionalRewards: reward.additionalRewards,
        unlockedAt: Date.now(),
        claimed: false
      };

      await dbManager.put('userAchievements', userAchievement);

      // Create notification
      const notification = {
        id: `league_reward_${userId}_${Date.now()}`,
        userId,
        type: 'league_reward',
        title: `🏆 ${reward.title}`,
        message: `You've earned: ${reward.description}`,
        data: {
          rewardId: reward.id,
          xpReward: reward.xpReward,
          rarity: reward.rarity,
          additionalRewards: reward.additionalRewards
        },
        isRead: false,
        createdAt: Date.now()
      };

      await dbManager.put('notifications', notification);

      logger.info('Reward granted to user', {
        userId,
        rewardId: reward.id,
        title: reward.title,
        xpReward: reward.xpReward
      });

    } catch (error) {
      logger.error('Error granting reward to user', error);
      throw error;
    }
  }

  /**
   * Check if user already has a specific reward
   */
  private async userHasReward(userId: string, rewardId: string): Promise<boolean> {
    try {
      const userAchievements = await dbManager.getAll<any>('userAchievements');
      return userAchievements.some(achievement => 
        achievement.userId === userId && achievement.achievementId === rewardId
      );
    } catch (error) {
      logger.error('Error checking if user has reward', error);
      return false;
    }
  }

  /**
   * Add XP to user's total
   */
  private async addXPToUser(userId: string, xp: number, source: string): Promise<void> {
    try {
      // Get or create user XP record
      let userXP = await dbManager.get<any>('userXP', userId);
      if (!userXP) {
        userXP = {
          userId,
          currentLevel: 1,
          totalXP: 0,
          currentLevelXP: 0,
          updatedAt: Date.now()
        };
      }

      // Add XP
      userXP.totalXP += xp;
      userXP.updatedAt = Date.now();

      // Calculate new level (simple calculation)
      const newLevel = Math.floor(userXP.totalXP / 1000) + 1;
      if (newLevel > userXP.currentLevel) {
        userXP.currentLevel = newLevel;
        
        // Create level up notification
        const notification = {
          id: `level_up_${userId}_${Date.now()}`,
          userId,
          type: 'level_up',
          title: '🎉 Level Up!',
          message: `Congratulations! You've reached level ${newLevel}!`,
          data: {
            newLevel,
            totalXP: userXP.totalXP,
            source
          },
          isRead: false,
          createdAt: Date.now()
        };

        await dbManager.put('notifications', notification);
      }

      await dbManager.put('userXP', userXP);

      // Create XP transaction record
      const xpTransaction = {
        id: `xp_${userId}_${Date.now()}`,
        userId,
        amount: xp,
        source,
        description: `League rewards: ${xp} XP`,
        createdAt: Date.now()
      };

      await dbManager.put('xpTransactions', xpTransaction);

    } catch (error) {
      logger.error('Error adding XP to user', error);
      throw error;
    }
  }

  /**
   * Get available rewards for a user
   */
  async getAvailableRewards(userId: string): Promise<LeagueReward[]> {
    try {
      const userStats = await dbManager.get<UserLeagueStats>('userLeagueStats', userId);
      if (!userStats) return [];

      const availableRewards: LeagueReward[] = [];
      
      // Get milestone rewards that user hasn't earned yet
      const milestoneRewards = await this.getMilestoneRewards(userStats);
      availableRewards.push(...milestoneRewards);

      return availableRewards;
    } catch (error) {
      logger.error('Error getting available rewards', error);
      return [];
    }
  }

  /**
   * Get user's earned league rewards
   */
  async getUserLeagueRewards(userId: string): Promise<any[]> {
    try {
      const userAchievements = await dbManager.getAll<any>('userAchievements');
      return userAchievements.filter(achievement => 
        achievement.userId === userId && achievement.type === 'league'
      );
    } catch (error) {
      logger.error('Error getting user league rewards', error);
      return [];
    }
  }

  /**
   * Get all available league rewards
   */
  getAllRewards(): LeagueReward[] {
    return Array.from(this.rewards.values());
  }
}

export const leagueRewardsService = LeagueRewardsService.getInstance();

// Export types for convenience
export type { LeagueReward, RewardResult } from './LeagueRewardsService';