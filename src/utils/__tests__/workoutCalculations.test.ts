import { describe, it, expect } from 'vitest';
import {
  calculateSetVolume,
  calculateExerciseVolume,
  calculateWorkoutVolume,
  calculateWorkingSets,
  calculateTotalReps,
  calculateWorkoutDuration,
  calculateOneRepMax,
  calculateRelativeIntensity,
  calculateAverageRPE,
  calculateWorkoutIntensity,
  calculateTonnage,
  calculateWorkoutCompletion,
  findPersonalRecords,
  calculateWorkoutMetrics,
  formatDuration,
  formatWeight,
  formatVolume,
} from '../workoutCalculations';
import type { Workout, WorkoutExercise, SetData } from '@/types';

describe('workoutCalculations', () => {
  // Sample data for testing
  const sampleSet: SetData = {
    id: 'set-1',
    set_number: 1,
    type: 'normal',
    weight: 100,
    reps: 10,
    completed: true,
    planned_rest_time: 90,
  };

  const warmupSet: SetData = {
    id: 'set-warmup',
    set_number: 1,
    type: 'warmup',
    weight: 50,
    reps: 10,
    completed: true,
    planned_rest_time: 60,
  };

  const sampleExercise: WorkoutExercise = {
    id: 'exercise-1',
    exercise_id: 'bench-press',
    order: 0,
    sets: [
      warmupSet,
      { ...sampleSet, id: 'set-1', set_number: 1 },
      { ...sampleSet, id: 'set-2', set_number: 2, weight: 105, reps: 8 },
      { ...sampleSet, id: 'set-3', set_number: 3, weight: 110, reps: 6 },
    ],
  };

  const sampleWorkout: Workout = {
    id: 'workout-1',
    user_id: 'user-1',
    name: 'Test Workout',
    status: 'completed',
    is_template: false,
    exercises: [sampleExercise],
    auto_rest_timer: true,
    default_rest_time: 90,
    is_public: false,
    created_at: new Date('2025-01-01T10:00:00Z'),
    started_at: new Date('2025-01-01T10:00:00Z'),
    completed_at: new Date('2025-01-01T11:30:00Z'),
  };

  describe('calculateSetVolume', () => {
    it('should calculate volume for completed working set', () => {
      const volume = calculateSetVolume(sampleSet);
      expect(volume).toBe(1000); // 100kg × 10 reps
    });

    it('should return 0 for warmup sets', () => {
      const volume = calculateSetVolume(warmupSet);
      expect(volume).toBe(0);
    });

    it('should return 0 for incomplete sets', () => {
      const incompleteSet = { ...sampleSet, completed: false };
      const volume = calculateSetVolume(incompleteSet);
      expect(volume).toBe(0);
    });
  });

  describe('calculateExerciseVolume', () => {
    it('should calculate total volume for exercise excluding warmup', () => {
      const volume = calculateExerciseVolume(sampleExercise);
      // (100×10) + (105×8) + (110×6) = 1000 + 840 + 660 = 2500
      expect(volume).toBe(2500);
    });

    it('should handle exercise with no completed sets', () => {
      const exerciseWithNoSets: WorkoutExercise = {
        ...sampleExercise,
        sets: [{ ...sampleSet, completed: false }],
      };
      const volume = calculateExerciseVolume(exerciseWithNoSets);
      expect(volume).toBe(0);
    });
  });

  describe('calculateWorkoutVolume', () => {
    it('should calculate total workout volume', () => {
      const volume = calculateWorkoutVolume(sampleWorkout);
      expect(volume).toBe(2500);
    });

    it('should handle workout with multiple exercises', () => {
      const workoutWithMultipleExercises: Workout = {
        ...sampleWorkout,
        exercises: [
          sampleExercise,
          {
            ...sampleExercise,
            id: 'exercise-2',
            exercise_id: 'squats',
            sets: [
              { ...sampleSet, id: 'set-4', weight: 80, reps: 12 }, // 960
            ],
          },
        ],
      };
      const volume = calculateWorkoutVolume(workoutWithMultipleExercises);
      expect(volume).toBe(3460); // 2500 + 960
    });
  });

  describe('calculateWorkingSets', () => {
    it('should count only working sets', () => {
      const workingSets = calculateWorkingSets(sampleWorkout);
      expect(workingSets).toBe(3); // Excluding warmup set
    });
  });

  describe('calculateTotalReps', () => {
    it('should calculate total reps excluding warmup', () => {
      const totalReps = calculateTotalReps(sampleWorkout);
      expect(totalReps).toBe(24); // 10 + 8 + 6
    });
  });

  describe('calculateWorkoutDuration', () => {
    it('should calculate duration in seconds', () => {
      const duration = calculateWorkoutDuration(sampleWorkout);
      expect(duration).toBe(5400); // 1.5 hours = 5400 seconds
    });

    it('should return 0 if workout not started', () => {
      const workoutNotStarted = { ...sampleWorkout, started_at: undefined };
      const duration = calculateWorkoutDuration(workoutNotStarted);
      expect(duration).toBe(0);
    });
  });

  describe('calculateOneRepMax', () => {
    it('should return weight for 1 rep', () => {
      const oneRM = calculateOneRepMax(100, 1);
      expect(oneRM).toBe(100);
    });

    it('should calculate 1RM using Epley formula', () => {
      const oneRM = calculateOneRepMax(100, 10);
      expect(oneRM).toBe(133); // 100 × (1 + 10/30) = 133.33, rounded to 133
    });

    it('should return 0 for 0 reps', () => {
      const oneRM = calculateOneRepMax(100, 0);
      expect(oneRM).toBe(0);
    });
  });

  describe('calculateRelativeIntensity', () => {
    it('should calculate percentage of 1RM', () => {
      const intensity = calculateRelativeIntensity(100, 10, 133);
      expect(intensity).toBe(75); // 100/133 ≈ 75%
    });

    it('should return 0 if 1RM is 0', () => {
      const intensity = calculateRelativeIntensity(100, 10, 0);
      expect(intensity).toBe(0);
    });
  });

  describe('calculateAverageRPE', () => {
    it('should calculate average RPE for exercise', () => {
      const exerciseWithRPE: WorkoutExercise = {
        ...sampleExercise,
        sets: [
          { ...sampleSet, id: 'set-1', rpe: 7 },
          { ...sampleSet, id: 'set-2', rpe: 8 },
          { ...sampleSet, id: 'set-3', rpe: 9 },
        ],
      };
      const avgRPE = calculateAverageRPE(exerciseWithRPE);
      expect(avgRPE).toBe(8.0);
    });

    it('should return null if no RPE data', () => {
      const avgRPE = calculateAverageRPE(sampleExercise);
      expect(avgRPE).toBeNull();
    });

    it('should exclude warmup sets from RPE calculation', () => {
      const exerciseWithRPE: WorkoutExercise = {
        ...sampleExercise,
        sets: [
          { ...warmupSet, rpe: 5 }, // Should be excluded
          { ...sampleSet, id: 'set-1', rpe: 8 },
          { ...sampleSet, id: 'set-2', rpe: 9 },
        ],
      };
      const avgRPE = calculateAverageRPE(exerciseWithRPE);
      expect(avgRPE).toBe(8.5); // (8 + 9) / 2
    });
  });

  describe('calculateTonnage', () => {
    it('should calculate total weight moved', () => {
      const tonnage = calculateTonnage(sampleWorkout);
      expect(tonnage).toBe(2500); // Same as volume for this example
    });
  });

  describe('calculateWorkoutCompletion', () => {
    it('should calculate completion percentage', () => {
      const completion = calculateWorkoutCompletion(sampleWorkout);
      expect(completion).toBe(100); // All sets completed
    });

    it('should handle partially completed workout', () => {
      const partialWorkout: Workout = {
        ...sampleWorkout,
        exercises: [{
          ...sampleExercise,
          sets: [
            { ...sampleSet, id: 'set-1', completed: true },
            { ...sampleSet, id: 'set-2', completed: false },
          ],
        }],
      };
      const completion = calculateWorkoutCompletion(partialWorkout);
      expect(completion).toBe(50); // 1 of 2 sets completed
    });

    it('should return 0 for empty workout', () => {
      const emptyWorkout: Workout = {
        ...sampleWorkout,
        exercises: [],
      };
      const completion = calculateWorkoutCompletion(emptyWorkout);
      expect(completion).toBe(0);
    });
  });

  describe('findPersonalRecords', () => {
    it('should find max weight record', () => {
      const previousRecords = {
        'bench-press': { max_weight: 95 },
      };
      const records = findPersonalRecords(sampleWorkout, previousRecords);
      
      const maxWeightRecord = records.find(r => r.type === 'max_weight');
      expect(maxWeightRecord).toBeDefined();
      expect(maxWeightRecord?.value).toBe(110);
      expect(maxWeightRecord?.previousRecord).toBe(95);
    });

    it('should find max reps record', () => {
      const previousRecords = {
        'bench-press': { max_reps: 8 },
      };
      const records = findPersonalRecords(sampleWorkout, previousRecords);
      
      const maxRepsRecord = records.find(r => r.type === 'max_reps');
      expect(maxRepsRecord).toBeDefined();
      expect(maxRepsRecord?.value).toBe(10);
    });

    it('should find max 1RM record', () => {
      const previousRecords = {
        'bench-press': { max_1rm: 130 },
      };
      const records = findPersonalRecords(sampleWorkout, previousRecords);
      
      const max1RMRecord = records.find(r => r.type === 'max_1rm');
      expect(max1RMRecord).toBeDefined();
      expect(max1RMRecord?.value).toBe(133); // Max 1RM from all sets (100kg×10 or 105kg×8)
    });

    it('should not find records if no improvement', () => {
      const previousRecords = {
        'bench-press': { 
          max_weight: 120,
          max_reps: 15,
          max_1rm: 150,
          max_volume: 3000,
        },
      };
      const records = findPersonalRecords(sampleWorkout, previousRecords);
      expect(records).toHaveLength(0);
    });
  });

  describe('calculateWorkoutMetrics', () => {
    it('should calculate comprehensive workout metrics', () => {
      const metrics = calculateWorkoutMetrics(sampleWorkout);
      
      expect(metrics.duration).toBe(5400);
      expect(metrics.totalVolume).toBe(2500);
      expect(metrics.totalSets).toBe(3);
      expect(metrics.totalReps).toBe(24);
      expect(metrics.tonnage).toBe(2500);
      expect(metrics.completion).toBe(100);
      expect(metrics.personalRecords).toHaveLength(0); // No previous records provided
    });

    it('should handle errors gracefully', () => {
      const invalidWorkout = null as any;
      const metrics = calculateWorkoutMetrics(invalidWorkout);
      
      expect(metrics.duration).toBe(0);
      expect(metrics.totalVolume).toBe(0);
      expect(metrics.personalRecords).toHaveLength(0);
    });
  });

  describe('formatting functions', () => {
    describe('formatDuration', () => {
      it('should format seconds', () => {
        expect(formatDuration(45)).toBe('45s');
      });

      it('should format minutes', () => {
        expect(formatDuration(90)).toBe('1m 30s');
        expect(formatDuration(120)).toBe('2m');
      });

      it('should format hours', () => {
        expect(formatDuration(3600)).toBe('1h');
        expect(formatDuration(3900)).toBe('1h 5m');
      });
    });

    describe('formatWeight', () => {
      it('should format weight with default kg unit', () => {
        expect(formatWeight(100)).toBe('100kg');
      });

      it('should format weight with specified unit', () => {
        expect(formatWeight(220, 'lbs')).toBe('220lbs');
      });
    });

    describe('formatVolume', () => {
      it('should format volume under 1000', () => {
        expect(formatVolume(500)).toBe('500kg');
      });

      it('should format volume over 1000 with k suffix', () => {
        expect(formatVolume(2500)).toBe('2.5kkg');
      });

      it('should format volume with specified unit', () => {
        expect(formatVolume(5000, 'lbs')).toBe('5.0klbs');
      });
    });
  });
});