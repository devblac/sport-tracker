import React from 'react';
import { Link } from 'react-router-dom';
import { useWorkout } from '@/contexts/WorkoutContext';

export const WorkoutSystemTest: React.FC = () => {
  const { activeWorkout, elapsedTime, isWorkoutMinimized } = useWorkout();

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 min-h-screen p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          STRONG-Style Workout System
        </h1>

        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
              ✅ New Features Implemented
            </h3>
            <ul className="text-green-700 dark:text-green-400 text-sm space-y-1">
              <li>• Global workout state management</li>
              <li>• Minimizable workout overlay (like STRONG)</li>
              <li>• Persistent workout across navigation</li>
              <li>• STRONG-style table interface</li>
              <li>• SET | PREVIOUS | KG | REPS | ✓ columns</li>
              <li>• Green completion highlighting</li>
              <li>• Slide-up/down workout interface</li>
              <li>• Timer above bottom navigation</li>
            </ul>
          </div>

          {/* Current Workout Status */}
          {activeWorkout ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                🏋️ Active Workout
              </h3>
              <div className="text-blue-700 dark:text-blue-400 text-sm space-y-1">
                <p><strong>Name:</strong> {activeWorkout.name}</p>
                <p><strong>Duration:</strong> {formatDuration(elapsedTime)}</p>
                <p><strong>Status:</strong> {isWorkoutMinimized ? 'Minimized' : 'Active'}</p>
                <p><strong>Exercises:</strong> {activeWorkout.exercises.length}</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Active Workout
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Start a workout to see the new STRONG-style interface
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Test the New System:
            </h3>
            
            <Link
              to="/workout-templates"
              className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium rounded-lg transition-colors"
            >
              Start a Workout
            </Link>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                How to Test:
              </h4>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>1. Start any workout from templates</li>
                <li>2. Notice the STRONG-style table interface</li>
                <li>3. Tap the minimize button (down arrow)</li>
                <li>4. Navigate to other pages - workout persists</li>
                <li>5. See the workout timer above bottom nav</li>
                <li>6. Tap the timer bar to maximize workout</li>
                <li>7. Complete sets by checking the ✓ column</li>
                <li>8. Notice green highlighting for completed sets</li>
              </ol>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                📱 STRONG-Inspired Features
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                The new system exactly matches STRONG's UX: persistent workouts, 
                minimizable overlay, table-style set logging, and seamless navigation 
                while maintaining workout state.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/"
                className="px-4 py-2 text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors"
              >
                Test Navigation
              </Link>
              
              <Link
                to="/exercises"
                className="px-4 py-2 text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors"
              >
                Browse Exercises
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};