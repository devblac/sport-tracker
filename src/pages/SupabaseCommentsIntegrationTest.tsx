/**
 * Supabase Comments Integration Test
 * 
 * Test page to verify the advanced comments system works with Supabase
 */

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Heart, 
  Users, 
  Database, 
  CheckCircle, 
  XCircle,
  Loader,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { supabaseCommentsService } from '@/services/SupabaseCommentsService';
import { AdvancedCommentsSection } from '@/components/social/AdvancedCommentsSection';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';

const IntegrationTestContent: React.FC = () => {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedPost, setSelectedPost] = useState('post_1');

  // Test posts data
  const testPosts = [
    {
      id: 'post_1',
      title: 'Nuevo PR en Deadlift! 💪',
      content: 'Acabo de lograr un nuevo récord personal en peso muerto: 180kg!',
      author: 'FitnessWarrior'
    },
    {
      id: 'post_2', 
      title: 'Rutina de Piernas Intensa 🔥',
      content: 'Hoy fue día de piernas y no pude caminar después del gym 😅',
      author: 'LegDayLover'
    },
    {
      id: 'post_3',
      title: 'Consejos para Principiantes',
      content: 'La forma es más importante que el peso. Mejor hacer menos peso con buena técnica.',
      author: 'GymMentor'
    }
  ];

  // Run integration tests
  const runIntegrationTests = async () => {
    if (!user) return;
    
    setIsRunningTests(true);
    const results: Record<string, boolean> = {};

    try {
      // Test 1: Database connection
      console.log('Testing database connection...');
      const { data, error } = await supabase.from('social_posts').select('count').limit(1);
      results.database_connection = !error;

      // Test 2: Create comment
      console.log('Testing comment creation...');
      try {
        const testComment = await supabaseCommentsService.createComment(
          'post_1',
          user.id,
          {
            content: 'Test comment from integration test',
            mentions: []
          }
        );
        results.create_comment = !!testComment.id;
      } catch (error) {
        console.error('Create comment test failed:', error);
        results.create_comment = false;
      }

      // Test 3: Load comment threads
      console.log('Testing comment threads loading...');
      try {
        const threads = await supabaseCommentsService.getCommentThreads('post_1', user.id, 10, 0);
        results.load_threads = Array.isArray(threads);
      } catch (error) {
        console.error('Load threads test failed:', error);
        results.load_threads = false;
      }

      // Test 4: Comment validation
      console.log('Testing comment validation...');
      const validation = supabaseCommentsService.validateComment('Test validation', []);
      results.validation = validation.isValid;

      // Test 5: Mention parsing
      console.log('Testing mention parsing...');
      const parsed = supabaseCommentsService.parseComment('Hello @testuser this is a test');
      results.mention_parsing = parsed.segments.length > 1;

      // Test 6: Get mention suggestions
      console.log('Testing mention suggestions...');
      try {
        const suggestions = await supabaseCommentsService.getMentionSuggestions('test', user.id);
        results.mention_suggestions = Array.isArray(suggestions);
      } catch (error) {
        console.error('Mention suggestions test failed:', error);
        results.mention_suggestions = false;
      }

    } catch (error) {
      console.error('Integration tests failed:', error);
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  // Handle demo authentication
  const handleDemoAuth = async () => {
    try {
      const demoEmail = 'demo@sporttracker.test';
      const demoPassword = 'demo123456';
      
      try {
        await signIn(demoEmail, demoPassword);
      } catch (signInError) {
        // If sign in fails, try to sign up
        await signUp(demoEmail, demoPassword, {
          display_name: 'Demo User',
          username: 'demouser'
        });
      }
    } catch (error) {
      console.error('Demo auth failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center">
            <Database className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Supabase Integration Test
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Prueba la integración del sistema de comentarios con Supabase
            </p>
            <button
              onClick={handleDemoAuth}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Prueba Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedPostData = testPosts.find(p => p.id === selectedPost);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Supabase Comments Integration Test
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Usuario: {user.email} • ID: {user.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Integration Tests Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tests de Integración
              </h2>
              <button
                onClick={runIntegrationTests}
                disabled={isRunningTests}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isRunningTests ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                <span>{isRunningTests ? 'Ejecutando...' : 'Ejecutar Tests'}</span>
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'database_connection', label: 'Conexión a Base de Datos' },
                { key: 'create_comment', label: 'Crear Comentario' },
                { key: 'load_threads', label: 'Cargar Hilos de Comentarios' },
                { key: 'validation', label: 'Validación de Comentarios' },
                { key: 'mention_parsing', label: 'Parsing de Menciones' },
                { key: 'mention_suggestions', label: 'Sugerencias de Menciones' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {testResults[key] === undefined ? (
                    <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  ) : testResults[key] ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Post Selector */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Selecciona un post para probar comentarios:
          </h3>
          <div className="grid gap-3">
            {testPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post.id)}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  selectedPost === post.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  {post.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {post.content}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Por @{post.author}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Post with Comments */}
        {selectedPostData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {selectedPostData.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                {selectedPostData.content}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Por @{selectedPostData.author}
              </p>
            </div>

            {/* Comments Section */}
            <AdvancedCommentsSection
              postId={selectedPost}
              currentUserId={user.id}
              initialCommentsCount={0}
            />
          </div>
        )}

        {/* Status */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Conectado a Supabase en tiempo real</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SupabaseCommentsIntegrationTest: React.FC = () => {
  return (
    <AuthProvider>
      <IntegrationTestContent />
    </AuthProvider>
  );
};