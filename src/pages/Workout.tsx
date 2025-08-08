import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, Dumbbell, Search, Star, Folder, MoreHorizontal, Grid, List, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { TemplateSelector } from '@/components/workouts/TemplateSelector';
import { TemplateDetail } from '@/components/workouts/TemplateDetail';
import { WorkoutHistory } from '@/components/workouts/WorkoutHistory';
import { useAuthStore } from '@/stores';
import { useWorkout } from '@/contexts/WorkoutContext';
import { WorkoutService } from '@/services/WorkoutService';
import type { WorkoutTemplate } from '@/schemas/workout';

export const Workout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { startWorkout } = useWorkout();
  const [isCreating, setIsCreating] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showArchived, setShowArchived] = useState(false);
  const [hideExamples, setHideExamples] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  
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
          {/* Header with Search and Premium */}
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Workouts
              </h1>
              <p className="text-muted-foreground">
                Start a new workout or continue from a template
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 transition-colors ${showSearch ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
          </div>
        </div>
      )}
      
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
                      {hideExamples ? 'Show examples' : 'Hide examples'}
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
    </div>
  );
};