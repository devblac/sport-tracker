/**
 * Fitness Achievement Test Page
 * 
 * Test page for fitness-specific achievements including consistency,
 * strength, milestones, and specialized fitness goals.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Calendar, 
  TrendingUp, 
  Dumbbell,
  Flame,
  Play,
  BarChart3,
  Clock,
  Star,
  Award,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useFitnessAchievements } from '@/hooks/useFitnessAchievements';
import { AchievementGallery } from '@/components/gamification/AchievementGallery';
import { AchievementNotificationManager } from '@/components/gamification/AchievementNotifications';
import { 
  consistencyAchievements, 
  strengthAchievements, 
  milestoneAchievements, 
  specializedAchievements 
} from '@/data/fitnessAchievements';
import type { Workout } from '@/types/workout';
import type { PersonalRecord } from '@/types/analytics';

const FitnessAchievementTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'consistency' | 'strength' | 'milestones' | 'specialized' | 'testing'>('consistency');
  const [testResults, setTestResults] = useState<any>(null);
  
  const userId = 'fitness-test-user-123';
  
  const {
    checkWorkoutAchievements,
    checkPersonalRecordAchievements,
    checkStreakAchievements,
    triggerAchievementCheck,
    fitnessAchievements,
    getAchievementsByCategory,
    getAchievementsByRarity,
    isProcessing,
    lastResult,
    error,
    totalChecks,
    totalUnlocks,
    recentUnlocks
  } = useFitnessAchievements({ 
    userId,
    autoTriggerNotifications: true,
    enableLogging: true
  });

  // Sample test data
  const createSampleWorkout = (): Workout => ({
    id: `test-workout-${Date.now()}`,
    userId,
    templateId: null,
    name: 'Test Workout',
    exercises: [
      {
        exerciseId: 'bench-press',
        name: 'Bench Press',
        muscleGroups: ['chest', 'triceps'],
        sets: [
          { reps: 10, weight: 80, restTime: 120, type: 'normal' },
          { reps: 8, weight: 85, restTime: 120, type: 'normal' },
          { reps: 6, weight: 90, restTime: 120, type: 'normal' }
        ],
        notes: 'Good form'
      },
      {
        exerciseId: 'squat',
        name: 'Squat',
        muscleGroups: ['quadriceps', 'glutes'],
        sets: [
          { reps: 12, weight: 100, restTime: 180, type: 'normal' },
          { reps: 10, weight: 110, restTime: 180, type: 'normal' },
          { reps: 8, weight: 120, restTime: 180, type: 'normal' }
        ],
        notes: 'Deep squats'
      }
    ],
    startedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    completedAt: new Date(),
    duration: 45,
    notes: 'Great workout!',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const createSamplePersonalRecord = (): PersonalRecord => ({
    id: `test-pr-${Date.now()}`,
    userId,
    exerciseId: 'bench-press',
    exerciseName: 'Bench Press',
    type: '1rm',
    value: 95,
    previousValue: 90,
    improvement: 5,
    achievedAt: new Date(),
    workoutId: 'test-workout',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Test functions
  const testWorkoutAchievements = async () => {
    const workout = createSampleWorkout();
    const result = await checkWorkoutAchievements(workout, {
      userProfile: { weight: 75, height: 180, age: 25, gender: 'male' }
    });
    setTestResults(result);
  };

  const testPersonalRecordAchievements = async () => {
    const pr = createSamplePersonalRecord();
    const result = await checkPersonalRecordAchievements(pr, {
      userProfile: { weight: 75, height: 180, age: 25, gender: 'male' }
    });
    setTestResults(result);
  };

  const testStreakAchievements = async () => {
    const streakDays = Math.floor(Math.random() * 30) + 1; // Random streak 1-30 days
    const result = await checkStreakAchievements(streakDays);
    setTestResults(result);
  };

  const testSpecificAchievements = async (achievementIds: string[]) => {
    const result = await triggerAchievementCheck(achievementIds, {
      userProfile: { weight: 75, height: 180, age: 25, gender: 'male' }
    });
    setTestResults(result);
  };

  const tabs = [
    { id: 'consistency', label: 'Consistency', icon: <Calendar className="w-4 h-4" />, count: consistencyAchievements.length },
    { id: 'strength', label: 'Strength', icon: <Dumbbell className="w-4 h-4" />, count: strengthAchievements.length },
    { id: 'milestones', label: 'Milestones', icon: <Trophy className="w-4 h-4" />, count: milestoneAchievements.length },
    { id: 'specialized', label: 'Specialized', icon: <Star className="w-4 h-4" />, count: specializedAchievements.length },
    { id: 'testing', label: 'Testing', icon: <Play className="w-4 h-4" />, count: 0 }
  ];

  const achievementsByTab = {
    consistency: consistencyAchievements,
    strength: strengthAchievements,
    milestones: milestoneAchievements,
    specialized: specializedAchievements,
    testing: []
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Dumbbell className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Fitness Achievement System
              </h1>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Total: {fitnessAchievements.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Checks: {totalChecks}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>Unlocks: {totalUnlocks}</span>
              </div>
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
                {tab.count > 0 && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Bar */}
        {(isProcessing || error || lastResult) && (
          <div className="mb-6">
            {isProcessing && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-blue-800 dark:text-blue-200">Processing achievements...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-red-600" />
                  <span className="text-red-800 dark:text-red-200">Error: {error}</span>
                </div>
              </div>
            )}
            
            {lastResult && !isProcessing && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 dark:text-green-200">
                      Checked {lastResult.checkedAchievements} achievements, 
                      unlocked {lastResult.unlockedAchievements.length}, 
                      {lastResult.progressUpdates.length} progress updates
                    </span>
                  </div>
                  
                  {lastResult.unlockedAchievements.length > 0 && (
                    <div className="flex items-center space-x-2">
                      {lastResult.unlockedAchievements.map((achievement, index) => (
                        <div key={index} className="flex items-center space-x-1 text-sm">
                          <span>{achievement.icon}</span>
                          <span className="text-green-700 dark:text-green-300">{achievement.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Unlocks */}
        {recentUnlocks.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Award className="w-5 h-5 text-yellow-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Unlocks
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentUnlocks.slice(0, 6).map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg p-3"
                >
                  <div className="text-xl">{achievement.icon}</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {achievement.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {achievement.rarity} • {achievement.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'testing' ? (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Achievement Testing
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Test different types of fitness achievements with simulated data.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={testWorkoutAchievements}
                  disabled={isProcessing}
                  className="flex items-center justify-center space-x-2 p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Test Workout Achievements</span>
                </button>
                
                <button
                  onClick={testPersonalRecordAchievements}
                  disabled={isProcessing}
                  className="flex items-center justify-center space-x-2 p-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Test PR Achievements</span>
                </button>
                
                <button
                  onClick={testStreakAchievements}
                  disabled={isProcessing}
                  className="flex items-center justify-center space-x-2 p-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors"
                >
                  <Flame className="w-5 h-5" />
                  <span>Test Streak Achievements</span>
                </button>
              </div>

              {/* Quick Achievement Tests */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Quick Tests
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => testSpecificAchievements(['first_workout'])}
                      disabled={isProcessing}
                      className="w-full text-left p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <div className="font-medium">First Workout</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Test milestone achievement</div>
                    </button>
                    
                    <button
                      onClick={() => testSpecificAchievements(['streak_7_days'])}
                      disabled={isProcessing}
                      className="w-full text-left p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <div className="font-medium">Week Warrior</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Test consistency achievement</div>
                    </button>
                    
                    <button
                      onClick={() => testSpecificAchievements(['first_pr'])}
                      disabled={isProcessing}
                      className="w-full text-left p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <div className="font-medium">Personal Best</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Test strength achievement</div>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Test Results
                  </h3>
                  {testResults ? (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {JSON.stringify(testResults, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center text-gray-500 dark:text-gray-400">
                      Run a test to see results here
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                    {activeTab} Achievements
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {achievementsByTab[activeTab].length} achievements in this category
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].map(rarity => {
                    const count = achievementsByTab[activeTab].filter(a => a.rarity === rarity).length;
                    if (count === 0) return null;
                    
                    return (
                      <div
                        key={rarity}
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          rarity === 'common' && 'bg-gray-100 text-gray-700'
                        } ${
                          rarity === 'uncommon' && 'bg-green-100 text-green-700'
                        } ${
                          rarity === 'rare' && 'bg-blue-100 text-blue-700'
                        } ${
                          rarity === 'epic' && 'bg-purple-100 text-purple-700'
                        } ${
                          rarity === 'legendary' && 'bg-yellow-100 text-yellow-700'
                        } ${
                          rarity === 'mythic' && 'bg-pink-100 text-pink-700'
                        }`}
                      >
                        {rarity} ({count})
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Achievement Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievementsByTab[activeTab].map(achievement => (
                  <motion.div
                    key={achievement.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {achievement.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            achievement.rarity === 'common' && 'bg-gray-100 text-gray-700'
                          } ${
                            achievement.rarity === 'uncommon' && 'bg-green-100 text-green-700'
                          } ${
                            achievement.rarity === 'rare' && 'bg-blue-100 text-blue-700'
                          } ${
                            achievement.rarity === 'epic' && 'bg-purple-100 text-purple-700'
                          } ${
                            achievement.rarity === 'legendary' && 'bg-yellow-100 text-yellow-700'
                          } ${
                            achievement.rarity === 'mythic' && 'bg-pink-100 text-pink-700'
                          }`}>
                            {achievement.rarity}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {achievement.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span className="text-gray-700 dark:text-gray-300">
                              {achievement.rewards.xp} XP
                            </span>
                          </div>
                          
                          <div className="text-gray-500 dark:text-gray-400">
                            {achievement.requirements.type}: {achievement.requirements.target}
                          </div>
                        </div>
                        
                        {achievement.isSecret && (
                          <div className="mt-2 flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400">
                            <Star className="w-3 h-3" />
                            <span>Secret Achievement</span>
                          </div>
                        )}
                        
                        <button
                          onClick={() => testSpecificAchievements([achievement.id])}
                          disabled={isProcessing}
                          className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>Test</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Manager */}
      <AchievementNotificationManager userId={userId} />
    </div>
  );
};

export default FitnessAchievementTestPage;