import React from 'react';
import { LeagueDashboard } from '@/components/leagues/LeagueDashboard';
import { checkLeagueEligibility, getLeagueUnavailableMessage } from '@/utils/leagueEligibility';
import { useAuthStore } from '@/stores';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Target } from 'lucide-react';

export const LeaguesPage: React.FC = () => {
  const { user } = useAuthStore();
  
  // Mock data for eligibility check - in real implementation, this would come from API
  const totalRegisteredUsers = 150; // Mock number of registered users
  const userWorkoutCount = 5; // Mock user workout count
  
  const eligibilityResult = checkLeagueEligibility(user, totalRegisteredUsers);
  
  if (!eligibilityResult.isEligible) {
    const message = getLeagueUnavailableMessage(eligibilityResult);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Competitive Leagues</h1>
            <p className="text-muted-foreground">
              Compete with other fitness enthusiasts in weekly challenges
            </p>
          </div>

          {/* Unavailable Message */}
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">{message.title}</h2>
              <p className="text-muted-foreground mb-6">{message.message}</p>
              
              {message.action && (
                <Button size="lg">
                  {message.action}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Preview of League Features */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Weekly Competition</h3>
                <p className="text-sm text-muted-foreground">
                  Compete in 20-player groups with promotion and relegation
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">10 League Tiers</h3>
                <p className="text-sm text-muted-foreground">
                  From Bronze to Phoenix - climb the ranks and earn rewards
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Exclusive Rewards</h3>
                <p className="text-sm text-muted-foreground">
                  Earn XP, badges, and unlock special content
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Indicator */}
          {eligibilityResult.reason === 'Not enough users yet for league competition' && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Community Growth</span>
                  <span className="text-sm text-muted-foreground">
                    {eligibilityResult.currentUsers} / {eligibilityResult.minimumUsers} users
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((eligibilityResult.currentUsers || 0) / (eligibilityResult.minimumUsers || 50)) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Invite friends to help us reach the minimum for competitive leagues!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Competitive Leagues</h1>
        <p className="text-muted-foreground">
          Compete with other fitness enthusiasts in weekly challenges
        </p>
      </div>

      {/* League Dashboard */}
      <LeagueDashboard />
    </div>
  );
};