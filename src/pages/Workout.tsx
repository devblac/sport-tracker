import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Dumbbell, Search, Star, Folder, MoreHorizontal, Grid, List, Eye, EyeOff, Zap, BookOpen, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { TemplateSelector } from '@/components/workouts/TemplateSelector';
import { TemplateDetail } from '@/components/workouts/TemplateDetail';
// import { TemplateCreationFlow } from '@/components/workouts/TemplateCreationFlow'; // Temporarily disabled
import { WorkoutHistory } from '@/components/workouts/WorkoutHistory';
import { ExerciseList } from '@/components/exercises/ExerciseList';
import { useAuthStore } from '@/stores';
import { useWorkout } from '@/contexts/WorkoutContext';
import { WorkoutService } from '@/services/WorkoutService';
import type { WorkoutTemplate } from '@/schemas/workout';

export const Workout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { startWorkout } = useWorkout();
  const [activeTab, setActiveTab] = useState<'train' | 'exercises'>('train');
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showArchived, setShowArchived] = useState(false);
  const [hideExamples, setHideExamples] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showTemplateFlow, setShowTemplateFlow] = useState(false);
  const [isExerciseLibraryMaximized, setIsExerciseLibraryMaximized] = useState(false);
  
  const workoutService = WorkoutService.getInstance();

  const handleCreateEmptyWorkout = async () => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      // Create an empty workout
      const emptyWorkout = {
        id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        name: 'New Workout',
        description: 'Custom workout',
        status: 'planned' as const,
        exercises: [],
        is_template: false,
        auto_rest_timer: true,
        default_rest_time: 120,
        is_public: false,
        created_at: new Date(),
      };

      const saved = await workoutService.saveWorkout(emptyWorkout);
      if (saved) {
        // Use the context-based workout system
        startWorkout(emptyWorkout);
      }
    } catch (error) {
      console.error('Error creating empty workout:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTemplateSelect = (template: WorkoutTemplate) => {
    setSelectedTemplate(template);
  };

  const handleCreateTemplate = async (name: string, description: string) => {
    if (!user) return;
    
    try {
      // Create a simplified template with minimal required fields
      // The app auto-populates most fields to keep it simple for users
      const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newTemplate = {
        // Required fields
        id: templateId,
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || `Custom template: ${name.trim()}`, // Auto-generate if empty
        is_template: true,
        status: 'planned' as const,
        
        // Basic workout structure (empty but valid)
        exercises: [],
        auto_rest_timer: true,
        default_rest_time: 90,
        is_public: false,
        
        // Dates
        created_at: new Date(),
        updated_at: new Date(),
        
        // Template-specific fields (auto-populated with sensible defaults)
        category: 'custom',
        difficulty_level: 2, // Intermediate as default
        estimated_duration: 45, // 45 minutes default
        equipment_needed: [],
        times_used: 0,
        created_by: user.id,
        is_public_template: false,
        is_archived: false,
        archived_at: undefined,
        tags: ['custom', 'personal']
      } as WorkoutTemplate;

      console.log('Creating template:', newTemplate);
      
      const success = await workoutService.saveTemplate(newTemplate);
      
      if (success) {
        setShowCreateTemplate(false);
        // Force refresh templates
        window.dispatchEvent(new CustomEvent('templatesUpdated', { 
          detail: { templateId } 
        }));
        alert('✅ Template created successfully! You can now add exercises to it.');
      } else {
        alert('❌ Failed to create template. Please try again.');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('❌ Error creating template. Please check the console for details.');
    }
  };

  const handleCreateWorkoutFromTemplate = async (templateId: string) => {
    if (!user) return;
    
    try {
      const workout = await workoutService.createWorkoutFromTemplate(templateId, user.id);
      if (workout) {
        const saved = await workoutService.saveWorkout(workout);
        if (saved) {
          await workoutService.incrementTemplateUsage(templateId);
          // Use the context-based workout system (same as WorkoutTemplates.tsx)
          startWorkout(workout);
        }
      }
    } catch (error) {
      console.error('Error starting workout from template:', error);
    }
  };

  const handleStartWorkoutFromDetail = async () => {
    if (selectedTemplate) {
      await handleCreateWorkoutFromTemplate(selectedTemplate.id);
      setSelectedTemplate(null);
    }
  };

  const handleCloseDetail = () => {
    setSelectedTemplate(null);
  };

  return (
    <div className="space-y-6">
      {selectedTemplate ? (
        /* Template Detail View */
        <div className="max-w-md mx-auto bg-background min-h-screen">
          <TemplateDetail
            template={selectedTemplate}
            onStartWorkout={handleStartWorkoutFromDetail}
            onClose={handleCloseDetail}
          />
        </div>
      ) : (
        <>
          {/* Header - Centered with Premium Star */}
          <div className="relative">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Workouts
              </h1>
              <p className="text-muted-foreground">
                Train with templates or explore exercises
              </p>
            </div>
            {/* Premium Star - Positioned absolutely to top-right */}
            <button 
              onClick={() => setShowPremiumModal(true)}
              className="absolute top-0 right-0 p-2 text-yellow-500 hover:text-yellow-600 transition-colors"
              title="Upgrade to Premium"
            >
              <Star className="w-6 h-6" fill="currentColor" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <Button
              variant={activeTab === 'train' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('train')}
              className="flex-1"
            >
              <Zap className="w-4 h-4 mr-2" />
              Train
            </Button>
            <Button
              variant={activeTab === 'exercises' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('exercises')}
              className="flex-1"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Exercises
            </Button>
          </div>
          {/* Tab Content */}
          {activeTab === 'train' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex justify-center">
                <Button 
                  variant="primary" 
                  size="lg" 
                  fullWidth
                  onClick={handleCreateEmptyWorkout}
                  disabled={isCreating}
                  className="h-16 max-w-md"
                >
                  <span className="text-lg font-semibold">START AN EMPTY WORKOUT</span>
                </Button>
              </div>
              
              {/* Template Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-5 h-5 text-primary" />
                      Templates
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setShowTemplateFlow(true)}
                        className="p-1 text-muted-foreground hover:text-blue-500 transition-colors"
                        title="Create new template"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button 
                        className="p-1 text-muted-foreground hover:text-green-500 transition-colors"
                        title="Organize templates"
                      >
                        <Folder className="w-5 h-5" />
                      </button>
                      <div className="relative">
                        <button 
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => {
                            // Toggle dropdown menu
                            const dropdown = document.getElementById('workout-template-options-dropdown');
                            if (dropdown) {
                              dropdown.classList.toggle('hidden');
                            }
                          }}
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        <div 
                          id="workout-template-options-dropdown"
                          className="hidden absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-20"
                        >
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setShowArchived(!showArchived);
                                document.getElementById('workout-template-options-dropdown')?.classList.add('hidden');
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              {showArchived ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              {showArchived ? 'Hide archived' : 'Show archived'}
                            </button>
                            <button
                              onClick={() => {
                                setHideExamples(!hideExamples);
                                document.getElementById('workout-template-options-dropdown')?.classList.add('hidden');
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              {hideExamples ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              {hideExamples ? 'Show defaults' : 'Hide defaults'}
                            </button>
                            <hr className="my-1 border-border" />
                            <button
                              onClick={() => {
                                setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                                document.getElementById('workout-template-options-dropdown')?.classList.add('hidden');
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                              Show {viewMode === 'grid' ? 'list' : 'grid'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TemplateSelector 
                    onSelectTemplate={handleTemplateSelect}
                    onCreateWorkout={handleCreateWorkoutFromTemplate}
                    userId={user?.id || ''}
                    searchQuery={searchQuery}
                    viewMode={viewMode}
                    showArchived={showArchived}
                    hideExamples={hideExamples}
                  />
                </CardContent>
              </Card>
              
              {/* Recent Workouts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Workouts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user && (
                    <WorkoutHistory 
                      userId={user.id}
                      limit={5}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'exercises' && (
            <div className="space-y-6">
              {/* Exercise Library with Maximize/Minimize */}
              <Card className={`transition-all duration-300 ${
                isExerciseLibraryMaximized 
                  ? 'fixed inset-0 z-50 rounded-none m-0 h-screen' 
                  : 'relative'
              }`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Exercise Library
                    <span className="text-sm text-muted-foreground font-normal">
                      ({isExerciseLibraryMaximized ? 'Full Screen' : 'Compact View'})
                    </span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExerciseLibraryMaximized(!isExerciseLibraryMaximized)}
                      className="h-8 w-8 p-0"
                      title={isExerciseLibraryMaximized ? 'Minimize' : 'Maximize'}
                    >
                      {isExerciseLibraryMaximized ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </Button>
                    {isExerciseLibraryMaximized && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExerciseLibraryMaximized(false)}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className={`${
                  isExerciseLibraryMaximized 
                    ? 'h-[calc(100vh-80px)] overflow-hidden' 
                    : 'max-h-[600px] overflow-hidden'
                }`}>
                  <div className={`${
                    isExerciseLibraryMaximized 
                      ? 'h-full' 
                      : 'h-[550px]'
                  } overflow-y-auto`}>
                    <ExerciseList 
                      onExerciseSelect={(exercise) => {
                        // Navigate to exercise detail or add to workout
                        navigate(`/exercises/${exercise.id}`);
                      }}
                      showCreateButton={true}
                    />
                  </div>
                  
                  {/* Gradient fade at bottom when not maximized */}
                  {!isExerciseLibraryMaximized && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                  )}
                </CardContent>
                

              </Card>
              
              {/* Exercise Quick Stats - Only show when not maximized */}
              {!isExerciseLibraryMaximized && (
                <div className="grid grid-cols-3 gap-4">
                  <Card className="text-center p-4">
                    <div className="text-2xl font-bold text-primary">20+</div>
                    <div className="text-sm text-muted-foreground">Exercises</div>
                  </Card>
                  <Card className="text-center p-4">
                    <div className="text-2xl font-bold text-green-600">6</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </Card>
                  <Card className="text-center p-4">
                    <div className="text-2xl font-bold text-blue-600">∞</div>
                    <div className="text-sm text-muted-foreground">Custom</div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" fill="currentColor" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Upgrade to Premium
              </h2>
              <p className="text-muted-foreground mb-6">
                Unlock advanced features, cloud sync, and exclusive content
              </p>
              
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Cloud backup & sync</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Advanced analytics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Premium templates</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-foreground">Priority support</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1"
                >
                  Maybe Later
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowPremiumModal(false);
                    navigate('/marketplace-demo'); // Navigate to marketplace for now
                  }}
                  className="flex-1"
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Template Creation Flow - Temporarily disabled due to import issue */}
      {showTemplateFlow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md">
            <h2 className="text-xl font-bold mb-4">Template Creation</h2>
            <p className="mb-4">The new template creation flow is temporarily unavailable. Please use the simple creation method.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowTemplateFlow(false);
                  setShowCreateTemplate(true);
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Use Simple Creation
              </button>
              <button
                onClick={() => setShowTemplateFlow(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Create Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Create New Template
              </h3>
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              const description = formData.get('description') as string;
              
              if (name.trim()) {
                handleCreateTemplate(name.trim(), description.trim());
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Template Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="e.g., My Upper Body Workout"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Describe your workout template..."
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <div className="font-medium mb-1">📝 How it works:</div>
                    <ul className="text-xs space-y-1 ml-4">
                      <li>• Template starts empty - perfect for customization</li>
                      <li>• Add exercises later by editing the template</li>
                      <li>• All other settings are auto-configured</li>
                      <li>• Only name is required, description is optional</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateTemplate(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  Create Template
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};