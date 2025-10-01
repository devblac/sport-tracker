import React from 'react';
import { useExerciseSpecificRecommendations } from '@/hooks/useRecommendations';

interface ExerciseRecommendationCardProps {
  exerciseId: string;
  exerciseName: string;
  targetReps?: number;
  className?: string;
}

export const ExerciseRecommendationCard: React.FC<ExerciseRecommendationCardProps> = ({
  exerciseId,
  exerciseName,
  targetReps = 10,
  className = ''
}) => {
  const { recommendations, loading, error } = useExerciseSpecificRecommendations(exerciseId, targetReps);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !recommendations) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          No hay recomendaciones disponibles
        </div>
      </div>
    );
  }

  const { weightRecommendation, plateauDetection, suggestions } = recommendations;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white">{exerciseName}</h3>
        <div className="flex items-center gap-2">
          {plateauDetection && (
            <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 rounded-full text-xs font-medium">
              Plateau
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            weightRecommendation.confidence >= 0.8
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
              : weightRecommendation.confidence >= 0.6
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {Math.round(weightRecommendation.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Weight Recommendation */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">Peso Sugerido:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {weightRecommendation.suggestedWeight} kg
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {weightRecommendation.reasoning}
        </div>
        {weightRecommendation.previousBest > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Anterior: {weightRecommendation.previousBest} kg
          </div>
        )}
      </div>

      {/* Plateau Warning */}
      {plateauDetection && (
        <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-orange-600 dark:text-orange-400">⚠️</span>
            <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
              Plateau Detectado
            </span>
          </div>
          <div className="text-xs text-orange-700 dark:text-orange-300">
            {plateauDetection.plateau_duration_weeks} semanas sin mejora significativa
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            💡 Sugerencias:
          </div>
          <ul className="space-y-1">
            {suggestions.slice(0, 2).map((suggestion, index) => (
              <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progression Type Indicator */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">Progresión:</span>
          <span className={`font-medium ${
            weightRecommendation.progressionType === 'linear'
              ? 'text-green-600 dark:text-green-400'
              : weightRecommendation.progressionType === 'deload'
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {weightRecommendation.progressionType === 'linear' && '📈 Lineal'}
            {weightRecommendation.progressionType === 'deload' && '📉 Deload'}
            {weightRecommendation.progressionType === 'maintain' && '➡️ Mantener'}
            {weightRecommendation.progressionType === 'percentage' && '📊 Porcentual'}
          </span>
        </div>
      </div>
    </div>
  );
};