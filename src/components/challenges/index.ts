// Challenge Components Index
// Exports all challenge-related UI components

export { ChallengeCard } from './ChallengeCard';
export { default as ChallengeList } from './ChallengeList';
export { ChallengeLeaderboard } from './ChallengeLeaderboard';
export { ChallengeCreator } from './ChallengeCreator';
export { ChallengeInviteModal } from './ChallengeInviteModal';
export { RealTimeLeaderboard } from './RealTimeLeaderboard';
export { ChallengeRewardsSystem } from './ChallengeRewardsSystem';
export { default as ChallengeJoinFlow } from './ChallengeJoinFlow';

// Gamification integration components
export { default as ChallengeCelebration } from './ChallengeCelebration';
export { default as ChallengeRewards } from './ChallengeRewards';
export { default as ChallengeXPProgress } from './ChallengeXPProgress';
export { default as EpicWinnerCelebration } from './EpicWinnerCelebration';

// Export types for convenience
export type {
  Challenge,
  ChallengeParticipant,
  ChallengeLeaderboard as ChallengeLeaderboardType,
  ChallengeFilters,
  ChallengeSearchParams
} from '../../types/challenges';

// Export gamification types
export type {
  CelebrationData,
  AchievementUnlock
} from '../../services/challengeGamificationService';

export type {
  SpecialReward,
  RewardCalculationResult,
  ChallengePerformanceMetrics
} from '../../services/challengeRewardsManager';