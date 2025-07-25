import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { Calendar, TrendingUp, Clock } from 'lucide-react';
import type { Exercise } from '@/types';

interface ExerciseHistoryTabProps {
  exercise: Exercise;
}

export const ExerciseHistoryTab: React.FC<ExerciseHistoryTabProps> = ({ exercise }) => {
  // Placeholder data - in real app this would come from workout history
  const hasHistory = false;

  if (!hasHistory) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No History Yet</h3>
        <p className="text-muted-foreground mb-4">
          Start using this exercise in your workouts to see your history here.
        </p>
        <div className="text-sm text-muted-foreground">
          Your workout history will show:
        </div>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
          <li>• Previous sets, reps, and weights</li>
          <li>• Workout dates and duration</li>
          <li>• Progress over time</li>
          <li>• Personal records</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recent Workouts */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Workouts
          </h3>
          {/* Workout history will be implemented in workout system */}
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Progress Summary
          </h3>
          {/* Progress metrics will be implemented in workout system */}
        </CardContent>
      </Card>
    </div>
  );
};