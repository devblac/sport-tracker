/**
 * Viral Content Test Page
 * 
 * Test page to demonstrate all viral content functionality.
 */

import React, { useState } from 'react';
import { 
  ViralContentManager,
  AutoWorkoutCardGenerator,
  EpicAchievementUnlock,
  ViralAnalyticsDashboard,
  ViralRewardsCelebration
} from '@/components/sharing';
import { useViralContentStore } from '@/stores/useViralContentStore';
import type { Workout } from '@/types/workout';
import type { Achievement } from '@/types/gamification';

const ViralContentTestPage: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('manager');
  const { showCelebration, pendingRewards } = useViralContentStore();

  // Mock data
  const mockWorkout: Workout = {
    id: 'test-workout-1',
    user_id: 'test-user',
    name: 'Push Day Intenso',
    exercises: [
      {
        exercise_id: '1',
        exercise_name: 'Bench Press',
        order: 1,
        sets: [
          { weight: 80, reps: 8, rpe: 8, type: 'normal', completed: true },
          { weight: 85, reps: 6, rpe: 9, type: 'normal', completed: true },
          { weight: 90, reps: 4, rpe: 10, type: 'normal', completed: true, isPersonalRecord: true }
        ],
        rest_time: 180
      },
      {
        exercise_id: '2',
        exercise_name: 'Overhead Press',
        order: 2,
        sets: [
          { weight: 50, reps: 10, rpe: 7, type: 'normal', completed: true },
          { weight: 55, reps: 8, rpe: 8, type: 'normal', completed: true },
          { weight: 60, reps: 6, rpe: 9, type: 'normal', completed: true }
        ],
        rest_time: 120
      }
    ],
    is_template: false,
    is_completed: true,
    started_at: new Date(Date.now() - 3600000), // 1 hour ago
    completed_at: new Date(),
    duration: 60,
    total_volume: 2450,
    notes: 'Excelente sesión, nuevo PR en bench press!'
  };

  const mockAchievement: Achievement = {
    id: 'strength-master',
    name: 'Maestro de la Fuerza',
    description: 'Alcanza 100kg en bench press por primera vez',
    icon: '💪',
    category: 'strength',
    rarity: 'epic',
    requirements: [
      {
        type: 'weight_lifted',
        target_value: 100,
        timeframe: 'all_time'
      }
    ],
    xp_reward: 500,
    unlock_content: 'Nuevo título: "Powerlifter"'
  };

  const mockProgress = {
    current: 100,
    total: 100,
    unit: 'kg'
  };

  const mockRewards = [
    {
      id: 'reward-1',
      contentId: 'content-1',
      type: 'xp_bonus' as const,
      value: 100,
      description: '+100 XP por contenido viral',
      unlockedAt: new Date(),
      claimed: false
    },
    {
      id: 'reward-2',
      contentId: 'content-2',
      type: 'badge' as const,
      value: 1,
      description: 'Badge "Influencer Fitness"',
      unlockedAt: new Date(),
      claimed: false
    }
  ];

  const renderDemo = () => {
    switch (activeDemo) {
      case 'manager':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Viral Content Manager</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Componente central que maneja toda la funcionalidad viral automáticamente.
              </p>
              <ViralContentManager
                userId="test-user"
                currentWorkout={mockWorkout}
                unlockedAchievement={mockAchievement}
                achievementProgress={mockProgress}
              />
            </div>
          </div>
        );

      case 'workout-card':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Auto Workout Card Generator</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Genera automáticamente tarjetas visuales cuando se completa un entrenamiento.
              </p>
              <AutoWorkoutCardGenerator
                workout={mockWorkout}
                userId="test-user"
                autoShow={false}
              />
            </div>
          </div>
        );

      case 'achievement':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Epic Achievement Unlock</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Celebración épica para desbloqueo de logros con efectos visuales.
              </p>
              <button
                onClick={() => {
                  // Trigger achievement unlock
                  document.body.appendChild(
                    React.createElement(EpicAchievementUnlock, {
                      achievement: mockAchievement,
                      userId: 'test-user',
                      progress: mockProgress,
                      onClose: () => {
                        const elements = document.querySelectorAll('[data-achievement-unlock]');
                        elements.forEach(el => el.remove());
                      }
                    })
                  );
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Mostrar Achievement Unlock
              </button>
            </div>
          </div>
        );

      case 'rewards':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Viral Rewards Celebration</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Celebración de recompensas virales con animaciones épicas.
              </p>
              <ViralRewardsCelebration
                rewards={mockRewards}
                onClose={() => console.log('Closed rewards')}
                onClaimAll={() => console.log('Claimed all rewards')}
              />
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <ViralAnalyticsDashboard />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🔥 Sistema de Contenido Viral
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Prueba todas las funcionalidades del sistema de contenido viral
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            { id: 'manager', label: '🎯 Manager Central', desc: 'Componente principal' },
            { id: 'workout-card', label: '💪 Workout Cards', desc: 'Tarjetas de entrenamiento' },
            { id: 'achievement', label: '🏆 Achievement Unlock', desc: 'Desbloqueo de logros' },
            { id: 'rewards', label: '🎁 Viral Rewards', desc: 'Recompensas virales' },
            { id: 'analytics', label: '📊 Analytics', desc: 'Dashboard de métricas' }
          ].map((demo) => (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(demo.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeDemo === demo.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-semibold mb-1">{demo.label}</div>
                <div className="text-sm opacity-75">{demo.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Demo Content */}
        <div className="space-y-8">
          {renderDemo()}
        </div>

        {/* Features Overview */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Características Implementadas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">🎨</span>
                Generación Automática
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Workout cards automáticas</li>
                <li>• Achievement cards épicas</li>
                <li>• Personal record cards</li>
                <li>• Múltiples plantillas</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">📱</span>
                Sharing Optimizado
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 8 plataformas soportadas</li>
                <li>• Texto optimizado por plataforma</li>
                <li>• Hashtags inteligentes</li>
                <li>• Horarios óptimos</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">🏆</span>
                Sistema de Recompensas
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Hitos virales automáticos</li>
                <li>• XP bonus por viralidad</li>
                <li>• Badges especiales</li>
                <li>• Contenido exclusivo</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">📊</span>
                Analytics Avanzados
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Métricas de engagement</li>
                <li>• Coeficiente viral</li>
                <li>• Rendimiento por plataforma</li>
                <li>• Tendencias temporales</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">🎭</span>
                Experiencia Visual
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Animaciones épicas</li>
                <li>• Efectos de partículas</li>
                <li>• Celebraciones por rareza</li>
                <li>• Transiciones fluidas</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">⚡</span>
                Integración Completa
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Zustand store persistente</li>
                <li>• Hooks personalizados</li>
                <li>• TypeScript completo</li>
                <li>• Componentes modulares</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViralContentTestPage;