/**
 * Strength Comparison Component
 * 
 * Shows visual comparisons of user strength against different demographic segments
 * and provides insights into relative performance across exercises.
 */

import React, { useState, useEffect } from 'react';
import { supabasePercentileService, SupabasePercentileResult } from '../../services/SupabasePercentileService';

interface StrengthComparisonProps {
  userId: string;
  exerciseIds: string[];
  exerciseNames: { [key: string]: string };
}

interface ComparisonData {
  exerciseId: string;
  exerciseName: string;
  userValue: number;
  percentile: number;
  segment: string;
  metric: string;
}

interface SegmentComparison {
  segment: string;
  averagePercentile: number;
  exerciseCount: number;
  strongestExercise: ComparisonData | null;
  weakestExercise: ComparisonData | null;
}

const StrengthComparison: React.FC<StrengthComparisonProps> = ({
  userId,
  exerciseIds,
  exerciseNames
}) => {
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [segmentComparisons, setSegmentComparisons] = useState<SegmentComparison[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'oneRM' | 'relative_strength'>('oneRM');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComparisonData();
  }, [userId, exerciseIds, selectedMetric]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);

      const allData: ComparisonData[] = [];

      // Load percentile data for each exercise
      for (const exerciseId of exerciseIds) {
        try {
          const percentiles = await supabasePercentileService.getUserExercisePercentiles(
            userId,
            exerciseId
          );

          const relevantPercentile = percentiles.find(p => p.metric_type === selectedMetric);
          
          if (relevantPercentile) {
            allData.push({
              exerciseId,
              exerciseName: exerciseNames[exerciseId] || 'Unknown Exercise',
              userValue: relevantPercentile.user_value,
              percentile: relevantPercentile.percentile_value,
              segment: relevantPercentile.segment?.description || 'General',
              metric: selectedMetric
            });
          }
        } catch (exerciseError) {
          console.warn(`Failed to load data for exercise ${exerciseId}:`, exerciseError);
        }
      }

      setComparisonData(allData);

      // Calculate segment comparisons
      const segmentMap = new Map<string, ComparisonData[]>();
      allData.forEach(data => {
        if (!segmentMap.has(data.segment)) {
          segmentMap.set(data.segment, []);
        }
        segmentMap.get(data.segment)!.push(data);
      });

      const segments: SegmentComparison[] = [];
      segmentMap.forEach((exercises, segment) => {
        const averagePercentile = exercises.reduce((sum, ex) => sum + ex.percentile, 0) / exercises.length;
        const sortedByPercentile = [...exercises].sort((a, b) => b.percentile - a.percentile);
        
        segments.push({
          segment,
          averagePercentile: Math.round(averagePercentile),
          exerciseCount: exercises.length,
          strongestExercise: sortedByPercentile[0] || null,
          weakestExercise: sortedByPercentile[sortedByPercentile.length - 1] || null
        });
      });

      setSegmentComparisons(segments.sort((a, b) => b.averagePercentile - a.averagePercentile));

    } catch (err) {
      console.error('Failed to load comparison data:', err);
      setError('Failed to load strength comparison data');
    } finally {
      setLoading(false);
    }
  };

  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 90) return 'bg-green-500';
    if (percentile >= 75) return 'bg-blue-500';
    if (percentile >= 50) return 'bg-yellow-500';
    if (percentile >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPercentileLabel = (percentile: number): string => {
    if (percentile >= 95) return 'Elite';
    if (percentile >= 90) return 'Excellent';
    if (percentile >= 75) return 'Good';
    if (percentile >= 50) return 'Average';
    if (percentile >= 25) return 'Below Average';
    return 'Beginner';
  };

  const formatValue = (value: number, metric: string): string => {
    switch (metric) {
      case 'oneRM':
        return `${value.toFixed(1)}kg`;
      case 'relative_strength':
        return `${value.toFixed(2)}x BW`;
      default:
        return value.toString();
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-400 mb-2">⚠️</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Comparison</h3>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (comparisonData.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-2">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Comparison Data</h3>
        <p className="text-sm text-gray-600">
          Complete workouts with the selected exercises to see strength comparisons.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Strength Comparison Analysis
            </h2>
            <p className="text-gray-600">
              Compare your performance across exercises and demographic segments
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Metric:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as 'oneRM' | 'relative_strength')}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="oneRM">1RM (Absolute)</option>
              <option value="relative_strength">Relative Strength</option>
            </select>
          </div>
        </div>

        {/* Overall Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(comparisonData.reduce((sum, d) => sum + d.percentile, 0) / comparisonData.length)}th
            </div>
            <div className="text-sm text-blue-800">Average Percentile</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.max(...comparisonData.map(d => d.percentile))}th
            </div>
            <div className="text-sm text-green-800">Best Percentile</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {comparisonData.length}
            </div>
            <div className="text-sm text-orange-800">Exercises Tracked</div>
          </div>
        </div>
      </div>

      {/* Exercise Comparison Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Exercise Performance Comparison
        </h3>
        
        <div className="space-y-4">
          {comparisonData
            .sort((a, b) => b.percentile - a.percentile)
            .map((exercise, index) => (
              <div key={exercise.exerciseId} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {exercise.exerciseName}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      exercise.percentile >= 90 ? 'bg-green-100 text-green-800' :
                      exercise.percentile >= 75 ? 'bg-blue-100 text-blue-800' :
                      exercise.percentile >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      exercise.percentile >= 25 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getPercentileLabel(exercise.percentile)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {formatValue(exercise.userValue, exercise.metric)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {exercise.percentile}th percentile
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 relative">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getPercentileColor(exercise.percentile)}`}
                    style={{ width: `${exercise.percentile}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white mix-blend-difference">
                      {exercise.percentile}%
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  Compared to: {exercise.segment}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Segment Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Demographic Segment Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segmentComparisons.map((segment, index) => (
            <div key={segment.segment} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">{segment.segment}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  segment.averagePercentile >= 75 ? 'bg-green-100 text-green-800' :
                  segment.averagePercentile >= 50 ? 'bg-blue-100 text-blue-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {segment.averagePercentile}th avg
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Exercises:</span>
                  <span className="font-medium">{segment.exerciseCount}</span>
                </div>
                
                {segment.strongestExercise && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Strongest:</span>
                    <span className="font-medium text-green-600">
                      {segment.strongestExercise.exerciseName} ({segment.strongestExercise.percentile}th)
                    </span>
                  </div>
                )}
                
                {segment.weakestExercise && segment.exerciseCount > 1 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weakest:</span>
                    <span className="font-medium text-orange-600">
                      {segment.weakestExercise.exerciseName} ({segment.weakestExercise.percentile}th)
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          💡 Performance Insights
        </h3>
        
        <div className="space-y-3 text-sm">
          {comparisonData.length > 0 && (
            <>
              {/* Best Performance */}
              {(() => {
                const best = comparisonData.reduce((prev, current) => 
                  prev.percentile > current.percentile ? prev : current
                );
                return (
                  <div className="flex items-start space-x-2">
                    <span className="text-green-600 mt-0.5">🏆</span>
                    <span className="text-blue-800">
                      Your strongest lift is <strong>{best.exerciseName}</strong> at the {best.percentile}th percentile 
                      ({formatValue(best.userValue, best.metric)})
                    </span>
                  </div>
                );
              })()}

              {/* Improvement Area */}
              {(() => {
                const worst = comparisonData.reduce((prev, current) => 
                  prev.percentile < current.percentile ? prev : current
                );
                return (
                  <div className="flex items-start space-x-2">
                    <span className="text-orange-600 mt-0.5">📈</span>
                    <span className="text-blue-800">
                      Focus on improving <strong>{worst.exerciseName}</strong> - currently at the {worst.percentile}th percentile
                    </span>
                  </div>
                );
              })()}

              {/* Balance Assessment */}
              {(() => {
                const percentileRange = Math.max(...comparisonData.map(d => d.percentile)) - 
                                      Math.min(...comparisonData.map(d => d.percentile));
                return (
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-0.5">⚖️</span>
                    <span className="text-blue-800">
                      Your strength is {percentileRange < 20 ? 'well-balanced' : 
                                      percentileRange < 40 ? 'moderately balanced' : 'unbalanced'} 
                      across exercises (range: {percentileRange} percentile points)
                    </span>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrengthComparison;