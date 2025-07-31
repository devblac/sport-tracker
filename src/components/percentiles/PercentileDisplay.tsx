/**
 * PercentileDisplay Component
 * Displays user's percentile rankings with visual comparisons across demographic segments
 */

import React, { useState, useEffect } from 'react';
import { UserPercentileRanking, PercentileComparison, UserDemographics } from '../../types/percentiles';
import { PercentileCalculator } from '../../services/percentileCalculator';
import { DemographicSegmentation } from '../../utils/demographicSegmentation';

interface PercentileDisplayProps {
  userId: string;
  exerciseId: string;
  exerciseName: string;
  userValue: number;
  unit: string;
  demographics: UserDemographics;
  showComparisons?: boolean;
  className?: string;
}

export const PercentileDisplay: React.FC<PercentileDisplayProps> = ({
  userId,
  exerciseId,
  exerciseName,
  userValue,
  unit,
  demographics,
  showComparisons = true,
  className = ''
}) => {
  const [rankings, setRankings] = useState<UserPercentileRanking[]>([]);
  const [comparisons, setComparisons] = useState<PercentileComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<string>('');

  useEffect(() => {
    loadPercentileData();
  }, [userId, exerciseId, demographics]);

  const loadPercentileData = async () => {
    setLoading(true);
    try {
      // Mock performance data for calculation
      const mockPerformance = [{
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        max_weight: userValue,
        max_reps: 0,
        max_volume: 0,
        recorded_at: new Date(),
        bodyweight_at_time: demographics.weight
      }];

      const result = await PercentileCalculator.calculateUserPercentiles(
        userId,
        demographics,
        mockPerformance
      );

      if (result.success) {
        setRankings(result.user_rankings);
        setComparisons(result.comparisons);
        
        // Set default selected segment to most specific
        if (result.user_rankings.length > 0) {
          const mostSpecific = result.user_rankings.reduce((prev, current) => 
            prev.segment.name.length > current.segment.name.length ? prev : current
          );
          setSelectedSegment(mostSpecific.segment.id);
        }
      }
    } catch (error) {
      console.error('Error loading percentile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
    if (percentile >= 75) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    if (percentile >= 50) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (percentile >= 25) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
  };

  const getStrengthLevelInfo = (level: string) => {
    const levels = {
      'untrained': { icon: '🌱', color: 'text-gray-500', name: 'Sin Entrenar' },
      'novice': { icon: '🥉', color: 'text-amber-600', name: 'Novato' },
      'intermediate': { icon: '🥈', color: 'text-blue-600', name: 'Intermedio' },
      'advanced': { icon: '🥇', color: 'text-purple-600', name: 'Avanzado' },
      'elite': { icon: '👑', color: 'text-yellow-500', name: 'Elite' }
    };
    return levels[level as keyof typeof levels] || levels.novice;
  };

  const selectedRanking = rankings.find(r => r.segment.id === selectedSegment) || rankings[0];

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedRanking) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center ${className}`}>
        <div className="text-gray-400 text-4xl mb-2">📊</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No hay datos de percentiles
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Registra más entrenamientos para ver tu posición comparativa
        </p>
      </div>
    );
  }

  const strengthLevel = getStrengthLevelInfo(selectedRanking.strength_level || 'novice');

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📊 Percentil en {exerciseName}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {userValue} {unit}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Segment Selector */}
        {rankings.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Comparar con:
            </label>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {rankings.map((ranking) => {
                const segmentInfo = DemographicSegmentation.getSegmentDisplayInfo(ranking.segment);
                return (
                  <option key={ranking.segment.id} value={ranking.segment.id}>
                    {segmentInfo.icon} {ranking.segment.name}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Main Percentile Display */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getPercentileColor(selectedRanking.percentile)}`}>
            {Math.round(selectedRanking.percentile)}
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              Percentil {Math.round(selectedRanking.percentile)}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              en {selectedRanking.segment.name}
            </div>
          </div>
        </div>

        {/* Percentile Visualization */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>0%</span>
            <span>Tu posición</span>
            <span>100%</span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 to-blue-400 h-4 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
            <div 
              className="absolute top-0 w-1 h-4 bg-gray-900 dark:bg-white rounded-full transform -translate-x-0.5"
              style={{ left: `${selectedRanking.percentile}%` }}
            />
            <div 
              className="absolute -top-8 transform -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-2 py-1 rounded text-xs font-medium"
              style={{ left: `${selectedRanking.percentile}%` }}
            >
              {Math.round(selectedRanking.percentile)}%
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              #{selectedRanking.segment_rank || 'N/A'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Posición
            </div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedRanking.comparison_data.users_better_than.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Superaste
            </div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedRanking.total_users_in_segment.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total usuarios
            </div>
          </div>
        </div>

        {/* Strength Level */}
        <div className={`p-4 rounded-lg border-2 ${strengthLevel.color.includes('purple') ? 'border-purple-200 bg-purple-50 dark:bg-purple-900/20' :
          strengthLevel.color.includes('blue') ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' :
          strengthLevel.color.includes('yellow') ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' :
          strengthLevel.color.includes('amber') ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/20' :
          'border-gray-200 bg-gray-50 dark:bg-gray-700'
        }`}>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">{strengthLevel.icon}</span>
            <div className="text-center">
              <div className={`text-xl font-bold ${strengthLevel.color}`}>
                {strengthLevel.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Nivel de fuerza
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <div className="font-medium mb-1">💡 Interpretación:</div>
            <div>
              Estás en el percentil {Math.round(selectedRanking.percentile)}, lo que significa que tu rendimiento es 
              mejor que el {Math.round(selectedRanking.comparison_data.better_than_percentage)}% de las personas 
              en tu grupo demográfico ({selectedRanking.segment.name.toLowerCase()}).
            </div>
          </div>
        </div>

        {/* Peer Comparisons */}
        {showComparisons && comparisons.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              🔍 Comparaciones con Otros Grupos
            </h4>
            <div className="space-y-2">
              {Object.entries(comparisons[0]?.peer_comparisons || {}).map(([key, comparison]) => {
                const segmentInfo = DemographicSegmentation.getSegmentDisplayInfo(comparison.segment);
                return (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{segmentInfo.icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {segmentInfo.shortName}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        P{Math.round(comparison.percentile)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        #{comparison.segment_rank}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Improvement Suggestions */}
        {comparisons[0]?.improvement_suggestions && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              🎯 Próximo Objetivo
            </h4>
            <div className="text-sm text-green-700 dark:text-green-300">
              <div className="mb-2">
                Para alcanzar el percentil {comparisons[0].improvement_suggestions.next_percentile_target}, 
                necesitas llegar a <strong>{comparisons[0].improvement_suggestions.value_needed.toFixed(1)} {unit}</strong>.
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                Tiempo estimado: {comparisons[0].improvement_suggestions.estimated_time_to_achieve}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};