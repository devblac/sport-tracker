/**
 * Percentile Test Page
 * Test page to demonstrate and test percentile components
 */

import React, { useState } from 'react';
import { UserDemographics } from '../types/percentiles';
import { PercentileDisplay, StrengthComparison, GlobalRankings } from '../components/percentiles';

// Mock user demographics
const mockDemographics: UserDemographics = {
  age: 28,
  gender: 'male',
  weight: 75,
  height: 180,
  experience_level: 'intermediate',
  body_fat_percentage: 12
};

// Mock exercise data
const mockExercises = [
  {
    exercise_id: 'squat',
    exercise_name: 'Sentadilla',
    user_value: 120,
    unit: 'kg',
    category: 'powerlifting' as const
  },
  {
    exercise_id: 'bench_press',
    exercise_name: 'Press Banca',
    user_value: 85,
    unit: 'kg',
    category: 'powerlifting' as const
  },
  {
    exercise_id: 'deadlift',
    exercise_name: 'Peso Muerto',
    user_value: 140,
    unit: 'kg',
    category: 'powerlifting' as const
  },
  {
    exercise_id: 'pull_ups',
    exercise_name: 'Dominadas',
    user_value: 12,
    unit: 'reps',
    category: 'bodyweight' as const
  },
  {
    exercise_id: 'push_ups',
    exercise_name: 'Flexiones',
    user_value: 35,
    unit: 'reps',
    category: 'bodyweight' as const
  },
  {
    exercise_id: 'running_5k',
    exercise_name: 'Carrera 5K',
    user_value: 1320, // 22 minutes in seconds
    unit: 'time',
    category: 'cardio' as const
  }
];

export const PercentileTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'percentile' | 'comparison' | 'rankings'>('percentile');
  const [selectedExercise, setSelectedExercise] = useState(mockExercises[0]);
  const [demographics, setDemographics] = useState(mockDemographics);

  const handleDemographicChange = (field: keyof UserDemographics, value: any) => {
    setDemographics(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Sistema de Percentiles Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test page para componentes de percentiles y comparaciones
          </p>
        </div>

        {/* Demographics Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            👤 Datos Demográficos del Usuario
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Edad
              </label>
              <input
                type="number"
                value={demographics.age}
                onChange={(e) => handleDemographicChange('age', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min="18"
                max="80"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Género
              </label>
              <select
                value={demographics.gender}
                onChange={(e) => handleDemographicChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                value={demographics.weight}
                onChange={(e) => handleDemographicChange('weight', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min="40"
                max="200"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Altura (cm)
              </label>
              <input
                type="number"
                value={demographics.height}
                onChange={(e) => handleDemographicChange('height', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min="140"
                max="220"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Experiencia
              </label>
              <select
                value={demographics.experience_level}
                onChange={(e) => handleDemographicChange('experience_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
                <option value="expert">Experto</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grasa Corporal (%)
              </label>
              <input
                type="number"
                value={demographics.body_fat_percentage || 15}
                onChange={(e) => handleDemographicChange('body_fat_percentage', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min="5"
                max="40"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-1">
            <div className="flex space-x-1">
              {[
                { key: 'percentile', label: '📊 Percentile Display', desc: 'Individual exercise percentile' },
                { key: 'comparison', label: '💪 Strength Comparison', desc: 'Multi-exercise comparison' },
                { key: 'rankings', label: '🏆 Global Rankings', desc: 'Global leaderboards' }
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
          {/* Percentile Display Test */}
          {activeTab === 'percentile' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Percentile Display Component
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Muestra el percentil del usuario para un ejercicio específico
                </p>
              </div>

              {/* Exercise Selector */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seleccionar Ejercicio:
                </label>
                <select
                  value={selectedExercise.exercise_id}
                  onChange={(e) => {
                    const exercise = mockExercises.find(ex => ex.exercise_id === e.target.value);
                    if (exercise) setSelectedExercise(exercise);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {mockExercises.map(exercise => (
                    <option key={exercise.exercise_id} value={exercise.exercise_id}>
                      {exercise.exercise_name} - {exercise.user_value} {exercise.unit}
                    </option>
                  ))}
                </select>
              </div>

              <PercentileDisplay
                userId="test-user"
                exerciseId={selectedExercise.exercise_id}
                exerciseName={selectedExercise.exercise_name}
                userValue={selectedExercise.user_value}
                unit={selectedExercise.unit}
                demographics={demographics}
                showComparisons={true}
              />
            </div>
          )}

          {/* Strength Comparison Test */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Strength Comparison Component
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Compara el rendimiento del usuario en múltiples ejercicios
                </p>
              </div>

              <StrengthComparison
                userId="test-user"
                demographics={demographics}
                exercises={mockExercises}
                showRelativeStrength={true}
              />
            </div>
          )}

          {/* Global Rankings Test */}
          {activeTab === 'rankings' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Global Rankings Component
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Muestra los rankings globales para ejercicios específicos
                </p>
              </div>

              {/* Exercise Selector for Rankings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seleccionar Ejercicio para Rankings:
                </label>
                <select
                  value={selectedExercise.exercise_id}
                  onChange={(e) => {
                    const exercise = mockExercises.find(ex => ex.exercise_id === e.target.value);
                    if (exercise) setSelectedExercise(exercise);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {mockExercises.map(exercise => (
                    <option key={exercise.exercise_id} value={exercise.exercise_id}>
                      {exercise.exercise_name}
                    </option>
                  ))}
                </select>
              </div>

              <GlobalRankings
                exerciseId={selectedExercise.exercise_id}
                exerciseName={selectedExercise.exercise_name}
                metricType={selectedExercise.exercise_id === 'running_5k' ? 'best_time' : 
                           selectedExercise.unit === 'reps' ? 'max_reps' : 'max_weight'}
                currentUserId="test-user"
                showFilters={true}
                limit={50}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Sistema de Percentiles Test Page • Todos los componentes funcionan con datos simulados
          </p>
        </div>
      </div>
    </div>
  );
};