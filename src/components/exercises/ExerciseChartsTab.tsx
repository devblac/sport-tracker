import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { BarChart3, LineChart, PieChart } from 'lucide-react';
import type { Exercise } from '@/schemas/exercise';

interface ExerciseChartsTabProps {
  exercise: Exercise;
}

export const ExerciseChartsTab: React.FC<ExerciseChartsTabProps> = ({ exercise }) => {
  // Placeholder - charts will be implemented when workout data is available
  const hasData = false;

  if (!hasData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Data to Chart</h3>
        <p className="text-muted-foreground mb-4">
          Complete some workouts with this exercise to see your progress charts.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
          <div className="text-center">
            <LineChart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Progress Over Time</p>
            <p className="text-xs text-muted-foreground">Track weight and reps</p>
          </div>
          
          <div className="text-center">
            <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Volume Analysis</p>
            <p className="text-xs text-muted-foreground">Total volume trends</p>
          </div>
          
          <div className="text-center">
            <PieChart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Set Distribution</p>
            <p className="text-xs text-muted-foreground">Rep ranges used</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Chart */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-primary" />
            Progress Over Time
          </h3>
          {/* Chart implementation will come with workout system */}
        </CardContent>
      </Card>

      {/* Volume Chart */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Volume Analysis
          </h3>
          {/* Volume chart implementation will come with workout system */}
        </CardContent>
      </Card>
    </div>
  );
};