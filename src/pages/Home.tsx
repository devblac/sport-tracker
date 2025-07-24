import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { XPBar } from '@/components/gamification/XPBar';
import { Play, Trophy, Users, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores';

export const Home: React.FC = () => {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {getGreeting()}, {user?.profile.display_name || 'User'}! 💪
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ready to crush your fitness goals?
        </p>
      </div>

      {/* Current Streak */}
      <Card variant="gradient" className="text-center">
        <CardContent>
          <StreakCounter 
            currentStreak={user?.gamification.current_streak || 0}
            bestStreak={user?.gamification.best_streak || 0}
            size="lg"
            animated={true}
          />
        </CardContent>
      </Card>

      {/* XP Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-muted-foreground" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <XPBar 
            currentXP={user?.gamification.total_xp || 0}
            levelXP={100}
            level={user?.gamification.level || 1}
            showAnimation={true}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          variant="primary" 
          size="lg" 
          fullWidth
          icon={<Play className="w-5 h-5" />}
          className="h-20 flex-col"
        >
          <span className="text-lg font-semibold">Start</span>
          <span className="text-sm opacity-90">Workout</span>
        </Button>
        
        <Button 
          variant="secondary" 
          size="lg" 
          fullWidth
          icon={<TrendingUp className="w-5 h-5" />}
          className="h-20 flex-col"
        >
          <span className="text-lg font-semibold">View</span>
          <span className="text-sm opacity-90">Progress</span>
        </Button>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No recent activity yet
            </p>
            <Button variant="outline" size="sm">
              Add Gym Friends
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Motivation */}
      <Card variant="glass" className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
        <CardContent className="text-center py-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            💡 Today's Motivation
          </h3>
          <p className="text-gray-700 dark:text-gray-300 italic">
            "The only bad workout is the one that didn't happen."
          </p>
        </CardContent>
      </Card>
    </div>
  );
};