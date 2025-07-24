import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { XPBar } from '@/components/gamification/XPBar';
import { Trophy, Target, Award, TrendingUp } from 'lucide-react';

export const Progress: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground text-center">
        Your Progress
      </h1>
      
      {/* Level & XP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            Level & XP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <XPBar 
            currentXP={0}
            levelXP={100}
            level={1}
            showAnimation={true}
          />
        </CardContent>
      </Card>
      
      {/* Personal Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-muted-foreground" />
            Personal Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No records yet</p>
            <p className="text-sm text-muted-foreground">
              Complete your first workout to start tracking PRs
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-muted-foreground" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
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
            <Target className="w-5 h-5 text-muted-foreground" />
            Fitness Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
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