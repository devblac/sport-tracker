/**
 * Level Progression Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateUserLevel,
  checkLevelUp,
  getLevelConfig,
  getUnlockedFeatures,
  getNextMilestone,
  getXPNeededForLevel,
  getLevelProgressionStats,
  getLevelRewardsPreview,
  isFeatureUnlocked,
  getFeatureUnlockLevel,
  calculateProgressionVelocity,
  DEFAULT_LEVEL_CONFIGS
} from '../levelProgression';

describe('Level Progression', () => {
  describe('calculateUserLevel', () => {
    it('should calculate correct level for different XP amounts', () => {
      // Level 1: 0 XP
      const level1 = calculateUserLevel(0);
      expect(level1.level).toBe(1);
      expect(level1.title).toBe('Novice');
      expect(level1.progress).toBe(0);

      // Level 2: 100 XP
      const level2 = calculateUserLevel(150);
      expect(level2.level).toBe(2);
      expect(level2.title).toBe('Beginner');
      expect(level2.progress).toBeGreaterThan(0);
      expect(level2.progress).toBeLessThan(1);

      // Level 3: 250 XP
      const level3 = calculateUserLevel(300);
      expect(level3.level).toBe(3);
      expect(level3.title).toBe('Apprentice');
    });

    it('should calculate progress correctly within a level', () => {
      // Level 2 starts at 100 XP, Level 3 starts at 250 XP
      // So level 2 spans 150 XP (100-249)
      const userLevel = calculateUserLevel(175); // 75 XP into level 2
      
      expect(userLevel.level).toBe(2);
      expect(userLevel.currentXP).toBe(75); // 175 - 100
      expect(userLevel.xpForCurrentLevel).toBe(100);
      expect(userLevel.xpForNextLevel).toBe(250);
      expect(userLevel.progress).toBeCloseTo(0.5, 1); // 75/150 = 0.5
    });

    it('should handle maximum level correctly', () => {
      const maxLevel = calculateUserLevel(999999);
      expect(maxLevel.level).toBe(DEFAULT_LEVEL_CONFIGS[DEFAULT_LEVEL_CONFIGS.length - 1].level);
      expect(maxLevel.progress).toBe(1);
    });

    it('should handle exact level boundaries', () => {
      const exactLevel3 = calculateUserLevel(250);
      expect(exactLevel3.level).toBe(3);
      expect(exactLevel3.currentXP).toBe(0);
      expect(exactLevel3.progress).toBe(0);
    });
  });

  describe('checkLevelUp', () => {
    it('should detect level up when crossing boundary', () => {
      const levelUp = checkLevelUp(240, 260); // Level 2 to Level 3
      
      expect(levelUp).toBeDefined();
      expect(levelUp!.oldLevel).toBe(2);
      expect(levelUp!.newLevel).toBe(3);
      expect(levelUp!.newTitle).toBe('Apprentice');
      expect(levelUp!.unlockedFeatures).toContain('personal_records');
    });

    it('should not detect level up within same level', () => {
      const levelUp = checkLevelUp(200, 240); // Both level 2
      expect(levelUp).toBeUndefined();
    });

    it('should handle multiple level jumps', () => {
      const levelUp = checkLevelUp(100, 500); // Level 2 to Level 4
      
      expect(levelUp).toBeDefined();
      expect(levelUp!.oldLevel).toBe(2);
      expect(levelUp!.newLevel).toBe(4);
      expect(levelUp!.newTitle).toBe('Enthusiast');
    });

    it('should return undefined for no level change', () => {
      const levelUp = checkLevelUp(300, 300);
      expect(levelUp).toBeUndefined();
    });
  });

  describe('getLevelConfig', () => {
    it('should return correct config for valid levels', () => {
      const level1Config = getLevelConfig(1);
      expect(level1Config).toBeDefined();
      expect(level1Config!.title).toBe('Novice');
      expect(level1Config!.xpRequired).toBe(0);

      const level3Config = getLevelConfig(3);
      expect(level3Config).toBeDefined();
      expect(level3Config!.title).toBe('Apprentice');
      expect(level3Config!.xpRequired).toBe(250);
    });

    it('should return undefined for invalid levels', () => {
      expect(getLevelConfig(0)).toBeUndefined();
      expect(getLevelConfig(999)).toBeUndefined();
    });
  });

  describe('getUnlockedFeatures', () => {
    it('should return all features unlocked up to current level', () => {
      const level1Features = getUnlockedFeatures(1);
      expect(level1Features).toContain('workout_creation');
      expect(level1Features).toContain('exercise_search');

      const level3Features = getUnlockedFeatures(3);
      expect(level3Features).toContain('workout_creation');
      expect(level3Features).toContain('exercise_search');
      expect(level3Features).toContain('workout_templates');
      expect(level3Features).toContain('basic_analytics');
      expect(level3Features).toContain('personal_records');
      expect(level3Features).toContain('achievements');
    });

    it('should not include features from higher levels', () => {
      const level2Features = getUnlockedFeatures(2);
      expect(level2Features).not.toContain('personal_records'); // Level 3 feature
      expect(level2Features).not.toContain('social_feed'); // Level 4 feature
    });

    it('should remove duplicates', () => {
      const features = getUnlockedFeatures(5);
      const uniqueFeatures = [...new Set(features)];
      expect(features.length).toBe(uniqueFeatures.length);
    });
  });

  describe('getNextMilestone', () => {
    it('should return next milestone level', () => {
      const milestone = getNextMilestone(3);
      expect(milestone).toBeDefined();
      expect(milestone!.level).toBe(5);
      expect(milestone!.title).toBe('Dedicated');
    });

    it('should return null when no more milestones', () => {
      const milestone = getNextMilestone(30);
      expect(milestone).toBeNull();
    });

    it('should skip to next milestone even if current level is milestone', () => {
      const milestone = getNextMilestone(5);
      expect(milestone).toBeDefined();
      expect(milestone!.level).toBe(10);
    });
  });

  describe('getXPNeededForLevel', () => {
    it('should calculate XP needed correctly', () => {
      const xpNeeded = getXPNeededForLevel(3, 200); // Need 250, have 200
      expect(xpNeeded).toBe(50);
    });

    it('should return 0 if already at or above target level', () => {
      const xpNeeded = getXPNeededForLevel(2, 300); // Need 100, have 300
      expect(xpNeeded).toBe(0);
    });

    it('should return 0 for invalid target level', () => {
      const xpNeeded = getXPNeededForLevel(999, 100);
      expect(xpNeeded).toBe(0);
    });
  });

  describe('getLevelProgressionStats', () => {
    it('should return comprehensive progression stats', () => {
      const stats = getLevelProgressionStats(300);
      
      expect(stats.currentLevel.level).toBe(3);
      expect(stats.nextMilestone).toBeDefined();
      expect(stats.nextMilestone!.level).toBe(5);
      expect(stats.progressToNext).toBeGreaterThan(0);
      expect(stats.progressToNext).toBeLessThan(1);
      expect(stats.totalLevels).toBe(DEFAULT_LEVEL_CONFIGS.length);
      expect(stats.completionPercentage).toBeGreaterThan(0);
      expect(stats.completionPercentage).toBeLessThan(100);
    });

    it('should handle maximum level correctly', () => {
      const maxXP = DEFAULT_LEVEL_CONFIGS[DEFAULT_LEVEL_CONFIGS.length - 1].xpRequired;
      const stats = getLevelProgressionStats(maxXP);
      
      expect(stats.completionPercentage).toBe(100);
      expect(stats.nextMilestone).toBeNull();
    });
  });

  describe('getLevelRewardsPreview', () => {
    it('should return preview of upcoming levels', () => {
      const preview = getLevelRewardsPreview(2, 3);
      
      expect(preview).toHaveLength(3);
      expect(preview[0].level).toBe(3);
      expect(preview[1].level).toBe(4);
      expect(preview[2].level).toBe(5);
      
      expect(preview[0].title).toBe('Apprentice');
      expect(preview[0].newPerks).toBeDefined();
      expect(preview[0].newFeatures).toBeDefined();
    });

    it('should handle preview beyond maximum level', () => {
      const maxLevel = DEFAULT_LEVEL_CONFIGS[DEFAULT_LEVEL_CONFIGS.length - 1].level;
      const preview = getLevelRewardsPreview(maxLevel - 1, 5);
      
      expect(preview.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array for maximum level', () => {
      const maxLevel = DEFAULT_LEVEL_CONFIGS[DEFAULT_LEVEL_CONFIGS.length - 1].level;
      const preview = getLevelRewardsPreview(maxLevel, 3);
      
      expect(preview).toHaveLength(0);
    });
  });

  describe('isFeatureUnlocked', () => {
    it('should return true for unlocked features', () => {
      expect(isFeatureUnlocked('workout_creation', 1)).toBe(true);
      expect(isFeatureUnlocked('personal_records', 3)).toBe(true);
      expect(isFeatureUnlocked('social_feed', 4)).toBe(true);
    });

    it('should return false for locked features', () => {
      expect(isFeatureUnlocked('personal_records', 2)).toBe(false);
      expect(isFeatureUnlocked('social_feed', 3)).toBe(false);
      expect(isFeatureUnlocked('advanced_analytics', 4)).toBe(false);
    });

    it('should return false for non-existent features', () => {
      expect(isFeatureUnlocked('non_existent_feature', 10)).toBe(false);
    });
  });

  describe('getFeatureUnlockLevel', () => {
    it('should return correct unlock level for features', () => {
      expect(getFeatureUnlockLevel('workout_creation')).toBe(1);
      expect(getFeatureUnlockLevel('personal_records')).toBe(3);
      expect(getFeatureUnlockLevel('social_feed')).toBe(4);
    });

    it('should return null for non-existent features', () => {
      expect(getFeatureUnlockLevel('non_existent_feature')).toBeNull();
    });
  });

  describe('calculateProgressionVelocity', () => {
    const mockXPHistory = [
      { date: new Date('2025-01-01'), totalXP: 100 },
      { date: new Date('2025-01-08'), totalXP: 200 },
      { date: new Date('2025-01-15'), totalXP: 350 },
      { date: new Date('2025-01-22'), totalXP: 450 },
    ];

    it('should calculate progression velocity correctly', () => {
      const velocity = calculateProgressionVelocity(mockXPHistory);
      
      expect(velocity.xpPerDay).toBeGreaterThan(0);
      expect(velocity.levelsPerWeek).toBeGreaterThan(0);
      expect(velocity.estimatedTimeToNextLevel).toBeGreaterThan(0);
    });

    it('should handle insufficient data', () => {
      const velocity = calculateProgressionVelocity([mockXPHistory[0]]);
      
      expect(velocity.xpPerDay).toBe(0);
      expect(velocity.levelsPerWeek).toBe(0);
      expect(velocity.estimatedTimeToNextLevel).toBe(Infinity);
    });

    it('should handle empty history', () => {
      const velocity = calculateProgressionVelocity([]);
      
      expect(velocity.xpPerDay).toBe(0);
      expect(velocity.levelsPerWeek).toBe(0);
      expect(velocity.estimatedTimeToNextLevel).toBe(Infinity);
    });

    it('should filter to recent history only', () => {
      const oldHistory = [
        { date: new Date('2024-01-01'), totalXP: 0 },
        { date: new Date('2024-06-01'), totalXP: 50 },
        ...mockXPHistory
      ];
      
      const velocity = calculateProgressionVelocity(oldHistory);
      
      // Should be based on recent data, not the old entries
      expect(velocity.xpPerDay).toBeGreaterThan(10);
    });
  });
});