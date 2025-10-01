/**
 * Workout System Tests
 * Comprehensive tests for workout creation, execution, and management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutPlayer } from '@/components/workouts/WorkoutPlayer';
import { WorkoutHistory } from '@/components/workouts/WorkoutHistory';
import { TemplateCreationFlow } from '@/components/workouts/TemplateCreationFlow';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { mockWorkoutService, mockGamificationService } from '@/test/mocks/implementations';
import { workoutFixtures, exerciseFixtures, userFixtures } from '@/test/fixtures';
import type { Workout, WorkoutExercise, Set } from '@/types';

// Mock the workout store
vi.mock('@/stores/useWorkoutStore');
const mockUseWorkoutStore = vi.mocked(useWorkoutStore);

// Mock services
vi.mock('@/services/WorkoutService', () => ({
  WorkoutService: mockWorkoutService,
}));

vi.mock('@/services/GamificationService', () => ({
  GamificationService: mockGamificationService,
}));

describe('Workout System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWorkoutStore.mockReturnValue({
      workouts: [],
      currentWorkout: null,
      isWorkoutActive: false,
      isLoading: false,
      error: null,
      createWorkout: vi.fn(),
      updateWorkout: vi.fn(),
      deleteWorkout: vi.fn(),
      startWorkout: vi.fn(),
      completeWorkout: vi.fn(),
      pauseWorkout: vi.fn(),
      resumeWorkout: vi.fn(),
      logSet: vi.fn(),
      addExercise: vi.fn(),
      removeExercise: vi.fn(),
      getWorkouts: vi.fn(),
      getWorkout: vi.fn(),
    });
  });

  describe('Workout Creation', () => {
    it('should create a new workout', async () => {
      const user = userEvent.setup();
      const mockCreateWorkout = vi.fn().mockResolvedValue(workoutFixtures.emptyWorkout);
      
      mockUseWorkoutStore.mockReturnValue({
        workouts: [],
        currentWorkout: null,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: mockCreateWorkout,
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<TemplateCreationFlow />);

      await user.type(screen.getByLabelText(/workout name/i), 'New Workout');
      await user.type(screen.getByLabelText(/description/i), 'Test workout description');
      await user.click(screen.getByRole('button', { name: /create workout/i }));

      await waitFor(() => {
        expect(mockCreateWorkout).toHaveBeenCalledWith({
          name: 'New Workout',
          description: 'Test workout description',
          exercises: [],
          is_template: false,
        });
      });
    });

    it('should validate workout name', async () => {
      const user = userEvent.setup();
      render(<TemplateCreationFlow />);

      await user.click(screen.getByRole('button', { name: /create workout/i }));

      await waitFor(() => {
        expect(screen.getByText(/workout name is required/i)).toBeInTheDocument();
      });
    });

    it('should create workout from template', async () => {
      const mockCreateWorkout = vi.fn().mockResolvedValue(workoutFixtures.pushWorkout);
      
      mockUseWorkoutStore.mockReturnValue({
        workouts: [workoutFixtures.templateWorkout],
        currentWorkout: null,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: mockCreateWorkout,
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<TemplateCreationFlow />);

      await userEvent.click(screen.getByText(/use template/i));
      await userEvent.click(screen.getByText(workoutFixtures.templateWorkout.name));

      expect(mockCreateWorkout).toHaveBeenCalledWith(
        expect.objectContaining({
          template_id: workoutFixtures.templateWorkout.id,
          exercises: workoutFixtures.templateWorkout.exercises,
        })
      );
    });
  });

  describe('Workout Execution', () => {
    it('should start a workout', async () => {
      const user = userEvent.setup();
      const mockStartWorkout = vi.fn().mockResolvedValue({
        ...workoutFixtures.pushWorkout,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      });

      mockUseWorkoutStore.mockReturnValue({
        workouts: [workoutFixtures.pushWorkout],
        currentWorkout: workoutFixtures.pushWorkout,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: mockStartWorkout,
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<WorkoutPlayer workout={workoutFixtures.pushWorkout} />);

      await user.click(screen.getByRole('button', { name: /start workout/i }));

      expect(mockStartWorkout).toHaveBeenCalledWith(workoutFixtures.pushWorkout.id);
    });

    it('should log a set', async () => {
      const user = userEvent.setup();
      const mockLogSet = vi.fn().mockResolvedValue(true);
      const workoutInProgress = {
        ...workoutFixtures.pushWorkout,
        status: 'in_progress' as const,
        started_at: new Date().toISOString(),
      };

      mockUseWorkoutStore.mockReturnValue({
        workouts: [workoutInProgress],
        currentWorkout: workoutInProgress,
        isWorkoutActive: true,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: mockLogSet,
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<WorkoutPlayer workout={workoutInProgress} />);

      // Find the first set input fields
      const weightInput = screen.getByLabelText(/weight/i);
      const repsInput = screen.getByLabelText(/reps/i);
      const logButton = screen.getByRole('button', { name: /log set/i });

      await user.type(weightInput, '100');
      await user.type(repsInput, '8');
      await user.click(logButton);

      expect(mockLogSet).toHaveBeenCalledWith(
        workoutInProgress.id,
        workoutInProgress.exercises[0].id,
        expect.objectContaining({
          weight: 100,
          reps: 8,
          type: 'normal',
        })
      );
    });

    it('should validate set data before logging', async () => {
      const user = userEvent.setup();
      const workoutInProgress = {
        ...workoutFixtures.pushWorkout,
        status: 'in_progress' as const,
        started_at: new Date().toISOString(),
      };

      mockUseWorkoutStore.mockReturnValue({
        workouts: [workoutInProgress],
        currentWorkout: workoutInProgress,
        isWorkoutActive: true,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<WorkoutPlayer workout={workoutInProgress} />);

      // Try to log set without weight
      const repsInput = screen.getByLabelText(/reps/i);
      const logButton = screen.getByRole('button', { name: /log set/i });

      await user.type(repsInput, '8');
      await user.click(logButton);

      await waitFor(() => {
        expect(screen.getByText(/weight is required/i)).toBeInTheDocument();
      });
    });

    it('should complete a workout', async () => {
      const user = userEvent.setup();
      const mockCompleteWorkout = vi.fn().mockResolvedValue({
        ...workoutFixtures.completedWorkout,
        completed_at: new Date().toISOString(),
      });

      const workoutInProgress = {
        ...workoutFixtures.pushWorkout,
        status: 'in_progress' as const,
        started_at: new Date().toISOString(),
        exercises: [
          {
            ...workoutFixtures.pushWorkout.exercises[0],
            sets: workoutFixtures.pushWorkout.exercises[0].sets.map(set => ({
              ...set,
              completed: true,
            })),
          },
        ],
      };

      mockUseWorkoutStore.mockReturnValue({
        workouts: [workoutInProgress],
        currentWorkout: workoutInProgress,
        isWorkoutActive: true,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: mockCompleteWorkout,
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<WorkoutPlayer workout={workoutInProgress} />);

      await user.click(screen.getByRole('button', { name: /complete workout/i }));

      expect(mockCompleteWorkout).toHaveBeenCalledWith(workoutInProgress.id);
    });

    it('should pause and resume workout', async () => {
      const user = userEvent.setup();
      const mockPauseWorkout = vi.fn();
      const mockResumeWorkout = vi.fn();

      const workoutInProgress = {
        ...workoutFixtures.pushWorkout,
        status: 'in_progress' as const,
        started_at: new Date().toISOString(),
      };

      mockUseWorkoutStore.mockReturnValue({
        workouts: [workoutInProgress],
        currentWorkout: workoutInProgress,
        isWorkoutActive: true,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: mockPauseWorkout,
        resumeWorkout: mockResumeWorkout,
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<WorkoutPlayer workout={workoutInProgress} />);

      // Pause workout
      await user.click(screen.getByRole('button', { name: /pause/i }));
      expect(mockPauseWorkout).toHaveBeenCalledWith(workoutInProgress.id);

      // Resume workout
      await user.click(screen.getByRole('button', { name: /resume/i }));
      expect(mockResumeWorkout).toHaveBeenCalledWith(workoutInProgress.id);
    });
  });

  describe('Exercise Management', () => {
    it('should add exercise to workout', async () => {
      const user = userEvent.setup();
      const mockAddExercise = vi.fn();

      mockUseWorkoutStore.mockReturnValue({
        workouts: [workoutFixtures.emptyWorkout],
        currentWorkout: workoutFixtures.emptyWorkout,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: mockAddExercise,
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<WorkoutPlayer workout={workoutFixtures.emptyWorkout} />);

      await user.click(screen.getByRole('button', { name: /add exercise/i }));
      await user.click(screen.getByText(exerciseFixtures.benchPress.name));

      expect(mockAddExercise).toHaveBeenCalledWith(
        workoutFixtures.emptyWorkout.id,
        exerciseFixtures.benchPress.id
      );
    });

    it('should remove exercise from workout', async () => {
      const user = userEvent.setup();
      const mockRemoveExercise = vi.fn();

      mockUseWorkoutStore.mockReturnValue({
        workouts: [workoutFixtures.pushWorkout],
        currentWorkout: workoutFixtures.pushWorkout,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: mockRemoveExercise,
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<WorkoutPlayer workout={workoutFixtures.pushWorkout} />);

      const removeButton = screen.getByRole('button', { name: /remove exercise/i });
      await user.click(removeButton);

      expect(mockRemoveExercise).toHaveBeenCalledWith(
        workoutFixtures.pushWorkout.id,
        workoutFixtures.pushWorkout.exercises[0].id
      );
    });

    it('should reorder exercises', async () => {
      const user = userEvent.setup();
      const mockUpdateWorkout = vi.fn();

      mockUseWorkoutStore.mockReturnValue({
        workouts: [workoutFixtures.pushWorkout],
        currentWorkout: workoutFixtures.pushWorkout,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: mockUpdateWorkout,
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<WorkoutPlayer workout={workoutFixtures.pushWorkout} />);

      // Simulate drag and drop reordering
      const moveUpButton = screen.getByRole('button', { name: /move up/i });
      await user.click(moveUpButton);

      expect(mockUpdateWorkout).toHaveBeenCalledWith(
        workoutFixtures.pushWorkout.id,
        expect.objectContaining({
          exercises: expect.arrayContaining([
            expect.objectContaining({ order: expect.any(Number) }),
          ]),
        })
      );
    });
  });

  describe('Workout History', () => {
    it('should display workout history', () => {
      const workouts = [
        workoutFixtures.completedWorkout,
        { ...workoutFixtures.completedWorkout, id: 'workout-2', name: 'Pull Day' },
      ];

      mockUseWorkoutStore.mockReturnValue({
        workouts,
        currentWorkout: null,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<WorkoutHistory />);

      expect(screen.getByText(workoutFixtures.completedWorkout.name)).toBeInTheDocument();
      expect(screen.getByText('Pull Day')).toBeInTheDocument();
    });

    it('should filter workouts by date range', async () => {
      const user = userEvent.setup();
      const workouts = [
        { ...workoutFixtures.completedWorkout, completed_at: '2024-01-15T10:00:00.000Z' },
        { ...workoutFixtures.completedWorkout, id: 'workout-2', completed_at: '2024-01-10T10:00:00.000Z' },
        { ...workoutFixtures.completedWorkout, id: 'workout-3', completed_at: '2024-01-05T10:00:00.000Z' },
      ];

      mockUseWorkoutStore.mockReturnValue({
        workouts,
        currentWorkout: null,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<WorkoutHistory />);

      // Filter by last week
      await user.click(screen.getByRole('button', { name: /last week/i }));

      // Should show only workouts from the last week
      expect(screen.getByText(/2 workouts/i)).toBeInTheDocument();
    });

    it('should search workouts by name', async () => {
      const user = userEvent.setup();
      const workouts = [
        workoutFixtures.completedWorkout,
        { ...workoutFixtures.completedWorkout, id: 'workout-2', name: 'Pull Day' },
        { ...workoutFixtures.completedWorkout, id: 'workout-3', name: 'Leg Day' },
      ];

      mockUseWorkoutStore.mockReturnValue({
        workouts,
        currentWorkout: null,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<WorkoutHistory />);

      const searchInput = screen.getByPlaceholderText(/search workouts/i);
      await user.type(searchInput, 'Push');

      await waitFor(() => {
        expect(screen.getByText(workoutFixtures.completedWorkout.name)).toBeInTheDocument();
        expect(screen.queryByText('Pull Day')).not.toBeInTheDocument();
        expect(screen.queryByText('Leg Day')).not.toBeInTheDocument();
      });
    });
  });

  describe('Template Management', () => {
    it('should create workout template', async () => {
      const user = userEvent.setup();
      const mockCreateWorkout = vi.fn().mockResolvedValue({
        ...workoutFixtures.templateWorkout,
        is_template: true,
      });

      mockUseWorkoutStore.mockReturnValue({
        workouts: [],
        currentWorkout: null,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: mockCreateWorkout,
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<TemplateCreationFlow />);

      await user.type(screen.getByLabelText(/template name/i), 'Push Day Template');
      await user.click(screen.getByLabelText(/save as template/i));
      await user.click(screen.getByRole('button', { name: /create template/i }));

      expect(mockCreateWorkout).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Push Day Template',
          is_template: true,
        })
      );
    });

    it('should edit existing template', async () => {
      const user = userEvent.setup();
      const mockUpdateWorkout = vi.fn();

      mockUseWorkoutStore.mockReturnValue({
        workouts: [workoutFixtures.templateWorkout],
        currentWorkout: workoutFixtures.templateWorkout,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: mockUpdateWorkout,
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<TemplateCreationFlow template={workoutFixtures.templateWorkout} />);

      const nameInput = screen.getByDisplayValue(workoutFixtures.templateWorkout.name);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Template Name');
      await user.click(screen.getByRole('button', { name: /save template/i }));

      expect(mockUpdateWorkout).toHaveBeenCalledWith(
        workoutFixtures.templateWorkout.id,
        expect.objectContaining({
          name: 'Updated Template Name',
        })
      );
    });
  });

  describe('Performance', () => {
    it('should render workout player within performance budget', () => {
      const startTime = performance.now();
      render(<WorkoutPlayer workout={workoutFixtures.pushWorkout} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 100ms budget
    });

    it('should handle large workout history efficiently', () => {
      const largeWorkoutList = Array.from({ length: 1000 }, (_, i) => ({
        ...workoutFixtures.completedWorkout,
        id: `workout-${i}`,
        name: `Workout ${i}`,
      }));

      mockUseWorkoutStore.mockReturnValue({
        workouts: largeWorkoutList,
        currentWorkout: null,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: vi.fn(),
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      const startTime = performance.now();
      render(<WorkoutHistory />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // 500ms budget for large lists
    });
  });

  describe('Offline Support', () => {
    it('should work offline', async () => {
      // Simulate offline mode
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const mockCreateWorkout = vi.fn().mockResolvedValue(workoutFixtures.emptyWorkout);
      
      mockUseWorkoutStore.mockReturnValue({
        workouts: [],
        currentWorkout: null,
        isWorkoutActive: false,
        isLoading: false,
        error: null,
        createWorkout: mockCreateWorkout,
        updateWorkout: vi.fn(),
        deleteWorkout: vi.fn(),
        startWorkout: vi.fn(),
        completeWorkout: vi.fn(),
        pauseWorkout: vi.fn(),
        resumeWorkout: vi.fn(),
        logSet: vi.fn(),
        addExercise: vi.fn(),
        removeExercise: vi.fn(),
        getWorkouts: vi.fn(),
        getWorkout: vi.fn(),
      });

      render(<TemplateCreationFlow />);

      // Should still be able to create workouts offline
      await userEvent.type(screen.getByLabelText(/workout name/i), 'Offline Workout');
      await userEvent.click(screen.getByRole('button', { name: /create workout/i }));

      expect(mockCreateWorkout).toHaveBeenCalled();
    });

    it('should sync data when coming back online', async () => {
      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      // Trigger online event
      window.dispatchEvent(new Event('online'));

      // Should trigger sync
      expect(mockWorkoutService.sync).toHaveBeenCalled();
    });
  });
});