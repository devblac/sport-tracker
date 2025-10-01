import React, { useState } from 'react';
import { useLeague } from '@/hooks/useLeague';
import { LeagueOverview } from './LeagueOverview';
import { LeagueLeaderboard } from './LeagueLeaderboard';
import { GlobalLeaderboard } from './GlobalLeaderboard';
import { LeagueHistory } from './LeagueHistory';
import { LeagueRewards } from './LeagueRewards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Globe, History, Gift } from 'lucide-react';
import { cn } from '@/utils';

interface LeagueDashboardProps {
  className?: string;
}

export const LeagueDashboard: React.FC<LeagueDashboardProps> = ({ className }) => {
  const {
    userStats,
    currentLeague,
    leagueGroup,
    globalLeaderboard,
    allLeagues,
    loading,
    error,
    refreshData
  } = useLeague();

  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading league data: {error}</p>
            <button 
              onClick={refreshData}
              className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userStats || !currentLeague) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6">
          <div className="text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Join the Competition!</h3>
            <p className="text-muted-foreground mb-4">
              Complete your first workout to join competitive leagues
            </p>
            <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
              Start First Workout
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* League Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{currentLeague.icon}</span>
            <div>
              <h2 className="text-xl font-bold">{currentLeague.name} League</h2>
              <p className="text-sm text-muted-foreground">
                {currentLeague.description}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* League Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">My League</span>
          </TabsTrigger>
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Global</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Rewards</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <LeagueOverview 
            userStats={userStats}
            currentLeague={currentLeague}
            leagueGroup={leagueGroup}
            allLeagues={allLeagues}
          />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <LeagueLeaderboard 
            leagueGroup={leagueGroup}
            userStats={userStats}
          />
        </TabsContent>

        <TabsContent value="global" className="space-y-4">
          <GlobalLeaderboard 
            globalLeaderboard={globalLeaderboard}
            userStats={userStats}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <LeagueHistory 
            userStats={userStats}
            allLeagues={allLeagues}
          />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <LeagueRewards 
            userStats={userStats}
            currentLeague={currentLeague}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};