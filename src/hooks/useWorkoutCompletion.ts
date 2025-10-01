/**
 * useWorkoutCompletion - Enhanced hook for managing workout completion flow
 * 
 * Integrates with the new WorkoutPlayerService for real-time session tracking
 * and Supabase synchronization.
 */

import { useState, useCallback } from 'react';
import { workoutPlayerService } from '@/services/WorkoutPlayerService';
import { realGamificationService } from '@/services/RealGamificationService';
import { notificationService } from '@/services/NotificationService';
import type { Workout } from '@/schemas/workout';
import type { WorkoutCompletionData } from '@/services/WorkoutPlayerService';
import { logger } from '@/utils/logger';

interface WorkoutCompletionResult {
  success: boolean;
  completionData?: WorkoutCompletionData;
  xpEarned: number;
  achievementsUnlocked: string[];
  levelUp?: {
    oldLevel: number;
    newLevel: number;
  };
  streakUpdate?: {
    currentStreak: number;
    isNewRecord: boolean;
  };
  notifications: Array<{
    type: string;
    title: string;
    message: string;
  }>;
  celebrationTriggers: string[];
}

interface UseWorkoutCompletionReturn {
  isProcessing: boolean;
  completionResult: WorkoutCompletionResult | null;
  showRewardsModal: boolean;
  completeWorkout: (workout: Workout) => Promise<void>;
  closeRewardsModal: () => void;
  error: string | null;
}

export const useWorkoutCompletion = (): UseWorkoutCompletionReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [completionResult, setCompletionResult] = useState<WorkoutCompletionResult | null>(null);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeWorkout = useCallback(async (workout: Workout) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      logger.info('🏁 Starting enhanced workout completion process...', { workoutId: workout.id });
      
      // Complete the workout session through the player service
      const completionData = await workoutPlayerService.completeWorkoutSession(workout.id);
      
      // Get gamification results
      const gamificationResult = await realGamificationService.getRecentWorkoutRewards(workout.user_id);
      
      // Build completion result
      const result: WorkoutCompletionResult = {
        success: true,
        completionData,
        xpEarned: completionData.xpEarned,
        achievementsUnlocked: completionData.achievements,
        levelUp: gamificationResult?.levelUp,
        streakUpdate: gamificationResult?.streakUpdate,
        notifications: [
          {
            type: 'completion',
            title: 'Workout Complete! 💪',
            message: `Great job! You earned ${completionData.xpEarned} XP`
          }
        ],
        celebrationTriggers: []
      };

      // Add achievement notifications
      if (completionData.achievements.length > 0) {
        result.notifications.push({
          type: 'achievements',
          title: '🏆 New Achievements!',
          message: `You unlocked ${completionData.achievements.length} achievement${completionData.achievements.length > 1 ? 's' : ''}!`
        });
        result.celebrationTriggers.push('achievements');
      }

      // Add level up notification
      if (result.levelUp) {
        result.notifications.push({
          type: 'levelup',
          title: '🎉 Level Up!',
          message: `Congratulations! You reached level ${result.levelUp.newLevel}!`
        });
        result.celebrationTriggers.push('levelup');
      }

      // Add personal record notifications
      if (completionData.personalRecords.length > 0) {
        result.notifications.push({
          type: 'personal_records',
          title: '🔥 Personal Records!',
          message: `You set ${completionData.personalRecords.length} new personal record${completionData.personalRecords.length > 1 ? 's' : ''}!`
        });
        result.celebrationTriggers.push('personal_records');
      }

      setCompletionResult(result);
      
      // Show rewards modal if there are meaningful rewards
      const hasRewards = result.xpEarned > 0 ||
                        result.levelUp ||
                        result.achievementsUnlocked.length > 0 ||
                        completionData.personalRecords.length > 0 ||
                        (result.streakUpdate && result.streakUpdate.currentStreak > 0);
      
      if (hasRewards) {
        setShowRewardsModal(true);
      } else {
        // Show simple completion notification
        notificationService.show({
          title: 'Workout Complete! 💪',
          message: 'Great job finishing your workout!',
          type: 'success',
          duration: 3000
        });
      }
      
      // Log completion summary
      logger.info('🎉 Enhanced workout completion summary:', {
        workoutId: workout.id,
        duration: completionData.totalDuration,
        volume: completionData.totalVolume,
        xpEarned: result.xpEarned,
        levelUp: result.levelUp?.newLevel,
        achievementsUnlocked: result.achievementsUnlocked.length,
        personalRecords: completionData.personalRecords.length,
        streakUpdated: result.streakUpdate?.currentStreak,
        notificationsShown: result.notifications.length,
        celebrationsTriggered: result.celebrationTriggers.length
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('❌ Error in enhanced workout completion:', error);
      
      setError(errorMessage);
      
      // Show fallback notification
      notificationService.show({
        title: 'Workout Complete! 💪',
        message: 'Great job! (Some features may be temporarily unavailable)',
        type: 'success',
        duration: 3000
      });
      
      // Create minimal completion result for UI
      setCompletionResult({
        success: false,
        xpEarned: 0,
        achievementsUnlocked: [],
        notifications: [{
          type: 'completion',
          title: 'Workout Complete!',
          message: 'Great job finishing your workout!'
        }],
        celebrationTriggers: []
      });
      
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const closeRewardsModal = useCallback(() => {
    setShowRewardsModal(false);
    
    // Clear completion result after a delay to allow for animations
    setTimeout(() => {
      setCompletionResult(null);
      setError(null);
    }, 500);
  }, []);

  return {
    isProcessing,
    completionResult,
    showRewardsModal,
    completeWorkout,
    closeRewardsModal,
    error
  };
};

export default useWorkoutCompletion;