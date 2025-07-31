/**
 * Social Posts Test Page
 * 
 * Test page for demonstrating the social posts system functionality.
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  Trophy, 
  Target, 
  Flame, 
  ArrowUp,
  MessageSquare,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { SocialPostComponent } from '@/components/social/SocialPost';

import type { PostType, PostData } from '@/types/socialPosts';

const TEST_USER_ID = 'test-user-posts';

export const SocialPostsTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'create' | 'stats'>('feed');
  const [selectedPostType, setSelectedPostType] = useState<PostType>('manual_post');
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');

  const {
    userPosts,
    createPost,
    generatePostFromActivity,
    userPostSummary,
    isLoading,
    error,
    refreshFeed
  } = useSocialPosts(TEST_USER_ID);

  // Mock author data
  const mockAuthor = {
    id: TEST_USER_ID,
    displayName: 'Usuario de Prueba',
    username: 'test_user',
    avatar: undefined,
    currentLevel: 15
  };

  // Generate sample activity posts
  const generateSamplePosts = async () => {
    const sampleActivities = [
      {
        type: 'workout_completed' as PostType,
        userId: TEST_USER_ID,
        data: {
          type: 'workout_completed' as const,
          workoutId: 'workout_123',
          workoutName: 'Push Day Intenso',
          duration: 75,
          exerciseCount: 6,
          totalVolume: 2450,
          personalRecords: ['Bench Press', 'Overhead Press']
        },
        shouldCreatePost: true
      },
      {
        type: 'achievement_unlocked' as PostType,
        userId: TEST_USER_ID,
        data: {
          type: 'achievement_unlocked' as const,
          achievementId: 'first_100_workouts',
          achievementName: 'Centurión',
          achievementDescription: 'Completa 100 entrenamientos',
          achievementIcon: '🏆',
          rarity: 'epic' as const
        },
        shouldCreatePost: true
      },
      {
        type: 'personal_record' as PostType,
        userId: TEST_USER_ID,
        data: {
          type: 'personal_record' as const,
          exerciseId: 'bench_press',
          exerciseName: 'Bench Press',
          recordType: '1rm' as const,
          previousValue: 100,
          newValue: 105,
          improvement: 5
        },
        shouldCreatePost: true
      },
      {
        type: 'streak_milestone' as PostType,
        userId: TEST_USER_ID,
        data: {
          type: 'streak_milestone' as const,
          streakDays: 30,
          streakType: 'workout' as const,
          milestoneType: 'monthly' as const
        },
        shouldCreatePost: true
      },
      {
        type: 'level_up' as PostType,
        userId: TEST_USER_ID,
        data: {
          type: 'level_up' as const,
          previousLevel: 14,
          newLevel: 15,
          totalXP: 15000,
          xpGained: 500
        },
        shouldCreatePost: true
      }
    ];

    for (const activity of sampleActivities) {
      try {
        await generatePostFromActivity(activity);
      } catch (error) {
        console.warn('Failed to generate sample post:', error);
      }
    }
  };

  const handleCreateManualPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postTitle.trim()) return;

    try {
      const postData: PostData = {
        type: 'manual_post',
        content: postDescription.trim() || postTitle.trim(),
        tags: [],
        mentions: []
      };

      await createPost(
        selectedPostType,
        postData,
        'friends',
        postTitle.trim(),
        postDescription.trim() || undefined
      );

      setPostTitle('');
      setPostDescription('');
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const postTypeOptions = [
    { value: 'manual_post', label: 'Post Manual', icon: MessageSquare },
    { value: 'workout_completed', label: 'Entrenamiento', icon: TrendingUp },
    { value: 'achievement_unlocked', label: 'Logro', icon: Trophy },
    { value: 'personal_record', label: 'Récord Personal', icon: Target },
    { value: 'streak_milestone', label: 'Racha', icon: Flame },
    { value: 'level_up', label: 'Subida de Nivel', icon: ArrowUp }
  ];

  const tabs = [
    { id: 'feed', label: 'Feed', icon: TrendingUp },
    { id: 'create', label: 'Crear Post', icon: Plus },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 }
  ] as const;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando sistema de posts...</p>
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
                <MessageSquare className="w-8 h-8 text-blue-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Sistema de Posts Sociales
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Crea y gestiona posts sociales con likes y comentarios
                  </p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={generateSamplePosts}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Generar Posts de Ejemplo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {userPostSummary && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Posts Totales</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{userPostSummary.totalPosts}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Likes Totales</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{userPostSummary.totalLikes}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Comentarios</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{userPostSummary.totalComments}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Más Populares</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {Object.entries(userPostSummary.postsByType)
                      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Mis Posts ({userPosts.length})
              </h2>
              <button
                onClick={refreshFeed}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualizar</span>
              </button>
            </div>

            {userPosts.length > 0 ? (
              <div className="space-y-6">
                {userPosts.map((post) => (
                  <SocialPostComponent
                    key={post.id}
                    post={post}
                    currentUserId={TEST_USER_ID}
                    author={mockAuthor}
                    onEdit={(post) => console.log('Edit post:', post)}
                    onShare={(post) => console.log('Share post:', post)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay posts aún
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Crea tu primer post o genera algunos de ejemplo
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Post
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Crear Nuevo Post
              </h2>

              <form onSubmit={handleCreateManualPost} className="space-y-6">
                {/* Post Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Tipo de Post
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {postTypeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedPostType(option.value as PostType)}
                          className={`
                            flex items-center space-x-2 p-3 rounded-lg border transition-colors
                            ${selectedPostType === option.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Post Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Título del Post
                  </label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="¿Qué quieres compartir?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Post Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={postDescription}
                    onChange={(e) => setPostDescription(e.target.value)}
                    placeholder="Añade más detalles..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!postTitle.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Publicar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'stats' && userPostSummary && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Estadísticas de Posts
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Posts by Type */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Posts por Tipo
                </h3>
                <div className="space-y-3">
                  {Object.entries(userPostSummary.postsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engagement Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Engagement
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Likes promedio
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userPostSummary.totalPosts > 0 
                        ? Math.round(userPostSummary.totalLikes / userPostSummary.totalPosts * 10) / 10
                        : 0
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Comentarios promedio
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userPostSummary.totalPosts > 0 
                        ? Math.round(userPostSummary.totalComments / userPostSummary.totalPosts * 10) / 10
                        : 0
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Resumen de Actividad
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Posts totales
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userPostSummary.totalPosts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Interacciones totales
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {userPostSummary.totalLikes + userPostSummary.totalComments}
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

export default SocialPostsTestPage;