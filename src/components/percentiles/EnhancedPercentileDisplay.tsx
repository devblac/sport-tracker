/**
 * Enhanced Percentile Display Component
 * 
 * Comprehensive percentile visualization with trends, comparisons, and recommendations
 * Implements Task 15.1 - Advanced percentile display with full integration
 */

import React, { useState, useEffect } from 'react';
import { percentileIntegrationService, EnhancedPercentileResult } from '@/services/PercentileIntegrationService';
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Users, Zap, Award } from 'lucide-react';

interface EnhancedPercentileDisplayProps {
  userId: string;
  exerciseId?: string;
  className?: string;
}

export const EnhancedPercentileDisplay: React.FC<EnhancedPercentileDisplayProps> = ({
  userId,
  exerciseId,
  className = ''
}) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [exerciseComparison, setExerciseComparison] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'exercise' | 'trends'>('overview');

  useEffect(() => {
    loadPercentileData();
  }, [userId, exerciseId]);

  const loadPercentileData = async () => {
    setLoading(true);
    try {
      // Load comprehensive analysis
      const userAnalysis = await percentileIntegrationService.getUserPercentileAnalysis(userId);
      setAnalysis(userAnalysis);

      // Load exercise-specific data if provided
      if (exerciseId) {
        const exerciseData = await percentileIntegrationService.getExerciseComparison(exerciseId, userId);
        setExerciseComparison(exerciseData);

        // Load trends
        const trendData = await percentileIntegrationService.getPercentileTrends(userId, exerciseId);
        setTrends(trendData);
      }
    } catch (error) {
      console.error('Failed to load percentile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 90) return 'text-yellow-600 bg-yellow-100';
    if (percentile >= 75) return 'text-green-600 bg-green-100';
    if (percentile >= 50) return 'text-blue-600 bg-blue-100';
    if (percentile >= 25) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getPercentileLabel = (percentile: number): string => {
    if (percentile >= 95) return 'Elite';
    if (percentile >= 85) return 'Advanced';
    if (percentile >= 65) return 'Above Average';
    if (percentile >= 35) return 'Average';
    return 'Below Average';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📊 Performance Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive percentile analysis with trends and recommendations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { key: 'overview', label: 'Overview', icon: <Users className="w-4 h-4" /> },
            { key: 'exercise', label: 'Exercise Analysis', icon: <Target className="w-4 h-4" /> },
            { key: 'trends', label: 'Trends', icon: <TrendingUp className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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
        {activeTab === 'overview' && analysis && (
          <div className="space-y-6">
            {/* Overall Ranking */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Overall Performance
                </h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPercentileColor(analysis.overallRanking.percentile)}`}>
                  {getPercentileLabel(analysis.overallRanking.percentile)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {analysis.overallRanking.percentile}th
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Percentile</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    #{analysis.overallRanking.rank}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {analysis.overallRanking.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {analysis.overallRanking.level}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
                </div>
              </div>
            </div>

            {/* Trends Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-800 dark:text-green-400">Improving</h4>
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {analysis.trends.improving.length}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  exercises trending up
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-800 dark:text-red-400">Declining</h4>
                </div>
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {analysis.trends.declining.length}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  exercises need attention
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Minus className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-800 dark:text-gray-400">Stable</h4>
                </div>
                <div className="text-2xl font-bold text-gray-600 mb-1">
                  {analysis.trends.stable.length}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  exercises maintaining
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
              <h4 className="font-bold text-yellow-800 dark:text-yellow-400 mb-3 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Personalized Recommendations
              </h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-yellow-800 dark:text-yellow-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'exercise' && exerciseComparison && (
          <div className="space-y-6">
            {/* Exercise Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {exerciseComparison.statistics.totalUsers.toLocaleString()}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total Users</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(exerciseComparison.statistics.averagePerformance.oneRM)}kg
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Average 1RM</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(exerciseComparison.statistics.topPerformances.oneRM)}kg
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Top Performance</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {exerciseComparison.userPosition?.rank || 'N/A'}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300">Your Rank</div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                Top Performers
              </h4>
              <div className="space-y-3">
                {exerciseComparison.topPerformers.slice(0, 5).map((performer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        #{performer.rank}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {performer.value}kg {performer.metric}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {performer.segment}
                        </div>
                      </div>
                    </div>
                    {index < 3 && (
                      <Award className={`w-5 h-5 ${
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-500' :
                        'text-orange-500'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Exercise Recommendations */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h4 className="font-bold text-blue-800 dark:text-blue-400 mb-3">
                Exercise-Specific Recommendations
              </h4>
              <ul className="space-y-2">
                {exerciseComparison.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-blue-800 dark:text-blue-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'trends' && trends && (
          <div className="space-y-6">
            {/* Trend Analysis */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Trend Analysis
                </h3>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(trends.analysis.overallTrend)}
                  <span className={`font-semibold ${
                    trends.analysis.overallTrend === 'improving' ? 'text-green-600' :
                    trends.analysis.overallTrend === 'declining' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {trends.analysis.overallTrend}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {trends.analysis.averageImprovement > 0 ? '+' : ''}{trends.analysis.averageImprovement}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average Change</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {trends.analysis.bestPeriod}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Best Performance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {trends.trends.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Data Points</div>
                </div>
              </div>
            </div>

            {/* Trend Chart Placeholder */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">
                Percentile Progression
              </h4>
              <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                  <p>Trend chart would be displayed here</p>
                  <p className="text-sm">Integration with charting library needed</p>
                </div>
              </div>
            </div>

            {/* Trend Recommendations */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
              <h4 className="font-bold text-purple-800 dark:text-purple-400 mb-3">
                Trend-Based Recommendations
              </h4>
              <ul className="space-y-2">
                {trends.analysis.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-purple-800 dark:text-purple-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPercentileDisplay;