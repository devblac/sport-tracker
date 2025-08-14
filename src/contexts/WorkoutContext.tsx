import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Workout } from '@/schemas/workout';
import { WorkoutService } from '@/services/WorkoutService';

interface WorkoutContextType {
  activeWorkout: Workout | null;
  isWorkoutMinimized: boolean;
  workoutStartTime: Date | null;
  elapsedTime: number;
  startWorkout: (workout: Workout) => void;
  minimizeWorkout: () => void;
  maximizeWorkout: () => void;
  updateWorkout: (workout: Workout) => void;
  finishWorkout: () => void;
  pauseWorkout: () => void;
  cancelWorkout: (onConfirm?: () => void) => void;
  performCancelWorkout: () => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

interface WorkoutProviderProps {
  children: ReactNode;
}

export const WorkoutProvider: React.FC<WorkoutProviderProps> = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [isWorkoutMinimized, setIsWorkoutMinimized] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const workoutService = WorkoutService.getInstance();

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (activeWorkout && workoutStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeWorkout, workoutStartTime]);

  // Load active workout on mount (in case of page refresh)
  useEffect(() => {
    const loadActiveWorkout = async () => {
      try {
        // Check localStorage for active workout
        const savedWorkoutId = localStorage.getItem('activeWorkoutId');
        const savedStartTime = localStorage.getItem('workoutStartTime');
        
        if (savedWorkoutId && savedStartTime) {
          const workout = await workoutService.getWorkoutById(savedWorkoutId);
          if (workout && (workout.status === 'in_progress' || workout.status === 'paused')) {
            setActiveWorkout(workout);
            setWorkoutStartTime(new Date(savedStartTime));
            setIsWorkoutMinimized(true); // Start minimized when reloading
          }
        }
      } catch (error) {
        console.error('Error loading active workout:', error);
      }
    };

    loadActiveWorkout();
  }, [workoutService]);

  const startWorkout = (workout: Workout) => {
    const startTime = new Date();
    const updatedWorkout = {
      ...workout,
      status: 'in_progress' as const,
      started_at: startTime,
    };

    setActiveWorkout(updatedWorkout);
    setWorkoutStartTime(startTime);
    setIsWorkoutMinimized(false);
    setElapsedTime(0);

    // Save to localStorage for persistence
    localStorage.setItem('activeWorkoutId', workout.id);
    localStorage.setItem('workoutStartTime', startTime.toISOString());

    // Save to database
    workoutService.saveWorkout(updatedWorkout);
  };

  const minimizeWorkout = () => {
    setIsWorkoutMinimized(true);
  };

  const maximizeWorkout = () => {
    setIsWorkoutMinimized(false);
  };

  const updateWorkout = (workout: Workout) => {
    setActiveWorkout(workout);
    // Save to database
    workoutService.saveWorkout(workout);
  };

  const finishWorkout = async () => {
    if (activeWorkout) {
      const completedWorkout = {
        ...activeWorkout,
        status: 'completed' as const,
        completed_at: new Date(),
        total_duration: elapsedTime,
      };

      // Save final workout
      await workoutService.saveWorkout(completedWorkout);

      // Update template usage if workout was created from template
      if (activeWorkout.template_id) {
        await workoutService.updateTemplateUsage(activeWorkout.template_id);
        
        // Check if workout was modified from original template
        const originalTemplate = await workoutService.getTemplate(activeWorkout.template_id);
        if (originalTemplate && hasWorkoutBeenModified(activeWorkout, originalTemplate)) {
          // Ask user if they want to update the template
          const shouldUpdateTemplate = confirm(
            'You made changes to this workout.\n\nWould you like to update the original template with your changes?'
          );
          
          if (shouldUpdateTemplate) {
            await workoutService.updateTemplateFromWorkout(activeWorkout.template_id, activeWorkout);
          }
        }
      }
    }

    // Clear state
    setActiveWorkout(null);
    setWorkoutStartTime(null);
    setIsWorkoutMinimized(false);
    setElapsedTime(0);

    // Clear localStorage
    localStorage.removeItem('activeWorkoutId');
    localStorage.removeItem('workoutStartTime');
  };

  // Helper function to check if workout was modified from template
  const hasWorkoutBeenModified = (workout: Workout, template: any): boolean => {
    // Check if exercises were added
    if (workout.exercises.length !== template.exercises.length) {
      return true;
    }
    
    // Check if sets were added to any exercise
    for (let i = 0; i < workout.exercises.length; i++) {
      const workoutExercise = workout.exercises[i];
      const templateExercise = template.exercises[i];
      
      if (workoutExercise.sets.length !== templateExercise.sets.length) {
        return true;
      }
    }
    
    return false;
  };

  const pauseWorkout = () => {
    if (activeWorkout) {
      const pausedWorkout = {
        ...activeWorkout,
        status: 'paused' as const,
        paused_at: new Date(),
      };

      setActiveWorkout(pausedWorkout);
      workoutService.saveWorkout(pausedWorkout);
    }
  };

  const cancelWorkout = (onConfirm?: () => void) => {
    if (!activeWorkout) return;
    
    // If onConfirm callback is provided, use it (for custom modal handling)
    if (onConfirm) {
      onConfirm();
      return;
    }
    
    // Fallback to browser confirm for backward compatibility
    if (confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
      performCancelWorkout();
    }
  };

  const performCancelWorkout = () => {
    if (!activeWorkout) return;
    
    // Mark workout as cancelled
    const cancelledWorkout = {
      ...activeWorkout,
      status: 'cancelled' as const,
      cancelled_at: new Date(),
    };

    // Save cancelled workout for history
    workoutService.saveWorkout(cancelledWorkout);

    // Clear state
    setActiveWorkout(null);
    setWorkoutStartTime(null);
    setIsWorkoutMinimized(false);
    setElapsedTime(0);

    // Clear localStorage
    localStorage.removeItem('activeWorkoutId');
    localStorage.removeItem('workoutStartTime');
  };

  const value: WorkoutContextType = {
    activeWorkout,
    isWorkoutMinimized,
    workoutStartTime,
    elapsedTime,
    startWorkout,
    minimizeWorkout,
    maximizeWorkout,
    updateWorkout,
    finishWorkout,
    pauseWorkout,
    cancelWorkout,
    performCancelWorkout,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = (): WorkoutContextType => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};