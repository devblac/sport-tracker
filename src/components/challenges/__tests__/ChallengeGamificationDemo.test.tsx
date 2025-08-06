import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChallengeGamificationDemo } from '../ChallengeGamificationDemo';

// Mock the services
vi.mock('../../../services/challengeIntegrationService');
vi.mock('../../../services/challengeRewardsManager');

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('ChallengeGamificationDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render demo interface correctly', () => {
    render(<ChallengeGamificationDemo />);

    expect(screen.getByText('Challenge Gamification Demo')).toBeInTheDocument();
    expect(screen.getByText('Test Challenge Integration')).toBeInTheDocument();
    expect(screen.getByText('Join Challenge')).toBeInTheDocument();
    expect(screen.getByText('Update Progress')).toBeInTheDocument();
    expect(screen.getByText('Complete Challenge')).toBeInTheDocument();
  });

  it('should display challenge information', () => {
    render(<ChallengeGamificationDemo />);

    expect(screen.getByText('30-Day Push-up Challenge')).toBeInTheDocument();
    expect(screen.getByText('Complete 1000 push-ups in 30 days')).toBeInTheDocument();
    expect(screen.getByText('Difficulty: Hard')).toBeInTheDocument();
    expect(screen.getByText('Reward: 1000 XP + Special Badge')).toBeInTheDocument();
  });

  it('should handle join challenge action', async () => {
    render(<ChallengeGamificationDemo />);

    const joinButton = screen.getByText('Join Challenge');
    fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText(/Successfully joined/)).toBeInTheDocument();
    });

    // Button should be disabled after joining
    expect(joinButton).toBeDisabled();
  });

  it('should handle progress updates', async () => {
    render(<ChallengeGamificationDemo />);

    // First join the challenge
    fireEvent.click(screen.getByText('Join Challenge'));
    
    await waitFor(() => {
      expect(screen.getByText(/Successfully joined/)).toBeInTheDocument();
    });

    // Then update progress
    const updateButton = screen.getByText('Update Progress');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText(/Progress updated/)).toBeInTheDocument();
    });

    // Progress bar should be visible
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle challenge completion', async () => {
    render(<ChallengeGamificationDemo />);

    // Join challenge first
    fireEvent.click(screen.getByText('Join Challenge'));
    await waitFor(() => {
      expect(screen.getByText(/Successfully joined/)).toBeInTheDocument();
    });

    // Complete challenge
    const completeButton = screen.getByText('Complete Challenge');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(screen.getByText(/Challenge completed/)).toBeInTheDocument();
    });

    // Epic celebration should be triggered
    expect(screen.getByText(/Epic celebration triggered/)).toBeInTheDocument();
  });

  it('should display progress bar correctly', async () => {
    render(<ChallengeGamificationDemo />);

    // Join and update progress
    fireEvent.click(screen.getByText('Join Challenge'));
    await waitFor(() => {
      expect(screen.getByText(/Successfully joined/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Update Progress'));
    await waitFor(() => {
      expect(screen.getByText(/Progress updated/)).toBeInTheDocument();
    });

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow');
  });

  it('should show milestone achievements', async () => {
    render(<ChallengeGamificationDemo />);

    // Join challenge
    fireEvent.click(screen.getByText('Join Challenge'));
    await waitFor(() => {
      expect(screen.getByText(/Successfully joined/)).toBeInTheDocument();
    });

    // Update progress multiple times to hit milestones
    const updateButton = screen.getByText('Update Progress');
    
    // First update (25%)
    fireEvent.click(updateButton);
    await waitFor(() => {
      expect(screen.getByText(/Milestone reached: 25%/)).toBeInTheDocument();
    });

    // Second update (50%)
    fireEvent.click(updateButton);
    await waitFor(() => {
      expect(screen.getByText(/Milestone reached: 50%/)).toBeInTheDocument();
    });
  });

  it('should display XP rewards correctly', async () => {
    render(<ChallengeGamificationDemo />);

    // Join challenge
    fireEvent.click(screen.getByText('Join Challenge'));
    await waitFor(() => {
      expect(screen.getByText(/XP awarded: 25/)).toBeInTheDocument();
    });

    // Update progress
    fireEvent.click(screen.getByText('Update Progress'));
    await waitFor(() => {
      expect(screen.getByText(/XP awarded: 50/)).toBeInTheDocument();
    });
  });

  it('should handle special rewards display', async () => {
    render(<ChallengeGamificationDemo />);

    // Complete challenge to get special rewards
    fireEvent.click(screen.getByText('Join Challenge'));
    await waitFor(() => {
      expect(screen.getByText(/Successfully joined/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Complete Challenge'));
    await waitFor(() => {
      expect(screen.getByText(/Special rewards:/)).toBeInTheDocument();
      expect(screen.getByText(/Perfectionist/)).toBeInTheDocument();
      expect(screen.getByText(/Speed Demon/)).toBeInTheDocument();
    });
  });

  it('should reset demo state', async () => {
    render(<ChallengeGamificationDemo />);

    // Join and complete challenge
    fireEvent.click(screen.getByText('Join Challenge'));
    await waitFor(() => {
      expect(screen.getByText(/Successfully joined/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Complete Challenge'));
    await waitFor(() => {
      expect(screen.getByText(/Challenge completed/)).toBeInTheDocument();
    });

    // Reset demo
    const resetButton = screen.getByText('Reset Demo');
    fireEvent.click(resetButton);

    // Should be back to initial state
    expect(screen.getByText('Join Challenge')).not.toBeDisabled();
    expect(screen.queryByText(/Successfully joined/)).not.toBeInTheDocument();
  });

  it('should display leaderboard information', async () => {
    render(<ChallengeGamificationDemo />);

    // Join challenge
    fireEvent.click(screen.getByText('Join Challenge'));
    await waitFor(() => {
      expect(screen.getByText(/Successfully joined/)).toBeInTheDocument();
    });

    // Should show leaderboard section
    expect(screen.getByText('Leaderboard Position')).toBeInTheDocument();
    expect(screen.getByText(/Rank:/)).toBeInTheDocument();
  });

  it('should handle error states gracefully', async () => {
    // Mock a service error
    const mockError = new Error('Service unavailable');
    vi.mocked(require('../../../services/challengeIntegrationService').ChallengeIntegrationService)
      .mockImplementation(() => ({
        joinChallenge: vi.fn().mockRejectedValue(mockError)
      }));

    render(<ChallengeGamificationDemo />);

    fireEvent.click(screen.getByText('Join Challenge'));

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('should show loading states during operations', async () => {
    render(<ChallengeGamificationDemo />);

    const joinButton = screen.getByText('Join Challenge');
    fireEvent.click(joinButton);

    // Should show loading state briefly
    expect(joinButton).toBeDisabled();
  });

  describe('Progress Visualization', () => {
    it('should update progress bar visually', async () => {
      render(<ChallengeGamificationDemo />);

      fireEvent.click(screen.getByText('Join Challenge'));
      await waitFor(() => {
        expect(screen.getByText(/Successfully joined/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Update Progress'));
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '25');
      });
    });

    it('should show completion state', async () => {
      render(<ChallengeGamificationDemo />);

      fireEvent.click(screen.getByText('Join Challenge'));
      await waitFor(() => {
        expect(screen.getByText(/Successfully joined/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Complete Challenge'));
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '100');
        expect(screen.getByText('✅ Completed!')).toBeInTheDocument();
      });
    });
  });
});