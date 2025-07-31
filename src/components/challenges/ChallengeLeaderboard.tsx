// ChallengeLeaderboard Component - Display challenge rankings
// Implements requirement 12.2 - Challenge leaderboard with rankings

import React, { useState, useEffect } from 'react';
import { 
  ChallengeLeaderboard as LeaderboardType, 
  ChallengeLeaderboardEntry,
  Challenge 
} from '../../types/challenges';

interface ChallengeLeaderboardProps {
  leaderboard: LeaderboardType;
  challenge: Challenge;
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
  className?: string;
  showFullList?: boolean;
  maxEntries?: number;
}

export const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  leaderboard,
  challenge,
  currentUserId,
  onUserClick,
  className = '',
  showFullList = false,
  maxEntries = 10
}) => {
  const [displayEntries, setDisplayEntries] = useState<ChallengeLeaderboardEntry[]>([]);
  const [showAll, setShowAll] = useState(showFullList);

  useEffect(() => {
    const entries = showAll 
      ? leaderboard.participants 
      : leaderboard.participants.slice(0, maxEntries);
    setDisplayEntries(entries);
  }, [leaderboard.participants, showAll, maxEntries]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatLastActivity = (entry: ChallengeLeaderboardEntry) => {
    // In a real app, this would use actual last activity data
    const activities = ['2h ago', '5h ago', '1d ago', '2d ago', '3d ago'];
    return activities[Math.floor(Math.random() * activities.length)];
  };

  const currentUserEntry = leaderboard.participants.find(p => p.user_id === currentUserId);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Leaderboard</h3>
            <p className="text-blue-100 text-sm">
              {leaderboard.participants.length} participants
            </p>
          </div>
          <div className="text-right">
            <div className="text-white text-sm">
              Updated {new Date(leaderboard.last_updated).toLocaleTimeString()}
            </div>
            {challenge.type === 'global' && (
              <div className="text-blue-100 text-xs">
                Global Challenge
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current User Position (if not in top entries) */}
      {currentUserEntry && currentUserEntry.rank > maxEntries && !showAll && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="p-3">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
              Your Position
            </div>
            <LeaderboardEntry 
              entry={currentUserEntry}
              isCurrentUser={true}
              onUserClick={onUserClick}
              showBadges={false}
            />
          </div>
        </div>
      )}

      {/* Leaderboard Entries */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {displayEntries.map((entry, index) => (
          <LeaderboardEntry
            key={entry.user_id}
            entry={entry}
            isCurrentUser={entry.user_id === currentUserId}
            onUserClick={onUserClick}
            showBadges={true}
            lastActivity={formatLastActivity(entry)}
          />
        ))}
      </div>

      {/* Show More/Less Button */}
      {leaderboard.participants.length > maxEntries && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {showAll 
              ? `Show Top ${maxEntries}` 
              : `Show All ${leaderboard.participants.length} Participants`
            }
          </button>
        </div>
      )}

      {/* Empty State */}
      {leaderboard.participants.length === 0 && (
        <div className="p-8 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No participants yet
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            Be the first to join this challenge!
          </p>
        </div>
      )}
    </div>
  );
};

// Individual leaderboard entry component
interface LeaderboardEntryProps {
  entry: ChallengeLeaderboardEntry;
  isCurrentUser: boolean;
  onUserClick?: (userId: string) => void;
  showBadges: boolean;
  lastActivity?: string;
}

const LeaderboardEntry: React.FC<LeaderboardEntryProps> = ({
  entry,
  isCurrentUser,
  onUserClick,
  showBadges,
  lastActivity
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div 
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      } ${onUserClick ? 'cursor-pointer' : ''}`}
      onClick={() => onUserClick?.(entry.user_id)}
    >
      <div className="flex items-center space-x-4">
        {/* Rank */}
        <div className={`text-lg font-bold ${getRankColor(entry.rank)} min-w-[3rem] text-center`}>
          {getRankIcon(entry.rank)}
        </div>

        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {entry.avatar_url ? (
              <img 
                src={entry.avatar_url} 
                alt={entry.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              entry.username.charAt(0).toUpperCase()
            )}
          </div>
          {entry.is_completed && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className={`font-semibold truncate ${
              isCurrentUser 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {entry.username}
              {isCurrentUser && (
                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                  You
                </span>
              )}
            </h4>
            {showBadges && entry.badge_count && entry.badge_count > 0 && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full">
                🏆 {entry.badge_count}
              </span>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Progress: {Math.round(entry.progress)}%
              </span>
              {lastActivity && (
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {lastActivity}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(entry.progress)}`}
                style={{ width: `${Math.min(entry.progress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Value */}
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {entry.current_value.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            points
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeLeaderboard;