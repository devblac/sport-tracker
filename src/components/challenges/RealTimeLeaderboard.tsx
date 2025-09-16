/**
 * RealTimeLeaderboard Component - Real-time challenge rankings
 * Implements requirement 12.5 - Leaderboards en tiempo real con avatars
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChallengeLeaderboardEntry } from '@/types/challenges';
import { 
  Trophy, 
  Medal, 
  Award, 
  User, 
  TrendingUp,
  Crown,
  Zap,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

interface RealTimeLeaderboardProps {
  challengeId: string;
  entries: ChallengeLeaderboardEntry[];
  currentUserId?: string;
  onRefresh?: () => Promise<void>;
  updateInterval?: number; // milliseconds
  showProgress?: boolean;
  maxEntries?: number;
  className?: string;
  variant?: 'default' | 'compact' | 'live';
}

export const RealTimeLeaderboard: React.FC<RealTimeLeaderboardProps> = ({
  challengeId,
  entries,
  currentUserId,
  onRefresh,
  updateInterval = 30000, // 30 seconds
  showProgress = true,
  maxEntries = 10,
  className = '',
  variant = 'default'
}) => {
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rankChanges, setRankChanges] = useState<Map<string, number>>(new Map());
  const [previousEntries, setPreviousEntries] = useState<ChallengeLeaderboardEntry[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Sort entries by rank
  const sortedEntries = [...entries].sort((a, b) => a.rank - b.rank);
  const displayEntries = sortedEntries.slice(0, maxEntries);

  // Track rank changes
  useEffect(() => {
    if (previousEntries.length > 0) {
      const changes = new Map<string, number>();
      
      entries.forEach(entry => {
        const previousEntry = previousEntries.find(p => p.user_id === entry.user_id);
        if (previousEntry && previousEntry.rank !== entry.rank) {
          changes.set(entry.user_id, previousEntry.rank - entry.rank); // Positive = moved up
        }
      });
      
      setRankChanges(changes);
      
      // Clear rank changes after animation
      setTimeout(() => setRankChanges(new Map()), 3000);
    }
    
    setPreviousEntries([...entries]);
  }, [entries]);

  // Auto-refresh functionality
  useEffect(() => {
    if (isLive && onRefresh) {
      intervalRef.current = setInterval(async () => {
        try {
          await onRefresh();
          setLastUpdate(new Date());
        } catch (error) {
          console.error('Failed to refresh leaderboard:', error);
        }
      }, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLive, onRefresh, updateInterval]);

  // Manual refresh
  const handleManualRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle live updates
  const toggleLive = () => {
    setIsLive(!isLive);
  };

  // Get rank styling
  const getRankStyling = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 2: return 'text-gray-600 bg-gray-100 border-gray-300';
      case 3: return 'text-orange-600 bg-orange-100 border-orange-300';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
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

  // Get rank change indicator
  const getRankChangeIndicator = (userId: string) => {
    const change = rankChanges.get(userId);
    if (!change) return null;

    return (
      <div className={`flex items-center space-x-1 text-xs font-medium animate-bounce ${
        change > 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        <TrendingUp className={`w-3 h-3 ${change < 0 ? 'rotate-180' : ''}`} />
        <span>{Math.abs(change)}</span>
      </div>
    );
  };

  if (variant === 'live') {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg overflow-hidden ${className}`}>
        {/* Live Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <h3 className="font-bold">Live Leaderboard</h3>
              </div>
              <div className={`flex items-center space-x-1 text-sm ${isLive ? 'text-green-200' : 'text-red-200'}`}>
                {isLive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span>{isLive ? 'Live' : 'Paused'}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleLive}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isLive 
                    ? 'bg-white/20 hover:bg-white/30' 
                    : 'bg-red-500/20 hover:bg-red-500/30'
                }`}
              >
                {isLive ? 'Pause' : 'Resume'}
              </button>
              
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-1 rounded-full hover:bg-white/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className="text-xs text-white/80 mt-2">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Live Leaderboard Content */}
        <div className="p-4 space-y-3">
          {displayEntries.map((entry, index) => (
            <div
              key={entry.participant_id}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-500 ${
                entry.user_id === currentUserId
                  ? 'bg-primary/10 border-primary/30 shadow-md'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
              } ${rankChanges.has(entry.user_id) ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getRankStyling(entry.rank)}`}>
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className="flex items-center space-x-3">
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt={entry.display_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center border-2 border-white dark:border-gray-700">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  
                  <div>
                    <div className={`font-semibold ${entry.user_id === currentUserId ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                      {entry.display_name}
                      {entry.user_id === currentUserId && (
                        <span className="text-primary ml-2 text-sm">(You)</span>
                      )}
                    </div>
                    
                    {showProgress && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(entry.progress)}% complete
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {getRankChangeIndicator(entry.user_id)}
                
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                    {Math.round(entry.score)}
                  </div>
                  {entry.is_completed && (
                    <div className="flex items-center space-x-1 text-green-600 text-sm">
                      <Trophy className="w-3 h-3" />
                      <span>Done</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Stats Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{entries.length} participants</span>
            <span>Updates every {updateInterval / 1000}s</span>
          </div>
        </div>
      </div>
    );
  }

  // Default and compact variants (existing implementation)
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Leaderboard
          </h3>
          {isLive && (
            <div className="flex items-center space-x-1 text-green-600 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {entries.length} participants
          </div>
        </div>
      </div>

      {/* Leaderboard Entries */}
      <div className="p-4 space-y-2">
        {displayEntries.map((entry) => (
          <div
            key={entry.participant_id}
            className={`flex items-center justify-between p-3 rounded-lg transition-all ${
              entry.user_id === currentUserId
                ? 'bg-primary/10 border border-primary/20'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            } ${rankChanges.has(entry.user_id) ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankStyling(entry.rank)}`}>
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="flex items-center space-x-2">
                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt={entry.display_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                
                <div>
                  <div className={`font-medium text-sm ${entry.user_id === currentUserId ? 'text-primary font-semibold' : 'text-gray-900 dark:text-white'}`}>
                    {entry.display_name}
                    {entry.user_id === currentUserId && (
                      <span className="text-primary ml-1">(You)</span>
                    )}
                  </div>
                  
                  {showProgress && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {Math.round(entry.progress)}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {getRankChangeIndicator(entry.user_id)}
              
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {Math.round(entry.score)}
                </div>
                {entry.is_completed && (
                  <Trophy className="w-4 h-4 text-green-600 mx-auto" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <button
            onClick={toggleLive}
            className={`px-2 py-1 rounded text-xs font-medium ${
              isLive 
                ? 'text-green-600 bg-green-100 dark:bg-green-900/20' 
                : 'text-gray-600 bg-gray-100 dark:bg-gray-600'
            }`}
          >
            {isLive ? 'Live Updates On' : 'Live Updates Off'}
          </button>
        </div>
      </div>
    </div>
  );
};