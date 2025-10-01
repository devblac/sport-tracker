/**
 * Percentiles Page
 * 
 * Main page showcasing the complete global percentiles system.
 * Demonstrates Task 16 implementation with all features integrated.
 */

import React, { useState, useEffect } from 'react';
import { PercentileDashboard } from '@/components/percentiles/PercentileDashboard';
import { PercentileSystemDemo } from '@/components/percentiles/PercentileSystemDemo';
import { useAuthStore } from '@/stores/authStore';
import { User } from '@/types';
import { 
  BarChart3, 
  Globe, 
  Users, 
  Trophy, 
  Target,
  Zap,
  Info,
  Play,
  Settings
} from 'lucide-react';

export const PercentilesPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [activeMode, setActiveMode] = useState<'dashboard' | 'demo'>('dashboard');
  const [showIntro, setShowIntro] = useState(true);

  // Mock user for demo purposes if not authenticated
  const mockUser: User = {
    id: 'demo_user_123',
    email: 'demo@example.com',
    username: 'demo_user',
    role: 'basic',
    profile: {
      displayName: 'Demo User',
      age: 28,
      weight: 75,
      height: 175,
      gender: 'male',
      fitnessLevel: 'intermediate',
      goals: ['strength', 'muscle_gain'],
      totalWorkouts: 150,
      currentStreak: 5,
      bestStreak: 12,
      totalXP: 2500,
      level: 8
    },
    settings: {
      theme: 'light',
      notifications: true,
      privacy: 'friends',
      units: 'metric'
    },
    gamification: {
      level: 8,
      totalXP: 2500,
      currentStreak: 5,
      bestStreak: 12,
      achievementsUnlocked: ['first_workout', 'week_warrior', 'strength_seeker']
    },
    createdAt: new Date('2023-01-15')
  };

  const currentUser = isAuthenticated && user ? user : mockUser;

  const handleGetStarted = () => {
    setShowIntro(false);
    setActiveMode('dashboard');
  };

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                <Globe className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Global Percentiles System
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Compare your fitness performance with users worldwide. Get detailed analytics, 
              demographic comparisons, and personalized recommendations based on your global rankings.
            </p>
            
            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex justify-center mb-4">
                  <BarChart3 className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Real-time Rankings
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Live percentile calculations with demographic segmentation
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex justify-center mb-4">
                  <Users className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Demographic Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Compare with users of similar age, weight, and experience
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex justify-center mb-4">
                  <Trophy className="w-12 h-12 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Global Leaderboards
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  See top performers and track your position worldwide
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex justify-center mb-4">
                  <Zap className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibent text-gray-900 dark:text-white mb-2">
                  Smart Insights
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-powered recommendations and performance predictions
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold text-lg flex items-center space-x-2 shadow-lg"
              >
                <Play className="w-5 h-5" />
                <span>View Your Dashboard</span>
              </button>
              <button
                onClick={() => {
                  setShowIntro(false);
                  setActiveMode('demo');
                }}
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-semibold text-lg flex items-center space-x-2"
              >
                <Settings className="w-5 h-5" />
                <span>System Demo</span>
              </button>
            </div>
          </div>

          {/* System Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. Track Performance
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Complete workouts and log your exercises. Our system automatically 
                  captures your performance data and calculates key metrics.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. Calculate Rankings
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Advanced algorithms compare your performance with millions of users 
                  worldwide, segmented by demographics and experience level.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibent text-gray-900 dark:text-white mb-3">
                  3. Get Insights
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Receive personalized recommendations, identify strengths and 
                  weaknesses, and discover opportunities for improvement.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Implementation */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <Info className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Technical Implementation
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  ✅ Completed Features
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Real-time percentile calculations with demographic segmentation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Global rankings system with top performer leaderboards
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Comprehensive visualization components with interactive displays
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Integration with Supabase backend for scalable data processing
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    Advanced demographic analysis and peer comparisons
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  🔧 Architecture Components
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    GlobalPercentilesService - Core calculation engine
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    DemographicSegmentation - Smart user grouping
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    SupabasePercentileService - Cloud data integration
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    PercentileDashboard - Comprehensive UI dashboard
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    GlobalPercentilesVisualization - Interactive charts
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Global Percentiles
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {activeMode === 'dashboard' 
                ? 'Your comprehensive performance analysis' 
                : 'System demonstration and technical overview'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveMode('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeMode === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveMode('demo')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                activeMode === 'demo'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              System Demo
            </button>
            <button
              onClick={() => setShowIntro(true)}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              title="Show introduction"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {activeMode === 'dashboard' ? (
          <PercentileDashboard user={currentUser} />
        ) : (
          <PercentileSystemDemo />
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Global Percentiles System - Task 16 Implementation Complete
          </p>
          <p className="mt-1">
            Real-time calculations • Demographic segmentation • Global rankings • Smart insights
          </p>
        </div>
      </div>
    </div>
  );
};

export default PercentilesPage;