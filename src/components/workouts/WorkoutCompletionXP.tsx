/**
 * Workout Completion XP Component
 * 
 * Handles XP integration when a workout is completed, including
 * XP calculation, award processing, and user feedback.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Trophy, 
  Target, 
  Flame, 
  Star,
  TrendingUp,
  Award,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useXPIntegration } from '../gamification/withXPIntegration';
import { XPProgressBar } from '../gamification/XPProgressBar';
import { LevelBadge } from '../gamification/LevelBadge';
import type { Workout } from '@/types/workout';
import type { PersonalRecord } from '@/types/analytics';
import type { XPAwardResult } from '@/types/gamification';

interface WorkoutCompletionXPProps {
  workout: Workout;
  personalRecords?: PersonalRecord[];
  isFirstWorkout?: boolean;
  weeklyWorkoutCount?: number;
  monthlyWorkoutCount?: number;
  onXPProcessed?: (result: WorkoutXPResult) => void;
  className?: string;
}

interface WorkoutXPResult {
  totalXP: number;
  awards: XPAwardResult[];
  levelUps: number;
  achievements: string[];
}

interface XPBreakdown {
  source: string;
  amount: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const WorkoutCompletionXP: React.FC<WorkoutCompletionXPProps> = ({
  workout,
  personalRecords = [],
  isFirstWorkout = false,
  weeklyWorkoutCount = 0,
  monthlyWorkoutCount = 0,
  onXPProcessed,
  className
}) => {
  const xpIntegration = useXPIntegration();
  const [isProcessing, setIsProcessing] = useState(false);
  const [xpResult, setXPResult] = useState<WorkoutXPResult | null>(null);
  const [xpBreakdown, setXPBreakdown] = useState<XPBreakdown[]>([]);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Calculate total workout volume
  const totalVolume = workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((setTotal, set) => {
      return setTotal + (set.actualWeight || 0) * (set.actualReps || 0);
    }, 0);
  }, 0);

  // Check for perfect form (no failure sets)
  const perfectForm = workout.exercises.every(exercise =>
    exercise.sets.every(set => set.type !== 'failure')
  );

  // Process XP when component mounts
  useEffect(() => {
    const processXP = async () => {
      if (isProcessing || xpResult) return;

      setIsProcessing(true);

      try {
        const context = {
          personalRecords,
          isFirstWorkout,
          weeklyWorkoutCount,
          monthlyWorkoutCount,
          totalVolume,
          perfectForm
        };

        const result = await xpIntegration.processWorkoutCompletion(workout, context);
        setXPResult(result);
        
        // Generate XP breakdown
        const breakdown = generateXPBreakdown(workout, context, result);
        setXPBreakdown(breakdown);

        onXPProcessed?.(result);
      } catch (error) {
        console.error('Error processing workout XP:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    processXP();
  }, [workout, personalRecords, isFirstWorkout, weeklyWorkoutCount, monthlyWorkoutCount]);

  // Generate XP breakdown for display
  const generateXPBreakdown = (
    workout: Workout,
    context: any,
    result: WorkoutXPResult
  ): XPBreakdown[] => {
    const breakdown: XPBreakdown[] = [];

    // Base workout XP
    breakdown.push({
      source: 'workout_completion',
      amount: Math.floor(result.totalXP * 0.6), // Approximate base amount
      description: 'Workout completion',
      icon: <Target className="w-4 h-4" />,
      color: 'text-blue-500'
    });

    // Duration bonus
    if (workout.duration && workout.duration > 1800) { // > 30 minutes
      breakdown.push({
        source: 'duration_bonus',
        amount: Math.min(Math.floor(workout.duration / 60), 60),
        description: 'Duration bonus',
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-green-500'
      });
    }

    // Volume bonus
    if (context.totalVolume > 1000) {
      breakdown.push({
        source: 'volume_bonus',
        amount: Math.floor(context.totalVolume / 100),
        description: 'Volume lifted',
        icon: <Trophy className="w-4 h-4" />,
        color: 'text-purple-500'
      });
    }

    // Personal records
    if (context.personalRecords?.length > 0) {
      breakdown.push({
        source: 'personal_records',
        amount: context.personalRecords.length * 50,
        description: `${context.personalRecords.length} personal record${context.personalRecords.length > 1 ? 's' : ''}`,
        icon: <Star className="w-4 h-4" />,
        color: 'text-yellow-500'
      });
    }

    // Perfect form bonus
    if (context.perfectForm) {
      breakdown.push({
        source: 'perfect_form',
        amount: Math.floor(result.totalXP * 0.2),
        description: 'Perfect form bonus',
        icon: <CheckCircle className="w-4 h-4" />,
        color: 'text-emerald-500'
      });
    }

    // First workout bonus
    if (context.isFirstWorkout) {
      breakdown.push({
        source: 'first_workout',
        amount: 100,
        description: 'First workout bonus',
        icon: <Award className="w-4 h-4" />,
        color: 'text-orange-500'
      });
    }

    // Perfect week bonus
    if (context.weeklyWorkoutCount >= 3) {
      breakdown.push({
        source: 'perfect_week',
        amount: 100,
        description: 'Perfect week bonus',
        icon: <Flame className="w-4 h-4" />,
        color: 'text-red-500'
      });
    }

    return breakdown;
  };

  if (isProcessing) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg', className)}>
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Processing XP rewards...</span>
        </div>
      </div>
    );
  }

  if (!xpResult) {
    return null;
  }

  return (
    <motion.div
      className={cn('bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <Zap className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              XP Rewards
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Great workout! Here's what you earned:
            </p>
          </div>
        </div>

        {/* Total XP Badge */}
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full font-bold text-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          +{xpResult.totalXP} XP
        </motion.div>
      </div>

      {/* Level Up Notification */}
      {xpResult.levelUps > 0 && (
        <motion.div
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4 mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6" />
            <div>
              <div className="font-bold">Level Up!</div>
              <div className="text-sm opacity-90">
                You've reached a new level! Check your progress page for details.
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Achievements */}
      {xpResult.achievements.length > 0 && (
        <motion.div
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center space-x-3">
            <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <div className="font-medium text-yellow-800 dark:text-yellow-200">
                Achievements Unlocked!
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                {xpResult.achievements.length} new achievement{xpResult.achievements.length > 1 ? 's' : ''} unlocked
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* XP Breakdown Toggle */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
      >
        {showBreakdown ? 'Hide' : 'Show'} XP breakdown
      </button>

      {/* XP Breakdown */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 mb-6"
          >
            {xpBreakdown.map((item, index) => (
              <motion.div
                key={item.source}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={item.color}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.description}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  +{item.amount} XP
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workout Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
        <div>
          <div className="font-bold text-gray-900 dark:text-white">
            {workout.exercises.length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Exercises</div>
        </div>
        
        <div>
          <div className="font-bold text-gray-900 dark:text-white">
            {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Sets</div>
        </div>
        
        <div>
          <div className="font-bold text-gray-900 dark:text-white">
            {Math.round((workout.duration || 0) / 60)}m
          </div>
          <div className="text-gray-600 dark:text-gray-400">Duration</div>
        </div>
        
        <div>
          <div className="font-bold text-gray-900 dark:text-white">
            {Math.round(totalVolume)}kg
          </div>
          <div className="text-gray-600 dark:text-gray-400">Volume</div>
        </div>
      </div>
    </motion.div>
  );
};

export default WorkoutCompletionXP;