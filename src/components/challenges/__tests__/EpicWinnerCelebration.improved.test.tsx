// Improved test file with better patterns and coverage

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { EpicWinnerCelebration } from '../EpicWinnerCelebration';

// Test data factory for consistent test data generation
class CelebrationTestDataFactory {
  static createChallengeCompletion(overrides: Partial<any> = {}) {
    return {
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
      achievements: ['first_place', 'speed_demon'],
      ...overrides
    };
  }

  static createMilestone(overrides: Partial<any> = {}) {
    return {
      type: 'milestone_reached' as const,
      challengeTitle: 'Progress Milestone',
      rewards: {
        baseXP: 500,
        bonusXP: 0,
        specialRewards: [],
        totalXP: 500
      },
      milestone: 75,
      ...overrides
    };
  }

  static createMinimalData(overrides: Partial<any> = {}) {
    return {
      type: 'challenge_completion' as const,
      challengeTitle: 'Simple Challenge',
      rewards: {
        baseXP: 100,
        bonusXP: 0,
        specialRewards: [],
        totalXP: 100
      },
      ...overrides
    };
  }
}

// Mock utilities
const mockFramerMotion = () => {
  vi.mock('framer-motion', () => ({
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    },
    AnimatePresence: ({ children }: any) => children,
  }));
};

const mockConfetti = () => {
  vi.mock('canvas-confetti', () => ({
    default: vi.fn(),
  }));
};

// Test setup and teardown
describe('EpicWinnerCelebration', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFramerMotion();
    mockConfetti();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('Rendering Tests', () => {
    it('should render celebration for first place finish', () => {
      const data = CelebrationTestDataFactory.createChallengeCompletion();
      
      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={data}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('🏆 CHAMPION! 🏆')).toBeInTheDocument();
      expect(screen.getByText('Ultimate Fitness Challenge')).toBeInTheDocument();
      expect(screen.getByText('1st Place out of 50 participants!')).toBeInTheDocument();
      expect(screen.getByText('1,500 XP')).toBeInTheDocument();
    });

    it('should render celebration for milestone achievement', () => {
      const data = CelebrationTestDataFactory.createMilestone();

      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={data}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('🎯 MILESTONE REACHED! 🎯')).toBeInTheDocument();
      expect(screen.getByText('75% Complete!')).toBeInTheDocument();
    });

    it('should not render when not visible', () => {
      const data = CelebrationTestDataFactory.createChallengeCompletion();
      
      render(
        <EpicWinnerCelebration
          isVisible={false}
          celebrationData={data}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.queryByText('CHAMPION!')).not.toBeInTheDocument();
    });
  });

  describe('Rank Display Tests', () => {
    const rankTestCases = [
      { rank: 1, expectedTitle: '🏆 CHAMPION! 🏆', expectedText: '1st Place' },
      { rank: 2, expectedTitle: '🥈 EXCELLENT! 🥈', expectedText: '2nd Place' },
      { rank: 3, expectedTitle: '🥉 GREAT JOB! 🥉', expectedText: '3rd Place' },
      { rank: 15, expectedTitle: '🎉 CHALLENGE COMPLETED! 🎉', expectedText: '15th Place' }
    ];

    rankTestCases.forEach(({ rank, expectedTitle, expectedText }) => {
      it(`should display correct content for rank ${rank}`, () => {
        const data = CelebrationTestDataFactory.createChallengeCompletion({ rank });
        
        render(
          <EpicWinnerCelebration
            isVisible={true}
            celebrationData={data}
            onComplete={mockOnComplete}
          />
        );

        expect(screen.getByText(expectedTitle)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(expectedText))).toBeInTheDocument();
      });
    });
  });

  describe('Special Rewards Tests', () => {
    const rewardTestCases = [
      { reward: 'perfectionist', expectedIcon: '🎯', expectedTitle: 'Perfectionist' },
      { reward: 'speed_demon', expectedIcon: '⚡', expectedTitle: 'Speed Demon' },
      { reward: 'streak_master', expectedIcon: '🔥', expectedTitle: 'Streak Master' },
      { reward: 'champion', expectedIcon: '👑', expectedTitle: 'Champion' },
      { reward: 'unknown_reward', expectedIcon: '🏅', expectedTitle: 'Unknown Reward' }
    ];

    rewardTestCases.forEach(({ reward, expectedIcon, expectedTitle }) => {
      it(`should display correct icon and title for ${reward}`, () => {
        const data = CelebrationTestDataFactory.createChallengeCompletion({
          rewards: {
            baseXP: 1000,
            bonusXP: 500,
            specialRewards: [reward],
            totalXP: 1500
          }
        });
        
        render(
          <EpicWinnerCelebration
            isVisible={true}
            celebrationData={data}
            onComplete={mockOnComplete}
          />
        );

        expect(screen.getByText(`${expectedIcon} ${expectedTitle}`)).toBeInTheDocument();
      });
    });
  });

  describe('Timing and Lifecycle Tests', () => {
    it('should call onComplete after celebration duration', async () => {
      vi.useFakeTimers();
      
      const data = CelebrationTestDataFactory.createChallengeCompletion();
      
      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={data}
          onComplete={mockOnComplete}
        />
      );

      expect(mockOnComplete).not.toHaveBeenCalled();

      vi.advanceTimersByTime(6000);
      
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onComplete when not visible', () => {
      vi.useFakeTimers();
      
      const data = CelebrationTestDataFactory.createChallengeCompletion();
      
      render(
        <EpicWinnerCelebration
          isVisible={false}
          celebrationData={data}
          onComplete={mockOnComplete}
        />
      );

      vi.advanceTimersByTime(6000);
      
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe('Data Formatting Tests', () => {
    it('should format XP numbers correctly', () => {
      const testCases = [
        { xp: 1500, expected: '1,500 XP' },
        { xp: 12500, expected: '12,500 XP' },
        { xp: 1234567, expected: '1,234,567 XP' }
      ];

      testCases.forEach(({ xp, expected }) => {
        const data = CelebrationTestDataFactory.createChallengeCompletion({
          rewards: { baseXP: xp, bonusXP: 0, specialRewards: [], totalXP: xp }
        });
        
        const { unmount } = render(
          <EpicWinnerCelebration
            isVisible={true}
            celebrationData={data}
            onComplete={mockOnComplete}
          />
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });

    it('should show completion time for speed achievements', () => {
      const data = CelebrationTestDataFactory.createChallengeCompletion({
        completionTime: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={data}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Completed in 7 days!')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing optional data gracefully', () => {
      const data = CelebrationTestDataFactory.createMinimalData();
      
      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={data}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Simple Challenge')).toBeInTheDocument();
      expect(screen.getByText('100 XP')).toBeInTheDocument();
    });

    it('should handle undefined participant rank gracefully', () => {
      const data = CelebrationTestDataFactory.createChallengeCompletion({ rank: undefined });
      
      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={data}
          onComplete={mockOnComplete}
        />
      );

      // Should default to rank 1 behavior
      expect(screen.getByText('🏆 CHAMPION! 🏆')).toBeInTheDocument();
    });

    it('should validate props and show warnings in development', () => {
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
  });

  describe('Accessibility Tests', () => {
    it('should have proper heading hierarchy', () => {
      const data = CelebrationTestDataFactory.createChallengeCompletion();
      
      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={data}
          onComplete={mockOnComplete}
        />
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const data = CelebrationTestDataFactory.createChallengeCompletion();
      
      render(
        <EpicWinnerCelebration
          isVisible={true}
          celebrationData={data}
          onComplete={mockOnComplete}
        />
      );

      // Test that the component doesn't trap focus inappropriately
      const celebration = screen.getByText('🏆 CHAMPION! 🏆').closest('div');
      expect(celebration).not.toHaveAttribute('tabindex', '-1');
    });
  });
});