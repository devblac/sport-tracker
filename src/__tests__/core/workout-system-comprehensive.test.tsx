/**
 * Comprehensive Workout System Tests
 * Tests workout creation, execution, completion, and all related features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { WorkoutPlayer } from '@/components/workouts/WorkoutPlayer';
import { TemplateCreationFlow } from '@/components/workouts/TemplateCreationFlow';
import { WorkoutHistory } from '@/components/workouts/WorkoutHistory';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { createMockWorkout, createMockExercise, createMockUser } from '@/test/test-factories';

// Mock services at the top level
vi.mock('@/services/WorkoutService', () => ({
  workoutService: {
    createWorkout: vi.fn(),
    updateWorkout: vi.fn(),
    deleteWorkout: vi.fn(),
    getWorkouts: vi.fn(),
    startWorkout: vi.fn(),
    pauseWorkout: vi.fn(),
    resumeWorkout: vi.fn(),
    completeWorkout: vi.fn(),
    saveSet: vi.fn(),
    getWorkoutTemplates: vi.fn(),
    createTemplate: vi.fn()
  }
}));

vi.mock('@/services/ExerciseService', () => ({
  exerciseService: {
    getExercises: vi.fn(),
    getExerciseById: vi.fn(),
    searchExercises: vi.fn()
  }
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}));

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Workout System', () => {
  const user = userEvent.setup();
  let mockUser: any;
  let mockWorkout: any;
  let mockExercises: any[];
  let mockWorkoutService: any;
  let mockExerciseService: any;

  beforeEach(async () => {
    // Import the mocked services
    const { workoutService } = await import('@/services/WorkoutService');
    const { exerciseService } = await import('@/services/ExerciseService');
    mockWorkoutService = workoutService;
    mockExerciseService = exerciseService;

    mockUser = createMockUser();
    mockWorkout = createMockWorkout({ user_id: mockUser.id });
    mockExercises = Array.from({ length: 5 }, () => createMockExercise());

    // Reset mocks
    vi.clearAllMocks();
    
    // Reset workout store
    useWorkoutStore.getState().clearWorkouts();
    
    // Setup default mock responses
    mockExerciseService.getExercises.mockResolvedValue(mockExercises);
    mockWorkoutService.getWorkouts.mockResolvedValue([mockWorkout]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Workout Creation', () => {
    it('should create a new workout with exercises', async () => {
      const newWorkout = createMockWorkout({ 
        name: 'New Test Workout',
        exercises: []
      });
      
      mockWorkoutService.createWorkout.mockResolvedValue(newWorkout);

      render(
        <TestWrapper>
          <TemplateCreationFlow />
        </TestWrapper>
      );

      // Enter workout name
      const nameInput = screen.getByLabelText(/workout name/i);
      await user.type(nameInput, 'New Test Workout');

      // Add exercises
      const addExerciseButton = screen.getByRole('button', { name: /add exercise/i });
      await user.click(addExerciseButton);

      // Select first exercise
      const exerciseOption = screen.getByText(mockExercises[0].name);
      await user.click(exerciseOption);

      // Configure sets
      const setsInput = screen.getByLabelText(/sets/i);
      await user.clear(setsInput);
      await user.type(setsInput, '3');

      // Save workout
      const saveButton = screen.getByRole('button', { name: /save workout/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockWorkoutService.createWorkout).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Test Workout',
            exercises: expect.arrayContaining([
              expect.objectContaining({
                exercise_id: mockExercises[0].id,
                sets: expect.any(Array)
              })
            ])
          })
        );
      });
    });

    it('should validate workout name is required', async () => {
      render(
        <TestWrapper>
          <TemplateCreationFlow />
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: /save workout/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/workout name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate at least one exercise is required', async () => {
      render(
        <TestWrapper>
          <TemplateCreationFlow />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/workout name/i);
      await user.type(nameInput, 'Empty Workout');

      const saveButton = screen.getByRole('button', { name: /save workout/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/at least one exercise is required/i)).toBeInTheDocument();
      });
    });

    it('should allow reordering exercises', async () => {
      render(
        <TestWrapper>
          <TemplateCreationFlow />
        </TestWrapper>
      );

      // Add multiple exercises
      const addExerciseButton = screen.getByRole('button', { name: /add exercise/i });
      
      await user.click(addExerciseButton);
      await user.click(screen.getByText(mockExercises[0].name));
      
      await user.click(addExerciseButton);
      await user.click(screen.getByText(mockExercises[1].name));

      // Find drag handles and simulate reordering
      const dragHandles = screen.getAllByLabelText(/drag to reorder/i);
      expect(dragHandles).toHaveLength(2);

      // Simulate drag and drop (simplified)
      fireEvent.dragStart(dragHandles[0]);
      fireEvent.dragOver(dragHandles[1]);
      fireEvent.drop(dragHandles[1]);

      // Verify order changed
      const exerciseItems = screen.getAllByTestId(/exercise-item/i);
      expect(exerciseItems[0]).toHaveTextContent(mockExercises[1].name);
      expect(exerciseItems[1]).toHaveTextContent(mockExercises[0].name);
    });
  });

  describe('Workout Execution', () => {
    beforeEach(() => {
      // Setup workout in progress
      useWorkoutStore.getState().setCurrentWorkout(mockWorkout);
    });

    it('should start a workout successfully', async () => {
      mockWorkoutService.startWorkout.mockResolvedValue({
        ...mockWorkout,
        status: 'in_progress',
        started_at: new Date().toISOString()
      });

      render(
        <TestWrapper>
          <WorkoutPlayer workout={mockWorkout} />
        </TestWrapper>
      );

      const startButton = screen.getByRole('button', { name: /start workout/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(mockWorkoutService.startWorkout).toHaveBeenCalledWith(mockWorkout.id);
        expect(screen.getByText(/workout in progress/i)).toBeInTheDocument();
      });
    });

    it('should track exercise sets correctly', async () => {
      const workoutInProgress = {
        ...mockWorkout,
        status: 'in_progress',
        started_at: new Date().toISOString()
      };

      mockWorkoutService.saveSet.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <WorkoutPlayer workout={workoutInProgress} />
        </TestWrapper>
      );

      // Find first exercise set inputs
      const repsInput = screen.getByLabelText(/reps for set 1/i);
      const weightInput = screen.getByLabelText(/weight for set 1/i);
      const completeSetButton = screen.getByRole('button', { name: /complete set 1/i });

      // Enter set data
      await user.type(repsInput, '10');
      await user.type(weightInput, '135');
      await user.click(completeSetButton);

      await waitFor(() => {
        expect(mockWorkoutService.saveSet).toHaveBeenCalledWith(
          expect.objectContaining({
            reps: 10,
            weight: 135,
            completed: true
          })
        );
      });
    });

    it('should handle rest timer between sets', async () => {
      const workoutInProgress = {
        ...mockWorkout,
        status: 'in_progress'
      };

      render(
        <TestWrapper>
          <WorkoutPlayer workout={workoutInProgress} />
        </TestWrapper>
      );

      // Complete first set to trigger rest timer
      const completeSetButton = screen.getByRole('button', { name: /complete set 1/i });
      await user.click(completeSetButton);

      await waitFor(() => {
        expect(screen.getByText(/rest time/i)).toBeInTheDocument();
        expect(screen.getByTestId('rest-timer')).toBeInTheDocument();
      });

      // Should show skip rest option
      expect(screen.getByRole('button', { name: /skip rest/i })).toBeInTheDocument();
    });

    it('should pause and resume workout', async () => {
      const workoutInProgress = {
        ...mockWorkout,
        status: 'in_progress'
      };

      mockWorkoutService.pauseWorkout.mockResolvedValue({
        ...workoutInProgress,
        status: 'paused'
      });

      mockWorkoutService.resumeWorkout.mockResolvedValue({
        ...workoutInProgress,
        status: 'in_progress'
      });

      render(
        <TestWrapper>
          <WorkoutPlayer workout={workoutInProgress} />
        </TestWrapper>
      );

      // Pause workout
      const pauseButton = screen.getByRole('button', { name: /pause workout/i });
      await user.click(pauseButton);

      await waitFor(() => {
        expect(mockWorkoutService.pauseWorkout).toHaveBeenCalledWith(mockWorkout.id);
        expect(screen.getByText(/workout paused/i)).toBeInTheDocument();
      });

      // Resume workout
      const resumeButton = screen.getByRole('button', { name: /resume workout/i });
      await user.click(resumeButton);

      await waitFor(() => {
        expect(mockWorkoutService.resumeWorkout).toHaveBeenCalledWith(mockWorkout.id);
        expect(screen.getByText(/workout in progress/i)).toBeInTheDocument();
      });
    });

    it('should complete workout and show summary', async () => {
      const completedWorkout = {
        ...mockWorkout,
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds: 3600,
        total_volume: 5000
      };

      mockWorkoutService.completeWorkout.mockResolvedValue(completedWorkout);

      render(
        <TestWrapper>
          <WorkoutPlayer workout={mockWorkout} />
        </TestWrapper>
      );

      const completeButton = screen.getByRole('button', { name: /complete workout/i });
      await user.click(completeButton);

      await waitFor(() => {
        expect(mockWorkoutService.completeWorkout).toHaveBeenCalledWith(mockWorkout.id);
        expect(screen.getByText(/workout completed/i)).toBeInTheDocument();
        expect(screen.getByText(/1 hour/i)).toBeInTheDocument(); // Duration
        expect(screen.getByText(/5,000/i)).toBeInTheDocument(); // Volume
      });
    });
  });

  describe('Workout Templates', () => {
    it('should create template from workout', async () => {
      const template = {
        ...mockWorkout,
        is_template: true,
        name: 'My Template'
      };

      mockWorkoutService.createTemplate.mockResolvedValue(template);

      render(
        <TestWrapper>
          <WorkoutHistory workouts={[mockWorkout]} />
        </TestWrapper>
      );

      // Find workout item and template action
      const workoutItem = screen.getByTestId(`workout-${mockWorkout.id}`);
      const templateButton = within(workoutItem).getByRole('button', { name: /save as template/i });
      
      await user.click(templateButton);

      // Enter template name
      const nameInput = screen.getByLabelText(/template name/i);
      await user.type(nameInput, 'My Template');

      const saveButton = screen.getByRole('button', { name: /save template/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockWorkoutService.createTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Template',
            exercises: mockWorkout.exercises
          })
        );
      });
    });

    it('should load workout from template', async () => {
      const template = {
        ...mockWorkout,
        is_template: true,
        name: 'Leg Day Template'
      };

      mockWorkoutService.getWorkoutTemplates.mockResolvedValue([template]);

      render(
        <TestWrapper>
          <TemplateCreationFlow />
        </TestWrapper>
      );

      const templatesTab = screen.getByRole('tab', { name: /templates/i });
      await user.click(templatesTab);

      await waitFor(() => {
        expect(screen.getByText('Leg Day Template')).toBeInTheDocument();
      });

      const useTemplateButton = screen.getByRole('button', { name: /use template/i });
      await user.click(useTemplateButton);

      // Should populate form with template data
      expect(screen.getByDisplayValue('Leg Day Template')).toBeInTheDocument();
      expect(screen.getAllByTestId(/exercise-item/i)).toHaveLength(template.exercises.length);
    });
  });

  describe('Workout History', () => {
    it('should display workout history with filters', async () => {
      const workouts = [
        createMockWorkout({ name: 'Push Day', status: 'completed' }),
        createMockWorkout({ name: 'Pull Day', status: 'completed' }),
        createMockWorkout({ name: 'Leg Day', status: 'in_progress' })
      ];

      mockWorkoutService.getWorkouts.mockResolvedValue(workouts);

      render(
        <TestWrapper>
          <WorkoutHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Push Day')).toBeInTheDocument();
        expect(screen.getByText('Pull Day')).toBeInTheDocument();
        expect(screen.getByText('Leg Day')).toBeInTheDocument();
      });

      // Test status filter
      const statusFilter = screen.getByLabelText(/filter by status/i);
      await user.selectOptions(statusFilter, 'completed');

      await waitFor(() => {
        expect(screen.getByText('Push Day')).toBeInTheDocument();
        expect(screen.getByText('Pull Day')).toBeInTheDocument();
        expect(screen.queryByText('Leg Day')).not.toBeInTheDocument();
      });
    });

    it('should show workout statistics', async () => {
      const workouts = Array.from({ length: 10 }, () => 
        createMockWorkout({ 
          status: 'completed',
          duration_seconds: 3600,
          total_volume: 5000
        })
      );

      mockWorkoutService.getWorkouts.mockResolvedValue(workouts);

      render(
        <TestWrapper>
          <WorkoutHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/10 workouts completed/i)).toBeInTheDocument();
        expect(screen.getByText(/50,000 total volume/i)).toBeInTheDocument();
        expect(screen.getByText(/1 hour average duration/i)).toBeInTheDocument();
      });
    });

    it('should allow deleting workouts', async () => {
      mockWorkoutService.deleteWorkout.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <WorkoutHistory workouts={[mockWorkout]} />
        </TestWrapper>
      );

      const deleteButton = screen.getByRole('button', { name: /delete workout/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockWorkoutService.deleteWorkout).toHaveBeenCalledWith(mockWorkout.id);
      });
    });
  });

  describe('Exercise Management', () => {
    it('should search and filter exercises', async () => {
      mockExerciseService.searchExercises.mockResolvedValue([mockExercises[0]]);

      render(
        <TestWrapper>
          <TemplateCreationFlow />
        </TestWrapper>
      );

      const addExerciseButton = screen.getByRole('button', { name: /add exercise/i });
      await user.click(addExerciseButton);

      const searchInput = screen.getByLabelText(/search exercises/i);
      await user.type(searchInput, 'push');

      await waitFor(() => {
        expect(mockExerciseService.searchExercises).toHaveBeenCalledWith('push');
        expect(screen.getByText(mockExercises[0].name)).toBeInTheDocument();
      });
    });

    it('should filter exercises by category', async () => {
      render(
        <TestWrapper>
          <TemplateCreationFlow />
        </TestWrapper>
      );

      const addExerciseButton = screen.getByRole('button', { name: /add exercise/i });
      await user.click(addExerciseButton);

      const categoryFilter = screen.getByLabelText(/filter by category/i);
      await user.selectOptions(categoryFilter, 'strength');

      const strengthExercises = mockExercises.filter(ex => ex.category === 'strength');
      
      await waitFor(() => {
        strengthExercises.forEach(exercise => {
          expect(screen.getByText(exercise.name)).toBeInTheDocument();
        });
      });
    });

    it('should show exercise details and instructions', async () => {
      render(
        <TestWrapper>
          <TemplateCreationFlow />
        </TestWrapper>
      );

      const addExerciseButton = screen.getByRole('button', { name: /add exercise/i });
      await user.click(addExerciseButton);

      const exerciseItem = screen.getByText(mockExercises[0].name);
      await user.click(exerciseItem);

      await waitFor(() => {
        expect(screen.getByText(mockExercises[0].instructions)).toBeInTheDocument();
        expect(screen.getByText(/difficulty: /i)).toBeInTheDocument();
        expect(screen.getByText(/equipment: /i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tracking', () => {
    it('should track personal records', async () => {
      const workoutWithPR = {
        ...mockWorkout,
        exercises: [{
          ...mockWorkout.exercises[0],
          sets: [{
            reps: 10,
            weight: 200, // New PR
            completed: true
          }]
        }]
      };

      render(
        <TestWrapper>
          <WorkoutPlayer workout={workoutWithPR} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/new personal record/i)).toBeInTheDocument();
        expect(screen.getByText(/200 lbs/i)).toBeInTheDocument();
      });
    });

    it('should calculate and display workout metrics', async () => {
      const completedWorkout = {
        ...mockWorkout,
        status: 'completed',
        duration_seconds: 3600,
        total_volume: 5000,
        exercises: mockWorkout.exercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(set => ({ ...set, completed: true }))
        }))
      };

      render(
        <TestWrapper>
          <WorkoutPlayer workout={completedWorkout} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/duration: 1 hour/i)).toBeInTheDocument();
        expect(screen.getByText(/volume: 5,000 lbs/i)).toBeInTheDocument();
        expect(screen.getByText(/sets completed: /i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle workout creation errors', async () => {
      mockWorkoutService.createWorkout.mockRejectedValue(new Error('Failed to save workout'));

      render(
        <TestWrapper>
          <TemplateCreationFlow />
        </TestWrapper>
      );

      const nameInput = screen.getByLabelText(/workout name/i);
      await user.type(nameInput, 'Test Workout');

      const saveButton = screen.getByRole('button', { name: /save workout/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to save workout/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      mockWorkoutService.getWorkouts.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <WorkoutHistory />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/unable to load workouts/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should recover from auto-save failures', async () => {
      mockWorkoutService.saveSet.mockRejectedValueOnce(new Error('Save failed'))
        .mockResolvedValueOnce({ success: true });

      const workoutInProgress = {
        ...mockWorkout,
        status: 'in_progress'
      };

      render(
        <TestWrapper>
          <WorkoutPlayer workout={workoutInProgress} />
        </TestWrapper>
      );

      const completeSetButton = screen.getByRole('button', { name: /complete set 1/i });
      await user.click(completeSetButton);

      await waitFor(() => {
        expect(screen.getByText(/auto-save failed/i)).toBeInTheDocument();
      });

      // Should retry automatically
      await waitFor(() => {
        expect(mockWorkoutService.saveSet).toHaveBeenCalledTimes(2);
      }, { timeout: 3000 });
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <WorkoutPlayer workout={mockWorkout} />
        </TestWrapper>
      );

      const startButton = screen.getByRole('button', { name: /start workout/i });
      startButton.focus();
      
      expect(document.activeElement).toBe(startButton);

      // Should be able to navigate with Tab
      await user.tab();
      expect(document.activeElement).not.toBe(startButton);
    });

    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <WorkoutPlayer workout={mockWorkout} />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', /workout player/i);
      expect(screen.getByLabelText(/current exercise/i)).toBeInTheDocument();
    });

    it('should announce workout progress to screen readers', async () => {
      const workoutInProgress = {
        ...mockWorkout,
        status: 'in_progress'
      };

      render(
        <TestWrapper>
          <WorkoutPlayer workout={workoutInProgress} />
        </TestWrapper>
      );

      const completeSetButton = screen.getByRole('button', { name: /complete set 1/i });
      await user.click(completeSetButton);

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/set 1 completed/i);
      });
    });
  });
});