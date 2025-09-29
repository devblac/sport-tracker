import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EpicWinnerCelebration } from '../EpicWinnerCelebration';

// Import the TestCelebrationData type for proper typing
type TestCelebrationData = {
  type: 'challenge_completion' | 'milestone_reached';
  challengeTitle: string;
  rewards: {
    baseXP: number;
    bonusXP: number;
    specialRewards: string[];
    totalXP: number;
  };
  rank?: number;
  totalParticipants?: number;
  completionTime?: number;
  achievements?: string[];
  milestone?: number;
};

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
    
    const { rerender } = render(
      <EpicWinnerCelebration
        isVisible={true}
        celebrationData={mockCelebrationData}
        onComplete={mockOnComplete}
      />
    );

    // Verify onComplete hasn't been called yet
    expect(mockOnComplete).not.toHaveBeenCalled();

    // Fast-forward time by 6 seconds
    vi.advanceTimersByTime(6000);
    
    // Force a re-render to trigger any pending effects
    rerender(
      <EpicWinnerCelebration
        isVisible={true}
        celebrationData={mockCelebrationData}
        onComplete={mockOnComplete}
      />
    );

    // The callback should have been called
    expect(mockOnComplete).toHaveBeenCalled();

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

  describe('Prop Validation and Interface Handling', () => {
    it('should handle undefined participant rank gracefully', () => {
      const dataWithoutRank = {
        ...mockCelebrationData,
        rank: undefined
      };

      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={dataWithoutRank}
          onComplete={mockOnComplete}
        />
      );

      // Should default to rank 1 behavior
      expect(screen.getByText('🏆 CHAMPION! 🏆')).toBeInTheDocument();
    });

    it('should handle missing celebrationData properties', () => {
      const minimalData = {
        type: 'challenge_completion' as const,
        challengeTitle: 'Test Challenge',
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

      expect(screen.getByText('Test Challenge')).toBeInTheDocument();
      expect(screen.getByText('100 XP')).toBeInTheDocument();
    });

    it('should handle both prop interfaces correctly', () => {
      const mockChallenge = {
        id: '1',
        name: 'Direct Challenge',
        participants_count: 25,
        category: 'strength'
      } as any;

      const mockParticipant = {
        rank: 2,
        progress: 100
      } as any;

      const mockCelebration = {
        xp_gained: 750
      } as any;

      render(
        <EpicWinnerCelebration
          challenge={mockChallenge}
          participant={mockParticipant}
          celebration={mockCelebration}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Direct Challenge')).toBeInTheDocument();
      expect(screen.getByText('750 XP')).toBeInTheDocument();
    });

    it('should validate required props and show warnings in development', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <EpicWinnerCelebration
          isVisible={true}
          onComplete={mockOnComplete}
        />
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing challenge or celebrationData prop')
      );

      // Restore environment
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });

    it('should handle null and undefined props gracefully', () => {
      render(
        <EpicWinnerCelebration
          challenge={undefined}
          participant={undefined}
          celebration={undefined}
          celebrationData={undefined}
          isVisible={true}
          onComplete={mockOnComplete}
        />
      );

      // Should render with default values
      expect(screen.getByText('Challenge')).toBeInTheDocument();
      expect(screen.getByText('0 XP')).toBeInTheDocument();
    });

    it('should properly type-check celebrationData structure', () => {
      const typedCelebrationData: TestCelebrationData = {
        type: 'challenge_completion',
        challengeTitle: 'Typed Challenge',
        rewards: {
          baseXP: 500,
          bonusXP: 250,
          specialRewards: ['perfectionist'],
          totalXP: 750
        },
        rank: 1,
        totalParticipants: 100,
        completionTime: 5 * 24 * 60 * 60 * 1000, // 5 days
        achievements: ['first_place']
      };

      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={typedCelebrationData}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Typed Challenge')).toBeInTheDocument();
      expect(screen.getByText('750 XP')).toBeInTheDocument();
      expect(screen.getByText('🎯 Perfectionist')).toBeInTheDocument();
    });

    it('should handle edge cases in rank calculation', () => {
      const edgeCaseData = {
        ...mockCelebrationData,
        rank: 0 // Invalid rank
      };

      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={edgeCaseData}
          onComplete={mockOnComplete}
        />
      );

      // Should handle invalid rank gracefully
      expect(screen.getByText('0th Place out of 50 participants!')).toBeInTheDocument();
      expect(screen.getByText('🎉 CHALLENGE COMPLETED! 🎉')).toBeInTheDocument();
    });

    it('should handle large numbers in XP display', () => {
      const largeXPData = {
        ...mockCelebrationData,
        rewards: {
          ...mockCelebrationData.rewards,
          totalXP: 1234567
        }
      };

      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={largeXPData}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('1,234,567 XP')).toBeInTheDocument();
    });
  });
});