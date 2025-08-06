/**
 * Strength Comparison Chart Component
 * 
 * Visual comparison of user's strength across different exercises and metrics
 * Implements Task 15.2 - StrengthComparison charts
 */

import React, { useState, useEffect } from 'react';
import { percentileIntegrationService } from '@/services/PercentileIntegrationService';
import { TrendingUp, TrendingDown, Minus, Trophy, Target, Users, Zap } from 'lucide-react';

interface StrengthData {
  exerciseId: string;
  exerciseName: string;
  percentile: number;
  rank: number;
  totalUsers: number;
  userValue: number;
  metric: string;
  trend: 'improving' | 'declining' | 'stable';
  improvement: number;
}

interface StrengthComparisonChartProps {
  userId: string;
  exercises?: string[];
  metric?: 'weight' | 'oneRM' | 'volume' | 'relative_strength';
  className?: string;
}

export const StrengthComparisonChart: React.FC<StrengthComparisonChartProps> = ({
  userId,
  exercises = [],
  metric = 'oneRM',
  className = ''
}) => {
  const [strengthData, setStrengthData] = useState<StrengthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(metric);
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');

  useEffect(() => {
    loadStrengthData();
  }, [userId, selectedMetric]);

  const loadStrengthData = async () => {
    setLoading(true);
    try {
      // Get user's overall analysis
      const analysis = await percentileIntegrationService.getUserPercentileAnalysis(userId);
      
      // Transform data for visualization
      const strengthData: StrengthData[] = analysis.exerciseBreakdown.map((exercise: any) => {
        const metricData = exercise.metrics.find((m: any) => m.metric === selectedMetric);
        return {
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          percentile: metricData?.percentile || 50,
          rank: metricData?.rank || 0,
          totalUsers: metricData?.totalUsers || 0,
          userValue: metricData?.value || 0,
          metric: selectedMetric,
          trend: metricData?.improvement?.trend || 'stable',
          improvement: metricData?.improvement?.change || 0
        };
      });

      // Sort by percentile (highest first)
      strengthData.sort((a, b) => b.percentile - a.percentile);
      
      setStrengthData(strengthData);
    } catch (error) {
      console.error('Failed to load strength data:', error);
      // Generate mock data for demo
      setStrengthData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): StrengthData[] => {
    const exercises = [
      { id: 'bench_press', name: 'Bench Press' },
      { id: 'squat', name: 'Squat' },
      { id: 'deadlift', name: 'Deadlift' },
      { id: 'overhead_press', name: 'Overhead Press' },
      { id: 'barbell_row', name: 'Barbell Row' },
      { id: 'pull_up', name: 'Pull Up' }
    ];

    return exercises.map(exercise => ({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      percentile: Math.floor(Math.random() * 80) + 20, // 20-100
      rank: Math.floor(Math.random() * 100) + 1,
      totalUsers: Math.floor(Math.random() * 1000) + 500,
      userValue: Math.floor(Math.random() * 100) + 50,
      metric: selectedMetric,
      trend: ['improving', 'declining', 'stable'][Math.floor(Math.random() * 3)] as any,
      improvement: (Math.random() - 0.5) * 20 // -10 to +10
    }));
  };

  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 90) return 'bg-yellow-500';
    if (percentile >= 75) return 'bg-green-500';
    if (percentile >= 50) return 'bg-blue-500';
    if (percentile >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPercentileTextColor = (percentile: number): string => {
    if (percentile >= 90) return 'text-yellow-600';
    if (percentile >= 75) return 'text-green-600';
    if (percentile >= 50) return 'text-blue-600';
    if (percentile >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string, improvement: number) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
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
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
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
            Strength Comparison
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'chart'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Chart
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex space-x-2">
          {['weight', 'oneRM', 'volume', 'relative_strength'].map(metricOption => (
            <button
              key={metricOption}
              onClick={() => setSelectedMetric(metricOption as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === metricOption
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {getMetricLabel(metricOption)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'chart' ? (
          <div className="space-y-4">
            {strengthData.map((exercise, index) => (
              <div key={exercise.exerciseId} className="relative">
                {/* Exercise Name and Stats */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {exercise.exerciseName}
                    </span>
                    {getTrendIcon(exercise.trend, exercise.improvement)}
                    <span className={`text-sm ${getPercentileTextColor(exercise.percentile)}`}>
                      {exercise.percentile}th percentile
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {exercise.userValue}{getMetricUnit(exercise.metric)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Rank #{exercise.rank}
                    </div>
                  </div>
                </div>

                {/* Percentile Bar */}
                <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${getPercentileColor(exercise.percentile)} transition-all duration-500 ease-out`}
                    style={{ width: `${exercise.percentile}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-white mix-blend-difference">
                      {exercise.percentile}%
                    </span>
                  </div>
                </div>

                {/* Improvement Indicator */}
                {exercise.improvement !== 0 && (
                  <div className="mt-1 text-xs text-right">
                    <span className={`${
                      exercise.improvement > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {exercise.improvement > 0 ? '+' : ''}{exercise.improvement.toFixed(1)}% change
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {strengthData.map((exercise, index) => (
              <div
                key={exercise.exerciseId}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getPercentileColor(exercise.percentile)}`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {exercise.exerciseName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {exercise.userValue}{getMetricUnit(exercise.metric)} • Rank #{exercise.rank}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`font-bold ${getPercentileTextColor(exercise.percentile)}`}>
                      {exercise.percentile}th
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      percentile
                    </div>
                  </div>
                  {getTrendIcon(exercise.trend, exercise.improvement)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(strengthData.reduce((sum, ex) => sum + ex.percentile, 0) / strengthData.length)}th
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Average Percentile</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {strengthData.filter(ex => ex.trend === 'improving').length}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Improving Exercises</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {strengthData.filter(ex => ex.percentile >= 75).length}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">Top 25% Exercises</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrengthComparisonChart;