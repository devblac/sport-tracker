import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, TrendingUp, TrendingDown, Trophy, Calendar } from 'lucide-react';
import type { League, UserLeagueStats } from '@/types/league';
import { cn } from '@/utils';

interface LeagueHistoryProps {
  userStats: UserLeagueStats;
  allLeagues: League[];
}

interface LeagueHistoryEntry {
  id: string;
  weekNumber: number;
  year: number;
  leagueId: string;
  leagueName: string;
  leagueIcon: string;
  finalPosition: number;
  weeklyPoints: number;
  result: 'promoted' | 'relegated' | 'stayed';
  participantsCount: number;
  startDate: Date;
  endDate: Date;
}

export const LeagueHistory: React.FC<LeagueHistoryProps> = ({
  userStats,
  allLeagues
}) => {
  // Mock history data - in real implementation, this would come from the database
  const mockHistory: LeagueHistoryEntry[] = [
    {
      id: '1',
      weekNumber: 45,
      year: 2024,
      leagueId: 'league_3',
      leagueName: 'Gold',
      leagueIcon: '🥇',
      finalPosition: 3,
      weeklyPoints: 1250,
      result: 'promoted',
      participantsCount: 20,
      startDate: new Date('2024-11-04'),
      endDate: new Date('2024-11-10')
    },
    {
      id: '2',
      weekNumber: 44,
      year: 2024,
      leagueId: 'league_2',
      leagueName: 'Silver',
      leagueIcon: '🥈',
      finalPosition: 8,
      weeklyPoints: 980,
      result: 'stayed',
      participantsCount: 20,
      startDate: new Date('2024-10-28'),
      endDate: new Date('2024-11-03')
    },
    {
      id: '3',
      weekNumber: 43,
      year: 2024,
      leagueId: 'league_2',
      leagueName: 'Silver',
      leagueIcon: '🥈',
      finalPosition: 2,
      weeklyPoints: 1450,
      result: 'promoted',
      participantsCount: 20,
      startDate: new Date('2024-10-21'),
      endDate: new Date('2024-10-27')
    },
    {
      id: '4',
      weekNumber: 42,
      year: 2024,
      leagueId: 'league_1',
      leagueName: 'Bronze',
      leagueIcon: '🥉',
      finalPosition: 12,
      weeklyPoints: 650,
      result: 'stayed',
      participantsCount: 20,
      startDate: new Date('2024-10-14'),
      endDate: new Date('2024-10-20')
    }
  ];

  const getResultBadge = (result: string, position: number) => {
    switch (result) {
      case 'promoted':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            Promoted
          </Badge>
        );
      case 'relegated':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <TrendingDown className="h-3 w-3 mr-1" />
            Relegated
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Stayed
          </Badge>
        );
    }
  };

  const getPositionColor = (position: number) => {
    if (position <= 5) return 'text-green-600';
    if (position >= 16) return 'text-red-600';
    return 'text-gray-600';
  };

  const currentLeague = allLeagues.find(l => l.id === userStats.currentLeague);

  return (
    <div className="space-y-4">
      {/* Current League Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            League Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {userStats.promotions}
              </div>
              <div className="text-sm text-muted-foreground">Promotions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {userStats.relegations}
              </div>
              <div className="text-sm text-muted-foreground">Relegations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {userStats.weeksInCurrentLeague}
              </div>
              <div className="text-sm text-muted-foreground">Weeks in {currentLeague?.name}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {allLeagues.find(l => l.id === userStats.bestLeague)?.level || 1}
              </div>
              <div className="text-sm text-muted-foreground">Highest League</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* League History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent League History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mockHistory.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
              <p className="text-muted-foreground">
                Complete more weeks in leagues to see your history here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mockHistory.map((entry, index) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    index === 0 && "bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* League Icon */}
                    <div className="text-2xl">
                      {entry.leagueIcon}
                    </div>

                    {/* League Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {entry.leagueName} League
                        </span>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Latest
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Week {entry.weekNumber}, {entry.year} • 
                        {entry.startDate.toLocaleDateString()} - {entry.endDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Position */}
                    <div className="text-center">
                      <div className={cn("text-lg font-bold", getPositionColor(entry.finalPosition))}>
                        #{entry.finalPosition}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        of {entry.participantsCount}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {entry.weeklyPoints.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        points
                      </div>
                    </div>

                    {/* Result */}
                    <div>
                      {getResultBadge(entry.result, entry.finalPosition)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* League Progression Chart */}
      <Card>
        <CardHeader>
          <CardTitle>League Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Visual progression timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
              
              {mockHistory.reverse().map((entry, index) => (
                <div key={entry.id} className="relative flex items-center gap-4 pb-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 bg-background flex items-center justify-center text-sm",
                    entry.result === 'promoted' && "border-green-500 text-green-600",
                    entry.result === 'relegated' && "border-red-500 text-red-600",
                    entry.result === 'stayed' && "border-gray-400 text-gray-600"
                  )}>
                    {entry.leagueIcon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{entry.leagueName}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          Week {entry.weekNumber}
                        </span>
                      </div>
                      <div className="text-sm">
                        #{entry.finalPosition} • {entry.weeklyPoints} pts
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};