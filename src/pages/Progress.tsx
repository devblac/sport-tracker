import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { XPBar } from '@/components/gamification/XPBar';
import { ProgressDashboard } from '@/components/progress/ProgressDashboard';
import { PersonalRecordsList } from '@/components/progress/PersonalRecordsList';
import { ProgressCharts } from '@/components/progress/ProgressCharts';
import { Trophy, Target, Award, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores';

export const Progress: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Your Progress
        </h1>
        <p className="text-muted-foreground">
          Track your fitness journey and achievements
        </p>
      </div>
      
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

      {/* Progress Dashboard */}
      <ProgressDashboard />

      {/* Progress Charts */}
      <ProgressCharts />
      
      {/* Personal Records */}
      <PersonalRecordsList />
      
      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No achievements unlocked</p>
            <p className="text-sm text-muted-foreground">
              Start working out to unlock your first achievement
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Fitness Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">Set your fitness goals</p>
            <p className="text-sm text-muted-foreground">
              Define what you want to achieve
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};