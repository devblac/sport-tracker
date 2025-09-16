import React, { useState } from 'react';
import { TrendingUp, Brain, AlertTriangle, CheckCircle } from 'lucide-react';
import { useWeightRecommendation } from '@/hooks/useRecommendations';
import type { WeightRecommendation } from '@/types/recommendations';

interface SmartWeightSuggestionProps {
  exerciseId: string;
  targetReps: number;
  currentSetNumber: number;
  currentWeight?: number;
  onWeightSelect: (weight: number) => void;
  onWeightSelectAll?: (weight: number) => void; // Apply to all sets
  className?: string;
}

export const SmartWeightSuggestion: React.FC<SmartWeightSuggestionProps> = ({
  exerciseId,
  targetReps,
  currentSetNumber,
  currentWeight,
  onWeightSelect,
  onWeightSelectAll,
  className = ''
}) => {
  const { recommendation, loading, error } = useWeightRecommendation(
    exerciseId,
    targetReps,
    currentSetNumber
  );
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
        <Brain className="w-4 h-4 animate-pulse" />
        <span>Analyzing your performance...</span>
      </div>
    );
  }

  if (error || !recommendation) {
    return null;
  }

  const getProgressionIcon = (type: WeightRecommendation['progressionType']) => {
    switch (type) {
      case 'linear':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'deload':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'maintain':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Brain className="w-4 h-4 text-purple-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getProgressionMessage = (type: WeightRecommendation['progressionType']) => {
    switch (type) {
      case 'linear':
        return 'Progressive overload suggested';
      case 'deload':
        return 'Consider reducing weight';
      case 'maintain':
        return 'Maintain current intensity';
      default:
        return 'Smart suggestion';
    }
  };

  const isDifferentFromCurrent = currentWeight && 
    Math.abs(currentWeight - recommendation.suggestedWeight) > 0.5;

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700 ${className}`}>
      {/* Main suggestion */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getProgressionIcon(recommendation.progressionType)}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {recommendation.suggestedWeight}kg
              </span>
              {isDifferentFromCurrent && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => onWeightSelect(recommendation.suggestedWeight)}
                    className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                  >
                    Use
                  </button>
                  {onWeightSelectAll && (
                    <button
                      onClick={() => onWeightSelectAll(recommendation.suggestedWeight)}
                      className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                      title="Apply to all sets"
                    >
                      All
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {getProgressionMessage(recommendation.progressionType)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`text-xs font-medium ${getConfidenceColor(recommendation.confidence)}`}>
            {Math.round(recommendation.confidence * 100)}% confident
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Brain className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Previous best:</span>
              <span className="font-medium">{recommendation.previousBest}kg</span>
            </div>
            
            <div className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">AI Analysis:</span>
              <p className="mt-1 text-xs leading-relaxed">
                {recommendation.reasoning}
              </p>
            </div>

            {/* Quick weight adjustments */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Quick adjust (first set):</span>
                {[-2.5, -1.25, 1.25, 2.5].map(adjustment => {
                  const adjustedWeight = recommendation.suggestedWeight + adjustment;
                  return (
                    <button
                      key={adjustment}
                      onClick={() => onWeightSelect(adjustedWeight)}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {adjustment > 0 ? '+' : ''}{adjustment}
                    </button>
                  );
                })}
              </div>
              
              {onWeightSelectAll && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Apply to all sets:</span>
                  {[-2.5, -1.25, 1.25, 2.5].map(adjustment => {
                    const adjustedWeight = recommendation.suggestedWeight + adjustment;
                    return (
                      <button
                        key={`all-${adjustment}`}
                        onClick={() => onWeightSelectAll(adjustedWeight)}
                        className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-700 transition-colors"
                      >
                        {adjustment > 0 ? '+' : ''}{adjustment}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};