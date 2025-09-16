import React, { useState, useEffect } from 'react';
import { UserPlus, Heart, MessageCircle, Users, Zap, Search, X, Trophy, Target, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { LeagueViewDuolingo } from '@/components/social/LeagueViewDuolingo';
import { LeagueTest } from '@/components/social/LeagueTest';
import { LeagueUnavailable } from '@/components/social/LeagueUnavailable';
import { getLeagueAccessStatus } from '@/utils/leagueEligibility';
import { useAuthStore } from '@/stores';
import { hasFeatureAccess } from '@/utils/featureAccess';
import { useNavigate } from 'react-router-dom';
// import { ChallengeCreator } from '@/components/challenges/ChallengeCreator';
// import { RealTimeLeaderboard } from '@/components/challenges/RealTimeLeaderboard';
// import { ChallengeRewardsSystem } from '@/components/challenges/ChallengeRewardsSystem';
// import { useChallengeStore } from '@/stores/useChallengeStore';

export const Social: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Check if user has access to social features
  const hasSocialAccess = hasFeatureAccess(user, 'socialFeed');
  
  // If no social access, show upgrade prompt
  if (!hasSocialAccess) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground text-center">
          Social Hub
        </h1>
        
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Social Features Available for Registered Users
            </h2>
            
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Connect with gym friends, share your progress, join challenges, and compete in leagues. 
              Create a free account to unlock the full social experience!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-lg mx-auto">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Connect with Friends</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">Add gym buddies and see their progress</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Join Competitions</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">Compete in leagues and challenges</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">Share Progress</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Post workouts and celebrate wins</p>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">Create Challenges</h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">Challenge friends to fitness goals</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/auth', { state: { forceSelection: true } })}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Create Free Account
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
              >
                Continue as Guest
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'friends'>('feed');
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [leagueAccess, setLeagueAccess] = useState<any>(null);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  // const { challenges, activeChallenges } = useChallengeStore();
  const activeChallenges: any[] = []; // Temporary placeholder

  useEffect(() => {
    // Check league access status
    const totalRegisteredUsers = 25; // This would come from your user service
    const userWorkoutCount = 1; // This would come from user's workout history
    
    const accessStatus = getLeagueAccessStatus(user, totalRegisteredUsers, userWorkoutCount);
    setLeagueAccess(accessStatus);
    
    // If leagues are available and user was trying to access them, switch to leagues tab
    if (accessStatus.canAccess && activeTab === 'leagues') {
      // Keep leagues tab active
    } else if (!accessStatus.canAccess && activeTab === 'leagues') {
      // Switch to feed tab if leagues aren't available
      setActiveTab('feed');
    }
  }, [user, activeTab]);

  const handleAddFriend = (username: string) => {
    // TODO: Implement actual friend request functionality
    console.log('Sending friend request to:', username);
    alert(`Friend request sent to ${username}!`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground text-center">
        Social Hub
      </h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <Button
          variant={activeTab === 'feed' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('feed')}
          className="flex-1"
        >
          <Zap className="w-4 h-4 mr-2" />
          Feed
        </Button>
        <Button
          variant={activeTab === 'challenges' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('challenges')}
          className="flex-1"
        >
          <Target className="w-4 h-4 mr-2" />
          Challenges
        </Button>
        <Button
          variant={activeTab === 'friends' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('friends')}
          className="flex-1"
        >
          <Users className="w-4 h-4 mr-2" />
          Friends
        </Button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          {/* Create Challenge Button */}
          <Button 
            variant="primary" 
            size="lg" 
            fullWidth
            icon={<Target className="w-5 h-5" />}
            className="h-14"
            onClick={() => setShowCreateChallenge(true)}
          >
            Create New Challenge
          </Button>

          {/* Active Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Active Challenges
                {activeChallenges.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {activeChallenges.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeChallenges.length > 0 ? (
                <div className="space-y-3">
                  {activeChallenges.map((challenge) => (
                    <div key={challenge.id} className="p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground">{challenge.name}</h4>
                        <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {challenge.participants.length} participants
                        </span>
                        <span className="text-muted-foreground">
                          Ends {new Date(challenge.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No active challenges</p>
                  <p className="text-sm text-muted-foreground">
                    Create or join challenges to compete with friends
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real-time Leaderboard */}
          {activeChallenges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Live Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Leaderboard coming soon...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Challenge Rewards */}
          <Card>
            <CardHeader>
              <CardTitle>Challenge Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground">Rewards system coming soon...</p>
              </div>
            </CardContent>
          </Card>

          {/* Legacy Leagues (if available) */}
          {leagueAccess?.canAccess && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                  Leagues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LeagueViewDuolingo />
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {activeTab === 'feed' && (
        <div className="space-y-6">
          {/* Show League Unavailable message if leagues aren't accessible */}
          {leagueAccess && !leagueAccess.canAccess && leagueAccess.message && (
            <LeagueUnavailable
              title={leagueAccess.message.title}
              message={leagueAccess.message.message}
              action={leagueAccess.message.action}
              currentUsers={leagueAccess.eligibilityResult.currentUsers}
              minimumUsers={leagueAccess.eligibilityResult.minimumUsers}
            />
          )}

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-muted-foreground" />
                Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">U</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">You</p>
                      <p className="text-sm text-muted-foreground">Just joined!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                      <Heart className="w-4 h-4" />
                      0
                    </button>
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      0
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Challenge Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-muted-foreground" />
                  Challenges
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('challenges')}
                >
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeChallenges.length > 0 ? (
                <div className="space-y-2">
                  {activeChallenges.slice(0, 2).map((challenge) => (
                    <div key={challenge.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{challenge.name}</span>
                        <span className="text-xs text-green-600">Active</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {challenge.participants.length} participants
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">No active challenges</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('challenges')}
                  >
                    Create Challenge
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Add Friends */}
          <Button 
            variant="secondary" 
            size="lg" 
            fullWidth
            icon={<UserPlus className="w-5 h-5" />}
            className="h-14"
            onClick={() => setShowAddFriends(true)}
          >
            Add Gym Friends
          </Button>
          
          {/* Gym Friends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                Gym Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">No gym friends yet</p>
                <p className="text-sm text-muted-foreground">
                  Add friends to see their workouts and achievements
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Friends Modal */}
      {showAddFriends && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Add Gym Friends</h2>
              <button
                onClick={() => setShowAddFriends(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Sample Users */}
              <div className="space-y-3">
                {[
                  { username: 'fitness_mike', name: 'Mike Johnson', mutual: 2 },
                  { username: 'sarah_lifts', name: 'Sarah Wilson', mutual: 5 },
                  { username: 'gym_buddy_alex', name: 'Alex Chen', mutual: 1 },
                  { username: 'strong_emma', name: 'Emma Davis', mutual: 3 }
                ].filter(user => 
                  !searchQuery || 
                  user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(user => (
                  <div key={user.username} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-bold">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                        <div className="text-xs text-muted-foreground">{user.mutual} mutual friends</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddFriend(user.username)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>

              {searchQuery && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    Can't find your friend? Share your username: <strong>@your_username</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Challenge Modal */}
      {showCreateChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Create Challenge</h2>
              <button
                onClick={() => setShowCreateChallenge(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-center py-4">
                <p className="text-muted-foreground">Challenge creator coming soon...</p>
                <Button onClick={() => setShowCreateChallenge(false)} className="mt-4">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};