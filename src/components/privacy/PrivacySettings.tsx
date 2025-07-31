/**
 * Privacy Settings Component
 * 
 * Comprehensive privacy settings interface for users to control their visibility and content sharing.
 */

import React, { useState } from 'react';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Users, 
  Globe, 
  Lock,
  Bell,
  Search,
  MessageCircle,
  UserPlus,
  Settings,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { usePrivacy } from '@/hooks/usePrivacy';

import type { VisibilityLevel } from '@/types/privacy';

interface PrivacySettingsProps {
  userId: string;
  className?: string;
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  userId,
  className = ''
}) => {
  const {
    privacySettings,
    updatePrivacySettings,
    resetPrivacySettings,
    privacySummary,
    isLoading,
    error
  } = usePrivacy(userId);

  const [activeSection, setActiveSection] = useState<'profile' | 'content' | 'social' | 'notifications'>('profile');
  const [isResetting, setIsResetting] = useState(false);

  const handleVisibilityChange = async (field: string, value: VisibilityLevel) => {
    if (!privacySettings) return;
    
    try {
      await updatePrivacySettings({ [field]: value });
    } catch (error) {
      console.error('Failed to update visibility setting:', error);
    }
  };

  const handleBooleanChange = async (field: string, value: boolean) => {
    if (!privacySettings) return;
    
    try {
      await updatePrivacySettings({ [field]: value });
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm('¿Estás seguro de que quieres restablecer todas las configuraciones de privacidad a los valores predeterminados?')) {
      return;
    }

    try {
      setIsResetting(true);
      await resetPrivacySettings();
    } catch (error) {
      console.error('Failed to reset privacy settings:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const getVisibilityIcon = (level: VisibilityLevel) => {
    switch (level) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'friends':
        return <Users className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
    }
  };

  const getVisibilityColor = (level: VisibilityLevel) => {
    switch (level) {
      case 'public':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'friends':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'private':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
    }
  };

  const VisibilitySelector: React.FC<{
    label: string;
    description: string;
    value: VisibilityLevel;
    onChange: (value: VisibilityLevel) => void;
  }> = ({ label, description, value, onChange }) => (
    <div className="space-y-3">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      
      <div className="flex space-x-2">
        {(['public', 'friends', 'private'] as VisibilityLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => onChange(level)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors text-sm
              ${value === level
                ? `${getVisibilityColor(level)} border-current`
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
              }
            `}
          >
            {getVisibilityIcon(level)}
            <span className="capitalize">
              {level === 'public' ? 'Público' : level === 'friends' ? 'Amigos' : 'Privado'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const ToggleSwitch: React.FC<{
    label: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
  }> = ({ label, description, value, onChange }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!privacySettings) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          No se pudieron cargar las configuraciones de privacidad
        </p>
      </div>
    );
  }

  const sections = [
    { id: 'profile', label: 'Perfil', icon: Users },
    { id: 'content', label: 'Contenido', icon: Eye },
    { id: 'social', label: 'Social', icon: MessageCircle },
    { id: 'notifications', label: 'Notificaciones', icon: Bell }
  ] as const;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Configuración de Privacidad
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Controla quién puede ver tu información y contenido
            </p>
          </div>
        </div>

        <button
          onClick={handleResetSettings}
          disabled={isResetting}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Restablecer</span>
        </button>
      </div>

      {/* Privacy Summary */}
      {privacySummary && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-200">
                {privacySummary.blockedUsersCount} usuarios bloqueados
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-800 dark:text-blue-200">
                {privacySummary.reportsCount} reportes enviados
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Section Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2
                  ${activeSection === section.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        {activeSection === 'profile' && (
          <div className="space-y-6">
            <VisibilitySelector
              label="Visibilidad del Perfil"
              description="Controla quién puede ver tu perfil completo"
              value={privacySettings.profileVisibility}
              onChange={(value) => handleVisibilityChange('profileVisibility', value)}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Información del Perfil
              </h3>
              
              <ToggleSwitch
                label="Mostrar nombre real"
                description="Permite que otros vean tu nombre completo"
                value={privacySettings.showRealName}
                onChange={(value) => handleBooleanChange('showRealName', value)}
              />

              <ToggleSwitch
                label="Mostrar edad"
                description="Permite que otros vean tu edad"
                value={privacySettings.showAge}
                onChange={(value) => handleBooleanChange('showAge', value)}
              />

              <ToggleSwitch
                label="Mostrar ubicación"
                description="Permite que otros vean tu ubicación"
                value={privacySettings.showLocation}
                onChange={(value) => handleBooleanChange('showLocation', value)}
              />

              <ToggleSwitch
                label="Mostrar fecha de registro"
                description="Permite que otros vean cuándo te uniste"
                value={privacySettings.showJoinDate}
                onChange={(value) => handleBooleanChange('showJoinDate', value)}
              />
            </div>
          </div>
        )}

        {activeSection === 'content' && (
          <div className="space-y-6">
            <VisibilitySelector
              label="Entrenamientos"
              description="Controla quién puede ver tus entrenamientos completados"
              value={privacySettings.workoutVisibility}
              onChange={(value) => handleVisibilityChange('workoutVisibility', value)}
            />

            <VisibilitySelector
              label="Logros"
              description="Controla quién puede ver tus achievements desbloqueados"
              value={privacySettings.achievementVisibility}
              onChange={(value) => handleVisibilityChange('achievementVisibility', value)}
            />

            <VisibilitySelector
              label="Estadísticas"
              description="Controla quién puede ver tus estadísticas de progreso"
              value={privacySettings.statsVisibility}
              onChange={(value) => handleVisibilityChange('statsVisibility', value)}
            />

            <VisibilitySelector
              label="Actividad"
              description="Controla quién puede ver tu actividad en el feed social"
              value={privacySettings.activityVisibility}
              onChange={(value) => handleVisibilityChange('activityVisibility', value)}
            />
          </div>
        )}

        {activeSection === 'social' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Interacciones Sociales
              </h3>

              <ToggleSwitch
                label="Permitir solicitudes de amistad"
                description="Otros usuarios pueden enviarte solicitudes de amistad"
                value={privacySettings.allowFriendRequests}
                onChange={(value) => handleBooleanChange('allowFriendRequests', value)}
              />

              <ToggleSwitch
                label="Permitir mensajes"
                description="Otros usuarios pueden enviarte mensajes directos"
                value={privacySettings.allowMessages}
                onChange={(value) => handleBooleanChange('allowMessages', value)}
              />

              <ToggleSwitch
                label="Aparecer en búsquedas"
                description="Tu perfil aparecerá en los resultados de búsqueda"
                value={privacySettings.showInSearch}
                onChange={(value) => handleBooleanChange('showInSearch', value)}
              />

              <ToggleSwitch
                label="Mostrar estado en línea"
                description="Otros pueden ver cuando estás activo en la app"
                value={privacySettings.showOnlineStatus}
                onChange={(value) => handleBooleanChange('showOnlineStatus', value)}
              />
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Notificaciones Sociales
              </h3>

              <ToggleSwitch
                label="Solicitudes de amistad"
                description="Recibir notificaciones de nuevas solicitudes de amistad"
                value={privacySettings.notifyOnFriendRequest}
                onChange={(value) => handleBooleanChange('notifyOnFriendRequest', value)}
              />

              <ToggleSwitch
                label="Comentarios"
                description="Recibir notificaciones cuando comenten tu contenido"
                value={privacySettings.notifyOnComment}
                onChange={(value) => handleBooleanChange('notifyOnComment', value)}
              />

              <ToggleSwitch
                label="Me gusta"
                description="Recibir notificaciones cuando den like a tu contenido"
                value={privacySettings.notifyOnLike}
                onChange={(value) => handleBooleanChange('notifyOnLike', value)}
              />

              <ToggleSwitch
                label="Menciones"
                description="Recibir notificaciones cuando te mencionen"
                value={privacySettings.notifyOnMention}
                onChange={(value) => handleBooleanChange('notifyOnMention', value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacySettings;