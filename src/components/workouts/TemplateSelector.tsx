import React, { useState, useMemo, useEffect } from 'react';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { useExercises } from '@/hooks/useExercises';
import type { WorkoutTemplate } from '@/schemas/workout';

interface TemplateSelectorProps {
  onSelectTemplate: (template: WorkoutTemplate) => void;
  onCreateWorkout: (templateId: string) => void;
  userId: string;
  className?: string;
  searchQuery?: string;
  viewMode?: 'grid' | 'list';
  showArchived?: boolean;
  hideExamples?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onCreateWorkout,
  userId,
  className = '',
  searchQuery: externalSearchQuery = '',
  viewMode = 'list',
  showArchived = false,
  hideExamples = false,
}) => {
  const { templates, loading, error } = useWorkoutTemplates();
  const { getExerciseByIdSync } = useExercises();
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [activeContextMenu, setActiveContextMenu] = useState<string | null>(null);
  
  // Use external search query if provided, otherwise use internal
  const searchQuery = externalSearchQuery || internalSearchQuery;

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveContextMenu(null);
    };

    if (activeContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeContextMenu]);

  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply archived filter
    if (!showArchived) {
      filtered = filtered.filter(template => !template.is_archived);
    }
    
    // Apply examples filter
    if (hideExamples) {
      filtered = filtered.filter(template => !template.is_example);
    }
    
    return filtered;
  }, [templates, searchQuery, showArchived, hideExamples]);

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

  const handleTemplateAction = (action: string, template: WorkoutTemplate) => {
    setActiveContextMenu(null);
    
    switch (action) {
      case 'edit':
        // Navigate to edit template
        console.log('Edit template:', template.id);
        break;
      case 'rename':
        const newName = prompt('Enter new name:', template.name);
        if (newName && newName !== template.name) {
          console.log('Rename template:', template.id, 'to:', newName);
          // TODO: Implement rename functionality
        }
        break;
      case 'archive':
        if (confirm(`Archive template "${template.name}"?`)) {
          console.log('Archive template:', template.id);
          // TODO: Implement archive functionality
        }
        break;
      case 'duplicate':
        console.log('Duplicate template:', template.id);
        // TODO: Implement duplicate functionality
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: template.name,
            text: `Check out this workout template: ${template.name}`,
            url: window.location.href
          });
        } else {
          navigator.clipboard.writeText(window.location.href);
          alert('Template link copied to clipboard!');
        }
        break;
      case 'delete':
        if (confirm(`Delete template "${template.name}"? This action cannot be undone.`)) {
          console.log('Delete template:', template.id);
          // TODO: Implement delete functionality
        }
        break;
    }
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
      {/* Search Bar - Only show if external search is not provided and there are many templates */}
      {!externalSearchQuery && templates.length > 3 && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={internalSearchQuery}
              onChange={(e) => setInternalSearchQuery(e.target.value)}
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
      <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
        {filteredTemplates.map(template => {
          const exercisePreview = getExercisePreview(template);
          const lastUsed = formatLastUsed(template.last_used);
          
          return (
            <div
              key={template.id}
              className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
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
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveContextMenu(activeContextMenu === template.id ? null : template.id);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </button>
                  
                  {/* Context Menu */}
                  {activeContextMenu === template.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30">
                      <div className="py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateAction('edit', template);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateAction('rename', template);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateAction('archive', template);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l4 4 4-4m6 5l-3 3-3-3" />
                          </svg>
                          Archive
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateAction('duplicate', template);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Duplicate
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateAction('share', template);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                          Share
                        </button>
                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTemplateAction('delete', template);
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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