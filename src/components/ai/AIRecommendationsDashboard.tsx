import React, { useState } from 'react';
import { useAIRecommendations } from '@/hooks/useRecommendations';
import type { AIRecommendations } from '@/types/recommendations';

interface AIRecommendationsDashboardProps {
  className?: string;
}

export const AIRecommendationsDashboard: React.FC<AIRecommendationsDashboardProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'plateaus' | 'weaknesses' | 'recovery' | 'exercises'>('overview');
  
  const { recommendations, loading, error, refresh } = useAIRecommendations({
    includeWeightSuggestions: true,
    includePlateauDetection: true,
    includeWeaknessAnalysis: true,
    includeRecoveryRecommendations: true,
    includeExerciseRecommendations: true,
    weeksToAnalyze: 8
  });

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al generar recomendaciones
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          No hay recomendaciones disponibles
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recomendaciones IA
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Confianza: {Math.round(recommendations.confidence_score * 100)}%
            </p>
          </div>
          <button
            onClick={refresh}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Actualizar recomendaciones"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Resumen', count: recommendations.workout_suggestions.length },
            { id: 'plateaus', label: 'Plateaus', count: recommendations.plateau_detections.length },
            { id: 'weaknesses', label: 'Debilidades', count: recommendations.weakness_analyses.length },
            { id: 'recovery', label: 'Recuperación', count: recommendations.recovery_recommendations.length },
            { id: 'exercises', label: 'Ejercicios', count: recommendations.exercise_recommendations.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab recommendations={recommendations} />
        )}
        {activeTab === 'plateaus' && (
          <PlateausTab plateaus={recommendations.plateau_detections} />
        )}
        {activeTab === 'weaknesses' && (
          <WeaknessesTab weaknesses={recommendations.weakness_analyses} />
        )}
        {activeTab === 'recovery' && (
          <RecoveryTab recommendations={recommendations.recovery_recommendations} />
        )}
        {activeTab === 'exercises' && (
          <ExercisesTab exercises={recommendations.exercise_recommendations} />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ recommendations: AIRecommendations }> = ({ recommendations }) => {
  const highPriorityItems = [
    ...recommendations.workout_suggestions.filter(s => s.priority === 'high'),
    ...recommendations.recovery_recommendations.filter(r => r.priority === 'high').map(r => ({
      type: 'recovery' as const,
      title: r.title,
      description: r.description,
      priority: r.priority
    }))
  ];

  return (
    <div className="space-y-6">
      {/* High Priority Items */}
      {highPriorityItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            🚨 Prioridad Alta
          </h3>
          <div className="space-y-3">
            {highPriorityItems.slice(0, 3).map((item, index) => (
              <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-medium text-red-900 dark:text-red-100">{item.title}</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {recommendations.plateau_detections.length}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Plateaus Detectados</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {recommendations.weakness_analyses.length}
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">Debilidades</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {recommendations.recovery_recommendations.length}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Recomendaciones</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {Math.round(recommendations.confidence_score * 100)}%
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Confianza</div>
        </div>
      </div>

      {/* Recent Suggestions */}
      {recommendations.workout_suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            💡 Sugerencias de Entrenamiento
          </h3>
          <div className="space-y-3">
            {recommendations.workout_suggestions.slice(0, 5).map((suggestion, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{suggestion.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{suggestion.reasoning}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    suggestion.priority === 'high' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      : suggestion.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {suggestion.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Plateaus Tab Component
const PlateausTab: React.FC<{ plateaus: any[] }> = ({ plateaus }) => {
  if (plateaus.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🎯</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No se detectaron plateaus
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          ¡Excelente! Tu progreso se mantiene constante en todos los ejercicios.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plateaus.map((plateau, index) => (
        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {plateau.exercise_name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Plateau de {plateau.plateau_duration_weeks} semanas • Confianza: {Math.round(plateau.confidence * 100)}%
              </p>
            </div>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 rounded-full text-sm font-medium">
              {plateau.plateau_type}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Valor Actual</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {plateau.current_value} {plateau.stagnant_metric === 'max_weight' ? 'kg' : ''}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Mejor Anterior</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {plateau.previous_best} {plateau.stagnant_metric === 'max_weight' ? 'kg' : ''}
              </div>
            </div>
          </div>

          {plateau.suggested_interventions && plateau.suggested_interventions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Intervenciones Sugeridas:</h4>
              <div className="space-y-2">
                {plateau.suggested_interventions.slice(0, 3).map((intervention: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {intervention.description}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        intervention.priority === 'high' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      }`}>
                        {intervention.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Duración: {intervention.duration_weeks} semanas
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {intervention.expected_outcome}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Weaknesses Tab Component
const WeaknessesTab: React.FC<{ weaknesses: any[] }> = ({ weaknesses }) => {
  if (weaknesses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">💪</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No se detectaron debilidades significativas
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Tu entrenamiento parece estar bien balanceado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {weaknesses.map((weakness, index) => (
        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {weakness.muscle_group}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Score de debilidad: {Math.round(weakness.weakness_score * 100)}/100
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              weakness.priority === 'critical' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                : weakness.priority === 'high'
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
            }`}>
              {weakness.priority}
            </span>
          </div>

          {weakness.contributing_factors && weakness.contributing_factors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Factores Contribuyentes:</h4>
              <ul className="list-disc list-inside space-y-1">
                {weakness.contributing_factors.map((factor: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {weakness.recommended_exercises && weakness.recommended_exercises.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Ejercicios Recomendados:</h4>
              <div className="space-y-2">
                {weakness.recommended_exercises.slice(0, 2).map((exercise: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="font-medium text-gray-900 dark:text-white">{exercise.exercise_name}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exercise.reasoning}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{exercise.recommended_sets} series</span>
                      <span>{exercise.recommended_reps} reps</span>
                      <span>{exercise.frequency_per_week}x/semana</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Recovery Tab Component
const RecoveryTab: React.FC<{ recommendations: any[] }> = ({ recommendations }) => {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">😴</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Tu recuperación está en buen estado
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No se necesitan intervenciones especiales de recuperación en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Duración: {rec.duration}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              rec.priority === 'high' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
            }`}>
              {rec.priority}
            </span>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-4">{rec.description}</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Pasos a Seguir:</h4>
              <ul className="list-disc list-inside space-y-1">
                {rec.implementation_steps.slice(0, 4).map((step: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">{step}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Beneficios Esperados:</h4>
              <ul className="list-disc list-inside space-y-1">
                {rec.expected_benefits.slice(0, 4).map((benefit: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">{benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Exercises Tab Component
const ExercisesTab: React.FC<{ exercises: any[] }> = ({ exercises }) => {
  if (exercises.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🏋️</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No hay nuevos ejercicios recomendados
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Tu selección actual de ejercicios parece adecuada.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {exercises.map((exercise, index) => (
        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">{exercise.exerciseId}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              exercise.priority === 'high' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
            }`}>
              {exercise.priority}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{exercise.reason}</p>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Grupo muscular: {exercise.targetMuscleGroup}
          </div>
        </div>
      ))}
    </div>
  );
};