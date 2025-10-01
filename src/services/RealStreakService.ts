/**
 * Real Streak Service
 * 
 * Production-ready streak tracking service with Supabase integration,
 * personalized schedules, and intelligent streak management.
 */

import { supabaseService } from './SupabaseService';
import { realGamificationService } from './RealGamificationService';
import { logger } from '@/utils/logger';
import type {
  UserStreak,
  StreakSchedule,
  StreakCompensation,
  StreakFreeze,
  StreakMilestone
} from '@/types/gamification';

export interface StreakConfig {
  maxCompensationDays: number;
  maxSickDays: number;
  maxVacationDays: number;
  compensationWindowDays: number;
  streakGracePeriodHours: number;
  minWorkoutDurationMinutes: number;
  allowWeekendCompensation: boolean;
  autoMarkRestDays: boolean;
  sendRiskNotifications: boolean;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  completionRate: number;
  perfectWeeks: number;
  averageWorkoutsPerWeek: number;
  consistencyScore: number;
  streakRisk: 'none' | 'low' | 'medium' | 'high';
  nextMilestone: StreakMilestone | null;
  daysToNextMilestone: number;
}

export interface PersonalizedSchedule {
  userId: string;
  scheduledDays: string[]; // ['monday', 'wednesday', 'friday']
  targetDaysPerWeek: number;
  restDays: string[];
  isFlexible: boolean;
  timezone: string;
  preferences: {
    allowCompensation: boolean;
    compensationWindow: number;
    preferredWorkoutTimes: string[];
    notificationSettings: {
      riskWarnings: boolean;
      milestoneReminders: boolean;
      compensationReminders: boolean;
    };
  };
}

export class RealStreakService {
  private static instance: RealStreakService;
  
  private readonly DEFAULT_CONFIG: StreakConfig = {
    maxCompensationDays: 2,
    maxSickDays: 3,
    maxVacationDays: 5,
    compensationWindowDays: 7,
    streakGracePeriodHours: 6,
    minWorkoutDurationMinutes: 15,
    allowWeekendCompensation: true,
    autoMarkRestDays: true,
    sendRiskNotifications: true
  };

  private readonly STREAK_MILESTONES: StreakMilestone[] = [
    {
      days: 3,
      name: 'Getting Started',
      description: 'Complete 3 consecutive workout days',
      rewards: { xp: 150, badge: 'streak_3', title: 'Consistent' },
      celebrationLevel: 'normal'
    },
    {
      days: 7,
      name: 'Week Warrior',
      description: 'Maintain a 7-day workout streak',
      rewards: { xp: 350, badge: 'streak_7', title: 'Week Warrior' },
      celebrationLevel: 'normal'
    },
    {
      days: 14,
      name: 'Two Week Champion',
      description: 'Keep going for 14 consecutive days',
      rewards: { xp: 500, badge: 'streak_14', title: 'Dedicated' },
      celebrationLevel: 'epic'
    },
    {
      days: 30,
      name: 'Monthly Master',
      description: 'Achieve a 30-day workout streak',
      rewards: { xp: 1000, badge: 'streak_30', title: 'Monthly Master', premiumDays: 3 },
      celebrationLevel: 'epic'
    },
    {
      days: 50,
      name: 'Halfway Hero',
      description: 'Reach the impressive 50-day milestone',
      rewards: { xp: 1500, badge: 'streak_50', title: 'Halfway Hero', premiumDays: 5 },
      celebrationLevel: 'epic'
    },
    {
      days: 100,
      name: 'Centurion',
      description: 'Join the legendary 100-day club',
      rewards: { xp: 3000, badge: 'streak_100', title: 'Centurion', premiumDays: 7, unlockedFeatures: ['streak_shield'] },
      celebrationLevel: 'legendary'
    },
    {
      days: 365,
      name: 'Year Warrior',
      description: 'Complete a full year of consistent workouts',
      rewards: { xp: 10000, badge: 'streak_365', title: 'Year Warrior', premiumDays: 30, unlockedFeatures: ['streak_shield', 'custom_themes'] },
      celebrationLevel: 'legendary'
    }
  ];

  private constructor() {}

  public static getInstance(): RealStreakService {
    if (!RealStreakService.instance) {
      RealStreakService.instance = new RealStreakService();
    }
    return RealStreakService.instance;
  }

  // ============================================================================
  // Personalized Schedule Management
  // ============================================================================

  async getUserSchedule(userId: string): Promise<PersonalizedSchedule | null> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('user_streak_schedules')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No schedule found, create default
          return await this.createDefaultSchedule(userId);
        }
        throw error;
      }

      return this.mapScheduleFromDB(data);
    } catch (error) {
      logger.error('Failed to get user schedule', { error, userId });
      return null;
    }
  }

  async createPersonalizedSchedule(
    userId: string,
    schedule: Omit<PersonalizedSchedule, 'userId'>
  ): Promise<PersonalizedSchedule | null> {
    try {
      // Deactivate existing schedules
      await supabaseService.supabase
        .from('user_streak_schedules')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Create new schedule
      const { data, error } = await supabaseService.supabase
        .from('user_streak_schedules')
        .insert({
          user_id: userId,
          scheduled_days: schedule.scheduledDays,
          target_days_per_week: schedule.targetDaysPerWeek,
          rest_days: schedule.restDays,
          is_flexible: schedule.isFlexible,
          timezone: schedule.timezone,
          preferences: schedule.preferences,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Personalized schedule created', { userId, scheduleId: data.id });
      return this.mapScheduleFromDB(data);
    } catch (error) {
      logger.error('Failed to create personalized schedule', { error, userId });
      return null;
    }
  }

  private async createDefaultSchedule(userId: string): Promise<PersonalizedSchedule> {
    const defaultSchedule: Omit<PersonalizedSchedule, 'userId'> = {
      scheduledDays: ['monday', 'wednesday', 'friday'],
      targetDaysPerWeek: 3,
      restDays: ['sunday'],
      isFlexible: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      preferences: {
        allowCompensation: true,
        compensationWindow: 7,
        preferredWorkoutTimes: ['morning'],
        notificationSettings: {
          riskWarnings: true,
          milestoneReminders: true,
          compensationReminders: true
        }
      }
    };

    const created = await this.createPersonalizedSchedule(userId, defaultSchedule);
    return created || { ...defaultSchedule, userId };
  }

  // ============================================================================
  // Real Streak Tracking
  // ============================================================================

  async getCurrentStreak(userId: string): Promise<UserStreak> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No streak record found, create one
          return await this.initializeUserStreak(userId);
        }
        throw error;
      }

      return this.mapStreakFromDB(data);
    } catch (error) {
      logger.error('Failed to get current streak', { error, userId });
      return await this.initializeUserStreak(userId);
    }
  }

  async updateStreakForWorkout(
    userId: string,
    workoutId: string,
    workoutDate: Date
  ): Promise<UserStreak> {
    try {
      const currentStreak = await this.getCurrentStreak(userId);
      const schedule = await this.getUserSchedule(userId);
      
      if (!schedule) {
        logger.warn('No schedule found for user', { userId });
        return currentStreak;
      }

      // Check if this workout should count for streak
      const shouldCount = await this.shouldWorkoutCountForStreak(
        workoutId,
        workoutDate,
        schedule
      );

      if (!shouldCount) {
        logger.debug('Workout does not count for streak', { userId, workoutId });
        return currentStreak;
      }

      // Calculate new streak
      const newStreak = await this.calculateNewStreak(
        currentStreak,
        workoutDate,
        schedule
      );

      // Update streak in database
      const { data, error } = await supabaseService.supabase
        .from('user_streaks')
        .update({
          current_streak: newStreak.currentStreak,
          longest_streak: Math.max(newStreak.longestStreak, newStreak.currentStreak),
          total_workouts: newStreak.totalWorkouts + 1,
          last_workout_date: workoutDate.toISOString(),
          streak_start_date: newStreak.streakStartDate?.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      const updatedStreak = this.mapStreakFromDB(data);

      // Check for milestone achievements
      await this.checkStreakMilestones(userId, updatedStreak.currentStreak);

      // Award streak milestone XP if applicable
      await this.awardStreakMilestoneXP(userId, updatedStreak.currentStreak);

      logger.info('Streak updated for workout', { 
        userId, 
        workoutId, 
        newStreak: updatedStreak.currentStreak 
      });

      return updatedStreak;
    } catch (error) {
      logger.error('Failed to update streak for workout', { error, userId, workoutId });
      return await this.getCurrentStreak(userId);
    }
  }

  private async shouldWorkoutCountForStreak(
    workoutId: string,
    workoutDate: Date,
    schedule: PersonalizedSchedule
  ): Promise<boolean> {
    try {
      // Get workout details
      const { data: workout, error } = await supabaseService.supabase
        .from('workout_sessions')
        .select('duration_seconds, status')
        .eq('id', workoutId)
        .single();

      if (error) throw error;

      // Check minimum duration
      const durationMinutes = (workout.duration_seconds || 0) / 60;
      if (durationMinutes < this.DEFAULT_CONFIG.minWorkoutDurationMinutes) {
        return false;
      }

      // Check if workout is completed
      if (workout.status !== 'completed') {
        return false;
      }

      // Check if it's a scheduled day (if not flexible)
      if (!schedule.isFlexible) {
        const dayOfWeek = workoutDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
        if (!schedule.scheduledDays.includes(dayOfWeek)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Failed to check if workout counts for streak', { error, workoutId });
      return false;
    }
  }

  private async calculateNewStreak(
    currentStreak: UserStreak,
    workoutDate: Date,
    schedule: PersonalizedSchedule
  ): Promise<UserStreak> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // If this is the first workout
    if (!currentStreak.lastWorkoutDate) {
      return {
        ...currentStreak,
        currentStreak: 1,
        streakStartDate: workoutDate,
        lastWorkoutDate: workoutDate
      };
    }

    const lastWorkoutDate = new Date(currentStreak.lastWorkoutDate);
    const daysSinceLastWorkout = Math.floor(
      (workoutDate.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If workout is on the same day, don't change streak
    if (daysSinceLastWorkout === 0) {
      return currentStreak;
    }

    // If workout is consecutive day, increment streak
    if (daysSinceLastWorkout === 1) {
      return {
        ...currentStreak,
        currentStreak: currentStreak.currentStreak + 1,
        lastWorkoutDate: workoutDate
      };
    }

    // If there's a gap, check for valid rest days or compensation
    const gapDays = daysSinceLastWorkout - 1;
    const validGap = await this.isValidStreakGap(
      lastWorkoutDate,
      workoutDate,
      schedule,
      currentStreak.userId
    );

    if (validGap) {
      // Continue streak
      return {
        ...currentStreak,
        currentStreak: currentStreak.currentStreak + 1,
        lastWorkoutDate: workoutDate
      };
    } else {
      // Reset streak
      return {
        ...currentStreak,
        currentStreak: 1,
        streakStartDate: workoutDate,
        lastWorkoutDate: workoutDate
      };
    }
  }

  private async isValidStreakGap(
    lastWorkoutDate: Date,
    currentWorkoutDate: Date,
    schedule: PersonalizedSchedule,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if gap days are valid rest days, sick days, or vacation days
      const gapStart = new Date(lastWorkoutDate);
      gapStart.setDate(gapStart.getDate() + 1);
      
      const gapEnd = new Date(currentWorkoutDate);
      gapEnd.setDate(gapEnd.getDate() - 1);

      // Get all streak freezes for this period
      const { data: freezes, error } = await supabaseService.supabase
        .from('streak_freezes')
        .select('*')
        .eq('user_id', userId)
        .gte('start_date', gapStart.toISOString().split('T')[0])
        .lte('end_date', gapEnd.toISOString().split('T')[0])
        .eq('approved', true);

      if (error) throw error;

      // Check if the entire gap is covered by freezes or rest days
      let currentDate = new Date(gapStart);
      while (currentDate <= gapEnd) {
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Check if it's a scheduled rest day
        if (schedule.restDays.includes(dayOfWeek)) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Check if it's covered by a freeze
        const isFrozen = freezes?.some(freeze => 
          dateString >= freeze.start_date && dateString <= freeze.end_date
        );

        if (!isFrozen) {
          return false; // Gap day not covered
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return true;
    } catch (error) {
      logger.error('Failed to validate streak gap', { error, userId });
      return false;
    }
  }

  // ============================================================================
  // Streak Recovery and Compensation
  // ============================================================================

  async useStreakFreeze(
    userId: string,
    type: 'sick_day' | 'vacation_day' | 'emergency',
    startDate: Date,
    endDate: Date,
    reason?: string
  ): Promise<boolean> {
    try {
      const currentStreak = await this.getCurrentStreak(userId);
      
      // Check if user has available days
      const availableDays = type === 'sick_day' 
        ? currentStreak.maxSickDays - currentStreak.sickDaysUsed
        : currentStreak.maxVacationDays - currentStreak.vacationDaysUsed;

      const requestedDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      if (requestedDays > availableDays) {
        logger.warn('Not enough freeze days available', { 
          userId, 
          type, 
          requested: requestedDays, 
          available: availableDays 
        });
        return false;
      }

      // Create freeze record
      const { error } = await supabaseService.supabase
        .from('streak_freezes')
        .insert({
          user_id: userId,
          type,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          reason,
          approved: true // Auto-approve for now
        });

      if (error) throw error;

      // Update streak record
      const updateData = type === 'sick_day' 
        ? { sick_days_used: currentStreak.sickDaysUsed + requestedDays }
        : { vacation_days_used: currentStreak.vacationDaysUsed + requestedDays };

      await supabaseService.supabase
        .from('user_streaks')
        .update(updateData)
        .eq('user_id', userId);

      logger.info('Streak freeze applied', { userId, type, days: requestedDays });
      return true;
    } catch (error) {
      logger.error('Failed to use streak freeze', { error, userId, type });
      return false;
    }
  }

  async compensateStreakDay(
    userId: string,
    missedDate: Date,
    compensationWorkoutId: string
  ): Promise<boolean> {
    try {
      const currentStreak = await this.getCurrentStreak(userId);
      
      // Check if compensation is allowed and available
      if (currentStreak.compensationsUsed >= this.DEFAULT_CONFIG.maxCompensationDays) {
        logger.warn('No compensation days available', { userId });
        return false;
      }

      // Check if missed date is within compensation window
      const daysSinceMissed = Math.floor(
        (Date.now() - missedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceMissed > this.DEFAULT_CONFIG.compensationWindowDays) {
        logger.warn('Missed date outside compensation window', { 
          userId, 
          daysSinceMissed 
        });
        return false;
      }

      // Create compensation record
      const { error } = await supabaseService.supabase
        .from('streak_compensations')
        .insert({
          user_id: userId,
          missed_date: missedDate.toISOString().split('T')[0],
          compensated_date: new Date().toISOString().split('T')[0],
          workout_id: compensationWorkoutId
        });

      if (error) throw error;

      // Update streak record
      await supabaseService.supabase
        .from('user_streaks')
        .update({
          compensations_used: currentStreak.compensationsUsed + 1
        })
        .eq('user_id', userId);

      logger.info('Streak day compensated', { userId, missedDate, compensationWorkoutId });
      return true;
    } catch (error) {
      logger.error('Failed to compensate streak day', { error, userId });
      return false;
    }
  }

  // ============================================================================
  // Milestone Management
  // ============================================================================

  private async checkStreakMilestones(userId: string, currentStreak: number): Promise<void> {
    try {
      const milestone = this.STREAK_MILESTONES.find(m => m.days === currentStreak);
      if (!milestone) return;

      // Check if already achieved
      const { data: existing } = await supabaseService.supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_key', `streak_${milestone.days}`)
        .eq('is_completed', true)
        .single();

      if (existing) return; // Already achieved

      // Unlock achievement
      await realGamificationService.checkAndUnlockAchievement(
        userId,
        `streak_${milestone.days}`,
        { streak_length: currentStreak }
      );

      logger.info('Streak milestone achieved', { userId, milestone: milestone.days });
    } catch (error) {
      logger.error('Failed to check streak milestones', { error, userId });
    }
  }

  private async awardStreakMilestoneXP(userId: string, currentStreak: number): Promise<void> {
    try {
      // Award XP for milestone streaks
      const milestoneXP = this.calculateMilestoneXP(currentStreak);
      if (milestoneXP > 0) {
        await realGamificationService.awardXP(
          userId,
          'streak_milestone',
          `streak_${currentStreak}`,
          1
        );
      }
    } catch (error) {
      logger.error('Failed to award streak milestone XP', { error, userId });
    }
  }

  private calculateMilestoneXP(streakLength: number): number {
    // Award bonus XP for certain milestones
    const milestoneXP: Record<number, number> = {
      7: 50,   // Week
      14: 100, // Two weeks
      30: 200, // Month
      50: 300, // 50 days
      100: 500, // 100 days
      365: 1000 // Year
    };

    return milestoneXP[streakLength] || 0;
  }

  // ============================================================================
  // Statistics and Analytics
  // ============================================================================

  async getStreakStats(userId: string): Promise<StreakStats> {
    try {
      const currentStreak = await this.getCurrentStreak(userId);
      const workouts = await supabaseService.getUserWorkouts(userId, 365); // Last year
      
      // Calculate completion rate
      const schedule = await this.getUserSchedule(userId);
      const targetDaysPerWeek = schedule?.targetDaysPerWeek || 3;
      const weeksInPeriod = Math.min(52, Math.ceil(workouts.length / targetDaysPerWeek));
      const expectedWorkouts = weeksInPeriod * targetDaysPerWeek;
      const completionRate = expectedWorkouts > 0 ? (workouts.length / expectedWorkouts) * 100 : 0;

      // Calculate perfect weeks
      const perfectWeeks = this.calculatePerfectWeeks(workouts, targetDaysPerWeek);

      // Calculate average workouts per week
      const averageWorkoutsPerWeek = weeksInPeriod > 0 ? workouts.length / weeksInPeriod : 0;

      // Calculate consistency score
      const consistencyScore = this.calculateConsistencyScore(workouts, targetDaysPerWeek);

      // Determine streak risk
      const streakRisk = this.calculateStreakRisk(currentStreak, schedule);

      // Find next milestone
      const nextMilestone = this.STREAK_MILESTONES.find(m => m.days > currentStreak.currentStreak);
      const daysToNextMilestone = nextMilestone ? nextMilestone.days - currentStreak.currentStreak : 0;

      return {
        currentStreak: currentStreak.currentStreak,
        longestStreak: currentStreak.longestStreak,
        totalWorkouts: currentStreak.totalWorkouts,
        completionRate,
        perfectWeeks,
        averageWorkoutsPerWeek,
        consistencyScore,
        streakRisk,
        nextMilestone,
        daysToNextMilestone
      };
    } catch (error) {
      logger.error('Failed to get streak stats', { error, userId });
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        completionRate: 0,
        perfectWeeks: 0,
        averageWorkoutsPerWeek: 0,
        consistencyScore: 0,
        streakRisk: 'none',
        nextMilestone: null,
        daysToNextMilestone: 0
      };
    }
  }

  private calculatePerfectWeeks(workouts: any[], targetDaysPerWeek: number): number {
    // Group workouts by week and count perfect weeks
    const weeklyWorkouts = new Map<string, number>();
    
    workouts.forEach(workout => {
      const date = new Date(workout.created_at);
      const weekKey = this.getWeekKey(date);
      weeklyWorkouts.set(weekKey, (weeklyWorkouts.get(weekKey) || 0) + 1);
    });

    return Array.from(weeklyWorkouts.values()).filter(count => count >= targetDaysPerWeek).length;
  }

  private calculateConsistencyScore(workouts: any[], targetDaysPerWeek: number): number {
    if (workouts.length === 0) return 0;

    // Calculate consistency based on workout distribution
    const weeklyWorkouts = new Map<string, number>();
    
    workouts.forEach(workout => {
      const date = new Date(workout.created_at);
      const weekKey = this.getWeekKey(date);
      weeklyWorkouts.set(weekKey, (weeklyWorkouts.get(weekKey) || 0) + 1);
    });

    const weeks = Array.from(weeklyWorkouts.values());
    const averageWeekly = weeks.reduce((sum, count) => sum + count, 0) / weeks.length;
    const variance = weeks.reduce((sum, count) => sum + Math.pow(count - averageWeekly, 2), 0) / weeks.length;
    
    // Lower variance = higher consistency
    const consistencyScore = Math.max(0, 100 - (variance * 10));
    return Math.min(100, consistencyScore);
  }

  private calculateStreakRisk(
    currentStreak: UserStreak,
    schedule: PersonalizedSchedule | null
  ): 'none' | 'low' | 'medium' | 'high' {
    if (!currentStreak.lastWorkoutDate) return 'none';

    const daysSinceLastWorkout = Math.floor(
      (Date.now() - new Date(currentStreak.lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const targetDaysPerWeek = schedule?.targetDaysPerWeek || 3;
    const maxGapDays = Math.ceil(7 / targetDaysPerWeek);

    if (daysSinceLastWorkout >= maxGapDays + 1) return 'high';
    if (daysSinceLastWorkout >= maxGapDays) return 'medium';
    if (daysSinceLastWorkout >= maxGapDays - 1) return 'low';
    return 'none';
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week}`;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async initializeUserStreak(userId: string): Promise<UserStreak> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          total_workouts: 0,
          scheduled_days: ['monday', 'wednesday', 'friday'],
          compensations_used: 0,
          sick_days_used: 0,
          vacation_days_used: 0,
          max_sick_days: this.DEFAULT_CONFIG.maxSickDays,
          max_vacation_days: this.DEFAULT_CONFIG.maxVacationDays,
          last_sick_day_reset: new Date().toISOString(),
          last_vacation_day_reset: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapStreakFromDB(data);
    } catch (error) {
      logger.error('Failed to initialize user streak', { error, userId });
      // Return default streak
      return {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        lastWorkoutDate: undefined,
        streakStartDate: undefined,
        scheduledDays: ['monday', 'wednesday', 'friday'],
        compensationsUsed: 0,
        sickDaysUsed: 0,
        vacationDaysUsed: 0,
        maxSickDays: this.DEFAULT_CONFIG.maxSickDays,
        maxVacationDays: this.DEFAULT_CONFIG.maxVacationDays,
        lastSickDayReset: new Date(),
        lastVacationDayReset: new Date(),
        streakFreezes: [],
        updatedAt: new Date()
      };
    }
  }

  private mapStreakFromDB(data: any): UserStreak {
    return {
      userId: data.user_id,
      currentStreak: data.current_streak || 0,
      longestStreak: data.longest_streak || 0,
      totalWorkouts: data.total_workouts || 0,
      lastWorkoutDate: data.last_workout_date ? new Date(data.last_workout_date) : undefined,
      streakStartDate: data.streak_start_date ? new Date(data.streak_start_date) : undefined,
      scheduledDays: data.scheduled_days || ['monday', 'wednesday', 'friday'],
      compensationsUsed: data.compensations_used || 0,
      sickDaysUsed: data.sick_days_used || 0,
      vacationDaysUsed: data.vacation_days_used || 0,
      maxSickDays: data.max_sick_days || this.DEFAULT_CONFIG.maxSickDays,
      maxVacationDays: data.max_vacation_days || this.DEFAULT_CONFIG.maxVacationDays,
      lastSickDayReset: new Date(data.last_sick_day_reset || Date.now()),
      lastVacationDayReset: new Date(data.last_vacation_day_reset || Date.now()),
      streakFreezes: [], // TODO: Load from separate table
      updatedAt: new Date(data.updated_at || Date.now())
    };
  }

  private mapScheduleFromDB(data: any): PersonalizedSchedule {
    return {
      userId: data.user_id,
      scheduledDays: data.scheduled_days || ['monday', 'wednesday', 'friday'],
      targetDaysPerWeek: data.target_days_per_week || 3,
      restDays: data.rest_days || ['sunday'],
      isFlexible: data.is_flexible || true,
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      preferences: data.preferences || {
        allowCompensation: true,
        compensationWindow: 7,
        preferredWorkoutTimes: ['morning'],
        notificationSettings: {
          riskWarnings: true,
          milestoneReminders: true,
          compensationReminders: true
        }
      }
    };
  }
}

// Export singleton instance
export const realStreakService = RealStreakService.getInstance();
export default realStreakService;