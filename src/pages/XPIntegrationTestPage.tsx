/**
 * XP Integration Test Page
 * 
 * Interactive test page for demonstrating XP integration with user actions.
 * Shows how XP is awarded for various activities and how it integrates with the UI.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Trophy, 
  Target, 
  Flame, 
  Star,
  Users,
  Award,
  TrendingUp,
  Play,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { XPIntegrationProvider, useXPIntegration } from '@/components/gamification/withXPIntegration';
import { XPNotifications } from '@/components/gamification/XPNotifications';
import { WorkoutCompletionXP } from '@/components/workouts/WorkoutCompletionXP';
import { XPProgressBar } from '@/components/gamification/XPProgressBar';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { TestDataGenerator } from '@/utils/testDataGenerator';
import type { Workout } from '@/types/workout';
import type { PersonalRecord } from '@/types/analytics';
import type { UserLevel } from '@/types/gamification';

// Mock user data
const mockUserLevel: UserLevel = {
  userId: 'test-user',
  level: 5,
  currentXP: 150,
  totalXP: 962,
  xpForCurrentLevel: 812,
  xpForNextLevel: 1318,
  progress: 0.3,
  title: 'Dedicated',
  perks: ['Advanced analytics', 'Progress charts'],
  updatedAt: new Date()
};

const XPIntegrationTestContent: React.FC = () => {
  const xpIntegration = useXPIntegration();
  const [testWorkout, setTestWorkout] = useState<Workout | null>(null);
  const [testPRs, setTestPRs] = useState<PersonalRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const testDataGenerator = new TestDataGenerator();

  // Generate test workout
  const generateTestWorkout = async () => {
    setIsGenerating(true);
    try {
      const workout = await testDataGenerator.generateRandomWorkout('test-user', 0);
      setTestWorkout(workout);
      
      // Generate some mock personal records
      const mockPRs: PersonalRecord[] = [
        {
          id: 'pr-1',
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          type: 'max_weight',
          value: 100,
          unit: 'kg',
          achievedAt: new Date(),
          workoutId: workout.id,
          previousRecord: 95,
          improvement: 5.26
        }
      ];
      setTestPRs(mockPRs);
    } catch (error) {
      console.error('Error generating test workout:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Test XP award functions
  const testXPAwards = [
    {
      title: 'Workout Completion',
      description: 'Award XP for completing a workout',
      icon: <Target className="w-5 h-5" />,
      color: 'bg-blue-500',
      action: () => {
        if (testWorkout) {
          xpIntegration.awardWorkoutXP(testWorkout, {
            isFirstWorkout: false,
            weeklyWorkoutCount: 3,
            perfectForm: true
          });
        }
      }
    },
    {
      title: 'Personal Record',
      description: 'Award XP for achieving a personal record',
      icon: <Star className="w-5 h-5" />,
      color: 'bg-yellow-500',
      action: () => {
        if (testPRs.length > 0) {
          xpIntegration.awardPersonalRecordXP(testPRs[0], 5.26);
        }
      }
    },
    {
      title: 'Social Interaction',
      description: 'Award XP for social activities',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-green-500',
      action: () => {
        xpIntegration.awardSocialXP('workout_shared', 'test-post-id');
      }
    },
    {
      title: 'First Workout',
      description: 'Award bonus XP for first workout',
      icon: <Award className="w-5 h-5" />,
      color: 'bg-purple-500',
      action: () => {
        if (testWorkout) {
          xpIntegration.awardWorkoutXP(testWorkout, {
            isFirstWorkout: true,
            perfectForm: true
          });
        }
      }
    },
    {
      title: 'Perfect Week',
      description: 'Award XP for perfect week consistency',
      icon: <Flame className="w-5 h-5" />,
      color: 'bg-orange-500',
      action: () => {
        if (testWorkout) {
          xpIntegration.awardWorkoutXP(testWorkout, {
            weeklyWorkoutCount: 3, // Perfect week
            perfectForm: true
          });
        }
      }
    },
    {
      title: 'Complete Processing',
      description: 'Process complete workout with all bonuses',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-indigo-500',
      action: () => {
        if (testWorkout) {
          xpIntegration.processWorkoutCompletion(testWorkout, {
            personalRecords: testPRs,
            isFirstWorkout: false,
            weeklyWorkoutCount: 3,
            monthlyWorkoutCount: 12,
            perfectForm: true
          });
        }
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                XP Integration Test
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Test XP integration with user actions and see real-time feedback
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <LevelBadge
                userLevel={mockUserLevel}
                size="md"
                variant="compact"
                showTitle={true}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Current Progress
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                XP Progress
              </h3>
              <XPProgressBar
                userLevel={mockUserLevel}
                showAnimation={true}
                size="lg"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                Level Badge
              </h3>
              <div className="flex justify-center">
                <LevelBadge
                  userLevel={mockUserLevel}
                  size="xl"
                  showAnimation={true}
                  glowEffect={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Test Workout Generation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Test Workout Data
            </h2>
            
            <button
              onClick={generateTestWorkout}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Generate Test Workout'}</span>
            </button>
          </div>
          
          {testWorkout ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">Name</div>
                  <div className="text-gray-900 dark:text-white">{testWorkout.name}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">Exercises</div>
                  <div className="text-gray-900 dark:text-white">{testWorkout.exercises.length}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">Duration</div>
                  <div className="text-gray-900 dark:text-white">
                    {Math.round((testWorkout.total_duration || 0) / 60)}m
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">PRs</div>
                  <div className="text-gray-900 dark:text-white">{testPRs.length}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Generate a test workout to begin testing XP integration
            </div>
          )}
        </div>

        {/* XP Test Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            XP Test Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testXPAwards.map((test, index) => (
              <motion.button
                key={test.title}
                onClick={test.action}
                disabled={!testWorkout && (test.title.includes('Workout') || test.title.includes('Processing'))}
                className={`p-4 rounded-lg text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${test.color}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  {test.icon}
                  <span className="font-medium">{test.title}</span>
                </div>
                <p className="text-sm opacity-90 text-left">
                  {test.description}
                </p>
              </motion.button>
            ))}
          </div>
          
          {!testWorkout && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
                <Trophy className="w-4 h-4" />
                <span className="text-sm">
                  Generate a test workout first to enable workout-related XP tests
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Workout Completion XP Demo */}
        {testWorkout && (
          <WorkoutCompletionXP
            workout={testWorkout}
            personalRecords={testPRs}
            isFirstWorkout={false}
            weeklyWorkoutCount={3}
            monthlyWorkoutCount={12}
            onXPProcessed={(result) => {
              console.log('XP Processing Result:', result);
            }}
            className="mb-8"
          />
        )}

        {/* Processing Status */}
        {xpIntegration.isProcessingXP && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="text-blue-800 dark:text-blue-200">
                Processing XP rewards...
              </span>
            </div>
          </div>
        )}

        {/* Last XP Award */}
        {xpIntegration.lastXPAward && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <div className="font-medium text-green-800 dark:text-green-200">
                  Last XP Award: +{xpIntegration.lastXPAward.xpAwarded} XP
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Total XP: {xpIntegration.lastXPAward.newTotalXP.toLocaleString()}
                  {xpIntegration.lastXPAward.levelUp && (
                    <span className="ml-2 font-bold">
                      • Level Up! {xpIntegration.lastXPAward.levelUp.oldLevel} → {xpIntegration.lastXPAward.levelUp.newLevel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* XP Notifications */}
      <XPNotifications userId="test-user" />
    </div>
  );
};

const XPIntegrationTestPage: React.FC = () => {
  return (
    <XPIntegrationProvider
      userId="test-user"
      showXPPreview={true}
      autoAward={true}
      showNotifications={true}
    >
      <XPIntegrationTestContent />
    </XPIntegrationProvider>
  );
};

export default XPIntegrationTestPage;