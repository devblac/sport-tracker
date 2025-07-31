/**
 * Streak System Test Page
 * 
 * Test page for the intelligent streak system including personalized schedules,
 * compensation days, sick/vacation days, and comprehensive analytics.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Flame, 
  Target, 
  Clock,
  Heart,
  Umbrella,
  RotateCcw,
  Plus,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Award,
  Play,
  RefreshCw
} from 'lucide-react';
import { useStreaks } from '@/hooks/useStreaks';
import { 
  calculateCurrentStreak,
  calculateCompletionRate,
  calculateConsistencyScore,
  analyzeStreakRisk,
  generateStreakInsights,
  generateStreakRecommendations
} from '@/utils/streakCalculations';
import type { StreakSchedule, StreakDay } from '@/types/streaks';
import type { Workout } from '@/types/workout';

const StreakTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedules' | 'calendar' | 'analytics' | 'testing'>('overview');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  
  const userId = 'streak-test-user-123';
  
  const {
    schedules,
    activeSchedule,
    currentPeriod,
    stats,
    config,
    createSchedule,
    updateSchedule,
    setActiveSchedule,
    recordWorkout,
    markSickDay,
    markVacationDay,
    compensateMissedDay,
    isLoading,
    error,
    refreshData,
    processDailyUpdates
  } = useStreaks({ userId });

  // Sample data for testing
  const createSampleWorkout = (): Workout => ({
    id: `test-workout-${Date.now()}`,
    userId,
    templateId: null,
    name: 'Test Workout',
    exercises: [
      {
        exerciseId: 'push-ups',
        name: 'Push-ups',
        muscleGroups: ['chest', 'triceps'],
        sets: [
          { reps: 15, weight: 0, restTime: 60, type: 'normal' },
          { reps: 12, weight: 0, restTime: 60, type: 'normal' },
          { reps: 10, weight: 0, restTime: 60, type: 'normal' }
        ],
        notes: 'Good form'
      }
    ],
    startedAt: new Date(Date.now() - 30 * 60 * 1000),
    completedAt: new Date(),
    duration: 30,
    notes: 'Quick test workout',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const createSampleSchedule = async () => {
    const schedule: Omit<StreakSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: 'Morning Routine',
      description: 'Daily morning workouts',
      targetDaysPerWeek: 5,
      scheduledDays: [1, 2, 3, 4, 5], // Monday to Friday
      isFlexible: true,
      restDays: [0, 6], // Sunday and Saturday
      isActive: true,
      color: '#3B82F6',
      icon: '🌅'
    };

    await createSchedule(schedule);
  };

  const testRecordWorkout = async () => {
    const workout = createSampleWorkout();
    await recordWorkout(workout, activeSchedule?.id);
  };

  const testMarkSickDay = async () => {
    if (!activeSchedule) return;
    const today = new Date().toISOString().split('T')[0];
    await markSickDay(today, activeSchedule.id, 'Feeling unwell');
  };

  const testMarkVacationDay = async () => {
    if (!activeSchedule) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await markVacationDay(tomorrowStr, activeSchedule.id, 'Vacation day');
  };

  const testCompensation = async () => {
    if (!activeSchedule) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    await compensateMissedDay(yesterdayStr, today, activeSchedule.id, 'compensation-workout-123');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'schedules', label: 'Schedules', icon: <Calendar className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendar', icon: <Target className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'testing', label: 'Testing', icon: <Play className="w-4 h-4" /> }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <Target className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Flame className="w-8 h-8 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Intelligent Streak System
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={processDailyUpdates}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Daily Update</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-red-800 dark:text-red-200">Error: {error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-blue-800 dark:text-blue-200">Loading streak data...</span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <Flame className="w-8 h-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.currentStreak || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Current Streak
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <Award className="w-8 h-8 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.longestStreak || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Longest Streak
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <Target className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.completionRate.toFixed(1) || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Completion Rate
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.perfectWeeks || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Perfect Weeks
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Streak Risk */}
            {stats && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Streak Status
                </h2>
                <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full ${getRiskColor(stats.streakRisk)}`}>
                  {getRiskIcon(stats.streakRisk)}
                  <span className="font-medium capitalize">
                    {stats.streakRisk === 'none' ? 'Safe' : `${stats.streakRisk} Risk`}
                  </span>
                </div>
                
                {stats.nextScheduledWorkout && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Next scheduled workout: {stats.nextScheduledWorkout.toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Available Days */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <RotateCcw className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Compensation Days
                  </h3>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.compensationDaysAvailable || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Available this month
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Sick Days
                  </h3>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {stats?.sickDaysAvailable || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Available this month
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Umbrella className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Vacation Days
                  </h3>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.vacationDaysAvailable || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Available this month
                </div>
              </div>
            </div>

            {/* Insights */}
            {currentPeriod && activeSchedule && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Insights & Recommendations
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      💡 Insights
                    </h3>
                    <div className="space-y-2">
                      {generateStreakInsights(currentPeriod.days, activeSchedule, stats!).map((insight, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          {insight}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      🎯 Recommendations
                    </h3>
                    <div className="space-y-2">
                      {generateStreakRecommendations(currentPeriod.days, activeSchedule, stats!).map((rec, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Streak Schedules
              </h2>
              <button
                onClick={() => setShowCreateSchedule(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Schedule</span>
              </button>
            </div>

            {schedules.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No schedules yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first streak schedule to start tracking your consistency.
                </p>
                <button
                  onClick={createSampleSchedule}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create Sample Schedule
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedules.map(schedule => (
                  <motion.div
                    key={schedule.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-6 border-2 cursor-pointer transition-all ${
                      activeSchedule?.id === schedule.id
                        ? 'border-blue-500 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveSchedule(schedule.id)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="text-2xl">{schedule.icon || '📅'}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {schedule.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {schedule.targetDaysPerWeek} days/week
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Flexible:</span>
                        <span className={schedule.isFlexible ? 'text-green-600' : 'text-red-600'}>
                          {schedule.isFlexible ? 'Yes' : 'No'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={schedule.isActive ? 'text-green-600' : 'text-gray-600'}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Scheduled: {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                          .filter((_, i) => schedule.scheduledDays.includes(i))
                          .join(', ')}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Streak System Testing
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Test different streak system features with sample data.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={createSampleSchedule}
                  className="flex items-center justify-center space-x-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Sample Schedule</span>
                </button>
                
                <button
                  onClick={testRecordWorkout}
                  disabled={!activeSchedule}
                  className="flex items-center justify-center space-x-2 p-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Record Workout</span>
                </button>
                
                <button
                  onClick={testMarkSickDay}
                  disabled={!activeSchedule}
                  className="flex items-center justify-center space-x-2 p-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span>Mark Sick Day</span>
                </button>
                
                <button
                  onClick={testMarkVacationDay}
                  disabled={!activeSchedule}
                  className="flex items-center justify-center space-x-2 p-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <Umbrella className="w-5 h-5" />
                  <span>Mark Vacation Day</span>
                </button>
                
                <button
                  onClick={testCompensation}
                  disabled={!activeSchedule}
                  className="flex items-center justify-center space-x-2 p-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Test Compensation</span>
                </button>
                
                <button
                  onClick={processDailyUpdates}
                  className="flex items-center justify-center space-x-2 p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Process Daily Updates</span>
                </button>
              </div>
            </div>

            {/* Configuration Display */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Current Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Max Compensation Days:</div>
                  <div className="text-gray-600 dark:text-gray-400">{config.maxCompensationDays} per month</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Max Sick Days:</div>
                  <div className="text-gray-600 dark:text-gray-400">{config.maxSickDays} per month</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Max Vacation Days:</div>
                  <div className="text-gray-600 dark:text-gray-400">{config.maxVacationDays} per month</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Compensation Time Limit:</div>
                  <div className="text-gray-600 dark:text-gray-400">{config.compensationTimeLimit} days</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Streak Grace Period:</div>
                  <div className="text-gray-600 dark:text-gray-400">{config.streakGracePeriod} days</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Min Workouts Per Week:</div>
                  <div className="text-gray-600 dark:text-gray-400">{config.minWorkoutsPerWeek} workouts</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs would be implemented here */}
        {(activeTab === 'calendar' || activeTab === 'analytics') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">🚧</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'calendar' ? 'Calendar view' : 'Analytics dashboard'} is under development.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakTestPage;