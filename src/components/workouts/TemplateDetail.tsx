import React from 'react';
import type { WorkoutTemplate } from '@/schemas/workout';
import { useExercises } from '@/hooks/useExercises';

interface TemplateDetailProps {
  template: WorkoutTemplate;
  onStartWorkout: () => void;
  onClose: () => void;
  className?: string;
}

export const TemplateDetail: React.FC<TemplateDetailProps> = ({
  template,
  onStartWorkout,
  onClose,
  className = '',
}) => {
  const { getExerciseByIdSync } = useExercises();

  const formatLastUsed = (date?: Date) => {
    if (!date) return 'Never used';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    return 'Last performed: ' + diffDays + ' days ago';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 min-h-screen ${className}`}>
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button className="p-2 text-gray-600 dark:text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {template.name}
        </h1>
        
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {formatLastUsed(template.last_used)}
        </p>

        {/* Exercise List */}
        <div className="space-y-4 mb-8">
          {template.exercises.map((exercise, index) => {
            const exerciseData = getExerciseByIdSync(exercise.exercise_id);
            const workingSets = exercise.sets.filter(set => set.type !== 'warmup');
            const setCount = workingSets.length;
            
            // Get exercise name and equipment type
            const exerciseName = exerciseData?.name || exercise.exercise_id;
            let equipment = '';
            if (exerciseName.toLowerCase().includes('barbell')) equipment = '(Barbell)';
            else if (exerciseName.toLowerCase().includes('dumbbell')) equipment = '(Dumbbell)';
            else if (exerciseName.toLowerCase().includes('machine')) equipment = '(Machine)';
            
            // Get muscle group
            const muscleGroup = exerciseData?.muscle_groups?.[0] || 
                              exerciseData?.body_parts?.[0] || 
                              'Unknown';

            return (
              <div key={exercise.id} className="flex items-center space-x-4">
                {/* Exercise Icon */}
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>

                {/* Exercise Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {setCount} ×
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {exerciseName} {equipment}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {muscleGroup}
                  </p>
                </div>

                {/* Info Button */}
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Workout Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-50">
        <button
          onClick={onStartWorkout}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          START WORKOUT
        </button>
      </div>

      {/* Bottom padding to account for fixed button */}
      <div className="h-20"></div>
    </div>
  );
};