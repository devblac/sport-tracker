/**
 * XP Integration Service
 * 
 * This service handles the integration of XP rewards with user actions throughout the app.
 * It connects workout completion, achievements, streaks, and other activities to XP awards.
 */

import { GamificationService } from './GamificationService';
import { logger } from '@/utils/logger';
import { calculateWorkoutXP, calculatePersonalRecordXP } from '@/utils/xpCalculation';
import type { 
  XPSource, 
  XPAwardResult, 
  UserStreak,
  GamificationEvent 
} from '@/types/gamification';
import type { Workout } from '@/types/workout';
import type { PersonalRecord } from '@/types/analytics';

export class XPIntegrationService {
  private static instance: XPIntegrationService;
  private gamificationService: GamificationService;

  private constructor() {
    this.gamificationService = GamificationService.getInstance();
  }

  public static getInstance(): XPIntegrationService {
    if (!XPIntegrationService.instance) {
      XPIntegrationService.instance = new XPIntegrationService();
    }
    return XPIntegrationService.instance;
  }

  // ============================================================================
  // Workout-Related XP Awards
  // ============================================================================

  /**
   * Award XP for completing a workout
   */
  async awardWorkoutCompletionXP(
    userId: string,
    workout: Workout,
    options: {
      isFirstWorkout?: boolean;
      isPerfectForm?: boolean;
      isPersonalBest?: boolean;
    } = {}
  ): Promise<XPAwardResult | null> {
    try {
      // Get user streak for multiplier calculation
      const userStreak = await this.getUserStreak(userId);
      const isPremium = await this.isUserPremium(userId);

      // Calculate base workout XP
      let baseXP = calculateWorkoutXP(workout, userStreak, isPremium);

      // Apply bonuses
      if (options.isFirstWorkout) {
        baseXP += 100; // First workout bonus
      }

      if (options.isPerfectForm) {
        baseXP = Math.round(baseXP * 1.2); // 20% bonus for perfect form
      }

      if (options.isPersonalBest) {
        baseXP += 50; // Personal best bonus
      }

      // Award the XP
      const result = await this.gamificationService.awardXP(
        userId,
        baseXP,
        'workout_completion',
        workout.id
      );

      // Update streak
      if (workout.completedAt) {
        await this.gamificationService.updateStreak(userId, workout.completedAt);
      }

      logger.info(`Awarded ${baseXP} XP for workout completion`, {
        userId,
        workoutId: workout.id,
        workoutName: workout.name,
        baseXP,
        bonuses: options
      });

      return result;
    } catch (error) {
      logger.error('Error awarding workout completion XP:', error);
      return null;
    }
  }

  /**
   * Award XP for achieving a personal record
   */
  async awardPersonalRecordXP(
    userId: string,
    personalRecord: PersonalRecord,
    improvement: number
  ): Promise<XPAwardResult | null> {
    try {
      const xpAmount = calculatePersonalRecordXP(personalRecord, improvement);

      const result = await this.gamificationService.awardXP(
        userId,
        xpAmount,
        'personal_record',
        personalRecord.id
      );

      logger.info(`Awarded ${xpAmount} XP for personal record`, {
        userId,
        recordType: personalRecord.type,
        exerciseId: personalRecord.exerciseId,
        improvement,
        xpAmount
      });

      return result;
    } catch (error) {
      logger.error('Error awarding personal record XP:', error);
      return null;
    }
  }

  /**
   * Award XP for workout consistency
   */
  async awardConsistencyXP(
    userId: string,
    consistencyType: 'perfect_week' | 'monthly_goal' | 'streak_milestone',
    data: any
  ): Promise<XPAwardResult | null> {
    try {
      let xpAmount = 0;
      let source: XPSource = 'consistency_bonus';

      switch (consistencyType) {
        case 'perfect_week':
          xpAmount = 100;
          break;
        case 'monthly_goal':
          xpAmount = 250;
          break;
        case 'streak_milestone':
          xpAmount = data.streakDays * 10; // 10 XP per day in streak
          source = 'streak_milestone';
          break;
      }

      if (xpAmount > 0) {
        const result = await this.gamificationService.awardXP(
          userId,
          xpAmount,
          source,
          `${consistencyType}_${Date.now()}`
        );

        logger.info(`Awarded ${xpAmount} XP for consistency`, {
          userId,
          consistencyType,
          data,
          xpAmount
        });

        return result;
      }

      return null;
    } catch (error) {
      logger.error('Error awarding consistency XP:', error);
      return null;
    }
  }

  // ============================================================================
  // Social and Community XP Awards
  // ============================================================================

  /**
   * Award XP for social interactions
   */
  async awardSocialXP(
    userId: string,
    interactionType: 'like_given' | 'comment_given' | 'workout_shared' | 'friend_added' | 'mentor_session',
    targetId?: string
  ): Promise<XPAwardResult | null> {
    try {
      const xpAmounts = {
        like_given: 1,
        comment_given: 3,
        workout_shared: 15,
        friend_added: 20,
        mentor_session: 100
      };

      const xpAmount = xpAmounts[interactionType] || 0;

      if (xpAmount > 0) {
        const result = await this.gamificationService.awardXP(
          userId,
          xpAmount,
          'social_interaction',
          targetId
        );

        logger.info(`Awarded ${xpAmount} XP for social interaction`, {
          userId,
          interactionType,
          targetId,
          xpAmount
        });

        return result;
      }

      return null;
    } catch (error) {
      logger.error('Error awarding social XP:', error);
      return null;
    }
  }

  // ============================================================================
  // Challenge and Achievement XP Awards
  // ============================================================================

  /**
   * Award XP for challenge participation and completion
   */
  async awardChallengeXP(
    userId: string,
    challengeType: 'joined' | 'completed' | 'won',
    challengeData: {
      challengeId: string;
      difficulty?: number;
      rank?: number;
      totalParticipants?: number;
    }
  ): Promise<XPAwardResult | null> {
    try {
      let xpAmount = 0;
      let source: XPSource = 'challenge_completion';

      switch (challengeType) {
        case 'joined':
          xpAmount = 10;
          break;
        case 'completed':
          xpAmount = (challengeData.difficulty || 1) * 50;
          break;
        case 'won':
          const baseXP = (challengeData.difficulty || 1) * 100;
          const rankMultiplier = challengeData.rank && challengeData.totalParticipants
            ? Math.max(1, 2 - (challengeData.rank / challengeData.totalParticipants))
            : 1;
          xpAmount = Math.round(baseXP * rankMultiplier);
          break;
      }

      if (xpAmount > 0) {
        const result = await this.gamificationService.awardXP(
          userId,
          xpAmount,
          source,
          challengeData.challengeId
        );

        logger.info(`Awarded ${xpAmount} XP for challenge ${challengeType}`, {
          userId,
          challengeType,
          challengeData,
          xpAmount
        });

        return result;
      }

      return null;
    } catch (error) {
      logger.error('Error awarding challenge XP:', error);
      return null;
    }
  }

  // ============================================================================
  // Milestone and Special Event XP Awards
  // ============================================================================

  /**
   * Award XP for reaching volume milestones
   */
  async awardVolumeMilestoneXP(
    userId: string,
    milestone: number, // Total volume in kg
    period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  ): Promise<XPAwardResult | null> {
    try {
      // Calculate XP based on milestone and period
      const baseMilestones = {
        daily: { 1000: 50, 2000: 100, 3000: 200 },
        weekly: { 5000: 100, 10000: 250, 20000: 500 },
        monthly: { 20000: 200, 50000: 500, 100000: 1000 },
        all_time: { 100000: 500, 500000: 1500, 1000000: 3000 }
      };

      const milestones = baseMilestones[period];
      const xpAmount = milestones[milestone] || Math.floor(milestone / 1000) * 10;

      if (xpAmount > 0) {
        const result = await this.gamificationService.awardXP(
          userId,
          xpAmount,
          'volume_milestone',
          `${period}_${milestone}`
        );

        logger.info(`Awarded ${xpAmount} XP for volume milestone`, {
          userId,
          milestone,
          period,
          xpAmount
        });

        return result;
      }

      return null;
    } catch (error) {
      logger.error('Error awarding volume milestone XP:', error);
      return null;
    }
  }

  /**
   * Award XP for first-time activities
   */
  async awardFirstTimeXP(
    userId: string,
    activityType: 'first_workout' | 'first_pr' | 'first_share' | 'first_friend' | 'first_challenge',
    activityId?: string
  ): Promise<XPAwardResult | null> {
    try {
      const xpAmounts = {
        first_workout: 100,
        first_pr: 75,
        first_share: 50,
        first_friend: 25,
        first_challenge: 30
      };

      const xpAmount = xpAmounts[activityType] || 0;

      if (xpAmount > 0) {
        const result = await this.gamificationService.awardXP(
          userId,
          xpAmount,
          'first_time_bonus',
          activityId
        );

        logger.info(`Awarded ${xpAmount} XP for first time activity`, {
          userId,
          activityType,
          activityId,
          xpAmount
        });

        return result;
      }

      return null;
    } catch (error) {
      logger.error('Error awarding first time XP:', error);
      return null;
    }
  }

  // ============================================================================
  // Batch XP Operations
  // ============================================================================

  /**
   * Process multiple XP awards in a batch (for performance)
   */
  async processBatchXPAwards(
    awards: Array<{
      userId: string;
      amount: number;
      source: XPSource;
      sourceId?: string;
    }>
  ): Promise<XPAwardResult[]> {
    const results: XPAwardResult[] = [];

    for (const award of awards) {
      try {
        const result = await this.gamificationService.awardXP(
          award.userId,
          award.amount,
          award.source,
          award.sourceId
        );

        if (result) {
          results.push(result);
        }
      } catch (error) {
        logger.error('Error in batch XP award:', error, award);
      }
    }

    return results;
  }

  /**
   * Calculate and award all applicable XP for a completed workout
   */
  async processWorkoutCompletion(
    userId: string,
    workout: Workout,
    context: {
      personalRecords?: PersonalRecord[];
      isFirstWorkout?: boolean;
      weeklyWorkoutCount?: number;
      monthlyWorkoutCount?: number;
      totalVolume?: number;
    } = {}
  ): Promise<{
    totalXP: number;
    awards: XPAwardResult[];
    levelUps: number;
  }> {
    const awards: XPAwardResult[] = [];
    let totalXP = 0;
    let levelUps = 0;

    try {
      // 1. Award workout completion XP
      const workoutResult = await this.awardWorkoutCompletionXP(userId, workout, {
        isFirstWorkout: context.isFirstWorkout,
        isPerfectForm: this.checkPerfectForm(workout),
        isPersonalBest: (context.personalRecords?.length || 0) > 0
      });

      if (workoutResult) {
        awards.push(workoutResult);
        totalXP += workoutResult.xpAwarded;
        if (workoutResult.levelUp) levelUps++;
      }

      // 2. Award personal record XP
      if (context.personalRecords) {
        for (const pr of context.personalRecords) {
          const improvement = this.calculateImprovement(pr);
          const prResult = await this.awardPersonalRecordXP(userId, pr, improvement);
          
          if (prResult) {
            awards.push(prResult);
            totalXP += prResult.xpAwarded;
            if (prResult.levelUp) levelUps++;
          }
        }
      }

      // 3. Award consistency bonuses
      if (context.weeklyWorkoutCount === 3) { // Perfect week (assuming 3 scheduled days)
        const consistencyResult = await this.awardConsistencyXP(userId, 'perfect_week', {});
        if (consistencyResult) {
          awards.push(consistencyResult);
          totalXP += consistencyResult.xpAwarded;
          if (consistencyResult.levelUp) levelUps++;
        }
      }

      // 4. Award volume milestones
      if (context.totalVolume) {
        const volumeResult = await this.awardVolumeMilestoneXP(userId, context.totalVolume, 'daily');
        if (volumeResult) {
          awards.push(volumeResult);
          totalXP += volumeResult.xpAwarded;
          if (volumeResult.levelUp) levelUps++;
        }
      }

      // 5. Award first-time bonuses
      if (context.isFirstWorkout) {
        const firstTimeResult = await this.awardFirstTimeXP(userId, 'first_workout', workout.id);
        if (firstTimeResult) {
          awards.push(firstTimeResult);
          totalXP += firstTimeResult.xpAwarded;
          if (firstTimeResult.levelUp) levelUps++;
        }
      }

      logger.info(`Processed workout completion XP`, {
        userId,
        workoutId: workout.id,
        totalXP,
        awards: awards.length,
        levelUps
      });

      return { totalXP, awards, levelUps };
    } catch (error) {
      logger.error('Error processing workout completion XP:', error);
      return { totalXP, awards, levelUps };
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async getUserStreak(userId: string): Promise<UserStreak> {
    // This would normally get the user's streak from the gamification service
    // For now, return a default streak
    return {
      userId,
      currentStreak: 7,
      longestStreak: 14,
      totalWorkouts: 25,
      scheduledDays: ['monday', 'wednesday', 'friday'],
      compensationsUsed: 0,
      sickDaysUsed: 0,
      vacationDaysUsed: 0,
      maxSickDays: 14,
      maxVacationDays: 30,
      lastSickDayReset: new Date(),
      lastVacationDayReset: new Date(),
      streakFreezes: [],
      updatedAt: new Date()
    };
  }

  private async isUserPremium(userId: string): Promise<boolean> {
    // This would check the user's subscription status
    // For now, return false
    return false;
  }

  private checkPerfectForm(workout: Workout): boolean {
    // Check if workout has no failure sets (perfect form indicator)
    return workout.exercises.every(exercise =>
      exercise.sets.every(set => set.type !== 'failure')
    );
  }

  private calculateImprovement(personalRecord: PersonalRecord): number {
    // Calculate improvement percentage
    if (personalRecord.previousRecord) {
      return ((personalRecord.value - personalRecord.previousRecord) / personalRecord.previousRecord) * 100;
    }
    return 0;
  }

  /**
   * Get XP multiplier based on user activity level
   */
  async getActivityMultiplier(userId: string): Promise<number> {
    try {
      const userStats = await this.gamificationService.getUserStats(userId);
      const consistencyScore = userStats.consistencyScore;

      // Higher consistency = higher multiplier
      if (consistencyScore >= 90) return 1.5;
      if (consistencyScore >= 75) return 1.3;
      if (consistencyScore >= 60) return 1.2;
      if (consistencyScore >= 40) return 1.1;
      
      return 1.0;
    } catch (error) {
      logger.error('Error getting activity multiplier:', error);
      return 1.0;
    }
  }

  /**
   * Check if user qualifies for weekend bonus
   */
  isWeekendBonus(date: Date = new Date()): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Apply premium user multipliers
   */
  async applyPremiumMultipliers(userId: string, baseXP: number): Promise<number> {
    const isPremium = await this.isUserPremium(userId);
    const activityMultiplier = await this.getActivityMultiplier(userId);
    const weekendBonus = this.isWeekendBonus() ? 1.1 : 1.0;

    let finalXP = baseXP;

    if (isPremium) {
      finalXP *= 1.25; // 25% premium bonus
    }

    finalXP *= activityMultiplier;
    finalXP *= weekendBonus;

    return Math.round(finalXP);
  }
}

export default XPIntegrationService;