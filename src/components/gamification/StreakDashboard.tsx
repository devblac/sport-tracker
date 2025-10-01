/**
 * Streak Dashboard Component
 * 
 * Comprehensive dashboard for displaying streak information, progress,
 * milestones, and streak management features.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Calendar, 
  Target, 
  Shield, 
  Clock, 
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  Settings,
  Heart,
  Zap,
  Star
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { realStreakService } from '@/services/RealStreakService';
import { useAuthStore } from '@/stores/useAuthStore';
import { logger } from '@/utils/logger';
import type { UserStreak, StreakMilestone } from '@/types/gamification';
import type { StreakStats, PersonalizedSchedule } from '@/services/RealStreakService';

interface StreakDashboardProps {
  className?: string;
}

interface StreakRiskIndicatorProps {
  risk: 'none' | 'low' | 'medium' | 'high';
  daysSinceLastWorkout: number;
}

const StreakRiskIndicator: React.FC<StreakRiskIndicatorProps> = ({ risk, daysSinceLastWorkout }) => {
  const getRiskConfig = (risk: string) => {
    const configs = {
      none: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, message: 'Streak is safe' },
      low: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock, message: 'Consider working out soon' },
      medium: { color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertTriangle, message: 'Streak at risk!' },
      high: { color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle, message: 'Streak in danger!' }
    };
    return configs[risk] || configs.none;
  };

  const config = getRiskConfig(risk);
  const Icon = config.icon;

  if (risk === 'none') return null;

  return (
    <motion.div
      className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-lg',
        config.bg
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Icon className={cn('w-4 h-4', config.color)} />
      <div>
        <div className={cn('font-medium text-sm', config.color)}>
          {config.message}
        </div>
        <div className="text-xs text-gray-600">
          {daysSinceLastWorkout} day{daysSinceLastWorkout !== 1 ? 's' : ''} since last workout
        </div>
      </div>
    </motion.div>
  );
};

const StreakDashboard: React.FC<StreakDashboardProps> = ({ className }) => {
  const { user } = useAuthStore();
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [schedule, setSchedule] = useState<PersonalizedSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadStreakData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [streakData, statsData, scheduleData] = await Promise.all([
        realStreakService.getCurrentStreak(user.id),
        realStreakService.getStreakStats(user.id),
        realStreakService.getUserSchedule(user.id)
      ]);

      setStreak(streakData);
      setStats(statsData);
      setSchedule(scheduleData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load streak data';
      setError(errorMessage);
      logger.error('Failed to load streak data', { error: err, userId: user.id });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStreakData();
  }, [user?.id]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const daysSinceLastWorkout = streak?.lastWorkoutDate 
    ? Math.floor((Date.now() - new Date(streak.lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const progressToNextMilestone = stats?.nextMilestone 
    ? (stats.currentStreak / stats.nextMilestone.days) * 100
    : 0;

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleUseStreakFreeze = async (type: 'sick_day' | 'vacation_day') => {
    if (!user?.id) return;

    try {
      const today = new Date();
      const success = await realStreakService.useStreakFreeze(
        user.id,
        type,
        today,
        today,
        `Used ${type.replace('_', ' ')} to protect streak`
      );

      if (success) {
        await loadStreakData();
      }
    } catch (error) {
      logger.error('Failed to use streak freeze', { error, type });
    }
  };

  // ============================================================================
  // Render Methods
  // ============================================================================

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading streak data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-red-500 mb-4">
          <Flame className="w-12 h-12 mx-auto mb-2" />
          <p className="font-semibold">Failed to load streak data</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={loadStreakData}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!streak || !stats) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Flame className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No streak data available</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Streak Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Keep your fitness momentum going strong
          </p>
        </div>
        <button
          onClick={() => setShowScheduleSettings(true)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Current Streak Card */}
      <motion.div
        className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/20 rounded-full">
              <Flame className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Current Streak</h2>
              <p className="text-orange-100">Keep the fire burning!</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{streak.currentStreak}</div>
            <div className="text-orange-100">days</div>
          </div>
        </div>

        {/* Streak Risk Indicator */}
        {stats.streakRisk !== 'none' && (
          <StreakRiskIndicator 
            risk={stats.streakRisk} 
            daysSinceLastWorkout={daysSinceLastWorkout} 
          />
        )}

        {/* Last Workout Info */}
        {streak.lastWorkoutDate && (
          <div className="mt-4 text-orange-100 text-sm">
            Last workout: {new Date(streak.lastWorkoutDate).toLocaleDateString()}
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {streak.longestStreak}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Longest Streak
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(stats.completionRate)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Completion Rate
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Calendar className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.perfectWeeks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Perfect Weeks
          </div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(stats.consistencyScore)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Consistency Score
          </div>
        </motion.div>
      </div>

      {/* Next Milestone */}
      {stats.nextMilestone && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-yellow-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Next Milestone
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {stats.nextMilestone.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.daysToNextMilestone}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                days to go
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>{streak.currentStreak} days</span>
              <span>{stats.nextMilestone.days} days</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextMilestone}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats.nextMilestone.description}
          </p>
        </motion.div>
      )}

      {/* Streak Protection */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Streak Protection
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sick Days */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Heart className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Sick Days
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {streak.maxSickDays - streak.sickDaysUsed} remaining
                </div>
              </div>
            </div>
            <button
              onClick={() => handleUseStreakFreeze('sick_day')}
              disabled={streak.sickDaysUsed >= streak.maxSickDays}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use
            </button>
          </div>

          {/* Vacation Days */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Vacation Days
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {streak.maxVacationDays - streak.vacationDaysUsed} remaining
                </div>
              </div>
            </div>
            <button
              onClick={() => handleUseStreakFreeze('vacation_day')}
              disabled={streak.vacationDaysUsed >= streak.maxVacationDays}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Streak Protection:</strong> Use sick days when you're unwell or vacation days 
              for planned breaks. These won't break your streak but should be used wisely.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weekly Schedule */}
      {schedule && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Weekly Schedule
              </h3>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {schedule.targetDaysPerWeek} days per week
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
              const dayName = day.toLowerCase();
              const isScheduled = schedule.scheduledDays.includes(dayName);
              const isRest = schedule.restDays.includes(dayName);
              
              return (
                <div
                  key={day}
                  className={cn(
                    'p-3 rounded-lg text-center text-sm font-medium',
                    isScheduled && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                    isRest && 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                    !isScheduled && !isRest && 'bg-gray-50 text-gray-400 dark:bg-gray-700/50'
                  )}
                >
                  <div className="mb-1">{day}</div>
                  <div className="text-xs">
                    {isScheduled && <CheckCircle className="w-3 h-3 mx-auto" />}
                    {isRest && '💤'}
                    {!isScheduled && !isRest && '⚪'}
                  </div>
                </div>
              );
            })}
          </div>

          {schedule.isFlexible && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-green-500" />
                <div className="text-sm text-green-700 dark:text-green-300">
                  <strong>Flexible Schedule:</strong> You can work out on any day to maintain your streak.
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default StreakDashboard;