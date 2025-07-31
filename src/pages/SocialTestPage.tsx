/**
 * Social Test Page
 * 
 * Test page for demonstrating the social system and friend management components.
 */

import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Settings,
  BarChart3,
  Bell
} from 'lucide-react';
import { useSocial } from '@/hooks/useSocial';
// import { FriendSearch } from '@/components/social/FriendSearch';
// import { FriendRequestList } from '@/components/social/FriendRequestList';
import { GymFriendsList } from '@/components/social/GymFriendsList';

const TEST_USER_ID = 'test-user-social';

export const SocialTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'search' | 'requests' | 'settings'>('friends');

  const {
    userProfile,
    friends,
    friendRequests,
    friendshipStats,
    friendSuggestions,
    unreadNotifications,
    isLoading
  } = useSocial(TEST_USER_ID);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando sistema social...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'friends',
      label: 'Mis Amigos',
      icon: Users,
      count: friendshipStats?.totalFriends || 0
    },
    {
      id: 'search',
      label: 'Buscar',
      icon: Search,
      count: friendSuggestions.length
    },
    {
      id: 'requests',
      label: 'Solicitudes',
      icon: UserPlus,
      count: friendRequests.filter(r => r.status === 'pending').length
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      count: null
    }
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
                  Sistema Social
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Gestión de amigos y conexiones sociales
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {friendshipStats?.totalFriends || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Amigos
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {friendshipStats?.onlineFriends || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    En línea
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {friendSuggestions.length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Sugerencias
                  </div>
                </div>

                {unreadNotifications > 0 && (
                  <div className="relative">
                    <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications}
                    </div>
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
        <div key={activeTab}>
          {activeTab === 'friends' && (
            <GymFriendsList
              userId={TEST_USER_ID}
              showActivityFeed={true}
              onFriendSelect={(friend) => {
                console.log('Selected friend:', friend);
              }}
            />
          )}

          {activeTab === 'search' && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Search component temporarily disabled</p>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Requests component temporarily disabled</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Privacy Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Configuración de Privacidad
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Visibilidad del perfil
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Controla quién puede ver tu perfil
                      </p>
                    </div>
                    <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="public">Público</option>
                      <option value="friends">Solo amigos</option>
                      <option value="private">Privado</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Permitir solicitudes de amistad
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Otros usuarios pueden enviarte solicitudes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Mostrar en búsquedas
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Aparecer en los resultados de búsqueda
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Friendship Stats */}
              {friendshipStats && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Estadísticas de Amistad
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{friendshipStats.totalFriends}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Amigos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{friendshipStats.onlineFriends}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">En Línea</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{friendshipStats.recentlyActive}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Activos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{Math.round(friendshipStats.connectionStrengthAverage)}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Conexión Promedio</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      <div className="fixed bottom-4 right-4">
        <details className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            Debug Info
          </summary>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs space-y-2 max-w-xs">
            <div>
              <strong>User Profile:</strong> {userProfile?.displayName || 'Loading...'}
            </div>
            <div>
              <strong>Total Friends:</strong> {friends.length}
            </div>
            <div>
              <strong>Friend Requests:</strong> {friendRequests.length}
            </div>
            <div>
              <strong>Friend Suggestions:</strong> {friendSuggestions.length}
            </div>
            <div>
              <strong>Unread Notifications:</strong> {unreadNotifications}
            </div>
            <div>
              <strong>Online Friends:</strong> {friendshipStats?.onlineFriends || 0}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default SocialTestPage;