import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { WorkoutService } from '@/services/WorkoutService';
import { useAuthStore } from '@/stores';
import { useExercises } from '@/hooks/useExercises';
import { calculateOneRepMax, formatWeight } from '@/utils/workoutCalculations';
import { Trophy, TrendingUp, Calendar, Award } from 'lucide-react';
import type { Workout } from '@/schemas/workout';

interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'max_1rm';
  value: number;
  date: Date;
  workoutName: string;
}

interface PersonalRecordsListProps {
  className?: string;
  limit?: number;
}

export const PersonalRecordsList: React.FC<PersonalRecordsListProps> = ({
  className,
  limit = 10
}) => {
  const { user } = useAuthStore();
  const { getExerciseByIdSync } = useExercises();
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | PersonalRecord['type']>('all');

  const workoutService = WorkoutService.getInstance();

  useEffect(() => {
    const loadPersonalRecords = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Get all completed workouts
        const workouts = await workoutService.getWorkoutsByUser(user.id);
        const completedWorkouts = workouts.filter(w => w.status === 'completed');

        // Calculate personal records
        const recordsMap = new Map<string, PersonalRecord>();

        completedWorkouts.forEach(workout => {
          workout.exercises.forEach(exercise => {
            const exerciseData = getExerciseByIdSync(exercise.exercise_id);
            const exerciseName = exerciseData?.name || exercise.exercise_id;

            exercise.sets
              .filter(set => set.completed && set.type !== 'warmup')
              .forEach(set => {
                const workoutDate = new Date(workout.completed_at || workout.created_at);
                
                // Max Weight Record
                const weightKey = `${exercise.exercise_id}-max_weight`;
                const currentWeightRecord = recordsMap.get(weightKey);
                if (!currentWeightRecord || set.weight > currentWeightRecord.value) {
                  recordsMap.set(weightKey, {
                    exerciseId: exercise.exercise_id,
                    exerciseName,
                    type: 'max_weight',
                    value: set.weight,
                    date: workoutDate,
                    workoutName: workout.name,
                  });
                }

                // Max Reps Record
                const repsKey = `${exercise.exercise_id}-max_reps`;
                const currentRepsRecord = recordsMap.get(repsKey);
                if (!currentRepsRecord || set.reps > currentRepsRecord.value) {
                  recordsMap.set(repsKey, {
                    exerciseId: exercise.exercise_id,
                    exerciseName,
                    type: 'max_reps',
                    value: set.reps,
                    date: workoutDate,
                    workoutName: workout.name,
                  });
                }

                // Max 1RM Record
                const oneRM = calculateOneRepMax(set.weight, set.reps);
                const oneRMKey = `${exercise.exercise_id}-max_1rm`;
                const currentOneRMRecord = recordsMap.get(oneRMKey);
                if (!currentOneRMRecord || oneRM > currentOneRMRecord.value) {
                  recordsMap.set(oneRMKey, {
                    exerciseId: exercise.exercise_id,
                    exerciseName,
                    type: 'max_1rm',
                    value: oneRM,
                    date: workoutDate,
                    workoutName: workout.name,
                  });
                }
              });

            // Max Volume Record per exercise
            const exerciseVolume = exercise.sets
              .filter(set => set.completed && set.type !== 'warmup')
              .reduce((total, set) => total + (set.weight * set.reps), 0);

            if (exerciseVolume > 0) {
              const volumeKey = `${exercise.exercise_id}-max_volume`;
              const currentVolumeRecord = recordsMap.get(volumeKey);
              if (!currentVolumeRecord || exerciseVolume > currentVolumeRecord.value) {
                recordsMap.set(volumeKey, {
                  exerciseId: exercise.exercise_id,
                  exerciseName,
                  type: 'max_volume',
                  value: exerciseVolume,
                  date: new Date(workout.completed_at || workout.created_at),
                  workoutName: workout.name,
                });
              }
            }
          });
        });

        // Convert to array and sort by date (most recent first)
        const recordsArray = Array.from(recordsMap.values())
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, limit);

        setRecords(recordsArray);
      } catch (error) {
        console.error('Error loading personal records:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPersonalRecords();
  }, [user, workoutService, getExerciseByIdSync, limit]);

  const getRecordIcon = (type: PersonalRecord['type']) => {
    switch (type) {
      case 'max_weight': return '🏋️';
      case 'max_reps': return '🔢';
      case 'max_volume': return '📊';
      case 'max_1rm': return '💪';
      default: return '🏆';
    }
  };

  const getRecordLabel = (type: PersonalRecord['type']) => {
    switch (type) {
      case 'max_weight': return 'Max Weight';
      case 'max_reps': return 'Max Reps';
      case 'max_volume': return 'Max Volume';
      case 'max_1rm': return 'Max 1RM';
      default: return 'Record';
    }
  };

  const formatRecordValue = (type: PersonalRecord['type'], value: number) => {
    switch (type) {
      case 'max_weight':
      case 'max_1rm':
        return formatWeight(value);
      case 'max_reps':
        return `${value} reps`;
      case 'max_volume':
        return `${value.toLocaleString()}kg`;
      default:
        return value.toString();
    }
  };

  const filteredRecords = selectedType === 'all' 
    ? records 
    : records.filter(record => record.type === selectedType);

  const recordTypes = [
    { value: 'all' as const, label: 'All Records', icon: '🏆' },
    { value: 'max_weight' as const, label: 'Weight', icon: '🏋️' },
    { value: 'max_1rm' as const, label: '1RM', icon: '💪' },
    { value: 'max_reps' as const, label: 'Reps', icon: '🔢' },
    { value: 'max_volume' as const, label: 'Volume', icon: '📊' },
  ];

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Loading records...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Personal Records
        </CardTitle>
        
        {/* Filter Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto">
          {recordTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedType === type.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <span className="mr-1">{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredRecords.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No records yet</p>
            <p className="text-sm text-muted-foreground">
              Complete workouts to start tracking your personal records
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record, index) => {
              const daysAgo = Math.floor(
                (Date.now() - record.date.getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <div
                  key={`${record.exerciseId}-${record.type}-${index}`}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg">{getRecordIcon(record.type)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {record.exerciseName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getRecordLabel(record.type)} • {record.workoutName}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-primary">
                      {formatRecordValue(record.type, record.value)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {daysAgo === 0 ? 'Today' : 
                       daysAgo === 1 ? 'Yesterday' : 
                       `${daysAgo} days ago`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};