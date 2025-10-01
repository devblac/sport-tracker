import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { GamificationProvider } from '@/contexts/GamificationContext';
import { WorkoutPlayer } from '@/components/workouts/WorkoutPlayer';
import { XPDisplay } from '@/components/gamification/XPDisplay';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { useGamificationStore } from '@/stores/useGamificationStore';

// Mock stores
vi.mock('@/stores/useWorkoutStore');
vi.mock('@/stores/useGamificationStore');

const mockWorkoutStore = {
  currentWorkout: {
    id: 'workout-1',
    user_id: 'user-1',
    name: 'Test Workout',
    status: 'in_progress',
    exercises: [
      {
        id: 'exercise-1',
        exercise_id: 'bench-press',
        name: 'Bench Press',
        sets: []
      }
    ]
  },
  logSet: vi.fn(),
  completeWorkout: vi.fn(),
  isWorkoutActive: true
};

const mockGamificationStore = {
  userStats: {
    level: 5,
    totalXP: 1250,
    currentStreak: 3
  },
  awardXP: vi.fn(),
  checkAchievements: vi.fn(),
  updateStreak: vi.fn(),
  recentXPGains: []
};

const TestComponent = () => (
  <WorkoutProvider>
    <GamificationProvider>
      <div>
        <WorkoutPlayer />
        <XPDisplay />
      </div>
    </GamificationProvider>
  </WorkoutProvider>
);

describe('Workout-Gamification Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useWorkoutStore as any).mockReturnValue(mockWorkoutStore);
    (useGamificationStore as any).mockReturnValue(mockGamificationStore);
  });

  it('should award XP when logging a set', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    // Log a set
    const weightInput = screen.getByLabelText(/weight/i);
    const repsInput = screen.getByLabelText(/reps/i);
    const logButton = screen.getByRole('button', { name: /log set/i });

    await user.type(weightInput, '80');
    await user.type(repsInput, '10');
    await user.click(logButton);

    // Should award XP for the set
    await waitFor(() => {
      expect(mockGamificationStore.awardXP).toHaveBeenCalledWith(
        'set_completed',
        expect.objectContaining({
          weight: 80,
          reps: 10
        })
      );
    });
  });

  it('should award bonus XP for personal records', async () => {
    const user = userEvent.setup();
    
    // Mock PR detection
    mockWorkoutStore.logSet.mockImplementation(() => {
      // Simulate PR detection
      mockGamificationStore.awardXP.mockImplementation((type, data) => {
        if (type === 'personal_record') {
          return { xp: 100, reason: 'New PR!' };
        }
        return { xp: 10, reason: 'Set completed' };
      });
    });

    render(<TestComponent />);

    const weightInput = screen.getByLabelText(/weight/i);
    const repsInput = screen.getByLabelText(/reps/i);
    const logButton = screen.getByRole('button', { name: /log set/i });

    await user.type(weightInput, '120'); // Heavy weight for PR
    await user.type(repsInput, '5');
    await user.click(logButton);

    await waitFor(() => {
      expect(mockGamificationStore.awardXP).toHaveBeenCalledWith(
        'personal_record',
        expect.any(Object)
      );
    });
  });

  it('should update streak when completing workout', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const completeButton = screen.getByRole('button', { name: /complete workout/i });
    await user.click(completeButton);

    // Confirm completion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockGamificationStore.updateStreak).toHaveBeenCalled();
      expect(mockGamificationStore.awardXP).toHaveBeenCalledWith(
        'workout_completed',
        expect.any(Object)
      );
    });
  });

  it('should check for achievements after workout completion', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const completeButton = screen.getByRole('button', { name: /complete workout/i });
    await user.click(completeButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockGamificationStore.checkAchievements).toHaveBeenCalledWith(
        'user-1',
        'workout_completed'
      );
    });
  });

  it('should display XP gains in real-time', async () => {
    const user = userEvent.setup();
    
    // Mock XP gain
    mockGamificationStore.awardXP.mockReturnValue({
      xp: 15,
      reason: 'Set completed'
    });

    (useGamificationStore as any).mockReturnValue({
      ...mockGamificationStore,
      recentXPGains: [
        { id: '1', xp: 15, reason: 'Set completed', timestamp: Date.now() }
      ]
    });

    render(<TestComponent />);

    // Should display XP gain
    expect(screen.getByText('+15 XP')).toBeInTheDocument();
    expect(screen.getByText('Set completed')).toBeInTheDocument();
  });

  it('should handle level up during workout', async () => {
    const user = userEvent.setup();
    
    // Mock level up
    mockGamificationStore.awardXP.mockReturnValue({
      xp: 50,
      reason: 'Workout completed',
      levelUp: { newLevel: 6, xpToNext: 200 }
    });

    render(<TestComponent />);

    const completeButton = screen.getByRole('button', { name: /complete workout/i });
    await user.click(completeButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/level up/i)).toBeInTheDocument();
      expect(screen.getByText(/level 6/i)).toBeInTheDocument();
    });
  });

  it('should award streak milestone XP', async () => {
    const user = userEvent.setup();
    
    // Mock streak milestone
    mockGamificationStore.updateStreak.mockReturnValue({
      newStreak: 7,
      milestone: true,
      xpAwarded: 100
    });

    render(<TestComponent />);

    const completeButton = screen.getByRole('button', { name: /complete workout/i });
    await user.click(completeButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockGamificationStore.awardXP).toHaveBeenCalledWith(
        'streak_milestone',
        expect.objectContaining({
          streak: 7
        })
      );
    });
  });

  it('should integrate with achievement system', async () => {
    const user = userEvent.setup();
    
    // Mock achievement unlock
    mockGamificationStore.checkAchievements.mockReturnValue([
      {
        id: 'first_pr',
        name: 'First Personal Record',
        description: 'Set your first personal record',
        xpReward: 50
      }
    ]);

    render(<TestComponent />);

    const completeButton = screen.getByRole('button', { name: /complete workout/i });
    await user.click(completeButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/achievement unlocked/i)).toBeInTheDocument();
      expect(screen.getByText('First Personal Record')).toBeInTheDocument();
    });
  });

  it('should handle multiple XP sources in single workout', async () => {
    const user = userEvent.setup();
    
    let xpCallCount = 0;
    mockGamificationStore.awardXP.mockImplementation((type) => {
      xpCallCount++;
      return {
        xp: type === 'workout_completed' ? 50 : 15,
        reason: type === 'workout_completed' ? 'Workout completed' : 'Set completed'
      };
    });

    render(<TestComponent />);

    // Log multiple sets
    const weightInput = screen.getByLabelText(/weight/i);
    const repsInput = screen.getByLabelText(/reps/i);
    const logButton = screen.getByRole('button', { name: /log set/i });

    // First set
    await user.type(weightInput, '80');
    await user.type(repsInput, '10');
    await user.click(logButton);

    // Second set
    await user.clear(weightInput);
    await user.clear(repsInput);
    await user.type(weightInput, '80');
    await user.type(repsInput, '8');
    await user.click(logButton);

    // Complete workout
    const completeButton = screen.getByRole('button', { name: /complete workout/i });
    await user.click(completeButton);

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(xpCallCount).toBeGreaterThanOrEqual(3); // 2 sets + 1 workout completion
    });
  });
});