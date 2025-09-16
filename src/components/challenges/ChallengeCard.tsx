/**
 * ChallengeCard Component
 * 
 * Displays a challenge with visual progress, difficulty, and key information.
 * Implements task 14.2 - ChallengeCard with visual progress
 */

import React from 'react';
import type { Challenge, ChallengeParticipant } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  Star,
  Clock,
  Award,
  TrendingUp
} from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  participant?: ChallengeParticipant;
  onJoin?: (challengeId: string) => void;
  onView?: (challengeId: string) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  participant,
  onJoin,
  onView,
  className = '',
  variant = 'default'
}) => {
  const isParticipating = !!participant;
  const isCompleted = participant?.is_completed || false;
  const progress = participant?.progress || 0;
  const rank = participant?.rank || 0;

  // Calculate time remaining
  const now = new Date();
  const isActive = challenge.status === 'active' && challenge.start_date <= now && challenge.end_date > now;
  const isUpcoming = challenge.start_date > now;
  const isExpired = challenge.end_date <= now;

  // Get difficulty styling
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-orange-600 bg-orange-100';
      case 'expert': return 'text-red-600 bg-red-100';
      case 'legendary': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength': return <Trophy className="w-4 h-4" />;
      case 'endurance': return <TrendingUp className="w-4 h-4" />;
      case 'consistency': return <Calendar className="w-4 h-4" />;
      case 'volume': return <Target className="w-4 h-4" />;
      case 'technique': return <Star className="w-4 h-4" />;
      case 'social': return <Users className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  // Get status styling
  const getStatusStyling = () => {
    if (isCompleted) return 'border-green-200 bg-green-50';
    if (isParticipating) return 'border-blue-200 bg-blue-50';
    if (isExpired) return 'border-gray-200 bg-gray-50';
    if (isUpcoming) return 'border-yellow-200 bg-yellow-50';
    return 'border-gray-200 bg-white hover:bg-gray-50';
  };

  const baseClasses = `
    relative rounded-lg border-2 transition-all duration-200 cursor-pointer
    ${getStatusStyling()}
    ${className}
  `;

  const handleCardClick = () => {
    if (onView) {
      onView(challenge.id);
    }
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoin && !isParticipating) {
      onJoin(challenge.id);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`${baseClasses} p-4`} onClick={handleCardClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getCategoryIcon(challenge.category)}
              <h3 className="font-semibold text-sm">{challenge.name}</h3>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
              {challenge.difficulty}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {isParticipating && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Progress</div>
                <div className="font-semibold text-sm">{Math.round(progress)}%</div>
              </div>
            )}
            
            {!isParticipating && isActive && (
              <button
                onClick={handleJoinClick}
                className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90"
              >
                Join
              </button>
            )}
          </div>
        </div>
        
        {isParticipating && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className={`${baseClasses} p-6 shadow-lg`} onClick={handleCardClick}>
        {challenge.is_featured && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
            FEATURED
          </div>
        )}
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-primary/10">
              {getCategoryIcon(challenge.category)}
            </div>
            <div>
              <h3 className="text-xl font-bold">{challenge.name}</h3>
              <p className="text-gray-600 text-sm">{challenge.short_description}</p>
            </div>
          </div>
          
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(challenge.difficulty)}`}>
            {challenge.difficulty}
          </span>
        </div>

        <p className="text-gray-700 mb-4 line-clamp-2">{challenge.description}</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{challenge.current_participants} participants</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {isActive && `Ends ${formatDistanceToNow(challenge.end_date, { addSuffix: true })}`}
              {isUpcoming && `Starts ${formatDistanceToNow(challenge.start_date, { addSuffix: true })}`}
              {isExpired && 'Ended'}
            </span>
          </div>
        </div>

        {isParticipating && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Your Progress</span>
              <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {rank > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Current rank: #{rank}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {challenge.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                {tag}
              </span>
            ))}
          </div>
          
          {!isParticipating && isActive && (
            <button
              onClick={handleJoinClick}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
            >
              Join Challenge
            </button>
          )}
          
          {isCompleted && (
            <div className="flex items-center space-x-2 text-green-600">
              <Trophy className="w-4 h-4" />
              <span className="font-medium">Completed</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`${baseClasses} p-5`} onClick={handleCardClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/10">
            {getCategoryIcon(challenge.category)}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{challenge.name}</h3>
            <p className="text-gray-600 text-sm">{challenge.category}</p>
          </div>
        </div>
        
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
          {challenge.difficulty}
        </span>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-2">{challenge.description}</p>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{challenge.current_participants}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{challenge.duration_days}d</span>
          </div>
        </div>
        
        <div className="text-right">
          {isActive && (
            <div className="text-green-600 font-medium">Active</div>
          )}
          {isUpcoming && (
            <div className="text-yellow-600 font-medium">
              Starts {format(challenge.start_date, 'MMM d')}
            </div>
          )}
          {isExpired && (
            <div className="text-gray-500 font-medium">Ended</div>
          )}
        </div>
      </div>

      {isParticipating && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {rank > 0 && (
            <div className="mt-1 text-xs text-gray-600">
              Rank #{rank}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex space-x-1">
          {challenge.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
              {tag}
            </span>
          ))}
        </div>
        
        {!isParticipating && isActive && (
          <button
            onClick={handleJoinClick}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Join
          </button>
        )}
        
        {isCompleted && (
          <div className="flex items-center space-x-1 text-green-600">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )}
      </div>
    </div>
  );
};