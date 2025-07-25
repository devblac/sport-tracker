import React, { useState, useMemo } from 'react';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { useExercises } from '@/hooks/useExercises';
import type { WorkoutTemplate } from '@/schemas/workout';

interface TemplateSelectorProps {
  onSelectTemplate: (template: WorkoutTemplate) => void;
  onCreateWorkout: (templateId: string) => void;
  userId: string;
  className?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onCreateWorkout,
  userId,
  className = '',
}) => {
  const { templates, loading, error } = useWorkoutTemplates();
  const { getExerciseByIdSync } = useExercises();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;
    return templates.filter(template => 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templates, searchQuery]);

  const formatLastUsed = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getExercisePreview = (template: WorkoutTemplate) => {
    return template.exercises.slice(0, 4).map(exercise => {
      const exerciseData = getExerciseByIdSync(exercise.exercise_id);
      const workingSets = exercise.sets.filter(set => set.type !== 'warmup');
      const setCount = workingSets.length;
      const exerciseName = exerciseData?.name || exercise.exercise_id;
      
      // Extract equipment type from exercise name or data
      let equipment = '';
      if (exerciseName.toLowerCase().includes('barbell')) equipment = '(Barbell)';
      else if (exerciseName.toLowerCase().includes('dumbbell')) equipment = '(Dumbbell)';
      else if (exerciseName.toLowerCase().includes('machine')) equipment = '(Machine)';
      
      return `${setCount} × ${exerciseName} ${equipment}`.trim();
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <p className="text-red-600 dark:text-red-400 text-sm">Error loading templates: {error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search Bar - Only show if there are many templates */}
      {templates.length > 3 && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}

      {/* Templates Count */}
      <div className="mb-3">
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
          My Templates ({filteredTemplates.length})
        </h3>
      </div>

      {/* Templates List */}
      <div className="space-y-3">
        {filteredTemplates.map(template => {
          const exercisePreview = getExercisePreview(template);
          const lastUsed = formatLastUsed(template.last_used);
          
          return (
            <div
              key={template.id}
              className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => onSelectTemplate(template)}
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">
                    {template.name}
                  </h4>
                  {template.category && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {template.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </button>
              </div>

              {/* Exercise Preview */}
              <div className="space-y-1 mb-3">
                {exercisePreview.map((exerciseText, index) => (
                  <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    {exerciseText}
                  </div>
                ))}
                {template.exercises.length > 4 && (
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    +{template.exercises.length - 4} more exercises
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{lastUsed || 'Never used'}</span>
                </div>
                
                {template.estimated_duration && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ~{template.estimated_duration} min
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            No templates found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? 'Try adjusting your search.' : 'Create your first template to get started.'}
          </p>
        </div>
      )}
    </div>
  );
};