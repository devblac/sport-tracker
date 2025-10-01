import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Trophy, Crown, Medal, Award } from 'lucide-react';
import type { GlobalLeaderboard as GlobalLeaderboardType, UserLeagueStats } from '@/types/league';
import { cn } from '@/utils';

interface GlobalLeaderboardProps {
  globalLeaderboard: GlobalLeaderboardType[];
  userStats: UserLeagueStats;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  globalLeaderboard,
  userStats
}) => {
  const [activeTab, setActiveTab] = useState('all-time');

  const getLeagueIcon = (leagueName: string) => {
    const leagueIcons: Record<string, string> = {
      'Bronze': '🥉',
      'Silver': '🥈',
      'Gold': '🥇',
      'Platinum': '💎',
      'Emerald': '💚',
      'Ruby': '❤️',
      'Sapphire': '💙',
      'Diamond': '💎',
      'Obsidian': '🖤',
      'Phoenix': '🔥'
    };
    return leagueIcons[leagueName] || '🏆';
  };

  const getLeagueColor = (leagueName: string) => {
    const leagueColors: Record<string, string> = {
      'Bronze': 'text-amber-700 bg-amber-50 border-amber-200',
      'Silver': 'text-gray-700 bg-gray-50 border-gray-200',
      'Gold': 'text-yellow-700 bg-yellow-50 border-yellow-200',
      'Platinum': 'text-slate-700 bg-slate-50 border-slate-200',
      'Emerald': 'text-emerald-700 bg-emerald-50 border-emerald-200',
      'Ruby': 'text-red-700 bg-red-50 border-red-200',
      'Sapphire': 'text-blue-700 bg-blue-50 border-blue-200',
      'Diamond': 'text-cyan-700 bg-cyan-50 border-cyan-200',
      'Obsidian': 'text-gray-900 bg-gray-100 border-gray-300',
      'Phoenix': 'text-orange-700 bg-orange-50 border-orange-200'
    };
    return leagueColors[leagueName] || 'text-gray-700 bg-gray-50 border-gray-200';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return null;
    }
  };

  const userGlobalRank = globalLeaderboard.find(p => p.userId === userStats.userId)?.globalRank;

  // Mock weekly leaderboard (in real implementation, this would come from the API)
  const weeklyLeaderboard = globalLeaderboard
    .sort((a, b) => b.weeklyPoints - a.weeklyPoints)
    .map((player, index) => ({ ...player, globalRank: index + 1 }));

  const renderLeaderboard = (leaderboard: GlobalLeaderboardType[], isWeekly = false) => (
    <div className="space-y-3">
      {leaderboard.slice(0, 50).map((player) => (
        <div
          key={player.userId}
          className={cn(
            "flex items-center justify-between p-3 rounded-lg border transition-colors",
            player.userId === userStats.userId 
              ? "bg-primary/5 border-primary/20" 
              : "hover:bg-muted/50"
          )}
        >
          <div className="flex items-center gap-3">
            {/* Rank */}
            <div className="flex items-center justify-center w-8 h-8">
              {getRankIcon(player.globalRank) || (
                <span className="font-bold text-lg">
                  {player.globalRank}
                </span>
              )}
            </div>

            {/* Avatar and Name */}
            <Avatar className="h-10 w-10">
              <AvatarImage src={player.avatar} />
              <AvatarFallback>
                {player.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium",
                  player.userId === userStats.userId && "text-primary"
                )}>
                  {player.username}
                  {player.userId === userStats.userId && " (You)"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {isWeekly 
                  ? `${player.weeklyPoints.toLocaleString()} points this week`
                  : `${player.totalPoints.toLocaleString()} total points`
                }
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* League Badge */}
            <Badge className={cn("text-xs", getLeagueColor(player.currentLeague))}>
              <span className="mr-1">{getLeagueIcon(player.currentLeague)}</span>
              {player.currentLeague}
            </Badge>

            {/* Country Rank (if available) */}
            {player.countryRank && (
              <div className="text-xs text-muted-foreground">
                #{player.countryRank} in country
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* User's Global Position */}
      {userGlobalRank && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">Your Global Rank</div>
                  <div className="text-sm text-muted-foreground">
                    Out of {globalLeaderboard.length.toLocaleString()} players
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  #{userGlobalRank.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {userStats.totalPoints.toLocaleString()} points
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Leaderboard Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Global Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all-time">All Time</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
            </TabsList>

            <TabsContent value="all-time" className="mt-4">
              {renderLeaderboard(globalLeaderboard)}
            </TabsContent>

            <TabsContent value="weekly" className="mt-4">
              {renderLeaderboard(weeklyLeaderboard, true)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* League Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">League Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* This would be calculated from actual data */}
            {[
              { league: 'Phoenix', percentage: 0.1, count: 1 },
              { league: 'Obsidian', percentage: 0.5, count: 5 },
              { league: 'Diamond', percentage: 2, count: 20 },
              { league: 'Sapphire', percentage: 5, count: 50 },
              { league: 'Ruby', percentage: 10, count: 100 },
              { league: 'Emerald', percentage: 15, count: 150 },
              { league: 'Platinum', percentage: 20, count: 200 },
              { league: 'Gold', percentage: 25, count: 250 },
              { league: 'Silver', percentage: 15, count: 150 },
              { league: 'Bronze', percentage: 7.4, count: 74 }
            ].map((item) => (
              <div key={item.league} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{getLeagueIcon(item.league)}</span>
                  <span>{item.league}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-12 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};