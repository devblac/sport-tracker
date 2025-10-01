/**
 * Notification Settings Component
 * 
 * Allows users to configure their notification preferences.
 */

import React, { useState, useEffect } from 'react';
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
  X,
  Shield,
  ShieldOff,
  TestTube,
  Volume2,
  VolumeX,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/services/notificationService';

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
  const [doNotDisturbMode, setDoNotDisturbMode] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [notificationStats, setNotificationStats] = useState<any>(null);

  useEffect(() => {
    // Load do not disturb mode status
    setDoNotDisturbMode(notificationService.getDoNotDisturbMode());
    
    // Load notification stats
    setNotificationStats(notificationService.getNotificationStats());
  }, []);

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

  const handleDoNotDisturbToggle = (enabled: boolean, duration?: number) => {
    notificationService.setDoNotDisturbMode(enabled, duration);
    setDoNotDisturbMode(enabled);
  };

  const handleTestNotification = async () => {
    const success = await notificationService.testNotification();
    setTestNotificationSent(success);
    
    if (success) {
      setTimeout(() => setTestNotificationSent(false), 3000);
    }
  };

  const handleCustomScheduleChange = async (days: number[], times: string[]) => {
    if (!settings) return;
    
    await updateSettings({
      customSchedule: {
        days,
        times
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

      {/* Do Not Disturb Mode */}
      {settings.enabled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            {doNotDisturbMode ? (
              <ShieldOff className="w-5 h-5 mr-2 text-red-500" />
            ) : (
              <Shield className="w-5 h-5 mr-2 text-green-500" />
            )}
            Modo No Molestar
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                {doNotDisturbMode ? (
                  <VolumeX className="w-5 h-5 text-red-500" />
                ) : (
                  <Volume2 className="w-5 h-5 text-green-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {doNotDisturbMode ? 'Activado' : 'Desactivado'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {doNotDisturbMode 
                      ? 'Solo notificaciones urgentes (racha en riesgo)'
                      : 'Todas las notificaciones habilitadas'
                    }
                  </p>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={doNotDisturbMode}
                  onChange={(e) => handleDoNotDisturbToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
              </label>
            </div>

            {!doNotDisturbMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-3"
              >
                <button
                  onClick={() => handleDoNotDisturbToggle(true, 30)}
                  className="px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                >
                  30 minutos
                </button>
                <button
                  onClick={() => handleDoNotDisturbToggle(true, 60)}
                  className="px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                >
                  1 hora
                </button>
                <button
                  onClick={() => handleDoNotDisturbToggle(true, 120)}
                  className="px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                >
                  2 horas
                </button>
                <button
                  onClick={() => handleDoNotDisturbToggle(true)}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  Hasta desactivar
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Streak Risk Notifications */}
      {settings.enabled && settings.streakReminders && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Notificaciones de Racha en Riesgo
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    Notificaciones Urgentes
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Las notificaciones de racha en riesgo tienen prioridad urgente y se muestran 
                    incluso durante horas de silencio y modo no molestar.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white">Alertas Tempranas</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">6 horas antes del límite</p>
              </div>
              <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white">Alertas Urgentes</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">2 horas antes del límite</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Notifications */}
      {settings.enabled && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TestTube className="w-5 h-5 mr-2" />
            Probar Notificaciones
          </h3>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Envía una notificación de prueba para verificar que todo funciona correctamente.
            </p>
            
            <button
              onClick={handleTestNotification}
              disabled={!permission.granted}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                testNotificationSent
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : permission.granted
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {testNotificationSent ? (
                <span className="flex items-center justify-center">
                  <Check className="w-4 h-4 mr-2" />
                  ¡Notificación enviada!
                </span>
              ) : (
                'Enviar Notificación de Prueba'
              )}
            </button>

            {!permission.granted && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Necesitas permitir notificaciones primero
              </p>
            )}
          </div>
        </div>
      )}

      {/* Notification Statistics */}
      {notificationStats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Estadísticas de Notificaciones
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Object.values(notificationStats.sent).reduce((a: number, b: number) => a + b, 0)}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Enviadas</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Object.values(notificationStats.clicked).reduce((a: number, b: number) => a + b, 0)}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">Clickeadas</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {Object.values(notificationStats.dismissed).reduce((a: number, b: number) => a + b, 0)}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">Descartadas</p>
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