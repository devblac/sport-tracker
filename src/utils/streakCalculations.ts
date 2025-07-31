/**
 * Streak Calculations Utilities
 * 
 * Utility functions for calculating streak statistics, analyzing patterns,
 * and generating insights for the intelligent streak system.
 */

import type {
  StreakSchedule,
  StreakPeriod,
  StreakDay,
  StreakStats,
  StreakCalendarDay,
  StreakCalendarWeek,
  StreakCalendarMonth
} from '@/types/streaks';

/**
 * Calculate current streak length
 */
export function calculateCurrentStreak(days: StreakDay[]): number {
  if (days.length === 0) return 0;

  const sortedDays = [...days].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;

  for (const day of sortedDays) {
    if (['completed', 'compensated', 'sick', 'vacation'].includes(day.status)) {
      streak++;
    } else if (day.status === 'missed') {
      break;
    }
    // Skip 'rest' and 'planned' days
  }

  return streak;
}

/**
 * Calculate longest streak in a period
 */
export function calculateLongestStreak(days: StreakDay[]): number {
  if (days.length === 0) return 0;

  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let maxStreak = 0;
  let currentStreak = 0;

  for (const day of sortedDays) {
    if (['completed', 'compensated', 'sick', 'vacation'].includes(day.status)) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (day.status === 'missed') {
      currentStreak = 0;
    }
    // Continue streak for 'rest' and 'planned' days
  }

  return maxStreak;
}

/**
 * Calculate completion rate
 */
export function calculateCompletionRate(
  days: StreakDay[],
  schedule: StreakSchedule
): number {
  if (days.length === 0) return 0;

  const scheduledDays = days.filter(day => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    return schedule.scheduledDays.includes(dayOfWeek);
  });

  if (scheduledDays.length === 0) return 0;

  const completedDays = scheduledDays.filter(day =>
    ['completed', 'compensated', 'sick', 'vacation'].includes(day.status)
  );

  return (completedDays.length / scheduledDays.length) * 100;
}

/**
 * Calculate consistency score (0-100)
 */
export function calculateConsistencyScore(
  days: StreakDay[],
  schedule: StreakSchedule
): number {
  if (days.length === 0) return 0;

  // Group days by week
  const weekGroups = groupDaysByWeek(days);
  let totalScore = 0;
  let weekCount = 0;

  for (const weekDays of weekGroups.values()) {
    const weekScore = calculateWeekConsistencyScore(weekDays, schedule);
    totalScore += weekScore;
    weekCount++;
  }

  return weekCount > 0 ? totalScore / weekCount : 0;
}

/**
 * Calculate week consistency score
 */
function calculateWeekConsistencyScore(
  weekDays: StreakDay[],
  schedule: StreakSchedule
): number {
  const scheduledDaysInWeek = weekDays.filter(day => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    return schedule.scheduledDays.includes(dayOfWeek);
  });

  if (scheduledDaysInWeek.length === 0) return 100; // No scheduled days = perfect

  const completedDays = scheduledDaysInWeek.filter(day =>
    ['completed', 'compensated', 'sick', 'vacation'].includes(day.status)
  );

  const baseScore = (completedDays.length / scheduledDaysInWeek.length) * 100;

  // Bonus for exceeding target
  const targetMet = completedDays.length >= schedule.targetDaysPerWeek;
  const bonusScore = targetMet ? 10 : 0;

  // Penalty for missed days without compensation
  const missedDays = scheduledDaysInWeek.filter(day => day.status === 'missed');
  const penaltyScore = missedDays.length * 5;

  return Math.max(0, Math.min(100, baseScore + bonusScore - penaltyScore));
}

/**
 * Group days by week
 */
function groupDaysByWeek(days: StreakDay[]): Map<string, StreakDay[]> {
  const weekGroups = new Map<string, StreakDay[]>();

  for (const day of days) {
    const date = new Date(day.date);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const weekKey = formatDate(startOfWeek);

    if (!weekGroups.has(weekKey)) {
      weekGroups.set(weekKey, []);
    }
    weekGroups.get(weekKey)!.push(day);
  }

  return weekGroups;
}

/**
 * Calculate perfect weeks
 */
export function calculatePerfectWeeks(
  days: StreakDay[],
  schedule: StreakSchedule
): number {
  const weekGroups = groupDaysByWeek(days);
  let perfectWeeks = 0;

  for (const weekDays of weekGroups.values()) {
    const completedDays = weekDays.filter(day =>
      ['completed', 'compensated', 'sick', 'vacation'].includes(day.status)
    );

    if (completedDays.length >= schedule.targetDaysPerWeek) {
      perfectWeeks++;
    }
  }

  return perfectWeeks;
}

/**
 * Calculate average workouts per week
 */
export function calculateAverageWorkoutsPerWeek(days: StreakDay[]): number {
  if (days.length === 0) return 0;

  const weekGroups = groupDaysByWeek(days);
  let totalWorkouts = 0;

  for (const weekDays of weekGroups.values()) {
    const workouts = weekDays.filter(day =>
      ['completed', 'compensated'].includes(day.status)
    );
    totalWorkouts += workouts.length;
  }

  return weekGroups.size > 0 ? totalWorkouts / weekGroups.size : 0;
}

/**
 * Analyze streak risk
 */
export function analyzeStreakRisk(
  days: StreakDay[],
  schedule: StreakSchedule,
  today: Date = new Date()
): 'none' | 'low' | 'medium' | 'high' {
  const todayStr = formatDate(today);
  const todayDay = today.getDay();

  // Check if today is scheduled
  const isScheduledToday = schedule.scheduledDays.includes(todayDay);
  const todayStatus = days.find(d => d.date === todayStr)?.status;

  // High risk: missed today's scheduled workout
  if (isScheduledToday && (!todayStatus || todayStatus === 'missed')) {
    return 'high';
  }

  // Get this week's data
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const thisWeekDays = days.filter(d => {
    const dayDate = new Date(d.date);
    return dayDate >= startOfWeek && dayDate <= endOfWeek;
  });

  const missedThisWeek = thisWeekDays.filter(d => d.status === 'missed').length;
  const completedThisWeek = thisWeekDays.filter(d =>
    ['completed', 'compensated'].includes(d.status)
  ).length;

  // Medium risk: multiple missed days this week
  if (missedThisWeek >= 2) {
    return 'medium';
  }

  // Low risk: below target for the week
  if (completedThisWeek < schedule.targetDaysPerWeek) {
    return 'low';
  }

  return 'none';
}

/**
 * Generate calendar data for a month
 */
export function generateCalendarMonth(
  days: StreakDay[],
  schedule: StreakSchedule,
  month: string // YYYY-MM format
): StreakCalendarMonth {
  const [year, monthNum] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const lastDay = new Date(year, monthNum, 0);
  
  const weeks: StreakCalendarWeek[] = [];
  let currentWeekStart = new Date(firstDay);
  currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay());

  while (currentWeekStart <= lastDay) {
    const weekDays: StreakCalendarDay[] = [];
    const weekStart = new Date(currentWeekStart);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = formatDate(date);
      
      const dayData = days.find(d => d.date === dateStr);
      const isScheduled = schedule.scheduledDays.includes(date.getDay());
      const isToday = dateStr === formatDate(new Date());

      weekDays.push({
        date: dateStr,
        status: dayData?.status || 'planned',
        isScheduled,
        isToday,
        workoutCount: dayData?.workoutId ? 1 : 0,
        notes: dayData?.notes,
        canCompensate: dayData?.status === 'missed' && canCompensateDay(dateStr)
      });
    }

    const completed = weekDays.filter(d => 
      ['completed', 'compensated'].includes(d.status)
    ).length;
    const scheduled = weekDays.filter(d => d.isScheduled).length;

    weeks.push({
      weekStart: formatDate(weekStart),
      days: weekDays,
      weekStats: {
        completed,
        scheduled,
        completionRate: scheduled > 0 ? (completed / scheduled) * 100 : 0
      }
    });

    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  // Calculate month stats
  const allDays = weeks.flatMap(w => w.days);
  const monthWorkouts = allDays.filter(d => 
    ['completed', 'compensated'].includes(d.status)
  ).length;
  const monthScheduled = allDays.filter(d => d.isScheduled).length;
  const monthPerfectWeeks = weeks.filter(w => 
    w.weekStats.completed >= schedule.targetDaysPerWeek
  ).length;

  // Calculate longest streak in month
  const monthDays = days.filter(d => d.date.startsWith(month));
  const monthLongestStreak = calculateLongestStreak(monthDays);

  return {
    month,
    weeks,
    monthStats: {
      totalWorkouts: monthWorkouts,
      scheduledWorkouts: monthScheduled,
      completionRate: monthScheduled > 0 ? (monthWorkouts / monthScheduled) * 100 : 0,
      longestStreak: monthLongestStreak,
      perfectWeeks: monthPerfectWeeks
    }
  };
}

/**
 * Check if a day can be compensated
 */
function canCompensateDay(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  const daysDiff = Math.abs((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff <= 7; // Can compensate within 7 days
}

/**
 * Generate streak insights
 */
export function generateStreakInsights(
  days: StreakDay[],
  schedule: StreakSchedule,
  stats: StreakStats
): string[] {
  const insights: string[] = [];

  // Current streak insights
  if (stats.currentStreak >= 7) {
    insights.push(`🔥 Amazing! You're on a ${stats.currentStreak}-day streak!`);
  } else if (stats.currentStreak >= 3) {
    insights.push(`💪 Great momentum with a ${stats.currentStreak}-day streak!`);
  }

  // Completion rate insights
  if (stats.completionRate >= 90) {
    insights.push('🎯 Excellent consistency! You\'re hitting almost all your scheduled workouts.');
  } else if (stats.completionRate >= 70) {
    insights.push('👍 Good consistency! Keep pushing to hit more scheduled workouts.');
  } else if (stats.completionRate < 50) {
    insights.push('⚠️ Your completion rate could use improvement. Consider adjusting your schedule.');
  }

  // Perfect weeks insights
  if (stats.perfectWeeks >= 4) {
    insights.push(`🏆 Outstanding! You've had ${stats.perfectWeeks} perfect weeks!`);
  } else if (stats.perfectWeeks >= 2) {
    insights.push(`⭐ Great job! ${stats.perfectWeeks} perfect weeks shows real dedication.`);
  }

  // Risk insights
  if (stats.streakRisk === 'high') {
    insights.push('🚨 Your streak is at high risk! Try to get a workout in today.');
  } else if (stats.streakRisk === 'medium') {
    insights.push('⚠️ Your streak needs attention. Plan your next workout soon.');
  }

  // Compensation insights
  if (stats.compensationDaysAvailable <= 1) {
    insights.push('⏰ You\'re running low on compensation days this month.');
  }

  // Weekly pattern insights
  const weeklyAverage = stats.averageWorkoutsPerWeek;
  if (weeklyAverage >= schedule.targetDaysPerWeek) {
    insights.push(`📈 You're averaging ${weeklyAverage.toFixed(1)} workouts per week - above your target!`);
  } else {
    insights.push(`📊 You're averaging ${weeklyAverage.toFixed(1)} workouts per week. Target: ${schedule.targetDaysPerWeek}`);
  }

  return insights;
}

/**
 * Generate streak recommendations
 */
export function generateStreakRecommendations(
  days: StreakDay[],
  schedule: StreakSchedule,
  stats: StreakStats
): string[] {
  const recommendations: string[] = [];

  // Risk-based recommendations
  if (stats.streakRisk === 'high') {
    recommendations.push('Schedule a workout for today to maintain your streak');
    recommendations.push('Consider a shorter workout if time is limited');
  } else if (stats.streakRisk === 'medium') {
    recommendations.push('Plan your next workout within the next 2 days');
    recommendations.push('Use a compensation day if you missed a recent workout');
  }

  // Completion rate recommendations
  if (stats.completionRate < 70) {
    recommendations.push('Consider reducing your target days per week to build consistency');
    recommendations.push('Focus on shorter, more manageable workouts');
    recommendations.push('Review your scheduled days - are they realistic for your lifestyle?');
  }

  // Consistency recommendations
  if (stats.consistencyScore < 60) {
    recommendations.push('Try to stick to the same workout days each week');
    recommendations.push('Set reminders for your scheduled workout days');
    recommendations.push('Prepare your workout gear the night before');
  }

  // Compensation recommendations
  if (stats.compensationDaysAvailable > 2) {
    recommendations.push('You have compensation days available - use them if you miss a workout');
  }

  // Schedule optimization recommendations
  const missedDayPattern = analyzeMissedDayPattern(days, schedule);
  if (missedDayPattern.length > 0) {
    recommendations.push(`Consider moving workouts away from ${missedDayPattern.join(', ')} - you miss these days most often`);
  }

  return recommendations;
}

/**
 * Analyze which days are missed most often
 */
function analyzeMissedDayPattern(
  days: StreakDay[],
  schedule: StreakSchedule
): string[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const missedByDay = new Map<number, number>();

  // Initialize counters for scheduled days
  schedule.scheduledDays.forEach(day => {
    missedByDay.set(day, 0);
  });

  // Count missed days
  days.forEach(day => {
    if (day.status === 'missed') {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      if (schedule.scheduledDays.includes(dayOfWeek)) {
        missedByDay.set(dayOfWeek, (missedByDay.get(dayOfWeek) || 0) + 1);
      }
    }
  });

  // Find days with high miss rate (>30%)
  const problematicDays: string[] = [];
  const totalWeeks = Math.ceil(days.length / 7);

  missedByDay.forEach((missedCount, dayOfWeek) => {
    const missRate = missedCount / totalWeeks;
    if (missRate > 0.3) { // More than 30% miss rate
      problematicDays.push(dayNames[dayOfWeek]);
    }
  });

  return problematicDays;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get date range between two dates
 */
export function getDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Check if date is weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Get week number of year
 */
export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export default {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateCompletionRate,
  calculateConsistencyScore,
  calculatePerfectWeeks,
  calculateAverageWorkoutsPerWeek,
  analyzeStreakRisk,
  generateCalendarMonth,
  generateStreakInsights,
  generateStreakRecommendations,
  getDateRange,
  isWeekend,
  getWeekNumber
};