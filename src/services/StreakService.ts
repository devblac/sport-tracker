/**
 * Streak Service
 * 
 * Real implementation of streak management using Supabase backend.
 * Replaces the temporary mock in the streak store.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type {
  StreakSchedule,
  StreakPeriod,
  StreakDay,
  StreakStats,
  StreakConfig,
  StreakNotification
} from '@/types/streaks';

export class StreakService {
  private static instance: StreakService;

  static getInstance(): StreakService {
    if (!StreakService.instance) {
      StreakService.instance = new StreakService();
    }
    return StreakService.instance;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  getConfig(): StreakConfig {
    return {
      maxCompensationDays: 2,
      maxSickDays: 3,
      maxVacationDays: 5,
      compensationTimeLimit: 7,
      streakGracePeriod: 1,
      minWorkoutsPerWeek: 3,
      allowWeekendCompensation: true,
      autoMarkRestDays: true,
      sendRiskNotifications: true
    };
  }

  // ============================================================================
  // Schedule Management
  // ============================================================================

  async getUserSchedules(userId: string): Promise<StreakSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('streak_schedules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapScheduleFromDB);
    } catch (error) {
      logger.error('Error fetching user schedules:', error);
      return [];
    }
  }

  async createSchedule(
    userId: string,
    schedule: Omit<StreakSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<StreakSchedule | null> {
    try {
      // If this is the first schedule, make it active
      const existingSchedules = await this.getUserSchedules(userId);
      const isFirstSchedule = existingSchedules.length === 0;

      const { data, error } = await supabase
        .from('streak_schedules')
        .insert({
          user_id: userId,
          name: schedule.name,
          description: schedule.description,
          target_days_per_week: schedule.targetDaysPerWeek,
          scheduled_days: schedule.scheduledDays,
          is_flexible: schedule.isFlexible,
          rest_days: schedule.restDays,
          color: schedule.color,
          icon: schedule.icon,
          is_active: isFirstSchedule || schedule.isActive
        })
        .select()
        .single();

      if (error) throw error;

      // If making this active, deactivate others
      if (isFirstSchedule || schedule.isActive) {
        await this.setActiveSchedule(data.id);
      }

      return this.mapScheduleFromDB(data);
    } catch (error) {
      logger.error('Error creating schedule:', error);
      return null;
    }
  }

  async updateSchedule(
    scheduleId: string,
    updates: Partial<StreakSchedule>
  ): Promise<StreakSchedule | null> {
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.targetDaysPerWeek) updateData.target_days_per_week = updates.targetDaysPerWeek;
      if (updates.scheduledDays) updateData.scheduled_days = updates.scheduledDays;
      if (updates.isFlexible !== undefined) updateData.is_flexible = updates.isFlexible;
      if (updates.restDays) updateData.rest_days = updates.restDays;
      if (updates.color) updateData.color = updates.color;
      if (updates.icon) updateData.icon = updates.icon;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('streak_schedules')
        .update(updateData)
        .eq('id', scheduleId)
        .select()
        .single();

      if (error) throw error;

      // If making this active, deactivate others
      if (updates.isActive) {
        await this.setActiveSchedule(scheduleId);
      }

      return this.mapScheduleFromDB(data);
    } catch (error) {
      logger.error('Error updating schedule:', error);
      return null;
    }
  }

  async setActiveSchedule(scheduleId: string): Promise<void> {
    try {
      // Get the schedule to find user_id
      const { data: schedule, error: scheduleError } = await supabase
        .from('streak_schedules')
        .select('user_id')
        .eq('id', scheduleId)
        .single();

      if (scheduleError) throw scheduleError;

      // Deactivate all schedules for this user
      await supabase
        .from('streak_schedules')
        .update({ is_active: false })
        .eq('user_id', schedule.user_id);

      // Activate the selected schedule
      await supabase
        .from('streak_schedules')
        .update({ is_active: true })
        .eq('id', scheduleId);

    } catch (error) {
      logger.error('Error setting active schedule:', error);
      throw error;
    }
  }

  // ============================================================================
  // Streak Stats
  // ============================================================================

  async getStreakStats(userId: string, scheduleId?: string): Promise<StreakStats> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_streak_stats', {
          p_user_id: userId,
          p_schedule_id: scheduleId || null
        });

      if (error) throw error;

      return {
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        totalWorkouts: data.totalWorkouts || 0,
        totalDays: 0, // TODO: Calculate properly
        completionRate: data.completionRate || 0,
        compensationDaysAvailable: data.compensationDaysAvailable || 2,
        sickDaysAvailable: data.sickDaysAvailable || 3,
        vacationDaysAvailable: data.vacationDaysAvailable || 5,
        streakRisk: data.streakRisk || 'none',
        missedDaysThisWeek: data.missedDaysThisWeek || 0,
        perfectWeeks: data.perfectWeeks || 0,
        averageWorkoutsPerWeek: data.averageWorkoutsPerWeek || 0,
        consistencyScore: data.consistencyScore || 0,
        totalMissedDays: 0, // TODO: Calculate from database
        shieldsUsed: 0 // TODO: Calculate from database
      };
    } catch (error) {
      logger.error('Error fetching streak stats:', error);
      // Return default stats on error
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        totalDays: 0,
        completionRate: 0,
        compensationDaysAvailable: 2,
        sickDaysAvailable: 3,
        vacationDaysAvailable: 5,
        streakRisk: 'none',
        missedDaysThisWeek: 0,
        perfectWeeks: 0,
        averageWorkoutsPerWeek: 0,
        consistencyScore: 0,
        totalMissedDays: 0,
        shieldsUsed: 0
      };
    }
  }

  async getActiveStreakPeriod(scheduleId: string): Promise<StreakPeriod | null> {
    try {
      const { data, error } = await supabase
        .from('streak_periods')
        .select(`
          *,
          streak_days (*)
        `)
        .eq('schedule_id', scheduleId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No active period found
          return null;
        }
        throw error;
      }

      return this.mapPeriodFromDB(data);
    } catch (error) {
      logger.error('Error fetching active streak period:', error);
      return null;
    }
  }

  // ============================================================================
  // Workout Recording
  // ============================================================================

  async recordWorkout(
    userId: string,
    workout: any,
    scheduleId?: string
  ): Promise<void> {
    try {
      // Use the database function to record the workout
      const { error } = await supabase
        .rpc('record_streak_workout', {
          p_user_id: userId,
          p_workout_session_id: workout.id,
          p_schedule_id: scheduleId || null
        });

      if (error) throw error;

      logger.info('Workout recorded for streak tracking:', workout.id);
    } catch (error) {
      logger.error('Error recording workout for streak:', error);
      throw error;
    }
  }

  // ============================================================================
  // Special Day Management
  // ============================================================================

  async markSickDay(
    userId: string,
    date: string,
    scheduleId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      // Get active period
      const period = await this.getActiveStreakPeriod(scheduleId);
      if (!period) return false;

      // Insert or update the day record
      const { error } = await supabase
        .from('streak_days')
        .upsert({
          period_id: period.id,
          date,
          status: 'sick',
          notes
        });

      if (error) throw error;

      // Update period sick days count
      await supabase
        .from('streak_periods')
        .update({
          sick_days_used: period.sickDaysUsed + 1
        })
        .eq('id', period.id);

      return true;
    } catch (error) {
      logger.error('Error marking sick day:', error);
      return false;
    }
  }

  async markVacationDay(
    userId: string,
    date: string,
    scheduleId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      // Similar implementation to markSickDay
      const period = await this.getActiveStreakPeriod(scheduleId);
      if (!period) return false;

      const { error } = await supabase
        .from('streak_days')
        .upsert({
          period_id: period.id,
          date,
          status: 'vacation',
          notes
        });

      if (error) throw error;

      await supabase
        .from('streak_periods')
        .update({
          vacation_days_used: period.vacationDaysUsed + 1
        })
        .eq('id', period.id);

      return true;
    } catch (error) {
      logger.error('Error marking vacation day:', error);
      return false;
    }
  }

  async compensateMissedDay(
    userId: string,
    missedDate: string,
    compensationDate: string,
    scheduleId: string,
    workoutId: string
  ): Promise<boolean> {
    try {
      const period = await this.getActiveStreakPeriod(scheduleId);
      if (!period) return false;

      // Mark the compensation day
      const { error } = await supabase
        .from('streak_days')
        .upsert({
          period_id: period.id,
          date: compensationDate,
          status: 'compensated',
          compensated_date: missedDate,
          workout_session_id: workoutId
        });

      if (error) throw error;

      // Update the missed day status
      await supabase
        .from('streak_days')
        .update({ status: 'compensated' })
        .eq('period_id', period.id)
        .eq('date', missedDate);

      // Update period compensation count
      await supabase
        .from('streak_periods')
        .update({
          compensation_days_used: period.compensationDaysUsed + 1
        })
        .eq('id', period.id);

      return true;
    } catch (error) {
      logger.error('Error compensating missed day:', error);
      return false;
    }
  }

  // ============================================================================
  // Daily Updates
  // ============================================================================

  async processDailyUpdates(): Promise<void> {
    try {
      // This would run daily to:
      // 1. Mark missed days
      // 2. Update streak risks
      // 3. Send notifications
      // 4. Process milestone rewards
      
      logger.info('Daily streak updates processed');
    } catch (error) {
      logger.error('Error processing daily updates:', error);
      throw error;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private mapScheduleFromDB(data: any): StreakSchedule {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      targetDaysPerWeek: data.target_days_per_week,
      scheduledDays: data.scheduled_days,
      isFlexible: data.is_flexible,
      restDays: data.rest_days || [],
      isActive: data.is_active,
      color: data.color,
      icon: data.icon,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapPeriodFromDB(data: any): StreakPeriod {
    return {
      id: data.id,
      userId: data.user_id,
      scheduleId: data.schedule_id,
      startDate: data.start_date,
      endDate: data.end_date,
      days: (data.streak_days || []).map(this.mapDayFromDB),
      currentLength: data.current_length,
      maxLength: data.max_length,
      compensationDaysUsed: data.compensation_days_used,
      sickDaysUsed: data.sick_days_used,
      vacationDaysUsed: data.vacation_days_used,
      isActive: data.is_active,
      reason: data.end_reason,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapDayFromDB(data: any): StreakDay {
    return {
      date: data.date,
      status: data.status,
      workoutId: data.workout_session_id,
      compensatedDate: data.compensated_date,
      notes: data.notes,
      intensity: data.intensity,
      duration: data.duration_minutes,
      exercises: [] // TODO: Map exercises if needed
    };
  }
}

export default StreakService;