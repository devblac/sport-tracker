/**
 * Streaks Hook
 * 
 * Custom hook for managing intelligent streak system with personalized
 * schedules, compensation days, and comprehensive tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { StreakManager } from '@/services/StreakManager';
import { logger } from '@/utils/logger';
import type {
  StreakSchedule,
  StreakPeriod,
  StreakStats,
  StreakConfig,
  StreakDay,
  StreakCalendarMonth
} from '@/types/streaks';
import type { Workout } from '@/types/workout';

interface UseStreaksOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseStreaksReturn {
  // Data
  schedules: StreakSchedule[];
  activeSchedule: StreakSchedule | null;
  currentPeriod: StreakPeriod | null;
  stats: StreakStats | null;
  config: StreakConfig;
  
  // Schedule management
  createSchedule: (schedule: Omit<StreakSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<StreakSchedule | null>;
  updateSchedule: (scheduleId: string, updates: Partial<StreakSchedule>) => Promise<StreakSchedule | null>;
  setActiveSchedule: (scheduleId: string) => void;
  
  // Workout recording
  recordWorkout: (workout: Workout, scheduleId?: string) => Promise<void>;
  
  // Special day management
  markSickDay: (date: string, scheduleId: string, notes?: string) => Promise<boolean>;
  markVacationDay: (date: string, scheduleId: string, notes?: string) => Promise<boolean>;
  compensateMissedDay: (missedDate: string, compensationDate: string, scheduleId: string, workoutId: string) => Promise<boolean>;
  
  // Calendar and analytics
  getCalendarData: (scheduleId: string, month?: string) => Promise<StreakCalendarMonth | null>;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
  processDailyUpdates: () => Promise<void>;
}

export const useStreaks = ({
  userId,
  autoRefresh = true,
  refreshInterval = 60000 // 1 minute
}: UseStreaksOptions): UseStreaksReturn => {
  // State
  const [schedules, setSchedules] = useState<StreakSchedule[]>([]);
  const [activeSchedule, setActiveScheduleState] = useState<StreakSchedule | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<StreakPeriod | null>(null);
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [config, setConfig] = useState<StreakConfig>(StreakManager.getInstance().getConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Services
  const streakManager = useRef(StreakManager.getInstance());
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Load all streak data
   */
  const loadStreakData = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load schedules
      const userSchedules = await streakManager.current.getUserSchedules(userId);
      setSchedules(userSchedules);

      // Set active schedule (first active one or first one)
      const active = userSchedules.find(s => s.isActive) || userSchedules[0] || null;
      setActiveScheduleState(active);

      // Load current period for active schedule
      if (active) {
        const period = await streakManager.current.getActiveStreakPeriod(active.id);
        setCurrentPeriod(period);
      }

      // Load stats
      const streakStats = await streakManager.current.getStreakStats(userId);
      setStats(streakStats);

      logger.info('Streak data loaded successfully');
    } catch (err) {
      logger.error('Failed to load streak data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load streak data');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Create a new streak schedule
   */
  const createSchedule = useCallback(async (
    schedule: Omit<StreakSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<StreakSchedule | null> => {
    try {
      setError(null);
      const newSchedule = await streakManager.current.createSchedule(userId, schedule);
      
      // Refresh data
      await loadStreakData();
      
      logger.info('Created new streak schedule:', newSchedule.name);
      return newSchedule;
    } catch (err) {
      logger.error('Failed to create schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
      return null;
    }
  }, [userId, loadStreakData]);

  /**
   * Update a streak schedule
   */
  const updateSchedule = useCallback(async (
    scheduleId: string,
    updates: Partial<StreakSchedule>
  ): Promise<StreakSchedule | null> => {
    try {
      setError(null);
      const updatedSchedule = await streakManager.current.updateSchedule(scheduleId, updates);
      
      if (updatedSchedule) {
        // Update local state
        setSchedules(prev => prev.map(s => s.id === scheduleId ? updatedSchedule : s));
        
        if (activeSchedule?.id === scheduleId) {
          setActiveScheduleState(updatedSchedule);
        }
        
        logger.info('Updated streak schedule:', scheduleId);
      }
      
      return updatedSchedule;
    } catch (err) {
      logger.error('Failed to update schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
      return null;
    }
  }, [activeSchedule]);

  /**
   * Set active schedule
   */
  const setActiveSchedule = useCallback(async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    setActiveScheduleState(schedule);
    
    // Load period for new active schedule
    try {
      const period = await streakManager.current.getActiveStreakPeriod(scheduleId);
      setCurrentPeriod(period);
    } catch (err) {
      logger.error('Failed to load period for active schedule:', err);
    }
  }, [schedules]);

  /**
   * Record a workout
   */
  const recordWorkout = useCallback(async (
    workout: Workout,
    scheduleId?: string
  ): Promise<void> => {
    try {
      setError(null);
      await streakManager.current.recordWorkout(userId, workout, scheduleId);
      
      // Refresh data
      await loadStreakData();
      
      logger.info('Recorded workout for streak tracking');
    } catch (err) {
      logger.error('Failed to record workout:', err);
      setError(err instanceof Error ? err.message : 'Failed to record workout');
    }
  }, [userId, loadStreakData]);

  /**
   * Mark a day as sick day
   */
  const markSickDay = useCallback(async (
    date: string,
    scheduleId: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      setError(null);
      const success = await streakManager.current.markSickDay(userId, date, scheduleId, notes);
      
      if (success) {
        await loadStreakData();
        logger.info(`Marked ${date} as sick day`);
      }
      
      return success;
    } catch (err) {
      logger.error('Failed to mark sick day:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark sick day');
      return false;
    }
  }, [userId, loadStreakData]);

  /**
   * Mark a day as vacation day
   */
  const markVacationDay = useCallback(async (
    date: string,
    scheduleId: string,
    notes?: string
  ): Promise<boolean> => {
    try {
      setError(null);
      const success = await streakManager.current.markVacationDay(userId, date, scheduleId, notes);
      
      if (success) {
        await loadStreakData();
        logger.info(`Marked ${date} as vacation day`);
      }
      
      return success;
    } catch (err) {
      logger.error('Failed to mark vacation day:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark vacation day');
      return false;
    }
  }, [userId, loadStreakData]);

  /**
   * Compensate for a missed day
   */
  const compensateMissedDay = useCallback(async (
    missedDate: string,
    compensationDate: string,
    scheduleId: string,
    workoutId: string
  ): Promise<boolean> => {
    try {
      setError(null);
      const success = await streakManager.current.compensateMissedDay(
        userId,
        missedDate,
        compensationDate,
        scheduleId,
        workoutId
      );
      
      if (success) {
        await loadStreakData();
        logger.info(`Compensated missed day ${missedDate} with ${compensationDate}`);
      }
      
      return success;
    } catch (err) {
      logger.error('Failed to compensate missed day:', err);
      setError(err instanceof Error ? err.message : 'Failed to compensate missed day');
      return false;
    }
  }, [userId, loadStreakData]);

  /**
   * Get calendar data for a schedule
   */
  const getCalendarData = useCallback(async (
    scheduleId: string,
    month?: string
  ): Promise<StreakCalendarMonth | null> => {
    try {
      // This would be implemented in StreakManager
      // For now, return null as placeholder
      logger.info(`Getting calendar data for schedule ${scheduleId}, month ${month}`);
      return null;
    } catch (err) {
      logger.error('Failed to get calendar data:', err);
      return null;
    }
  }, []);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    await loadStreakData();
  }, [loadStreakData]);

  /**
   * Process daily updates
   */
  const processDailyUpdates = useCallback(async () => {
    try {
      setError(null);
      await streakManager.current.processDailyUpdates();
      await loadStreakData();
      logger.info('Daily updates processed');
    } catch (err) {
      logger.error('Failed to process daily updates:', err);
      setError(err instanceof Error ? err.message : 'Failed to process daily updates');
    }
  }, [loadStreakData]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Initial data load
  useEffect(() => {
    if (userId) {
      loadStreakData();
    }
  }, [userId, loadStreakData]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && userId && refreshInterval > 0) {
      const setupRefresh = () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        refreshTimeoutRef.current = setTimeout(() => {
          loadStreakData().then(setupRefresh);
        }, refreshInterval);
      };

      setupRefresh();

      return () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    }
  }, [autoRefresh, userId, refreshInterval, loadStreakData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Data
    schedules,
    activeSchedule,
    currentPeriod,
    stats,
    config,
    
    // Schedule management
    createSchedule,
    updateSchedule,
    setActiveSchedule,
    
    // Workout recording
    recordWorkout,
    
    // Special day management
    markSickDay,
    markVacationDay,
    compensateMissedDay,
    
    // Calendar and analytics
    getCalendarData,
    
    // State
    isLoading,
    error,
    
    // Actions
    refreshData,
    processDailyUpdates
  };
};

/**
 * Simplified hook for quick streak operations
 */
export const useQuickStreaks = (userId: string) => {
  const streakManager = useRef(StreakManager.getInstance());

  const quickRecordWorkout = useCallback(async (workout: Workout) => {
    try {
      await streakManager.current.recordWorkout(userId, workout);
      return true;
    } catch (error) {
      logger.error('Error in quick workout record:', error);
      return false;
    }
  }, [userId]);

  const quickGetStats = useCallback(async () => {
    try {
      return await streakManager.current.getStreakStats(userId);
    } catch (error) {
      logger.error('Error getting quick stats:', error);
      return null;
    }
  }, [userId]);

  const quickMarkSpecialDay = useCallback(async (
    date: string,
    type: 'sick' | 'vacation',
    scheduleId: string,
    notes?: string
  ) => {
    try {
      if (type === 'sick') {
        return await streakManager.current.markSickDay(userId, date, scheduleId, notes);
      } else {
        return await streakManager.current.markVacationDay(userId, date, scheduleId, notes);
      }
    } catch (error) {
      logger.error(`Error marking ${type} day:`, error);
      return false;
    }
  }, [userId]);

  return {
    quickRecordWorkout,
    quickGetStats,
    quickMarkSpecialDay
  };
};

export default useStreaks;