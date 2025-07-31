/**
 * Intelligent Streak Manager
 * 
 * Advanced streak system that supports personalized schedules, compensation days,
 * sick days, vacation days, and flexible streak maintenance.
 */

import { logger } from '@/utils/logger';
import { IndexedDBManager } from '@/db/IndexedDBManager';
import type { Workout } from '@/types/workout';

export interface StreakSchedule {
  id: string;
  userId: string;
  name: string;
  targetDaysPerWeek: number;
  scheduledDays: number[]; // 0-6 (Sunday-Saturday)
  isFlexible: boolean; // Allow workouts on non-scheduled days
  restDays: number[]; // Mandatory rest days
  createdAt: Date;
  updatedAt: Date;
}

export interface StreakDay {
  date: string; // YYYY-MM-DD format
  status: 'completed' | 'missed' | 'rest' | 'sick' | 'vacation' | 'compensated';
  workoutId?: string;
  compensatedDate?: string; // Original date this compensates for
  notes?: string;
}

export interface StreakPeriod {
  id: string;
  userId: string;
  scheduleId: string;
  startDate: string;
  endDate?: string; // null if active
  days: StreakDay[];
  currentLength: number;
  maxLength: number;
  compensationDaysUsed: number;
  sickDaysUsed: number;
  vacationDaysUsed: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalDays: number;
  completionRate: number;
  compensationDaysAvailable: number;
  sickDaysAvailable: number;
  vacationDaysAvailable: number;
  streakRisk: 'none' | 'low' | 'medium' | 'high';
  nextScheduledWorkout?: Date;
  missedDaysThisWeek: number;
  perfectWeeks: number;
}

export interface StreakConfig {
  maxCompensationDays: number; // Per month
  maxSickDays: number; // Per month
  maxVacationDays: number; // Per month
  compensationTimeLimit: number; // Days to compensate
  streakGracePeriod: number; // Days before streak breaks
  minWorkoutsPerWeek: number; // Minimum to maintain streak
}

export const DEFAULT_STREAK_CONFIG: StreakConfig = {
  maxCompensationDays: 4,
  maxSickDays: 7,
  maxVacationDays: 14,
  compensationTimeLimit: 7,
  streakGracePeriod: 2,
  minWorkoutsPerWeek: 2
};

export class StreakManager {
  private static instance: StreakManager;
  private db: IndexedDBManager;
  private config: StreakConfig;

  private constructor(config: Partial<StreakConfig> = {}) {
    this.db = IndexedDBManager.getInstance();
    this.config = { ...DEFAULT_STREAK_CONFIG, ...config };
  }

  public static getInstance(config?: Partial<StreakConfig>): StreakManager {
    if (!StreakManager.instance) {
      StreakManager.instance = new StreakManager(config);
    }
    return StreakManager.instance;
  }

  // ============================================================================
  // Schedule Management
  // ============================================================================

  /**
   * Create a new streak schedule
   */
  async createSchedule(
    userId: string,
    schedule: Omit<StreakSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<StreakSchedule> {
    const newSchedule: StreakSchedule = {
      ...schedule,
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.db.add('streak_schedules', newSchedule);
    logger.info(`Created streak schedule for user ${userId}:`, newSchedule.name);

    // Create initial streak period
    await this.createStreakPeriod(userId, newSchedule.id);

    return newSchedule;
  }

  /**
   * Get user's streak schedules
   */
  async getUserSchedules(userId: string): Promise<StreakSchedule[]> {
    try {
      const schedules = await this.db.getAll('streak_schedules', {
        index: 'userId',
        value: userId
      });
      return schedules || [];
    } catch (error) {
      logger.error('Error getting user schedules:', error);
      return [];
    }
  }

  /**
   * Update streak schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<StreakSchedule>
  ): Promise<StreakSchedule | null> {
    try {
      const schedule = await this.db.get('streak_schedules', scheduleId);
      if (!schedule) return null;

      const updatedSchedule = {
        ...schedule,
        ...updates,
        updatedAt: new Date()
      };

      await this.db.update('streak_schedules', scheduleId, updatedSchedule);
      return updatedSchedule;
    } catch (error) {
      logger.error('Error updating schedule:', error);
      return null;
    }
  }

  // ============================================================================
  // Streak Period Management
  // ============================================================================

  /**
   * Create a new streak period
   */
  private async createStreakPeriod(
    userId: string,
    scheduleId: string,
    startDate?: string
  ): Promise<StreakPeriod> {
    const period: StreakPeriod = {
      id: `period_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      scheduleId,
      startDate: startDate || this.formatDate(new Date()),
      days: [],
      currentLength: 0,
      maxLength: 0,
      compensationDaysUsed: 0,
      sickDaysUsed: 0,
      vacationDaysUsed: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.db.add('streak_periods', period);
    return period;
  }

  /**
   * Get active streak period for a schedule
   */
  async getActiveStreakPeriod(scheduleId: string): Promise<StreakPeriod | null> {
    try {
      const periods = await this.db.getAll('streak_periods', {
        index: 'scheduleId',
        value: scheduleId
      });

      return periods.find(p => p.isActive) || null;
    } catch (error) {
      logger.error('Error getting active streak period:', error);
      return null;
    }
  }

  /**
   * Get all streak periods for a user
   */
  async getUserStreakPeriods(userId: string): Promise<StreakPeriod[]> {
    try {
      const periods = await this.db.getAll('streak_periods', {
        index: 'userId',
        value: userId
      });
      return periods || [];
    } catch (error) {
      logger.error('Error getting user streak periods:', error);
      return [];
    }
  }

  // ============================================================================
  // Workout Recording
  // ============================================================================

  /**
   * Record a workout for streak tracking
   */
  async recordWorkout(
    userId: string,
    workout: Workout,
    scheduleId?: string
  ): Promise<void> {
    try {
      const schedules = scheduleId 
        ? [await this.db.get('streak_schedules', scheduleId)].filter(Boolean)
        : await this.getUserSchedules(userId);

      for (const schedule of schedules) {
        if (!schedule) continue;

        const period = await this.getActiveStreakPeriod(schedule.id);
        if (!period) continue;

        const workoutDate = this.formatDate(new Date(workout.completedAt || Date.now()));
        
        // Check if workout already recorded for this date
        const existingDay = period.days.find(d => d.date === workoutDate);
        if (existingDay && existingDay.status === 'completed') {
          continue; // Already recorded
        }

        // Record the workout
        await this.recordStreakDay(period, workoutDate, 'completed', workout.id);
        
        // Check for compensation opportunities
        await this.checkCompensationOpportunities(period, workoutDate);
        
        logger.info(`Recorded workout for streak on ${workoutDate}`);\n      }\n    } catch (error) {\n      logger.error('Error recording workout for streak:', error);\n    }\n  }\n\n  /**\n   * Record a streak day with specific status\n   */\n  private async recordStreakDay(\n    period: StreakPeriod,\n    date: string,\n    status: StreakDay['status'],\n    workoutId?: string,\n    compensatedDate?: string,\n    notes?: string\n  ): Promise<void> {\n    // Remove existing day if it exists\n    period.days = period.days.filter(d => d.date !== date);\n    \n    // Add new day\n    const streakDay: StreakDay = {\n      date,\n      status,\n      workoutId,\n      compensatedDate,\n      notes\n    };\n    \n    period.days.push(streakDay);\n    period.days.sort((a, b) => a.date.localeCompare(b.date));\n    \n    // Update streak statistics\n    await this.updateStreakStats(period);\n    \n    // Save period\n    await this.db.update('streak_periods', period.id, {\n      ...period,\n      updatedAt: new Date()\n    });\n  }\n\n  // ============================================================================\n  // Compensation and Special Days\n  // ============================================================================\n\n  /**\n   * Mark a day as sick day\n   */\n  async markSickDay(\n    userId: string,\n    date: string,\n    scheduleId: string,\n    notes?: string\n  ): Promise<boolean> {\n    try {\n      const period = await this.getActiveStreakPeriod(scheduleId);\n      if (!period) return false;\n\n      // Check sick days limit\n      const currentMonth = date.substring(0, 7); // YYYY-MM\n      const sickDaysThisMonth = period.days.filter(d => \n        d.date.startsWith(currentMonth) && d.status === 'sick'\n      ).length;\n\n      if (sickDaysThisMonth >= this.config.maxSickDays) {\n        logger.warn('Sick days limit reached for this month');\n        return false;\n      }\n\n      await this.recordStreakDay(period, date, 'sick', undefined, undefined, notes);\n      period.sickDaysUsed++;\n      \n      logger.info(`Marked ${date} as sick day`);\n      return true;\n    } catch (error) {\n      logger.error('Error marking sick day:', error);\n      return false;\n    }\n  }\n\n  /**\n   * Mark a day as vacation day\n   */\n  async markVacationDay(\n    userId: string,\n    date: string,\n    scheduleId: string,\n    notes?: string\n  ): Promise<boolean> {\n    try {\n      const period = await this.getActiveStreakPeriod(scheduleId);\n      if (!period) return false;\n\n      // Check vacation days limit\n      const currentMonth = date.substring(0, 7);\n      const vacationDaysThisMonth = period.days.filter(d => \n        d.date.startsWith(currentMonth) && d.status === 'vacation'\n      ).length;\n\n      if (vacationDaysThisMonth >= this.config.maxVacationDays) {\n        logger.warn('Vacation days limit reached for this month');\n        return false;\n      }\n\n      await this.recordStreakDay(period, date, 'vacation', undefined, undefined, notes);\n      period.vacationDaysUsed++;\n      \n      logger.info(`Marked ${date} as vacation day`);\n      return true;\n    } catch (error) {\n      logger.error('Error marking vacation day:', error);\n      return false;\n    }\n  }\n\n  /**\n   * Compensate for a missed day\n   */\n  async compensateMissedDay(\n    userId: string,\n    missedDate: string,\n    compensationDate: string,\n    scheduleId: string,\n    workoutId: string\n  ): Promise<boolean> {\n    try {\n      const period = await this.getActiveStreakPeriod(scheduleId);\n      if (!period) return false;\n\n      // Check if compensation is within time limit\n      const missedDay = new Date(missedDate);\n      const compensationDay = new Date(compensationDate);\n      const daysDiff = Math.abs(\n        (compensationDay.getTime() - missedDay.getTime()) / (1000 * 60 * 60 * 24)\n      );\n\n      if (daysDiff > this.config.compensationTimeLimit) {\n        logger.warn('Compensation time limit exceeded');\n        return false;\n      }\n\n      // Check compensation days limit\n      const currentMonth = compensationDate.substring(0, 7);\n      const compensationDaysThisMonth = period.days.filter(d => \n        d.date.startsWith(currentMonth) && d.status === 'compensated'\n      ).length;\n\n      if (compensationDaysThisMonth >= this.config.maxCompensationDays) {\n        logger.warn('Compensation days limit reached for this month');\n        return false;\n      }\n\n      // Mark the missed day as compensated\n      await this.recordStreakDay(period, missedDate, 'compensated', workoutId, compensationDate);\n      \n      // Record the compensation workout\n      await this.recordStreakDay(period, compensationDate, 'completed', workoutId);\n      \n      period.compensationDaysUsed++;\n      \n      logger.info(`Compensated missed day ${missedDate} with workout on ${compensationDate}`);\n      return true;\n    } catch (error) {\n      logger.error('Error compensating missed day:', error);\n      return false;\n    }\n  }\n\n  /**\n   * Check for compensation opportunities\n   */\n  private async checkCompensationOpportunities(\n    period: StreakPeriod,\n    workoutDate: string\n  ): Promise<void> {\n    const schedule = await this.db.get('streak_schedules', period.scheduleId);\n    if (!schedule || !schedule.isFlexible) return;\n\n    const workoutDay = new Date(workoutDate);\n    const startCheck = new Date(workoutDay);\n    startCheck.setDate(startCheck.getDate() - this.config.compensationTimeLimit);\n\n    // Find missed days that could be compensated\n    const missedDays = period.days.filter(d => {\n      const dayDate = new Date(d.date);\n      return d.status === 'missed' && \n             dayDate >= startCheck && \n             dayDate < workoutDay;\n    });\n\n    // Auto-compensate the most recent missed day if within limits\n    if (missedDays.length > 0) {\n      const mostRecentMissed = missedDays[missedDays.length - 1];\n      const currentMonth = workoutDate.substring(0, 7);\n      const compensationDaysThisMonth = period.days.filter(d => \n        d.date.startsWith(currentMonth) && d.status === 'compensated'\n      ).length;\n\n      if (compensationDaysThisMonth < this.config.maxCompensationDays) {\n        // Update the missed day to compensated\n        const dayIndex = period.days.findIndex(d => d.date === mostRecentMissed.date);\n        if (dayIndex !== -1) {\n          period.days[dayIndex] = {\n            ...period.days[dayIndex],\n            status: 'compensated',\n            compensatedDate: workoutDate\n          };\n          \n          period.compensationDaysUsed++;\n          logger.info(`Auto-compensated missed day ${mostRecentMissed.date}`);\n        }\n      }\n    }\n  }\n\n  // ============================================================================\n  // Streak Statistics and Analysis\n  // ============================================================================\n\n  /**\n   * Update streak statistics for a period\n   */\n  private async updateStreakStats(period: StreakPeriod): Promise<void> {\n    const completedDays = period.days.filter(d => \n      ['completed', 'compensated'].includes(d.status)\n    );\n    \n    // Calculate current streak\n    let currentStreak = 0;\n    let maxStreak = 0;\n    let tempStreak = 0;\n    \n    const sortedDays = [...period.days].sort((a, b) => a.date.localeCompare(b.date));\n    \n    for (const day of sortedDays) {\n      if (['completed', 'compensated', 'sick', 'vacation'].includes(day.status)) {\n        tempStreak++;\n        maxStreak = Math.max(maxStreak, tempStreak);\n      } else if (day.status === 'missed') {\n        tempStreak = 0;\n      }\n    }\n    \n    // Current streak is from the end\n    for (let i = sortedDays.length - 1; i >= 0; i--) {\n      const day = sortedDays[i];\n      if (['completed', 'compensated', 'sick', 'vacation'].includes(day.status)) {\n        currentStreak++;\n      } else {\n        break;\n      }\n    }\n    \n    period.currentLength = currentStreak;\n    period.maxLength = Math.max(period.maxLength, maxStreak);\n  }\n\n  /**\n   * Get comprehensive streak statistics\n   */\n  async getStreakStats(userId: string, scheduleId?: string): Promise<StreakStats> {\n    try {\n      const schedules = scheduleId \n        ? [await this.db.get('streak_schedules', scheduleId)].filter(Boolean)\n        : await this.getUserSchedules(userId);\n\n      let totalStats: StreakStats = {\n        currentStreak: 0,\n        longestStreak: 0,\n        totalWorkouts: 0,\n        totalDays: 0,\n        completionRate: 0,\n        compensationDaysAvailable: this.config.maxCompensationDays,\n        sickDaysAvailable: this.config.maxSickDays,\n        vacationDaysAvailable: this.config.maxVacationDays,\n        streakRisk: 'none',\n        missedDaysThisWeek: 0,\n        perfectWeeks: 0\n      };\n\n      for (const schedule of schedules) {\n        if (!schedule) continue;\n        \n        const period = await this.getActiveStreakPeriod(schedule.id);\n        if (!period) continue;\n\n        const completedDays = period.days.filter(d => \n          ['completed', 'compensated'].includes(d.status)\n        );\n        \n        totalStats.currentStreak = Math.max(totalStats.currentStreak, period.currentLength);\n        totalStats.longestStreak = Math.max(totalStats.longestStreak, period.maxLength);\n        totalStats.totalWorkouts += completedDays.length;\n        totalStats.totalDays += period.days.length;\n        \n        // Calculate this month's usage\n        const currentMonth = this.formatDate(new Date()).substring(0, 7);\n        const compensationUsed = period.days.filter(d => \n          d.date.startsWith(currentMonth) && d.status === 'compensated'\n        ).length;\n        const sickUsed = period.days.filter(d => \n          d.date.startsWith(currentMonth) && d.status === 'sick'\n        ).length;\n        const vacationUsed = period.days.filter(d => \n          d.date.startsWith(currentMonth) && d.status === 'vacation'\n        ).length;\n        \n        totalStats.compensationDaysAvailable = Math.min(\n          totalStats.compensationDaysAvailable,\n          this.config.maxCompensationDays - compensationUsed\n        );\n        totalStats.sickDaysAvailable = Math.min(\n          totalStats.sickDaysAvailable,\n          this.config.maxSickDays - sickUsed\n        );\n        totalStats.vacationDaysAvailable = Math.min(\n          totalStats.vacationDaysAvailable,\n          this.config.maxVacationDays - vacationUsed\n        );\n        \n        // Calculate streak risk\n        const risk = await this.calculateStreakRisk(schedule, period);\n        if (risk === 'high') totalStats.streakRisk = 'high';\n        else if (risk === 'medium' && totalStats.streakRisk !== 'high') totalStats.streakRisk = 'medium';\n        else if (risk === 'low' && totalStats.streakRisk === 'none') totalStats.streakRisk = 'low';\n        \n        // Calculate next scheduled workout\n        const nextWorkout = await this.getNextScheduledWorkout(schedule);\n        if (nextWorkout && (!totalStats.nextScheduledWorkout || nextWorkout < totalStats.nextScheduledWorkout)) {\n          totalStats.nextScheduledWorkout = nextWorkout;\n        }\n        \n        // Calculate missed days this week\n        const thisWeekMissed = await this.getMissedDaysThisWeek(period);\n        totalStats.missedDaysThisWeek += thisWeekMissed;\n        \n        // Calculate perfect weeks\n        const perfectWeeks = await this.getPerfectWeeks(schedule, period);\n        totalStats.perfectWeeks += perfectWeeks;\n      }\n      \n      totalStats.completionRate = totalStats.totalDays > 0 \n        ? (totalStats.totalWorkouts / totalStats.totalDays) * 100 \n        : 0;\n      \n      return totalStats;\n    } catch (error) {\n      logger.error('Error getting streak stats:', error);\n      throw error;\n    }\n  }\n\n  /**\n   * Calculate streak risk level\n   */\n  private async calculateStreakRisk(\n    schedule: StreakSchedule,\n    period: StreakPeriod\n  ): Promise<'none' | 'low' | 'medium' | 'high'> {\n    const today = new Date();\n    const todayStr = this.formatDate(today);\n    \n    // Check if today is a scheduled day\n    const isScheduledToday = schedule.scheduledDays.includes(today.getDay());\n    const todayStatus = period.days.find(d => d.date === todayStr)?.status;\n    \n    // High risk: missed today's scheduled workout\n    if (isScheduledToday && (!todayStatus || todayStatus === 'missed')) {\n      return 'high';\n    }\n    \n    // Medium risk: missed workouts this week\n    const thisWeekMissed = await this.getMissedDaysThisWeek(period);\n    if (thisWeekMissed >= 2) {\n      return 'medium';\n    }\n    \n    // Low risk: approaching weekly minimum\n    const thisWeekCompleted = await this.getCompletedDaysThisWeek(period);\n    if (thisWeekCompleted < this.config.minWorkoutsPerWeek) {\n      return 'low';\n    }\n    \n    return 'none';\n  }\n\n  /**\n   * Get next scheduled workout date\n   */\n  private async getNextScheduledWorkout(schedule: StreakSchedule): Promise<Date | undefined> {\n    const today = new Date();\n    const todayDay = today.getDay();\n    \n    // Find next scheduled day\n    let nextDay = schedule.scheduledDays.find(day => day > todayDay);\n    let daysToAdd = 0;\n    \n    if (nextDay !== undefined) {\n      daysToAdd = nextDay - todayDay;\n    } else {\n      // Next week\n      nextDay = schedule.scheduledDays[0];\n      daysToAdd = 7 - todayDay + nextDay;\n    }\n    \n    const nextDate = new Date(today);\n    nextDate.setDate(nextDate.getDate() + daysToAdd);\n    \n    return nextDate;\n  }\n\n  /**\n   * Get missed days this week\n   */\n  private async getMissedDaysThisWeek(period: StreakPeriod): Promise<number> {\n    const today = new Date();\n    const startOfWeek = new Date(today);\n    startOfWeek.setDate(today.getDate() - today.getDay());\n    \n    const endOfWeek = new Date(startOfWeek);\n    endOfWeek.setDate(startOfWeek.getDate() + 6);\n    \n    const startStr = this.formatDate(startOfWeek);\n    const endStr = this.formatDate(endOfWeek);\n    \n    return period.days.filter(d => \n      d.date >= startStr && d.date <= endStr && d.status === 'missed'\n    ).length;\n  }\n\n  /**\n   * Get completed days this week\n   */\n  private async getCompletedDaysThisWeek(period: StreakPeriod): Promise<number> {\n    const today = new Date();\n    const startOfWeek = new Date(today);\n    startOfWeek.setDate(today.getDate() - today.getDay());\n    \n    const endOfWeek = new Date(startOfWeek);\n    endOfWeek.setDate(startOfWeek.getDate() + 6);\n    \n    const startStr = this.formatDate(startOfWeek);\n    const endStr = this.formatDate(endOfWeek);\n    \n    return period.days.filter(d => \n      d.date >= startStr && d.date <= endStr && \n      ['completed', 'compensated'].includes(d.status)\n    ).length;\n  }\n\n  /**\n   * Get perfect weeks count\n   */\n  private async getPerfectWeeks(schedule: StreakSchedule, period: StreakPeriod): Promise<number> {\n    // Group days by week and count perfect weeks\n    const weekGroups = new Map<string, StreakDay[]>();\n    \n    for (const day of period.days) {\n      const date = new Date(day.date);\n      const startOfWeek = new Date(date);\n      startOfWeek.setDate(date.getDate() - date.getDay());\n      const weekKey = this.formatDate(startOfWeek);\n      \n      if (!weekGroups.has(weekKey)) {\n        weekGroups.set(weekKey, []);\n      }\n      weekGroups.get(weekKey)!.push(day);\n    }\n    \n    let perfectWeeks = 0;\n    \n    for (const [weekStart, weekDays] of weekGroups) {\n      const completedDays = weekDays.filter(d => \n        ['completed', 'compensated', 'sick', 'vacation'].includes(d.status)\n      ).length;\n      \n      if (completedDays >= schedule.targetDaysPerWeek) {\n        perfectWeeks++;\n      }\n    }\n    \n    return perfectWeeks;\n  }\n\n  // ============================================================================\n  // Daily Processing\n  // ============================================================================\n\n  /**\n   * Process daily streak updates (should be called daily)\n   */\n  async processDailyUpdates(): Promise<void> {\n    try {\n      logger.info('Processing daily streak updates...');\n      \n      const allSchedules = await this.db.getAll('streak_schedules');\n      \n      for (const schedule of allSchedules) {\n        const period = await this.getActiveStreakPeriod(schedule.id);\n        if (!period) continue;\n        \n        const yesterday = new Date();\n        yesterday.setDate(yesterday.getDate() - 1);\n        const yesterdayStr = this.formatDate(yesterday);\n        \n        // Check if yesterday was a scheduled day\n        const wasScheduled = schedule.scheduledDays.includes(yesterday.getDay());\n        const yesterdayStatus = period.days.find(d => d.date === yesterdayStr)?.status;\n        \n        // Mark missed days\n        if (wasScheduled && !yesterdayStatus) {\n          await this.recordStreakDay(period, yesterdayStr, 'missed');\n          logger.info(`Marked ${yesterdayStr} as missed for schedule ${schedule.name}`);\n        }\n        \n        // Mark rest days\n        if (schedule.restDays.includes(yesterday.getDay()) && !yesterdayStatus) {\n          await this.recordStreakDay(period, yesterdayStr, 'rest');\n        }\n      }\n      \n      logger.info('Daily streak updates completed');\n    } catch (error) {\n      logger.error('Error processing daily updates:', error);\n    }\n  }\n\n  // ============================================================================\n  // Utility Methods\n  // ============================================================================\n\n  /**\n   * Format date to YYYY-MM-DD string\n   */\n  private formatDate(date: Date): string {\n    return date.toISOString().split('T')[0];\n  }\n\n  /**\n   * Get date range for analysis\n   */\n  private getDateRange(startDate: Date, endDate: Date): string[] {\n    const dates: string[] = [];\n    const current = new Date(startDate);\n    \n    while (current <= endDate) {\n      dates.push(this.formatDate(current));\n      current.setDate(current.getDate() + 1);\n    }\n    \n    return dates;\n  }\n\n  /**\n   * Check if date is in the future\n   */\n  private isFutureDate(dateStr: string): boolean {\n    const date = new Date(dateStr);\n    const today = new Date();\n    today.setHours(0, 0, 0, 0);\n    return date > today;\n  }\n\n  /**\n   * Get streak configuration\n   */\n  getConfig(): StreakConfig {\n    return { ...this.config };\n  }\n\n  /**\n   * Update streak configuration\n   */\n  updateConfig(newConfig: Partial<StreakConfig>): void {\n    this.config = { ...this.config, ...newConfig };\n  }\n}\n\nexport default StreakManager;"