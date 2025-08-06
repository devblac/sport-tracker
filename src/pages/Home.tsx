import React from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { XPBar } from '@/components/gamification/XPBar';
import { ActivitySummary } from '@/components/dashboard/ActivitySummary';
import { TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "The only bad workout is the one that didn't happen.",
      "Your body can do it. It's your mind you need to convince.",
      "Success is what comes after you stop making excuses.",
      "The pain you feel today will be the strength you feel tomorrow.",
      "Don't wish for it, work for it.",
      "Champions train, losers complain.",
      "Your only limit is your mind.",
      "Push yourself because no one else is going to do it for you.",
    ];
    
    const today = new Date().getDate();
    return quotes[today % quotes.length];
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {getGreeting()}, {user?.profile.display_name || 'User'}! 💪
        </h1>
        <p className="text-muted-foreground">
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
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-lg">🏆</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Level Progress</h3>
              <p className="text-sm text-muted-foreground">Keep going to level up!</p>
            </div>
          </div>
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
          onClick={() => navigate('/workout')}
          className="h-20 flex-col py-3"
        >
          <span className="text-xl mb-1">🏋️</span>
          <span className="text-base font-semibold">Start Workout</span>
          <span className="text-sm opacity-70">Begin training</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          fullWidth
          onClick={() => navigate('/workout-templates')}
          className="h-20 flex-col py-3"
        >
          <span className="text-xl mb-1">📋</span>
          <span className="text-base font-semibold">Templates</span>
          <span className="text-sm opacity-70">Browse & Create</span>
        </Button>
      </div>

      {/* Activity Summary */}
      <ActivitySummary />

      {/* Recent Activity Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
              <span className="text-lg">📈</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">This Week</h3>
              <p className="text-sm text-muted-foreground">Your fitness summary</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">3</div>
              <div className="text-sm text-muted-foreground">Workouts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">4.2k</div>
              <div className="text-sm text-muted-foreground">Volume (lbs)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">2h 15m</div>
              <div className="text-sm text-muted-foreground">Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Motivation */}
      <Card variant="glass" className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="text-center py-6">
          <div className="text-2xl mb-3">💡</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Today's Motivation
          </h3>
          <p className="text-muted-foreground italic text-sm leading-relaxed">
            "{getMotivationalQuote()}"
          </p>
        </CardContent>
      </Card>
    </div>
  );
};