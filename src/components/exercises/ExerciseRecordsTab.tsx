import React from 'react';
import { Card, CardContent, Badge } from '@/components/ui';
import { Trophy, Target, Zap, Calendar } from 'lucide-react';
import type { Exercise } from '@/types';

interface ExerciseRecordsTabProps {
  exercise: Exercise;
}

export const ExerciseRecordsTab: React.FC<ExerciseRecordsTabProps> = ({ exercise }) => {
  // Placeholder - records will be calculated from workout data
  const hasRecords = false;

  if (!hasRecords) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Records Yet</h3>
        <p className="text-muted-foreground mb-4">
          Start tracking this exercise to build your personal records.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-lg mx-auto">
          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Max Weight</p>
              <p className="text-xs text-muted-foreground">Heaviest weight lifted</p>
            </CardContent>
          </Card>
          
          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Max Volume</p>
              <p className="text-xs text-muted-foreground">Highest total volume</p>
            </CardContent>
          </Card>
          
          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Max Reps</p>
              <p className="text-xs text-muted-foreground">Most reps in one set</p>
            </CardContent>
          </Card>
          
          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Best Streak</p>
              <p className="text-xs text-muted-foreground">Consecutive workouts</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Personal Records */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Personal Records
          </h3>
          {/* Records will be implemented with workout tracking */}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Exercise Achievements
          </h3>
          {/* Exercise-specific achievements will be implemented with gamification */}
        </CardContent>
      </Card>
    </div>
  );
};