import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkoutStore } from '../useWorkoutStore';
import { workoutService } from '@/services/WorkoutService';

// Mock the workout service
vi.mock('@/services/WorkoutService');

const mockWorkout = {
  id: 'workout-1',
  user_id: 'user-1',
  name: 'Test Workout',
  status: 'planned' as const,
  exercises: [],
  started_at: null,
  completed_at: null,
  is_template: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockExercise = {
  id: 'exercise-1',
  exercise_id: 'bench-press',
  name: 'Bench Press',
  sets: []
};

describe('useWorkoutStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useWorkoutStore.setState({
      workouts: [],
      currentWorkout: null,
      isWorkoutActive: false,
      isLoading: false,
      error: null
    });
  });

  describe('createWorkout', () => {
    it('should create a new workout successfully', async () => {
      (workoutService.createWorkout as any).mockResolvedValue(mockWorkout);
      
      const { result } = renderHook(() => useWorkoutStore());
      
      await act(async () => {
        await result.current.createWorkout({
          name: 'Test Workout',
          exercises: []
        });
      });
      
      expect(result.current.workouts).toContain(mockWorkout);
      expect(result.current.error).toBeNull();
    });

    it('should handle workout creation error', async () => {
      const error = new Error('Failed to create workout');
      (workoutService.createWorkout as any).mockRejectedValue(error);
      
      const { result } = renderHook(() => useWorkoutStore());
      
      await act(async () => {
        await result.current.createWorkout({
          name: 'Test Workout',
          exercises: []
        });
      });
      
      expect(result.current.error).toBe('Failed to create workout');
      expect(result.current.workouts).toHaveLength(0);
    });
  });

  describe('startWorkout', () => {
    it('should start a workout and set it as current', async () => {
      const startedWorkout = { ...mockWorkout, status: 'in_progress' as const };
      (workoutService.startWorkout as any).mockResolvedValue(startedWorkout);
      
      const { result } = renderHook(() => useWorkoutStore());
      
      // Add workout to store first
      act(() => {
        result.current.setWorkouts([mockWorkout]);
      });
      
      await act(async () => {
        await result.current.startWorkout('workout-1');
      });
      
      expect(result.current.currentWorkout).toEqual(startedWorkout);
      expect(result.current.isWorkoutActive).toBe(true);
    });

    it('should handle start workout error', async () => {
      const error = new Error('Failed to start workout');
      (workoutService.startWorkout as any).mockRejectedValue(error);
      
      const { result } = renderHook(() => useWorkoutStore());
      
      await act(async () => {
        await result.current.startWorkout('workout-1');
      });
      
      expect(result.current.error).toBe('Failed to start workout');
      expect(result.current.isWorkoutActive).toBe(false);
    });
  });

  describe('logSet', () => {
    it('should log a set to the current workout', async () => {
      const setData = {
        weight: 80,
        reps: 10,
        type: 'normal' as const
      };
      
      const workoutWithExercise = {
        ...mockWorkout,
        status: 'in_progress' as const,
        exercises: [mockExercise]
      };
      
      const { result } = renderHook(() => useWorkoutStore());
      
      act(() => {
        result.current.setCurrentWorkout(workoutWithExercise);
      });
      
      await act(async () => {
        await result.current.logSet('exercise-1', setData);
      });
      
      const exercise = result.current.currentWorkout?.exercises.find(e => e.id === 'exercise-1');
      expect(exercise?.sets).toHaveLength(1);
      expect(exercise?.sets[0]).toMatchObject(setData);
    });

    it('should handle logging set without active workout', async () => {
      const { result } = renderHook(() => useWorkoutStore());
      
      await act(async () => {
        await result.current.logSet('exercise-1', {
          weight: 80,
          reps: 10,
          type: 'normal'
        });
      });
      
      expect(result.current.error).toBe('No active workout');
    });
  });

  describe('addExercise', () => {
    it('should add exercise to current workout', async () => {
      const workoutInProgress = {
        ...mockWorkout,
        status: 'in_progress' as const
      };
      
      const { result } = renderHook(() => useWorkoutStore());
      
      act(() => {
        result.current.setCurrentWorkout(workoutInProgress);
      });
      
      await act(async () => {
        await result.current.addExercise({
          exercise_id: 'squat',
          name: 'Squat'
        });
      });
      
      expect(result.current.currentWorkout?.exercises).toHaveLength(1);
      expect(result.current.currentWorkout?.exercises[0].name).toBe('Squat');
    });
  });

  describe('completeWorkout', () => {
    it('should complete the current workout', async () => {
      const completedWorkout = {
        ...mockWorkout,
        status: 'completed' as const,
        completed_at: new Date().toISOString()
      };
      
      (workoutService.completeWorkout as any).mockResolvedValue(completedWorkout);
      
      const { result } = renderHook(() => useWorkoutStore());
      
      act(() => {
        result.current.setCurrentWorkout({
          ...mockWorkout,
          status: 'in_progress' as const
        });
      });
      
      await act(async () => {
        await result.current.completeWorkout();
      });
      
      expect(result.current.currentWorkout).toBeNull();
      expect(result.current.isWorkoutActive).toBe(false);
      expect(workoutService.completeWorkout).toHaveBeenCalled();
    });
  });

  describe('pauseWorkout', () => {
    it('should pause the current workout', async () => {
      const { result } = renderHook(() => useWorkoutStore());
      
      act(() => {
        result.current.setCurrentWorkout({
          ...mockWorkout,
          status: 'in_progress' as const
        });
      });
      
      await act(async () => {
        await result.current.pauseWorkout();
      });
      
      expect(result.current.currentWorkout?.status).toBe('paused');
    });
  });

  describe('loadWorkouts', () => {
    it('should load workouts from service', async () => {
      const workouts = [mockWorkout];
      (workoutService.getUserWorkouts as any).mockResolvedValue(workouts);
      
      const { result } = renderHook(() => useWorkoutStore());
      
      await act(async () => {
        await result.current.loadWorkouts('user-1');
      });
      
      expect(result.current.workouts).toEqual(workouts);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle loading error', async () => {
      const error = new Error('Failed to load workouts');
      (workoutService.getUserWorkouts as any).mockRejectedValue(error);
      
      const { result } = renderHook(() => useWorkoutStore());
      
      await act(async () => {
        await result.current.loadWorkouts('user-1');
      });
      
      expect(result.current.error).toBe('Failed to load workouts');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('auto-save functionality', () => {
    it('should auto-save workout changes', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useWorkoutStore());
      
      act(() => {
        result.current.setCurrentWorkout({
          ...mockWorkout,
          status: 'in_progress' as const
        });
      });
      
      // Trigger auto-save
      act(() => {
        result.current.triggerAutoSave();
      });
      
      // Fast-forward timers
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      expect(workoutService.updateWorkout).toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });

  describe('offline functionality', () => {
    it('should queue operations when offline', async () => {
      const { result } = renderHook(() => useWorkoutStore());
      
      // Simulate offline
      act(() => {
        result.current.setOfflineMode(true);
      });
      
      await act(async () => {
        await result.current.createWorkout({
          name: 'Offline Workout',
          exercises: []
        });
      });
      
      expect(result.current.pendingOperations).toHaveLength(1);
      expect(result.current.pendingOperations[0].type).toBe('create');
    });

    it('should sync operations when back online', async () => {
      const { result } = renderHook(() => useWorkoutStore());
      
      // Add pending operation
      act(() => {
        result.current.addPendingOperation({
          type: 'create',
          data: { name: 'Offline Workout', exercises: [] },
          timestamp: Date.now()
        });
      });
      
      (workoutService.createWorkout as any).mockResolvedValue(mockWorkout);
      
      await act(async () => {
        await result.current.syncPendingOperations();
      });
      
      expect(result.current.pendingOperations).toHaveLength(0);
      expect(workoutService.createWorkout).toHaveBeenCalled();
    });
  });
});