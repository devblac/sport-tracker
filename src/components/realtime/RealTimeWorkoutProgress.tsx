/**
 * World-Class Real-Time Workout Progress Tracker
 * Live progress updates with smooth animations
 * Built for maximum motivation and engagement
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, Square, Timer, Flame, Heart, Target, TrendingUp } from 'lucide-react';
import { useRealTimeWorkoutProgress } from '@/hooks/useRealTime';
import { cn } from '@/utils';

interface WorkoutProgressData {
  workoutId: string;
  currentExercise: number;
  currentSet: number;
  totalSets: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  caloriesBurned: number;
  heartRate?: number;
  exerciseName?: string;
  isResting?: boolean;
  restTimeRemaining?: number;
}

interface RealTimeWorkoutProgressProps {
  workoutId: string;
  className?: string;
  showHeartRate?: boolean;
  showCalories?: boolean;
  showEstimatedTime?: boolean;
  animationDuration?: number;
}

export const RealTimeWorkoutProgress: React.FC<RealTimeWorkoutProgressProps> = ({
  workoutId,
  className = '',
  showHeartRate = true,
  showCalories = true,
  showEstimatedTime = true,
  animationDuration = 300
}) => {
  const [isActive, setIsActive] = useState(false);
  const [previousProgress, setPreviousProgress] = useState<WorkoutProgressData | null>(null);

  // Real-time workout progress data
  const { data, isConnected, emit } = useRealTimeWorkoutProgress(workoutId, {
    throttle: 500, // Update twice per second
    onlyWhenVisible: true
  });

  // Calculate progress percentages
  const progressMetrics = useMemo(() => {
    if (!data) return null;

    const setProgress = data.totalSets > 0 ? (data.currentSet / data.totalSets) * 100 : 0;
    const timeProgress = data.estimatedTimeRemaining > 0 
      ? (data.elapsedTime / (data.elapsedTime + data.estimatedTimeRemaining)) * 100 
      : 0;

    return {
      setProgress: Math.min(setProgress, 100),
      timeProgress: Math.min(timeProgress, 100),
      isProgressing: previousProgress 
        ? data.currentSet > previousProgress.currentSet || data.elapsedTime > previousProgress.elapsedTime
        : false
    };
  }, [data, previousProgress]);

  // Update previous progress for comparison
  useEffect(() => {
    if (data) {
      setPreviousProgress(data);
    }
  }, [data]);

  // Simulate real-time workout data for demo
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const mockData: WorkoutProgressData = {
        workoutId,
        currentExercise: Math.floor(Math.random() * 8) + 1,
        currentSet: Math.floor(Math.random() * 12) + 1,
        totalSets: 15,
        elapsedTime: Date.now() - (Date.now() % 3600000), // Elapsed time in ms
        estimatedTimeRemaining: Math.floor(Math.random() * 1800000) + 600000, // 10-40 minutes
        caloriesBurned: Math.floor(Math.random() * 200) + 100,
        heartRate: Math.floor(Math.random() * 40) + 120,
        exerciseName: ['Push-ups', 'Squats', 'Burpees', 'Plank', 'Lunges'][Math.floor(Math.random() * 5)],
        isResting: Math.random() > 0.7,
        restTimeRemaining: Math.random() > 0.7 ? Math.floor(Math.random() * 60) + 30 : undefined
      };

      emit(mockData, { priority: 'medium', broadcast: true });
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive, workoutId, emit]);

  // Format time display
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format calories display
  const formatCalories = (calories: number) => {
    return calories.toLocaleString();
  };

  // Get heart rate zone color
  const getHeartRateColor = (heartRate?: number) => {
    if (!heartRate) return 'text-gray-400';
    if (heartRate < 100) return 'text-blue-500';
    if (heartRate < 140) return 'text-green-500';
    if (heartRate < 170) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Toggle workout active state
  const toggleWorkout = () => {
    setIsActive(!isActive);
  };

  if (!data && !isActive) {
    return (
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
        className
      )}>
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Start Your Workout
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Begin tracking your progress in real-time
          </p>
          <button
            onClick={toggleWorkout}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Start Workout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              'w-3 h-3 rounded-full',
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            )} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Live Workout Progress
            </h3>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleWorkout}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isActive 
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40'
                  : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40'
              )}
            >
              {isActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Content */}
      {data && (
        <div className="p-6 space-y-6">
          {/* Current Exercise */}
          <div className="text-center">
            <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {data.exerciseName || `Exercise ${data.currentExercise}`}
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              Set {data.currentSet} of {data.totalSets}
            </p>
            
            {data.isResting && data.restTimeRemaining && (
              <div className="mt-2 inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">
                <Pause className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Rest: {data.restTimeRemaining}s
                </span>
              </div>
            )}
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            {/* Set Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Set Progress
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(progressMetrics?.setProgress || 0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={cn(
                    'h-3 rounded-full transition-all ease-out bg-gradient-to-r from-blue-500 to-purple-500',
                    progressMetrics?.isProgressing && 'animate-pulse'
                  )}
                  style={{
                    width: `${progressMetrics?.setProgress || 0}%`,
                    transitionDuration: `${animationDuration}ms`
                  }}
                />
              </div>
            </div>

            {/* Time Progress */}
            {showEstimatedTime && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Time Progress
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.round(progressMetrics?.timeProgress || 0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all ease-out bg-gradient-to-r from-green-500 to-teal-500"
                    style={{
                      width: `${progressMetrics?.timeProgress || 0}%`,
                      transitionDuration: `${animationDuration}ms`
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Elapsed Time */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center">
              <Timer className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatTime(data.elapsedTime)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Elapsed</p>
            </div>

            {/* Calories Burned */}
            {showCalories && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center">
                <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCalories(data.caloriesBurned)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Calories</p>
              </div>
            )}

            {/* Heart Rate */}
            {showHeartRate && data.heartRate && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center">
                <Heart className={cn('w-6 h-6 mx-auto mb-2', getHeartRateColor(data.heartRate))} />
                <p className={cn('text-2xl font-bold', getHeartRateColor(data.heartRate))}>
                  {data.heartRate}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">BPM</p>
              </div>
            )}

            {/* Estimated Time Remaining */}
            {showEstimatedTime && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-center">
                <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatTime(data.estimatedTimeRemaining)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Real-time tracking {isConnected ? 'active' : 'disconnected'}
          </span>
          <span>
            Workout ID: {workoutId.slice(-8)}
          </span>
        </div>
      </div>
    </div>
  );
};