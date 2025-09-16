/**
 * TemplateCreationFlow Component - Guided template creation with exercise addition
 * Takes users through: Name -> Add Exercises -> Save Template
 */

import React, { useState } from 'react';
import type { WorkoutTemplate, WorkoutExercise } from '@/schemas/workout';
import { useExercises } from '@/hooks/useExercises';
import { ExerciseSelector } from './ExerciseSelector';
import { Button } from '@/components/ui';
import { Plus, X, Check, ArrowLeft, ArrowRight } from 'lucide-react';

interface TemplateCreationFlowProps {
  onComplete: (template: WorkoutTemplate) => Promise<void>;
  onCancel: () => void;
  userId: string;
}

interface CreationStep {
  step: 'name' | 'exercises' | 'review';
}

export const TemplateCreationFlow: React.FC<TemplateCreationFlowProps> = ({
  onComplete,
  onCancel,
  userId
}) => {
  const [currentStep, setCurrentStep] = useState<CreationStep['step']>('name');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  const { getExerciseByIdSync } = useExercises();

  const canProceedFromName = templateName.trim().length > 0;
  const canProceedFromExercises = exercises.length >= 2;
  const canComplete = canProceedFromName && canProceedFromExercises;

  const handleAddExercise = (exerciseId: string) => {
    const exerciseData = getExerciseByIdSync(exerciseId);
    if (!exerciseData) return;

    const newExercise: WorkoutExercise = {
      id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exercise_id: exerciseId,
      order_index: exercises.length,
      sets: [
        {
          id: `set-${Date.now()}-1`,
          set_number: 1,
          type: 'working',
          weight: 0,
          reps: 10,
          planned_rest_time: 90
        },
        {
          id: `set-${Date.now()}-2`,
          set_number: 2,
          type: 'working',
          weight: 0,
          reps: 10,
          planned_rest_time: 90
        },
        {
          id: `set-${Date.now()}-3`,
          set_number: 3,
          type: 'working',
          weight: 0,
          reps: 10,
          planned_rest_time: 90
        }
      ],
      notes: '',
      target_reps: 10,
      target_weight: 0
    };

    setExercises(prev => [...prev, newExercise]);
    setShowExerciseSelector(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const handleComplete = async () => {
    if (!canComplete) return;

    setIsLoading(true);
    try {
      const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const template: WorkoutTemplate = {
        id: templateId,
        user_id: userId,
        name: templateName.trim(),
        description: templateDescription.trim() || `Custom template: ${templateName.trim()}`,
        is_template: true,
        status: 'planned',
        exercises,
        auto_rest_timer: true,
        default_rest_time: 90,
        is_public: false,
        created_at: new Date(),
        updated_at: new Date(),
        category: 'custom',
        difficulty_level: 2,
        estimated_duration: exercises.length * 15, // Rough estimate: 15 min per exercise
        equipment_needed: [],
        times_used: 0,
        created_by: userId,
        is_public_template: false,
        is_archived: false,
        archived_at: undefined,
        tags: ['custom', 'personal']
      };

      await onComplete(template);
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentStep === 'name' ? 'bg-primary text-primary-foreground' : 
          ['exercises', 'review'].includes(currentStep) ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
        }`}>
          {['exercises', 'review'].includes(currentStep) ? <Check className="w-4 h-4" /> : '1'}
        </div>
        <div className={`w-12 h-1 ${
          ['exercises', 'review'].includes(currentStep) ? 'bg-green-500' : 'bg-gray-300'
        }`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentStep === 'exercises' ? 'bg-primary text-primary-foreground' : 
          currentStep === 'review' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
        }`}>
          {currentStep === 'review' ? <Check className="w-4 h-4" /> : '2'}
        </div>
        <div className={`w-12 h-1 ${
          currentStep === 'review' ? 'bg-green-500' : 'bg-gray-300'
        }`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          currentStep === 'review' ? 'bg-primary text-primary-foreground' : 'bg-gray-300 text-gray-600'
        }`}>
          3
        </div>
      </div>
    </div>
  );

  const renderNameStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Name Your Template
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Give your workout template a memorable name
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Template Name *
          </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Upper Body Strength, Push Day, Full Body"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (optional)
          </label>
          <textarea
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            placeholder="Describe your workout template..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );

  const renderExercisesStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Add Exercises
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Add at least 2 exercises to your template
        </p>
      </div>

      <div className="space-y-4">
        {exercises.map((exercise, index) => {
          const exerciseData = getExerciseByIdSync(exercise.exercise_id);
          return (
            <div key={exercise.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {exerciseData?.name || exercise.exercise_id}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {exercise.sets.length} sets
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveExercise(exercise.id)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        <button
          onClick={() => setShowExerciseSelector(true)}
          className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary"
        >
          <Plus className="w-5 h-5" />
          <span>Add Exercise</span>
        </button>

        {exercises.length > 0 && exercises.length < 2 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
            Add at least {2 - exercises.length} more exercise{2 - exercises.length !== 1 ? 's' : ''} to continue
          </p>
        )}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Review & Save
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Review your template before saving
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {templateName}
          </h3>
          {templateDescription && (
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {templateDescription}
            </p>
          )}
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Exercises ({exercises.length})
          </h4>
          <div className="space-y-2">
            {exercises.map((exercise, index) => {
              const exerciseData = getExerciseByIdSync(exercise.exercise_id);
              return (
                <div key={exercise.id} className="flex items-center space-x-3 text-sm">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {exerciseData?.name || exercise.exercise_id}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    ({exercise.sets.length} sets)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Template
            </h1>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 'name' && renderNameStep()}
            {currentStep === 'exercises' && renderExercisesStep()}
            {currentStep === 'review' && renderReviewStep()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              {currentStep !== 'name' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === 'exercises') setCurrentStep('name');
                    if (currentStep === 'review') setCurrentStep('exercises');
                  }}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>

              {currentStep === 'name' && (
                <Button
                  variant="primary"
                  onClick={() => setCurrentStep('exercises')}
                  disabled={!canProceedFromName}
                  className="flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}

              {currentStep === 'exercises' && (
                <Button
                  variant="primary"
                  onClick={() => setCurrentStep('review')}
                  disabled={!canProceedFromExercises}
                  className="flex items-center space-x-2"
                >
                  <span>Review</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}

              {currentStep === 'review' && (
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  disabled={!canComplete || isLoading}
                  className="flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create Template</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <ExerciseSelector
              onSelectExercise={handleAddExercise}
              onClose={() => setShowExerciseSelector(false)}
              selectedExercises={exercises.map(e => e.exercise_id)}
            />
          </div>
        </div>
      )}
    </div>
  );
};