import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { WorkoutService } from '@/services/WorkoutService';
import { useAuthStore } from '@/stores';
import { calculateWorkoutVolume, formatDuration, formatVolume } from '@/utils/workoutCalculations';
import { Calendar, TrendingUp, Dumbbell, Clock, Target } from 'lucide-react';
import type { Workout } from '@/schemas/workout';

interface ActivitySummaryProps {
  className?: string;
}

interface WeeklyStats {
  workoutsCompleted: number;
  totalVolume: number;
  totalDuration: number;
  averageDuration: number;
  streak: number;
}

export const ActivitySummary: React.FC<ActivitySummaryProps> = ({ 
  className 
}) => {
  const { user } = useAuthStore();
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    workoutsCompleted: 0,
    totalVolume: 0,
    totalDuration: 0,
    averageDuration: 0,
    streak: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const workoutService = WorkoutService.getInstance();

  useEffect(() => {
    const loadActivityData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get recent workouts (last 30 days)
        const allWorkouts = await workoutService.getWorkoutsByUser(user.id);
        const completedWorkouts = allWorkouts.filter(w => w.status === 'completed');
        
        // Filter last 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const weeklyWorkouts = completedWorkouts.filter(workout => {
          const workoutDate = new Date(workout.completed_at || workout.created_at);
          return workoutDate >= oneWeekAgo;
        });

        // Calculate weekly stats
        const totalVolume = weeklyWorkouts.reduce((sum, workout) => 
          sum + calculateWorkoutVolume(workout), 0
        );
        
        const totalDuration = weeklyWorkouts.reduce((sum, workout) => 
          sum + (workout.total_duration || 0), 0
        );

        const averageDuration = weeklyWorkouts.length > 0 
          ? Math.round(totalDuration / weeklyWorkouts.length) 
          : 0;

        setWeeklyStats({
          workoutsCompleted: weeklyWorkouts.length,
          totalVolume,
          totalDuration,
          averageDuration,
          streak: user.gamification.current_streak || 0,
        });

        // Set recent workouts for display
        setRecentWorkouts(completedWorkouts.slice(0, 3));
        
      } catch (error) {
        console.error('Error loading activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivityData();
  }, [user, workoutService]);

  const getWeeklyGoalProgress = () => {
    const weeklyGoal = user?.fitness_goals?.weekly_workouts || 3;
    const progress = Math.min((weeklyStats.workoutsCompleted / weeklyGoal) * 100, 100);
    return { progress, goal: weeklyGoal };
  };

  const { progress: goalProgress, goal: weeklyGoal } = getWeeklyGoalProgress();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading activity...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          This Week's Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weekly Goal Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Weekly Goal</span>
            <span className="font-medium">
              {weeklyStats.workoutsCompleted}/{weeklyGoal} workouts
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          {goalProgress >= 100 && (
            <div className="text-xs text-primary font-medium">
              🎉 Goal achieved! Great work!
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Dumbbell className="w-4 h-4 text-primary" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {formatVolume(weeklyStats.totalVolume)}
            </div>
            <div className="text-xs text-muted-foreground">Volume</div>
          </div>
          
          <div className="text-center p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="text-lg font-bold text-foreground">
              {formatDuration(weeklyStats.averageDuration)}
            </div>
            <div className="text-xs text-muted-foreground">Avg Duration</div>
          </div>
        </div>

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Recent Workouts
            </h4>
            {recentWorkouts.map((workout) => {
              const workoutDate = new Date(workout.completed_at || workout.created_at);
              const daysAgo = Math.floor(
                (Date.now() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <div 
                  key={workout.id}
                  className="flex items-center justify-between p-2 bg-secondary/30 rounded-md"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {workout.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {daysAgo === 0 ? 'Today' : 
                       daysAgo === 1 ? 'Yesterday' : 
                       `${daysAgo} days ago`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formatVolume(calculateWorkoutVolume(workout))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDuration(workout.total_duration || 0)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Activity State */}
        {weeklyStats.workoutsCompleted === 0 && (
          <div className="text-center py-4">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              No workouts this week yet
            </p>
            <p className="text-xs text-muted-foreground">
              Start your first workout to see your progress here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};