/**
 * Recommendation Test Page
 * Test page to demonstrate and test recommendation components
 */

import React, { useState } from 'react';
import { RecommendationContext, WorkoutHistory, ExerciseHistory } from '../types/recommendations';
import { WorkoutSuggestions, SmartWeightSuggestion, PlateauBreaker } from '../components/recommendations';

// Mock user context for testing
const mockUserContext: RecommendationContext = {
  user_id: 'test-user',
  user_demographics: {
    age: 28,
    gender: 'male',
    experience_level: 'intermediate',
    training_frequency: 4,
    available_time: 60,
    equipment_access: ['barbell', 'dumbbells', 'pull_up_bar', 'bench'],
    goals: ['strength', 'hypertrophy'],
    injuries: [],
    preferences: {
      exercise_types: ['compound', 'strength'],
      avoid_exercises: [],
      preferred_rep_ranges: ['6-8', '8-12']
    }
  },
  recent_workouts: [
    {
      workout_id: 'workout-1',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      exercises: [
        {
          exercise_id: 'bench_press',
          exercise_name: 'Press Banca',
          sets: [
            { set_number: 1, weight: 80, reps: 8, rpe: 7, rest_seconds: 180, completed: true },
            { set_number: 2, weight: 80, reps: 7, rpe: 8, rest_seconds: 180, completed: true },
            { set_number: 3, weight: 80, reps: 6, rpe: 9, rest_seconds: 180, completed: true }
          ],
          total_volume: 1680,
          max_weight: 80,
          total_reps: 21,
          average_rpe: 8
        },
        {
          exercise_id: 'squat',
          exercise_name: 'Sentadilla',
          sets: [
            { set_number: 1, weight: 100, reps: 5, rpe: 8, rest_seconds: 240, completed: true },
            { set_number: 2, weight: 100, reps: 5, rpe: 8, rest_seconds: 240, completed: true },
            { set_number: 3, weight: 100, reps: 4, rpe: 9, rest_seconds: 240, completed: true }
          ],
          total_volume: 1400,
          max_weight: 100,
          total_reps: 14,
          average_rpe: 8.3
        }
      ],
      total_volume: 3080,
      duration_minutes: 75,
      perceived_exertion: 8
    },
    {
      workout_id: 'workout-2',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      exercises: [
        {
          exercise_id: 'bench_press',
          exercise_name: 'Press Banca',
          sets: [
            { set_number: 1, weight: 80, reps: 8, rpe: 7, rest_seconds: 180, completed: true },
            { set_number: 2, weight: 80, reps: 8, rpe: 8, rest_seconds: 180, completed: true },
            { set_number: 3, weight: 80, reps: 7, rpe: 9, rest_seconds: 180, completed: true }
          ],
          total_volume: 1840,
          max_weight: 80,
          total_reps: 23,
          average_rpe: 8
        }
      ],
      total_volume: 1840,
      duration_minutes: 45,
      perceived_exertion: 7
    }
  ],
  performance_trends: [
    {
      exercise_id: 'bench_press',
      trend: 'stagnant',
      trend_strength: 0.8,
      weeks_analyzed: 4
    },
    {
      exercise_id: 'squat',
      trend: 'improving',
      trend_strength: 0.6,
      weeks_analyzed: 4
    }
  ],
  recovery_status: {
    overall_fatigue: 6,
    muscle_soreness: {
      'chest': 4,
      'legs': 7,
      'back': 3
    },
    sleep_quality: 7,
    stress_level: 5,
    last_rest_day: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  }
};

export const RecommendationTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workout' | 'weight' | 'plateau'>('workout');
  const [selectedExercise, setSelectedExercise] = useState('bench_press');
  const [currentWeight, setCurrentWeight] = useState(80);
  const [targetReps, setTargetReps] = useState(8);

  const handleWeightSelected = (weight: number) => {
    setCurrentWeight(weight);
    console.log('Weight selected:', weight);
  };

  const handleRepsSelected = (reps: number) => {
    setTargetReps(reps);
    console.log('Reps selected:', reps);
  };

  const handleInterventionSelected = (intervention: any, plateau: any) => {
    console.log('Intervention selected:', intervention, 'for plateau:', plateau);
    // Here you would implement the intervention logic
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🤖 Sistema de Recomendaciones Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test page para componentes de recomendaciones AI
          </p>
        </div>

        {/* User Context Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            👤 Contexto del Usuario (Mock Data)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Experiencia</div>
              <div className="font-medium text-gray-900 dark:text-white capitalize">
                {mockUserContext.user_demographics.experience_level}
              </div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Frecuencia</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {mockUserContext.user_demographics.training_frequency}x/semana
              </div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Objetivos</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {mockUserContext.user_demographics.goals.join(', ')}
              </div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Fatiga</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {mockUserContext.recovery_status.overall_fatigue}/10
              </div>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-1">
            <div className="flex space-x-1">
              {[
                { key: 'workout', label: '🏋️ Workout Suggestions', desc: 'AI workout recommendations' },
                { key: 'weight', label: '⚖️ Smart Weight', desc: 'Intelligent weight suggestions' },
                { key: 'plateau', label: '🚧 Plateau Breaker', desc: 'Plateau detection and solutions' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={tab.desc}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Workout Suggestions Test */}
          {activeTab === 'workout' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Workout Suggestions Component
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Recomendaciones de entrenamientos personalizadas para el dashboard
                </p>
              </div>

              <WorkoutSuggestions
                userId="test-user"
                userContext={mockUserContext}
                maxSuggestions={3}
                showWeaknessCorrection={true}
              />
            </div>
          )}

          {/* Smart Weight Suggestion Test */}
          {activeTab === 'weight' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Smart Weight Suggestion Component
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Sugerencias inteligentes de peso para el workout player
                </p>
              </div>

              {/* Exercise Selector */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ejercicio:
                    </label>
                    <select
                      value={selectedExercise}
                      onChange={(e) => setSelectedExercise(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="bench_press">Press Banca</option>
                      <option value="squat">Sentadilla</option>
                      <option value="deadlift">Peso Muerto</option>
                      <option value="overhead_press">Press Militar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Peso Actual (kg):
                    </label>
                    <input
                      type="number"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      step="2.5"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reps Objetivo:
                    </label>
                    <input
                      type="number"
                      value={targetReps}
                      onChange={(e) => setTargetReps(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      min="1"
                      max="20"
                    />
                  </div>
                </div>
              </div>

              <SmartWeightSuggestion
                exerciseId={selectedExercise}
                exerciseName={selectedExercise.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                currentWeight={currentWeight}
                targetReps={targetReps}
                userContext={mockUserContext}
                onWeightSelected={handleWeightSelected}
                onRepsSelected={handleRepsSelected}
                showAlternatives={true}
              />

              {/* Current Selection Display */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Selección Actual:
                </h3>
                <div className="text-blue-700 dark:text-blue-300">
                  <strong>{selectedExercise.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>: {currentWeight} kg × {targetReps} reps
                </div>
              </div>
            </div>
          )}

          {/* Plateau Breaker Test */}
          {activeTab === 'plateau' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Plateau Breaker Component
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Detección de plateaus y estrategias de intervención
                </p>
              </div>

              <PlateauBreaker
                userContext={mockUserContext}
                showAllPlateaus={true}
                onInterventionSelected={handleInterventionSelected}
              />

              {/* Single Exercise Plateau Test */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Plateau para Ejercicio Específico
                </h3>
                <PlateauBreaker
                  userContext={mockUserContext}
                  exerciseId="bench_press"
                  showAllPlateaus={false}
                  onInterventionSelected={handleInterventionSelected}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Sistema de Recomendaciones Test Page • Todos los componentes funcionan con datos simulados
          </p>
        </div>
      </div>
    </div>
  );
};