import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkout } from '../useWorkout';
import { useWorkoutStore } from '@/stores/useWorkoutStore';

// Mock the workout store
vi.mock('@/stores/useWorkoutStore');

const mockWorkoutStore = {
  currentWorkout: null,
  isWorkoutActive: false,
  createWorkout: vi.fn(),
  startWorkout: vi.fn(),
  logSet: vi.fn(),
  addExercise: vi.fn(),
  completeWorkout: vi.fn(),
  pauseWorkout: vi.fn(),
  resumeWorkout: vi.fn(),
  error: null,
  isLoading: false
};

describe('useWorkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useWorkoutStore as any).mockReturnValue(mockWorkoutStore);
  });

  it('should return workout state and actions', () => {
    const { result } = renderHook(() => useWorkout());

    expect(result.current).toMatchObject({
      currentWorkout: null,
      isActive: false,
      isLoading: false,
      error: null,
      createWorkout: expect.any(Function),
      startWorkout: expect.any(Function),
      logSet: expect.any(Function),
      addExercise: expect.any(Function),
      completeWorkout: expect.any(Function),
      pauseWorkout: expect.any(Function),
      resumeWorkout: expect.any(Function)
    });
  });

  it('should create workout with validation', async () => {
    mockWorkoutStore.createWorkout.mockResolvedValue({
      id: 'workout-1',
      name: 'Test Workout'
    });

    const { result } = renderHook(() => useWorkout());

    await act(async () => {
      await result.current.createWorkout({
        name: 'Test Workout',
        exercises: []
      });
    });

    expect(mockWorkoutStore.createWorkout).toHaveBeenCalledWith({
      name: 'Test Workout',
      exercises: []
    });
  });

  it('should validate workout data before creation', async () => {
    const { result } = renderHook(() => useWorkout());

    await act(async () => {
      await expect(result.current.createWorkout({
        name: '', // Empty name should fail
        exercises: []
      })).rejects.toThrow('Workout name is required');
    });

    expect(mockWorkoutStore.createWorkout).not.toHaveBeenCalled();
  });

  it('should start workout with proper validation', async () => {
    const { result } = renderHook(() => useWorkout());

    await act(async () => {
      await result.current.startWorkout('workout-1');
    });

    expect(mockWorkoutStore.startWorkout).toHaveBeenCalledWith('workout-1');
  });

  it('should log set with validation', async () => {
    const { result } = renderHook(() => useWorkout());

    const setData = {
      weight: 80,
      reps: 10,
      type: 'normal' as const
    };

    await act(async () => {
      await result.current.logSet('exercise-1', setData);
    });

    expect(mockWorkoutStore.logSet).toHaveBeenCalledWith('exercise-1', setData);
  });

  it('should validate set data before logging', async () => {
    const { result } = renderHook(() => useWorkout());

    await act(async () => {
      await expect(result.current.logSet('exercise-1', {
        weight: -10, // Negative weight should fail
        reps: 0,
        type: 'normal'
      })).rejects.toThrow('Weight must be positive');
    });

    expect(mockWorkoutStore.logSet).not.toHaveBeenCalled();
  });

  it('should add exercise with validation', async () => {
    const { result } = renderHook(() => useWorkout());

    const exerciseData = {
      exercise_id: 'bench-press',
      name: 'Bench Press'
    };

    await act(async () => {
      await result.current.addExercise(exerciseData);
    });

    expect(mockWorkoutStore.addExercise).toHaveBeenCalledWith(exerciseData);
  });

  it('should complete workout with confirmation', async () => {
    const { result } = renderHook(() => useWorkout());

    await act(async () => {
      await result.current.completeWorkout();
    });

    expect(mockWorkoutStore.completeWorkout).toHaveBeenCalled();
  });

  it('should handle workout errors gracefully', () => {
    (useWorkoutStore as any).mockReturnValue({
      ...mockWorkoutStore,
      error: 'Failed to create workout'
    });

    const { result } = renderHook(() => useWorkout());

    expect(result.current.error).toBe('Failed to create workout');
  });

  it('should provide loading state', () => {
    (useWorkoutStore as any).mockReturnValue({
      ...mockWorkoutStore,
      isLoading: true
    });

    const { result } = renderHook(() => useWorkout());

    expect(result.current.isLoading).toBe(true);
  });

  it('should calculate workout progress', () => {
    const workoutWithProgress = {
      id: 'workout-1',
      exercises: [
        {
          id: 'exercise-1',
          sets: [
            { completed: true },
            { completed: true },
            { completed: false }
          ]
        }
      ]
    };

    (useWorkoutStore as any).mockReturnValue({
      ...mockWorkoutStore,
      currentWorkout: workoutWithProgress
    });

    const { result } = renderHook(() => useWorkout());

    expect(result.current.progress).toMatchObject({
      completedSets: 2,
      totalSets: 3,
      percentage: expect.closeTo(66.67, 1)
    });
  });

  it('should provide workout statistics', () => {
    const workoutWithStats = {
      id: 'workout-1',
      exercises: [
        {
          id: 'exercise-1',
          sets: [
            { weight: 80, reps: 10, completed: true },
            { weight: 80, reps: 8, completed: true }
          ]
        }
      ]
    };

    (useWorkoutStore as any).mockReturnValue({
      ...mockWorkoutStore,
      currentWorkout: workoutWithStats
    });

    const { result } = renderHook(() => useWorkout());

    expect(result.current.stats).toMatchObject({
      totalVolume: 1440, // (80 * 10) + (80 * 8)
      totalSets: 2,
      totalReps: 18,
      exerciseCount: 1
    });
  });
});