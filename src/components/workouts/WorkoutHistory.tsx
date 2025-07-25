import React, { useState, useEffect } from 'react';
import { WorkoutService } from '@/services/WorkoutService';
import { useExercises } from '@/hooks/useExercises';
import { calculateWorkoutVolume, calculateTotalReps, formatDuration } from '@/utils/workoutCalculations';
import type { Workout } from '@/schemas/workout';

interface WorkoutHistoryProps {
  userId: string;
  limit?: number;
  className?: string;
}

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({
  userId,
  limit = 10,
  className = '',
}) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getExerciseByIdSync } = useExercises();

  const workoutService = WorkoutService.getInstance();

  useEffect(() => {
    const loadWorkoutHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const recentWorkouts = await workoutService.getRecentWorkouts(userId, limit);
        // Filter only completed workouts
        const completedWorkouts = recentWorkouts.filter(w => w.status === 'completed');
        setWorkouts(completedWorkouts);
      } catch (err) {
        setError('Failed to load workout history');
        console.error('Error loading workout history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkoutHistory();
  }, [userId, limit, workoutService]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getWorkoutPreview = (workout: Workout) => {
    return workout.exercises.slice(0, 3).map(exercise => {
      const exerciseData = getExerciseByIdSync(exercise.exercise_id);
      const completedSets = exercise.sets.filter(set => set.completed);
      return `${completedSets.length} × ${exerciseData?.name || exercise.exercise_id}`;
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">Loading history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
          No workout history
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Complete your first workout to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {workouts.map(workout => {
        const volume = calculateWorkoutVolume(workout);
        const totalReps = calculateTotalReps(workout);
        const duration = workout.total_duration || 0;
        const exercisePreview = getWorkoutPreview(workout);
        
        return (
          <div
            key={workout.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* Workout Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {workout.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(workout.completed_at || workout.created_at)}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatDuration(duration)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {volume.toLocaleString()}kg
                </div>
              </div>
            </div>

            {/* Exercise Preview */}
            <div className="space-y-1 mb-3">
              {exercisePreview.map((exerciseText, index) => (
                <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  {exerciseText}
                </div>
              ))}
              {workout.exercises.length > 3 && (
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  +{workout.exercises.length - 3} more exercises
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>{workout.exercises.length} exercises</span>
                <span>{totalReps} reps</span>
                <span>{volume.toLocaleString()}kg volume</span>
              </div>
              
              {workout.template_name && (
                <span className="text-blue-600 dark:text-blue-400">
                  From: {workout.template_name}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};