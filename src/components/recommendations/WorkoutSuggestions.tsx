/**
 * WorkoutSuggestions Component
 * Displays AI-powered workout recommendations on the dashboard
 */

import React, { useState, useEffect } from 'react';
import { 
  WorkoutRecommendation, 
  RecommendationContext, 
  ExerciseRecommendation,
  WeaknessAnalysis 
} from '../../types/recommendations';
import { RecommendationEngine } from '../../services/recommendationEngine';

interface WorkoutSuggestionsProps {
  userId: string;
  userContext: RecommendationContext;
  maxSuggestions?: number;
  showWeaknessCorrection?: boolean;
  className?: string;
}

export const WorkoutSuggestions: React.FC<WorkoutSuggestionsProps> = ({
  userId,
  userContext,
  maxSuggestions = 3,
  showWeaknessCorrection = true,
  className = ''
}) => {
  const [recommendations, setRecommendations] = useState<WorkoutRecommendation[]>([]);
  const [weaknesses, setWeaknesses] = useState<WeaknessAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRecommendation | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, [userId, userContext]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const result = await RecommendationEngine.generateRecommendations(userContext);
      
      if (result.workout_recommendations) {
        setRecommendations(result.workout_recommendations.slice(0, maxSuggestions));
      }
      
      if (result.weakness_analyses && showWeaknessCorrection) {
        setWeaknesses(result.weakness_analyses.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading workout recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutTypeIcon = (type: WorkoutRecommendation['workout_type']) => {
    const icons = {
      'strength': '🏋️',
      'hypertrophy': '💪',
      'endurance': '🏃',
      'recovery': '🧘',
      'technique': '🎯'
    };
    return icons[type] || '💪';
  };

  const getWorkoutTypeColor = (type: WorkoutRecommendation['workout_type']) => {
    const colors = {
      'strength': 'from-red-500 to-red-600',
      'hypertrophy': 'from-blue-500 to-blue-600',
      'endurance': 'from-green-500 to-green-600',
      'recovery': 'from-purple-500 to-purple-600',
      'technique': 'from-yellow-500 to-yellow-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const getDifficultyStars = (level: number) => {
    return '⭐'.repeat(level) + '☆'.repeat(5 - level);
  };

  const getOptimalTimingIcon = (timing: string) => {
    const icons = {
      'morning': '🌅',
      'afternoon': '☀️',
      'evening': '🌙',
      'flexible': '🕐'
    };
    return icons[timing as keyof typeof icons] || '🕐';
  };

  const handleStartWorkout = (workout: WorkoutRecommendation) => {
    // This would integrate with your workout player
    console.log('Starting workout:', workout);
    // Navigate to workout player with recommended exercises
  };

  const handleViewDetails = (workout: WorkoutRecommendation) => {
    setSelectedWorkout(workout);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            🤖 Entrenamientos Recomendados
          </h3>
          <button
            onClick={loadRecommendations}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Workout Recommendations */}
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🤖</div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              No hay recomendaciones disponibles
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Registra más entrenamientos para obtener recomendaciones personalizadas
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((workout, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Workout Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getWorkoutTypeColor(workout.workout_type)} flex items-center justify-center text-white text-xl`}>
                      {getWorkoutTypeIcon(workout.workout_type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                        {workout.workout_type.replace('_', ' ')}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{getDifficultyStars(workout.difficulty_level)}</span>
                        <span>•</span>
                        <span>{workout.estimated_duration} min</span>
                        <span>•</span>
                        <span>{getOptimalTimingIcon(workout.optimal_timing)} {workout.optimal_timing}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(workout)}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => handleStartWorkout(workout)}
                      className="px-4 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Empezar
                    </button>
                  </div>
                </div>

                {/* Focus Areas */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {workout.focus_areas.map((area, areaIndex) => (
                      <span
                        key={areaIndex}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded-full"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reasoning */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {workout.reasoning}
                </p>

                {/* Exercise Preview */}
                {workout.recommended_exercises.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ejercicios incluidos ({workout.recommended_exercises.length}):
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {workout.recommended_exercises.slice(0, 4).map((exercise, exIndex) => (
                        <span
                          key={exIndex}
                          className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300 rounded"
                        >
                          {exercise.exercise_name}
                        </span>
                      ))}
                      {workout.recommended_exercises.length > 4 && (
                        <span className="px-2 py-1 bg-gray-50 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded">
                          +{workout.recommended_exercises.length - 4} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Prerequisites */}
                {workout.prerequisites && workout.prerequisites.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <div className="text-xs text-yellow-800 dark:text-yellow-200">
                      <strong>Requisitos:</strong> {workout.prerequisites.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Weakness Correction Section */}
        {showWeaknessCorrection && weaknesses.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              🎯 Corrección de Debilidades
            </h4>
            <div className="space-y-2">
              {weaknesses.slice(0, 2).map((weakness, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    weakness.priority === 'critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                    weakness.priority === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                    'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                        {weakness.muscle_group}
                      </h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {weakness.contributing_factors.slice(0, 2).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${
                        weakness.priority === 'critical' ? 'text-red-600 dark:text-red-400' :
                        weakness.priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {weakness.priority.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(weakness.weakness_score * 100)}% débil
                      </div>
                    </div>
                  </div>
                  
                  {weakness.recommended_exercises.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Ejercicios recomendados:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {weakness.recommended_exercises.slice(0, 3).map((exercise, exIndex) => (
                          <span
                            key={exIndex}
                            className="px-2 py-1 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 rounded border"
                          >
                            {exercise.exercise_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              📊 Ver Análisis Completo
            </button>
            <button className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              ⚙️ Personalizar Recomendaciones
            </button>
            <button className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              📅 Programar Entrenamientos
            </button>
          </div>
        </div>
      </div>

      {/* Workout Details Modal */}
      {showDetails && selectedWorkout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {selectedWorkout.workout_type.replace('_', ' ')} - Detalles
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Workout Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedWorkout.estimated_duration} min
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Duración</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {getDifficultyStars(selectedWorkout.difficulty_level)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Dificultad</div>
                </div>
              </div>

              {/* Reasoning */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">¿Por qué este entrenamiento?</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedWorkout.reasoning}</p>
              </div>

              {/* Exercises */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Ejercicios ({selectedWorkout.recommended_exercises.length})
                </h4>
                <div className="space-y-3">
                  {selectedWorkout.recommended_exercises.map((exercise, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {exercise.exercise_name}
                        </h5>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {exercise.recommended_sets} × {exercise.recommended_reps}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {exercise.reasoning}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {exercise.target_muscle_groups.map((muscle, mIndex) => (
                          <span
                            key={mIndex}
                            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300 rounded"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    handleStartWorkout(selectedWorkout);
                    setShowDetails(false);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  🚀 Empezar Entrenamiento
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};