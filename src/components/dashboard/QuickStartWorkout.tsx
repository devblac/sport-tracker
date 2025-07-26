import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { useAuthStore } from '@/stores';
import { WorkoutService } from '@/services/WorkoutService';
import { Play, Clock, Dumbbell, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';

interface QuickStartWorkoutProps {
  className?: string;
}

export const QuickStartWorkout: React.FC<QuickStartWorkoutProps> = ({ 
  className 
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { templates, loading } = useWorkoutTemplates();
  const [isStarting, setIsStarting] = useState(false);
  
  const workoutService = WorkoutService.getInstance();

  // Get quick start templates (popular, short duration)
  const quickStartTemplates = templates
    .filter(template => 
      template.estimated_duration <= 45 && // 45 minutes or less
      template.difficulty_level <= 3 && // Easy to moderate
      template.times_used > 0 // Has been used before
    )
    .sort((a, b) => (b.times_used || 0) - (a.times_used || 0))
    .slice(0, 3);

  const handleQuickStart = async (templateId?: string) => {
    if (!user) return;
    
    setIsStarting(true);
    
    try {
      if (templateId) {
        // Start from specific template
        const workout = await workoutService.createWorkoutFromTemplate(templateId, user.id);
        if (workout) {
          const saved = await workoutService.saveWorkout(workout);
          if (saved) {
            await workoutService.incrementTemplateUsage(templateId);
            navigate(`/workout/${workout.id}`);
          }
        }
      } else {
        // Navigate to template selection
        navigate('/workout-templates');
      }
    } catch (error) {
      console.error('Error starting quick workout:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEmptyWorkout = () => {
    navigate('/workout');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading workouts...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Quick Start
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Quick Start Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          icon={<Play className="w-5 h-5" />}
          onClick={handleEmptyWorkout}
          className="h-20 flex-col py-3"
          disabled={isStarting}
        >
          <span className="text-lg font-semibold">Start Workout</span>
          <span className="text-sm opacity-90">Build as you go</span>
        </Button>

        {/* Quick Templates */}
        {quickStartTemplates.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Popular Templates
            </h4>
            
            {quickStartTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleQuickStart(template.id)}
                disabled={isStarting}
                className={cn(
                  'w-full p-3 rounded-lg border border-border',
                  'bg-card hover:bg-accent transition-colors',
                  'flex items-center justify-between',
                  'text-left disabled:opacity-50'
                )}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm text-foreground">
                    {template.name}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {template.estimated_duration}min
                    </span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" />
                      {template.exercises.length} exercises
                    </span>
                    <span className="text-primary">
                      ⭐ {template.times_used} uses
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {/* Browse All Templates */}
        <Button
          variant="outline"
          fullWidth
          onClick={() => navigate('/workout-templates')}
          disabled={isStarting}
          className="text-sm"
        >
          Browse All Templates
        </Button>
      </CardContent>
    </Card>
  );
};