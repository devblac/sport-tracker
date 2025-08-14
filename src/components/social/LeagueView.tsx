import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Users, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { leagueManager, League, LeagueGroup, LeagueParticipant, GlobalLeaderboard } from '@/services/LeagueManager';
import { useAuthStore } from '@/stores';

interface LeagueViewProps {
  className?: string;
}

export const LeagueView: React.FC<LeagueViewProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'my-league' | 'global' | 'friends'>('my-league');
  const [myLeagueGroup, setMyLeagueGroup] = useState<LeagueGroup | null>(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<GlobalLeaderboard[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadLeagueData();
  }, [user]);

  const loadLeagueData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load user's league group
      const userGroup = await leagueManager.getUserLeagueGroup(user.id);
      setMyLeagueGroup(userGroup);

      // Load global leaderboard
      const global = await leagueManager.getGlobalLeaderboard(50);
      setGlobalLeaderboard(global);

      // Load all leagues
      const allLeagues = leagueManager.getAllLeagues();
      setLeagues(allLeagues);
    } catch (error) {
      console.error('Error loading league data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{position}</span>;
    }
  };

  const getCurrentLeague = () => {
    if (!myLeagueGroup) return null;
    return leagues.find(l => l.id === myLeagueGroup.leagueId);
  };

  const renderMyLeague = () => {
    if (!myLeagueGroup || !user) {
      return (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Join your first workout to enter the leagues!</p>
        </div>
      );
    }

    const currentLeague = getCurrentLeague();
    const userParticipant = myLeagueGroup.participants.find(p => p.userId === user.id);
    const timeLeft = Math.max(0, myLeagueGroup.endDate - Date.now());
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

    return (
      <div className="space-y-6">
        {/* League Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <span className="text-4xl">{currentLeague?.icon}</span>
              <div>
                <CardTitle className="text-2xl" style={{ color: currentLeague?.color }}>
                  {currentLeague?.name} League
                </CardTitle>
                <p className="text-sm text-gray-500">{currentLeague?.description}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userParticipant?.weeklyPoints || 0}</div>
                <div className="text-xs text-gray-500">Weekly Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">#{userParticipant?.position || '-'}</div>
                <div className="text-xs text-gray-500">Position</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{daysLeft}</div>
                <div className="text-xs text-gray-500">Days Left</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Promotion/Relegation Zones */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <div className="text-sm font-medium text-green-700 dark:text-green-300">Promotion Zone</div>
                <div className="text-xs text-green-600 dark:text-green-400">Top 5 advance</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600 mx-auto mb-1" />
                <div className="text-sm font-medium text-red-700 dark:text-red-300">Relegation Zone</div>
                <div className="text-xs text-red-600 dark:text-red-400">Bottom 5 drop</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* League Standings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>League Standings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {myLeagueGroup.participants.map((participant, index) => {
                const isCurrentUser = participant.userId === user?.id;
                const isPromotionZone = myLeagueGroup.promotionZone.includes(participant.position);
                const isRelegationZone = myLeagueGroup.relegationZone.includes(participant.position);
                
                return (
                  <div
                    key={participant.userId}
                    className={`flex items-center justify-between p-3 ${
                      isCurrentUser 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    } ${
                      isPromotionZone 
                        ? 'border-l-4 border-green-500' 
                        : isRelegationZone 
                        ? 'border-l-4 border-red-500' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {getPositionIcon(participant.position)}
                      <div className="flex items-center space-x-2">
                        {participant.avatar ? (
                          <img 
                            src={participant.avatar} 
                            alt={participant.username}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold">
                              {participant.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {participant.username}
                            {isCurrentUser && <Badge variant="secondary" className="ml-2 text-xs">You</Badge>}
                            {participant.isFriend && <Badge variant="outline" className="ml-2 text-xs">Friend</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-bold text-sm">{participant.weeklyPoints}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                      {getTrendIcon(participant.trend)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderGlobalLeaderboard = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Global Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {globalLeaderboard.map((player, index) => {
              const league = leagues.find(l => l.id === player.currentLeague);
              const isCurrentUser = player.userId === user?.id;
              
              return (
                <div
                  key={player.userId}
                  className={`flex items-center justify-between p-3 ${
                    isCurrentUser 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getPositionIcon(player.globalRank)}
                    <div className="flex items-center space-x-2">
                      {player.avatar ? (
                        <img 
                          src={player.avatar} 
                          alt={player.username}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">
                            {player.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-sm">
                          {player.username}
                          {isCurrentUser && <Badge variant="secondary" className="ml-2 text-xs">You</Badge>}
                        </div>
                        <div className="flex items-center space-x-1 text-xs">
                          <span>{league?.icon}</span>
                          <span style={{ color: league?.color }}>{league?.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-sm">{player.totalPoints.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">total points</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFriendsLeague = () => {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Friends league coming soon!</p>
          <p className="text-sm text-gray-400">
            Compete directly with your friends across all leagues
          </p>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <Button
          variant={activeTab === 'my-league' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('my-league')}
          className="flex-1"
        >
          <Trophy className="w-4 h-4 mr-2" />
          My League
        </Button>
        <Button
          variant={activeTab === 'global' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('global')}
          className="flex-1"
        >
          <Globe className="w-4 h-4 mr-2" />
          Global
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
      {activeTab === 'my-league' && renderMyLeague()}
      {activeTab === 'global' && renderGlobalLeaderboard()}
      {activeTab === 'friends' && renderFriendsLeague()}
    </div>
  );
};