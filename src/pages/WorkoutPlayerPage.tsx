import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkoutPlayer } from '@/components/workouts/WorkoutPlayer';
import { WorkoutService } from '@/services/WorkoutService';
import type { Workout } from '@/schemas/workout';

export const WorkoutPlayerPage: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workoutService = WorkoutService.getInstance();

  useEffect(() => {
    const loadWorkout = async () => {
      if (!workoutId) {
        setError('No workout ID provided');
        setLoading(false);
        return;
      }

      try {
        const loadedWorkout = await workoutService.getWorkoutById(workoutId);
        if (loadedWorkout) {
          setWorkout(loadedWorkout);
        } else {
          setError('Workout not found');
        }
      } catch (err) {
        setError('Failed to load workout');
        console.error('Error loading workout:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkout();
  }, [workoutId, workoutService]);

  const handleWorkoutComplete = async (completedWorkout: Workout) => {
    try {
      // Save the completed workout
      await workoutService.saveWorkout(completedWorkout);
      
      // Navigate to workout summary or home
      navigate('/workout-summary', { 
        state: { workout: completedWorkout },
        replace: true 
      });
    } catch (error) {
      console.error('Error saving completed workout:', error);
      // Still navigate away but show error
      alert('Workout completed but failed to save. Please try again.');
      navigate('/', { replace: true });
    }
  };

  const handleWorkoutExit = async () => {
    if (workout) {
      try {
        // Save workout as paused
        const pausedWorkout: Workout = {
          ...workout,
          status: 'paused',
          paused_at: new Date(),
        };
        await workoutService.saveWorkout(pausedWorkout);
      } catch (error) {
        console.error('Error saving paused workout:', error);
      }
    }
    
    // Navigate back to templates or home
    navigate('/workout', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Loading Workout...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Preparing your training session
          </p>
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Workout Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The workout you\'re looking for could not be found.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/workout')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Browse Templates
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-md transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WorkoutPlayer
      workout={workout}
      onWorkoutComplete={handleWorkoutComplete}
      onWorkoutExit={handleWorkoutExit}
    />
  );
};