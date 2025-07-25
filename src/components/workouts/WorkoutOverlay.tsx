import React, { useState } from 'react';
import { useWorkout } from '@/contexts/WorkoutContext';
import { WorkoutPlayerView } from './WorkoutPlayerView';

export const WorkoutOverlay: React.FC = () => {
  const { activeWorkout, isWorkoutMinimized, maximizeWorkout, minimizeWorkout, elapsedTime } = useWorkout();
  const [isDragging, setIsDragging] = useState(false);

  if (!activeWorkout) return null;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isWorkoutMinimized) {
    return (
      <div className="fixed bottom-16 left-0 right-0 z-40 max-w-md mx-auto">
        <div
          className="bg-blue-600 text-white mx-4 rounded-t-lg shadow-lg cursor-pointer"
          onClick={maximizeWorkout}
        >
          <div className="flex items-center justify-between p-3">
            <div className="flex-1">
              <div className="font-medium text-sm truncate">
                {activeWorkout.name}
              </div>
              <div className="text-xs text-blue-100">
                {formatDuration(elapsedTime)} • Tap to continue
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-1 bg-blue-700">
            <div 
              className="h-1 bg-green-400 transition-all duration-300"
              style={{ 
                width: `${Math.min(100, (elapsedTime / 3600) * 100)}%` // Assume 1 hour max for demo
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Drag handle */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
        <div 
          className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer"
          onClick={minimizeWorkout}
        />
      </div>
      
      {/* Workout Player */}
      <WorkoutPlayerView />
    </div>
  );
};