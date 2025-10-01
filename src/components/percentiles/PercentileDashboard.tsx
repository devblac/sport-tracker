/**
 * Percentile Dashboard Component
 * 
 * Main dashboard that integrates all percentile components and provides
 * a comprehensive view of user's global performance rankings.
 * Implements Task 16 - Complete global percentiles system
 */

import React, { useState, useEffect } from 'react';
import { GlobalPercentilesService } from '@/services/GlobalPercentilesService';
import { GlobalPercentilesVisualization } from './GlobalPercentilesVisualization';
import { SupabasePercentileDisplay } from './SupabasePercentileDisplay';
import { EnhancedPercentileDisplay } from './EnhancedPercentileDisplay';
import { UserDemographics } from '@/types/percentiles';
import { User } from '@/types';
import { 
  BarChart3, 
  Globe, 
  TrendingUp, 
  Users, 
  Trophy, 
  Target,
  RefreshCw,
  Settings,
  Info,
  Zap
} from 'lucide-react';

interface PercentileDashboardProps {
  user: User;
  className?: string;
}

interface DashboardStats {
  totalRankings: number;
  averagePercentile: number;
  bestPercentile: number;
  improvingExercises: number;
  totalComparisons: number;
  lastUpdated: Date;
}

export const PercentileDashboard: React.FC<PercentileDashboardProps> = ({
  user,
  className = ''
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'global' | 'detailed' | 'trends'>('overview');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  const globalPercentilesService = GlobalPercentilesService.getInstance();

  // Extract user demographics
  const userDemographics: UserDemographics = {
    age: user.profile?.age || 25,
    gender: (user.profile?.gender as 'male' | 'female' | 'other') || 'other',
    weight: user.profile?.weight || 70,
    height: user.profile?.height || 170,
    experience_level: determineExperienceLevel(user.profile?.totalWorkouts || 0)
  };

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load global percentiles data
      const globalData = await globalPercentilesService.getGlobalPercentiles(
        user.id,
        userDemographics
      );

      // Calculate dashboard statistics
      const stats: DashboardStats = {
        totalRankings: globalData.user_rankings.length,
        averagePercentile: Math.round(
          globalData.user_rankings.reduce((sum, r) => sum + r.percentile, 0) / 
          globalData.user_rankings.length
        ),
        bestPercentile: Math.max(...globalData.user_rankings.map(r => r.percentile)),
        improvingExercises: globalData.segment_analysis.best_segments.length,
        totalComparisons: globalData.demographic_comparisons.length,
        lastUpdated: new Date()
      };

      setDashboardStats(stats);

      // Set default selected exercises (top performing ones)
      const topExercises = globalData.user_rankings
        .sort((a, b) => b.percentile - a.percentile)
        .slice(0, 5)
        .map(r => r.exercise_id);
      setSelectedExercises(topExercises);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const determineExperienceLevel = (totalWorkouts: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
    if (totalWorkouts < 20) return 'beginner';
    if (totalWorkouts < 100) return 'intermediate';
    if (totalWorkouts < 300) return 'advanced';
    return 'expert';
  };

  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 90) return 'text-yellow-600 bg-yellow-100';
    if (percentile >= 75) return 'text-green-600 bg-green-100';
    if (percentile >= 50) return 'text-blue-600 bg-blue-100';
    if (percentile >= 25) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getPercentileLabel = (percentile: number): string => {
    if (percentile >= 95) return 'Elite';
    if (percentile >= 85) return 'Advanced';
    if (percentile >= 65) return 'Above Average';
    if (percentile >= 35) return 'Average';
    return 'Below Average';
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
              Performance Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Your global percentile rankings and performance analysis
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Statistics */}
        {dashboardStats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardStats.totalRankings}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total Rankings</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {dashboardStats.averagePercentile}th
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Avg Percentile</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {dashboardStats.bestPercentile}th
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Best Percentile</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {dashboardStats.improvingExercises}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Strong Areas</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {dashboardStats.totalComparisons}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Comparisons</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-sm font-bold text-gray-600 dark:text-gray-300">
                {dashboardStats.lastUpdated.toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Last Updated</div>
            </div>
          </div>
        )}

        {/* User Demographics Summary */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-indigo-700 dark:text-indigo-300">
                <span className="font-semibold">Demographics:</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-indigo-600 dark:text-indigo-400">
                <span>{userDemographics.age}y</span>
                <span className="capitalize">{userDemographics.gender}</span>
                <span>{userDemographics.weight}kg</span>
                <span className="capitalize">{userDemographics.experience_level}</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPercentileColor(dashboardStats?.averagePercentile || 50)}`}>
              {getPercentileLabel(dashboardStats?.averagePercentile || 50)}
            </div>
          </div>
        </div>

        {/* View Navigation */}
        <nav className="flex space-x-8 mt-6">
          {[
            { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
            { key: 'global', label: 'Global Analysis', icon: <Globe className="w-4 h-4" /> },
            { key: 'detailed', label: 'Detailed View', icon: <Target className="w-4 h-4" /> },
            { key: 'trends', label: 'Trends', icon: <TrendingUp className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                activeView === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Trophy className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-blue-800 dark:text-blue-400">Global Position</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Your worldwide ranking</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  Top {100 - (dashboardStats?.averagePercentile || 50)}%
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Better than {dashboardStats?.averagePercentile || 50}% of users globally
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Zap className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="font-bold text-green-800 dark:text-green-400">Performance Level</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">Current classification</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {getPercentileLabel(dashboardStats?.bestPercentile || 50)}
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Based on your best exercise performance
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-purple-800 dark:text-purple-400">Peer Comparison</h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">vs similar users</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {userDemographics.experience_level.charAt(0).toUpperCase() + userDemographics.experience_level.slice(1)}
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {userDemographics.age}y {userDemographics.gender}, {userDemographics.weight}kg
                </p>
              </div>
            </div>

            {/* Recent Performance Highlights */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-600" />
                Performance Highlights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">🎯 Strengths</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Consistently above average in strength exercises
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Strong performance in your age group
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Improving trend over last 3 months
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">🚀 Opportunities</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Focus on cardiovascular endurance
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Potential for competition in powerlifting
                      </span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Consider advanced training techniques
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'global' && (
          <GlobalPercentilesVisualization
            userId={user.id}
            userDemographics={userDemographics}
            exerciseIds={selectedExercises}
          />
        )}

        {activeView === 'detailed' && (
          <div className="space-y-6">
            {selectedExercises.map(exerciseId => (
              <SupabasePercentileDisplay
                key={exerciseId}
                userId={user.id}
                exerciseId={exerciseId}
                exerciseName={exerciseId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                showAllMetrics={true}
                compact={false}
              />
            ))}
          </div>
        )}

        {activeView === 'trends' && (
          <EnhancedPercentileDisplay
            userId={user.id}
            exerciseId={selectedExercises[0]}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Last updated: {dashboardStats?.lastUpdated.toLocaleString()}</span>
            <span>•</span>
            <span>Data from {dashboardStats?.totalRankings} exercises</span>
          </div>
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4" />
            <span>Rankings updated daily</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PercentileDashboard;