import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { WorkoutService } from '@/services/WorkoutService';
import { useAuthStore } from '@/stores';
import { calculateWorkoutVolume } from '@/utils/workoutCalculations';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import type { Workout } from '@/schemas/workout';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface ProgressChartsProps {
  className?: string;
}

interface ChartData {
  weeklyVolume: {
    labels: string[];
    data: number[];
  };
  monthlyWorkouts: {
    labels: string[];
    data: number[];
  };
  volumeProgress: {
    labels: string[];
    data: number[];
  };
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({ 
  className 
}) => {
  const { user } = useAuthStore();
  const [chartData, setChartData] = useState<ChartData>({
    weeklyVolume: { labels: [], data: [] },
    monthlyWorkouts: { labels: [], data: [] },
    volumeProgress: { labels: [], data: [] },
  });
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<'volume' | 'workouts' | 'progress'>('volume');

  const workoutService = WorkoutService.getInstance();

  useEffect(() => {
    const loadChartData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Get all completed workouts
        const workouts = await workoutService.getWorkoutsByUser(user.id);
        const completedWorkouts = workouts
          .filter(w => w.status === 'completed')
          .sort((a, b) => new Date(a.completed_at || a.created_at).getTime() - 
                          new Date(b.completed_at || b.created_at).getTime());

        if (completedWorkouts.length === 0) {
          setLoading(false);
          return;
        }

        // Generate weekly volume data (last 8 weeks)
        const weeklyVolumeData = generateWeeklyVolumeData(completedWorkouts);
        
        // Generate monthly workout count (last 6 months)
        const monthlyWorkoutData = generateMonthlyWorkoutData(completedWorkouts);
        
        // Generate volume progress over time (last 10 workouts)
        const volumeProgressData = generateVolumeProgressData(completedWorkouts);

        setChartData({
          weeklyVolume: weeklyVolumeData,
          monthlyWorkouts: monthlyWorkoutData,
          volumeProgress: volumeProgressData,
        });

      } catch (error) {
        console.error('Error loading chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [user, workoutService]);

  const generateWeeklyVolumeData = (workouts: Workout[]) => {
    const weeks = [];
    const data = [];
    const now = new Date();
    
    // Generate last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      weeks.push(weekLabel);

      const weekWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.completed_at || workout.created_at);
        return workoutDate >= weekStart && workoutDate <= weekEnd;
      });

      const weekVolume = weekWorkouts.reduce((sum, workout) => 
        sum + calculateWorkoutVolume(workout), 0
      );
      
      data.push(Math.round(weekVolume));
    }

    return { labels: weeks, data };
  };

  const generateMonthlyWorkoutData = (workouts: Workout[]) => {
    const months = [];
    const data = [];
    const now = new Date();
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short' });
      months.push(monthLabel);

      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.completed_at || workout.created_at);
        return workoutDate >= monthStart && workoutDate <= monthEnd;
      });

      data.push(monthWorkouts.length);
    }

    return { labels: months, data };
  };

  const generateVolumeProgressData = (workouts: Workout[]) => {
    const recentWorkouts = workouts.slice(-10); // Last 10 workouts
    const labels = recentWorkouts.map((_, index) => `W${index + 1}`);
    const data = recentWorkouts.map(workout => 
      Math.round(calculateWorkoutVolume(workout))
    );

    return { labels, data };
  };

  const chartOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  const getChartConfig = () => {
    switch (selectedChart) {
      case 'volume':
        return {
          type: 'bar' as const,
          data: {
            labels: chartData.weeklyVolume.labels,
            datasets: [{
              data: chartData.weeklyVolume.data,
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
              borderRadius: 4,
            }],
          },
          title: 'Weekly Volume (kg)',
          icon: BarChart3,
        };
      
      case 'workouts':
        return {
          type: 'bar' as const,
          data: {
            labels: chartData.monthlyWorkouts.labels,
            datasets: [{
              data: chartData.monthlyWorkouts.data,
              backgroundColor: 'rgba(16, 185, 129, 0.6)',
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 1,
              borderRadius: 4,
            }],
          },
          title: 'Monthly Workouts',
          icon: Calendar,
        };
      
      case 'progress':
        return {
          type: 'line' as const,
          data: {
            labels: chartData.volumeProgress.labels,
            datasets: [{
              data: chartData.volumeProgress.data,
              borderColor: 'rgba(168, 85, 247, 1)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: 'rgba(168, 85, 247, 1)',
              pointBorderColor: 'white',
              pointBorderWidth: 2,
              pointRadius: 4,
            }],
          },
          title: 'Volume Progress',
          icon: TrendingUp,
        };
      
      default:
        return getChartConfig();
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading charts...</span>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = getChartConfig();
  const Icon = chartConfig.icon;

  const chartTabs = [
    { key: 'volume', label: 'Volume', icon: BarChart3 },
    { key: 'workouts', label: 'Workouts', icon: Calendar },
    { key: 'progress', label: 'Progress', icon: TrendingUp },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {chartConfig.title}
        </CardTitle>
        
        {/* Chart Tabs */}
        <div className="flex gap-1 mt-4">
          {chartTabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedChart(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  selectedChart === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent>
        {chartData.weeklyVolume.data.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No data to display</p>
            <p className="text-sm text-muted-foreground">
              Complete more workouts to see your progress charts
            </p>
          </div>
        ) : (
          <div className="h-64">
            {chartConfig.type === 'bar' ? (
              <Bar data={chartConfig.data} options={chartOptions} />
            ) : (
              <Line data={chartConfig.data} options={chartOptions} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};