/**
 * SmartWeightSuggestion Component
 * Provides AI-powered weight recommendations during workout sessions
 */

import React, { useState, useEffect } from 'react';
import { 
  WeightSuggestion, 
  RepsSuggestion,
  RecommendationContext,
  ExerciseHistory 
} from '../../types/recommendations';
import { RecommendationEngine } from '../../services/recommendationEngine';

interface SmartWeightSuggestionProps {
  exerciseId: string;
  exerciseName: string;
  currentWeight?: number;
  targetReps?: number;
  userContext: RecommendationContext;
  onWeightSelected: (weight: number) => void;
  onRepsSelected: (reps: number) => void;
  showAlternatives?: boolean;
  className?: string;
}

export const SmartWeightSuggestion: React.FC<SmartWeightSuggestionProps> = ({
  exerciseId,
  exerciseName,
  currentWeight,
  targetReps,
  userContext,
  onWeightSelected,
  onRepsSelected,
  showAlternatives = true,
  className = ''
}) => {
  const [weightSuggestion, setWeightSuggestion] = useState<WeightSuggestion | null>(null);
  const [repsSuggestion, setRepsSuggestion] = useState<RepsSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [customWeight, setCustomWeight] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (exerciseId) {
      loadSuggestions();
    }
  }, [exerciseId, userContext]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const result = await RecommendationEngine.generateRecommendations(userContext);
      
      // Find suggestion for current exercise
      const weightSug = result.weight_suggestions.find(w => w.exercise_id === exerciseId);
      const repsSug = result.reps_suggestions.find(r => r.exercise_id === exerciseId);
      
      setWeightSuggestion(weightSug || null);
      setRepsSuggestion(repsSug || null);
      
      // Auto-select suggested weight if no current weight
      if (weightSug && !currentWeight) {
        setSelectedWeight(weightSug.suggested_weight);
      }
    } catch (error) {
      console.error('Error loading weight suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressionTypeIcon = (type: WeightSuggestion['progression_type']) => {
    const icons = {
      'linear': '📈',
      'percentage': '📊',
      'deload': '📉',
      'maintain': '➡️'
    };
    return icons[type] || '📈';
  };

  const getProgressionTypeColor = (type: WeightSuggestion['progression_type']) => {
    const colors = {
      'linear': 'text-green-600 bg-green-50 dark:bg-green-900/20',
      'percentage': 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      'deload': 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
      'maintain': 'text-gray-600 bg-gray-50 dark:bg-gray-700'
    };
    return colors[type] || 'text-gray-600 bg-gray-50 dark:bg-gray-700';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleWeightSelect = (weight: number) => {
    setSelectedWeight(weight);
    onWeightSelected(weight);
  };

  const handleCustomWeightSubmit = () => {
    const weight = parseFloat(customWeight);
    if (!isNaN(weight) && weight > 0) {
      handleWeightSelect(weight);
      setShowCustomInput(false);
      setCustomWeight('');
    }
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(1)} kg`;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 ${
      selectedWeight ? 'border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'
    } ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            🤖 Sugerencia Inteligente
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              {exerciseName}
            </span>
          </h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            {showDetails ? 'Ocultar' : 'Detalles'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Weight Suggestion */}
        {weightSuggestion ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getProgressionTypeIcon(weightSuggestion.progression_type)}</span>
                <span className="font-medium text-gray-900 dark:text-white">Peso Recomendado</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressionTypeColor(weightSuggestion.progression_type)}`}>
                  {weightSuggestion.progression_type}
                </span>
              </div>
              <div className={`text-sm font-medium ${getConfidenceColor(weightSuggestion.confidence)}`}>
                {Math.round(weightSuggestion.confidence * 100)}% confianza
              </div>
            </div>

            {/* Main Weight Suggestion */}
            <div className="text-center mb-4">
              <button
                onClick={() => handleWeightSelect(weightSuggestion.suggested_weight)}
                className={`text-3xl font-bold py-3 px-6 rounded-lg border-2 transition-all ${
                  selectedWeight === weightSuggestion.suggested_weight
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 text-gray-900 dark:text-white'
                }`}
              >
                {formatWeight(weightSuggestion.suggested_weight)}
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {weightSuggestion.expected_reps && (
                  <span>Reps esperadas: {weightSuggestion.expected_reps}</span>
                )}
                {weightSuggestion.target_rpe && (
                  <span className="ml-2">• RPE objetivo: {weightSuggestion.target_rpe}</span>
                )}
              </div>
            </div>

            {/* Alternative Weights */}
            {showAlternatives && weightSuggestion.alternative_weights && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => handleWeightSelect(weightSuggestion.alternative_weights!.conservative)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedWeight === weightSuggestion.alternative_weights!.conservative
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700'
                  }`}
                >
                  <div className="font-semibold">
                    {formatWeight(weightSuggestion.alternative_weights!.conservative)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Conservador</div>
                </button>
                
                <button
                  onClick={() => handleWeightSelect(weightSuggestion.alternative_weights!.aggressive)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedWeight === weightSuggestion.alternative_weights!.aggressive
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-700'
                  }`}
                >
                  <div className="font-semibold">
                    {formatWeight(weightSuggestion.alternative_weights!.aggressive)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Agresivo</div>
                </button>
              </div>
            )}

            {/* Custom Weight Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  ⚙️ Usar peso personalizado
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customWeight}
                    onChange={(e) => setCustomWeight(e.target.value)}
                    placeholder="Peso en kg"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    step="0.5"
                    min="0"
                  />
                  <button
                    onClick={handleCustomWeightSubmit}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomWeight('');
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Reasoning */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <div className="font-medium mb-1">💡 ¿Por qué este peso?</div>
                <div>{weightSuggestion.reasoning}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🤖</div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              No hay sugerencia disponible
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Necesitamos más datos de entrenamientos para generar recomendaciones
            </p>
          </div>
        )}

        {/* Reps Suggestion */}
        {repsSuggestion && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-white">Repeticiones Sugeridas</span>
              <span className={`text-sm font-medium ${getConfidenceColor(repsSuggestion.confidence)}`}>
                {Math.round(repsSuggestion.confidence * 100)}% confianza
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => onRepsSelected(repsSuggestion.suggested_reps)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
              >
                {repsSuggestion.suggested_reps} reps
              </button>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Rango: {repsSuggestion.rep_range.min}-{repsSuggestion.rep_range.max} reps
                • RPE objetivo: {repsSuggestion.target_rpe}
              </div>
            </div>
          </div>
        )}

        {/* Details Section */}
        {showDetails && weightSuggestion && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Detalles de la Recomendación</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">Tipo de Progresión</div>
                <div className="font-medium text-gray-900 dark:text-white capitalize">
                  {weightSuggestion.progression_type.replace('_', ' ')}
                </div>
              </div>
              
              <div>
                <div className="text-gray-600 dark:text-gray-400">Confianza</div>
                <div className={`font-medium ${getConfidenceColor(weightSuggestion.confidence)}`}>
                  {Math.round(weightSuggestion.confidence * 100)}%
                </div>
              </div>
              
              {weightSuggestion.expected_reps && (
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Reps Esperadas</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {weightSuggestion.expected_reps}
                  </div>
                </div>
              )}
              
              {weightSuggestion.target_rpe && (
                <div>
                  <div className="text-gray-600 dark:text-gray-400">RPE Objetivo</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {weightSuggestion.target_rpe}/10
                  </div>
                </div>
              )}
            </div>

            {/* Historical Context */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Basado en tu historial reciente:
              </div>
              <div className="text-sm text-gray-900 dark:text-white">
                • Último peso usado: {currentWeight ? formatWeight(currentWeight) : 'No disponible'}
                <br />
                • Tendencia de progreso: {weightSuggestion.progression_type === 'linear' ? 'Positiva' : 
                                        weightSuggestion.progression_type === 'deload' ? 'Necesita descanso' : 'Estable'}
                <br />
                • Nivel de fatiga: {userContext.recovery_status.overall_fatigue}/10
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={loadSuggestions}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            🔄 Actualizar
          </button>
          {selectedWeight && (
            <button
              onClick={() => {
                setSelectedWeight(null);
                onWeightSelected(0);
              }}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};