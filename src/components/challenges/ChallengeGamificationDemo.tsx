// Challenge Gamification Demo - Comprehensive demonstration of gamification integration
// Demonstrates task 14.3 - Complete challenge gamification integration

import React, { useState, useEffect } from 'react';
import { Challenge, ChallengeParticipant } from '../../types/challenges';
import { challengeService } from '../../services/challengeService';
import { challengeIntegrationService } from '../../services/challengeIntegrationService';
import { challengeRewardsManager, RewardCalculationResult } from '../../services/challengeRewardsManager';
import { CelebrationData } from '../../services/challengeGamificationService';
import { CHALLENGE_TEMPLATES } from '../../constants/challenges';

import ChallengeCard from './ChallengeCard';
import ChallengeCelebration from './ChallengeCelebration';
import ChallengeRewards from './ChallengeRewards';
import ChallengeXPProgress from './ChallengeXPProgress';
import EpicWinnerCelebration from './EpicWinnerCelebration';

interface DemoState {
  challenge: Challenge | null;
  participant: ChallengeParticipant | null;
  userXP: number;
  userLevel: number;
  currentCelebration: CelebrationData | null;
  showWinnerCelebration: boolean;
  rewardResult: RewardCalculationResult | null;
  milestones: any[];
  specialEvents: any[];
}

export const ChallengeGamificationDemo: React.FC = () => {
  const [demoState, setDemoState] = useState<DemoState>({
    challenge: null,
    participant: null,
    userXP: 1250,
    userLevel: 8,
    currentCelebration: null,
    showWinnerCelebration: false,
    rewardResult: null,
    milestones: [],
    specialEvents: []
  });

  const [activeDemo, setActiveDemo] = useState<'join' | 'progress' | 'complete' | 'winner'>('join');
  const [isLoading, setIsLoading] = useState(false);

  const currentUserId = 'demo_user_123';

  // Initialize demo challenge
  useEffect(() => {
    initializeDemoChallenge();
  }, []);

  const initializeDemoChallenge = async () => {
    try {
      // Create a demo challenge
      const template = CHALLENGE_TEMPLATES[0]; // 7-Day Consistency Challenge
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const challenge = await challengeService.createChallenge({
        ...template,
        start_date: startDate,
        end_date: endDate
      }, 'demo_admin');

      // Simulate some participants
      challenge.participants_count = 45;

      setDemoState(prev => ({ ...prev, challenge }));
    } catch (error) {
      console.error('Failed to initialize demo challenge:', error);
    }
  };

  // Demo: Join Challenge with Gamification
  const demoJoinChallenge = async () => {
    if (!demoState.challenge) return;
    
    setIsLoading(true);
    try {
      // Use integration service for enhanced joining
      const result = await challengeIntegrationService.joinChallengeWithIntegration(
        demoState.challenge.id,
        currentUserId
      );

      // Update state
      setDemoState(prev => ({
        ...prev,
        participant: result.participant,
        currentCelebration: result.celebration,
        userXP: prev.userXP + (result.celebration.xp_gained || 0)
      }));

    } catch (error) {
      console.error('Failed to join challenge:', error);
      // Fallback to regular join
      const result = await challengeService.joinChallenge({
        challenge_id: demoState.challenge.id,
        user_id: currentUserId
      });

      setDemoState(prev => ({
        ...prev,
        participant: result.participant,
        currentCelebration: result.celebration,
        userXP: prev.userXP + (result.celebration.xp_gained || 0)
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Demo: Progress Update with Milestones
  const demoProgressUpdate = async () => {
    if (!demoState.participant) return;

    setIsLoading(true);
    try {
      // Simulate progress update
      const result = await challengeIntegrationService.updateProgressWithIntegration({
        participant_id: demoState.participant.id,
        requirement_id: demoState.challenge!.requirements[0].id,
        value_increment: 2, // Complete 2 workouts
        activity_data: { workout_ids: ['workout_1', 'workout_2'] }
      });

      // Update participant progress
      const updatedParticipant = {
        ...demoState.participant,
        progress: Math.min(demoState.participant.progress + 30, 100),
        current_value: demoState.participant.current_value + 2,
        rank: Math.max(demoState.participant.rank - 5, 1)
      };

      setDemoState(prev => ({
        ...prev,
        participant: updatedParticipant,
        currentCelebration: result.celebration || null,
        milestones: result.milestones || [],
        specialEvents: result.specialEvents || [],
        userXP: prev.userXP + (result.celebration?.xp_gained || 0)
      }));

    } catch (error) {
      console.error('Failed to update progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo: Challenge Completion with Rewards
  const demoCompleteChallenge = async () => {
    if (!demoState.challenge || !demoState.participant) return;

    setIsLoading(true);
    try {
      // Complete the participant
      const completedParticipant = {
        ...demoState.participant,
        progress: 100,
        current_value: 7,
        rank: 3, // Podium finish
        is_completed: true,
        completion_date: new Date()
      };

      // Calculate comprehensive rewards
      const performanceMetrics = challengeRewardsManager.createPerformanceMetrics(
        demoState.challenge,
        completedParticipant,
        [{ current_value: 7, target_value: 7, is_completed: true }]
      );

      const rewardResult = await challengeRewardsManager.calculateRewards(
        demoState.challenge,
        completedParticipant,
        performanceMetrics
      );

      // Create completion celebration
      const celebration: CelebrationData = {
        type: 'challenge_completed',
        title: 'Challenge Completed! 🎉',
        message: `Congratulations! You finished "${demoState.challenge.name}" in 3rd place!`,
        xp_gained: rewardResult.total_xp,
        achievements: rewardResult.achievements_unlocked.map(id => ({
          achievement_id: id,
          name: 'Podium Finisher',
          description: 'Finished in the top 3',
          xp_reward: 250,
          rarity: 'epic' as const
        })),
        visual_effects: {
          confetti: true,
          fireworks: true,
          glow: true,
          sound: 'victory_fanfare'
        }
      };

      setDemoState(prev => ({
        ...prev,
        participant: completedParticipant,
        currentCelebration: celebration,
        rewardResult,
        userXP: prev.userXP + rewardResult.total_xp,
        userLevel: prev.userLevel + (rewardResult.total_xp > 500 ? 1 : 0)
      }));

    } catch (error) {
      console.error('Failed to complete challenge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Demo: Winner Celebration
  const demoWinnerCelebration = () => {
    if (!demoState.challenge || !demoState.participant) return;

    const winnerParticipant = {
      ...demoState.participant,
      progress: 100,
      rank: 1,
      is_completed: true,
      completion_date: new Date()
    };

    const winnerCelebration: CelebrationData = {
      type: 'challenge_completed',
      title: 'CHAMPION! 👑',
      message: `You are the champion of "${demoState.challenge.name}"!`,
      xp_gained: 1500,
      achievements: [{
        achievement_id: 'champion',
        name: 'Challenge Champion',
        description: 'Won a challenge!',
        xp_reward: 1000,
        rarity: 'legendary' as const
      }],
      visual_effects: {
        confetti: true,
        fireworks: true,
        glow: true,
        sound: 'champion_fanfare'
      }
    };

    setDemoState(prev => ({
      ...prev,
      participant: winnerParticipant,
      showWinnerCelebration: true,
      currentCelebration: winnerCelebration,
      userXP: prev.userXP + 1500,
      userLevel: prev.userLevel + 2
    }));
  };

  const renderDemoContent = () => {
    switch (activeDemo) {
      case 'join':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🚀 Challenge Joining with Gamification
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Experience enhanced challenge joining with XP rewards, achievements, and celebrations
              </p>
            </div>

            {demoState.challenge && (
              <div className="max-w-md mx-auto">
                <ChallengeCard
                  challenge={demoState.challenge}
                  userParticipant={demoState.participant || undefined}
                  onJoin={demoJoinChallenge}
                />
              </div>
            )}

            <div className="text-center">
              <button
                onClick={demoJoinChallenge}
                disabled={isLoading || !!demoState.participant}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Joining...' : demoState.participant ? 'Already Joined!' : 'Join Challenge'}
              </button>
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                📈 Progress Updates with Milestones
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                See how progress updates trigger milestones, special events, and bonus XP
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <ChallengeXPProgress
                currentXP={demoState.userXP}
                level={demoState.userLevel}
                xpToNextLevel={Math.max(0, (demoState.userLevel + 1) * 300 - demoState.userXP)}
                totalXPForNextLevel={(demoState.userLevel + 1) * 300}
                recentXPGain={0}
                showAnimation={false}
              />
            </div>

            {demoState.participant && (
              <div className="max-w-md mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Current Progress
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Progress:</span>
                      <span className="font-bold">{Math.round(demoState.participant.progress)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rank:</span>
                      <span className="font-bold">#{demoState.participant.rank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Workouts:</span>
                      <span className="font-bold">{demoState.participant.current_value}/7</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={demoProgressUpdate}
                disabled={isLoading || !demoState.participant || demoState.participant.progress >= 100}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Updating...' : 'Complete 2 Workouts (+30% Progress)'}
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🏆 Challenge Completion with Rewards
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Experience comprehensive reward calculation and epic celebrations
              </p>
            </div>

            {demoState.rewardResult && (
              <div className="max-w-2xl mx-auto">
                <ChallengeRewards
                  challenge={demoState.challenge!}
                  userRank={demoState.participant?.rank}
                  isCompleted={true}
                  earnedRewards={demoState.rewardResult.base_rewards}
                />
              </div>
            )}

            <div className="text-center">
              <button
                onClick={demoCompleteChallenge}
                disabled={isLoading || !demoState.participant}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Completing...' : 'Complete Challenge (3rd Place)'}
              </button>
            </div>
          </div>
        );

      case 'winner':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                👑 Epic Winner Celebration
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Experience the ultimate celebration for challenge champions
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={demoWinnerCelebration}
                disabled={!demoState.challenge}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🏆 Trigger Winner Celebration
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🎮 Challenge Gamification Integration
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Complete demonstration of challenge gamification features
          </p>
        </div>

        {/* Demo Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
            {[
              { key: 'join', label: 'Join Challenge', icon: '🚀', color: 'from-green-500 to-blue-600' },
              { key: 'progress', label: 'Progress & Milestones', icon: '📈', color: 'from-purple-500 to-pink-600' },
              { key: 'complete', label: 'Completion & Rewards', icon: '🏆', color: 'from-orange-500 to-red-600' },
              { key: 'winner', label: 'Winner Celebration', icon: '👑', color: 'from-yellow-500 to-orange-600' }
            ].map(demo => (
              <button
                key={demo.key}
                onClick={() => setActiveDemo(demo.key as any)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeDemo === demo.key
                    ? `bg-gradient-to-r ${demo.color} text-white shadow-lg`
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{demo.icon}</span>
                {demo.label}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Content */}
        <div className="mb-8">
          {renderDemoContent()}
        </div>

        {/* User Stats Display */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Current User Stats
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {demoState.userXP.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total XP
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {demoState.userLevel}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current Level
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {demoState.milestones.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Milestones
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {demoState.specialEvents.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Special Events
              </div>
            </div>
          </div>
        </div>

        {/* Regular Celebration Modal */}
        {demoState.currentCelebration && !demoState.showWinnerCelebration && (
          <ChallengeCelebration
            celebration={demoState.currentCelebration}
            onComplete={() => setDemoState(prev => ({ ...prev, currentCelebration: null }))}
            autoClose={true}
            autoCloseDelay={4000}
          />
        )}

        {/* Epic Winner Celebration Modal */}
        {demoState.showWinnerCelebration && demoState.challenge && demoState.participant && demoState.currentCelebration && (
          <EpicWinnerCelebration
            challenge={demoState.challenge}
            participant={demoState.participant}
            celebration={demoState.currentCelebration}
            onComplete={() => setDemoState(prev => ({ 
              ...prev, 
              showWinnerCelebration: false, 
              currentCelebration: null 
            }))}
          />
        )}
      </div>
    </div>
  );
};

export default ChallengeGamificationDemo;