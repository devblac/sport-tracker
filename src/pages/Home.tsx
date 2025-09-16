import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { WorkoutSuggestions } from '@/components/recommendations/WorkoutSuggestions';
import { TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFeatureFlag } from '@/hooks/useExperiment';

export const Home: React.FC = () => {
  const { user } = useAuthStore();
  const { enableAIWorkoutSuggestions } = useSettingsStore();
  
  // Feature flags
  const { value: showAIRecommendationsV2 } = useFeatureFlag('ai_recommendations_v2', false);

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
      {/* Compact Hero Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200/50 dark:border-blue-500/20">
        <CardContent className="p-6">
          {/* Welcome Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {getGreeting()}, {user?.profile.display_name || 'juli'}! 💪
            </h1>
            <p className="text-muted-foreground">
              Ready to crush your fitness goals?
            </p>
          </div>

          {/* Current Streak - Essential Only */}
          <div className="flex items-center justify-center mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <span className="text-2xl">🔥</span>
                <span className="text-2xl font-bold text-foreground">
                  {user?.gamification.current_streak || 0}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>

          {/* Today's Goals */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <span className="text-sm font-semibold text-foreground">Today's Goals</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white/70 dark:bg-gray-700/70 rounded">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Complete a workout</span>
                </div>
                <span className="text-xs text-muted-foreground">0/1</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/70 dark:bg-gray-700/70 rounded">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Maintain streak</span>
                </div>
                <span className="text-xs text-green-600 font-medium">On track</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>









      {/* AI Workout Suggestions - User Setting Controlled */}
      {enableAIWorkoutSuggestions && showAIRecommendationsV2 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">AI Recommendations v2.0</h3>
              <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full">
                NEW
              </span>
            </div>
            <p className="text-muted-foreground mb-4">
              Enhanced AI-powered workout suggestions based on your progress and preferences.
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg">
                <div className="font-medium text-foreground">Recommended: Upper Body Strength</div>
                <div className="text-sm text-muted-foreground">Based on your recent lower body focus</div>
              </div>
              <div className="p-3 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/10 dark:to-teal-900/10 rounded-lg">
                <div className="font-medium text-foreground">Suggested: Cardio Recovery</div>
                <div className="text-sm text-muted-foreground">Perfect for active recovery day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : enableAIWorkoutSuggestions ? (
        <WorkoutSuggestions />
      ) : null}





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