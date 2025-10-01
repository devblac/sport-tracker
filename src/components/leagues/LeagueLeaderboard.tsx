import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Users } from 'lucide-react';
import type { LeagueGroup, UserLeagueStats } from '@/types/league';
import { cn } from '@/utils';

interface LeagueLeaderboardProps {
  leagueGroup: LeagueGroup | null;
  userStats: UserLeagueStats;
}

export const LeagueLeaderboard: React.FC<LeagueLeaderboardProps> = ({
  leagueGroup,
  userStats
}) => {
  if (!leagueGroup) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No League Group</h3>
            <p className="text-muted-foreground">
              You haven't been assigned to a league group yet. Complete more workouts to join!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPositionBadge = (position: number) => {
    if (leagueGroup.promotionZone.includes(position)) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Promotion</Badge>;
    }
    if (leagueGroup.relegationZone.includes(position)) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Relegation</Badge>;
    }
    return <Badge variant="outline">Safe</Badge>;
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3: return <Trophy className="h-5 w-5 text-amber-600" />;
      default: return null;
    }
  };

  // Sort participants by position
  const sortedParticipants = [...leagueGroup.participants].sort((a, b) => a.position - b.position);

  // Calculate week progress
  const now = new Date();
  const weekStart = new Date(leagueGroup.startDate);
  const weekEnd = new Date(leagueGroup.endDate);
  const weekProgress = Math.min(100, ((now.getTime() - weekStart.getTime()) / (weekEnd.getTime() - weekStart.getTime())) * 100);

  return (
    <div className="space-y-4">
      {/* League Group Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              My League Group
            </div>
            <Badge variant="outline">
              Week {leagueGroup.weekNumber}, {leagueGroup.year}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Week Progress</span>
              <span>{Math.round(weekProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{weekStart.toLocaleDateString()}</span>
              <span>{weekEnd.toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedParticipants.map((participant) => (
              <div
                key={participant.userId}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  participant.isCurrentUser 
                    ? "bg-primary/5 border-primary/20" 
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Position */}
                  <div className="flex items-center justify-center w-8 h-8">
                    {getPositionIcon(participant.position) || (
                      <span className="font-bold text-lg">
                        {participant.position}
                      </span>
                    )}
                  </div>

                  {/* Avatar and Name */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback>
                      {participant.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        participant.isCurrentUser && "text-primary"
                      )}>
                        {participant.username}
                        {participant.isCurrentUser && " (You)"}
                      </span>
                      {participant.isFriend && (
                        <Badge variant="outline" className="text-xs">
                          Friend
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {participant.weeklyPoints.toLocaleString()} points this week
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Trend */}
                  {getTrendIcon(participant.trend)}

                  {/* Zone Badge */}
                  {getPositionBadge(participant.position)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zone Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Zone Explanation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Promotion
              </Badge>
              <span>Top 5 players advance to next league</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Safe</Badge>
              <span>Stay in current league</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 border-red-200">
                Relegation
              </Badge>
              <span>Bottom 5 players move to lower league</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};