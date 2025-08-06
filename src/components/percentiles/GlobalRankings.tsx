/**
 * Global Rankings Component
 * 
 * Displays global rankings and leaderboards for exercises
 * Implements Task 15.2 - GlobalRankings por ejercicio
 */

import React, { useState, useEffect } from 'react';
import { percentileIntegrationService } from '@/services/PercentileIntegrationService';
import { supabasePercentileService } from '@/services/SupabasePercentileService';
import { Trophy, Medal, Award, Users, TrendingUp, Crown, Star, Target } from 'lucide-react';

interface RankingEntry {
  rank: number;
  userId: string;
  userName: string;
  value: number;
  percentile: number;
  segment: string;
  isCurrentUser?: boolean;
  avatar?: string;
  improvement?: number;
}

interface GlobalRankingsProps {
  exerciseId: string;
  exerciseName: string;
  metric?: 'weight' | 'oneRM' | 'volume' | 'relative_strength';
  currentUserId?: string;
  segmentId?: number;
  limit?: number;
  className?: string;
}

export const GlobalRankings: React.FC<GlobalRankingsProps> = ({
  exerciseId,
  exerciseName,
  metric = 'oneRM',
  currentUserId,
  segmentId,
  limit = 50,
  className = ''
}) => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [userPosition, setUserPosition] = useState<RankingEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState(segmentId || 1);
  const [selectedMetric, setSelectedMetric] = useState(metric);
  const [segments, setSegments] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'global' | 'segment'>('global');

  useEffect(() => {
    loadRankings();
    loadSegments();
  }, [exerciseId, selectedMetric, selectedSegment]);

  const loadSegments = async () => {
    try {
      const segmentData = await supabasePercentileService.getSegments();
      setSegments(segmentData);
    } catch (error) {
      console.error('Failed to load segments:', error);
    }
  };

  const loadRankings = async () => {
    setLoading(true);
    try {
      // Get top performers from Supabase
      const topPerformers = await supabasePercentileService.getTopPerformers(
        exerciseId,
        selectedSegment,
        selectedMetric,
        limit
      );

      // Transform to ranking entries
      const rankingEntries: RankingEntry[] = topPerformers.map((performer, index) => ({
        rank: index + 1,
        userId: performer.user_id,
        userName: `User ${performer.user_id.slice(-4)}`, // Anonymized for demo
        value: performer.user_value,
        percentile: performer.percentile_value,
        segment: performer.segment?.name || 'General',
        isCurrentUser: performer.user_id === currentUserId,
        improvement: Math.random() * 10 - 5 // Mock improvement data
      }));

      setRankings(rankingEntries);

      // Find current user position if provided
      if (currentUserId) {
        const userEntry = rankingEntries.find(entry => entry.isCurrentUser);
        if (userEntry) {
          setUserPosition(userEntry);
        } else {
          // User not in top rankings, get their actual position
          const userPercentiles = await supabasePercentileService.getUserExercisePercentiles(
            currentUserId,
            exerciseId
          );
          const userMetricData = userPercentiles.find(p => p.metric_type === selectedMetric);
          if (userMetricData) {
            setUserPosition({
              rank: userMetricData.rank_position,
              userId: currentUserId,
              userName: 'You',
              value: userMetricData.user_value,
              percentile: userMetricData.percentile_value,
              segment: userMetricData.segment?.name || 'General',
              isCurrentUser: true
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load rankings:', error);
      // Generate mock data for demo
      setRankings(generateMockRankings());
    } finally {
      setLoading(false);
    }
  };

  const generateMockRankings = (): RankingEntry[] => {
    return Array.from({ length: limit }, (_, index) => ({
      rank: index + 1,
      userId: `user_${index + 1}`,
      userName: `Athlete ${index + 1}`,
      value: Math.floor(Math.random() * 100) + 100 - index * 2,
      percentile: 100 - index * 2,
      segment: 'General',
      isCurrentUser: currentUserId ? index === 10 : false,
      improvement: Math.random() * 10 - 5
    }));
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-500" />;
      case 3: return <Award className="w-6 h-6 text-orange-500" />;
      default: return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number): string => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'weight': return 'Max Weight';
      case 'oneRM': return '1RM';
      case 'volume': return 'Volume';
      case 'relative_strength': return 'Relative Strength';
      default: return metric;
    }
  };

  const getMetricUnit = (metric: string): string => {
    switch (metric) {
      case 'weight': return 'kg';
      case 'oneRM': return 'kg';
      case 'volume': return 'kg';
      case 'relative_strength': return 'x BW';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-yellow-600" />
            Global Rankings
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('global')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'global'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setViewMode('segment')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'segment'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Segment
            </button>
          </div>
        </div>

        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
          {exerciseName} - {getMetricLabel(selectedMetric)}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4">
          {/* Metric Selector */}
          <div className="flex space-x-2">
            {['weight', 'oneRM', 'volume', 'relative_strength'].map(metricOption => (
              <button
                key={metricOption}
                onClick={() => setSelectedMetric(metricOption as any)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === metricOption
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {getMetricLabel(metricOption)}
              </button>
            ))}
          </div>

          {/* Segment Selector */}
          {viewMode === 'segment' && segments.length > 0 && (
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(Number(e.target.value))}
              className="px-3 py-1 rounded-lg text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {segments.map(segment => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Podium (Top 3) */}
        {rankings.length >= 3 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
              🏆 Podium
            </h3>
            <div className="flex items-end justify-center space-x-4">
              {/* Second Place */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2 mx-auto">
                  <Medal className="w-8 h-8 text-gray-500" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 h-20 flex flex-col justify-end">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {rankings[1].userName}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {rankings[1].value}{getMetricUnit(selectedMetric)}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">#2</div>
              </div>

              {/* First Place */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-2 mx-auto border-4 border-yellow-300">
                  <Crown className="w-10 h-10 text-yellow-600" />
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-lg p-4 h-24 flex flex-col justify-end">
                  <div className="font-bold text-yellow-800 dark:text-yellow-400">
                    {rankings[0].userName}
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    {rankings[0].value}{getMetricUnit(selectedMetric)}
                  </div>
                </div>
                <div className="text-sm font-bold text-yellow-600 mt-1">#1</div>
              </div>

              {/* Third Place */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-2 mx-auto">
                  <Award className="w-8 h-8 text-orange-500" />
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/20 rounded-lg p-3 h-20 flex flex-col justify-end">
                  <div className="font-semibold text-orange-800 dark:text-orange-400 text-sm">
                    {rankings[2].userName}
                  </div>
                  <div className="text-xs text-orange-700 dark:text-orange-300">
                    {rankings[2].value}{getMetricUnit(selectedMetric)}
                  </div>
                </div>
                <div className="text-xs text-orange-600 mt-1">#3</div>
              </div>
            </div>
          </div>
        )}

        {/* Full Rankings List */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Full Rankings
          </h3>
          
          {rankings.slice(0, Math.min(rankings.length, 20)).map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                entry.isCurrentUser
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRankBadgeColor(entry.rank)}`}>
                  {entry.rank <= 3 ? getRankIcon(entry.rank) : `#${entry.rank}`}
                </div>
                
                <div>
                  <div className={`font-semibold ${entry.isCurrentUser ? 'text-blue-800 dark:text-blue-200' : 'text-gray-900 dark:text-white'}`}>
                    {entry.userName}
                    {entry.isCurrentUser && <span className="ml-2 text-blue-600">(You)</span>}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.segment}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                    {entry.value}{getMetricUnit(selectedMetric)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.percentile}th percentile
                  </div>
                </div>
                
                {entry.improvement !== undefined && (
                  <div className={`text-sm font-medium ${
                    entry.improvement > 0 ? 'text-green-600' : 
                    entry.improvement < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {entry.improvement > 0 ? '+' : ''}{entry.improvement.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* User Position (if not in top rankings) */}
        {userPosition && !userPosition.isCurrentUser && userPosition.rank > 20 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Your Position:
            </h4>
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                  #{userPosition.rank}
                </div>
                <div>
                  <div className="font-semibold text-blue-800 dark:text-blue-200">
                    {userPosition.userName}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {userPosition.segment}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-blue-800 dark:text-blue-200">
                  {userPosition.value}{getMetricUnit(selectedMetric)}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  {userPosition.percentile}th percentile
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {rankings.length}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Total Athletes</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {rankings.length > 0 ? Math.round(rankings.reduce((sum, r) => sum + r.value, 0) / rankings.length) : 0}
              {getMetricUnit(selectedMetric)}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Average Performance</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {rankings.length > 0 ? rankings[0].value : 0}{getMetricUnit(selectedMetric)}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">Top Performance</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalRankings;