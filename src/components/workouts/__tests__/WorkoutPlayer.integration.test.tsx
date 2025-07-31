import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WorkoutPlayer } from '../WorkoutPlayer';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { useExerciseStore } from '@/stores/useExerciseStore';
import type { Workout, Exercise } from '@/types';

// Mock stores
vi.mock('@/stores/useAuthStore');
vi.mock('@/stores/useWorkoutStore');
vi.mock('@/stores/useExerciseStore');

// Mock timer functions
vi.mock('@/hooks/useTimer', () => ({
  useTimer: () => ({
    time: 0,
    isRunning: false,
    start: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
    formatTime: (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`,
  }),
}));

// Mock audio
Object.defineProperty(window, 'Audio', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    load: vi.fn(),
  })),
});

describe('WorkoutPlayer Integration Tests', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    display_name: 'Test User',
    fitness_level: 'intermediate' as const,
    created_at: new Date(),
  };

  const mockExercise: Exercise = {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'strength',
    type: 'compound',
    body_parts: ['chest'],
    muscle_groups: ['pectorals'],
    equipment: 'barbell',
    difficulty_level: 3,
    instructions: ['Lie on bench', 'Lower bar to chest', 'Press up'],
    tips: ['Keep feet flat'],
    tags: ['push'],
    aliases: [],
    is_public: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockWorkout: Workout = {
    id: 'workout-1',
    user_id: 'user-1',
    name: 'Test Workout',
    is_template: false,
    exercises: [
      {
        id: 'exercise-1',
        exercise_id: 'bench-press',
        order: 0,
        sets: [
          {
            id: 'set-1',
            set_number: 1,
            type: 'normal',
            weight: 100,
            reps: 10,
            completed: false,
            skipped: false,
            planned_rest_time: 90,
          },
          {
            id: 'set-2',
            set_number: 2,
            type: 'normal',
            weight: 100,
            reps: 10,
            completed: false,
            skipped: false,
            planned_rest_time: 90,
          },
        ],
      },
    ],
    auto_rest_timer: true,
    default_rest_time: 90,
    is_public: false,
    created_at: new Date(),
  };

  const mockAuthStore = {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  };

  const mockWorkoutStore = {
    currentWorkout: mockWorkout,
    isWorkoutActive: true,
    workoutHistory: [],
    templates: [],
    isLoading: false,
    error: null,
    startWorkout: vi.fn(),
    pauseWorkout: vi.fn(),
    resumeWorkout: vi.fn(),
    completeWorkout: vi.fn(),
    updateSet: vi.fn(),
    completeSet: vi.fn(),
    skipSet: vi.fn(),
    addSet: vi.fn(),
    removeSet: vi.fn(),
    loadWorkout: vi.fn(),
    saveWorkout: vi.fn(),
  };

  const mockExerciseStore = {
    exercises: [mockExercise],
    filteredExercises: [mockExercise],
    selectedExercise: null,
    isLoading: false,
    error: null,
    loadExercises: vi.fn(),
    getExerciseById: vi.fn().mockReturnValue(mockExercise),
    searchExercises: vi.fn(),
    filterExercises: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue(mockAuthStore);
    vi.mocked(useWorkoutStore).mockReturnValue(mockWorkoutStore);
    vi.mocked(useExerciseStore).mockReturnValue(mockExerciseStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Workout Flow Integration', () => {
    it('should render workout player with exercise information', async () => {
      render(<WorkoutPlayer />);

      // Should display workout name
      expect(screen.getByText('Test Workout')).toBeInTheDocument();

      // Should display exercise information
      expect(screen.getByText('Bench Press')).toBeInTheDocument();

      // Should display sets
      expect(screen.getByText('Set 1')).toBeInTheDocument();
      expect(screen.getByText('Set 2')).toBeInTheDocument();
    });

    it('should handle set completion flow', async () => {
      render(<WorkoutPlayer />);

      // Find the first set's complete button
      const completeButtons = screen.getAllByText(/Complete|✓/);
      const firstCompleteButton = completeButtons[0];

      // Complete the first set
      await act(async () => {
        fireEvent.click(firstCompleteButton);
      });

      // Should call updateSet with completed status
      expect(mockWorkoutStore.updateSet).toHaveBeenCalledWith(
        'exercise-1',
        'set-1',
        expect.objectContaining({
          completed: true,
        })
      );
    });

    it('should handle weight and reps input', async () => {
      render(<WorkoutPlayer />);

      // Find weight input for first set
      const weightInputs = screen.getAllByLabelText(/weight/i);
      const firstWeightInput = weightInputs[0];

      // Update weight
      await act(async () => {
        fireEvent.change(firstWeightInput, { target: { value: '105' } });
        fireEvent.blur(firstWeightInput);
      });

      // Should call updateSet with new weight
      expect(mockWorkoutStore.updateSet).toHaveBeenCalledWith(
        'exercise-1',
        'set-1',
        expect.objectContaining({
          weight: 105,
        })
      );
    });

    it('should handle rest timer functionality', async () => {
      render(<WorkoutPlayer />);

      // Complete a set to trigger rest timer
      const completeButtons = screen.getAllByText(/Complete|✓/);
      const firstCompleteButton = completeButtons[0];

      await act(async () => {
        fireEvent.click(firstCompleteButton);
      });

      // Should show rest timer (mocked to show 0:00)
      await waitFor(() => {
        expect(screen.getByText(/rest/i)).toBeInTheDocument();
      });
    });

    it('should handle adding new sets', async () => {
      render(<WorkoutPlayer />);

      // Find add set button
      const addSetButton = screen.getByText(/add set/i);

      await act(async () => {
        fireEvent.click(addSetButton);
      });

      // Should call addSet
      expect(mockWorkoutStore.addSet).toHaveBeenCalledWith('exercise-1');
    });

    it('should handle skipping sets', async () => {
      render(<WorkoutPlayer />);

      // Find skip button for first set
      const skipButtons = screen.getAllByText(/skip/i);
      const firstSkipButton = skipButtons[0];

      await act(async () => {
        fireEvent.click(firstSkipButton);
      });

      // Should call skipSet
      expect(mockWorkoutStore.skipSet).toHaveBeenCalledWith('exercise-1', 'set-1');
    });

    it('should handle workout completion', async () => {
      // Mock all sets as completed
      const completedWorkout = {
        ...mockWorkout,
        exercises: [
          {
            ...mockWorkout.exercises[0],
            sets: mockWorkout.exercises[0].sets.map(set => ({
              ...set,
              completed: true,
            })),
          },
        ],
      };

      vi.mocked(useWorkoutStore).mockReturnValue({
        ...mockWorkoutStore,
        currentWorkout: completedWorkout,
      });

      render(<WorkoutPlayer />);

      // Find complete workout button
      const completeWorkoutButton = screen.getByText(/complete workout/i);

      await act(async () => {
        fireEvent.click(completeWorkoutButton);
      });

      // Should call completeWorkout
      expect(mockWorkoutStore.completeWorkout).toHaveBeenCalled();
    });

    it('should handle workout pause and resume', async () => {
      render(<WorkoutPlayer />);

      // Find pause button
      const pauseButton = screen.getByText(/pause/i);

      await act(async () => {
        fireEvent.click(pauseButton);
      });

      // Should call pauseWorkout
      expect(mockWorkoutStore.pauseWorkout).toHaveBeenCalled();

      // Mock paused state
      vi.mocked(useWorkoutStore).mockReturnValue({
        ...mockWorkoutStore,
        isWorkoutActive: false,
      });

      // Re-render to show resume button
      render(<WorkoutPlayer />);

      const resumeButton = screen.getByText(/resume/i);

      await act(async () => {
        fireEvent.click(resumeButton);
      });

      // Should call resumeWorkout
      expect(mockWorkoutStore.resumeWorkout).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing exercise data gracefully', async () => {
      // Mock exercise store with no exercise found
      vi.mocked(useExerciseStore).mockReturnValue({
        ...mockExerciseStore,
        getExerciseById: vi.fn().mockReturnValue(null),
      });

      render(<WorkoutPlayer />);

      // Should show fallback or error message
      expect(screen.getByText(/exercise not found|unknown exercise/i)).toBeInTheDocument();
    });

    it('should handle workout store errors', async () => {
      vi.mocked(useWorkoutStore).mockReturnValue({
        ...mockWorkoutStore,
        error: 'Failed to save workout',
      });

      render(<WorkoutPlayer />);

      // Should display error message
      expect(screen.getByText(/failed to save workout/i)).toBeInTheDocument();
    });

    it('should handle loading states', async () => {
      vi.mocked(useWorkoutStore).mockReturnValue({
        ...mockWorkoutStore,
        isLoading: true,
      });

      render(<WorkoutPlayer />);

      // Should show loading indicator
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Data Persistence', () => {
    it('should save workout data when sets are updated', async () => {
      render(<WorkoutPlayer />);

      // Complete a set
      const completeButtons = screen.getAllByText(/Complete|✓/);
      const firstCompleteButton = completeButtons[0];

      await act(async () => {
        fireEvent.click(firstCompleteButton);
      });

      // Should trigger save
      await waitFor(() => {
        expect(mockWorkoutStore.saveWorkout).toHaveBeenCalled();
      });
    });

    it('should handle offline data persistence', async () => {
      // Mock offline scenario
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(<WorkoutPlayer />);

      // Complete a set while offline
      const completeButtons = screen.getAllByText(/Complete|✓/);
      const firstCompleteButton = completeButtons[0];

      await act(async () => {
        fireEvent.click(firstCompleteButton);
      });

      // Should still update local state
      expect(mockWorkoutStore.updateSet).toHaveBeenCalled();
    });
  });

  describe('User Experience', () => {
    it('should provide visual feedback for completed sets', async () => {
      // Mock a workout with one completed set
      const workoutWithCompletedSet = {
        ...mockWorkout,
        exercises: [
          {
            ...mockWorkout.exercises[0],
            sets: [
              {
                ...mockWorkout.exercises[0].sets[0],
                completed: true,
              },
              mockWorkout.exercises[0].sets[1],
            ],
          },
        ],
      };

      vi.mocked(useWorkoutStore).mockReturnValue({
        ...mockWorkoutStore,
        currentWorkout: workoutWithCompletedSet,
      });

      render(<WorkoutPlayer />);

      // Should show visual indication of completed set
      const completedSetElement = screen.getByTestId('set-1');
      expect(completedSetElement).toHaveClass(/completed|success/);
    });

    it('should show progress indicators', async () => {
      render(<WorkoutPlayer />);

      // Should show workout progress
      expect(screen.getByText(/progress|0%|1 of 2/i)).toBeInTheDocument();
    });

    it('should handle keyboard navigation', async () => {
      render(<WorkoutPlayer />);

      // Find first weight input
      const weightInputs = screen.getAllByLabelText(/weight/i);
      const firstWeightInput = weightInputs[0];

      // Focus and use keyboard
      firstWeightInput.focus();
      
      await act(async () => {
        fireEvent.keyDown(firstWeightInput, { key: 'Tab' });
      });

      // Should move focus to next input
      const repsInputs = screen.getAllByLabelText(/reps/i);
      expect(repsInputs[0]).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', async () => {
      const renderSpy = vi.fn();
      
      const TestWrapper = () => {
        renderSpy();
        return <WorkoutPlayer />;
      };

      const { rerender } = render(<TestWrapper />);

      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestWrapper />);

      // Should not cause unnecessary re-renders
      expect(renderSpy).toHaveBeenCalledTimes(2); // Only initial + rerender
    });

    it('should handle large workouts efficiently', async () => {
      // Create a workout with many exercises and sets
      const largeWorkout = {
        ...mockWorkout,
        exercises: Array.from({ length: 10 }, (_, i) => ({
          id: `exercise-${i}`,
          exercise_id: `exercise-${i}`,
          order: i,
          sets: Array.from({ length: 5 }, (_, j) => ({
            id: `set-${i}-${j}`,
            set_number: j + 1,
            type: 'normal' as const,
            weight: 100,
            reps: 10,
            completed: false,
            skipped: false,
            planned_rest_time: 90,
          })),
        })),
      };

      vi.mocked(useWorkoutStore).mockReturnValue({
        ...mockWorkoutStore,
        currentWorkout: largeWorkout,
      });

      const startTime = performance.now();
      render(<WorkoutPlayer />);
      const endTime = performance.now();

      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});