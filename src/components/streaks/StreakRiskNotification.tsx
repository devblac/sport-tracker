/**
 * Streak Risk Notification Component
 * 
 * Notification components for alerting users about streak risks,
 * missed workouts, and providing actionable suggestions.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  Target, 
  Flame,
  Calendar,
  CheckCircle,
  X,
  ArrowRight,
  Heart,
  Umbrella,
  RotateCcw,
  Zap,
  Bell,
  BellOff
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { StreakStats, StreakSchedule } from '@/types/streaks';

interface StreakRiskNotificationProps {
  stats: StreakStats;
  schedule: StreakSchedule;
  onDismiss: () => void;
  onMarkSickDay?: () => void;
  onMarkVacationDay?: () => void;
  onScheduleWorkout?: () => void;
  onAdjustSchedule?: () => void;
  autoHide?: boolean;
  duration?: number;
}

interface RiskLevel {
  level: 'none' | 'low' | 'medium' | 'high';
  title: string;
  message: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  urgency: number;
  actions: Array<{
    label: string;
    action: string;
    primary?: boolean;
  }>;
}

const getRiskLevelData = (
  riskLevel: string,
  stats: StreakStats,
  schedule: StreakSchedule
): RiskLevel => {
  const baseData = {
    none: {
      level: 'none' as const,
      title: 'Streak Safe',
      message: 'Your streak is on track! Keep up the great work.',
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="w-5 h-5" />,
      urgency: 0,
      actions: []
    },
    low: {
      level: 'low' as const,
      title: 'Streak Attention Needed',
      message: `You're below your weekly target. ${stats.missedDaysThisWeek} missed days this week.`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      icon: <Target className="w-5 h-5" />,
      urgency: 1,
      actions: [
        { label: 'Schedule Workout', action: 'schedule', primary: true },
        { label: 'Adjust Schedule', action: 'adjust' }
      ]
    },
    medium: {
      level: 'medium' as const,
      title: 'Streak at Risk',
      message: `Your ${stats.currentStreak}-day streak needs attention. Multiple missed workouts this week.`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      icon: <Clock className="w-5 h-5" />,
      urgency: 2,
      actions: [
        { label: 'Workout Now', action: 'schedule', primary: true },
        { label: 'Use Sick Day', action: 'sick' },
        { label: 'Compensate', action: 'compensate' }
      ]
    },
    high: {
      level: 'high' as const,
      title: 'Streak in Danger!',
      message: `Your ${stats.currentStreak}-day streak is about to break! Today's workout was missed.`,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      icon: <AlertTriangle className="w-5 h-5" />,
      urgency: 3,
      actions: [
        { label: 'Workout Now', action: 'schedule', primary: true },
        { label: 'Mark Sick Day', action: 'sick' },
        { label: 'Mark Vacation', action: 'vacation' }
      ]
    }
  };

  return baseData[riskLevel as keyof typeof baseData] || baseData.none;
};

/**
 * Main Streak Risk Notification
 */
export const StreakRiskNotification: React.FC<StreakRiskNotificationProps> = ({
  stats,
  schedule,
  onDismiss,
  onMarkSickDay,
  onMarkVacationDay,
  onScheduleWorkout,
  onAdjustSchedule,
  autoHide = false,
  duration = 10000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const riskData = getRiskLevelData(stats.streakRisk, stats, schedule);

  useEffect(() => {
    if (autoHide && riskData.urgency < 2) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, riskData.urgency, onDismiss]);

  const handleAction = (action: string) => {
    switch (action) {
      case 'schedule':
        onScheduleWorkout?.();
        break;
      case 'sick':
        onMarkSickDay?.();
        break;
      case 'vacation':
        onMarkVacationDay?.();
        break;
      case 'adjust':
        onAdjustSchedule?.();
        break;
      case 'compensate':
        // Handle compensation logic
        console.log('Open compensation modal');
        break;
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (riskData.level === 'none') {
    return null; // Don't show notification for safe streaks
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'fixed top-4 right-4 z-50 max-w-sm border-2 rounded-lg shadow-lg overflow-hidden',
            riskData.bgColor
          )}
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn('p-2 rounded-full', riskData.bgColor)}>
                  <div className={riskData.color}>
                    {riskData.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className={cn('font-semibold', riskData.color)}>
                    {riskData.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {riskData.message}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Streak info */}
            <div className="mt-3 flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-medium">{stats.currentStreak} days</span>
              </div>
              
              {stats.nextScheduledWorkout && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">
                    Next: {stats.nextScheduledWorkout.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {riskData.actions.length > 0 && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {riskData.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleAction(action.action)}
                    className={cn(
                      'flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      action.primary
                        ? cn('text-white', riskData.color.replace('text-', 'bg-'), 'hover:opacity-90')
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    )}
                  >
                    <span>{action.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expandable details */}
          {riskData.urgency >= 2 && (
            <div className="border-t border-gray-200">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {isExpanded ? 'Hide details' : 'Show details'}
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 pb-4 text-sm text-gray-600"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Completion rate:</span>
                        <span className="font-medium">{stats.completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Missed this week:</span>
                        <span className="font-medium">{stats.missedDaysThisWeek}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Compensation days:</span>
                        <span className="font-medium">{stats.compensationDaysAvailable}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Perfect weeks:</span>
                        <span className="font-medium">{stats.perfectWeeks}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Urgency indicator */}
          {riskData.urgency >= 3 && (
            <motion.div
              className="absolute top-0 left-0 w-full h-1 bg-red-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Streak Reminder Notification
 */
export const StreakReminderNotification: React.FC<{
  schedule: StreakSchedule;
  nextWorkout: Date;
  onDismiss: () => void;
  onScheduleWorkout?: () => void;
  onSnooze?: (minutes: number) => void;
}> = ({ schedule, nextWorkout, onDismiss, onScheduleWorkout, onSnooze }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const isToday = nextWorkout.toDateString() === new Date().toDateString();
  const timeUntil = nextWorkout.getTime() - Date.now();
  const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-50 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-lg max-w-sm overflow-hidden"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800">
                    Workout Reminder
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">
                    {isToday 
                      ? `Your ${schedule.name} workout is scheduled for today`
                      : `Next workout: ${nextWorkout.toLocaleDateString()}`
                    }
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-blue-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-blue-400" />
              </button>
            </div>

            {isToday && hoursUntil > 0 && (
              <div className="mt-2 text-sm text-blue-600">
                <Clock className="w-4 h-4 inline mr-1" />
                In {hoursUntil} hour{hoursUntil !== 1 ? 's' : ''}
              </div>
            )}

            <div className="mt-4 flex space-x-2">
              <button
                onClick={onScheduleWorkout}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <CheckCircle className="w-3 h-3" />
                <span>Start Workout</span>
              </button>
              
              {onSnooze && (
                <button
                  onClick={() => onSnooze(30)}
                  className="flex items-center space-x-1 px-3 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  <Clock className="w-3 h-3" />
                  <span>Snooze 30m</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Streak Recovery Notification
 */
export const StreakRecoveryNotification: React.FC<{
  previousStreak: number;
  onDismiss: () => void;
  onStartNewStreak?: () => void;
}> = ({ previousStreak, onDismiss, onStartNewStreak }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-50 bg-orange-50 border-2 border-orange-200 rounded-lg shadow-lg max-w-sm overflow-hidden"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <RotateCcw className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800">
                    Streak Ended
                  </h3>
                  <p className="text-sm text-orange-600 mt-1">
                    Your {previousStreak}-day streak has ended, but don't give up!
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-orange-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-orange-400" />
              </button>
            </div>

            <div className="mt-3 p-3 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-700">
                Every streak ends, but every ending is a new beginning. 
                You've proven you can do {previousStreak} days - you can do it again!
              </p>
            </div>

            <div className="mt-4">
              <button
                onClick={onStartNewStreak}
                className="flex items-center space-x-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors w-full justify-center"
              >
                <Zap className="w-4 h-4" />
                <span>Start New Streak</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Notification Manager for Streaks
 */
export const StreakNotificationManager: React.FC<{
  stats: StreakStats;
  schedule: StreakSchedule;
  onMarkSickDay?: () => void;
  onMarkVacationDay?: () => void;
  onScheduleWorkout?: () => void;
  onAdjustSchedule?: () => void;
  className?: string;
}> = ({
  stats,
  schedule,
  onMarkSickDay,
  onMarkVacationDay,
  onScheduleWorkout,
  onAdjustSchedule,
  className
}) => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'risk' | 'reminder' | 'recovery';
    data: any;
  }>>([]);

  // Add risk notification if needed
  useEffect(() => {
    if (stats.streakRisk !== 'none') {
      const riskNotification = {
        id: 'risk-' + Date.now(),
        type: 'risk' as const,
        data: { stats, schedule }
      };
      
      setNotifications(prev => {
        const filtered = prev.filter(n => n.type !== 'risk');
        return [...filtered, riskNotification];
      });
    } else {
      setNotifications(prev => prev.filter(n => n.type !== 'risk'));
    }
  }, [stats.streakRisk, stats, schedule]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className={cn('fixed top-4 right-4 z-50 space-y-2', className)}>
      <AnimatePresence>
        {notifications.map(notification => {
          switch (notification.type) {
            case 'risk':
              return (
                <StreakRiskNotification
                  key={notification.id}
                  stats={notification.data.stats}
                  schedule={notification.data.schedule}
                  onDismiss={() => removeNotification(notification.id)}
                  onMarkSickDay={onMarkSickDay}
                  onMarkVacationDay={onMarkVacationDay}
                  onScheduleWorkout={onScheduleWorkout}
                  onAdjustSchedule={onAdjustSchedule}
                />
              );
            default:
              return null;
          }
        })}
      </AnimatePresence>
    </div>
  );
};

export default StreakRiskNotification;