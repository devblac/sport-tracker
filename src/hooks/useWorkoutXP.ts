/**
 * Workout XP Hook
 * 
 * Custom hook that handles XP integration for workout-related actions.
 * Automatically awards XP when workouts are completed, PRs are achieved, etc.
 */

import { useCallback, useRef } from 'react';
import { XPIntegrationService } from '@/services/XPIntegrationService';
import { useGamification } from './useGamification';
import { logger } from '@/utils/logger';
import type { Workout } from '@/types/workout';
import type { PersonalRecord } from '@/types/analytics';
import type { XPAwardResult } from '@/types/gamification';

interface UseWorkoutXPOptions {
  userId: string;
  autoAward?: boolean; // Automatically award XP on actions
  showNotifications?: boolean; // Show XP gain notifications
}

interface UseWorkoutXPReturn {
  // XP Award Functions
  awardWorkoutCompletion: (workout: Workout, context?: WorkoutCompletionContext) => Promise<XPAwardResult[]>;
  awardPersonalRecord: (pr: PersonalRecord, improvement: number) => Promise<XPAwardResult | null>;
  awardSocialInteraction: (type: SocialInteractionType, targetId?: string) => Promise<XPAwardResult | null>;
  awardConsistency: (type: ConsistencyType, data?: any) => Promise<XPAwardResult | null>;
  
  // Batch Operations
  processWorkoutCompletion: (workout: Workout, context?: WorkoutCompletionContext) => Promise<WorkoutXPResult>;
  
  // Utilities
  calculatePotentialXP: (workout: Workout) => Promise<number>;
  getXPMultipliers: () => Promise<XPMultipliers>;
  
  // State
  isProcessing: boolean;
  lastXPAward: XPAwardResult | null;
}

interface WorkoutCompletionContext {
  personalRecords?: PersonalRecord[];
  isFirstWorkout?: boolean;
  weeklyWorkoutCount?: number;
  monthlyWorkoutCount?: number;
  totalVolume?: number;
  perfectForm?: boolean;
}

interface WorkoutXPResult {
  totalXP: number;
  awards: XPAwardResult[];
  levelUps: number;
  achievements: string[];
}

type SocialInteractionType = 'like_given' | 'comment_given' | 'workout_shared' | 'friend_added' | 'mentor_session';
type ConsistencyType = 'perfect_week' | 'monthly_goal' | 'streak_milestone';

interface XPMultipliers {
  premium: number;
  activity: number;
  weekend: number;
  streak: number;
}

export const useWorkoutXP = ({
  userId,
  autoAward = true,
  showNotifications = true
}: UseWorkoutXPOptions): UseWorkoutXPReturn => {
  const xpIntegrationService = useRef(XPIntegrationService.getInstance());
  const { awardXP, userLevel, userStreak } = useGamification({ userId });
  
  // Track processing state
  const isProcessingRef = useRef(false);
  const lastXPAwardRef = useRef<XPAwardResult | null>(null);

  /**
   * Award XP for workout completion
   */
  const awardWorkoutCompletion = useCallback(async (
    workout: Workout,
    context: WorkoutCompletionContext = {}
  ): Promise<XPAwardResult[]> => {
    if (!autoAward || isProcessingRef.current) return [];

    try {
      isProcessingRef.current = true;

      const result = await xpIntegrationService.current.awardWorkoutCompletionXP(
        userId,
        workout,
        {
          isFirstWorkout: context.isFirstWorkout,
          isPerfectForm: context.perfectForm,
          isPersonalBest: (context.personalRecords?.length || 0) > 0
        }
      );

      const awards = result ? [result] : [];
      
      if (result) {
        lastXPAwardRef.current = result;
        
        if (showNotifications) {
          // This would trigger a notification/toast
          logger.info(`Awarded ${result.xpAwarded} XP for workout completion`);
        }
      }

      return awards;
    } catch (error) {
      logger.error('Error awarding workout completion XP:', error);
      return [];
    } finally {
      isProcessingRef.current = false;
    }
  }, [userId, autoAward, showNotifications]);

  /**
   * Award XP for personal record
   */
  const awardPersonalRecord = useCallback(async (
    pr: PersonalRecord,
    improvement: number
  ): Promise<XPAwardResult | null> => {
    if (!autoAward || isProcessingRef.current) return null;

    try {
      const result = await xpIntegrationService.current.awardPersonalRecordXP(
        userId,
        pr,
        improvement
      );

      if (result) {
        lastXPAwardRef.current = result;
        
        if (showNotifications) {
          logger.info(`Awarded ${result.xpAwarded} XP for personal record`);
        }
      }

      return result;
    } catch (error) {
      logger.error('Error awarding personal record XP:', error);
      return null;
    }
  }, [userId, autoAward, showNotifications]);

  /**
   * Award XP for social interactions
   */
  const awardSocialInteraction = useCallback(async (
    type: SocialInteractionType,
    targetId?: string
  ): Promise<XPAwardResult | null> => {
    if (!autoAward) return null;

    try {
      const result = await xpIntegrationService.current.awardSocialXP(
        userId,
        type,
        targetId
      );

      if (result && showNotifications) {
        logger.info(`Awarded ${result.xpAwarded} XP for ${type}`);
      }

      return result;
    } catch (error) {
      logger.error('Error awarding social XP:', error);
      return null;
    }
  }, [userId, autoAward, showNotifications]);

  /**
   * Award XP for consistency achievements
   */
  const awardConsistency = useCallback(async (
    type: ConsistencyType,
    data?: any
  ): Promise<XPAwardResult | null> => {
    if (!autoAward) return null;

    try {
      const result = await xpIntegrationService.current.awardConsistencyXP(
        userId,
        type,
        data
      );

      if (result && showNotifications) {
        logger.info(`Awarded ${result.xpAwarded} XP for ${type}`);
      }

      return result;
    } catch (error) {
      logger.error('Error awarding consistency XP:', error);
      return null;
    }
  }, [userId, autoAward, showNotifications]);

  /**
   * Process complete workout completion with all applicable XP awards
   */
  const processWorkoutCompletion = useCallback(async (
    workout: Workout,
    context: WorkoutCompletionContext = {}
  ): Promise<WorkoutXPResult> => {
    if (isProcessingRef.current) {
      return { totalXP: 0, awards: [], levelUps: 0, achievements: [] };
    }

    try {
      isProcessingRef.current = true;

      const result = await xpIntegrationService.current.processWorkoutCompletion(
        userId,
        workout,
        context
      );

      // Extract achievements from awards
      const achievements = result.awards
        .flatMap(award => award.achievementsUnlocked || [])
        .map(achievement => achievement.id);

      if (showNotifications && result.totalXP > 0) {
        logger.info(`Total XP awarded: ${result.totalXP}`, {
          awards: result.awards.length,
          levelUps: result.levelUps,
          achievements: achievements.length
        });
      }

      return {
        totalXP: result.totalXP,
        awards: result.awards,
        levelUps: result.levelUps,
        achievements
      };
    } catch (error) {
      logger.error('Error processing workout completion XP:', error);
      return { totalXP: 0, awards: [], levelUps: 0, achievements: [] };
    } finally {
      isProcessingRef.current = false;
    }
  }, [userId, showNotifications]);

  /**
   * Calculate potential XP for a workout (preview)
   */
  const calculatePotentialXP = useCallback(async (workout: Workout): Promise<number> => {
    try {
      if (!userStreak) return 0;

      // Use the XP calculation utility directly for preview
      const { calculateWorkoutXP } = await import('@/utils/xpCalculation');
      const isPremium = false; // Would check actual premium status
      
      return calculateWorkoutXP(workout, userStreak, isPremium);
    } catch (error) {
      logger.error('Error calculating potential XP:', error);
      return 0;
    }
  }, [userStreak]);

  /**
   * Get current XP multipliers for the user
   */
  const getXPMultipliers = useCallback(async (): Promise<XPMultipliers> => {
    try {
      const activityMultiplier = await xpIntegrationService.current.getActivityMultiplier(userId);
      const weekendBonus = xpIntegrationService.current.isWeekendBonus() ? 1.1 : 1.0;
      const streakMultiplier = userStreak ? Math.min(1 + (userStreak.currentStreak * 0.02), 2.0) : 1.0;

      return {
        premium: 1.25, // Would check actual premium status
        activity: activityMultiplier,
        weekend: weekendBonus,
        streak: streakMultiplier
      };
    } catch (error) {
      logger.error('Error getting XP multipliers:', error);
      return { premium: 1.0, activity: 1.0, weekend: 1.0, streak: 1.0 };
    }
  }, [userId, userStreak]);

  return {
    // XP Award Functions
    awardWorkoutCompletion,
    awardPersonalRecord,
    awardSocialInteraction,
    awardConsistency,
    
    // Batch Operations
    processWorkoutCompletion,
    
    // Utilities
    calculatePotentialXP,
    getXPMultipliers,
    
    // State
    isProcessing: isProcessingRef.current,
    lastXPAward: lastXPAwardRef.current
  };
};

/**
 * Simplified hook for quick XP operations
 */
export const useQuickXP = (userId: string) => {
  const xpIntegrationService = useRef(XPIntegrationService.getInstance());

  const quickAward = useCallback(async (
    amount: number,
    source: string,
    sourceId?: string
  ) => {
    try {
      return await xpIntegrationService.current.gamificationService.awardXP(
        userId,
        amount,
        source as any,
        sourceId
      );
    } catch (error) {
      logger.error('Error in quick XP award:', error);
      return null;
    }
  }, [userId]);

  return { quickAward };
};

export default useWorkoutXP;