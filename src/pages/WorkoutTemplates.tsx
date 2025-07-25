import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TemplateSelector } from '@/components/workouts/TemplateSelector';
import { TemplateDetail } from '@/components/workouts/TemplateDetail';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { useWorkout } from '@/contexts/WorkoutContext';
import { WorkoutService } from '@/services/WorkoutService';
import type { WorkoutTemplate, Workout } from '@/schemas/workout';

export const WorkoutTemplates: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const { createWorkoutFromTemplate } = useWorkoutTemplates();
  const { startWorkout } = useWorkout();
  const navigate = useNavigate();
  const workoutService = WorkoutService.getInstance();

  // Mock user ID - in real app this would come from auth context
  const userId = 'user-123';

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCreateWorkout = async (templateId: string) => {
    try {
      const workout = await createWorkoutFromTemplate(templateId, userId);
      if (workout) {
        // Save the workout to database
        await workoutService.saveWorkout(workout);
        
        // Start the workout using the global context
        startWorkout(workout);
      } else {
        alert('Failed to create workout from template');
      }
    } catch (error) {
      console.error('Error creating workout:', error);
      alert('Error creating workout from template');
    }
  };

  const handleStartWorkoutFromDetail = async () => {
    if (selectedTemplate) {
      await handleCreateWorkout(selectedTemplate.id);
      setSelectedTemplate(null);
    }
  };

  const handleCloseDetail = () => {
    setSelectedTemplate(null);
  };

  const handleStartEmptyWorkout = async () => {
    try {
      // Create an empty workout
      const emptyWorkout: Workout = {
        id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        name: 'Empty Workout',
        status: 'planned',
        exercises: [],
        is_template: false,
        auto_rest_timer: true,
        default_rest_time: 90,
        is_public: false,
        created_at: new Date(),
      };

      // Save the workout to database
      await workoutService.saveWorkout(emptyWorkout);
      
      // Start the workout using the global context
      startWorkout(emptyWorkout);
    } catch (error) {
      console.error('Error creating empty workout:', error);
      alert('Error creating empty workout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {selectedTemplate ? (
        /* Template Detail View - Similar to STRONG's template preview */
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 min-h-screen">
          <TemplateDetail
            template={selectedTemplate}
            onStartWorkout={handleStartWorkoutFromDetail}
            onClose={handleCloseDetail}
          />
        </div>
      ) : (
        /* Main Templates View - Similar to STRONG's templates list */
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 min-h-screen">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Workout
              </h1>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 dark:text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button className="p-2 text-yellow-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Start Section */}
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Quick start
            </h2>
            <button 
              onClick={handleStartEmptyWorkout}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              START AN EMPTY WORKOUT
            </button>
          </div>

          {/* Templates Section */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Templates
              </h2>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button className="p-1 text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button className="p-1 text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Templates List */}
            <TemplateSelector
              onSelectTemplate={handleSelectTemplate}
              onCreateWorkout={handleCreateWorkout}
              userId={userId}
              className="space-y-3"
            />
          </div>
        </div>
      )}
    </div>
  );
};