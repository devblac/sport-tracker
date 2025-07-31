// Challenge Test Page - Showcase all challenge components
// Test implementation for task 14.2 - Challenge UI components

import React, { useState, useEffect } from 'react';
import { Challenge, ChallengeParticipant, ChallengeLeaderboard } from '../types/challenges';
import { challengeService } from '../services/challengeService';
import { CHALLENGE_TEMPLATES } from '../constants/challenges';
import ChallengeCard from '../components/challenges/ChallengeCard';
import ChallengeList from '../components/challenges/ChallengeList';
import ChallengeLeaderboard from '../components/challenges/ChallengeLeaderboard';
import ChallengeJoinFlow from '../components/challenges/ChallengeJoinFlow';
import ChallengeXPProgress from '../components/challenges/ChallengeXPProgress';
import ChallengeRewards from '../components/challenges/ChallengeRewards';
import ChallengeCelebration from '../components/challenges/ChallengeCelebration';
import { challengeGamificationService, CelebrationData } from '../services/challengeGamificationService';

const ChallengeTestPage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboard | null>(null);
  const [userParticipants, setUserParticipants] = useState<Map<string, ChallengeParticipant>>(new Map());
  const [showJoinFlow, setShowJoinFlow] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'card' | 'leaderboard' | 'join' | 'xp' | 'rewards' | 'celebration'>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [currentCelebration, setCurrentCelebration] = useState<CelebrationData | null>(null);
  const [userXP, setUserXP] = useState(2450);
  const [userLevel, setUserLevel] = useState(5);
  const [recentXPGain, setRecentXPGain] = useState(0);

  // Mock current user ID
  const currentUserId = 'user_123';

  // Initialize with sample challenges
  useEffect(() => {
    initializeSampleChallenges();
  }, []);

  const initializeSampleChallenges = async () => {
    setIsLoading(true);
    try {
      const sampleChallenges: Challenge[] = [];
      
      // Create challenges from templates
      for (let i = 0; i < CHALLENGE_TEMPLATES.length; i++) {
        const template = CHALLENGE_TEMPLATES[i];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + i); // Stagger start dates
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (template.difficulty_level * 7)); // Duration based on difficulty
        
        const challenge = await challengeService.createChallenge({
          ...template,
          start_date: startDate,
          end_date: endDate
        }, 'admin_user');
        
        // Simulate some participants
        const participantCount = Math.floor(Math.random() * 50) + 1;
        challenge.participants_count = participantCount;
        
        sampleChallenges.push(challenge);
      }

      setChallenges(sampleChallenges);
      
      // Set first challenge as selected for demos
      if (sampleChallenges.length > 0) {
        setSelectedChallenge(sampleChallenges[0]);
        
        // Create sample leaderboard
        const sampleLeaderboard = await challengeService.getLeaderboard(sampleChallenges[0].id);
        
        // Add mock participants to leaderboard
        const mockParticipants = Array.from({ length: 10 }, (_, index) => ({
          user_id: `user_${index + 1}`,
          username: `Athlete${index + 1}`,
          avatar_url: undefined,
          rank: index + 1,
          progress: Math.max(0, 100 - (index * 8) - Math.random() * 20),
          current_value: Math.floor(Math.random() * 1000) + 100,
          is_completed: index < 3,
          badge_count: Math.floor(Math.random() * 5)
        }));
        
        sampleLeaderboard.participants = mockParticipants;
        setLeaderboard(sampleLeaderboard);
        
        // Create mock user participants
        const mockUserParticipants = new Map();
        sampleChallenges.forEach((challenge, index) => {
          if (index % 3 === 0) { // User participates in every 3rd challenge
            mockUserParticipants.set(challenge.id, {
              id: `participant_${challenge.id}`,
              challenge_id: challenge.id,
              user_id: currentUserId,
              progress: Math.floor(Math.random() * 80) + 10,
              current_value: Math.floor(Math.random() * 500) + 50,
              rank: Math.floor(Math.random() * 10) + 1,
              joined_at: new Date(),
              last_activity: new Date(),
              is_completed: Math.random() > 0.7
            });
          }
        });
        setUserParticipants(mockUserParticipants);
      }
    } catch (error) {
      console.error('Failed to initialize sample challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const result = await challengeService.joinChallenge({
        challenge_id: challengeId,
        user_id: currentUserId
      });
      
      // Update local state
      setUserParticipants(prev => new Map(prev.set(challengeId, result.participant)));
      
      // Update challenge participant count
      setChallenges(prev => prev.map(c => 
        c.id === challengeId 
          ? { ...c, participants_count: c.participants_count + 1 }
          : c
      ));
      
      // Update user XP and show celebration
      if (result.celebration.xp_gained) {
        setRecentXPGain(result.celebration.xp_gained);
        setUserXP(prev => prev + result.celebration.xp_gained!);
      }
      
      setShowJoinFlow(false);
      setCurrentCelebration(result.celebration);
    } catch (error) {
      console.error('Failed to join challenge:', error);
      alert('Failed to join challenge. Please try again.');
    }
  };

  const handleViewChallenge = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
      setSelectedChallenge(challenge);
      setActiveTab('card');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Challenge List Component
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Browse and filter challenges with advanced search capabilities
              </p>
            </div>
            
            <ChallengeList
              challenges={challenges}
              userParticipants={userParticipants}
              onJoinChallenge={(challengeId) => {
                const challenge = challenges.find(c => c.id === challengeId);
                if (challenge) {
                  setSelectedChallenge(challenge);
                  setShowJoinFlow(true);
                }
              }}
              onViewChallenge={handleViewChallenge}
              isLoading={isLoading}
              showFilters={true}
            />
          </div>
        );

      case 'card':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Challenge Card Component
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Individual challenge display with progress tracking
              </p>
            </div>
            
            {selectedChallenge && (
              <div className="max-w-md mx-auto">
                <ChallengeCard
                  challenge={selectedChallenge}
                  userParticipant={userParticipants.get(selectedChallenge.id)}
                  onJoin={(challengeId) => {
                    setShowJoinFlow(true);
                  }}
                  onView={handleViewChallenge}
                />
              </div>
            )}
            
            <div className="text-center">
              <button
                onClick={() => {
                  const randomIndex = Math.floor(Math.random() * challenges.length);
                  setSelectedChallenge(challenges[randomIndex]);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Show Random Challenge
              </button>
            </div>
          </div>
        );

      case 'leaderboard':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Challenge Leaderboard Component
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time rankings with user progress tracking
              </p>
            </div>
            
            {leaderboard && selectedChallenge && (
              <div className="max-w-2xl mx-auto">
                <ChallengeLeaderboard
                  leaderboard={leaderboard}
                  challenge={selectedChallenge}
                  currentUserId={currentUserId}
                  onUserClick={(userId) => {
                    alert(`Clicked on user: ${userId}`);
                  }}
                  showFullList={false}
                  maxEntries={10}
                />
              </div>
            )}
            
            <div className="text-center">
              <button
                onClick={() => {
                  if (leaderboard) {
                    // Simulate leaderboard update
                    const updatedParticipants = leaderboard.participants.map(p => ({
                      ...p,
                      progress: Math.min(100, p.progress + Math.random() * 10),
                      current_value: p.current_value + Math.floor(Math.random() * 50)
                    })).sort((a, b) => b.progress - a.progress)
                      .map((p, index) => ({ ...p, rank: index + 1 }));
                    
                    setLeaderboard({
                      ...leaderboard,
                      participants: updatedParticipants,
                      last_updated: new Date()
                    });
                  }
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Simulate Progress Update
              </button>
            </div>
          </div>
        );

      case 'join':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Challenge Join Flow Component
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Multi-step challenge joining process with detailed information
              </p>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => setShowJoinFlow(true)}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 font-semibold text-lg"
              >
                Open Join Flow Demo
              </button>
            </div>
          </div>
        );

      case 'xp':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Challenge XP Progress Component
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Track experience points and level progression from challenges
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <ChallengeXPProgress
                currentXP={userXP}
                level={userLevel}
                xpToNextLevel={550}
                totalXPForNextLevel={3000}
                recentXPGain={recentXPGain}
                showAnimation={recentXPGain > 0}
              />
            </div>
            
            <div className="text-center space-x-4">
              <button
                onClick={() => {
                  const xpGain = Math.floor(Math.random() * 200) + 50;
                  setRecentXPGain(xpGain);
                  setUserXP(prev => prev + xpGain);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Simulate XP Gain
              </button>
              <button
                onClick={() => {
                  setUserLevel(prev => prev + 1);
                  setUserXP(prev => prev + 500);
                  setRecentXPGain(500);
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Simulate Level Up
              </button>
            </div>
          </div>
        );

      case 'rewards':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Challenge Rewards Component
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Display and manage challenge rewards based on performance
              </p>
            </div>
            
            {selectedChallenge && (
              <div className="max-w-2xl mx-auto">
                <ChallengeRewards
                  challenge={selectedChallenge}
                  userRank={3}
                  isCompleted={true}
                  earnedRewards={selectedChallenge.rewards.slice(0, 2)}
                  onClaimReward={(rewardId) => {
                    alert(`Claimed reward: ${rewardId}`);
                  }}
                />
              </div>
            )}
            
            <div className="text-center">
              <button
                onClick={() => {
                  const randomIndex = Math.floor(Math.random() * challenges.length);
                  setSelectedChallenge(challenges[randomIndex]);
                }}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
              >
                Show Different Challenge Rewards
              </button>
            </div>
          </div>
        );

      case 'celebration':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Challenge Celebration Component
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Epic celebrations for challenge achievements and milestones
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <button
                onClick={() => setCurrentCelebration({
                  type: 'xp_gained',
                  title: 'XP Gained!',
                  message: 'You earned experience points from your workout!',
                  xp_gained: 150,
                  visual_effects: {
                    confetti: true,
                    fireworks: false,
                    glow: true,
                    sound: 'xp_gain'
                  }
                })}
                className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-semibold">XP Gained</div>
              </button>
              
              <button
                onClick={() => setCurrentCelebration({
                  type: 'achievement_unlocked',
                  title: 'Achievement Unlocked!',
                  message: 'You unlocked a new achievement!',
                  achievements: [{
                    achievement_id: 'test',
                    name: 'Challenge Master',
                    description: 'Complete 5 challenges',
                    xp_reward: 500,
                    rarity: 'epic'
                  }],
                  visual_effects: {
                    confetti: true,
                    fireworks: true,
                    glow: true,
                    sound: 'achievement'
                  }
                })}
                className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
              >
                <div className="text-2xl mb-2">🏆</div>
                <div className="font-semibold">Achievement</div>
              </button>
              
              <button
                onClick={() => setCurrentCelebration({
                  type: 'challenge_completed',
                  title: 'Challenge Completed!',
                  message: 'Congratulations! You finished the 7-Day Consistency Challenge!',
                  xp_gained: 750,
                  visual_effects: {
                    confetti: true,
                    fireworks: true,
                    glow: true,
                    sound: 'victory'
                  }
                })}
                className="p-4 bg-green-100 dark:bg-green-900/20 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
              >
                <div className="text-2xl mb-2">🎉</div>
                <div className="font-semibold">Challenge Complete</div>
              </button>
              
              <button
                onClick={() => setCurrentCelebration({
                  type: 'rank_improved',
                  title: 'Rank Up!',
                  message: 'You climbed the leaderboard!',
                  rank_change: { from: 15, to: 8 },
                  xp_gained: 200,
                  visual_effects: {
                    confetti: true,
                    fireworks: false,
                    glow: true,
                    sound: 'rank_up'
                  }
                })}
                className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
              >
                <div className="text-2xl mb-2">📈</div>
                <div className="font-semibold">Rank Improved</div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Challenge System Components
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Interactive demo of all challenge-related UI components
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg">
            {[
              { key: 'list', label: 'Challenge List', icon: '📋' },
              { key: 'card', label: 'Challenge Card', icon: '🎯' },
              { key: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
              { key: 'join', label: 'Join Flow', icon: '🚀' },
              { key: 'xp', label: 'XP Progress', icon: '⚡' },
              { key: 'rewards', label: 'Rewards', icon: '🎁' },
              { key: 'celebration', label: 'Celebrations', icon: '🎉' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>

        {/* Component Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Component Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {challenges.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sample Challenges
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {userParticipants.size}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                User Participations
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {leaderboard?.participants.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Leaderboard Entries
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                7
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                UI Components
              </div>
            </div>
          </div>
        </div>

        {/* Join Flow Modal */}
        {showJoinFlow && selectedChallenge && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <ChallengeJoinFlow
              challenge={selectedChallenge}
              onJoin={handleJoinChallenge}
              onCancel={() => setShowJoinFlow(false)}
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            />
          </div>
        )}

        {/* Celebration Modal */}
        {currentCelebration && (
          <ChallengeCelebration
            celebration={currentCelebration}
            onComplete={() => {
              setCurrentCelebration(null);
              setRecentXPGain(0);
            }}
            autoClose={true}
            autoCloseDelay={4000}
          />
        )}
      </div>
    </div>
  );
};

export default ChallengeTestPage;