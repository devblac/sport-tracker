/**
 * Gamification Test Page
 * 
 * Interactive test page for all gamification components with live data
 * and controls to test different scenarios.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, 
  User, 
  Trophy, 
  Zap, 
  Target,
  Settings,
  Play,
  RotateCcw
} from 'lucide-react';
import { TestDataGenerator } from '@/utils/testDataGenerator';
import {
  XPProgressBar,
  CompactXPProgressBar,
  DetailedXPProgressBar,
  LevelBadge,
  AnimatedLevelBadge,
  ClickableLevelBadge,
  DetailedLevelBadge,
  LevelUpCelebration,
  LevelUpToast,
  GamificationDashboard,
  CompactGamificationSummary
} from '@/components/gamification';
import type { 
  UserLevel, 
  GamificationStats, 
  UserStreak, 
  Achievement,
  XPAwardResult 
} from '@/types/gamification';

const GamificationTestPage: React.FC = () => {
  // Test data state
  const [currentScenario, setCurrentScenario] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [testData, setTestData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // UI test state
  const [recentXPGain, setRecentXPGain] = useState(0);
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState(false);
  const [showLevelUpToast, setShowLevelUpToast] = useState(false);
  const [levelUpData, setLevelUpData] = useState<XPAwardResult['levelUp'] | null>(null);

  const testDataGenerator = new TestDataGenerator();

  // Load test data for current scenario
  const loadTestData = async () => {
    setIsLoading(true);
    try {
      const scenarios = await testDataGenerator.generateUserScenarios();
      setTestData(scenarios[currentScenario]);
    } catch (error) {
      console.error('Error loading test data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize test data
  useEffect(() => {
    loadTestData();
  }, [currentScenario]);

  // Test XP gain animation
  const testXPGain = () => {
    const xpAmount = Math.floor(Math.random() * 200) + 50; // 50-250 XP
    setRecentXPGain(xpAmount);
    
    // Clear after animation
    setTimeout(() => setRecentXPGain(0), 3000);
  };

  // Test level up celebration
  const testLevelUp = () => {
    const mockLevelUpData: XPAwardResult['levelUp'] = {
      oldLevel: testData?.userLevel?.level || 5,
      newLevel: (testData?.userLevel?.level || 5) + 1,
      newTitle: 'Test Champion',
      unlockedFeatures: ['advanced_analytics', 'custom_achievements', 'premium_features']
    };
    
    setLevelUpData(mockLevelUpData);
    setShowLevelUpCelebration(true);
  };

  // Test level up toast
  const testLevelUpToast = () => {
    const mockLevelUpData: XPAwardResult['levelUp'] = {
      oldLevel: testData?.userLevel?.level || 5,
      newLevel: (testData?.userLevel?.level || 5) + 1,
      newTitle: 'Toast Champion',
      unlockedFeatures: ['toast_feature']
    };
    
    setLevelUpData(mockLevelUpData);
    setShowLevelUpToast(true);
  };

  if (isLoading || !testData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading test data...</p>
        </div>
      </div>
    );
  }

  const { userLevel, userStats, userStreak, userAchievements } = testData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gamification Test Page
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Interactive testing for all gamification components
              </p>
            </div>
            
            {/* Scenario Selector */}
            <div className="flex items-center space-x-4">
              <select
                value={currentScenario}
                onChange={(e) => setCurrentScenario(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="beginner">Beginner (Level 1-2)</option>
                <option value="intermediate">Intermediate (Level 3-5)</option>
                <option value="advanced">Advanced (Level 6-8)</option>
                <option value="expert">Expert (Level 9+)</option>
              </select>
              
              <button
                onClick={loadTestData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Test Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Test Controls
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={testXPGain}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span>Test XP Gain</span>
            </button>
            
            <button
              onClick={testLevelUp}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              <Trophy className="w-4 h-4" />
              <span>Test Level Up</span>
            </button>
            
            <button
              onClick={testLevelUpToast}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              <Target className="w-4 h-4" />
              <span>Test Toast</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Page</span>
            </button>
          </div>
        </div>

        {/* Current Data Display */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Current Test Data ({currentScenario})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="font-medium text-blue-700 dark:text-blue-300">Level</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {userLevel.level}
              </div>
              <div className="text-blue-600 dark:text-blue-400">{userLevel.title}</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="font-medium text-green-700 dark:text-green-300">Total XP</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {userLevel.totalXP.toLocaleString()}
              </div>
              <div className="text-green-600 dark:text-green-400">
                {Math.round(userLevel.progress * 100)}% to next
              </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <div className="font-medium text-orange-700 dark:text-orange-300">Streak</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {userStreak.currentStreak}
              </div>
              <div className="text-orange-600 dark:text-orange-400">days</div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="font-medium text-purple-700 dark:text-purple-300">Achievements</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {userStats.achievementsUnlocked}
              </div>
              <div className="text-purple-600 dark:text-purple-400">
                of {userStats.totalAchievements}
              </div>
            </div>
          </div>
        </div>

        {/* Component Tests */}
        <div className="space-y-8">
          {/* XP Progress Bars */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              XP Progress Bars
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Standard Progress Bar
                </h3>
                <XPProgressBar
                  userLevel={userLevel}
                  recentXPGain={recentXPGain}
                  showAnimation={true}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Compact Progress Bar
                </h3>
                <CompactXPProgressBar
                  userLevel={userLevel}
                  recentXPGain={recentXPGain}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Detailed Progress Bar
                </h3>
                <DetailedXPProgressBar
                  userLevel={userLevel}
                  recentXPGain={recentXPGain}
                />
              </div>
            </div>
          </div>

          {/* Level Badges */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Level Badges
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Minimal
                </h3>
                <LevelBadge
                  userLevel={userLevel}
                  variant="minimal"
                  size="md"
                />
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Compact
                </h3>
                <LevelBadge
                  userLevel={userLevel}
                  variant="compact"
                  size="md"
                  showTitle={true}
                />
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Animated
                </h3>
                <AnimatedLevelBadge
                  userLevel={userLevel}
                  size="md"
                />
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Clickable
                </h3>
                <ClickableLevelBadge
                  userLevel={userLevel}
                  size="md"
                  onClick={() => alert('Badge clicked!')}
                />
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                Detailed Badge
              </h3>
              <div className="flex justify-center">
                <DetailedLevelBadge
                  userLevel={userLevel}
                  size="xl"
                />
              </div>
            </div>
          </div>

          {/* Gamification Dashboard */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Gamification Dashboard
            </h2>
            
            <GamificationDashboard
              userLevel={userLevel}
              userStats={userStats}
              userStreak={userStreak}
              recentAchievements={[]} // Would be populated with actual achievements
              recentXPGain={recentXPGain}
              levelUpData={levelUpData}
              onLevelUpClose={() => setShowLevelUpCelebration(false)}
              onShareLevelUp={() => alert('Sharing level up!')}
            />
          </div>

          {/* Compact Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Compact Summary
            </h2>
            
            <div className="max-w-md">
              <CompactGamificationSummary
                userLevel={userLevel}
                userStreak={userStreak}
                recentXPGain={recentXPGain}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Level Up Celebration Modal */}
      <LevelUpCelebration
        isOpen={showLevelUpCelebration}
        levelUpData={levelUpData}
        onClose={() => setShowLevelUpCelebration(false)}
        onShare={() => {
          alert('Sharing level up achievement!');
          setShowLevelUpCelebration(false);
        }}
      />

      {/* Level Up Toast */}
      <LevelUpToast
        isVisible={showLevelUpToast}
        levelUpData={levelUpData}
        onClose={() => setShowLevelUpToast(false)}
        duration={4000}
      />
    </div>
  );
};

export default GamificationTestPage;