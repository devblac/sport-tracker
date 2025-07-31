// ChallengeCard Component - Display individual challenge information
// Implements requirement 12.2 - Challenge UI components

import React from 'react';
import { Challenge, ChallengeParticipant } from '../../types/challenges';
import { 
  CHALLENGE_CATEGORIES_INFO, 
  DIFFICULTY_INFO, 
  CHALLENGE_STATUS_MESSAGES 
} from '../../constants/challenges';

interface ChallengeCardProps {
  challenge: Challenge;
  userParticipant?: ChallengeParticipant;
  onJoin?: (challengeId: string) => void;
  onView?: (challengeId: string) => void;
  className?: string;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  userParticipant,
  onJoin,
  onView,
  className = ''
}) => {
  const categoryInfo = CHALLENGE_CATEGORIES_INFO[challenge.category];
  const difficultyInfo = DIFFICULTY_INFO[challenge.difficulty_level];
  
  // Calculate challenge status
  const now = new Date();
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);
  
  const getStatus = () => {
    if (!challenge.is_active) return 'ended';
    if (startDate > now) return 'not_started';
    if (endDate < now) return 'ended';
    if (challenge.max_participants && challenge.participants_count >= challenge.max_participants) return 'full';
    if (userParticipant?.is_completed) return 'completed';
    if (userParticipant) return 'joined';
    
    const hoursUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilEnd < 24) return 'ending_soon';
    
    return 'active';
  };

  const status = getStatus();
  const isJoinable = status === 'active' && !userParticipant;
  const progress = userParticipant?.progress || 0;

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (status === 'ended' || status === 'not_started') return null;
    
    const diffMs = endDate.getTime() - now.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ending soon';
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${className}`}>
      {/* Challenge Image/Header */}
      <div 
        className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden"
        style={{ 
          background: challenge.image_url 
            ? `url(${challenge.image_url}) center/cover` 
            : `linear-gradient(135deg, ${categoryInfo.color}40, ${difficultyInfo.color}40)`
        }}
      >
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg"
            style={{ backgroundColor: categoryInfo.color }}
          >
            {categoryInfo.icon} {categoryInfo.name}
          </span>
        </div>

        {/* Difficulty Badge */}
        <div className="absolute top-3 right-3">
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg"
            style={{ backgroundColor: difficultyInfo.color }}
          >
            {difficultyInfo.name}
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
            status === 'active' ? 'bg-green-500 text-white' :
            status === 'joined' ? 'bg-blue-500 text-white' :
            status === 'completed' ? 'bg-purple-500 text-white' :
            status === 'ending_soon' ? 'bg-orange-500 text-white' :
            status === 'full' ? 'bg-red-500 text-white' :
            'bg-gray-500 text-white'
          }`}>
            {CHALLENGE_STATUS_MESSAGES[status]}
          </span>
        </div>

        {/* Time Remaining */}
        {timeRemaining && (
          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black bg-opacity-50 text-white">
              {timeRemaining}
            </span>
          </div>
        )}
      </div>

      {/* Challenge Content */}
      <div className="p-4">
        {/* Title and Type */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2">
            {challenge.name}
          </h3>
          <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
            {challenge.type}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {challenge.description}
        </p>

        {/* Requirements Preview */}
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Requirements
          </h4>
          <div className="space-y-1">
            {challenge.requirements.slice(0, 2).map((req, index) => (
              <div key={req.id} className="text-xs text-gray-600 dark:text-gray-300">
                • {req.description}
              </div>
            ))}
            {challenge.requirements.length > 2 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{challenge.requirements.length - 2} more requirements
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar (if participating) */}
        {userParticipant && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Your Progress
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {userParticipant.rank && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Rank #{userParticipant.rank} of {challenge.participants_count}
              </div>
            )}
          </div>
        )}

        {/* Participants and Rewards Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center space-x-3">
            <span>
              👥 {challenge.participants_count}
              {challenge.max_participants && ` / ${challenge.max_participants}`}
            </span>
            <span>
              🎁 {challenge.rewards.length} rewards
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {challenge.tags.slice(0, 2).map(tag => (
              <span 
                key={tag}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {isJoinable && onJoin && (
            <button
              onClick={() => onJoin(challenge.id)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold text-sm hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              Join Challenge
            </button>
          )}
          
          {onView && (
            <button
              onClick={() => onView(challenge.id)}
              className={`${isJoinable ? 'flex-none px-4' : 'flex-1'} border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-semibold text-sm hover:border-blue-500 hover:text-blue-500 transition-all duration-200`}
            >
              View Details
            </button>
          )}
        </div>

        {/* Rewards Preview */}
        {challenge.rewards.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Top Rewards
              </span>
              <div className="flex space-x-1">
                {challenge.rewards.slice(0, 3).map((reward, index) => (
                  <div 
                    key={reward.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ 
                      backgroundColor: reward.rarity === 'legendary' ? '#FF9800' :
                                     reward.rarity === 'epic' ? '#9C27B0' :
                                     reward.rarity === 'rare' ? '#2196F3' : '#9E9E9E'
                    }}
                    title={reward.description}
                  >
                    {reward.type === 'xp' ? '⚡' :
                     reward.type === 'badge' ? '🏆' :
                     reward.type === 'title' ? '👑' :
                     reward.type === 'premium_content' ? '📚' : '💰'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeCard;