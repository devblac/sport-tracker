/**
 * Fitness Achievements Hook
 * 
 * Custom hook for managing fitness-specific achievements.
 * Provides easy access to achievement checking and progress tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FitnessAchievementService, type FitnessAchievementContext, type FitnessAchievementResult } from '@/services/FitnessAchievementService';
import { useAchievementNotifications } from '@/components/gamification/AchievementNotifications';
import { logger } from '@/utils/logger';
import type { Achievement } from '@/types/gamification';
import type { Workout } from '@/types/workout';
import type { PersonalRecord } from '@/types/analytics';

interface UseFitnessAchievementsOptions {
  userId: string;
  autoTriggerNotifications?: boolean;
  enableLogging?: boolean;
}

interface UseFitnessAchievementsReturn {
  // Achievement checking functions
  checkWorkoutAchievements: (workout: Workout, context?: FitnessAchievementContext) => Promise<FitnessAchievementResult>;
  checkPersonalRecordAchievements: (pr: PersonalRecord, context?: FitnessAchievementContext) => Promise<FitnessAchievementResult>;
  checkStreakAchievements: (streakDays: number, context?: FitnessAchievementContext) => Promise<FitnessAchievementResult>;
  
  // Manual testing
  triggerAchievementCheck: (achievementIds: string[], context?: FitnessAchievementContext) => Promise<FitnessAchievementResult>;
  
  // Achievement data
  fitnessAchievements: Achievement[];
  getAchievementsByCategory: (category: string) => Achievement[];
  getAchievementsByRarity: (rarity: string) => Achievement[];
  
  // State
  isProcessing: boolean;
  lastResult: FitnessAchievementResult | null;
  error: string | null;
  
  // Statistics
  totalChecks: number;
  totalUnlocks: number;
  recentUnlocks: Achievement[];
}

export const useFitnessAchievements = ({
  userId,
  autoTriggerNotifications = true,
  enableLogging = false
}: UseFitnessAchievementsOptions): UseFitnessAchievementsReturn => {
  // State
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<FitnessAchievementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalChecks, setTotalChecks] = useState(0);
  const [totalUnlocks, setTotalUnlocks] = useState(0);
  const [recentUnlocks, setRecentUnlocks] = useState<Achievement[]>([]);
  
  // Services
  const fitnessAchievementService = useRef(FitnessAchievementService.getInstance());
  const { triggerUnlock, triggerProgress } = useAchievementNotifications(userId);
  
  // Achievement data
  const fitnessAchievements = fitnessAchievementService.current.getFitnessAchievements();
  
  /**
   * Process achievement result and trigger notifications
   */
  const processAchievementResult = useCallback((result: FitnessAchievementResult) => {
    setLastResult(result);
    setTotalChecks(prev => prev + 1);
    
    if (result.unlockedAchievements.length > 0) {\n      setTotalUnlocks(prev => prev + result.unlockedAchievements.length);\n      setRecentUnlocks(prev => {\n        const updated = [...result.unlockedAchievements, ...prev];\n        return updated.slice(0, 10); // Keep last 10 unlocks\n      });\n      \n      // Trigger notifications for unlocked achievements\n      if (autoTriggerNotifications) {\n        result.unlockedAchievements.forEach(achievement => {\n          const unlockResult = {\n            achievement,\n            previousProgress: 0.8, // Approximate\n            newProgress: 1.0,\n            unlockedAt: new Date(),\n            xpAwarded: achievement.rewards.xp\n          };\n          triggerUnlock(unlockResult);\n        });\n      }\n    }\n    \n    // Trigger progress notifications\n    if (autoTriggerNotifications && result.progressUpdates.length > 0) {\n      result.progressUpdates.forEach(({ achievement, previousProgress, newProgress }) => {\n        // Only show progress notifications for significant increases\n        if (newProgress - previousProgress >= 0.1) {\n          triggerProgress(achievement, previousProgress, newProgress);\n        }\n      });\n    }\n    \n    if (enableLogging) {\n      logger.info('Fitness achievement check completed:', {\n        checkedAchievements: result.checkedAchievements,\n        unlockedAchievements: result.unlockedAchievements.length,\n        progressUpdates: result.progressUpdates.length,\n        errors: result.errors.length\n      });\n    }\n  }, [autoTriggerNotifications, enableLogging, triggerUnlock, triggerProgress]);\n\n  /**\n   * Check achievements after workout completion\n   */\n  const checkWorkoutAchievements = useCallback(async (\n    workout: Workout,\n    context: FitnessAchievementContext = {}\n  ): Promise<FitnessAchievementResult> => {\n    if (isProcessing) {\n      logger.warn('Achievement check already in progress');\n      return {\n        checkedAchievements: 0,\n        unlockedAchievements: [],\n        progressUpdates: [],\n        errors: ['Check already in progress']\n      };\n    }\n\n    try {\n      setIsProcessing(true);\n      setError(null);\n      \n      const result = await fitnessAchievementService.current.checkWorkoutAchievements(\n        userId,\n        workout,\n        context\n      );\n      \n      processAchievementResult(result);\n      return result;\n    } catch (err) {\n      const errorMessage = err instanceof Error ? err.message : 'Unknown error';\n      setError(errorMessage);\n      logger.error('Error checking workout achievements:', err);\n      \n      return {\n        checkedAchievements: 0,\n        unlockedAchievements: [],\n        progressUpdates: [],\n        errors: [errorMessage]\n      };\n    } finally {\n      setIsProcessing(false);\n    }\n  }, [userId, isProcessing, processAchievementResult]);\n\n  /**\n   * Check achievements after personal record\n   */\n  const checkPersonalRecordAchievements = useCallback(async (\n    personalRecord: PersonalRecord,\n    context: FitnessAchievementContext = {}\n  ): Promise<FitnessAchievementResult> => {\n    if (isProcessing) {\n      logger.warn('Achievement check already in progress');\n      return {\n        checkedAchievements: 0,\n        unlockedAchievements: [],\n        progressUpdates: [],\n        errors: ['Check already in progress']\n      };\n    }\n\n    try {\n      setIsProcessing(true);\n      setError(null);\n      \n      const result = await fitnessAchievementService.current.checkPersonalRecordAchievements(\n        userId,\n        personalRecord,\n        context\n      );\n      \n      processAchievementResult(result);\n      return result;\n    } catch (err) {\n      const errorMessage = err instanceof Error ? err.message : 'Unknown error';\n      setError(errorMessage);\n      logger.error('Error checking PR achievements:', err);\n      \n      return {\n        checkedAchievements: 0,\n        unlockedAchievements: [],\n        progressUpdates: [],\n        errors: [errorMessage]\n      };\n    } finally {\n      setIsProcessing(false);\n    }\n  }, [userId, isProcessing, processAchievementResult]);\n\n  /**\n   * Check achievements for streak milestones\n   */\n  const checkStreakAchievements = useCallback(async (\n    streakDays: number,\n    context: FitnessAchievementContext = {}\n  ): Promise<FitnessAchievementResult> => {\n    if (isProcessing) {\n      logger.warn('Achievement check already in progress');\n      return {\n        checkedAchievements: 0,\n        unlockedAchievements: [],\n        progressUpdates: [],\n        errors: ['Check already in progress']\n      };\n    }\n\n    try {\n      setIsProcessing(true);\n      setError(null);\n      \n      const result = await fitnessAchievementService.current.checkStreakAchievements(\n        userId,\n        streakDays,\n        context\n      );\n      \n      processAchievementResult(result);\n      return result;\n    } catch (err) {\n      const errorMessage = err instanceof Error ? err.message : 'Unknown error';\n      setError(errorMessage);\n      logger.error('Error checking streak achievements:', err);\n      \n      return {\n        checkedAchievements: 0,\n        unlockedAchievements: [],\n        progressUpdates: [],\n        errors: [errorMessage]\n      };\n    } finally {\n      setIsProcessing(false);\n    }\n  }, [userId, isProcessing, processAchievementResult]);\n\n  /**\n   * Manually trigger achievement check for testing\n   */\n  const triggerAchievementCheck = useCallback(async (\n    achievementIds: string[],\n    context: FitnessAchievementContext = {}\n  ): Promise<FitnessAchievementResult> => {\n    if (isProcessing) {\n      logger.warn('Achievement check already in progress');\n      return {\n        checkedAchievements: 0,\n        unlockedAchievements: [],\n        progressUpdates: [],\n        errors: ['Check already in progress']\n      };\n    }\n\n    try {\n      setIsProcessing(true);\n      setError(null);\n      \n      const result = await fitnessAchievementService.current.triggerAchievementCheck(\n        userId,\n        achievementIds,\n        context\n      );\n      \n      processAchievementResult(result);\n      return result;\n    } catch (err) {\n      const errorMessage = err instanceof Error ? err.message : 'Unknown error';\n      setError(errorMessage);\n      logger.error('Error in manual achievement check:', err);\n      \n      return {\n        checkedAchievements: 0,\n        unlockedAchievements: [],\n        progressUpdates: [],\n        errors: [errorMessage]\n      };\n    } finally {\n      setIsProcessing(false);\n    }\n  }, [userId, isProcessing, processAchievementResult]);\n\n  /**\n   * Get achievements by category\n   */\n  const getAchievementsByCategory = useCallback((category: string): Achievement[] => {\n    return fitnessAchievementService.current.getAchievementsByCategory(category);\n  }, []);\n\n  /**\n   * Get achievements by rarity\n   */\n  const getAchievementsByRarity = useCallback((rarity: string): Achievement[] => {\n    return fitnessAchievementService.current.getAchievementsByRarity(rarity);\n  }, []);\n\n  // Clear error when user changes\n  useEffect(() => {\n    setError(null);\n    setLastResult(null);\n  }, [userId]);\n\n  return {\n    // Achievement checking functions\n    checkWorkoutAchievements,\n    checkPersonalRecordAchievements,\n    checkStreakAchievements,\n    triggerAchievementCheck,\n    \n    // Achievement data\n    fitnessAchievements,\n    getAchievementsByCategory,\n    getAchievementsByRarity,\n    \n    // State\n    isProcessing,\n    lastResult,\n    error,\n    \n    // Statistics\n    totalChecks,\n    totalUnlocks,\n    recentUnlocks\n  };\n};\n\n/**\n * Simplified hook for quick fitness achievement operations\n */\nexport const useQuickFitnessAchievements = (userId: string) => {\n  const fitnessAchievementService = useRef(FitnessAchievementService.getInstance());\n\n  const quickWorkoutCheck = useCallback(async (workout: Workout) => {\n    try {\n      return await fitnessAchievementService.current.checkWorkoutAchievements(userId, workout);\n    } catch (error) {\n      logger.error('Error in quick workout check:', error);\n      return {\n        checkedAchievements: 0,\n        unlockedAchievements: [],\n        progressUpdates: [],\n        errors: [error instanceof Error ? error.message : 'Unknown error']\n      };\n    }\n  }, [userId]);\n\n  const quickPRCheck = useCallback(async (personalRecord: PersonalRecord) => {\n    try {\n      return await fitnessAchievementService.current.checkPersonalRecordAchievements(userId, personalRecord);\n    } catch (error) {\n      logger.error('Error in quick PR check:', error);\n      return {\n        checkedAchievements: 0,\n        unlockedAchievements: [],\n        progressUpdates: [],\n        errors: [error instanceof Error ? error.message : 'Unknown error']\n      };\n    }\n  }, [userId]);\n\n  const quickStreakCheck = useCallback(async (streakDays: number) => {\n    try {\n      return await fitnessAchievementService.current.checkStreakAchievements(userId, streakDays);\n    } catch (error) {\n      logger.error('Error in quick streak check:', error);\n      return {\n        checkedAchievements: 0,\n        unlockedAchievements: [],\n        progressUpdates: [],\n        errors: [error instanceof Error ? error.message : 'Unknown error']\n      };\n    }\n  }, [userId]);\n\n  return {\n    quickWorkoutCheck,\n    quickPRCheck,\n    quickStreakCheck,\n    getFitnessAchievements: () => fitnessAchievementService.current.getFitnessAchievements()\n  };\n};\n\nexport default useFitnessAchievements;"