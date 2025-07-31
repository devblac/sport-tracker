/**
 * Social Feed Test Page
 * 
 * Test page for demonstrating the SocialFeed component with infinite scroll and filtering.
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Plus, 
  RefreshCw,
  BarChart3,
  Settings
} from 'lucide-react';
import { SocialFeed } from '@/components/social/SocialFeed';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { useSocial } from '@/hooks/useSocial';

const TEST_USER_ID = 'test-user-feed';

export const SocialFeedTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'stats'>('feed');
  const [isGeneratingData, setIsGeneratingData] = useState(false);

  const {
    friends,
    friendRequests,
    friendshipStats,
    isLoading: socialLoading
  } = useSocial(TEST_USER_ID);

  const {
    generatePostFromActivity,
    userPostSummary
  } = useSocialPosts(TEST_USER_ID);

  // Generate sample friends and posts for testing
  const generateSampleData = async () => {
    try {
      setIsGeneratingData(true);

      // Generate sample friend activities
      const sampleActivities = [
        {
          type: 'workout_completed' as const,
          userId: 'friend-1',
          data: {
            type: 'workout_completed' as const,
            workoutId: 'workout-friend-1',
            workoutName: 'Leg Day Intenso',
            duration: 90,
            exerciseCount: 8,
            totalVolume: 3200,
            personalRecords: ['Squat', 'Romanian Deadlift']
          },
          shouldCreatePost: true
        },
        {
          type: 'achievement_unlocked' as const,
          userId: 'friend-2',
          data: {
            type: 'achievement_unlocked' as const,
            achievementId: 'consistency_master',
            achievementName: 'Maestro de la Consistencia',
            achievementDescription: 'Entrena 30 días seguidos',
            achievementIcon: '🏆',
            rarity: 'legendary' as const
          },
          shouldCreatePost: true
        },
        {
          type: 'personal_record' as const,
          userId: 'friend-3',
          data: {
            type: 'personal_record' as const,
            exerciseId: 'deadlift',
            exerciseName: 'Deadlift',
            recordType: '1rm' as const,
            previousValue: 140,
            newValue: 150,
            improvement: 7.1
          },
          shouldCreatePost: true
        },
        {
          type: 'streak_milestone' as const,
          userId: 'friend-1',
          data: {
            type: 'streak_milestone' as const,
            streakDays: 50,
            streakType: 'workout' as const,
            milestoneType: 'milestone' as const
          },
          shouldCreatePost: true
        },
        {
          type: 'level_up' as const,
          userId: 'friend-2',
          data: {
            type: 'level_up' as const,
            previousLevel: 19,
            newLevel: 20,
            totalXP: 20000,
            xpGained: 750
          },
          shouldCreatePost: true
        },
        {
          type: 'workout_completed' as const,
          userId: 'friend-3',
          data: {
            type: 'workout_completed' as const,
            workoutId: 'workout-friend-3',
            workoutName: 'Upper Body Power',
            duration: 75,
            exerciseCount: 6,
            totalVolume: 2800,
            personalRecords: ['Bench Press']
          },
          shouldCreatePost: true
        }
      ];

      // Generate posts with some time variation
      for (let i = 0; i < sampleActivities.length; i++) {
        const activity = sampleActivities[i];
        
        // Add some delay to simulate different post times
        setTimeout(async () => {
          try {
            await generatePostFromActivity(activity);
          } catch (error) {
            console.warn('Failed to generate sample post:', error);
          }
        }, i * 500);
      }

      setTimeout(() => {
        setIsGeneratingData(false);
      }, sampleActivities.length * 500 + 1000);

    } catch (error) {
      console.error('Failed to generate sample data:', error);
      setIsGeneratingData(false);
    }
  };

  const tabs = [
    { id: 'feed', label: 'Feed Social', icon: TrendingUp },
    { id: 'friends', label: 'Amigos', icon: Users },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 }
  ] as const;

  if (socialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando sistema social...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <TrendingUp className="w-8 h-8 text-blue-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Feed Social
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Feed infinito con paginación y filtros
                  </p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={generateSampleData}
                  disabled={isGeneratingData}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isGeneratingData ? 'Generando...' : 'Generar Posts de Ejemplo'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Amigos</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {friendshipStats?.totalFriends || 0} total
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">En Línea</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {friendshipStats?.onlineFriends || 0} activos
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Solicitudes</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {friendRequests.filter(r => r.status === 'pending').length} pendientes
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Posts</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {userPostSummary?.totalPosts || 0} creados
                </p>
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
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'feed' && (
          <SocialFeed 
            userId={TEST_USER_ID}
            pageSize={5}
            showFilters={true}
          />
        )}

        {activeTab === 'friends' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Gestión de Amigos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Friends List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Amigos ({friends.length})
                </h3>
                
                {friends.length > 0 ? (
                  <div className="space-y-3">
                    {friends.slice(0, 5).map((friend) => (
                      <div key={friend.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {friend.friend.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {friend.friend.displayName}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            @{friend.friend.username}
                          </p>
                        </div>
                        <div className="ml-auto">
                          {friend.friend.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    No tienes amigos aún
                  </p>
                )}
              </div>

              {/* Friend Requests */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Solicitudes Pendientes ({friendRequests.filter(r => r.status === 'pending').length})
                </h3>
                
                {friendRequests.filter(r => r.status === 'pending').length > 0 ? (
                  <div className="space-y-3">
                    {friendRequests
                      .filter(r => r.status === 'pending')
                      .slice(0, 5)
                      .map((request) => (
                        <div key={request.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              U
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                Usuario {request.senderId.slice(-4)}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Solicitud pendiente
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    No hay solicitudes pendientes
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Estadísticas del Feed
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Engagement Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Engagement
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Posts totales</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userPostSummary?.totalPosts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Likes recibidos</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userPostSummary?.totalLikes || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Comentarios</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userPostSummary?.totalComments || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Friend Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Red Social
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amigos totales</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {friendshipStats?.totalFriends || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amigos activos</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {friendshipStats?.onlineFriends || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Conexión promedio</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.round(friendshipStats?.connectionStrengthAverage || 0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Actividad
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Posts hoy</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      0
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Interacciones</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {(userPostSummary?.totalLikes || 0) + (userPostSummary?.totalComments || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Engagement rate</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userPostSummary?.totalPosts ? 
                        Math.round(((userPostSummary.totalLikes + userPostSummary.totalComments) / userPostSummary.totalPosts) * 100) / 100 
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialFeedTestPage;