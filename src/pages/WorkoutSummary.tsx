import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { calculateWorkoutVolume, calculateTotalReps, formatDuration } from '@/utils/workoutCalculations';
import type { Workout } from '@/schemas/workout';

export const WorkoutSummary: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const workout = location.state?.workout as Workout;

  if (!workout) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            No workout data found
          </h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const totalVolume = calculateWorkoutVolume(workout);
  const totalReps = calculateTotalReps(workout);
  const duration = workout.total_duration || 0;
  const completedSets = workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter(set => set.completed).length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 min-h-screen">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h1 className="text-2xl font-bold mb-2">Workout Complete!</h1>
          <p className="text-green-100">Great job finishing your workout</p>
        </div>

        {/* Workout Summary */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {workout.name}
          </h2>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatDuration(duration)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalVolume.toLocaleString()}kg
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Volume</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {completedSets}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Sets Completed</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalReps}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Reps</div>
            </div>
          </div>

          {/* Exercise Breakdown */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Exercise Summary
            </h3>
            <div className="space-y-3">
              {workout.exercises.map((exercise, index) => {
                const completedSets = exercise.sets.filter(set => set.completed);
                const exerciseVolume = completedSets.reduce(
                  (total, set) => total + (set.weight * set.reps),
                  0
                );

                return (
                  <div key={exercise.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {exercise.exercise_id}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {completedSets.length} sets completed
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {exerciseVolume}kg
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        volume
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/workout-templates')}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Start Another Workout
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};