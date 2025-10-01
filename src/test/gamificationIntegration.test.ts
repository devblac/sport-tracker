/**
 * Gamification Integration Tests
 * 
 * Tests the complete integration of the gamification system including
 * achievements, streaks, XP, and real-time updates.
 */

import { describe, it, expect } from 'vitest';
import { allFitnessAchievements } from '@/data/fitnessAchievements';
import { validateFitnessAchievement } from '@/utils/fitnessAchievementValidators';

describe('Gamification Integration', () => {
  describe('Achievement System', () => {
    it('should load all fitness achievements', () => {
      expect(allFitnessAchievements).toBeDefined();
      expect(Array.isArray(allFitnessAchievements)).toBe(true);
      expect(allFitnessAchievements.length).toBeGreaterThan(0);
    });

    it('should have properly structured achievements', () => {
      const achievement = allFitnessAchievements[0];
      
      expect(achievement).toBeDefined();
      expect(achievement.id).toBeDefined();
      expect(achievement.name).toBeDefined();
      expect(achievement.description).toBeDefined();
      expect(achievement.category).toBeDefined();
      expect(achievement.rarity).toBeDefined();
      expect(achievement.rewards).toBeDefined();
      expect(achievement.rewards.xp).toBeGreaterThan(0);
    });

    it('should have achievements in different categories', () => {
      const categories = new Set(allFitnessAchievements.map(a => a.category));
      
      expect(categories.has('consistency')).toBe(true);
      expect(categories.has('strength')).toBe(true);
      expect(categories.has('milestone')).toBe(true);
    });

    it('should have achievements with different rarities', () => {
      const rarities = new Set(allFitnessAchievements.map(a => a.rarity));
      
      expect(rarities.has('common')).toBe(true);
      expect(rarities.has('rare')).toBe(true);
      expect(rarities.has('legendary')).toBe(true);
    });

    it('should validate achievement requirements', () => {
      const achievement = allFitnessAchievements.find(a => a.id === 'first_workout');
      
      if (achievement) {
        const mockUserAchievement = {
          id: 'test',
          user_id: 'test-user',
          achievement_id: achievement.id,
          is_completed: false,
          current_progress: 0,
          target_progress: 1,
          progress_data: {},
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const mockContext = {
          userStats: {
            userId: 'test-user',
            level: 1,
            totalXP: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalWorkouts: 1,
            lastActive: new Date(),
            updatedAt: new Date()
          },
          recentWorkouts: [],
          personalRecords: [],
          userProfile: {}
        };

        const result = validateFitnessAchievement(achievement, mockUserAchievement, mockContext);
        
        expect(result).toBeDefined();
        expect(result.progress).toBeGreaterThanOrEqual(0);
        expect(result.progress).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Achievement Categories', () => {
    it('should have consistency achievements', () => {
      const consistencyAchievements = allFitnessAchievements.filter(a => a.category === 'consistency');
      
      expect(consistencyAchievements.length).toBeGreaterThan(0);
      
      // Should have streak achievements
      const streakAchievements = consistencyAchievements.filter(a => a.id.includes('streak'));
      expect(streakAchievements.length).toBeGreaterThan(0);
    });

    it('should have strength achievements', () => {
      const strengthAchievements = allFitnessAchievements.filter(a => a.category === 'strength');
      
      expect(strengthAchievements.length).toBeGreaterThan(0);
      
      // Should have PR achievements
      const prAchievements = strengthAchievements.filter(a => a.id.includes('pr'));
      expect(prAchievements.length).toBeGreaterThan(0);
    });

    it('should have milestone achievements', () => {
      const milestoneAchievements = allFitnessAchievements.filter(a => a.category === 'milestone');
      
      expect(milestoneAchievements.length).toBeGreaterThan(0);
      
      // Should have workout count achievements
      const workoutAchievements = milestoneAchievements.filter(a => a.id.includes('workout'));
      expect(workoutAchievements.length).toBeGreaterThan(0);
    });
  });

  describe('Achievement Progression', () => {
    it('should have progressive difficulty in achievements', () => {
      const streakAchievements = allFitnessAchievements
        .filter(a => a.id.includes('streak'))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      
      if (streakAchievements.length >= 2) {
        // Later achievements should have higher XP rewards
        expect(streakAchievements[1].rewards.xp).toBeGreaterThan(streakAchievements[0].rewards.xp);
      }
    });

    it('should have proper sort order', () => {
      const sortedAchievements = [...allFitnessAchievements].sort((a, b) => a.sortOrder - b.sortOrder);
      
      // First achievement should have lower sort order than last
      expect(sortedAchievements[0].sortOrder).toBeLessThan(
        sortedAchievements[sortedAchievements.length - 1].sortOrder
      );
    });
  });

  describe('Achievement Rewards', () => {
    it('should have appropriate XP rewards based on rarity', () => {
      const commonAchievements = allFitnessAchievements.filter(a => a.rarity === 'common');
      const legendaryAchievements = allFitnessAchievements.filter(a => a.rarity === 'legendary');
      
      if (commonAchievements.length > 0 && legendaryAchievements.length > 0) {
        const avgCommonXP = commonAchievements.reduce((sum, a) => sum + a.rewards.xp, 0) / commonAchievements.length;
        const avgLegendaryXP = legendaryAchievements.reduce((sum, a) => sum + a.rewards.xp, 0) / legendaryAchievements.length;
        
        expect(avgLegendaryXP).toBeGreaterThan(avgCommonXP);
      }
    });

    it('should have titles for significant achievements', () => {
      const significantAchievements = allFitnessAchievements.filter(a => 
        a.rarity === 'rare' || a.rarity === 'epic' || a.rarity === 'legendary'
      );
      
      const achievementsWithTitles = significantAchievements.filter(a => a.rewards.title);
      
      // Most significant achievements should have titles
      expect(achievementsWithTitles.length).toBeGreaterThan(0);
    });
  });

  describe('System Integration', () => {
    it('should have consistent achievement IDs', () => {
      const ids = allFitnessAchievements.map(a => a.id);
      const uniqueIds = new Set(ids);
      
      // All IDs should be unique
      expect(uniqueIds.size).toBe(ids.length);
      
      // IDs should follow naming convention
      ids.forEach(id => {
        expect(id).toMatch(/^[a-z0-9_]+$/);
      });
    });

    it('should have valid achievement structure for database storage', () => {
      allFitnessAchievements.forEach(achievement => {
        // Required fields for database
        expect(achievement.id).toBeDefined();
        expect(achievement.name).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.category).toBeDefined();
        expect(achievement.rarity).toBeDefined();
        expect(achievement.rewards).toBeDefined();
        expect(achievement.rewards.xp).toBeGreaterThan(0);
        expect(achievement.sortOrder).toBeGreaterThanOrEqual(0);
        expect(typeof achievement.isSecret).toBe('boolean');
        expect(typeof achievement.isRepeatable).toBe('boolean');
      });
    });
  });
});