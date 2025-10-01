import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutPlayer } from '@/components/workouts/WorkoutPlayer';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { useWorkoutStore } from '@/stores/useWorkoutStore';

// Mock the workout store
vi.mock('@/stores/useWorkoutStore');

// Mock timer hooks
vi.mock('@/hooks/useTimer', () => ({
  useTimer: () => ({
    time: 0,
    isRunning: false,
    start: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
    formatTime: (time: number) => `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`
  })
}));

const mockWorkout = {
  id: 'workout-1',
  user_id: 'user-1',
  name: 'Test Workout',
  status: 'in_progress' as const,
  exercises: [
    {
      id: 'exercise-1',
      exercise_id: 'bench-press',
      name: 'Bench Press',
      sets: [
        { id: 'set-1', weight: 80, reps: 10, type: 'normal', completed: true },
        { id: 'set-2', weight: 80, reps: 8, type: 'normal', completed: false }
      ]
    }
  ],
  started_at: new Date().toISOString(),
  completed_at: null,
  is_template: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockWorkoutStore = {
  currentWorkout: mockWorkout,
  isWorkoutActive: true,
  logSet: vi.fn(),
  completeSet: vi.fn(),
  addExercise: vi.fn(),
  removeExercise: vi.fn(),
  completeWorkout: vi.fn(),
  pauseWorkout: vi.fn(),
  resumeWorkout: vi.fn(),
  saveWorkout: vi.fn()
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <WorkoutProvider>
      {component}
    </WorkoutProvider>
  );
};

describe('WorkoutPlayer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useWorkoutStore as any).mockReturnValue(mockWorkoutStore);
  });

  it('renders workout information correctly', () => {
    renderWithProvider(<WorkoutPlayer />);
    
    expect(screen.getByText('Test Workout')).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('displays exercise sets with correct status', () => {
    renderWithProvider(<WorkoutPlayer />);
    
    const sets = screen.getAllByTestId(/set-\d+/);
    expect(sets).toHaveLength(2);
    
    // First set should be completed
    expect(sets[0]).toHaveClass('completed');
    
    // Second set should be pending
    expect(sets[1]).not.toHaveClass('completed');
  });

  it('allows logging a new set', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkoutPlayer />);
    
    // Fill in set data
    const weightInput = screen.getByLabelText(/weight/i);
    const repsInput = screen.getByLabelText(/reps/i);
    const logButton = screen.getByRole('button', { name: /log set/i });
    
    await user.clear(weightInput);
    await user.type(weightInput, '85');
    await user.clear(repsInput);
    await user.type(repsInput, '8');
    await user.click(logButton);
    
    expect(mockWorkoutStore.logSet).toHaveBeenCalledWith(
      'exercise-1',
      expect.objectContaining({
        weight: 85,
        reps: 8,
        type: 'normal'
      })
    );
  });

  it('handles different set types', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkoutPlayer />);
    
    const setTypeSelect = screen.getByLabelText(/set type/i);
    await user.selectOptions(setTypeSelect, 'failure');
    
    const logButton = screen.getByRole('button', { name: /log set/i });
    await user.click(logButton);
    
    expect(mockWorkoutStore.logSet).toHaveBeenCalledWith(
      'exercise-1',
      expect.objectContaining({
        type: 'failure'
      })
    );
  });

  it('shows rest timer after logging a set', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkoutPlayer />);
    
    const logButton = screen.getByRole('button', { name: /log set/i });
    await user.click(logButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('rest-timer')).toBeInTheDocument();
    });
  });

  it('allows adding new exercises', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkoutPlayer />);
    
    const addExerciseButton = screen.getByRole('button', { name: /add exercise/i });
    await user.click(addExerciseButton);
    
    expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();
  });

  it('handles workout completion', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkoutPlayer />);
    
    const completeButton = screen.getByRole('button', { name: /complete workout/i });
    await user.click(completeButton);
    
    // Should show confirmation dialog
    expect(screen.getByText(/complete workout/i)).toBeInTheDocument();
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);
    
    expect(mockWorkoutStore.completeWorkout).toHaveBeenCalled();
  });

  it('handles workout pause and resume', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkoutPlayer />);
    
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    await user.click(pauseButton);
    
    expect(mockWorkoutStore.pauseWorkout).toHaveBeenCalled();
    
    const resumeButton = screen.getByRole('button', { name: /resume/i });
    await user.click(resumeButton);
    
    expect(mockWorkoutStore.resumeWorkout).toHaveBeenCalled();
  });

  it('validates set input before logging', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkoutPlayer />);
    
    const logButton = screen.getByRole('button', { name: /log set/i });
    
    // Try to log without weight/reps
    await user.click(logButton);
    
    expect(screen.getByText(/weight is required/i)).toBeInTheDocument();
    expect(screen.getByText(/reps is required/i)).toBeInTheDocument();
    expect(mockWorkoutStore.logSet).not.toHaveBeenCalled();
  });

  it('shows previous set data for reference', () => {
    renderWithProvider(<WorkoutPlayer />);
    
    expect(screen.getByText(/previous: 80kg × 10/i)).toBeInTheDocument();
  });

  it('handles empty workout state', () => {
    (useWorkoutStore as any).mockReturnValue({
      ...mockWorkoutStore,
      currentWorkout: null,
      isWorkoutActive: false
    });
    
    renderWithProvider(<WorkoutPlayer />);
    
    expect(screen.getByText(/no active workout/i)).toBeInTheDocument();
  });

  it('auto-saves workout progress', async () => {
    const user = userEvent.setup();
    renderWithProvider(<WorkoutPlayer />);
    
    const weightInput = screen.getByLabelText(/weight/i);
    await user.type(weightInput, '85');
    
    // Should auto-save after input
    await waitFor(() => {
      expect(mockWorkoutStore.saveWorkout).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});