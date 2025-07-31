// ChallengeRewards Component - Display and manage challenge rewards
// Implements requirement 12.3 - Challenge reward system integration

import React, { useState } from 'react';
import { ChallengeReward, Challenge } from '../../types/challenges';
import { REWARD_RARITY_INFO } from '../../constants/challenges';

interface ChallengeRewardsProps {
  challenge: Challenge;
  userRank?: number;
  isCompleted?: boolean;
  earnedRewards?: ChallengeReward[];
  onClaimReward?: (rewardId: string) => void;
  className?: string;
  showOnlyEarned?: boolean;
}

export const ChallengeRewards: React.FC<ChallengeRewardsProps> = ({
  challenge,
  userRank,
  isCompleted = false,
  earnedRewards = [],
  onClaimReward,
  className = '',
  showOnlyEarned = false
}) => {
  const [selectedReward, setSelectedReward] = useState<ChallengeReward | null>(null);

  // Determine which rewards the user can earn based on their rank
  const getRewardEligibility = (reward: ChallengeReward) => {
    if (!userRank) return { eligible: false, reason: 'Not participating' };
    
    switch (reward.unlock_condition) {
      case 'participation':
        return { eligible: true, reason: 'For participating' };
      case 'completion':
        return { eligible: isCompleted, reason: isCompleted ? 'Challenge completed' : 'Complete the challenge' };
      case 'top_10':
        return { eligible: userRank <= 10, reason: userRank <= 10 ? 'Top 10 finish' : 'Finish in top 10' };
      case 'top_3':
        return { eligible: userRank <= 3, reason: userRank <= 3 ? 'Top 3 finish' : 'Finish in top 3' };
      case 'winner':
        return { eligible: userRank === 1, reason: userRank === 1 ? 'Challenge winner' : 'Win the challenge' };
      default:
        return { eligible: false, reason: 'Unknown condition' };
    }
  };

  // Filter rewards based on showOnlyEarned prop
  const displayRewards = showOnlyEarned 
    ? challenge.rewards.filter(reward => earnedRewards.some(earned => earned.id === reward.id))
    : challenge.rewards;

  // Group rewards by unlock condition
  const groupedRewards = displayRewards.reduce((groups, reward) => {
    const condition = reward.unlock_condition;
    if (!groups[condition]) {
      groups[condition] = [];
    }
    groups[condition].push(reward);
    return groups;
  }, {} as Record<string, ChallengeReward[]>);

  const getRewardIcon = (reward: ChallengeReward) => {
    switch (reward.type) {
      case 'xp': return '⚡';
      case 'badge': return '🏆';
      case 'title': return '👑';
      case 'premium_content': return '📚';
      case 'discount': return '💰';
      default: return '🎁';
    }
  };

  const getConditionTitle = (condition: string) => {
    switch (condition) {
      case 'participation': return 'Participation Rewards';
      case 'completion': return 'Completion Rewards';
      case 'top_10': return 'Top 10 Rewards';
      case 'top_3': return 'Top 3 Rewards';
      case 'winner': return 'Winner Rewards';
      default: return 'Special Rewards';
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'participation': return '🎯';
      case 'completion': return '✅';
      case 'top_10': return '🔟';
      case 'top_3': return '🥉';
      case 'winner': return '🥇';
      default: return '🎁';
    }
  };

  const isRewardEarned = (reward: ChallengeReward) => {
    return earnedRewards.some(earned => earned.id === reward.id);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Challenge Rewards</h3>
            <p className="text-purple-100">
              {showOnlyEarned 
                ? `${earnedRewards.length} rewards earned`
                : `${challenge.rewards.length} rewards available`
              }
            </p>
          </div>
          <div className="text-white text-3xl">🏆</div>
        </div>
      </div>

      {/* Rewards Content */}
      <div className="p-6">
        {Object.keys(groupedRewards).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎁</div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {showOnlyEarned ? 'No rewards earned yet' : 'No rewards available'}
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              {showOnlyEarned 
                ? 'Complete challenge requirements to earn rewards!'
                : 'This challenge doesn\'t have any rewards configured.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRewards).map(([condition, rewards]) => (
              <div key={condition}>
                {/* Condition Header */}
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">{getConditionIcon(condition)}</span>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    {getConditionTitle(condition)}
                  </h4>
                  {userRank && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      getRewardEligibility(rewards[0]).eligible
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {getRewardEligibility(rewards[0]).reason}
                    </span>
                  )}
                </div>

                {/* Rewards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rewards.map(reward => {
                    const rarityInfo = REWARD_RARITY_INFO[reward.rarity];
                    const eligibility = getRewardEligibility(reward);
                    const earned = isRewardEarned(reward);

                    return (
                      <div
                        key={reward.id}
                        className={`relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:scale-105 ${
                          earned
                            ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                            : eligibility.eligible
                              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-500'
                              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 opacity-60'
                        }`}
                        onClick={() => setSelectedReward(reward)}
                      >
                        {/* Rarity Glow Effect */}
                        {rarityInfo.glow && eligibility.eligible && (
                          <div 
                            className="absolute inset-0 rounded-lg opacity-20 animate-pulse"
                            style={{ backgroundColor: rarityInfo.color }}
                          />
                        )}

                        {/* Reward Content */}
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">{getRewardIcon(reward)}</div>
                              <div>
                                <h5 className="font-semibold text-gray-900 dark:text-white">
                                  {reward.type === 'xp' ? `${reward.value} XP` : reward.value}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {reward.description}
                                </p>
                              </div>
                            </div>
                            
                            {/* Rarity Badge */}
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                              style={{ backgroundColor: rarityInfo.color }}
                            >
                              {rarityInfo.name}
                            </span>
                          </div>

                          {/* Status Indicator */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {reward.unlock_condition.replace('_', ' ')}
                            </span>
                            
                            {earned ? (
                              <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                <span className="text-sm">✓</span>
                                <span className="text-xs font-semibold">Earned</span>
                              </div>
                            ) : eligibility.eligible ? (
                              <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                                <span className="text-sm">🎯</span>
                                <span className="text-xs font-semibold">Available</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                                <span className="text-sm">🔒</span>
                                <span className="text-xs">Locked</span>
                              </div>
                            )}
                          </div>

                          {/* Claim Button */}
                          {earned && onClaimReward && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onClaimReward(reward.id);
                              }}
                              className="mt-3 w-full py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold text-sm hover:from-green-600 hover:to-blue-600 transition-all duration-200"
                            >
                              Claim Reward
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!showOnlyEarned && userRank && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {challenge.rewards.filter(r => getRewardEligibility(r).eligible).length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Available
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {earnedRewards.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Earned
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {challenge.rewards.filter(r => r.type === 'xp').reduce((sum, r) => sum + (r.value as number), 0)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total XP
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reward Detail Modal */}
      {selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Reward Details
                </h3>
                <button
                  onClick={() => setSelectedReward(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{getRewardIcon(selectedReward)}</div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {selectedReward.type === 'xp' ? `${selectedReward.value} XP` : selectedReward.value}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedReward.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">
                    {selectedReward.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rarity:</span>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: REWARD_RARITY_INFO[selectedReward.rarity].color }}
                  >
                    {REWARD_RARITY_INFO[selectedReward.rarity].name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Unlock:</span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">
                    {selectedReward.unlock_condition.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedReward(null)}
                className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeRewards;