import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Target, 
  Award,
  Search,
  TrendingUp,
  Plus,
  Crown,
  Zap
} from 'lucide-react';
import { ChallengeList } from '@/components/challenges/ChallengeList';
import { ChallengeCreator } from '@/components/challenges/ChallengeCreator';
import { RealTimeLeaderboard } from '@/components/challenges/RealTimeLeaderboard';
import { ChallengeRewardsSystem } from '@/components/challenges/ChallengeRewardsSystem';
import { useAuthStore } from '@/stores/useAuthStore';
import type { CreateChallengeRequest } from '@/types/challenges';

// Mock data for demonstration
const mockChallenges = [
  {
    id: 'challenge_1',
    name: '30-Day Push-Up Challenge',
    description: 'Complete 1000 push-ups in 30 days',
    type: 'individual' as const,
    category: 'strength' as const,
    difficulty: 'intermediate' as const,
    duration_days: 30,
    start_date: new Date(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    is_active: true,
    participant_count: 15,
    max_participants: 50,
    created_by: 'user_1',
    created_at: new Date(),
    updated_at: new Date(),
    rules: {
      target_value: 1000,
      target_unit: 'reps',
      exercise_ids: ['push_up'],
      verification_required: false
    },
    rewards: {
      xp_base: 500,
      xp_bonus: 200,
      achievements: ['push_up_master'],
      badges: ['30_day_warrior']
    }
  },
  {
    id: 'challenge_2',
    name: 'Weekly Squat Competition',
    description: 'Who can squat the most weight this week?',
    type: 'group' as const,
    category: 'strength' as const,
    difficulty: 'advanced' as const,
    duration_days: 7,
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    is_active: true,
    participant_count: 8,
    max_participants: 20,
    created_by: 'user_2',
    created_at: new Date(),
    updated_at: new Date(),
    rules: {
      target_value: 0,
      target_unit: 'kg',
      exercise_ids: ['squat'],
      verification_required: true
    },
    rewards: {
      xp_base: 300,
      xp_bonus: 500,
      achievements: ['squat_champion'],
      badges: ['weekly_winner']
    }
  }
];

const ChallengeHub: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'browse' | 'my-challenges' | 'leaderboards'>('browse');
  const [showCreator, setShowCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock user participation data
  const userParticipants = new Map([
    ['challenge_1', {
      id: 'participant_1',
      challenge_id: 'challenge_1',
      user_id: user?.id || 'current_user',
      joined_at: new Date(),
      progress: 450,
      is_completed: false,
      rank: 3
    }]
  ]);

  // Mock leaderboard data
  const leaderboards = new Map([
    ['challenge_1', {
      challenge_id: 'challenge_1',
      participants: [
        {
          id: 'participant_1',
          user_id: 'user_1',
          username: 'FitnessKing',
          display_name: 'Alex Johnson',
          progress: 650,
          rank: 1,
          is_current_user: false
        },
        {
          id: 'participant_2',
          user_id: 'user_2',
          username: 'StrengthQueen',
          display_name: 'Maria Garcia',
          progress: 520,
          rank: 2,
          is_current_user: false
        },
        {
          id: 'participant_3',
          user_id: user?.id || 'current_user',
          username: user?.username || 'You',
          display_name: user?.profile.display_name || 'You',
          progress: 450,
          rank: 3,
          is_current_user: true
        }
      ],
      last_updated: new Date()
    }]
  ]);

  const handleJoinChallenge = async (challengeId: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    // In real implementation, this would update the store
  };

  const handleCreateChallenge = async (challengeData: CreateChallengeRequest) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setShowCreator(false);
    setActiveTab('my-challenges');
  };

  const userChallenges = mockChallenges.filter(challenge => 
    userParticipants.has(challenge.id)
  );

  const challengeStats = {
    total: mockChallenges.length,
    participating: userChallenges.length,
    completed: userChallenges.filter(c => {
      const participant = userParticipants.get(c.id);
      return participant?.is_completed;
    }).length,
    invitations: 0
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Challenge Hub
                </h1>
                <p className="text-sm text-muted-foreground">
                  Compete, achieve, and grow with your gym friends
                </p>
              </div>
            </div>

            {user?.role !== 'guest' && (
              <button
                onClick={() => setShowCreator(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Create Challenge</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Target className="w-6 h-6 text-blue-600" />}
            title="Total Challenges"
            value={challengeStats.total}
            subtitle="Available to join"
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-green-600" />}
            title="Participating"
            value={challengeStats.participating}
            subtitle="Active challenges"
          />
          <StatCard
            icon={<Trophy className="w-6 h-6 text-yellow-600" />}
            title="Completed"
            value={challengeStats.completed}
            subtitle="Finished challenges"
          />
          <StatCard
            icon={<Award className="w-6 h-6 text-purple-600" />}
            title="Rank Points"
            value={1250}
            subtitle="Total earned"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-muted rounded-lg p-1 mb-8">
          {[
            { key: 'browse', label: 'Browse Challenges', icon: <Search className="w-4 h-4" /> },
            { key: 'my-challenges', label: 'My Challenges', icon: <Users className="w-4 h-4" /> },
            { key: 'leaderboards', label: 'Live Leaderboards', icon: <TrendingUp className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'browse' | 'my-challenges' | 'leaderboards')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'browse' && (
            <div>
              <ChallengeList
                challenges={mockChallenges}
                userParticipants={userParticipants}
                onJoinChallenge={handleJoinChallenge}
                onViewChallenge={(id) => console.log('View challenge:', id)}
                isLoading={isLoading}
                showFilters={true}
              />
            </div>
          )}

          {activeTab === 'my-challenges' && (
            <div className="space-y-6">
              {userChallenges.length > 0 ? (
                <>
                  <ChallengeList
                    challenges={userChallenges}
                    userParticipants={userParticipants}
                    onViewChallenge={(id) => console.log('View challenge:', id)}
                    showFilters={false}
                    emptyStateMessage="You haven't joined any challenges yet"
                  />
                  
                  {/* Progress and Rewards */}
                  {userChallenges.map(challenge => {
                    const participant = userParticipants.get(challenge.id);
                    if (!participant) return null;
                    
                    return (
                      <div key={challenge.id} className="bg-card rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                          Progress in "{challenge.name}"
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-medium">
                              {participant.progress} / {challenge.rules.target_value} {challenge.rules.target_unit}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min((participant.progress / challenge.rules.target_value) * 100, 100)}%` 
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Rank: #{participant.rank}</span>
                            <span className="text-primary font-medium">
                              {Math.round((participant.progress / challenge.rules.target_value) * 100)}% Complete
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No challenges yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Join your first challenge to start competing with friends!
                  </p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                  >
                    Browse Challenges
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leaderboards' && (
            <div className="space-y-6">
              {Array.from(leaderboards.entries()).map(([challengeId, leaderboard]) => {
                const challenge = mockChallenges.find(c => c.id === challengeId);
                if (!challenge) return null;

                return (
                  <div key={challengeId} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-foreground">
                        {challenge.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Crown className="w-4 h-4" />
                        <span>Live Rankings</span>
                      </div>
                    </div>
                    
                    <RealTimeLeaderboard
                      challengeId={challengeId}
                      entries={leaderboard.participants}
                      currentUserId={user?.id || 'current_user'}
                      onRefresh={() => console.log('Refresh leaderboard:', challengeId)}
                      variant="live"
                      maxEntries={10}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Challenge Creator Modal */}
      {showCreator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <ChallengeCreator
              onCreateChallenge={handleCreateChallenge}
              onCancel={() => setShowCreator(false)}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Stats card component
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle }) => (
  <div className="bg-card rounded-xl shadow-lg p-6">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-muted rounded-lg">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">
          {title}
        </h3>
        <div className="text-2xl font-bold text-foreground">
          {value}
        </div>
        <p className="text-xs text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </div>
  </div>
);

export { ChallengeHub };