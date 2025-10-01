/**
 * Global Percentiles Visualization Component
 * 
 * Comprehensive visualization of global percentile data with demographic segmentation,
 * comparative rankings, and attractive visual displays.
 * Implements Task 16 - Complete global percentiles system
 */

import React, { useState, useEffect } from 'react';
import { GlobalPercentilesService, GlobalPercentilesResult, ExerciseGlobalData } from '@/services/GlobalPercentilesService';
import { UserDemographics, PercentileSegment, GlobalRanking } from '@/types/percentiles';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Trophy, 
  Target, 
  BarChart3, 
  Globe, 
  Filter,
  Award,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';

interface GlobalPercentilesVisualizationProps {
  userId: string;
  userDemographics: UserDemographics;
  exerciseIds?: string[];
  className?: string;
}

interface SegmentFilterProps {
  segments: PercentileSegment[];
  selectedSegments: string[];
  onSegmentToggle: (segmentId: string) => void;
}

const SegmentFilter: React.FC<SegmentFilterProps> = ({ segments, selectedSegments, onSegmentToggle }) => {
  const getSegmentIcon = (segment: PercentileSegment): string => {
    if (segment.id.includes('global')) return '🌍';
    if (segment.id.includes('age')) return '📅';
    if (segment.id.includes('weight')) return '⚖️';
    if (segment.id.includes('experience')) return '🎯';
    if (segment.gender !== 'all') return segment.gender === 'male' ? '♂️' : '♀️';
    return '👥';
  };

  const getSegmentColor = (segment: PercentileSegment): string => {
    if (segment.id.includes('global')) return 'bg-blue-100 text-blue-800';
    if (segment.id.includes('age')) return 'bg-green-100 text-green-800';
    if (segment.id.includes('weight')) return 'bg-orange-100 text-orange-800';
    if (segment.id.includes('experience')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2 mb-3">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Demographic Segments</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {segments.map(segment => (
          <button
            key={segment.id}
            onClick={() => onSegmentToggle(segment.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
              selectedSegments.includes(segment.id)
                ? 'bg-blue-500 text-white shadow-md'
                : `${getSegmentColor(segment)} hover:shadow-md`
            }`}
          >
            <span>{getSegmentIcon(segment)}</span>
            <span>{segment.name}</span>
            <span className="text-xs opacity-75">({segment.sample_size.toLocaleString()})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface RankingCardProps {
  ranking: GlobalRanking;
  userRank?: number;
  compact?: boolean;
}

const RankingCard: React.FC<RankingCardProps> = ({ ranking, userRank, compact = false }) => {
  const [showAll, setShowAll] = useState(false);
  const displayRankings = showAll ? ranking.rankings : ranking.rankings.slice(0, 5);

  const getRankBadge = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (rank === 3) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {ranking.exercise_name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {ranking.total_participants.toLocaleString()} participants
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Metric</div>
            <div className="font-semibold text-gray-900 dark:text-white capitalize">
              {ranking.metric_type.replace('_', ' ')}
            </div>
          </div>
        </div>
        {userRank && (
          <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Your Position:</span>
              <span className="font-bold text-blue-900 dark:text-blue-200">#{userRank}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="space-y-3">
          {displayRankings.map((performer, index) => (
            <div
              key={`${performer.user_id}-${index}`}
              className={`flex items-center justify-between p-3 rounded-lg border ${getRankColor(performer.rank)}`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-lg font-bold">
                  {getRankBadge(performer.rank)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {performer.display_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {performer.demographics.age}y, {performer.demographics.gender}, {performer.demographics.weight}kg
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {performer.value}kg
                </div>
                {performer.relative_strength && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {performer.relative_strength.toFixed(2)}x BW
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {ranking.rankings.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>{showAll ? 'Show Less' : `Show All ${ranking.rankings.length} Rankings`}</span>
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showAll ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};

interface ExerciseGlobalStatsProps {
  exerciseData: ExerciseGlobalData;
  userDemographics: UserDemographics;
}

const ExerciseGlobalStats: React.FC<ExerciseGlobalStatsProps> = ({ exerciseData, userDemographics }) => {
  const [selectedSegment, setSelectedSegment] = useState<string>('');

  useEffect(() => {
    // Auto-select most relevant segment
    if (exerciseData.demographic_breakdown.length > 0) {
      const relevantSegment = exerciseData.demographic_breakdown.find(breakdown =>
        breakdown.segment.gender === userDemographics.gender ||
        breakdown.segment.gender === 'all'
      );
      if (relevantSegment) {
        setSelectedSegment(relevantSegment.segment.id);
      }
    }
  }, [exerciseData, userDemographics]);

  const selectedBreakdown = exerciseData.demographic_breakdown.find(
    breakdown => breakdown.segment.id === selectedSegment
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {exerciseData.exercise_name} Global Statistics
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>{exerciseData.total_participants.toLocaleString()} participants</span>
          </div>
        </div>

        {/* Global Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {exerciseData.global_statistics.median}kg
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Median</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {exerciseData.global_statistics.mean.toFixed(1)}kg
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Average</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {exerciseData.global_statistics.top_1_percent}kg
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">Top 1%</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {exerciseData.global_statistics.top_10_percent}kg
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-300">Top 10%</div>
          </div>
        </div>

        {/* Segment Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            View by Demographic Segment:
          </label>
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select a segment...</option>
            {exerciseData.demographic_breakdown.map(breakdown => (
              <option key={breakdown.segment.id} value={breakdown.segment.id}>
                {breakdown.segment.name} ({breakdown.statistics.sample_size} users)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Segment Details */}
      {selectedBreakdown && (
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {selectedBreakdown.segment.name} Statistics
            </h4>
            
            {/* Percentile Distribution */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {Object.entries(selectedBreakdown.statistics.percentiles).map(([percentile, value]) => (
                <div key={percentile} className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {value}kg
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {percentile.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>

            {/* Top Performers in Segment */}
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-yellow-600" />
                Top Performers in {selectedBreakdown.segment.name}
              </h5>
              <div className="space-y-2">
                {selectedBreakdown.top_performers.slice(0, 5).map((performer, index) => (
                  <div
                    key={`${performer.user_id}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        performer.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        performer.rank === 2 ? 'bg-gray-100 text-gray-800' :
                        performer.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        #{performer.rank}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          Anonymous User
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {performer.demographics.age}y, {performer.demographics.gender}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {performer.value}kg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Data */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
          Performance Trends
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              +{exerciseData.trending_data.weekly_improvement.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Weekly Improvement</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              +{exerciseData.trending_data.monthly_improvement.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Improvement</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {exerciseData.trending_data.seasonal_trends.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Seasonal Data Points</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GlobalPercentilesVisualization: React.FC<GlobalPercentilesVisualizationProps> = ({
  userId,
  userDemographics,
  exerciseIds,
  className = ''
}) => {
  const [globalData, setGlobalData] = useState<GlobalPercentilesResult | null>(null);
  const [exerciseData, setExerciseData] = useState<Map<string, ExerciseGlobalData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rankings' | 'exercises' | 'segments'>('overview');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  const globalPercentilesService = GlobalPercentilesService.getInstance();

  useEffect(() => {
    loadGlobalPercentiles();
  }, [userId, userDemographics, exerciseIds]);

  const loadGlobalPercentiles = async () => {
    setLoading(true);
    try {
      // Load global percentiles
      const result = await globalPercentilesService.getGlobalPercentiles(
        userId,
        userDemographics,
        exerciseIds
      );
      setGlobalData(result);

      // Load exercise-specific data
      const exerciseDataMap = new Map<string, ExerciseGlobalData>();
      const exercisesToLoad = exerciseIds || result.user_rankings.map(r => r.exercise_id);
      
      for (const exerciseId of exercisesToLoad) {
        try {
          const data = await globalPercentilesService.getExerciseGlobalData(exerciseId);
          exerciseDataMap.set(exerciseId, data);
        } catch (error) {
          console.error(`Failed to load data for ${exerciseId}:`, error);
        }
      }
      
      setExerciseData(exerciseDataMap);

      // Set default selections
      if (result.user_rankings.length > 0) {
        setSelectedSegments([result.user_rankings[0].segment.id]);
        setSelectedExercise(result.user_rankings[0].exercise_id);
      }

    } catch (error) {
      console.error('Failed to load global percentiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentToggle = (segmentId: string) => {
    setSelectedSegments(prev =>
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!globalData) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center ${className}`}>
        <div className="text-gray-400 mb-4">
          <BarChart3 className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Global Data Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Complete more workouts to see your global percentile rankings.
        </p>
      </div>
    );
  }

  const availableSegments = Array.from(
    new Set(globalData.user_rankings.map(r => r.segment))
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Globe className="w-8 h-8 mr-3 text-blue-600" />
              Global Percentiles
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Compare your performance with users worldwide
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Rankings</div>
            <div className="text-2xl font-bold text-blue-600">
              {globalData.user_rankings.length}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
            { key: 'rankings', label: 'Global Rankings', icon: <Trophy className="w-4 h-4" /> },
            { key: 'exercises', label: 'Exercise Analysis', icon: <Target className="w-4 h-4" /> },
            { key: 'segments', label: 'Demographics', icon: <Users className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Award className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-bold text-green-800 dark:text-green-400">Best Segments</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">Your strongest areas</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {globalData.segment_analysis.best_segments.slice(0, 3).map((segment, index) => (
                    <div key={segment.id} className="flex items-center justify-between">
                      <span className="text-sm text-green-800 dark:text-green-300">{segment.name}</span>
                      <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Target className="w-8 h-8 text-orange-600" />
                  <div>
                    <h3 className="font-bold text-orange-800 dark:text-orange-400">Improvement Areas</h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300">Focus on these</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {globalData.segment_analysis.improvement_opportunities.slice(0, 3).map((segment, index) => (
                    <div key={segment.id} className="flex items-center justify-between">
                      <span className="text-sm text-orange-800 dark:text-orange-300">{segment.name}</span>
                      <span className="text-xs bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                        Opportunity
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <Zap className="w-8 h-8 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-purple-800 dark:text-purple-400">Competitive</h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Strong potential</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {globalData.segment_analysis.competitive_segments.slice(0, 3).map((segment, index) => (
                    <div key={segment.id} className="flex items-center justify-between">
                      <span className="text-sm text-purple-800 dark:text-purple-300">{segment.name}</span>
                      <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                        Compete
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Personalized Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Training Focus</h4>
                  <ul className="space-y-1">
                    {globalData.recommendations.training_focus.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Competitive Opportunities</h4>
                  <ul className="space-y-1">
                    {globalData.recommendations.competitive_opportunities.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Strength Development</h4>
                  <ul className="space-y-1">
                    {globalData.recommendations.strength_development.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rankings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {globalData.global_rankings.map(ranking => {
                const userRanking = globalData.user_rankings.find(ur => ur.exercise_id === ranking.exercise_id);
                return (
                  <RankingCard
                    key={ranking.exercise_id}
                    ranking={ranking}
                    userRank={userRanking?.global_rank}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="space-y-6">
            {/* Exercise Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Exercise for Detailed Analysis:
              </label>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Choose an exercise...</option>
                {Array.from(exerciseData.keys()).map(exerciseId => (
                  <option key={exerciseId} value={exerciseId}>
                    {exerciseData.get(exerciseId)?.exercise_name || exerciseId}
                  </option>
                ))}
              </select>
            </div>

            {/* Exercise Analysis */}
            {selectedExercise && exerciseData.has(selectedExercise) && (
              <ExerciseGlobalStats
                exerciseData={exerciseData.get(selectedExercise)!}
                userDemographics={userDemographics}
              />
            )}
          </div>
        )}

        {activeTab === 'segments' && (
          <div className="space-y-6">
            <SegmentFilter
              segments={availableSegments}
              selectedSegments={selectedSegments}
              onSegmentToggle={handleSegmentToggle}
            />

            {/* Demographic Comparisons */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {globalData.demographic_comparisons.map((comparison, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                    {comparison.user_performance.exercise_name} Comparisons
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(comparison.peer_comparisons).map(([group, ranking]) => (
                      <div key={group} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {group.replace('_', ' ')}
                        </span>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {ranking.percentile}th percentile
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            #{ranking.global_rank} of {ranking.total_users_in_segment}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalPercentilesVisualization;