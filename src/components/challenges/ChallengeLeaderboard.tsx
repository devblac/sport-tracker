/**
 * ChallengeLeaderboard Component
 * 
 * Displays challenge rankings with participant progress and scores.
 * Implements task 14.2 - ChallengeLeaderboard for rankings
 */

import React, { useState } from 'react';
import type { ChallengeLeaderboardEntry } from '@/types';
import { 
  Trophy, 
  Medal, 
  Award, 
  User, 
  TrendingUp,
  Crown,
  Star,
  Users
} from 'lucide-react';

interface ChallengeLeaderboardProps {
  entries: ChallengeLeaderboardEntry[];
  currentUserId?: string;
  showProgress?: boolean;
  showTeams?: boolean;
  maxEntries?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'podium';
}

export const ChallengeLeaderboard: React.FC<ChallengeLeaderboardProps> = ({
  entries,
  currentUserId,
  showProgress = true,
  showTeams = false,
  maxEntries,
  className = '',
  variant = 'default'
}) => {
  const [showAll, setShowAll] = useState(false);
  
  // Sort entries by rank
  const sortedEntries = [...entries].sort((a, b) => a.rank - b.rank);
  
  // Limit entries if specified
  const displayEntries = maxEntries && !showAll 
    ? sortedEntries.slice(0, maxEntries)
    : sortedEntries;

  // Get rank styling
  const getRankStyling = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-gray-600 bg-gray-100';
      case 3: return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  // Get rank icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-600" />;
      case 2: return <Medal className="w-5 h-5 text-gray-600" />;
      case 3: return <Award className="w-5 h-5 text-orange-600" />;
      default: return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  // Check if user is in current view
  const currentUserEntry = sortedEntries.find(entry => entry.user_id === currentUserId);
  const currentUserInView = displayEntries.some(entry => entry.user_id === currentUserId);

  if (variant === 'podium' && sortedEntries.length >= 3) {
    const [first, second, third] = sortedEntries.slice(0, 3);
    
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Podium Display */}
        <div className="flex items-end justify-center space-x-4">
          {/* Second Place */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2 mx-auto">
              {second.avatar_url ? (
                <img 
                  src={second.avatar_url} 
                  alt={second.display_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="bg-gray-100 rounded-lg p-3 h-20 flex flex-col justify-end">
              <Medal className="w-6 h-6 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-semibold">{second.display_name}</div>
              <div className="text-xs text-gray-600">{Math.round(second.score)} pts</div>
            </div>
            <div className="text-xs text-gray-500 mt-1">#2</div>
          </div>

          {/* First Place */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-2 mx-auto border-4 border-yellow-300">
              {first.avatar_url ? (
                <img 
                  src={first.avatar_url} 
                  alt={first.display_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-yellow-600" />
              )}
            </div>
            <div className="bg-yellow-100 rounded-lg p-4 h-24 flex flex-col justify-end">
              <Crown className="w-8 h-8 text-yellow-600 mx-auto mb-1" />
              <div className="font-bold">{first.display_name}</div>
              <div className="text-sm text-yellow-700">{Math.round(first.score)} pts</div>
            </div>
            <div className="text-sm font-bold text-yellow-600 mt-1">#1</div>
          </div>

          {/* Third Place */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-2 mx-auto">
              {third.avatar_url ? (
                <img 
                  src={third.avatar_url} 
                  alt={third.display_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-orange-400" />
              )}
            </div>
            <div className="bg-orange-100 rounded-lg p-3 h-20 flex flex-col justify-end">
              <Award className="w-6 h-6 text-orange-600 mx-auto mb-1" />
              <div className="text-sm font-semibold">{third.display_name}</div>
              <div className="text-xs text-orange-700">{Math.round(third.score)} pts</div>
            </div>
            <div className="text-xs text-orange-600 mt-1">#3</div>
          </div>
        </div>

        {/* Rest of leaderboard */}
        {sortedEntries.length > 3 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 mb-3">Other Participants</h4>
            {sortedEntries.slice(3, maxEntries || sortedEntries.length).map((entry) => (
              <LeaderboardRow 
                key={entry.participant_id}
                entry={entry}
                isCurrentUser={entry.user_id === currentUserId}
                showProgress={showProgress}
                showTeams={showTeams}
                variant="compact"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`space-y-1 ${className}`}>
        {displayEntries.map((entry) => (
          <LeaderboardRow 
            key={entry.participant_id}
            entry={entry}
            isCurrentUser={entry.user_id === currentUserId}
            showProgress={showProgress}
            showTeams={showTeams}
            variant="compact"
          />
        ))}
        
        {maxEntries && sortedEntries.length > maxEntries && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-2 text-sm text-primary hover:text-primary/80 font-medium"
          >
            Show {sortedEntries.length - maxEntries} more participants
          </button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span>Leaderboard</span>
        </h3>
        <div className="text-sm text-gray-600">
          {sortedEntries.length} participants
        </div>
      </div>

      {displayEntries.map((entry) => (
        <LeaderboardRow 
          key={entry.participant_id}
          entry={entry}
          isCurrentUser={entry.user_id === currentUserId}
          showProgress={showProgress}
          showTeams={showTeams}
          variant="default"
        />
      ))}

      {/* Show current user if not in view */}
      {currentUserEntry && !currentUserInView && maxEntries && (
        <div className="border-t pt-3 mt-4">
          <div className="text-xs text-gray-500 mb-2">Your position:</div>
          <LeaderboardRow 
            entry={currentUserEntry}
            isCurrentUser={true}
            showProgress={showProgress}
            showTeams={showTeams}
            variant="default"
          />
        </div>
      )}

      {maxEntries && sortedEntries.length > maxEntries && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-3 text-primary hover:text-primary/80 font-medium border border-primary/20 rounded-lg hover:bg-primary/5"
        >
          Show all {sortedEntries.length} participants
        </button>
      )}
    </div>
  );
};

// Individual leaderboard row component
interface LeaderboardRowProps {
  entry: ChallengeLeaderboardEntry;
  isCurrentUser: boolean;
  showProgress: boolean;
  showTeams: boolean;
  variant: 'default' | 'compact';
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  entry,
  isCurrentUser,
  showProgress,
  showTeams,
  variant
}) => {
  const getRankStyling = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-gray-600 bg-gray-100';
      case 3: return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-4 h-4 text-yellow-600" />;
      case 2: return <Medal className="w-4 h-4 text-gray-600" />;
      case 3: return <Award className="w-4 h-4 text-orange-600" />;
      default: return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-between p-2 rounded-lg ${
        isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-gray-50'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankStyling(entry.rank)}`}>
            {getRankIcon(entry.rank)}
          </div>
          
          <div className="flex items-center space-x-2">
            {entry.avatar_url ? (
              <img 
                src={entry.avatar_url} 
                alt={entry.display_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
            <span className={`text-sm ${isCurrentUser ? 'font-semibold' : 'font-medium'}`}>
              {entry.display_name}
              {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {showProgress && (
            <div className="text-xs text-gray-600">
              {Math.round(entry.progress)}%
            </div>
          )}
          <div className="text-sm font-semibold">
            {Math.round(entry.score)}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${
      isCurrentUser 
        ? 'bg-primary/10 border-primary/20' 
        : 'bg-white border-gray-200 hover:bg-gray-50'
    }`}>
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankStyling(entry.rank)}`}>
          {getRankIcon(entry.rank)}
        </div>
        
        <div className="flex items-center space-x-3">
          {entry.avatar_url ? (
            <img 
              src={entry.avatar_url} 
              alt={entry.display_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
          )}
          
          <div>
            <div className={`font-medium ${isCurrentUser ? 'font-semibold' : ''}`}>
              {entry.display_name}
              {isCurrentUser && <span className="text-primary ml-2">(You)</span>}
            </div>
            
            {showTeams && entry.team_name && (
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Users className="w-3 h-3" />
                <span>{entry.team_name}</span>
              </div>
            )}
            
            {entry.is_completed && (
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <Trophy className="w-3 h-3" />
                <span>Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="font-semibold text-lg">
          {Math.round(entry.score)}
        </div>
        
        {showProgress && (
          <div className="text-sm text-gray-600">
            {Math.round(entry.progress)}% complete
          </div>
        )}
        
        {entry.last_activity && (
          <div className="text-xs text-gray-500">
            Active {new Date(entry.last_activity).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};