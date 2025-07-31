import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { WorkoutService } from '@/services/WorkoutService';
import { useAuthStore } from '@/stores';
import { 
  calculateWorkoutVolume, 
  calculateTotalReps, 
  formatDuration, 
  formatVolume 
} from '@/utils/workoutCalculations';
import { 
  TrendingUp, 
  Calendar, 
  Dumbbell, 
  Clock, 
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import type { Workout } from '@/schemas/workout';

interface ProgressMetrics {
  totalWorkouts: number;
  totalVolume: number;
  totalDuration: number;
  averageWorkoutDuration: number;
  currentStreak: number;
  thisWeekWorkouts: number;
  thisMonthWorkouts: number;
  volumeThisWeek: number;
  volumeThisMonth: number;
  mostActiveDay: string;
  favoriteExercises: Array<{ name: string; count: number }>;
}

interface ProgressDashboardProps {
  className?: string;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ 
  className 
}) => {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<ProgressMetrics>({
    totalWorkouts: 0,
    totalVolume: 0,
    totalDuration: 0,
    averageWorkoutDuration: 0,
    currentStreak: 0,
    thisWeekWorkouts: 0,
    thisMonthWorkouts: 0,
    volumeThisWeek: 0,
    volumeThisMonth: 0,
    mostActiveDay: 'Monday',
    favoriteExercises: [],
  });
  const [loading, setLoading] = useState(true);

  const workoutService = WorkoutService.getInstance();

  useEffect(() => {
    const loadProgressMetrics = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Get all completed workouts
        const workouts = await workoutService.getWorkoutsByUser(user.id);
        const completedWorkouts = workouts.filter(w => w.status === 'completed');

        if (completedWorkouts.length === 0) {
          setLoading(false);
          return;
        }

        // Calculate date ranges
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Filter workouts by time periods
        const thisWeekWorkouts = completedWorkouts.filter(w => {
          const workoutDate = new Date(w.completed_at || w.created_at);
          return workoutDate >= oneWeekAgo;
        });

        const thisMonthWorkouts = completedWorkouts.filter(w => {
          const workoutDate = new Date(w.completed_at || w.created_at);
          return workoutDate >= oneMonthAgo;
        });

        // Calculate basic metrics
        const totalVolume = completedWorkouts.reduce((sum, w) => sum + calculateWorkoutVolume(w), 0);
        const totalDuration = completedWorkouts.reduce((sum, w) => sum + (w.total_duration || 0), 0);
        const volumeThisWeek = thisWeekWorkouts.reduce((sum, w) => sum + calculateWorkoutVolume(w), 0);
        const volumeThisMonth = thisMonthWorkouts.reduce((sum, w) => sum + calculateWorkoutVolume(w), 0);

        // Calculate most active day
        const dayCount = new Map<string, number>();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        completedWorkouts.forEach(workout => {
          const workoutDate = new Date(workout.completed_at || workout.created_at);
          const dayName = dayNames[workoutDate.getDay()];
          dayCount.set(dayName, (dayCount.get(dayName) || 0) + 1);
        });

        const mostActiveDay = Array.from(dayCount.entries())
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Monday';

        // Calculate favorite exercises
        const exerciseCount = new Map<string, number>();
        completedWorkouts.forEach(workout => {
          workout.exercises.forEach(exercise => {
            const count = exerciseCount.get(exercise.exercise_id) || 0;
            exerciseCount.set(exercise.exercise_id, count + 1);
          });
        });

        const favoriteExercises = Array.from(exerciseCount.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([exerciseId, count]) => ({
            name: exerciseId, // TODO: Get actual exercise name
            count
          }));

        setMetrics({
          totalWorkouts: completedWorkouts.length,
          totalVolume,
          totalDuration,
          averageWorkoutDuration: completedWorkouts.length > 0 
            ? Math.round(totalDuration / completedWorkouts.length) 
            : 0,
          currentStreak: user.gamification.current_streak || 0,
          thisWeekWorkouts: thisWeekWorkouts.length,
          thisMonthWorkouts: thisMonthWorkouts.length,
          volumeThisWeek,
          volumeThisMonth,
          mostActiveDay,
          favoriteExercises,
        });

      } catch (error) {
        console.error('Error loading progress metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgressMetrics();
  }, [user, workoutService]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading metrics...</span>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: 'Total Workouts',
      value: metrics.totalWorkouts.toString(),
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Total Volume',
      value: formatVolume(metrics.totalVolume),
      icon: Dumbbell,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Total Time',
      value: formatDuration(metrics.totalDuration),
      icon: Clock,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Current Streak',
      value: `${metrics.currentStreak} days`,
      icon: Target,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`${stat.bgColor} rounded-lg p-4 border border-border`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                    <div className={`text-xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* This Week vs This Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">This Week</span>
              <div className="text-right">
                <div className="font-semibold text-foreground">
                  {metrics.thisWeekWorkouts} workouts
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatVolume(metrics.volumeThisWeek)}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">This Month</span>
              <div className="text-right">
                <div className="font-semibold text-foreground">
                  {metrics.thisMonthWorkouts} workouts
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatVolume(metrics.volumeThisMonth)}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Duration</span>
                <span className="font-semibold text-foreground">
                  {formatDuration(metrics.averageWorkoutDuration)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Most Active Day</span>
              <span className="font-semibold text-foreground">
                {metrics.mostActiveDay}
              </span>
            </div>

            {metrics.favoriteExercises.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">Top Exercises</div>
                <div className="space-y-1">
                  {metrics.favoriteExercises.slice(0, 3).map((exercise, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-foreground truncate">
                        {exercise.name}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {exercise.count}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {metrics.totalWorkouts > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(metrics.totalVolume / metrics.totalWorkouts)}kg
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Average volume per workout
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};