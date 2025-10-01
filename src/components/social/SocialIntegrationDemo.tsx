/**
 * Social Integration Demo Component
 * 
 * Demonstrates the integrated social features with real-time updates.
 */

import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  Bell, 
  Activity,
  Settings,
  RefreshCw
} from 'lucide-react';
import { SocialFeedIntegrated } from './SocialFeedIntegrated';
import { FriendsManagerIntegrated } from './FriendsManagerIntegrated';
import { RealTimeNotifications } from './RealTimeNotifications';
import { RealTimeActivityFeed } from './RealTimeActivityFeed';
import { useAuthStore } from '@/stores/useAuthStore';

interface SocialIntegrationDemoProps {
  className?: string;
}

export const SocialIntegrationDemo: React.FC<SocialIntegrationDemoProps> = ({
  className = ''
}) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'activity'>('feed');

  if (!user) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Inicia sesión para acceder a las funciones sociales
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Conecta con otros usuarios y comparte tu progreso
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Notifications */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Social Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Conecta, comparte y motívate con la comunidad
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <RealTimeNotifications />
          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'feed'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>Feed Social</span>
        </button>
        
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'friends'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Gym Buddies</span>
        </button>
        
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'activity'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span>Actividad</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {activeTab === 'feed' && (
            <SocialFeedIntegrated showCreatePost={true} />
          )}
          
          {activeTab === 'friends' && (
            <FriendsManagerIntegrated />
          )}
          
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <RealTimeActivityFeed maxItems={15} autoScroll={true} />
              
              {/* Activity Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Estadísticas de Actividad
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">12</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Posts hoy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">8</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Amigos activos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">24</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Interacciones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">5</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Logros nuevos</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tu Actividad Social
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Gym Buddies</span>
                <span className="font-semibold text-gray-900 dark:text-white">15</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Posts este mes</span>
                <span className="font-semibold text-gray-900 dark:text-white">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Likes recibidos</span>
                <span className="font-semibold text-gray-900 dark:text-white">42</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Comentarios</span>
                <span className="font-semibold text-gray-900 dark:text-white">18</span>
              </div>
            </div>
          </div>

          {/* Real-time Activity Sidebar */}
          {activeTab !== 'activity' && (
            <RealTimeActivityFeed maxItems={5} autoScroll={false} />
          )}

          {/* Connection Status */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-800 dark:text-green-400 font-medium">
                Conectado en tiempo real
              </span>
            </div>
            <p className="text-green-700 dark:text-green-300 text-sm mt-1">
              Recibiendo actualizaciones automáticamente
            </p>
          </div>

          {/* Feature Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Estado de Funciones
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Feed Social</span>
                <span className="text-green-600 dark:text-green-400">✓ Activo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amigos</span>
                <span className="text-green-600 dark:text-green-400">✓ Activo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Notificaciones</span>
                <span className="text-green-600 dark:text-green-400">✓ Activo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tiempo Real</span>
                <span className="text-green-600 dark:text-green-400">✓ Activo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Debug Info (Development)
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div>Usuario: {user.displayName} ({user.id})</div>
            <div>Tab Activa: {activeTab}</div>
            <div>Servicios: RealSocialService integrado con Supabase</div>
            <div>Estado: Conectado y funcionando</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialIntegrationDemo;