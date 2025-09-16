import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { XPBar } from '@/components/gamification/XPBar';
import { ProgressDashboard } from '@/components/progress/ProgressDashboard';
import { PersonalRecordsList } from '@/components/progress/PersonalRecordsList';
import { ProgressCharts } from '@/components/progress/ProgressCharts';
import { Trophy, Target, Award, BarChart3, Flag, Star, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { StreakDashboard } from '@/components/streaks/StreakDashboard';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ComponentType }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Streak Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback;
      return <Fallback />;
    }

    return this.props.children;
  }
}

// Streak Error Fallback Component
const StreakErrorFallback: React.FC = () => (
  <div className="text-center py-8">
    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
      <AlertCircle className="w-8 h-8 text-orange-600" />
    </div>
    <p className="text-muted-foreground mb-2">Streak data temporarily unavailable</p>
    <p className="text-sm text-muted-foreground">
      We're working on fixing this. Your streak progress is safe!
    </p>
    <Button 
      variant="outline" 
      size="sm" 
      className="mt-4"
      onClick={() => window.location.reload()}
    >
      Retry
    </Button>
  </div>
);

export const Progress: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'stats' | 'goals' | 'achievements'>('stats');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Your Progress
        </h1>
        <p className="text-muted-foreground">
          Track your journey, goals, and achievements
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <Button
          variant={activeTab === 'stats' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('stats')}
          className="flex-1"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Stats
        </Button>
        <Button
          variant={activeTab === 'goals' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('goals')}
          className="flex-1"
        >
          <Flag className="w-4 h-4 mr-2" />
          Goals
        </Button>
        <Button
          variant={activeTab === 'achievements' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('achievements')}
          className="flex-1"
        >
          <Star className="w-4 h-4 mr-2" />
          Achievements
        </Button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Level & XP */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg">🏆</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Level Progress</h3>
                  <p className="text-sm text-muted-foreground">Keep training to level up!</p>
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

          {/* Streak Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Streak Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorBoundary fallback={<StreakErrorFallback />}>
                <StreakDashboard />
              </ErrorBoundary>
            </CardContent>
          </Card>

          {/* Progress Dashboard */}
          <ProgressDashboard />

          {/* Progress Charts - Safe implementation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Progress Charts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ErrorBoundary fallback={() => (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">Charts temporarily unavailable</p>
                  <p className="text-sm text-muted-foreground">
                    We're working on fixing the chart display. Your progress data is safe!
                  </p>
                </div>
              )}>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">Charts coming soon</p>
                  <p className="text-sm text-muted-foreground">
                    Your workout data is being tracked and will be visualized here.
                  </p>
                </div>
              </ErrorBoundary>
            </CardContent>
          </Card>
          
          {/* Personal Records */}
          <PersonalRecordsList />
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="space-y-6">
          {/* Current Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Current Goals
                </div>
                <Button variant="outline" size="sm">
                  Add Goal
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sample Goals */}
                <div className="p-4 bg-card border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">Workout 3x per week</h4>
                    <span className="text-sm text-green-600 font-medium">On track</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '66%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>2 of 3 workouts this week</span>
                    <span>66% complete</span>
                  </div>
                </div>

                <div className="p-4 bg-card border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">Bench Press 200 lbs</h4>
                    <span className="text-sm text-blue-600 font-medium">In progress</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Current: 150 lbs</span>
                    <span>75% complete</span>
                  </div>
                </div>

                <div className="p-4 bg-card border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">30-day streak</h4>
                    <span className="text-sm text-orange-600 font-medium">Challenging</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Current streak: 7 days</span>
                    <span>23% complete</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goal Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-primary" />
                Goal Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Strength', icon: '💪', count: 2 },
                  { name: 'Endurance', icon: '🏃', count: 1 },
                  { name: 'Consistency', icon: '🔥', count: 1 },
                  { name: 'Weight Loss', icon: '⚖️', count: 0 }
                ].map((category) => (
                  <div key={category.name} className="p-4 bg-card border border-border rounded-lg text-center">
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <div className="font-medium text-foreground">{category.name}</div>
                    <div className="text-sm text-muted-foreground">{category.count} active</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">First Workout</h4>
                      <p className="text-sm text-muted-foreground">Completed your first workout session</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Unlocked today</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Achievement Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Workout Milestones', icon: '🏋️', unlocked: 1, total: 10 },
                  { name: 'Streak Achievements', icon: '🔥', unlocked: 0, total: 8 },
                  { name: 'Strength Records', icon: '💪', unlocked: 0, total: 15 },
                  { name: 'Social Achievements', icon: '👥', unlocked: 0, total: 6 }
                ].map((category) => (
                  <div key={category.name} className="p-4 bg-card border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h4 className="font-medium text-foreground">{category.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {category.unlocked} of {category.total} unlocked
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {Math.round((category.unlocked / category.total) * 100)}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(category.unlocked / category.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Locked Achievements Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-muted-foreground" />
                Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: '7-Day Streak', description: 'Complete workouts for 7 consecutive days', icon: '🔥' },
                  { name: 'Century Club', description: 'Complete 100 total workouts', icon: '💯' },
                  { name: 'Social Butterfly', description: 'Add 5 gym friends', icon: '🦋' }
                ].map((achievement) => (
                  <div key={achievement.name} className="p-4 bg-muted/50 border border-border rounded-lg opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-lg grayscale">{achievement.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-muted-foreground">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};