import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EpicWinnerCelebration } from '../EpicWinnerCelebration';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('EpicWinnerCelebration', () => {
  const mockCelebrationData = {
    type: 'challenge_completion' as const,
    challengeTitle: 'Ultimate Fitness Challenge',
    rewards: {
      baseXP: 1000,
      bonusXP: 500,
      specialRewards: ['perfectionist', 'speed_demon'],
      totalXP: 1500
    },
    rank: 1,
    totalParticipants: 50,
    completionTime: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    achievements: ['first_place', 'speed_demon']
  };

  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render celebration for first place finish', () => {
    render(
      <EpicWinnerCelebration
        isVisible={true}
        celebrationData={mockCelebrationData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('🏆 CHAMPION! 🏆')).toBeInTheDocument();
    expect(screen.getByText('Ultimate Fitness Challenge')).toBeInTheDocument();
    expect(screen.getByText('1st Place out of 50 participants!')).toBeInTheDocument();
    expect(screen.getByText('1,500 XP')).toBeInTheDocument();
  });

  it('should render celebration for milestone achievement', () => {
    const milestoneData = {
      ...mockCelebrationData,
      type: 'milestone_reached' as const,
      milestone: 75,
      rank: undefined,
      totalParticipants: undefined
    };

    render(
      <EpicWinnerCelebration
        isVisible={true}
        celebrationData={milestoneData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('🎯 MILESTONE REACHED! 🎯')).toBeInTheDocument();
    expect(screen.getByText('75% Complete!')).toBeInTheDocument();
  });

  it('should display special rewards correctly', () => {
    render(
      <EpicWinnerCelebration
        isVisible={true}
        celebrationData={mockCelebrationData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('🎯 Perfectionist')).toBeInTheDocument();
    expect(screen.getByText('⚡ Speed Demon')).toBeInTheDocument();
  });

  it('should show completion time for speed achievements', () => {
    render(
      <EpicWinnerCelebration
        isVisible={true}
        celebrationData={mockCelebrationData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Completed in 7 days!')).toBeInTheDocument();
  });

  it('should handle different rank positions', () => {
    const secondPlaceData = {
      ...mockCelebrationData,
      rank: 2
    };

    render(
      <EpicWinnerCelebration
        isVisible={true}
        celebrationData={secondPlaceData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('🥈 EXCELLENT! 🥈')).toBeInTheDocument();
    expect(screen.getByText('2nd Place out of 50 participants!')).toBeInTheDocument();
  });

  it('should handle third place', () => {
    const thirdPlaceData = {
      ...mockCelebrationData,
      rank: 3
    };

    render(
      <EpicWinnerCelebration
        isVisible={true}
        celebrationData={thirdPlaceData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('🥉 GREAT JOB! 🥉')).toBeInTheDocument();
    expect(screen.getByText('3rd Place out of 50 participants!')).toBeInTheDocument();
  });

  it('should handle completion without ranking', () => {
    const completionData = {
      ...mockCelebrationData,
      rank: 15
    };

    render(
      <EpicWinnerCelebration
        isVisible={true}
        celebrationData={completionData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('🎉 CHALLENGE COMPLETED! 🎉')).toBeInTheDocument();
    expect(screen.getByText('15th Place out of 50 participants!')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(
      <EpicWinnerCelebration
        isVisible={false}
        celebrationData={mockCelebrationData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.queryByText('CHAMPION!')).not.toBeInTheDocument();
  });

  it('should call onComplete after celebration duration', async () => {
    vi.useFakeTimers();

    render(
      <EpicWinnerCelebration
        isVisible={true}
        celebrationData={mockCelebrationData}
        onComplete={mockOnComplete}
      />
    );

    // Fast-forward time
    vi.advanceTimersByTime(6000); // 6 seconds

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it('should format XP numbers correctly', () => {
    const highXPData = {
      ...mockCelebrationData,
      rewards: {
        ...mockCelebrationData.rewards,
        totalXP: 12500
      }
    };

    render(
      <EpicWinnerCelebration
        isVisible={true}
        celebrationData={highXPData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('12,500 XP')).toBeInTheDocument();
  });

  it('should handle missing optional data gracefully', () => {
    const minimalData = {
      type: 'challenge_completion' as const,
      challengeTitle: 'Simple Challenge',
      rewards: {
        baseXP: 100,
        bonusXP: 0,
        specialRewards: [],
        totalXP: 100
      }
    };

    render(
      <EpicWinnerCelebration
        isVisible={true}
        celebrationData={minimalData}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Simple Challenge')).toBeInTheDocument();
    expect(screen.getByText('100 XP')).toBeInTheDocument();
  });

  describe('Special Reward Icons', () => {
    it('should display correct icons for special rewards', () => {
      const specialRewardsData = {
        ...mockCelebrationData,
        rewards: {
          ...mockCelebrationData.rewards,
          specialRewards: ['perfectionist', 'speed_demon', 'streak_master', 'champion']
        }
      };

      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={specialRewardsData}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('🎯 Perfectionist')).toBeInTheDocument();
      expect(screen.getByText('⚡ Speed Demon')).toBeInTheDocument();
      expect(screen.getByText('🔥 Streak Master')).toBeInTheDocument();
      expect(screen.getByText('👑 Champion')).toBeInTheDocument();
    });

    it('should handle unknown special rewards', () => {
      const unknownRewardData = {
        ...mockCelebrationData,
        rewards: {
          ...mockCelebrationData.rewards,
          specialRewards: ['unknown_reward']
        }
      };

      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={unknownRewardData}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('🏅 Unknown Reward')).toBeInTheDocument();
    });
  });
});