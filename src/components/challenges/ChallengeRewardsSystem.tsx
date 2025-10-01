/**
 * ChallengeRewardsSystem Component - Manage and display challenge rewards
 * Implements requirement 12.3 - Sistema de recompensas por challenges completados
 */

import React, { useState, useEffect } from 'react';
import { ChallengeReward, Challenge, ChallengeParticipant } from '@/types/challenges';
import { 
  Trophy, 
  Award, 
  Star, 
  Gift, 
  Crown,
  Zap,
  Medal,
  Sparkles,
  Check,
  Lock,
  Clock
} from 'lucide-react';

interface UnlockedReward {
  reward: ChallengeReward;
  unlockedAt: Date;
  challenge: Challenge;
  rank?: number;
  isNew?: boolean;
}

interface ChallengeRewardsSystemProps {
  challenge: Challenge;
  participant?: ChallengeParticipant;
  unlockedRewards?: UnlockedReward[];
  onClaimReward?: (rewardId: string) => Promise<void>;
  showUnlockedOnly?: boolean;
  className?: string;
}

export const ChallengeRewardsSystem: React.FC<ChallengeRewardsSystemProps> = ({
  challenge,
  participant,
  unlockedRewards = [],
  onClaimReward,
  showUnlockedOnly = false,
  className = ''
}) => {
  const [claimingRewards, setClaimingRewards] = useState<Set<string>>(new Set());
  const [celebratingReward, setCelebratingReward] = useState<string | null>(null);

  // Check if reward is unlocked
  const isRewardUnlocked = (reward: ChallengeReward): boolean => {
    if (!participant) return false;

    switch (reward.unlock_condition) {
      case 'participation':
        return true; // Already participating
      case 'completion':
        return participant.is_completed;
      case 'top_10':
        return participant.rank <= 10;
      case 'top_3':
        return participant.rank <= 3;
      case 'winner':
        return participant.rank === 1;
      default:
        return false;
    }
  };

  // Check if reward is claimed
  const isRewardClaimed = (rewardId: string): boolean => {
    return unlockedRewards.some(ur => ur.reward.id === rewardId);
  };

  // Get rarity styling
  const getRarityStyling = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return {
          bg: 'bg-gray-100 dark:bg-gray-700',
          border: 'border-gray-300 dark:border-gray-600',
          text: 'text-gray-700 dark:text-gray-300',
          glow: ''
        };
      case 'rare':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/20',
          border: 'border-blue-300 dark:border-blue-600',
          text: 'text-blue-700 dark:text-blue-300',
          glow: 'shadow-blue-200 dark:shadow-blue-900/50'
        };
      case 'epic':
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/20',
          border: 'border-purple-300 dark:border-purple-600',
          text: 'text-purple-700 dark:text-purple-300',
          glow: 'shadow-purple-200 dark:shadow-purple-900/50'
        };
      case 'legendary':
        return {
          bg: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20',
          border: 'border-yellow-400 dark:border-yellow-600',
          text: 'text-yellow-700 dark:text-yellow-300',
          glow: 'shadow-lg shadow-yellow-200 dark:shadow-yellow-900/50'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-700',
          border: 'border-gray-300 dark:border-gray-600',
          text: 'text-gray-700 dark:text-gray-300',
          glow: ''
        };
    }
  };

  // Get reward icon
  const getRewardIcon = (reward: ChallengeReward) => {
    switch (reward.type) {
      case 'xp':
        return <Zap className="w-6 h-6" />;
      case 'badge':
        return <Award className="w-6 h-6" />;
      case 'title':
        return <Crown className="w-6 h-6" />;
      case 'premium_content':
        return <Star className="w-6 h-6" />;
      case 'discount':
        return <Gift className="w-6 h-6" />;
      default:
        return <Trophy className="w-6 h-6" />;
    }
  };

  // Handle reward claim
  const handleClaimReward = async (rewardId: string) => {
    if (!onClaimReward || claimingRewards.has(rewardId)) return;

    setClaimingRewards(prev => new Set(prev).add(rewardId));
    
    try {
      await onClaimReward(rewardId);
      
      // Show celebration animation
      setCelebratingReward(rewardId);
      setTimeout(() => setCelebratingReward(null), 3000);
    } catch (error) {
      console.error('Failed to claim reward:', error);
    } finally {
      setClaimingRewards(prev => {
        const newSet = new Set(prev);
        newSet.delete(rewardId);
        return newSet;
      });
    }
  };

  // Filter rewards based on showUnlockedOnly
  const displayRewards = showUnlockedOnly 
    ? challenge.rewards.filter(reward => isRewardUnlocked(reward))
    : challenge.rewards;

  // Sort rewards by rarity and unlock status
  const sortedRewards = [...displayRewards].sort((a, b) => {
    const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
    const aUnlocked = isRewardUnlocked(a);
    const bUnlocked = isRewardUnlocked(b);
    
    // Unlocked rewards first
    if (aUnlocked !== bUnlocked) {
      return bUnlocked ? 1 : -1;
    }
    
    // Then by rarity
    return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder];
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <span>Challenge Rewards</span>
        </h3>
        
        {participant && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {unlockedRewards.length} of {challenge.rewards.length} unlocked
          </div>
        )}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedRewards.map((reward) => {
          const styling = getRarityStyling(reward.rarity);
          const unlocked = isRewardUnlocked(reward);
          const claimed = isRewardClaimed(reward.id);
          const claiming = claimingRewards.has(reward.id);
          const celebrating = celebratingReward === reward.id;

          return (
            <RewardCard
              key={reward.id}
              reward={reward}
              styling={styling}
              unlocked={unlocked}
              claimed={claimed}
              claiming={claiming}
              celebrating={celebrating}
              onClaim={() => handleClaimReward(reward.id)}
              participant={participant}
            />
          );
        })}
      </div>

      {/* Unlocked Rewards History */}
      {unlockedRewards.length > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>Recently Unlocked</span>
          </h4>
          
          <div className="space-y-3">
            {unlockedRewards
              .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
              .slice(0, 5)
              .map((unlockedReward, index) => (
                <UnlockedRewardItem
                  key={`${unlockedReward.reward.id}-${unlockedReward.unlockedAt.getTime()}`}
                  unlockedReward={unlockedReward}
                  isNew={index === 0 && unlockedReward.isNew}
                />
              ))}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {participant && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Reward Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {unlockedRewards.length} / {challenge.rewards.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${(unlockedRewards.length / challenge.rewards.length) * 100}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Individual reward card component
interface RewardStyling {
  bg: string;
  border: string;
  glow: string;
  text: string;
}

interface RewardCardProps {
  reward: ChallengeReward;
  styling: RewardStyling;
  unlocked: boolean;
  claimed: boolean;
  claiming: boolean;
  celebrating: boolean;
  onClaim: () => void;
  participant?: ChallengeParticipant;
}

const RewardCard: React.FC<RewardCardProps> = ({
  reward,
  styling,
  unlocked,
  claimed,
  claiming,
  celebrating,
  onClaim,
  participant
}) => {
  const getRewardIcon = (reward: ChallengeReward) => {
    switch (reward.type) {
      case 'xp':
        return <Zap className="w-6 h-6" />;
      case 'badge':
        return <Award className="w-6 h-6" />;
      case 'title':
        return <Crown className="w-6 h-6" />;
      case 'premium_content':
        return <Star className="w-6 h-6" />;
      case 'discount':
        return <Gift className="w-6 h-6" />;
      default:
        return <Trophy className="w-6 h-6" />;
    }
  };

  const getUnlockConditionText = (condition: string) => {
    switch (condition) {
      case 'participation':
        return 'Join the challenge';
      case 'completion':
        return 'Complete the challenge';
      case 'top_10':
        return 'Finish in top 10';
      case 'top_3':
        return 'Finish in top 3';
      case 'winner':
        return 'Win the challenge';
      default:
        return 'Meet requirements';
    }
  };

  return (
    <div className={`
      relative rounded-xl border-2 p-4 transition-all duration-300 transform
      ${styling.bg} ${styling.border} ${styling.glow}
      ${celebrating ? 'animate-pulse scale-105' : ''}
      ${unlocked ? 'hover:scale-105' : 'opacity-60'}
    `}>
      {/* Rarity indicator */}
      <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold ${styling.text} ${styling.bg} border ${styling.border}`}>
        {reward.rarity.toUpperCase()}
      </div>

      {/* Status indicators */}
      {claimed && (
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {!unlocked && (
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
          <Lock className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Reward content */}
      <div className="text-center space-y-3">
        <div className={`w-16 h-16 mx-auto rounded-full ${styling.bg} border-2 ${styling.border} flex items-center justify-center ${styling.text}`}>
          {getRewardIcon(reward)}
        </div>

        <div>
          <h4 className={`font-semibold ${styling.text}`}>
            {reward.description}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {reward.type === 'xp' ? `${reward.value} XP` : reward.value}
          </p>
        </div>

        {/* Unlock condition */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {getUnlockConditionText(reward.unlock_condition)}
        </div>

        {/* Action button */}
        {unlocked && !claimed && (
          <button
            onClick={onClaim}
            disabled={claiming}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              claiming
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                : `${styling.bg} ${styling.text} border ${styling.border} hover:opacity-80`
            }`}
          >
            {claiming ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Claiming...</span>
              </div>
            ) : (
              'Claim Reward'
            )}
          </button>
        )}

        {claimed && (
          <div className="flex items-center justify-center space-x-2 text-green-600 text-sm font-medium">
            <Check className="w-4 h-4" />
            <span>Claimed</span>
          </div>
        )}

        {!unlocked && participant && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Current rank: #{participant.rank}
          </div>
        )}
      </div>
    </div>
  );
};

// Unlocked reward history item
interface UnlockedRewardItemProps {
  unlockedReward: UnlockedReward;
  isNew?: boolean;
}

const UnlockedRewardItem: React.FC<UnlockedRewardItemProps> = ({
  unlockedReward,
  isNew = false
}) => {
  const { reward, unlockedAt, challenge, rank } = unlockedReward;
  const styling = {
    common: 'text-gray-600',
    rare: 'text-blue-600',
    epic: 'text-purple-600',
    legendary: 'text-yellow-600'
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      isNew 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${
          styling[reward.rarity as keyof typeof styling]
        }`}>
          <Trophy className="w-5 h-5" />
        </div>
        
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {reward.description}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            From: {challenge.name}
            {rank && ` • Rank #${rank}`}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className={`text-sm font-medium ${styling[reward.rarity as keyof typeof styling]}`}>
          {reward.rarity}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {unlockedAt.toLocaleDateString()}
        </div>
      </div>

      {isNew && (
        <div className="ml-3 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
          NEW
        </div>
      )}
    </div>
  );
};