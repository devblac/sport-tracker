/**
 * Streak System Types
 * 
 * Type definitions for the intelligent streak system including
 * schedules, periods, days, and statistics.
 */

export interface StreakSchedule {
  id: string;
  userId: string;
  name: string;
  description?: string;
  targetDaysPerWeek: number;
  scheduledDays: number[]; // 0-6 (Sunday-Saturday)
  isFlexible: boolean; // Allow workouts on non-scheduled days
  restDays: number[]; // Mandatory rest days
  isActive: boolean;
  color?: string; // UI color for the schedule
  icon?: string; // UI icon for the schedule
  createdAt: Date;
  updatedAt: Date;
}

export interface StreakDay {
  date: string; // YYYY-MM-DD format
  status: 'completed' | 'missed' | 'rest' | 'sick' | 'vacation' | 'compensated' | 'planned';
  workoutId?: string;
  compensatedDate?: string; // Original date this compensates for
  notes?: string;
  intensity?: 'light' | 'moderate' | 'intense'; // Workout intensity
  duration?: number; // Workout duration in minutes
  exercises?: string[]; // Exercise IDs performed
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
  reason?: string; // Reason for ending (if ended)
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
  averageWorkoutsPerWeek: number;
  consistencyScore: number; // 0-100 based on adherence to schedule
}

export interface StreakConfig {
  maxCompensationDays: number; // Per month
  maxSickDays: number; // Per month
  maxVacationDays: number; // Per month
  compensationTimeLimit: number; // Days to compensate
  streakGracePeriod: number; // Days before streak breaks
  minWorkoutsPerWeek: number; // Minimum to maintain streak
  allowWeekendCompensation: boolean;
  autoMarkRestDays: boolean;
  sendRiskNotifications: boolean;
}

export interface StreakMilestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number; // Days required
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  rewards: {
    xp: number;
    title?: string;
    badge?: string;
  };
}

export interface StreakNotification {
  id: string;
  userId: string;
  type: 'risk' | 'milestone' | 'reminder' | 'congratulation';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  scheduleId?: string;
  actionRequired?: boolean;
  actionText?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface StreakAnalytics {
  userId: string;
  scheduleId: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  metrics: {
    totalWorkouts: number;
    scheduledWorkouts: number;
    completionRate: number;
    averageIntensity: number;
    averageDuration: number;
    longestStreak: number;
    streakBreaks: number;
    compensationDaysUsed: number;
    sickDaysUsed: number;
    vacationDaysUsed: number;
    perfectWeeks: number;
    consistencyTrend: 'improving' | 'stable' | 'declining';
  };
  insights: string[];
  recommendations: string[];
  createdAt: Date;
}

export interface StreakChallenge {
  id: string;
  name: string;
  description: string;
  type: 'personal' | 'community';
  duration: number; // Days
  target: {
    type: 'streak' | 'workouts' | 'consistency';
    value: number;
  };
  rewards: {
    xp: number;
    title?: string;
    badge?: string;
  };
  participants: string[]; // User IDs
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface StreakPreferences {
  userId: string;
  notifications: {
    riskAlerts: boolean;
    milestoneReminders: boolean;
    dailyReminders: boolean;
    weeklyReports: boolean;
    reminderTime: string; // HH:MM format
  };
  privacy: {
    shareStats: boolean;
    allowChallenges: boolean;
    showInLeaderboard: boolean;
  };
  goals: {
    targetStreakLength: number;
    targetWorkoutsPerWeek: number;
    preferredWorkoutDays: number[];
    preferredWorkoutTime: string;
  };
  updatedAt: Date;
}

// Utility types
export type StreakDayStatus = StreakDay['status'];
export type StreakRiskLevel = StreakStats['streakRisk'];
export type StreakNotificationType = StreakNotification['type'];
export type StreakChallengeType = StreakChallenge['type'];

// Event types for streak system
export interface StreakEvent {
  id: string;
  userId: string;
  scheduleId: string;
  type: 'workout_completed' | 'day_missed' | 'compensation_used' | 'milestone_reached' | 'streak_broken';
  data: Record<string, any>;
  timestamp: Date;
}

// Calendar view types
export interface StreakCalendarDay {
  date: string;
  status: StreakDayStatus;
  isScheduled: boolean;
  isToday: boolean;
  workoutCount: number;
  notes?: string;
  canCompensate?: boolean;
}

export interface StreakCalendarWeek {
  weekStart: string;
  days: StreakCalendarDay[];
  weekStats: {
    completed: number;
    scheduled: number;
    completionRate: number;
  };
}

export interface StreakCalendarMonth {
  month: string; // YYYY-MM
  weeks: StreakCalendarWeek[];
  monthStats: {
    totalWorkouts: number;
    scheduledWorkouts: number;
    completionRate: number;
    longestStreak: number;
    perfectWeeks: number;
  };
}

// API response types
export interface StreakResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StreakListResponse extends StreakResponse {
  data: {
    schedules: StreakSchedule[];
    stats: StreakStats;
    notifications: StreakNotification[];
  };
}

export interface StreakDetailResponse extends StreakResponse {
  data: {
    schedule: StreakSchedule;
    period: StreakPeriod;
    stats: StreakStats;
    calendar: StreakCalendarMonth[];
    analytics: StreakAnalytics;
  };
}

export default {
  StreakSchedule,
  StreakDay,
  StreakPeriod,
  StreakStats,
  StreakConfig,
  StreakMilestone,
  StreakNotification,
  StreakAnalytics,
  StreakChallenge,
  StreakPreferences,
  StreakEvent,
  StreakCalendarDay,
  StreakCalendarWeek,
  StreakCalendarMonth
};