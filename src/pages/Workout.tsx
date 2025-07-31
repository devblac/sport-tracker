import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Clock, Dumbbell, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { TemplateSelector } from '@/components/workouts/TemplateSelector';
import { WorkoutHistory } from '@/components/workouts/WorkoutHistory';
import { useAuthStore } from '@/stores';
import { WorkoutService } from '@/services/WorkoutService';

export const Workout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  
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
        navigate(`/workout/${emptyWorkout.id}`);
      }
    } catch (error) {
      console.error('Error creating empty workout:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    if (!user) return;
    
    try {
      const workout = await workoutService.createWorkoutFromTemplate(templateId, user.id);
      if (workout) {
        const saved = await workoutService.saveWorkout(workout);
        if (saved) {
          await workoutService.incrementTemplateUsage(templateId);
          navigate(`/workout/${workout.id}`);
        }
      }
    } catch (error) {
      console.error('Error starting workout from template:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Workouts
        </h1>
        <p className="text-muted-foreground">
          Start a new workout or continue from a template
        </p>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth
          onClick={handleCreateEmptyWorkout}
          disabled={isCreating}
          icon={<Plus className="w-5 h-5" />}
          className="h-16 flex-col"
        >
          <span className="text-lg font-semibold">Create Empty Workout</span>
          <span className="text-sm opacity-90">Build as you go</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          fullWidth
          onClick={() => navigate('/workout-templates')}
          icon={<Settings className="w-5 h-5" />}
          className="h-16 flex-col"
        >
          <span className="text-lg font-semibold">Manage Templates</span>
          <span className="text-sm opacity-90">Create & Edit</span>
        </Button>
      </div>
      
      {/* Template Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Quick Start Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateSelector 
            onTemplateSelect={handleTemplateSelect}
            showCreateButton={false}
            limit={6}
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
  );
};