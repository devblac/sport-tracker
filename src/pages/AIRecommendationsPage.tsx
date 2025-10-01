import React from 'react';
import { AIRecommendationsDashboard } from '@/components/ai/AIRecommendationsDashboard';
import { ExerciseRecommendationCard } from '@/components/ai/ExerciseRecommendationCard';

const AIRecommendationsPage: React.FC = () => {
  // Sample exercises for demonstration
  const sampleExercises = [
    { id: 'bench_press', name: 'Press de Banca' },
    { id: 'squat', name: 'Sentadilla' },
    { id: 'deadlift', name: 'Peso Muerto' },
    { id: 'overhead_press', name: 'Press Militar' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Recomendaciones IA
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Análisis inteligente de tu progreso con recomendaciones personalizadas
          </p>
        </div>

        {/* Main Dashboard */}
        <div className="mb-8">
          <AIRecommendationsDashboard />
        </div>

        {/* Exercise-Specific Recommendations */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recomendaciones por Ejercicio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sampleExercises.map((exercise) => (
              <ExerciseRecommendationCard
                key={exercise.id}
                exerciseId={exercise.id}
                exerciseName={exercise.name}
                targetReps={10}
              />
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 text-xl">🤖</div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Cómo Funciona la IA
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p>
                  <strong>Detección de Plateaus:</strong> Analiza tu historial de entrenamientos para identificar 
                  estancamientos en el progreso y sugiere intervenciones específicas.
                </p>
                <p>
                  <strong>Análisis de Debilidades:</strong> Evalúa el balance entre grupos musculares y patrones 
                  de movimiento para identificar áreas que necesitan atención.
                </p>
                <p>
                  <strong>Recomendaciones de Peso:</strong> Sugiere pesos óptimos basados en tu historial de 
                  rendimiento y tendencias de progreso.
                </p>
                <p>
                  <strong>Recuperación Inteligente:</strong> Monitorea tu fatiga y sugiere estrategias de 
                  recuperación personalizadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendationsPage;