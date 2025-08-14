import React from 'react';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { leagueManager } from '@/services/LeagueManager';

interface LeagueViewSimpleProps {
  className?: string;
}

export const LeagueViewSimple: React.FC<LeagueViewSimpleProps> = ({ className = '' }) => {
  const leagues = leagueManager.getAllLeagues();

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>League System</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">League System Ready!</p>
            <p className="text-sm text-gray-400">
              Found {leagues.length} leagues available
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {leagues.slice(0, 4).map((league) => (
                <div key={league.id} className="p-2 bg-gray-100 rounded text-sm">
                  <span className="mr-2">{league.icon}</span>
                  <span style={{ color: league.color }}>{league.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};