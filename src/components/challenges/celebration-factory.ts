// Factory Pattern for Celebration Components - Better extensibility

import React from 'react';

// Celebration types
export type CelebrationType = 'challenge_completion' | 'milestone_reached' | 'achievement_unlocked' | 'streak_milestone';

// Base celebration data interface
export interface BaseCelebrationData {
  type: CelebrationType;
  title: string;
  xp: number;
  duration?: number;
}

// Specific celebration data interfaces
export interface ChallengeCompletionData extends BaseCelebrationData {
  type: 'challenge_completion';
  rank: number;
  totalParticipants: number;
  completionTime?: number;
  specialRewards: string[];
}

export interface MilestoneData extends BaseCelebrationData {
  type: 'milestone_reached';
  milestone: number;
  progress: number;
}

export interface AchievementData extends BaseCelebrationData {
  type: 'achievement_unlocked';
  achievementId: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface StreakMilestoneData extends BaseCelebrationData {
  type: 'streak_milestone';
  streakDays: number;
  streakType: 'workout' | 'login' | 'challenge';
}

// Union type for all celebration data
export type CelebrationData = ChallengeCompletionData | MilestoneData | AchievementData | StreakMilestoneData;

// Abstract celebration component interface
export interface CelebrationComponent {
  render(data: CelebrationData, onComplete?: () => void): React.ReactElement;
  getDuration(data: CelebrationData): number;
  getAnimations(data: CelebrationData): string[];
}

// Base celebration component class
abstract class BaseCelebrationComponent implements CelebrationComponent {
  abstract render(data: CelebrationData, onComplete?: () => void): React.ReactElement;
  
  getDuration(data: CelebrationData): number {
    return data.duration || this.getDefaultDuration();
  }

  protected abstract getDefaultDuration(): number;
  
  getAnimations(data: CelebrationData): string[] {
    return ['fadeIn', 'scaleUp'];
  }

  protected formatXP(xp: number): string {
    return xp.toLocaleString();
  }

  protected getEmoji(type: CelebrationType): string {
    const emojis = {
      challenge_completion: '🏆',
      milestone_reached: '🎯',
      achievement_unlocked: '🏅',
      streak_milestone: '🔥'
    };
    return emojis[type] || '🎉';
  }
}

// Concrete celebration components
class ChallengeCompletionCelebration extends BaseCelebrationComponent {
  protected getDefaultDuration(): number {
    return 6000;
  }

  render(data: CelebrationData, onComplete?: () => void): React.ReactElement {
    if (data.type !== 'challenge_completion') {
      throw new Error('Invalid data type for ChallengeCompletionCelebration');
    }

    const challengeData = data as ChallengeCompletionData;
    
    return React.createElement('div', {
      className: 'celebration-challenge-completion',
      key: 'challenge-completion'
    }, [
      React.createElement('h1', { key: 'title' }, `${this.getEmoji(data.type)} ${data.title}`),
      React.createElement('p', { key: 'rank' }, `Rank: ${challengeData.rank}/${challengeData.totalParticipants}`),
      React.createElement('div', { key: 'xp' }, `${this.formatXP(data.xp)} XP`)
    ]);
  }
}

class MilestoneCelebration extends BaseCelebrationComponent {
  protected getDefaultDuration(): number {
    return 4000;
  }

  render(data: CelebrationData, onComplete?: () => void): React.ReactElement {
    if (data.type !== 'milestone_reached') {
      throw new Error('Invalid data type for MilestoneCelebration');
    }

    const milestoneData = data as MilestoneData;
    
    return React.createElement('div', {
      className: 'celebration-milestone',
      key: 'milestone'
    }, [
      React.createElement('h1', { key: 'title' }, `${this.getEmoji(data.type)} ${data.title}`),
      React.createElement('p', { key: 'progress' }, `${milestoneData.milestone}% Complete!`),
      React.createElement('div', { key: 'xp' }, `${this.formatXP(data.xp)} XP`)
    ]);
  }
}

// Factory class
export class CelebrationFactory {
  private static components = new Map<CelebrationType, BaseCelebrationComponent>([
    ['challenge_completion', new ChallengeCompletionCelebration()],
    ['milestone_reached', new MilestoneCelebration()],
  ]);

  static createCelebration(data: CelebrationData, onComplete?: () => void): React.ReactElement {
    const component = this.components.get(data.type);
    if (!component) {
      throw new Error(`No celebration component found for type: ${data.type}`);
    }
    return component.render(data, onComplete);
  }

  static registerComponent(type: CelebrationType, component: BaseCelebrationComponent): void {
    this.components.set(type, component);
  }

  static getDuration(data: CelebrationData): number {
    const component = this.components.get(data.type);
    return component?.getDuration(data) || 3000;
  }
}

// Usage example:
// const celebrationElement = CelebrationFactory.createCelebration({
//   type: 'challenge_completion',
//   title: 'Ultimate Fitness Challenge',
//   xp: 1500,
//   rank: 1,
//   totalParticipants: 50,
//   specialRewards: ['perfectionist']
// }, onComplete);