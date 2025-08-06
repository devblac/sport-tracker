import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Plus, Folder, MoreHorizontal, Grid, List, Archive, Eye, EyeOff } from 'lucide-react';
import { TemplateSelector } from '@/components/workouts/TemplateSelector';
import { TemplateDetail } from '@/components/workouts/TemplateDetail';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { useWorkout } from '@/contexts/WorkoutContext';
import { WorkoutService } from '@/services/WorkoutService';
import type { WorkoutTemplate, Workout } from '@/schemas/workout';

export const WorkoutTemplates: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showArchived, setShowArchived] = useState(false);
  const [hideExamples, setHideExamples] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
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
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className={`p-2 transition-colors ${showSearch ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                >
                  <Search className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setShowPremiumModal(true)}
                  className="p-2 text-yellow-500 hover:text-yellow-600 transition-colors"
                >
                  <Star className="w-6 h-6" fill="currentColor" />
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            {showSearch && (
              <div className="px-4 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>
            )}
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
                <button 
                  onClick={() => navigate('/workout-templates/create')}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
                  title="Create new template"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button 
                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors"
                  title="Organize templates"
                >
                  <Folder className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button 
                    className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    onClick={() => {
                      // Toggle dropdown menu
                      const dropdown = document.getElementById('template-options-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div 
                    id="template-options-dropdown"
                    className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20"
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowArchived(!showArchived);
                          document.getElementById('template-options-dropdown')?.classList.add('hidden');
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {showArchived ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showArchived ? 'Hide archived' : 'Show archived'}
                      </button>
                      <button
                        onClick={() => {
                          setHideExamples(!hideExamples);
                          document.getElementById('template-options-dropdown')?.classList.add('hidden');
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {hideExamples ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {hideExamples ? 'Show examples' : 'Hide examples'}
                      </button>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={() => {
                          setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                          document.getElementById('template-options-dropdown')?.classList.add('hidden');
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                        Show {viewMode === 'grid' ? 'list' : 'grid'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Templates List */}
            <TemplateSelector
              onSelectTemplate={handleSelectTemplate}
              onCreateWorkout={handleCreateWorkout}
              userId={userId}
              className="space-y-3"
              searchQuery={searchQuery}
              viewMode={viewMode}
              showArchived={showArchived}
              hideExamples={hideExamples}
            />
          </div>
        </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" fill="currentColor" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Upgrade to Premium
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Unlock advanced features, cloud sync, and exclusive content
              </p>
              
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Cloud backup & sync</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Advanced analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Premium templates</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Priority support</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowPremiumModal(false);
                    navigate('/marketplace-demo'); // Navigate to marketplace for now
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition-colors font-medium"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};