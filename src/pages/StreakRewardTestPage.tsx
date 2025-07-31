/**
 * Streak Reward Test Page
 * 
 * Test page for demonstrating the integrated streak reward system.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStreaks } from '@/hooks/useStreaks';
import { useStreakRewards } from '@/hooks/useStreakRewards';
import { StreakDisplay } from '@/components/streaks/StreakDisplay';
import { StreakRewards } from '@/components/streaks/StreakRewards';
import { StreakShieldManager } from '@/components/streaks/StreakShieldManager';
import { StreakRewardNotifications } from '@/components/streaks/StreakRewardNotifications';

const TEST_USER_ID = 'test-user-streak-rewards';

export const StreakRewardTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'shields' | 'notifications'>('overview');

  const {
    schedule,
    period,
    stats,
    markSickDay,
    markVacationDay,
    compensateDay,
    recordWorkout,
    isLoading: streaksLoading
  } = useStreaks(TEST_USER_ID);

  const {
    userRewards,
    activeTitle,
    availableShields,
    activeShields,
    notifications,
    unreadNotifications,
    currentXPMultiplier,
    checkForNewRewards,
    isLoading: rewardsLoading
  } = useStreakRewards(TEST_USER_ID);

  const handleRecordWorkout = async (date: string) => {
    await recordWorkout(date);
    // Check for new rewards after recording workout
    await checkForNewRewards();
  };

  const handleShieldUsed = (shieldName: string) => {
    console.log(`Shield used: ${shieldName}`);
  };

  if (streaksLoading || rewardsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading streak rewards...</p>
        </div>
      </div>
    );
  }

  if (!schedule || !period || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Streak Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please set up a streak schedule first.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', count: null },
    { id: 'rewards', label: 'Rewards', count: userRewards?.titles.length || 0 },
    { id: 'shields', label: 'Shields', count: availableShields.length },
    { id: 'notifications', label: 'Notifications', count: unreadNotifications }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Streak Rewards System
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Integrated streak tracking with rewards, titles, and shields
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {stats.currentStreak}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Current Streak
                  </div>
                </div>
                
                {currentXPMultiplier > 1 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {currentXPMultiplier.toFixed(1)}x
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      XP Multiplier
                    </div>
                  </div>
                )}
                
                {activeTitle && (
                  <div className="text-center">
                    <div className="text-lg">{activeTitle.icon}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 max-w-20 truncate">
                      {activeTitle.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors relative
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
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
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Main Streak Display */}
              <StreakDisplay
                userId={TEST_USER_ID}
                schedule={schedule}
                period={period}
                stats={stats}
                onMarkSickDay={markSickDay}
                onMarkVacationDay={markVacationDay}
                onCompensateDay={compensateDay}
                onRecordWorkout={handleRecordWorkout}
              />

              {/* Quick Rewards Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Recent Notifications
                  </h2>
                  <StreakRewardNotifications
                    userId={TEST_USER_ID}
                    maxNotifications={3}
                    showOnlyUnread={false}
                  />
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Active Protections
                  </h2>
                  {activeShields.length > 0 ? (
                    <div className="space-y-3">
                      {activeShields.map((shield) => (
                        <div
                          key={shield.id}
                          className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{shield.icon}</span>
                              <div>
                                <p className="font-medium text-blue-900 dark:text-blue-100">
                                  {shield.name}
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  {shield.usesRemaining} uses remaining
                                </p>
                              </div>
                            </div>
                            {shield.expiresAt && (
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                Expires: {new Date(shield.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No active shields
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <StreakRewards userId={TEST_USER_ID} />
          )}

          {activeTab === 'shields' && (
            <StreakShieldManager
              userId={TEST_USER_ID}
              onShieldUsed={handleShieldUsed}
            />
          )}

          {activeTab === 'notifications' && (
            <StreakRewardNotifications
              userId={TEST_USER_ID}
              showOnlyUnread={false}
            />
          )}
        </motion.div>
      </div>

      {/* Debug Panel */}
      <div className="fixed bottom-4 right-4">
        <details className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            Debug Info
          </summary>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs space-y-2 max-w-xs">
            <div>
              <strong>Current Streak:</strong> {stats.currentStreak} days
            </div>
            <div>
              <strong>XP Multiplier:</strong> {currentXPMultiplier.toFixed(2)}x
            </div>
            <div>
              <strong>Active Title:</strong> {activeTitle?.name || 'None'}
            </div>
            <div>
              <strong>Available Shields:</strong> {availableShields.length}
            </div>
            <div>
              <strong>Active Shields:</strong> {activeShields.length}
            </div>
            <div>
              <strong>Unread Notifications:</strong> {unreadNotifications}
            </div>
            <div>
              <strong>Total Titles:</strong> {userRewards?.titles.length || 0}
            </div>
            <div>
              <strong>Longest Streak:</strong> {stats.longestStreak} days
            </div>
            <button
              onClick={checkForNewRewards}
              className="w-full mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Check for Rewards
            </button>
          </div>
        </details>
      </div>
    </div>
  );
};

export default StreakRewardTestPage;