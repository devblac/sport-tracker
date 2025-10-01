import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown, Minus, Calendar, Target } from 'lucide-react';
import type { League, LeagueGroup, UserLeagueStats } from '@/types/league';
import { cn } from '@/utils';

interface LeagueOverviewProps {
  userStats: UserLeagueStats;
  currentLeague: League;
  leagueGroup: LeagueGroup | null;
  allLeagues: League[];
}

export const LeagueOverview: React.FC<LeagueOverviewProps> = ({
  userStats,
  currentLeague,
  leagueGroup,
  allLeagues
}) => {
  const userParticipant = leagueGroup?.participants.find(p => p.userId === userStats.userId);
  const position = userParticipant?.position || 0;
  const weeklyPoints = userParticipant?.weeklyPoints || 0;
  
  // Calculate progress to next league
  const nextLeague = allLeagues.find(l => l.level === currentLeague.level + 1);
  const progressToNext = nextLeague 
    ? Math.min((userStats.totalPoints - currentLeague.minPoints) / (nextLeague.minPoints - currentLeague.minPoints) * 100, 100)
    : 100;

  // Determine position zone
  const getPositionZone = (pos: number) => {
    if (!leagueGroup) return 'safe';
    if (leagueGroup.promotionZone.includes(pos)) return 'promotion';
    if (leagueGroup.relegationZone.includes(pos)) return 'relegation';
    return 'safe';
  };

  const positionZone = getPositionZone(position);
  const trend = userParticipant?.trend || 'stable';

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'promotion': return 'text-green-600 bg-green-50 border-green-200';
      case 'relegation': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getZoneText = (zone: string) => {
    switch (zone) {
      case 'promotion': return 'Promotion Zone';
      case 'relegation': return 'Relegation Zone';
      default: return 'Safe Zone';
    }
  };

  // Calculate days remaining in week
  const now = new Date();
  const weekEnd = leagueGroup ? new Date(leagueGroup.endDate) : new Date();
  const daysRemaining = Math.max(0, Math.ceil((weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Current Position */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Position</CardTitle>
          {getTrendIcon(trend)}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">#{position}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={cn("text-xs", getZoneColor(positionZone))}>
              {getZoneText(positionZone)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {leagueGroup ? `Out of ${leagueGroup.participants.length} players` : 'No group assigned'}
          </p>
        </CardContent>
      </Card>

      {/* Weekly Points */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Points</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{weeklyPoints.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Total: {userStats.totalPoints.toLocaleString()} points
          </p>
          <div className="mt-2">
            <div className="text-xs text-muted-foreground mb-1">
              Week Progress
            </div>
            <Progress 
              value={daysRemaining > 0 ? ((7 - daysRemaining) / 7) * 100 : 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Time Remaining */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Time Remaining</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {daysRemaining}
            <span className="text-sm font-normal ml-1">
              {daysRemaining === 1 ? 'day' : 'days'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Until league week ends
          </p>
          {daysRemaining <= 1 && (
            <Badge variant="outline" className="mt-2 text-xs">
              Final day!
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* League Progress */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            League Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current League Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentLeague.icon}</span>
                <div>
                  <h3 className="font-semibold">{currentLeague.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Level {currentLeague.level}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {userStats.totalPoints.toLocaleString()} pts
                </div>
                <div className="text-sm text-muted-foreground">
                  {userStats.weeksInCurrentLeague} weeks in league
                </div>
              </div>
            </div>

            {/* Progress to Next League */}
            {nextLeague && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to {nextLeague.name}</span>
                  <span>{Math.round(progressToNext)}%</span>
                </div>
                <Progress value={progressToNext} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{currentLeague.minPoints.toLocaleString()} pts</span>
                  <span>{nextLeague.minPoints.toLocaleString()} pts needed</span>
                </div>
              </div>
            )}

            {/* League Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {userStats.promotions}
                </div>
                <div className="text-xs text-muted-foreground">Promotions</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">
                  {userStats.relegations}
                </div>
                <div className="text-xs text-muted-foreground">Relegations</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};