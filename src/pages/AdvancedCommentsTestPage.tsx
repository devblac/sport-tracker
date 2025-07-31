/**
 * Advanced Comments Test Page
 * 
 * Test page for demonstrating the advanced comments system with nested replies, likes, and mentions.
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Heart, Users, TrendingUp, LogIn, LogOut } from 'lucide-react';
import { AdvancedCommentsSection } from '@/components/social/AdvancedCommentsSection';
import { useAdvancedComments } from '@/hooks/useAdvancedComments';
import { supabase, authHelpers } from '@/lib/supabase';

export const AdvancedCommentsTestPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<string>('post_1');
  const [isLoading, setIsLoading] = useState(true);
  const { commentStats, loadCommentStats } = useAdvancedComments(user?.id || '');

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mock posts for testing
  const mockPosts = [
    {
      id: 'post_1',
      title: 'Nuevo PR en Deadlift! 💪',
      content: 'Acabo de lograr un nuevo récord personal en peso muerto: 180kg! Después de meses de entrenamiento constante, finalmente pude superar mi marca anterior. ¡La consistencia realmente paga!',
      author: 'FitnessWarrior',
      timestamp: '2 horas',
      likes: 24,
      initialComments: 8
    },
    {
      id: 'post_2', 
      title: 'Rutina de Piernas Intensa 🔥',
      content: 'Hoy fue día de piernas y no pude caminar después del gym 😅. Sentadillas, peso muerto rumano, extensiones y curl de piernas. ¿Cuál es su ejercicio favorito para piernas?',
      author: 'LegDayLover',
      timestamp: '4 horas',
      likes: 18,
      initialComments: 12
    },
    {
      id: 'post_3',
      title: 'Consejos para Principiantes',
      content: 'Para todos los que están empezando en el gym: la forma es más importante que el peso. Mejor hacer menos peso con buena técnica que mucho peso con mala forma. ¡Su cuerpo se los agradecerá!',
      author: 'GymMentor',
      timestamp: '6 horas',
      likes: 45,
      initialComments: 23
    }
  ];

  // Handle authentication
  const handleSignIn = async () => {
    try {
      // For demo purposes, create a test user
      const testEmail = `test_${Date.now()}@example.com`;
      const testPassword = 'testpassword123';
      
      await authHelpers.signUp(testEmail, testPassword, {
        display_name: 'Test User',
        username: `testuser_${Date.now()}`
      });
      
      // Sign in immediately after signup
      await authHelpers.signIn(testEmail, testPassword);
    } catch (error) {
      console.error('Auth error:', error);
      // If signup fails (user exists), try to sign in
      try {
        await authHelpers.signIn('test@example.com', 'testpassword123');
      } catch (signInError) {
        console.error('Sign in error:', signInError);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await authHelpers.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Load stats when post changes
  useEffect(() => {
    if (selectedPost) {
      loadCommentStats(selectedPost);
    }
  }, [selectedPost, loadCommentStats]);

  const selectedPostData = mockPosts.find(p => p.id === selectedPost);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show authentication required
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Autenticación Requerida
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Necesitas iniciar sesión para probar el sistema de comentarios avanzado
            </p>
            <button
              onClick={handleSignIn}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Crear Usuario de Prueba</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sistema de Comentarios Avanzado
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Conectado a Supabase • Usuario: {user.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Post Selector */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Selecciona un post para probar:
          </h2>
          <div className="grid gap-3">
            {mockPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post.id)}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  selectedPost === post.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {post.content}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>@{post.author}</span>
                  <span>{post.timestamp}</span>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{post.initialComments}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Post */}
        {selectedPostData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
            {/* Post Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedPostData.author.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedPostData.author}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedPostData.timestamp}
                  </p>
                </div>
              </div>
              
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {selectedPostData.title}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {selectedPostData.content}
              </p>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>{selectedPostData.likes} likes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>{commentStats?.totalComments || selectedPostData.initialComments} comentarios</span>
                </div>
                {commentStats && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>{commentStats.topContributors.length} participantes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>{commentStats.engagementRate.toFixed(1)}% engagement</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <AdvancedCommentsSection
              postId={selectedPost}
              currentUserId={user.id}
              initialCommentsCount={selectedPostData.initialComments}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Funcionalidades para probar:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>Comentarios anidados:</strong> Responde a comentarios para crear hilos</li>
            <li>• <strong>Menciones:</strong> Usa @ seguido de un nombre para mencionar usuarios</li>
            <li>• <strong>Likes:</strong> Dale like a comentarios haciendo clic en el corazón</li>
            <li>• <strong>Edición:</strong> Edita tus propios comentarios usando el menú ⋯</li>
            <li>• <strong>Eliminación:</strong> Elimina tus comentarios desde el menú</li>
            <li>• <strong>Estadísticas:</strong> Ve métricas de engagement y participación</li>
          </ul>
        </div>

        {/* Current User Info */}
        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Comentando como: <strong>{user.email}</strong> • ID: <code className="text-xs">{user.id}</code>
        </div>
        
        {/* Real-time Status */}
        <div className="mt-2 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Conectado en tiempo real a Supabase</span>
          </div>
        </div>
      </div>
    </div>
  );
};