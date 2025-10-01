/**
 * Notification Test Page
 * 
 * Test page for demonstrating the notification system functionality.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Send, 
  Settings, 
  BarChart3, 
  Trophy,
  Flame,
  Clock,
  Users
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { notificationService } from '@/services/NotificationService';
import { streakNotificationService } from '@/services/StreakNotificationService';


const TEST_USER_ID = 'test-user-notifications';

export const NotificationTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'center' | 'settings' | 'test' | 'stats'>('center');

  const {
    permission,
    settings,
    notifications,
    unreadCount,
    stats,
    sendWorkoutReminder,
    sendStreakReminder,
    sendAchievementCelebration,
    sendLevelUpCelebration,
    isLoading
  } = useNotifications(TEST_USER_ID);

  const [testResults, setTestResults] = useState<{ type: string; success: boolean; message: string }[]>([]);

  const handleTestNotification = async (type: string) => {
    let success = false;
    let message = '';

    try {
      switch (type) {
        case 'workout_reminder':
          success = await sendWorkoutReminder();
          message = success ? 'Recordatorio de entrenamiento enviado' : 'Error al enviar recordatorio';
          break;
        
        case 'streak_reminder':
          success = await sendStreakReminder(false);
          message = success ? 'Recordatorio de racha enviado' : 'Error al enviar recordatorio';
          break;
        
        case 'streak_at_risk':
          success = await sendStreakReminder(true);
          message = success ? 'Alerta de racha en riesgo enviada' : 'Error al enviar alerta';
          break;
        
        case 'achievement_common':
          success = await sendAchievementCelebration('test_achievement_1', 'Primera Victoria', 'Completaste tu primer entrenamiento', 'common');
          message = success ? 'Logro común enviado' : 'Error al enviar logro';
          break;
        
        case 'achievement_rare':
          success = await sendAchievementCelebration('test_achievement_2', 'Guerrero Imparable', 'Completaste 50 entrenamientos consecutivos', 'rare');
          message = success ? 'Logro raro enviado' : 'Error al enviar logro';
          break;
        
        case 'level_up':
          success = await sendLevelUpCelebration(5, 250);
          message = success ? 'Celebración de nivel enviada' : 'Error al enviar celebración';
          break;
        
        case 'streak_at_risk_urgent':
          success = await notificationService.showStreakAtRiskNotification(15, 2);
          message = success ? 'Notificación urgente de racha enviada' : 'Error al enviar notificación urgente';
          break;
        
        case 'streak_milestone':
          success = await notificationService.showStreakMilestoneApproachingNotification(27, 30);
          message = success ? 'Notificación de hito próximo enviada' : 'Error al enviar notificación de hito';
          break;
        
        case 'test_basic':
          success = await notificationService.testNotification();
          message = success ? 'Notificación de prueba enviada' : 'Error al enviar notificación de prueba';
          break;
      }

      setTestResults(prev => [...prev, { type, success, message }]);
    } catch (error) {
      setTestResults(prev => [...prev, { type, success: false, message: `Error: ${error}` }]);
    }
  };

  const handleDoNotDisturbTest = () => {
    const isEnabled = notificationService.getDoNotDisturbMode();
    notificationService.setDoNotDisturbMode(!isEnabled, isEnabled ? undefined : 30);
    const message = !isEnabled ? 'Do Not Disturb activado por 30 min' : 'Do Not Disturb desactivado';
    setTestResults(prev => [...prev, { type: 'dnd_toggle', success: true, message }]);
  };

  const handleStreakMonitoringTest = () => {
    streakNotificationService.setupStreakMonitoring({
      userId: TEST_USER_ID,
      currentStreak: 15,
      scheduledDays: [1, 3, 5], // Monday, Wednesday, Friday
      enableRiskNotifications: true,
      warningThresholds: {
        early: 6,
        urgent: 3,
        critical: 1
      }
    });
    setTestResults(prev => [...prev, { type: 'streak_monitoring', success: true, message: 'Monitoreo de racha configurado' }]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando sistema de notificaciones...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'center', label: 'Centro de Notificaciones', icon: Bell, count: unreadCount },
    { id: 'settings', label: 'Configuración', icon: Settings, count: null },
    { id: 'test', label: 'Pruebas', icon: Send, count: null },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3, count: null }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Sistema de Notificaciones
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gestión completa de notificaciones push e in-app
                </p>
              </div>
              
              {/* Permission Status */}
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  permission.granted 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : permission.denied
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}>
                  {permission.granted ? '✅ Permitidas' : permission.denied ? '❌ Bloqueadas' : '⏳ Pendientes'}
                </div>
                
                {unreadCount > 0 && (
                  <div className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
                    {unreadCount} nuevas
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors relative flex items-center space-x-2
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'center' && (
            <NotificationCenter userId={TEST_USER_ID} />
          )}

          {activeTab === 'settings' && (
            <NotificationSettings userId={TEST_USER_ID} />
          )}

          {activeTab === 'test' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Probar Notificaciones
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Workout Reminder */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Recordatorio de Entrenamiento
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Notificación para recordar entrenar
                    </p>
                    <button
                      onClick={() => handleTestNotification('workout_reminder')}
                      className="w-full px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Enviar
                    </button>
                  </div>

                  {/* Streak Reminder */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Flame className="w-5 h-5 text-red-500" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Recordatorio de Racha
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Notificación de racha normal
                    </p>
                    <button
                      onClick={() => handleTestNotification('streak_reminder')}
                      className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Enviar
                    </button>
                  </div>

                  {/* Streak At Risk */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Flame className="w-5 h-5 text-red-600" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Racha en Riesgo
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Alerta urgente de racha en peligro
                    </p>
                    <button
                      onClick={() => handleTestNotification('streak_at_risk')}
                      className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Enviar
                    </button>
                  </div>

                  {/* Achievement Common */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Logro Común
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Celebración de logro común
                    </p>
                    <button
                      onClick={() => handleTestNotification('achievement_common')}
                      className="w-full px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Enviar
                    </button>
                  </div>

                  {/* Achievement Rare */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Trophy className="w-5 h-5 text-purple-500" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Logro Raro
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Celebración de logro raro
                    </p>
                    <button
                      onClick={() => handleTestNotification('achievement_rare')}
                      className="w-full px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Enviar
                    </button>
                  </div>

                  {/* Level Up */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <BarChart3 className="w-5 h-5 text-green-500" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Subida de Nivel
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Celebración de nuevo nivel
                    </p>
                    <button
                      onClick={() => handleTestNotification('level_up')}
                      className="w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Enviar
                    </button>
                  </div>

                  {/* Streak At Risk Urgent */}
                  <div className="p-4 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center space-x-2 mb-3">
                      <Flame className="w-5 h-5 text-red-700" />
                      <h4 className="font-medium text-red-900 dark:text-red-300">
                        Racha Urgente
                      </h4>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                      Notificación urgente de racha (15 días, 2h restantes)
                    </p>
                    <button
                      onClick={() => handleTestNotification('streak_at_risk_urgent')}
                      className="w-full px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
                    >
                      Enviar Urgente
                    </button>
                  </div>

                  {/* Streak Milestone */}
                  <div className="p-4 border border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center space-x-2 mb-3">
                      <Trophy className="w-5 h-5 text-blue-700" />
                      <h4 className="font-medium text-blue-900 dark:text-blue-300">
                        Hito Próximo
                      </h4>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                      Notificación de hito próximo (27→30 días)
                    </p>
                    <button
                      onClick={() => handleTestNotification('streak_milestone')}
                      className="w-full px-3 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                    >
                      Enviar Hito
                    </button>
                  </div>

                  {/* Test Basic */}
                  <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Send className="w-5 h-5 text-gray-600" />
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Prueba Básica
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Notificación de prueba del sistema
                    </p>
                    <button
                      onClick={() => handleTestNotification('test_basic')}
                      className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Probar Sistema
                    </button>
                  </div>
                </div>

                {/* Enhanced Features Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Funciones Avanzadas
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Do Not Disturb Toggle */}
                    <div className="p-4 border border-orange-300 dark:border-orange-700 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <div className="flex items-center space-x-2 mb-3">
                        <Bell className="w-5 h-5 text-orange-700" />
                        <h4 className="font-medium text-orange-900 dark:text-orange-300">
                          Modo No Molestar
                        </h4>
                      </div>
                      <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">
                        Alternar modo no molestar (30 min)
                      </p>
                      <button
                        onClick={handleDoNotDisturbTest}
                        className="w-full px-3 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition-colors"
                      >
                        Alternar DND
                      </button>
                    </div>

                    {/* Streak Monitoring */}
                    <div className="p-4 border border-purple-300 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <div className="flex items-center space-x-2 mb-3">
                        <BarChart3 className="w-5 h-5 text-purple-700" />
                        <h4 className="font-medium text-purple-900 dark:text-purple-300">
                          Monitoreo de Racha
                        </h4>
                      </div>
                      <p className="text-sm text-purple-700 dark:text-purple-400 mb-3">
                        Configurar monitoreo automático de racha
                      </p>
                      <button
                        onClick={handleStreakMonitoringTest}
                        className="w-full px-3 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
                      >
                        Configurar Monitoreo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Resultados de Pruebas
                    </h3>
                    <button
                      onClick={clearTestResults}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Limpiar
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          result.success 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{result.type}:</span>
                          <span>{result.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Total Enviadas
                    </h3>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalSent}</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Total Clickeadas
                    </h3>
                    <p className="text-3xl font-bold text-green-600">{stats.totalClicked}</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Tasa de Click
                    </h3>
                    <p className="text-3xl font-bold text-purple-600">{stats.clickRate.toFixed(1)}%</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Total Descartadas
                    </h3>
                    <p className="text-3xl font-bold text-red-600">{stats.totalDismissed}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay estadísticas disponibles
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Las estadísticas aparecerán después de enviar algunas notificaciones
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Debug Panel */}
      <div className="fixed bottom-4 right-4">
        <details className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            Debug Info
          </summary>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs space-y-2 max-w-xs">
            <div>
              <strong>Permission:</strong> {permission.granted ? 'Granted' : permission.denied ? 'Denied' : 'Default'}
            </div>
            <div>
              <strong>Settings Enabled:</strong> {settings?.enabled ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Total Notifications:</strong> {notifications.length}
            </div>
            <div>
              <strong>Unread Count:</strong> {unreadCount}
            </div>
            <div>
              <strong>Workout Reminders:</strong> {settings?.workoutReminders ? 'On' : 'Off'}
            </div>
            <div>
              <strong>Achievement Celebrations:</strong> {settings?.achievementCelebrations ? 'On' : 'Off'}
            </div>
            <div>
              <strong>Quiet Hours:</strong> {settings?.quietHours.enabled ? `${settings.quietHours.startTime}-${settings.quietHours.endTime}` : 'Off'}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default NotificationTestPage;