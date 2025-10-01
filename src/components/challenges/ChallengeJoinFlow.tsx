// ChallengeJoinFlow Component - Handle challenge joining process
// Implements requirement 12.2 - Challenge join flow with confirmation

import React, { useState } from 'react';
import { Challenge, ChallengeRequirement, ChallengeReward } from '../../types/challenges';
import { 
  CHALLENGE_CATEGORIES_INFO, 
  DIFFICULTY_INFO,
  REWARD_RARITY_INFO 
} from '../../constants/challenges';

interface ChallengeJoinFlowProps {
  challenge: Challenge;
  onJoin: (challengeId: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

export const ChallengeJoinFlow: React.FC<ChallengeJoinFlowProps> = ({
  challenge,
  onJoin,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState<'overview' | 'requirements' | 'rewards' | 'confirm'>('overview');
  const [isJoining, setIsJoining] = useState(false);

  const categoryInfo = CHALLENGE_CATEGORIES_INFO[challenge.category];
  const difficultyInfo = DIFFICULTY_INFO[challenge.difficulty_level] || DIFFICULTY_INFO[1]; // Fallback to beginner

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await onJoin(challenge.id);
    } catch (error) {
      console.error('Failed to join challenge:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const endDate = new Date(challenge.end_date);
    const diffMs = endDate.getTime() - now.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    if (hours > 0) return `${hours} hours`;
    return 'Less than 1 hour';
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Challenge Header */}
            <div className="text-center">
              <div className="text-4xl mb-2">{categoryInfo.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {challenge.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {challenge.description}
              </p>
            </div>

            {/* Challenge Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {challenge.participants_count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Participants
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {getTimeRemaining()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Remaining
                </div>
              </div>
            </div>

            {/* Challenge Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-semibold text-gray-900 dark:text-white capitalize">
                  {challenge.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Category:</span>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: categoryInfo.color }}
                >
                  {categoryInfo.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                <span 
                  className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: difficultyInfo.color }}
                >
                  {difficultyInfo.name}
                </span>
              </div>
              {challenge.max_participants && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Spots Available:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {challenge.max_participants - challenge.participants_count} / {challenge.max_participants}
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            {challenge.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {challenge.tags.map(tag => (
                    <span 
                      key={tag}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'requirements':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Challenge Requirements
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Complete all requirements to finish the challenge
              </p>
            </div>

            <div className="space-y-4">
              {challenge.requirements.map((req, index) => (
                <RequirementCard key={req.id} requirement={req} index={index} />
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-blue-500 text-xl">💡</div>
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Pro Tip
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Track your progress daily and stay consistent. You can view your progress 
                    anytime in the challenge dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'rewards':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Challenge Rewards
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Earn these rewards based on your performance
              </p>
            </div>

            <div className="space-y-4">
              {challenge.rewards.map((reward, index) => (
                <RewardCard key={reward.id} reward={reward} index={index} />
              ))}
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-purple-500 text-xl">🎁</div>
                <div>
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    Bonus Rewards
                  </h4>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">
                    Additional XP bonuses may be awarded for exceptional performance 
                    and helping other participants!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Ready to Join?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You're about to join "{challenge.name}". Are you ready for the challenge?
              </p>
            </div>

            {/* Final Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Challenge:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {challenge.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {getTimeRemaining()} remaining
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Requirements:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {challenge.requirements.length} to complete
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Rewards:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {challenge.rewards.length} available
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="text-yellow-500 text-xl">⚠️</div>
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Important
                  </h4>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    Once you join, you cannot leave the challenge. Make sure you're 
                    committed to completing the requirements!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'overview': return 'Challenge Overview';
      case 'requirements': return 'Requirements';
      case 'rewards': return 'Rewards';
      case 'confirm': return 'Confirmation';
      default: return '';
    }
  };

  const canProceed = () => {
    return currentStep !== 'confirm';
  };

  const getNextStep = () => {
    switch (currentStep) {
      case 'overview': return 'requirements';
      case 'requirements': return 'rewards';
      case 'rewards': return 'confirm';
      default: return 'overview';
    }
  };

  const getPrevStep = () => {
    switch (currentStep) {
      case 'requirements': return 'overview';
      case 'rewards': return 'requirements';
      case 'confirm': return 'rewards';
      default: return 'overview';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {getStepTitle()}
          </h2>
          <button
            onClick={onCancel}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center space-x-2 mt-4">
          {['overview', 'requirements', 'rewards', 'confirm'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === step 
                  ? 'bg-white text-blue-600' 
                  : index < ['overview', 'requirements', 'rewards', 'confirm'].indexOf(currentStep)
                    ? 'bg-blue-300 text-blue-800'
                    : 'bg-blue-400 text-blue-100'
              }`}>
                {index + 1}
              </div>
              {index < 3 && (
                <div className={`w-8 h-1 mx-1 ${
                  index < ['overview', 'requirements', 'rewards', 'confirm'].indexOf(currentStep)
                    ? 'bg-blue-300'
                    : 'bg-blue-400'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {renderStepContent()}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-b-xl">
        <div className="flex justify-between">
          <button
            onClick={() => currentStep === 'overview' ? onCancel() : setCurrentStep(getPrevStep())}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {currentStep === 'overview' ? 'Cancel' : 'Back'}
          </button>

          {canProceed() ? (
            <button
              onClick={() => setCurrentStep(getNextStep())}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleJoin}
              disabled={isJoining || isLoading}
              className="px-8 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining || isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Joining...</span>
                </div>
              ) : (
                'Join Challenge!'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper components
const RequirementCard: React.FC<{ requirement: ChallengeRequirement; index: number }> = ({ 
  requirement, 
  index 
}) => (
  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
    <div className="flex items-start space-x-3">
      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
        {index + 1}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
          {requirement.description}
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Target: <span className="font-semibold">{requirement.target_value} {requirement.target_unit}</span>
          {requirement.timeframe !== 'total' && (
            <span> per {requirement.timeframe.replace('ly', '')}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

const RewardCard: React.FC<{ reward: ChallengeReward; index: number }> = ({ reward, index }) => {
  const rarityInfo = REWARD_RARITY_INFO[reward.rarity];
  
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: rarityInfo.color }}
        >
          {reward.type === 'xp' ? '⚡' :
           reward.type === 'badge' ? '🏆' :
           reward.type === 'title' ? '👑' :
           reward.type === 'premium_content' ? '📚' : '💰'}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {reward.description}
            </h4>
            <span 
              className="px-2 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: rarityInfo.color }}
            >
              {rarityInfo.name}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Unlock condition: <span className="font-semibold capitalize">
              {reward.unlock_condition.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeJoinFlow;