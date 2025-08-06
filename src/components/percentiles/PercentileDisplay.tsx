/**
 * Percentile Display Component
 * 
 * Shows user's percentile rankings with visual indicators and comparisons.
 */

import React from 'react';
import { PercentileResult } from '../../services/PercentileCalculator';

interface PercentileDisplayProps {
  percentiles: PercentileResult[];
  exerciseName: string;
  showAllMetrics?: boolean;
  compact?: boolean;
}

interface MetricDisplayProps {
  percentile: PercentileResult;
  compact?: boolean;
}

const MetricDisplay: React.FC<MetricDisplayProps> = ({ percentile, compact }) => {
  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 90) return 'text-green-600 bg-green-100';
    if (percentile >= 75) return 'text-blue-600 bg-blue-100';
    if (percentile >= 50) return 'text-yellow-600 bg-yellow-100';
    if (percentile >= 25) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getPercentileLabel = (percentile: number): string => {
    if (percentile >= 95) return 'Elite';
    if (percentile >= 90) return 'Excellent';
    if (percentile >= 75) return 'Good';
    if (percentile >= 50) return 'Average';
    if (percentile >= 25) return 'Below Average';
    return 'Beginner';
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

  const formatValue = (value: number, metric: string): string => {
    switch (metric) {
      case 'weight':
      case 'oneRM':
        return `${value.toFixed(1)}kg`;
      case 'volume':
        return `${value.toFixed(0)}kg`;
      case 'relative_strength':
        return `${value.toFixed(2)}x`;
      default:
        return value.toString();
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            {getMetricLabel(percentile.metric)}
          </span>
          <span className="text-sm text-gray-500">
            {formatValue(percentile.value, percentile.metric)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPercentileColor(percentile.percentile)}`}>
            {percentile.percentile}th
          </span>
          <span className="text-xs text-gray-500">
            #{percentile.rank}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-gray-900">
          {getMetricLabel(percentile.metric)}
        </h4>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPercentileColor(percentile.percentile)}`}>
            {getPercentileLabel(percentile.percentile)}
          </span>
          <span className="text-sm text-gray-500">
            {percentile.percentile}th percentile
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Your Performance:</span>
          <span className="text-lg font-semibold text-gray-900">
            {formatValue(percentile.value, percentile.metric)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Rank:</span>
          <span className="text-sm font-medium text-gray-900">
            #{percentile.rank} of {percentile.totalUsers}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Segment:</span>
          <span className="text-sm text-gray-700">
            {percentile.segment}
          </span>
        </div>

        {/* Percentile Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>0th</span>
            <span>50th</span>
            <span>100th</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${percentile.percentile}%` }}
            />
          </div>
          <div className="flex justify-center mt-1">
            <span className="text-xs text-gray-600">
              You're better than {percentile.percentile}% of users in your segment
            </span>
          </div>
        </div>

        {percentile.isPersonalBest && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-2">🏆</span>
              <span className="text-sm font-medium text-yellow-800">
                Personal Best!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PercentileDisplay: React.FC<PercentileDisplayProps> = ({ 
  percentiles, 
  exerciseName, 
  showAllMetrics = true,
  compact = false 
}) => {
  if (percentiles.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-2">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Percentile Data</h3>
        <p className="text-sm text-gray-600">
          Complete more workouts with {exerciseName} to see your percentile rankings.
        </p>
      </div>
    );
  }

  // Filter to show only the most relevant metrics if not showing all
  const displayPercentiles = showAllMetrics 
    ? percentiles 
    : percentiles.filter(p => p.metric === 'oneRM' || p.metric === 'relative_strength');

  const bestPercentile = Math.max(...percentiles.map(p => p.percentile));
  const averagePercentile = Math.round(
    percentiles.reduce((sum, p) => sum + p.percentile, 0) / percentiles.length
  );

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {exerciseName} Performance
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{bestPercentile}th</div>
              <div className="text-sm text-gray-600">Best Percentile</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{averagePercentile}th</div>
              <div className="text-sm text-gray-600">Average Percentile</div>
            </div>
          </div>
        </div>
      )}

      <div className={compact ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
        {displayPercentiles.map((percentile, index) => (
          <MetricDisplay 
            key={`${percentile.metric}-${index}`} 
            percentile={percentile} 
            compact={compact}
          />
        ))}
      </div>

      {!compact && percentiles.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Understanding Your Rankings</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Rankings are calculated within your demographic segment ({percentiles[0]?.segment})</p>
            <p>• Percentiles show what percentage of users you outperform</p>
            <p>• Rankings update automatically as you complete more workouts</p>
            <p>• Elite (95th+) | Excellent (90th+) | Good (75th+) | Average (50th+)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PercentileDisplay;