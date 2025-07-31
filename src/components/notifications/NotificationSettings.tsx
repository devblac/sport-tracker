/**
 * Notification Settings Component
 * 
 * Allows users to configure their notification preferences.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Clock, 
  Trophy, 
  Flame, 
  Users, 
  BarChart3,
  Moon,
  Settings,
  Check,
  X
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationSettingsProps {
  userId: string;
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  userId,
  className = ''
}) => {
  const {
    permission,
    requestPermission,
    settings,
    updateSettings,
    isUpdatingSettings
  } = useNotifications(userId);

  const [showTimePickerFor, setShowTimePickerFor] = useState<'start' | 'end' | null>(null);

  const handleToggleSetting = async (key: keyof typeof settings, value: boolean) => {
    if (!settings) return;
    
    await updateSettings({
      [key]: value
    });
  };

  const handleQuietHoursToggle = async (enabled: boolean) => {
    if (!settings) return;
    
    await updateSettings({
      quietHours: {
        ...settings.quietHours,
        enabled
      }
    });
  };

  const handleQuietHoursTimeChange = async (type: 'start' | 'end', time: string) => {
    if (!settings) return;
    
    await updateSettings({
      quietHours: {
        ...settings.quietHours,
        [type === 'start' ? 'startTime' : 'endTime']: time
      }
    });
    
    setShowTimePickerFor(null);
  };

  const handleFrequencyChange = async (
    type: keyof typeof settings.frequency,
    value: string
  ) => {
    if (!settings) return;
    
    await updateSettings({
      frequency: {
        ...settings.frequency,
        [type]: value
      }
    });
  };

  const getPermissionIcon = () => {
    if (permission.granted) return <Check className="w-5 h-5 text-green-500" />;
    if (permission.denied) return <X className="w-5 h-5 text-red-500" />;
    return <Bell className="w-5 h-5 text-gray-400" />;
  };

  const getPermissionText = () => {
    if (permission.granted) return 'Concedidos';
    if (permission.denied) return 'Denegados';
    return 'No solicitados';
  };

  const getPermissionColor = () => {
    if (permission.granted) return 'text-green-600 bg-green-50 border-green-200';
    if (permission.denied) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (!settings) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Permission Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Permisos de Notificación
          </h3>
          {getPermissionIcon()}
        </div>
        
        <div className={`p-3 rounded-lg border ${getPermissionColor()}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Estado: {getPermissionText()}</p>
              <p className="text-sm opacity-75 mt-1">
                {permission.granted 
                  ? 'Puedes recibir notificaciones push'
                  : permission.denied
                  ? 'Las notificaciones están bloqueadas en tu navegador'
                  : 'Haz clic para permitir notificaciones'
                }
              </p>
            </div>
            
            {!permission.granted && (
              <button
                onClick={requestPermission}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Permitir
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Configuración General
        </h3>

        <div className="space-y-4">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              {settings.enabled ? (
                <Bell className="w-5 h-5 text-blue-500" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Notificaciones Habilitadas
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Controla todas las notificaciones
                </p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleToggleSetting('enabled', e.target.checked)}
                disabled={isUpdatingSettings}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Individual Settings */}
          {settings.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              {/* Workout Reminders */}
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Recordatorios de Entrenamiento
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Te recordamos cuando es hora de entrenar
                    </p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.workoutReminders}
                    onChange={(e) => handleToggleSetting('workoutReminders', e.target.checked)}
                    disabled={isUpdatingSettings}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Achievement Celebrations */}
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Celebraciones de Logros
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notificaciones cuando desbloqueas logros
                    </p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.achievementCelebrations}
                    onChange={(e) => handleToggleSetting('achievementCelebrations', e.target.checked)}
                    disabled={isUpdatingSettings}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Streak Reminders */}
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Flame className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Recordatorios de Racha
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Alertas cuando tu racha está en riesgo
                    </p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.streakReminders}
                    onChange={(e) => handleToggleSetting('streakReminders', e.target.checked)}
                    disabled={isUpdatingSettings}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Social Updates */}
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Actualizaciones Sociales
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Actividad de tus gym buddies
                    </p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.socialUpdates}
                    onChange={(e) => handleToggleSetting('socialUpdates', e.target.checked)}
                    disabled={isUpdatingSettings}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Weekly Progress */}
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Progreso Semanal
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Resumen de tu semana de entrenamiento
                    </p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.weeklyProgress}
                    onChange={(e) => handleToggleSetting('weeklyProgress', e.target.checked)}
                    disabled={isUpdatingSettings}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quiet Hours */}
      {settings.enabled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Moon className="w-5 h-5 mr-2" />
            Horas de Silencio
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Activar Horas de Silencio
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No recibir notificaciones durante estas horas
                </p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.quietHours.enabled}
                  onChange={(e) => handleQuietHoursToggle(e.target.checked)}
                  disabled={isUpdatingSettings}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.quietHours.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={settings.quietHours.startTime}
                    onChange={(e) => handleQuietHoursTimeChange('start', e.target.value)}
                    disabled={isUpdatingSettings}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora de Fin
                  </label>
                  <input
                    type="time"
                    value={settings.quietHours.endTime}
                    onChange={(e) => handleQuietHoursTimeChange('end', e.target.value)}
                    disabled={isUpdatingSettings}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Frequency Settings */}
      {settings.enabled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Frecuencia de Notificaciones
          </h3>

          <div className="space-y-4">
            {/* Workout Reminders Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recordatorios de Entrenamiento
              </label>
              <select
                value={settings.frequency.workoutReminders}
                onChange={(e) => handleFrequencyChange('workoutReminders', e.target.value)}
                disabled={isUpdatingSettings || !settings.workoutReminders}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="never">Nunca</option>
                <option value="daily">Diario</option>
                <option value="workout_days">Solo días de entrenamiento</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {/* Achievement Celebrations Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Celebraciones de Logros
              </label>
              <select
                value={settings.frequency.achievementCelebrations}
                onChange={(e) => handleFrequencyChange('achievementCelebrations', e.target.value)}
                disabled={isUpdatingSettings || !settings.achievementCelebrations}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="immediate">Inmediato</option>
                <option value="daily_summary">Resumen diario</option>
                <option value="weekly_summary">Resumen semanal</option>
              </select>
            </div>

            {/* Streak Reminders Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recordatorios de Racha
              </label>
              <select
                value={settings.frequency.streakReminders}
                onChange={(e) => handleFrequencyChange('streakReminders', e.target.value)}
                disabled={isUpdatingSettings || !settings.streakReminders}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="never">Nunca</option>
                <option value="at_risk">Solo cuando está en riesgo</option>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isUpdatingSettings && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-gray-900 dark:text-white">Actualizando configuración...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;