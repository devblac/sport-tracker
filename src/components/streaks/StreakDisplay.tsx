/**
 * Streak Display Component
 * 
 * Visual component for displaying streak information with calendar view,
 * statistics, and interactive features for managing streaks.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Flame, 
  Target, 
  Clock,
  Heart,
  Umbrella,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  CheckCircle,
  X,
  Info,
  Crown,
  Shield,
  Star
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { generateCalendarMonth } from '@/utils/streakCalculations';
import { useStreakRewards } from '@/hooks/useStreakRewards';
import type { 
  StreakSchedule, 
  StreakPeriod, 
  StreakStats, 
  StreakDay,
  StreakCalendarDay,
  StreakCalendarMonth 
} from '@/types/streaks';

interface StreakDisplayProps {
  userId: string;
  schedule: StreakSchedule;
  period: StreakPeriod;
  stats: StreakStats;
  onMarkSickDay?: (date: string, notes?: string) => Promise<boolean>;
  onMarkVacationDay?: (date: string, notes?: string) => Promise<boolean>;
  onCompensateDay?: (missedDate: string, compensationDate: string, workoutId: string) => Promise<boolean>;
  onRecordWorkout?: (date: string) => Promise<void>;
  className?: string;
}

interface DayModalProps {
  day: StreakCalendarDay;
  schedule: StreakSchedule;
  onClose: () => void;
  onMarkSickDay?: (date: string, notes?: string) => Promise<boolean>;
  onMarkVacationDay?: (date: string, notes?: string) => Promise<boolean>;
  onCompensateDay?: (missedDate: string, compensationDate: string, workoutId: string) => Promise<boolean>;
  onRecordWorkout?: (date: string) => Promise<void>;
}

const DayModal: React.FC<DayModalProps> = ({
  day,
  schedule,
  onClose,
  onMarkSickDay,
  onMarkVacationDay,
  onCompensateDay,
  onRecordWorkout
}) => {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkSickDay = async () => {
    if (!onMarkSickDay) return;
    setIsLoading(true);
    try {
      const success = await onMarkSickDay(day.date, notes);
      if (success) onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkVacationDay = async () => {
    if (!onMarkVacationDay) return;
    setIsLoading(true);
    try {
      const success = await onMarkVacationDay(day.date, notes);
      if (success) onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordWorkout = async () => {
    if (!onRecordWorkout) return;
    setIsLoading(true);
    try {
      await onRecordWorkout(day.date);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'compensated': return 'text-blue-600 bg-blue-100';
      case 'missed': return 'text-red-600 bg-red-100';
      case 'sick': return 'text-orange-600 bg-orange-100';
      case 'vacation': return 'text-purple-600 bg-purple-100';
      case 'rest': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'compensated': return <RotateCcw className="w-4 h-4" />;
      case 'missed': return <X className="w-4 h-4" />;
      case 'sick': return <Heart className="w-4 h-4" />;
      case 'vacation': return <Umbrella className="w-4 h-4" />;
      case 'rest': return <Clock className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const isPastDate = new Date(day.date) < new Date();
  const isFutureDate = new Date(day.date) > new Date();

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {new Date(day.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <div className={cn('inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium', getStatusColor(day.status))}>
                {getStatusIcon(day.status)}
                <span className="capitalize">{day.status}</span>
              </div>
              {day.isScheduled && (
                <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                  <Target className="w-3 h-3" />
                  <span>Scheduled</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notes */}
        {day.notes && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Info className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{day.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Notes input for new actions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 gap-2">
            {/* Record workout for past/present days */}
            {!isFutureDate && day.status !== 'completed' && (
              <button
                onClick={handleRecordWorkout}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Record Workout</span>
              </button>
            )}

            {/* Mark as sick day */}
            {isPastDate && day.status === 'missed' && (
              <button
                onClick={handleMarkSickDay}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span>Mark as Sick Day</span>
              </button>
            )}

            {/* Mark as vacation day */}
            {(isPastDate || isFutureDate) && ['missed', 'planned'].includes(day.status) && (
              <button
                onClick={handleMarkVacationDay}
                disabled={isLoading}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
              >
                <Umbrella className="w-4 h-4" />
                <span>Mark as Vacation Day</span>
              </button>
            )}

            {/* Compensation option */}
            {day.canCompensate && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Compensation Available
                  </span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300 mb-2">
                  You can compensate for this missed day by working out on a different day within 7 days.
                </p>
                <button
                  onClick={() => {
                    // This would open a date picker for compensation
                    console.log('Open compensation date picker');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Choose Compensation Date →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
};

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  userId,
  schedule,
  period,
  stats,
  onMarkSickDay,
  onMarkVacationDay,
  onCompensateDay,
  onRecordWorkout,
  className
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDay, setSelectedDay] = useState<StreakCalendarDay | null>(null);

  // Get streak rewards data
  const {
    activeTitle,
    activeShields,
    currentXPMultiplier,
    checkForNewRewards
  } = useStreakRewards(userId);

  // Generate calendar data
  const calendarData = useMemo(() => {
    return generateCalendarMonth(period.days, schedule, currentMonth);
  }, [period.days, schedule, currentMonth]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const getDayClassName = (day: StreakCalendarDay) => {
    const baseClasses = 'relative w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105';
    
    let statusClasses = '';
    switch (day.status) {
      case 'completed':
        statusClasses = 'bg-green-500 text-white shadow-lg shadow-green-500/30';
        break;
      case 'compensated':
        statusClasses = 'bg-blue-500 text-white shadow-lg shadow-blue-500/30';
        break;
      case 'missed':
        statusClasses = 'bg-red-500 text-white shadow-lg shadow-red-500/30';
        break;
      case 'sick':
        statusClasses = 'bg-orange-500 text-white shadow-lg shadow-orange-500/30';
        break;
      case 'vacation':
        statusClasses = 'bg-purple-500 text-white shadow-lg shadow-purple-500/30';
        break;
      case 'rest':
        statusClasses = 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300';
        break;
      default:
        if (day.isScheduled) {
          statusClasses = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600';
        } else {
          statusClasses = 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
        }
    }

    if (day.isToday) {
      statusClasses += ' ring-2 ring-yellow-400 ring-offset-2';
    }

    return cn(baseClasses, statusClasses);
  };

  const getDayIcon = (day: StreakCalendarDay) => {
    switch (day.status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'compensated': return <RotateCcw className="w-4 h-4" />;
      case 'missed': return <X className="w-4 h-4" />;
      case 'sick': return <Heart className="w-4 h-4" />;
      case 'vacation': return <Umbrella className="w-4 h-4" />;
      case 'rest': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  const monthName = new Date(currentMonth + '-01').toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Flame className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {schedule.name}
            </h2>
            {activeShields.length > 0 && (
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {activeShields.length} shield{activeShields.length > 1 ? 's' : ''} active
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {schedule.targetDaysPerWeek} days per week • {schedule.isFlexible ? 'Flexible' : 'Strict'} schedule
            </p>
            
            {/* Active Title */}
            {activeTitle && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
                <Crown className="w-3 h-3" />
                <span>{activeTitle.name}</span>
              </div>
            )}
            
            {/* XP Multiplier */}
            {currentXPMultiplier > 1 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-xs">
                <Star className="w-3 h-3" />
                <span>{currentXPMultiplier.toFixed(1)}x XP</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-500">
            {stats.currentStreak}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Current Streak
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {stats.longestStreak}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Longest Streak
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {stats.completionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Completion Rate
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {stats.perfectWeeks}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Perfect Weeks
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {stats.averageWorkoutsPerWeek.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Avg/Week
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {monthName}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar */}
      <div className="space-y-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        {calendarData.weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.days.map((day, dayIndex) => {
              const dayNumber = new Date(day.date).getDate();
              const isCurrentMonth = day.date.startsWith(currentMonth);
              
              return (
                <div
                  key={dayIndex}
                  className={cn(
                    getDayClassName(day),
                    !isCurrentMonth && 'opacity-30'
                  )}
                  onClick={() => isCurrentMonth && setSelectedDay(day)}
                >
                  <span className="relative z-10">
                    {dayNumber}
                  </span>
                  
                  {/* Status icon */}
                  {getDayIcon(day) && (
                    <div className="absolute top-0 right-0 -mt-1 -mr-1">
                      <div className="w-4 h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                        {getDayIcon(day)}
                      </div>
                    </div>
                  )}
                  
                  {/* Workout count indicator */}
                  {day.workoutCount > 1 && (
                    <div className="absolute bottom-0 right-0 -mb-1 -mr-1">
                      <div className="w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                        {day.workoutCount}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Compensated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Missed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Sick Day</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Vacation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Rest Day</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border-2 border-blue-300 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded ring-2 ring-yellow-400 ring-offset-1"></div>
            <span className="text-gray-600 dark:text-gray-400">Today</span>
          </div>
        </div>
      </div>

      {/* Month Stats */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          {monthName} Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Workouts: </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {calendarData.monthStats.totalWorkouts}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Completion: </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {calendarData.monthStats.completionRate.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Longest Streak: </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {calendarData.monthStats.longestStreak}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Perfect Weeks: </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {calendarData.monthStats.perfectWeeks}
            </span>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDay && (
          <DayModal
            day={selectedDay}
            schedule={schedule}
            onClose={() => setSelectedDay(null)}
            onMarkSickDay={onMarkSickDay}
            onMarkVacationDay={onMarkVacationDay}
            onCompensateDay={onCompensateDay}
            onRecordWorkout={onRecordWorkout}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreakDisplay;