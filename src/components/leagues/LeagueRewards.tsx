import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Gift, Trophy, Star, Crown, Zap, Lock } from 'lucide-react';
import type { League, UserLeagueStats } from '@/types/league';
import { cn } from '@/utils';

interface LeagueRewardsProps {
  userStats: UserLeagueStats;
  currentLeague: League;
}

interface LeagueReward {
  id: string;
  type: 'weekly' | 'promotion' | 'milestone' | 'achievement';
  title: string;
  description: string;
  icon: React.ReactNode;
  requirement: string;
  progress?: number;
  maxProgress?: number;
  unlocked: boolean;
  claimed: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  additionalRewards?: string[];
}

export const LeagueRewards: React.FC<LeagueRewardsProps> = ({
  userStats,
  currentLeague
}) => {
  // Mock rewards data - in real implementation, this would come from the database
  const mockRewards: LeagueReward[] = [
    {
      id: '1',
      type: 'weekly',
      title: 'Weekly Champion',
      description: 'Finish #1 in your league group this week',
      icon: <Crown className="h-5 w-5" />,
      requirement: 'Finish #1 this week',
      progress: userStats.weeklyPoints,
      maxProgress: 2000, // Estimated points needed
      unlocked: false,
      claimed: false,
      rarity: 'epic',
      xpReward: 500,
      additionalRewards: ['Exclusive badge', 'Double XP weekend']
    },
    {
      id: '2',
      type: 'weekly',
      title: 'Top 5 Finisher',
      description: 'Finish in promotion zone this week',
      icon: <Trophy className="h-5 w-5" />,
      requirement: 'Finish top 5 this week',
      progress: userStats.weeklyPoints,
      maxProgress: 1200,
      unlocked: userStats.weeklyPoints >= 1200,
      claimed: false,
      rarity: 'rare',
      xpReward: 200,
      additionalRewards: ['League promotion', 'Bonus XP']
    },
    {
      id: '3',
      type: 'promotion',
      title: `${currentLeague.name} Graduate`,
      description: `Get promoted from ${currentLeague.name} league`,
      icon: <Star className="h-5 w-5" />,
      requirement: 'Get promoted to next league',
      unlocked: false,
      claimed: false,
      rarity: 'rare',
      xpReward: 300,
      additionalRewards: ['League badge', 'Title unlock']
    },
    {
      id: '4',
      type: 'milestone',
      title: 'Promotion Streak',
      description: 'Get promoted 3 weeks in a row',
      icon: <Zap className="h-5 w-5" />,
      requirement: '3 consecutive promotions',
      progress: 0, // Would track consecutive promotions
      maxProgress: 3,
      unlocked: false,
      claimed: false,
      rarity: 'legendary',
      xpReward: 1000,
      additionalRewards: ['Legendary title', 'Exclusive avatar frame']
    },
    {
      id: '5',
      type: 'achievement',
      title: 'League Veteran',
      description: 'Spend 10 weeks in leagues',
      icon: <Trophy className="h-5 w-5" />,
      requirement: '10 weeks in leagues',
      progress: userStats.weeksInCurrentLeague + 5, // Mock total weeks
      maxProgress: 10,
      unlocked: (userStats.weeksInCurrentLeague + 5) >= 10,
      claimed: false,
      rarity: 'rare',
      xpReward: 400,
      additionalRewards: ['Veteran badge', 'XP multiplier']
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'epic': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'rare': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRarityText = (rarity: string) => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  const handleClaimReward = (rewardId: string) => {
    // In real implementation, this would call the API to claim the reward
    console.log('Claiming reward:', rewardId);
  };

  const weeklyRewards = mockRewards.filter(r => r.type === 'weekly');
  const otherRewards = mockRewards.filter(r => r.type !== 'weekly');

  return (
    <div className="space-y-6">
      {/* Weekly Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            This Week's Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyRewards.map((reward) => (
              <div
                key={reward.id}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  reward.unlocked ? "bg-green-50 border-green-200" : "bg-muted/30"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      reward.unlocked ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                    )}>
                      {reward.unlocked ? reward.icon : <Lock className="h-5 w-5" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{reward.title}</h3>
                        <Badge className={cn("text-xs", getRarityColor(reward.rarity))}>
                          {getRarityText(reward.rarity)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {reward.description}
                      </p>
                      
                      {reward.progress !== undefined && reward.maxProgress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{reward.progress} / {reward.maxProgress}</span>
                          </div>
                          <Progress 
                            value={(reward.progress / reward.maxProgress) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>+{reward.xpReward} XP</span>
                        {reward.additionalRewards && (
                          <span>{reward.additionalRewards.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {reward.unlocked && !reward.claimed && (
                    <Button 
                      size="sm"
                      onClick={() => handleClaimReward(reward.id)}
                      className="ml-4"
                    >
                      Claim
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Long-term Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>League Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {otherRewards.map((reward) => (
              <div
                key={reward.id}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  reward.unlocked ? "bg-green-50 border-green-200" : "bg-muted/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    reward.unlocked ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
                  )}>
                    {reward.unlocked ? reward.icon : <Lock className="h-5 w-5" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{reward.title}</h3>
                      <Badge className={cn("text-xs", getRarityColor(reward.rarity))}>
                        {getRarityText(reward.rarity)}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {reward.description}
                    </p>
                    
                    {reward.progress !== undefined && reward.maxProgress && (
                      <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{reward.progress} / {reward.maxProgress}</span>
                        </div>
                        <Progress 
                          value={(reward.progress / reward.maxProgress) * 100} 
                          className="h-1"
                        />
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      +{reward.xpReward} XP
                    </div>
                    
                    {reward.unlocked && !reward.claimed && (
                      <Button 
                        size="sm"
                        onClick={() => handleClaimReward(reward.id)}
                        className="mt-2 w-full"
                      >
                        Claim
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reward Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How League Rewards Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Trophy className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <strong>Weekly Rewards:</strong> Earned based on your final position in the weekly league competition
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Star className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <strong>Promotion Rewards:</strong> Unlocked when you advance to a higher league
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Gift className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <strong>Milestone Rewards:</strong> Special achievements for long-term league participation
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <strong>Rarity:</strong> Higher rarity rewards give more XP and exclusive content
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};