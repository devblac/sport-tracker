/**
 * PlateauBreaker Component
 * Displays plateau detection and intervention recommendations
 */

import React, { useState, useEffect } from 'react';
import { 
  PlateauDetection, 
  PlateauIntervention,
  RecommendationContext 
} from '../../types/recommendations';
import { PlateauDetectionService } from '../../services/plateauDetectionService';

interface PlateauBreakerProps {
  userContext: RecommendationContext;
  exerciseId?: string; // If provided, show only for specific exercise
  showAllPlateaus?: boolean;
  onInterventionSelected?: (intervention: PlateauIntervention, plateau: PlateauDetection) => void;
  className?: string;
}

export const PlateauBreaker: React.FC<PlateauBreakerProps> = ({
  userContext,
  exerciseId,
  showAllPlateaus = true,
  onInterventionSelected,
  className = ''
}) => {
  const [plateaus, setPlateaus] = useState<PlateauDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlateau, setSelectedPlateau] = useState<PlateauDetection | null>(null);
  const [showInterventionDetails, setShowInterventionDetails] = useState(false);

  useEffect(() => {
    loadPlateauDetections();
  }, [userContext, exerciseId]);

  const loadPlateauDetections = async () => {
    setLoading(true);
    try {
      const detectedPlateaus = await PlateauDetectionService.detectAllPlateaus(userContext);
      
      let filteredPlateaus = detectedPlateaus;
      if (exerciseId) {
        filteredPlateaus = detectedPlateaus.filter(p => p.exercise_id === exerciseId);
      }
      
      setPlateaus(filteredPlateaus);
      
      // Auto-select first plateau if only showing one exercise
      if (filteredPlateaus.length === 1) {
        setSelectedPlateau(filteredPlateaus[0]);
      }
    } catch (error) {
      console.error('Error loading plateau detections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlateauTypeIcon = (type: PlateauDetection['plateau_type']) => {
    const icons = {
      'strength': '🏋️',
      'volume': '📊',
      'endurance': '🏃'
    };
    return icons[type] || '📈';
  };

  const getPlateauTypeColor = (type: PlateauDetection['plateau_type']) => {
    const colors = {
      'strength': 'text-red-600 bg-red-50 dark:bg-red-900/20',
      'volume': 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      'endurance': 'text-green-600 bg-green-50 dark:bg-green-900/20'
    };
    return colors[type] || 'text-gray-600 bg-gray-50 dark:bg-gray-700';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getInterventionPriorityColor = (priority: PlateauIntervention['priority']) => {
    const colors = {
      'high': 'border-red-500 bg-red-50 dark:bg-red-900/20',
      'medium': 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      'low': 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
    };
    return colors[priority] || 'border-gray-500 bg-gray-50 dark:bg-gray-700';
  };

  const getInterventionTypeIcon = (type: PlateauIntervention['type']) => {
    const icons = {
      'deload': '📉',
      'technique_focus': '🎯',
      'volume_increase': '📈',
      'frequency_change': '📅',
      'exercise_variation': '🔄',
      'rest_increase': '😴'
    };
    return icons[type] || '⚙️';
  };

  const formatDuration = (weeks: number) => {
    return weeks === 1 ? '1 semana' : `${weeks} semanas`;
  };

  const handleInterventionSelect = (intervention: PlateauIntervention, plateau: PlateauDetection) => {
    onInterventionSelected?.(intervention, plateau);
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
            🚧 Detector de Plateaus
            {plateaus.length > 0 && (
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-full">
                {plateaus.length} detectado{plateaus.length > 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <button
            onClick={loadPlateauDetections}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      <div className="p-4">
        {plateaus.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              ¡No se detectaron plateaus!
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Tu progreso se mantiene constante. ¡Sigue así!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Plateau List */}
            {showAllPlateaus && plateaus.length > 1 && (
              <div className="grid gap-3">
                {plateaus.map((plateau, index) => (
                  <div
                    key={plateau.exercise_id}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      selectedPlateau?.exercise_id === plateau.exercise_id
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'
                    }`}
                    onClick={() => setSelectedPlateau(plateau)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getPlateauTypeIcon(plateau.plateau_type)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {plateau.exercise_name}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlateauTypeColor(plateau.plateau_type)}`}>
                              {plateau.plateau_type}
                            </span>
                            <span>•</span>
                            <span>{plateau.plateau_duration_weeks} semanas</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getConfidenceColor(plateau.confidence)}`}>
                          {Math.round(plateau.confidence * 100)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">confianza</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Plateau Details */}
            {(selectedPlateau || plateaus.length === 1) && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                {(() => {
                  const plateau = selectedPlateau || plateaus[0];
                  return (
                    <div className="space-y-4">
                      {/* Plateau Summary */}
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{getPlateauTypeIcon(plateau.plateau_type)}</span>
                          <div>
                            <h4 className="font-semibold text-red-800 dark:text-red-200">
                              Plateau Detectado: {plateau.exercise_name}
                            </h4>
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {plateau.plateau_duration_weeks} semanas sin mejora significativa en {plateau.stagnant_metric.replace('_', ' ')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-red-700 dark:text-red-300 font-medium">Valor Actual</div>
                            <div className="text-red-800 dark:text-red-200">
                              {plateau.current_value.toFixed(1)} {plateau.stagnant_metric === 'max_weight' ? 'kg' : 
                                                                  plateau.stagnant_metric === 'total_volume' ? 'kg' : 'reps'}
                            </div>
                          </div>
                          <div>
                            <div className="text-red-700 dark:text-red-300 font-medium">Mejor Anterior</div>
                            <div className="text-red-800 dark:text-red-200">
                              {plateau.previous_best.toFixed(1)} {plateau.stagnant_metric === 'max_weight' ? 'kg' : 
                                                                  plateau.stagnant_metric === 'total_volume' ? 'kg' : 'reps'}
                            </div>
                          </div>
                        </div>

                        {plateau.last_improvement_date && (
                          <div className="mt-3 text-sm text-red-700 dark:text-red-300">
                            Última mejora: {plateau.last_improvement_date.toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Interventions */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          💡 Estrategias para Romper el Plateau
                        </h4>
                        
                        <div className="space-y-3">
                          {plateau.suggested_interventions.map((intervention, index) => (
                            <div
                              key={index}
                              className={`border-l-4 rounded-lg p-4 ${getInterventionPriorityColor(intervention.priority)}`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getInterventionTypeIcon(intervention.type)}</span>
                                  <h5 className="font-medium text-gray-900 dark:text-white">
                                    {intervention.description}
                                  </h5>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    intervention.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                    intervention.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  }`}>
                                    {intervention.priority.toUpperCase()}
                                  </span>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {formatDuration(intervention.duration_weeks)}
                                  </span>
                                </div>
                              </div>

                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                <strong>Resultado esperado:</strong> {intervention.expected_outcome}
                              </p>

                              {/* Implementation Details */}
                              <div className="mb-3">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Cómo implementar:
                                </div>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  {intervention.implementation_details.map((detail, detailIndex) => (
                                    <li key={detailIndex} className="flex items-start gap-2">
                                      <span className="text-blue-500 mt-1">•</span>
                                      <span>{detail}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Action Button */}
                              <button
                                onClick={() => handleInterventionSelect(intervention, plateau)}
                                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                                  intervention.priority === 'high' 
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : intervention.priority === 'medium'
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                              >
                                🚀 Aplicar Esta Estrategia
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                          💡 Consejos Adicionales
                        </h5>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• Los plateaus son normales y parte del proceso de entrenamiento</li>
                          <li>• La paciencia es clave - algunos plateaus requieren tiempo para resolverse</li>
                          <li>• Considera factores externos como estrés, sueño y nutrición</li>
                          <li>• Documenta tu progreso para identificar patrones</li>
                        </ul>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {plateaus.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                📊 Ver Análisis Detallado
              </button>
              <button className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                📅 Programar Intervención
              </button>
              <button className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                📈 Historial de Plateaus
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};