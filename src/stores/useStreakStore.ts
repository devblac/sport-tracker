/**
 * Streak Store
 * 
 * Zustand store for managing intelligent streak system state including
 * personalized schedules, compensation days, and streak notifications.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/utils/logger';
import { OptimizedStreakService } from '@/services/OptimizedStreakService';
import { StreakRewardService } from '@/services/StreakRewardService';
import { NotificationService } from '@/services/NotificationService';

import type {
  StreakSchedule,
  StreakPeriod,
  StreakStats,
  StreakConfig,
  StreakNotification,
  StreakCalendarMonth
} from '@/types/streaks';

import type {
  StreakTitle,
  StreakShield,
  UserStreakRewards,
  StreakRewardNotification
} from '@/types/streakRewards';

interface StreakState {
  // Core data
  schedules: StreakSchedule[];
  activeSchedule: StreakSchedule | null;
  currentPeriod: StreakPeriod | null;
  stats: StreakStats | null;
  config: StreakConfig;
  
  // Rewards data
  userRewards: UserStreakRewards | null;
  activeTitle: StreakTitle | null;
  availableShields: StreakShield[];
  activeShields: StreakShield[];
  
  // Notifications
  notifications: StreakNotification[];
  rewardNotifications: StreakRewardNotification[];
  unreadNotifications: number;
  
  // Calendar data
  calendarData: StreakCalendarMonth | null;
  
  // UI state
  isLoading: boolean;
  isCheckingRewards: boolean;
  error: string | null;
  
  // Actions
  initializeStreaks: (userId: string) => Promise<void>;
  createSchedule: (userId: string, schedule: Omit<StreakSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<StreakSchedule | null>;
  updateSchedule: (scheduleId: string, updates: Partial<StreakSchedule>) => Promise<StreakSchedule | null>;
  setActiveSchedule: (scheduleId: string) => Promise<void>;
  
  // Workout recording
  recordWorkout: (userId: string, workout: any, scheduleId?: string) => Promise<void>;
  
  // Special day management
  markSickDay: (userId: string, date: string, scheduleId: string, notes?: string) => Promise<boolean>;
  markVacationDay: (userId: string, date: string, scheduleId: string, notes?: string) => Promise<boolean>;
  compensateMissedDay: (userId: string, missedDate: string, compensationDate: string, scheduleId: string, workoutId: string) => Promise<boolean>;
  
  // Rewards
  checkForNewRewards: (userId: string) => Promise<void>;
  setActiveTitle: (userId: string, titleId: string) => Promise<boolean>;
  useShield: (userId: string, shieldId: string) => Promise<{ success: boolean; message: string }>;
  
  // Notifications
  createStreakRiskNotification: (userId: string, riskLevel: 'low' | 'medium' | 'high') => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  dismissNotification: (notificationId: string) => void;
  
  // Calendar
  loadCalendarData: (scheduleId: string, month?: string) => Promise<void>;
  
  // Utility
  refreshData: (userId: string) => Promise<void>;
  processDailyUpdates: () => Promise<void>;
  clearError: () => void;
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      // Initial state
      schedules: [],
      activeSchedule: null,
      currentPeriod: null,
      stats: null,
      config: OptimizedStreakService.getInstance().getConfig(),
      
      userRewards: null,
      activeTitle: null,
      availableShields: [],
      activeShields: [],
      
      notifications: [],
      rewardNotifications: [],
      unreadNotifications: 0,
      
      calendarData: null,
      
      isLoading: false,
      isCheckingRewards: false,
      error: null,

      // ============================================================================
      // Initialization
      // ============================================================================

      initializeStreaks: async (userId: string) => {
        if (!userId) return;

        try {
          set({ isLoading: true, error: null });

          const streakManager = OptimizedStreakService.getInstance();
          const rewardService = StreakRewardService.getInstance();

          // Load core streak data
          const [schedules, stats, userRewards] = await Promise.all([
            streakManager.getUserSchedules(userId),
            streakManager.getStreakStats(userId),
            rewardService.getUserRewards(userId)
          ]);

          // Set active schedule
          const activeSchedule = schedules.find((s: any) => s.isActive) || schedules[0] || null;
          let currentPeriod = null;

          if (activeSchedule) {
            currentPeriod = await streakManager.getActiveStreakPeriod(activeSchedule.id);
          }

          // Load rewards data
          const [activeShields, rewardNotifications] = await Promise.all([
            rewardService.getActiveShields(userId),
            rewardService.getNotifications(userId)
          ]);

          const activeTitle = userRewards?.titles.find(t => t.isActive) || null;
          const availableShields = userRewards?.shields.filter(shield => 
            shield.usesRemaining > 0 && 
            (!shield.expiresAt || shield.expiresAt > new Date())
          ) || [];

          const unreadNotifications = rewardNotifications.filter(n => !n.isRead).length;

          set({
            schedules,
            activeSchedule,
            currentPeriod,
            stats,
            userRewards,
            activeTitle,
            availableShields,
            activeShields,
            rewardNotifications,
            unreadNotifications,
            isLoading: false
          });

          // Check for streak risk and create notifications if needed
          if (stats && stats.streakRisk !== 'none') {
            await get().createStreakRiskNotification(userId, stats.streakRisk as any);
          }

          logger.info('Streak system initialized successfully');
        } catch (error) {
          logger.error('Failed to initialize streaks:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize streaks',
            isLoading: false 
          });
        }
      },

      // ============================================================================
      // Schedule Management
      // ============================================================================

      createSchedule: async (userId: string, schedule) => {
        try {
          set({ error: null });
          
          const streakManager = OptimizedStreakService.getInstance();
          const newSchedule = await streakManager.createSchedule(userId, schedule);
          
          if (newSchedule) {
            const { schedules } = get();
            set({ 
              schedules: [...schedules, newSchedule],
              activeSchedule: schedules.length === 0 ? newSchedule : get().activeSchedule
            });
            
            logger.info('Created new streak schedule:', newSchedule.name);
          }
          
          return newSchedule;
        } catch (error) {
          logger.error('Failed to create schedule:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to create schedule' });
          return null;
        }
      },

      updateSchedule: async (scheduleId: string, updates) => {
        try {
          set({ error: null });
          
          const streakManager = OptimizedStreakService.getInstance();
          const updatedSchedule = await streakManager.updateSchedule(scheduleId, updates);
          
          if (updatedSchedule) {
            const { schedules, activeSchedule } = get();
            const newSchedules = schedules.map(s => s.id === scheduleId ? updatedSchedule : s);
            
            set({ 
              schedules: newSchedules,
              activeSchedule: activeSchedule?.id === scheduleId ? updatedSchedule : activeSchedule
            });
            
            logger.info('Updated streak schedule:', scheduleId);
          }
          
          return updatedSchedule;
        } catch (error) {
          logger.error('Failed to update schedule:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to update schedule' });
          return null;
        }
      },

      setActiveSchedule: async (scheduleId: string) => {
        try {
          const { schedules } = get();
          const schedule = schedules.find(s => s.id === scheduleId);
          if (!schedule) return;

          const streakManager = OptimizedStreakService.getInstance();
          const period = await streakManager.getActiveStreakPeriod(scheduleId);
          
          set({ 
            activeSchedule: schedule,
            currentPeriod: period
          });
          
          logger.info('Set active schedule:', schedule.name);
        } catch (error) {
          logger.error('Failed to set active schedule:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to set active schedule' });
        }
      },

      // ============================================================================
      // Workout Recording
      // ============================================================================

      recordWorkout: async (userId: string, workout, scheduleId) => {
        try {
          set({ error: null });
          
          const streakManager = OptimizedStreakService.getInstance();
          await streakManager.recordWorkout(userId, workout, scheduleId);
          
          // Refresh data
          await get().refreshData(userId);
          
          // Check for new rewards
          await get().checkForNewRewards(userId);
          
          logger.info('Recorded workout for streak tracking');
        } catch (error) {
          logger.error('Failed to record workout:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to record workout' });
        }
      },

      // ============================================================================
      // Special Day Management
      // ============================================================================

      markSickDay: async (userId: string, date: string, scheduleId: string, notes?: string) => {
        try {
          set({ error: null });
          
          const streakManager = OptimizedStreakService.getInstance();
          const success = await streakManager.markSickDay(userId, date, scheduleId, notes);
          
          if (success) {
            await get().refreshData(userId);
            logger.info(`Marked ${date} as sick day`);
          }
          
          return success;
        } catch (error) {
          logger.error('Failed to mark sick day:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to mark sick day' });
          return false;
        }
      },

      markVacationDay: async (userId: string, date: string, scheduleId: string, notes?: string) => {
        try {
          set({ error: null });
          
          const streakManager = OptimizedStreakService.getInstance();
          const success = await streakManager.markVacationDay(userId, date, scheduleId, notes);
          
          if (success) {
            await get().refreshData(userId);
            logger.info(`Marked ${date} as vacation day`);
          }
          
          return success;
        } catch (error) {
          logger.error('Failed to mark vacation day:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to mark vacation day' });
          return false;
        }
      },

      compensateMissedDay: async (userId: string, missedDate: string, compensationDate: string, scheduleId: string, workoutId: string) => {
        try {
          set({ error: null });
          
          const streakManager = OptimizedStreakService.getInstance();
          const success = await streakManager.compensateMissedDay(userId, missedDate, compensationDate, scheduleId, workoutId);
          
          if (success) {
            await get().refreshData(userId);
            logger.info(`Compensated missed day ${missedDate} with ${compensationDate}`);
          }
          
          return success;
        } catch (error) {
          logger.error('Failed to compensate missed day:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to compensate missed day' });
          return false;
        }
      },

      // ============================================================================
      // Rewards
      // ============================================================================

      checkForNewRewards: async (userId: string) => {
        const { stats, isCheckingRewards } = get();
        if (!stats || isCheckingRewards) return;

        try {
          set({ isCheckingRewards: true });
          
          const rewardService = StreakRewardService.getInstance();
          const newRewards = await rewardService.checkMilestoneRewards(userId, stats);
          const newTitles = await rewardService.checkTitleUnlocks(userId, stats);
          
          if (newRewards.length > 0 || newTitles.length > 0) {
            // Refresh rewards data
            const [userRewards, activeShields, rewardNotifications] = await Promise.all([
              rewardService.getUserRewards(userId),
              rewardService.getActiveShields(userId),
              rewardService.getNotifications(userId)
            ]);

            const activeTitle = userRewards?.titles.find(t => t.isActive) || null;
            const availableShields = userRewards?.shields.filter(shield => 
              shield.usesRemaining > 0 && 
              (!shield.expiresAt || shield.expiresAt > new Date())
            ) || [];

            const unreadNotifications = rewardNotifications.filter(n => !n.isRead).length;

            set({
              userRewards,
              activeTitle,
              availableShields,
              activeShields,
              rewardNotifications,
              unreadNotifications
            });

            // Show celebration for milestone rewards
            if (newRewards.length > 0) {
              // This could trigger a celebration modal or animation
              logger.info(`Unlocked ${newRewards.length} new streak rewards!`);
            }
          }
        } catch (error) {
          logger.error('Error checking for new rewards:', error);
        } finally {
          set({ isCheckingRewards: false });
        }
      },

      setActiveTitle: async (userId: string, titleId: string) => {
        try {
          const rewardService = StreakRewardService.getInstance();
          const success = await rewardService.setActiveTitle(userId, titleId);
          
          if (success) {
            const userRewards = await rewardService.getUserRewards(userId);
            const activeTitle = userRewards?.titles.find(t => t.isActive) || null;
            
            set({ userRewards, activeTitle });
          }
          
          return success;
        } catch (error) {
          logger.error('Error setting active title:', error);
          return false;
        }
      },

      useShield: async (userId: string, shieldId: string) => {
        try {
          const rewardService = StreakRewardService.getInstance();
          const result = await rewardService.useShield(userId, shieldId);
          
          if (result.success) {
            // Refresh shields data
            const [userRewards, activeShields] = await Promise.all([
              rewardService.getUserRewards(userId),
              rewardService.getActiveShields(userId)
            ]);

            const availableShields = userRewards?.shields.filter(shield => 
              shield.usesRemaining > 0 && 
              (!shield.expiresAt || shield.expiresAt > new Date())
            ) || [];

            set({ userRewards, availableShields, activeShields });
          }
          
          return result;
        } catch (error) {
          logger.error('Error using shield:', error);
          return { success: false, message: 'Error al usar el escudo' };
        }
      },

      // ============================================================================
      // Notifications
      // ============================================================================

      createStreakRiskNotification: async (userId: string, riskLevel: 'low' | 'medium' | 'high') => {
        try {
          const { stats, activeSchedule } = get();
          if (!stats || !activeSchedule) return;

          const notificationService = NotificationService.getInstance();
          
          let title = '';
          let message = '';
          let priority: 'low' | 'medium' | 'high' = 'medium';

          switch (riskLevel) {
            case 'high':
              title = '🚨 ¡Tu racha está en peligro!';
              message = `Tu racha de ${stats.currentStreak} días está a punto de romperse. ¡Entrena hoy para mantenerla!`;
              priority = 'high';
              break;
            case 'medium':
              title = '⚠️ Atención a tu racha';
              message = `Tu racha de ${stats.currentStreak} días necesita atención. Planifica tu próximo entrenamiento pronto.`;
              priority = 'medium';
              break;
            case 'low':
              title = '💪 Mantén el momentum';
              message = `Estás por debajo de tu objetivo semanal. ¡Un entrenamiento más y estarás de vuelta en el camino!`;
              priority = 'low';
              break;
          }

          const notification: StreakNotification = {
            id: `streak_risk_${Date.now()}`,
            userId,
            type: 'risk',
            title,
            message,
            priority,
            scheduleId: activeSchedule.id,
            actionRequired: true,
            actionText: 'Ver Entrenamientos',
            actionUrl: '/workouts',
            isRead: false,
            createdAt: new Date()
          };

          // Add to local state
          const { notifications } = get();
          set({ 
            notifications: [notification, ...notifications],
            unreadNotifications: get().unreadNotifications + 1
          });

          // Send push notification if available
          await notificationService.showNotification({
            title,
            body: message,
            icon: '/icons/streak-warning.png',
            tag: `streak-risk-${userId}`,
            data: {
              type: 'streak_risk',
              riskLevel,
              scheduleId: activeSchedule.id
            }
          });

          logger.info(`Created streak risk notification: ${riskLevel}`);
        } catch (error) {
          logger.error('Error creating streak risk notification:', error);
        }
      },

      markNotificationAsRead: async (notificationId: string) => {
        try {
          const { notifications, rewardNotifications } = get();
          
          // Check if it's a streak notification
          const streakNotif = notifications.find(n => n.id === notificationId);
          if (streakNotif && !streakNotif.isRead) {
            const updatedNotifications = notifications.map(n => 
              n.id === notificationId ? { ...n, isRead: true } : n
            );
            
            set({ 
              notifications: updatedNotifications,
              unreadNotifications: Math.max(0, get().unreadNotifications - 1)
            });
          }

          // Check if it's a reward notification
          const rewardNotif = rewardNotifications.find(n => n.id === notificationId);
          if (rewardNotif && !rewardNotif.isRead) {
            const rewardService = StreakRewardService.getInstance();
            await rewardService.markNotificationAsRead(rewardNotif.userId, notificationId);
            
            const updatedRewardNotifications = rewardNotifications.map(n => 
              n.id === notificationId ? { ...n, isRead: true } : n
            );
            
            set({ 
              rewardNotifications: updatedRewardNotifications,
              unreadNotifications: Math.max(0, get().unreadNotifications - 1)
            });
          }
        } catch (error) {
          logger.error('Error marking notification as read:', error);
        }
      },

      dismissNotification: (notificationId: string) => {
        const { notifications } = get();
        const updatedNotifications = notifications.filter(n => n.id !== notificationId);
        set({ notifications: updatedNotifications });
      },

      // ============================================================================
      // Calendar
      // ============================================================================

      loadCalendarData: async (scheduleId: string, month?: string) => {
        try {
          // This would be implemented when calendar functionality is added
          // For now, just log the request
          logger.info(`Loading calendar data for schedule ${scheduleId}, month ${month}`);
        } catch (error) {
          logger.error('Error loading calendar data:', error);
        }
      },

      // ============================================================================
      // Utility
      // ============================================================================

      refreshData: async (userId: string) => {
        try {
          const streakManager = OptimizedStreakService.getInstance();
          const rewardService = StreakRewardService.getInstance();

          const [schedules, stats, userRewards] = await Promise.all([
            streakManager.getUserSchedules(userId),
            streakManager.getStreakStats(userId),
            rewardService.getUserRewards(userId)
          ]);

          const activeSchedule = get().activeSchedule;
          let currentPeriod = null;

          if (activeSchedule) {
            currentPeriod = await streakManager.getActiveStreakPeriod(activeSchedule.id);
          }

          const [activeShields, rewardNotifications] = await Promise.all([
            rewardService.getActiveShields(userId),
            rewardService.getNotifications(userId)
          ]);

          const activeTitle = userRewards?.titles.find(t => t.isActive) || null;
          const availableShields = userRewards?.shields.filter(shield => 
            shield.usesRemaining > 0 && 
            (!shield.expiresAt || shield.expiresAt > new Date())
          ) || [];

          const unreadNotifications = rewardNotifications.filter(n => !n.isRead).length;

          set({
            schedules,
            currentPeriod,
            stats,
            userRewards,
            activeTitle,
            availableShields,
            activeShields,
            rewardNotifications,
            unreadNotifications
          });
        } catch (error) {
          logger.error('Error refreshing streak data:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to refresh data' });
        }
      },

      processDailyUpdates: async () => {
        try {
          const streakManager = OptimizedStreakService.getInstance();
          await streakManager.processDailyUpdates();
          logger.info('Daily streak updates processed');
        } catch (error) {
          logger.error('Error processing daily updates:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to process daily updates' });
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'streak-store',
      partialize: (state) => ({
        // Only persist essential data, not loading states or errors
        schedules: state.schedules,
        activeSchedule: state.activeSchedule,
        config: state.config,
        userRewards: state.userRewards,
        notifications: state.notifications.slice(0, 10), // Keep only recent notifications
      })
    }
  )
);

export default useStreakStore;
