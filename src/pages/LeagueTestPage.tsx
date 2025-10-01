import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LeagueDashboard } from '@/components/leagues/LeagueDashboard';
import { weeklyLeagueGroupingService } from '@/services/WeeklyLeagueGroupingService';
import { leaguePromotionRelegationService } from '@/services/LeaguePromotionRelegationService';
import { weeklyCompetitionService } from '@/services/WeeklyCompetitionService';
import { leagueManager } from '@/services/LeagueManager';
import { useAuthStore } from '@/stores';
import { Trophy, Users, Play, RotateCcw, Award } from 'lucide-react';

export const LeagueTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { user } = useAuthStore();

  const handleCreateGroups = async () => {
    setLoading(true);
    try {
      const result = await weeklyLeagueGroupingService.executeWeeklyGrouping();
      setResults({ type: 'grouping', data: result });
    } catch (error) {
      console.error('Error creating groups:', error);
      setResults({ type: 'error', data: error });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessResults = async () => {
    setLoading(true);
    try {
      const result = await leaguePromotionRelegationService.processWeeklyResults();
      setResults({ type: 'promotion', data: result });
    } catch (error) {
      console.error('Error processing results:', error);
      setResults({ type: 'error', data: error });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCompetition = async () => {
    setLoading(true);
    try {
      const result = await weeklyCompetitionService.triggerNewCycle();
      setResults({ type: 'competition', data: result });
    } catch (error) {
      console.error('Error starting competition:', error);
      setResults({ type: 'error', data: error });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const points = Math.floor(Math.random() * 500) + 100; // Random points 100-600
      await leagueManager.addPoints(user.id, points, 'test_workout');
      setResults({ 
        type: 'points', 
        data: { points, message: `Added ${points} points to your league score!` }
      });
    } catch (error) {
      console.error('Error adding points:', error);
      setResults({ type: 'error', data: error });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewResults = async () => {
    setLoading(true);
    try {
      const result = await leaguePromotionRelegationService.previewPromotionRelegation();
      setResults({ type: 'preview', data: result });
    } catch (error) {
      console.error('Error previewing results:', error);
      setResults({ type: 'error', data: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">League System Test</h1>
        <p className="text-muted-foreground">
          Test the Duolingo-style league system functionality
        </p>
      </div>

      {/* Test Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            League System Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button
              onClick={handleCreateGroups}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Create Weekly Groups
            </Button>

            <Button
              onClick={handleAddPoints}
              disabled={loading || !user}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Award className="h-4 w-4" />
              Add Random Points
            </Button>

            <Button
              onClick={handlePreviewResults}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Preview Results
            </Button>

            <Button
              onClick={handleProcessResults}
              disabled={loading}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Process Weekly Results
            </Button>

            <Button
              onClick={handleStartCompetition}
              disabled={loading}
              variant="default"
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Start New Competition
            </Button>
          </div>

          {loading && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Processing...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {results && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">
                {results.type.toUpperCase()}
              </Badge>
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(results.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* League Dashboard */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">League Dashboard</h2>
        <LeagueDashboard />
      </div>
    </div>
  );
};