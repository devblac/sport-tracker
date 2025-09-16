/**
 * WorkoutRewardsModal - Shows comprehensive rewards after workout completion
 * 
 * Displays XP earned, level ups, achievements unlocked, streak updates,
 * and challenge progress in an engaging, celebratory interface.
 */

import React, { useState, useEffect } from 'react';
import { X, Zap, TrendingUp, Award, Target, Trophy, Flame } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import type { WorkoutCompletionResult } from '@/services/WorkoutCompletionService';

interface WorkoutRewardsModalProps {
  result: WorkoutCompletionResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkoutRewardsModal: React.FC<WorkoutRewardsModalProps> = ({
  result,
  isOpen,
  onClose
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0);

  // Trigger celebration animation when modal opens
  useEffect(() => {
    if (isOpen && result?.success) {
      setShowCelebration(true);
      setCurrentRewardIndex(0);
      
      // Auto-advance through rewards
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, result]);

  if (!isOpen || !result) return null;

  const totalXP = result.xpResult?.xpAwarded || 0;
  const hasRewards = totalXP > 0 || 
                    result.xpResult?.levelUp || 
                    (result.xpResult?.achievementsUnlocked && result.xpResult.achievementsUnlocked.length > 0) ||
                    (result.streakUpdate && result.streakUpdate.currentStreak > 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Celebration Animation Overlay */}
        {showCelebration && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-purple-600/20 rounded-xl flex items-center justify-center z-10">
            <div className="text-6xl animate-bounce">🎉</div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Workout Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {hasRewards ? 'Check out your rewards!' : 'Great job finishing your workout!'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* XP Earned */}
          {totalXP > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">XP Earned</h3>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      +{totalXP}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total XP</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {result.xpResult?.newTotalXP || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Level Up */}
          {result.xpResult?.levelUp && (
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Level Up!</h3>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      Level {result.xpResult.levelUp.newLevel}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {result.xpResult.levelUp.newTitle}
                    </p>
                  </div>
                  <div className="text-4xl">🚀</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements Unlocked */}
          {result.xpResult?.achievementsUnlocked && result.xpResult.achievementsUnlocked.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Achievements Unlocked
              </h3>
              {result.xpResult.achievementsUnlocked.map((achievement) => (
                <Card key={achievement.id} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {achievement.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Zap className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            +{achievement.rewards.xp} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Streak Update */}
          {result.streakUpdate && result.streakUpdate.currentStreak > 0 && (
            <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-red-200 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Streak Updated</h3>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {result.streakUpdate.currentStreak} days
                    </p>
                    {result.streakUpdate.currentStreak === result.streakUpdate.longestStreak && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        🏆 New personal record!
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Best Streak</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {result.streakUpdate.longestStreak} days
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Challenge Updates */}
          {result.challengeUpdates && result.challengeUpdates.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-500" />
                Challenge Progress
              </h3>
              {result.challengeUpdates.map((update, index) => (
                <Card key={update.challengeId} className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            Challenge Progress
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {update.completed ? 'Completed!' : `${Math.round(update.newProgress * 100)}% complete`}
                          </p>
                        </div>
                      </div>
                      {update.completed && (
                        <div className="text-2xl">🎉</div>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(update.newProgress * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Goal Updates */}
          {result.goalUpdates && result.goalUpdates.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Goals Updated
              </h3>
              {result.goalUpdates.map((goal, index) => (
                <Card key={goal.goalId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Goal Progress
                      </span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {Math.round(goal.newProgress * 100)}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(goal.newProgress * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Rewards Message */}
          {!hasRewards && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">💪</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Great Workout!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Keep up the consistency to unlock rewards and achievements!
              </p>
            </div>
          )}

          {/* Continue Button */}
          <div className="pt-4">
            <Button
              onClick={onClose}
              variant="primary"
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutRewardsModal;