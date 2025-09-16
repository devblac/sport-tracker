/**
 * Viral Content Manager Component
 * 
 * Central component that manages all viral content functionality.
 */

import React, { useState, useEffect } from 'react';
import { useViralContentStore } from '@/stores/useViralContentStore';
import { AutoWorkoutCardGenerator } from './AutoWorkoutCardGenerator';
import { EpicAchievementUnlock } from './EpicAchievementUnlock';
import { ViralRewardsCelebration } from './ViralRewardsCelebration';
import { ViralAnalyticsDashboard } from './ViralAnalyticsDashboard';
import type { Workout } from '@/types/workout';
import type { Achievement } from '@/types/gamification';
import type { ShareableContent } from '@/types/shareableContent';

interface ViralContentManagerProps {
  userId: string;
  currentWorkout?: Workout;
  unlockedAchievement?: Achievement;
  achievementProgress?: {
    current: number;
    total: number;
    unit: string;
  };
}

export const ViralContentManager: React.FC<ViralContentManagerProps> = ({
  userId,
  currentWorkout,
  unlockedAchievement,
  achievementProgress
}) => {
  const {
    showViralCelebration,
    pendingRewards,
    addSharedContent,
    trackContentShare,
    checkForNewRewards,
    hideCelebration,
    clearPendingRewards
  } = useViralContentStore();

  const [showAchievementUnlock, setShowAchievementUnlock] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Handle achievement unlock
  useEffect(() => {
    if (unlockedAchievement && achievementProgress) {
      setShowAchievementUnlock(true);
    }
  }, [unlockedAchievement, achievementProgress]);

  // Auto-check for rewards when content is shared
  const handleContentGenerated = (content: ShareableContent) => {
    addSharedContent(content);
    
    // Simulate some initial engagement for demo purposes
    setTimeout(() => {
      trackContentShare(content.id, 'instagram');
      checkForNewRewards(userId);
    }, 1000);
  };

  const handleContentShared = (contentId: string, platform: any) => {
    trackContentShare(contentId, platform);
    checkForNewRewards(userId);
  };

  const handleClaimAllRewards = () => {
    pendingRewards.forEach(reward => {
      useViralContentStore.getState().claimReward(reward.id);
    });
    clearPendingRewards();
    hideCelebration();
  };

  const handleCloseCelebration = () => {
    hideCelebration();
    clearPendingRewards();
  };

  return (
    <div className="viral-content-manager">
      {/* Auto Workout Card Generator */}
      {currentWorkout && currentWorkout.is_completed && (
        <AutoWorkoutCardGenerator
          workout={currentWorkout}
          userId={userId}
          onCardGenerated={handleContentGenerated}
          autoShow={true}
        />
      )}

      {/* Epic Achievement Unlock */}
      {showAchievementUnlock && unlockedAchievement && achievementProgress && (
        <EpicAchievementUnlock
          achievement={unlockedAchievement}
          userId={userId}
          progress={achievementProgress}
          onClose={() => setShowAchievementUnlock(false)}
          onShare={handleContentGenerated}
        />
      )}

      {/* Viral Rewards Celebration */}
      {showViralCelebration && pendingRewards.length > 0 && (
        <ViralRewardsCelebration
          rewards={pendingRewards}
          onClose={handleCloseCelebration}
          onClaimAll={handleClaimAllRewards}
        />
      )}

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Analytics Virales
              </h2>
              <button
                onClick={() => setShowAnalytics(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>
            <ViralAnalyticsDashboard />
          </div>
        </div>
      )}

      {/* Floating Analytics Button */}
      <button
        onClick={() => setShowAnalytics(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40"
        title="Ver Analytics Virales"
      >
        📊
      </button>

      {/* Viral Score Display */}
      <ViralScoreWidget userId={userId} />
    </div>
  );
};

// Viral Score Widget Component
const ViralScoreWidget: React.FC<{ userId: string }> = ({ userId }) => {
  const { totalViralScore, calculateViralScore } = useViralContentStore();
  const [score, setScore] = useState(totalViralScore);

  useEffect(() => {
    const newScore = calculateViralScore(userId);
    setScore(newScore);
  }, [userId, calculateViralScore]);

  if (score === 0) return null;

  return (
    <div className="fixed top-20 right-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg z-40">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Viral Score:</span>
        <span className="text-lg font-bold">
          {score >= 1000 ? `${(score / 1000).toFixed(1)}K` : score}
        </span>
        <span className="text-lg">🔥</span>
      </div>
    </div>
  );
};

export default ViralContentManager;