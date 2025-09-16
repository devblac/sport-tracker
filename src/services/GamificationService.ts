/**
 * Gamification Service
 * 
 * This service manages all gamification features including XP, levels, achievements,
 * streaks, and challenges. It implements the IGamificationEngine interface.
 */

import type {
  IGamificationEngine,
  XPSource,
  XPAwardResult,
  UserLevel,
  Achievement,
  UserAchievement,
  GamificationEvent,
  UserStreak,
  Challenge,
  ChallengeParticipant,
  ChallengeLeaderboard,
  GamificationStats,
  GamificationConfig,
  XPTransaction
} from '@/types/gamification';

import { 
  calculateEventXP,
  validateXPAmount,
  applyDailyXPLimit,
  DEFAULT_XP_CONFIG
} from '@/utils/xpCalculation';

import {
  calculateUserLevel,
  checkLevelUp,
  DEFAULT_LEVEL_CONFIGS
} from '@/utils/levelProgression';

import {
  getUnlockableAchievements,
  updateAchievementProgress,
  DEFAULT_ACHIEVEMENTS
} from '@/utils/achievementSystem';

import { logger } from '@/utils/logger';

/**
 * Mock Database Interface for Gamification Service
 * Using localStorage until Supabase integration is complete
 */
interface MockDB {
  add(store: string, data: any): Promise<string>;
  get(store: string, key: string): Promise<any>;
  getAll(store: string, options?: any): Promise<any[]>;
  update(store: string, key: string, data: any): Promise<void>;
}

class MockDatabase implements MockDB {
  async add(store: string, data: any): Promise<string> {
    const key = data.id || crypto.randomUUID();
    const storageKey = `${store}_${key}`;
    localStorage.setItem(storageKey, JSON.stringify({ ...data, id: key }));
    return key;
  }

  async get(store: string, key: string): Promise<any> {
    const storageKey = `${store}_${key}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  }

  async getAll(store: string, options?: any): Promise<any[]> {
    const results: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${store}_`)) {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (options?.index && options?.value) {
            if (parsed[options.index] === options.value) {
              results.push(parsed);
            }
          } else {
            results.push(parsed);
          }
        }
      }
    }
    return results;
  }

  async update(store: string, key: string, data: any): Promise<void> {
    const storageKey = `${store}_${key}`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  }
}

/**
 * Gamification Service Implementation
 */
export class GamificationService implements IGamificationEngine {
  private static instance: GamificationService;
  private config: GamificationConfig;
  private db: MockDB;

  private constructor() {
    // Using mock database with localStorage for now
    this.db = new MockDatabase();
    
    this.config = {
      xpCalculation: DEFAULT_XP_CONFIG,
      levelConfigs: DEFAULT_LEVEL_CONFIGS,
      achievements: DEFAULT_ACHIEVEMENTS,
      streakMilestones: [], // Will be populated
      challengeCategories: ['strength', 'endurance', 'consistency', 'volume'],
      maxSickDays: 14,
      maxVacationDays: 30,
      sickDayResetPeriod: 365,
      vacationDayResetPeriod: 365
    };
  }

  public static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  // ============================================================================
  // XP and Level Management
  // ============================================================================

  /**
   * Award XP to a user and handle level ups and achievement unlocks
   */
  async awardXP(
    userId: string,
    amount: number,
    source: XPSource,
    sourceId?: string
  ): Promise<XPAwardResult> {
    try {
      // Validate XP amount
      if (!validateXPAmount(amount, source)) {
        throw new Error(`Invalid XP amount: ${amount} for source: ${source}`);
      }

      // Get current user stats
      const currentStats = await this.getUserStats(userId);
      const userStreak = await this.getUserStreak(userId);
      
      // Check daily XP limit
      const dailyXP = await this.getDailyXP(userId);
      const isPremium = await this.isUserPremium(userId);
      const finalAmount = applyDailyXPLimit(dailyXP, amount, isPremium);

      if (finalAmount === 0) {
        logger.warn(`Daily XP limit reached for user ${userId}`);
        return {
          xpAwarded: 0,
          newTotalXP: currentStats.totalXP,
          achievementsUnlocked: [],
        };
      }

      // Calculate new total XP
      const newTotalXP = currentStats.totalXP + finalAmount;

      // Check for level up
      const levelUp = checkLevelUp(currentStats.totalXP, newTotalXP, this.config.levelConfigs);

      // Create XP transaction record
      const transaction: XPTransaction = {
        id: crypto.randomUUID(),
        userId,
        amount: finalAmount,
        source,
        sourceId,
        description: this.getXPDescription(source, finalAmount),
        createdAt: new Date()
      };

      // Save XP transaction
      await this.db.add('xp_transactions', transaction);

      // Update user stats
      await this.updateUserTotalXP(userId, newTotalXP);

      // Create gamification event for achievement checking
      const event: GamificationEvent = {
        id: crypto.randomUUID(),
        userId,
        type: this.mapSourceToEventType(source),
        data: { source, amount: finalAmount, sourceId },
        xpAwarded: finalAmount,
        achievementsTriggered: [],
        createdAt: new Date()
      };

      // Check for achievement unlocks
      const achievementsUnlocked = await this.checkAchievements(userId, event);

      // Update event with triggered achievements
      event.achievementsTriggered = achievementsUnlocked.map(a => a.id);
      await this.db.add('gamification_events', event);

      logger.info(`Awarded ${finalAmount} XP to user ${userId} for ${source}`);

      return {
        xpAwarded: finalAmount,
        newTotalXP,
        levelUp,
        achievementsUnlocked,
      };
    } catch (error) {
      logger.error('Error awarding XP:', error);
      throw error;
    }
  }

  /**
   * Calculate XP for a specific activity
   */
  calculateXPForActivity(activityType: string, activityData: any): number {
    // Create a mock event to calculate XP
    const mockEvent: GamificationEvent = {
      id: 'mock',
      userId: 'mock',
      type: activityType as any,
      data: activityData,
      xpAwarded: 0,
      achievementsTriggered: [],
      createdAt: new Date()
    };

    // Get mock user streak (will be replaced with actual data in real usage)
    const mockStreak: any = { currentStreak: 0 };

    return calculateEventXP(mockEvent, mockStreak, false, this.config.xpCalculation);
  }

  /**
   * Get user's current level information
   */
  async getUserLevel(userId: string): Promise<UserLevel> {
    try {
      const stats = await this.getUserStats(userId);
      const userLevel = calculateUserLevel(stats.totalXP, this.config.levelConfigs);
      
      return {
        ...userLevel,
        userId
      };
    } catch (error) {
      logger.error('Error getting user level:', error);
      throw error;
    }
  }

  // ============================================================================
  // Achievement Management
  // ============================================================================

  /**
   * Check for achievement unlocks based on an event
   */
  async checkAchievements(userId: string, event: GamificationEvent): Promise<Achievement[]> {
    try {
      const userStats = await this.getUserStats(userId);
      const userAchievements = await this.getUserAchievements(userId);
      
      const unlockableAchievements = getUnlockableAchievements(
        event,
        userStats,
        userAchievements,
        this.config.achievements
      );

      const newlyUnlocked: Achievement[] = [];

      for (const achievement of unlockableAchievements) {
        const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
        
        if (userAchievement && !userAchievement.isUnlocked) {
          await this.unlockAchievement(userId, achievement.id);
          newlyUnlocked.push(achievement);
        }
      }

      return newlyUnlocked;
    } catch (error) {
      logger.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Get user's achievement progress
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const userAchievements = await this.db.getAll('user_achievements', {
        index: 'userId',
        value: userId
      });

      // Ensure all achievements exist in user's records
      const existingIds = new Set(userAchievements.map(ua => ua.achievementId));
      
      for (const achievement of this.config.achievements) {
        if (!existingIds.has(achievement.id)) {
          const newUserAchievement: UserAchievement = {
            userId,
            achievementId: achievement.id,
            progress: 0,
            isUnlocked: false,
            currentValues: {},
            notificationSent: false,
            timesCompleted: 0
          };
          
          await this.db.add('user_achievements', newUserAchievement);
          userAchievements.push(newUserAchievement);
        }
      }

      return userAchievements;
    } catch (error) {
      logger.error('Error getting user achievements:', error);
      return [];
    }
  }

  /**
   * Unlock an achievement for a user
   */
  async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    try {
      const achievement = this.config.achievements.find(a => a.id === achievementId);
      if (!achievement) {
        throw new Error(`Achievement not found: ${achievementId}`);
      }

      // Update user achievement record
      const userAchievement = await this.db.get('user_achievements', `${userId}_${achievementId}`);
      if (userAchievement) {
        userAchievement.isUnlocked = true;
        userAchievement.unlockedAt = new Date();
        userAchievement.progress = 1;
        
        if (achievement.isRepeatable) {
          userAchievement.timesCompleted += 1;
        }

        await this.db.update('user_achievements', userAchievement.id, userAchievement);
      }

      // Award achievement XP
      if (achievement.rewards.xp > 0) {
        await this.awardXP(userId, achievement.rewards.xp, 'achievement_unlock', achievementId);
      }

      // Create unlock record
      const unlock = {
        id: crypto.randomUUID(),
        userId,
        achievementId,
        unlockedAt: new Date(),
        celebrationShown: false,
        sharedToSocial: false
      };

      await this.db.add('achievement_unlocks', unlock);

      logger.info(`Achievement unlocked: ${achievement.name} for user ${userId}`);
    } catch (error) {
      logger.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  // ============================================================================
  // Streak Management
  // ============================================================================

  /**
   * Update user's workout streak
   */
  async updateStreak(userId: string, workoutDate: Date): Promise<UserStreak> {
    try {
      let userStreak = await this.getUserStreak(userId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const workoutDay = new Date(workoutDate);
      workoutDay.setHours(0, 0, 0, 0);
      
      const lastWorkoutDay = userStreak.lastWorkoutDate ? 
        new Date(userStreak.lastWorkoutDate) : null;
      
      if (lastWorkoutDay) {
        lastWorkoutDay.setHours(0, 0, 0, 0);
      }

      // Check if this is a new workout day
      if (!lastWorkoutDay || workoutDay.getTime() !== lastWorkoutDay.getTime()) {
        // Check if streak continues
        if (lastWorkoutDay && workoutDay.getTime() === lastWorkoutDay.getTime() + 86400000) {
          // Consecutive day
          userStreak.currentStreak += 1;
        } else if (!lastWorkoutDay || workoutDay.getTime() > lastWorkoutDay.getTime() + 86400000) {
          // Gap in streak or first workout
          userStreak.currentStreak = 1;
          userStreak.streakStartDate = workoutDay;
        }

        // Update longest streak
        if (userStreak.currentStreak > userStreak.longestStreak) {
          userStreak.longestStreak = userStreak.currentStreak;
        }

        userStreak.lastWorkoutDate = workoutDay;
        userStreak.totalWorkouts += 1;
        userStreak.updatedAt = new Date();

        // Save updated streak
        await this.db.update('user_streaks', userStreak.userId, userStreak);

        // Check for streak milestones
        await this.checkStreakMilestones(userId, userStreak.currentStreak);
      }

      return userStreak;
    } catch (error) {
      logger.error('Error updating streak:', error);
      throw error;
    }
  }

  /**
   * Use a streak freeze (sick day or vacation day)
   */
  async useStreakFreeze(
    userId: string,
    type: 'sick_day' | 'vacation_day',
    days: number
  ): Promise<boolean> {
    try {
      const userStreak = await this.getUserStreak(userId);
      
      // Check if user has enough days available
      const maxDays = type === 'sick_day' ? this.config.maxSickDays : this.config.maxVacationDays;
      const usedDays = type === 'sick_day' ? userStreak.sickDaysUsed : userStreak.vacationDaysUsed;
      
      if (usedDays + days > maxDays) {
        return false;
      }

      // Create freeze record
      const freeze = {
        id: crypto.randomUUID(),
        userId,
        type,
        startDate: new Date(),
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        approved: true,
        createdAt: new Date()
      };

      await this.db.add('streak_freezes', freeze);

      // Update user streak
      if (type === 'sick_day') {
        userStreak.sickDaysUsed += days;
      } else {
        userStreak.vacationDaysUsed += days;
      }

      userStreak.streakFreezes.push(freeze);
      await this.db.update('user_streaks', userId, userStreak);

      return true;
    } catch (error) {
      logger.error('Error using streak freeze:', error);
      return false;
    }
  }

  /**
   * Compensate a missed streak day
   */
  async compensateStreak(
    userId: string,
    missedDate: Date,
    workoutId: string
  ): Promise<boolean> {
    try {
      const userStreak = await this.getUserStreak(userId);
      
      // Check if compensation is allowed and within window
      const daysDiff = Math.floor((Date.now() - missedDate.getTime()) / (1000 * 60 * 60 * 24));
      const compensationWindow = 7; // 7 days to make up missed workout
      
      if (daysDiff > compensationWindow) {
        return false;
      }

      // Create compensation record
      const compensation = {
        id: crypto.randomUUID(),
        userId,
        missedDate,
        compensatedDate: new Date(),
        workoutId,
        createdAt: new Date()
      };

      await this.db.add('streak_compensations', compensation);

      // Update compensations used
      userStreak.compensationsUsed += 1;
      await this.db.update('user_streaks', userId, userStreak);

      return true;
    } catch (error) {
      logger.error('Error compensating streak:', error);
      return false;
    }
  }

  // ============================================================================
  // Challenge Management
  // ============================================================================

  /**
   * Join a challenge
   */
  async joinChallenge(userId: string, challengeId: string): Promise<boolean> {
    try {
      const challenge = await this.db.get('challenges', challengeId);
      if (!challenge || challenge.status !== 'active') {
        return false;
      }

      // Check if already participating
      const existing = await this.db.get('challenge_participants', `${challengeId}_${userId}`);
      if (existing) {
        return false;
      }

      // Check participant limit
      if (challenge.maxParticipants && challenge.currentParticipants >= challenge.maxParticipants) {
        return false;
      }

      // Create participant record
      const participant: ChallengeParticipant = {
        challengeId,
        userId,
        joinedAt: new Date(),
        progress: 0,
        currentValue: 0,
        rank: challenge.currentParticipants + 1,
        isCompleted: false,
        rewardsClaimed: false,
        lastUpdated: new Date()
      };

      await this.db.add('challenge_participants', participant);

      // Update challenge participant count
      challenge.currentParticipants += 1;
      await this.db.update('challenges', challengeId, challenge);

      // Award XP for joining
      await this.awardXP(userId, 10, 'challenge_completion', challengeId);

      return true;
    } catch (error) {
      logger.error('Error joining challenge:', error);
      return false;
    }
  }

  /**
   * Update challenge progress for a user
   */
  async updateChallengeProgress(
    userId: string,
    challengeId: string,
    value: number
  ): Promise<void> {
    try {
      const participant = await this.db.get('challenge_participants', `${challengeId}_${userId}`);
      if (!participant) {
        return;
      }

      participant.currentValue = value;
      participant.lastUpdated = new Date();

      // Calculate progress based on challenge requirements
      const challenge = await this.db.get('challenges', challengeId);
      if (challenge && challenge.requirements.length > 0) {
        const requirement = challenge.requirements[0]; // Simplified for now
        participant.progress = Math.min(value / requirement.targetValue, 1);
        participant.isCompleted = participant.progress >= 1;
      }

      await this.db.update('challenge_participants', participant.id, participant);

      // Update leaderboard
      await this.updateChallengeLeaderboard(challengeId);
    } catch (error) {
      logger.error('Error updating challenge progress:', error);
    }
  }

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(challengeId: string): Promise<ChallengeLeaderboard> {
    try {
      const participants = await this.db.getAll('challenge_participants', {
        index: 'challengeId',
        value: challengeId
      });

      // Sort by progress and current value
      participants.sort((a, b) => {
        if (a.progress !== b.progress) {
          return b.progress - a.progress;
        }
        return b.currentValue - a.currentValue;
      });

      // Update ranks
      participants.forEach((participant, index) => {
        participant.rank = index + 1;
      });

      // Get user details for leaderboard
      const leaderboardEntries = await Promise.all(
        participants.map(async (participant) => {
          const user = await this.db.get('users', participant.userId);
          return {
            userId: participant.userId,
            username: user?.username || 'Unknown',
            avatar: user?.profile?.avatar,
            progress: participant.progress,
            currentValue: participant.currentValue,
            rank: participant.rank,
            isCompleted: participant.isCompleted
          };
        })
      );

      return {
        challengeId,
        participants: leaderboardEntries,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error getting challenge leaderboard:', error);
      throw error;
    }
  }

  // ============================================================================
  // Statistics and Analytics
  // ============================================================================

  /**
   * Get user's gamification statistics
   */
  async getUserStats(userId: string): Promise<GamificationStats> {
    try {
      let stats = await this.db.get('gamification_stats', userId);
      
      if (!stats) {
        // Create initial stats
        stats = {
          userId,
          level: 1,
          totalXP: 0,
          currentStreak: 0,
          longestStreak: 0,
          achievementsUnlocked: 0,
          totalAchievements: this.config.achievements.length,
          challengesCompleted: 0,
          challengesWon: 0,
          socialScore: 0,
          consistencyScore: 0,
          strengthScore: 0,
          varietyScore: 0,
          lastActive: new Date(),
          updatedAt: new Date()
        };
        
        await this.db.add('gamification_stats', stats);
      }

      return stats;
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Update user statistics based on an event
   */
  async updateUserStats(userId: string, event: GamificationEvent): Promise<void> {
    try {
      const stats = await this.getUserStats(userId);
      
      // Update based on event type
      switch (event.type) {
        case 'workout_completed':
          stats.consistencyScore = Math.min(stats.consistencyScore + 1, 100);
          break;
          
        case 'pr_achieved':
          stats.strengthScore = Math.min(stats.strengthScore + 2, 100);
          break;
          
        case 'social_interaction':
          stats.socialScore = Math.min(stats.socialScore + 1, 100);
          break;
          
        case 'achievement_unlocked':
          stats.achievementsUnlocked += 1;
          break;
      }

      stats.lastActive = new Date();
      stats.updatedAt = new Date();
      
      await this.db.update('gamification_stats', userId, stats);
    } catch (error) {
      logger.error('Error updating user stats:', error);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async getUserStreak(userId: string): Promise<UserStreak> {
    let streak = await this.db.get('user_streaks', userId);
    
    if (!streak) {
      streak = {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        scheduledDays: ['monday', 'wednesday', 'friday'], // Default schedule
        compensationsUsed: 0,
        sickDaysUsed: 0,
        vacationDaysUsed: 0,
        maxSickDays: this.config.maxSickDays,
        maxVacationDays: this.config.maxVacationDays,
        lastSickDayReset: new Date(),
        lastVacationDayReset: new Date(),
        streakFreezes: [],
        updatedAt: new Date()
      };
      
      await this.db.add('user_streaks', streak);
    }
    
    return streak;
  }

  private async getDailyXP(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const transactions = await this.db.getAll('xp_transactions', {
      index: 'userId',
      value: userId
    });
    
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.createdAt);
        transactionDate.setHours(0, 0, 0, 0);
        return transactionDate.getTime() === today.getTime();
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private async isUserPremium(userId: string): Promise<boolean> {
    const user = await this.db.get('users', userId);
    return user?.role === 'premium' || user?.role === 'trainer';
  }

  private async updateUserTotalXP(userId: string, newTotalXP: number): Promise<void> {
    const stats = await this.getUserStats(userId);
    stats.totalXP = newTotalXP;
    
    const userLevel = calculateUserLevel(newTotalXP, this.config.levelConfigs);
    stats.level = userLevel.level;
    
    await this.db.update('gamification_stats', userId, stats);
  }

  private getXPDescription(source: XPSource, amount: number): string {
    const descriptions = {
      workout_completion: `Completed workout (+${amount} XP)`,
      personal_record: `New personal record (+${amount} XP)`,
      streak_milestone: `Streak milestone reached (+${amount} XP)`,
      achievement_unlock: `Achievement unlocked (+${amount} XP)`,
      social_interaction: `Social interaction (+${amount} XP)`,
      challenge_completion: `Challenge completed (+${amount} XP)`,
      consistency_bonus: `Consistency bonus (+${amount} XP)`,
      volume_milestone: `Volume milestone (+${amount} XP)`,
      first_time_bonus: `First time bonus (+${amount} XP)`,
      perfect_week: `Perfect week bonus (+${amount} XP)`,
      mentor_activity: `Mentor activity (+${amount} XP)`
    };
    
    return descriptions[source] || `XP awarded (+${amount} XP)`;
  }

  private mapSourceToEventType(source: XPSource): GamificationEvent['type'] {
    const mapping = {
      workout_completion: 'workout_completed',
      personal_record: 'pr_achieved',
      streak_milestone: 'streak_milestone',
      achievement_unlock: 'achievement_unlocked',
      social_interaction: 'social_interaction',
      challenge_completion: 'challenge_joined'
    };
    
    return mapping[source] || 'workout_completed';
  }

  private async checkStreakMilestones(userId: string, streakDays: number): Promise<void> {
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    
    if (milestones.includes(streakDays)) {
      await this.awardXP(userId, streakDays * 10, 'streak_milestone');
    }
  }

  private async updateChallengeLeaderboard(challengeId: string): Promise<void> {
    // This would update the cached leaderboard
    // Implementation depends on caching strategy
  }
}

export default GamificationService;