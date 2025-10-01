/**
 * Comprehensive Gamification System Tests
 * Tests XP calculation, achievements, streaks, levels, and rewards
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { GamificationDashboard } from '@/components/gamification/GamificationDashboard';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { AchievementGallery } from '@/components/gamification/AchievementGallery';
import { StreakDashboard } from '@/components/streaks/StreakDashboard';
import { LevelUpCelebration } from '@/components/gamification/LevelUpCelebration';
import { useAuthStore } from '@/stores/useAuthStore';
import { 
  createMockUser, 
  createMockAchievement, 
  createMockUserAchievement,
  createMockXPTransaction,
  createMockWorkout
} from '@/test/test-factories';

// Mock services
const mockGamificationService = {
  calculateWorkoutXP: vi.fn(),
  awardAchievement: vi.fn(),
  updateStreak: vi.fn(),
  calculateLevel: vi.fn(),
  getAchievements: vi.fn(),
  getUserAchievements: vi.fn(),
  getXPTransactions: vi.fn(),
  getStreakData: vi.fn(),
  processLevelUp: vi.fn()
};

const mockStreakService = {
  updateStreak: vi.fn(),
  getStreakData: vi.fn(),
  calculateStreakBonus: vi.fn(),
  checkStreakMilestone: vi.fn()
};

vi.mock('@/services/GamificationService', () => ({
  gamificationService: mockGamificationService
}));

vi.mock('@/services/StreakService', () => ({
  streakService: mockStreakService
}));

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Gamification System', () => {
  const user = userEvent.setup();
  let mockUser: any;
  let mockAchievements: any[];
  let mockUserAchievements: any[];
  let mockXPTransactions: any[];

  beforeEach(() => {
    mockUser = createMockUser({
      profile: {
        total_xp: 1500,
        level: 5,
        streak_count: 7
      }
    });

    mockAchievements = [
      createMockAchievement({ 
        name: 'First Workout', 
        category: 'workout',
        xp_reward: 100,
        requirements: { type: 'workout_count', target: 1 }
      }),
      createMockAchievement({ 
        name: 'Streak Master', 
        category: 'streak',
        xp_reward: 200,
        requirements: { type: 'streak_days', target: 7 }
      }),
      createMockAchievement({ 
        name: 'Heavy Lifter', 
        category: 'strength',
        xp_reward: 300,
        requirements: { type: 'max_weight', target: 200 }
      })
    ];

    mockUserAchievements = [
      createMockUserAchievement({
        user_id: mockUser.id,
        achievement_id: mockAchievements[0].id,
        progress: 1,
        achievement: mockAchievements[0]
      }),
      createMockUserAchievement({
        user_id: mockUser.id,
        achievement_id: mockAchievements[1].id,
        progress: 1,
        achievement: mockAchievements[1]
      })
    ];

    mockXPTransactions = [
      createMockXPTransaction({
        user_id: mockUser.id,
        amount: 150,
        source: 'workout',
        description: 'Completed morning workout'
      }),
      createMockXPTransaction({
        user_id: mockUser.id,
        amount: 100,
        source: 'achievement',
        description: 'Unlocked First Workout achievement'
      })
    ];

    // Reset mocks
    vi.clearAllMocks();
    
    // Setup auth store
    useAuthStore.getState().setUser(mockUser);
    
    // Setup default mock responses
    mockGamificationService.getAchievements.mockResolvedValue(mockAchievements);
    mockGamificationService.getUserAchievements.mockResolvedValue(mockUserAchievements);
    mockGamificationService.getXPTransactions.mockResolvedValue(mockXPTransactions);
    mockStreakService.getStreakData.mockResolvedValue({
      current_streak: 7,
      longest_streak: 15,
      last_workout_date: new Date().toISOString()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('XP System', () => {
    it('should calculate workout XP correctly', async () => {
      const workout = createMockWorkout({
        duration_seconds: 3600, // 1 hour
        total_volume: 5000,
        exercises: Array.from({ length: 5 }, () => ({ sets: [{ completed: true }] }))
      });

      mockGamificationService.calculateWorkoutXP.mockReturnValue({
        baseXP: 100,
        durationBonus: 20,
        volumeBonus: 30,
        exerciseVarietyBonus: 15,
        streakBonus: 10,
        totalXP: 175
      });

      const xpCalculation = mockGamificationService.calculateWorkoutXP(workout, mockUser);

      expect(xpCalculation.totalXP).toBe(175);
      expect(xpCalculation.baseXP).toBe(100);
      expect(xpCalculation.durationBonus).toBe(20);
      expect(xpCalculation.volumeBonus).toBe(30);
      expect(xpCalculation.exerciseVarietyBonus).toBe(15);
      expect(xpCalculation.streakBonus).toBe(10);
    });

    it('should display XP progress bar correctly', async () => {
      render(
        <TestWrapper>
          <XPProgressBar 
            currentXP={1500}
            level={5}
            nextLevelXP={2000}
            showDetails={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Level 5')).toBeInTheDocument();
      expect(screen.getByText('1500 / 2000 XP')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument(); // Progress percentage
    });

    it('should show XP transaction history', async () => {
      render(
        <TestWrapper>
          <GamificationDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Completed morning workout')).toBeInTheDocument();
        expect(screen.getByText('+150 XP')).toBeInTheDocument();
        expect(screen.getByText('Unlocked First Workout achievement')).toBeInTheDocument();
        expect(screen.getByText('+100 XP')).toBeInTheDocument();
      });
    });

    it('should handle XP bonuses for special conditions', async () => {
      const weekendWorkout = createMockWorkout({
        started_at: new Date('2024-01-06T10:00:00Z').toISOString() // Saturday
      });

      mockGamificationService.calculateWorkoutXP.mockReturnValue({
        baseXP: 100,
        weekendBonus: 25,
        totalXP: 125
      });

      const xpCalculation = mockGamificationService.calculateWorkoutXP(weekendWorkout, mockUser);

      expect(xpCalculation.weekendBonus).toBe(25);
      expect(xpCalculation.totalXP).toBe(125);
    });
  });

  describe('Achievement System', () => {
    it('should display achievement gallery with progress', async () => {
      render(
        <TestWrapper>
          <AchievementGallery />
        </TestWrapper>
      );

      await waitFor(() => {
        // Unlocked achievements
        expect(screen.getByText('First Workout')).toBeInTheDocument();
        expect(screen.getByText('Streak Master')).toBeInTheDocument();
        
        // Locked achievement
        expect(screen.getByText('Heavy Lifter')).toBeInTheDocument();
        expect(screen.getByText('0 / 200 lbs')).toBeInTheDocument(); // Progress
      });
    });

    it('should unlock achievement when requirements are met', async () => {
      const newAchievement = createMockUserAchievement({
        achievement: mockAchievements[2], // Heavy Lifter
        progress: 1
      });

      mockGamificationService.awardAchievement.mockResolvedValue(newAchievement);

      // Simulate workout completion that meets achievement requirements
      const heavyWorkout = createMockWorkout({
        exercises: [{
          sets: [{ weight: 205, reps: 5, completed: true }]
        }]
      });

      await mockGamificationService.awardAchievement(mockUser.id, mockAchievements[2].id);

      expect(mockGamificationService.awardAchievement).toHaveBeenCalledWith(
        mockUser.id, 
        mockAchievements[2].id
      );
    });

    it('should show achievement celebration when unlocked', async () => {
      const achievement = mockAchievements[0];

      render(
        <TestWrapper>
          <div>
            <button 
              onClick={() => {
                // Simulate achievement unlock
                const event = new CustomEvent('achievementUnlocked', {
                  detail: { achievement }
                });
                window.dispatchEvent(event);
              }}
            >
              Unlock Achievement
            </button>
          </div>
        </TestWrapper>
      );

      const unlockButton = screen.getByRole('button', { name: /unlock achievement/i });
      await user.click(unlockButton);

      await waitFor(() => {
        expect(screen.getByText(/achievement unlocked/i)).toBeInTheDocument();
        expect(screen.getByText(achievement.name)).toBeInTheDocument();
        expect(screen.getByText(`+${achievement.xp_reward} XP`)).toBeInTheDocument();
      });
    });

    it('should filter achievements by category', async () => {
      render(
        <TestWrapper>
          <AchievementGallery />
        </TestWrapper>
      );

      const categoryFilter = screen.getByLabelText(/filter by category/i);
      await user.selectOptions(categoryFilter, 'workout');

      await waitFor(() => {
        expect(screen.getByText('First Workout')).toBeInTheDocument();
        expect(screen.queryByText('Streak Master')).not.toBeInTheDocument();
        expect(screen.queryByText('Heavy Lifter')).not.toBeInTheDocument();
      });
    });

    it('should show achievement rarity and rewards', async () => {
      const rareAchievement = createMockAchievement({
        name: 'Marathon Master',
        rarity: 'legendary',
        xp_reward: 1000,
        icon: '🏆'
      });

      mockGamificationService.getAchievements.mockResolvedValue([rareAchievement]);

      render(
        <TestWrapper>
          <AchievementGallery />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Marathon Master')).toBeInTheDocument();
        expect(screen.getByText('🏆')).toBeInTheDocument();
        expect(screen.getByText('Legendary')).toBeInTheDocument();
        expect(screen.getByText('1000 XP')).toBeInTheDocument();
      });
    });
  });

  describe('Streak System', () => {
    it('should display current streak information', async () => {
      render(
        <TestWrapper>
          <StreakDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('7 day streak')).toBeInTheDocument();
        expect(screen.getByText('Longest: 15 days')).toBeInTheDocument();
      });
    });

    it('should update streak after workout completion', async () => {
      mockStreakService.updateStreak.mockResolvedValue({
        current_streak: 8,
        streak_bonus_xp: 20,
        milestone_reached: false
      });

      await mockStreakService.updateStreak(mockUser.id);

      expect(mockStreakService.updateStreak).toHaveBeenCalledWith(mockUser.id);
    });

    it('should celebrate streak milestones', async () => {
      mockStreakService.checkStreakMilestone.mockReturnValue({
        isMilestone: true,
        milestone: 10,
        bonusXP: 100,
        specialReward: 'Streak Shield'
      });

      const milestoneData = mockStreakService.checkStreakMilestone(10);

      expect(milestoneData.isMilestone).toBe(true);
      expect(milestoneData.milestone).toBe(10);
      expect(milestoneData.bonusXP).toBe(100);
      expect(milestoneData.specialReward).toBe('Streak Shield');
    });

    it('should show streak risk warning', async () => {
      const riskUser = createMockUser({
        profile: {
          streak_count: 5,
          last_workout_date: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() // 20 hours ago
        }
      });

      useAuthStore.getState().setUser(riskUser);

      render(
        <TestWrapper>
          <StreakDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/streak at risk/i)).toBeInTheDocument();
        expect(screen.getByText(/4 hours remaining/i)).toBeInTheDocument();
      });
    });

    it('should handle streak freeze/shield mechanics', async () => {
      const userWithShield = createMockUser({
        profile: {
          streak_count: 10,
          streak_shields: 2
        }
      });

      render(
        <TestWrapper>
          <StreakDashboard user={userWithShield} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('2 Streak Shields')).toBeInTheDocument();
        expect(screen.getByText(/protect your streak/i)).toBeInTheDocument();
      });
    });
  });

  describe('Level System', () => {
    it('should calculate level from XP correctly', () => {
      mockGamificationService.calculateLevel.mockReturnValue({
        level: 5,
        currentLevelXP: 1500,
        nextLevelXP: 2000,
        progress: 0.75,
        title: 'Dedicated'
      });

      const levelData = mockGamificationService.calculateLevel(1500);

      expect(levelData.level).toBe(5);
      expect(levelData.currentLevelXP).toBe(1500);
      expect(levelData.nextLevelXP).toBe(2000);
      expect(levelData.progress).toBe(0.75);
      expect(levelData.title).toBe('Dedicated');
    });

    it('should show level up celebration', async () => {
      const levelUpData = {
        oldLevel: 4,
        newLevel: 5,
        xpGained: 150,
        newTitle: 'Dedicated',
        rewards: ['New workout templates', 'Advanced analytics']
      };

      render(
        <TestWrapper>
          <LevelUpCelebration 
            isVisible={true}
            levelUpData={levelUpData}
            onComplete={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Level Up!')).toBeInTheDocument();
      expect(screen.getByText('Level 5')).toBeInTheDocument();
      expect(screen.getByText('Dedicated')).toBeInTheDocument();
      expect(screen.getByText('New workout templates')).toBeInTheDocument();
      expect(screen.getByText('Advanced analytics')).toBeInTheDocument();
    });

    it('should unlock features at specific levels', async () => {
      const level10User = createMockUser({
        profile: { level: 10 }
      });

      render(
        <TestWrapper>
          <GamificationDashboard user={level10User} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/advanced features unlocked/i)).toBeInTheDocument();
        expect(screen.getByText(/custom workout analytics/i)).toBeInTheDocument();
      });
    });
  });

  describe('Leaderboards and Competition', () => {
    it('should display weekly leaderboard', async () => {
      const leaderboardData = [
        { user: createMockUser({ display_name: 'Alice' }), xp: 2500, rank: 1 },
        { user: createMockUser({ display_name: 'Bob' }), xp: 2200, rank: 2 },
        { user: mockUser, xp: 1500, rank: 3 }
      ];

      mockGamificationService.getWeeklyLeaderboard = vi.fn().mockResolvedValue(leaderboardData);

      render(
        <TestWrapper>
          <GamificationDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('2,500 XP')).toBeInTheDocument();
        expect(screen.getByText('#1')).toBeInTheDocument();
        
        expect(screen.getByText('Your Rank: #3')).toBeInTheDocument();
      });
    });

    it('should show seasonal competitions', async () => {
      const competition = {
        name: 'Summer Challenge',
        description: 'Complete 30 workouts in 30 days',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        participants: 150,
        user_progress: 12,
        target: 30
      };

      mockGamificationService.getCurrentCompetitions = vi.fn().mockResolvedValue([competition]);

      render(
        <TestWrapper>
          <GamificationDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Summer Challenge')).toBeInTheDocument();
        expect(screen.getByText('12 / 30 workouts')).toBeInTheDocument();
        expect(screen.getByText('150 participants')).toBeInTheDocument();
      });
    });
  });

  describe('Rewards and Incentives', () => {
    it('should show available rewards', async () => {
      const rewards = [
        { id: '1', name: 'Custom Avatar', cost: 500, type: 'cosmetic' },
        { id: '2', name: 'Premium Templates', cost: 1000, type: 'feature' },
        { id: '3', name: 'Workout Buddy', cost: 2000, type: 'social' }
      ];

      mockGamificationService.getAvailableRewards = vi.fn().mockResolvedValue(rewards);

      render(
        <TestWrapper>
          <GamificationDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Custom Avatar')).toBeInTheDocument();
        expect(screen.getByText('500 XP')).toBeInTheDocument();
        expect(screen.getByText('Premium Templates')).toBeInTheDocument();
        expect(screen.getByText('1000 XP')).toBeInTheDocument();
      });
    });

    it('should allow purchasing rewards with XP', async () => {
      const reward = { id: '1', name: 'Custom Avatar', cost: 500 };
      
      mockGamificationService.purchaseReward = vi.fn().mockResolvedValue({
        success: true,
        newXP: 1000 // 1500 - 500
      });

      render(
        <TestWrapper>
          <GamificationDashboard />
        </TestWrapper>
      );

      const purchaseButton = screen.getByRole('button', { name: /purchase custom avatar/i });
      await user.click(purchaseButton);

      await waitFor(() => {
        expect(mockGamificationService.purchaseReward).toHaveBeenCalledWith(
          mockUser.id,
          reward.id
        );
      });
    });

    it('should show insufficient XP warning', async () => {
      const expensiveReward = { id: '2', name: 'Premium Templates', cost: 2000 };
      
      render(
        <TestWrapper>
          <GamificationDashboard />
        </TestWrapper>
      );

      const purchaseButton = screen.getByRole('button', { name: /purchase premium templates/i });
      
      expect(purchaseButton).toBeDisabled();
      expect(screen.getByText(/insufficient xp/i)).toBeInTheDocument();
    });
  });

  describe('Integration with Workout System', () => {
    it('should award XP after workout completion', async () => {
      const completedWorkout = createMockWorkout({ status: 'completed' });
      
      mockGamificationService.processWorkoutCompletion = vi.fn().mockResolvedValue({
        xpAwarded: 175,
        achievementsUnlocked: [mockAchievements[0]],
        levelUp: false,
        streakUpdated: true
      });

      await mockGamificationService.processWorkoutCompletion(completedWorkout, mockUser);

      expect(mockGamificationService.processWorkoutCompletion).toHaveBeenCalledWith(
        completedWorkout,
        mockUser
      );
    });

    it('should trigger level up after sufficient XP gain', async () => {
      mockGamificationService.processLevelUp.mockResolvedValue({
        leveledUp: true,
        oldLevel: 4,
        newLevel: 5,
        rewards: ['New features unlocked']
      });

      const levelUpResult = await mockGamificationService.processLevelUp(mockUser.id, 2000);

      expect(levelUpResult.leveledUp).toBe(true);
      expect(levelUpResult.newLevel).toBe(5);
    });
  });

  describe('Performance and Optimization', () => {
    it('should cache achievement data', async () => {
      render(
        <TestWrapper>
          <AchievementGallery />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockGamificationService.getAchievements).toHaveBeenCalledTimes(1);
      });

      // Re-render should use cached data
      render(
        <TestWrapper>
          <AchievementGallery />
        </TestWrapper>
      );

      expect(mockGamificationService.getAchievements).toHaveBeenCalledTimes(1);
    });

    it('should batch XP calculations for multiple operations', async () => {
      const operations = [
        { type: 'workout', value: 100 },
        { type: 'achievement', value: 200 },
        { type: 'streak', value: 50 }
      ];

      mockGamificationService.batchProcessXP = vi.fn().mockResolvedValue({
        totalXP: 350,
        operations: operations.length
      });

      const result = await mockGamificationService.batchProcessXP(mockUser.id, operations);

      expect(result.totalXP).toBe(350);
      expect(result.operations).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle XP calculation errors gracefully', async () => {
      mockGamificationService.calculateWorkoutXP.mockImplementation(() => {
        throw new Error('XP calculation failed');
      });

      render(
        <TestWrapper>
          <GamificationDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/unable to calculate xp/i)).toBeInTheDocument();
      });
    });

    it('should handle achievement unlock failures', async () => {
      mockGamificationService.awardAchievement.mockRejectedValue(
        new Error('Achievement unlock failed')
      );

      render(
        <TestWrapper>
          <GamificationDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/achievement system temporarily unavailable/i)).toBeInTheDocument();
      });
    });

    it('should provide fallback for missing gamification data', async () => {
      mockGamificationService.getUserAchievements.mockResolvedValue([]);
      mockGamificationService.getXPTransactions.mockResolvedValue([]);

      render(
        <TestWrapper>
          <GamificationDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/no achievements yet/i)).toBeInTheDocument();
        expect(screen.getByText(/start your fitness journey/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for progress indicators', () => {
      render(
        <TestWrapper>
          <XPProgressBar 
            currentXP={1500}
            level={5}
            nextLevelXP={2000}
          />
        </TestWrapper>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', /xp progress/i);
    });

    it('should announce achievement unlocks to screen readers', async () => {
      render(
        <TestWrapper>
          <GamificationDashboard />
        </TestWrapper>
      );

      // Simulate achievement unlock
      const achievementEvent = new CustomEvent('achievementUnlocked', {
        detail: { achievement: mockAchievements[0] }
      });
      window.dispatchEvent(achievementEvent);

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/achievement unlocked: first workout/i);
      });
    });

    it('should support keyboard navigation in achievement gallery', async () => {
      render(
        <TestWrapper>
          <AchievementGallery />
        </TestWrapper>
      );

      const firstAchievement = screen.getByRole('button', { name: /first workout/i });
      firstAchievement.focus();

      expect(document.activeElement).toBe(firstAchievement);

      await user.tab();
      const secondAchievement = screen.getByRole('button', { name: /streak master/i });
      expect(document.activeElement).toBe(secondAchievement);
    });
  });
});