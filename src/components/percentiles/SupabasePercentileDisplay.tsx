/**
 * Supabase Percentile Display Component
 * 
 * Shows user's percentile rankings using data from Supabase backend.
 * Uses cached daily calculations for cost-effective operation.
 */

import React, { useState, useEffect } from 'react';
import { supabasePercentileService, SupabasePercentileResult } from '../../services/SupabasePercentileService';

interface SupabasePercentileDisplayProps {
  userId: string;
  exerciseId: string;
  exerciseName: string;
  showAllMetrics?: boolean;
  compact?: boolean;
}

interface MetricDisplayProps {
  percentile: SupabasePercentileResult;
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            {getMetricLabel(percentile.metric_type)}
          </span>
          <span className="text-sm text-gray-500">
            {formatValue(percentile.user_value, percentile.metric_type)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPercentileColor(percentile.percentile_value)}`}>
            {percentile.percentile_value}th
          </span>
          <span className="text-xs text-gray-500">
            #{percentile.rank_position}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-gray-900">
          {getMetricLabel(percentile.metric_type)}
        </h4>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPercentileColor(percentile.percentile_value)}`}>
            {getPercentileLabel(percentile.percentile_value)}
          </span>
          <span className="text-sm text-gray-500">
            {percentile.percentile_value}th percentile
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Your Performance:</span>
          <span className="text-lg font-semibold text-gray-900">
            {formatValue(percentile.user_value, percentile.metric_type)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Rank:</span>
          <span className="text-sm font-medium text-gray-900">
            #{percentile.rank_position} of {percentile.total_users}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Segment:</span>
          <span className="text-sm text-gray-700">
            {percentile.segment?.description || 'General'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Last Updated:</span>
          <span className="text-sm text-gray-500">
            {formatDate(percentile.calculated_at)}
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
              style={{ width: `${percentile.percentile_value}%` }}
            />
          </div>
          <div className="flex justify-center mt-1">
            <span className="text-xs text-gray-600">
              You're better than {percentile.percentile_value}% of users in your segment
            </span>
          </div>
        </div>

        {percentile.is_personal_best && (
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

const SupabasePercentileDisplay: React.FC<SupabasePercentileDisplayProps> = ({ 
  userId,
  exerciseId,
  exerciseName, 
  showAllMetrics = true,
  compact = false 
}) => {
  const [percentiles, setPercentiles] = useState<SupabasePercentileResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    loadPercentiles();
  }, [userId, exerciseId]);

  const loadPercentiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await supabasePercentileService.getUserExercisePercentiles(userId, exerciseId);
      setPercentiles(data);
      
      if (data.length > 0) {
        setLastUpdated(data[0].calculated_at);
      }
    } catch (err) {
      console.error('Failed to load percentiles:', err);
      setError('Failed to load percentile data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadPercentiles();
  };

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading percentile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-400 mb-2">⚠️</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Data</h3>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (percentiles.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-2">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Percentile Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Complete more workouts with {exerciseName} to see your percentile rankings.
        </p>
        <p className="text-xs text-gray-500">
          Percentiles are calculated daily and may take up to 24 hours to appear.
        </p>
      </div>
    );
  }

  // Filter to show only the most relevant metrics if not showing all
  const displayPercentiles = showAllMetrics 
    ? percentiles 
    : percentiles.filter(p => p.metric_type === 'oneRM' || p.metric_type === 'relative_strength');

  const bestPercentile = Math.max(...percentiles.map(p => p.percentile_value));
  const averagePercentile = Math.round(
    percentiles.reduce((sum, p) => sum + p.percentile_value, 0) / percentiles.length
  );

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {exerciseName} Performance
            </h3>
            <button
              onClick={handleRefresh}
              className="text-blue-600 hover:text-blue-700 text-sm"
              title="Refresh data"
            >
              🔄
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{bestPercentile}th</div>
              <div className="text-sm text-gray-600">Best Percentile</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{averagePercentile}th</div>
              <div className="text-sm text-gray-600">Average Percentile</div>
            </div>
          </div>
          {lastUpdated && (
            <div className="text-xs text-gray-500 text-center">
              Last updated: {new Date(lastUpdated).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      <div className={compact ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
        {displayPercentiles.map((percentile, index) => (
          <MetricDisplay 
            key={`${percentile.metric_type}-${index}`} 
            percentile={percentile} 
            compact={compact}
          />
        ))}
      </div>

      {!compact && percentiles.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Understanding Your Rankings</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Rankings are calculated within your demographic segment</p>
            <p>• Percentiles show what percentage of users you outperform</p>
            <p>• Rankings are updated daily at midnight UTC</p>
            <p>• Elite (95th+) | Excellent (90th+) | Good (75th+) | Average (50th+)</p>
            <p>• Based on your best performance in the last 90 days</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabasePercentileDisplay;