import React, { useEffect, useState } from 'react';
import { leagueManager } from '@/services/LeagueManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const LeagueTest: React.FC = () => {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testLeagueSystem = async () => {
      try {
        // Get all leagues
        const allLeagues = leagueManager.getAllLeagues();
        setLeagues(allLeagues);

        // Test adding points for current user
        const userId = 'test-user-123';
        await leagueManager.addPoints(userId, 100, 'test_workout');

        // Get user stats
        const stats = await leagueManager.getUserLeagueGroup(userId);
        setUserStats(stats);

        console.log('League system test successful:', { allLeagues, stats });
      } catch (err) {
        console.error('League system test failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testLeagueSystem();
  }, []);

  const handleAddPoints = async () => {
    try {
      await leagueManager.addPoints('test-user-123', 50, 'manual_test');
      console.log('Points added successfully');
    } catch (err) {
      console.error('Failed to add points:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading league system...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>League System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Available Leagues ({leagues.length})</h3>
          <div className="grid grid-cols-2 gap-2">
            {leagues.map((league) => (
              <div key={league.id} className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                <span className="mr-2">{league.icon}</span>
                <span style={{ color: league.color }}>{league.name}</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Level {league.level} • {league.minPoints}-{league.maxPoints === Infinity ? '∞' : league.maxPoints} pts
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">User Stats</h3>
          <pre className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(userStats, null, 2)}
          </pre>
        </div>

        <Button onClick={handleAddPoints} variant="outline">
          Add 50 Test Points
        </Button>
      </CardContent>
    </Card>
  );
};