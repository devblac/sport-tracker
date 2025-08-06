/**
 * Percentile Calculation Integration Tests
 * 
 * Tests the complete percentile calculation system including calculator,
 * integration service, and demographic segmentation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PercentileCalculator, PerformanceData, UserDemographics } from '../PercentileCalculator';
import { PercentileIntegrationService } from '../PercentileIntegrationService';
import { Workout, WorkoutExercise } from '../../types/workoutModels';
import { User } from '../../types/userModels';
import { Exercise } from '../../types/exerciseModels';

describe('Percentile Calculation System', () => {
  let calculator: PercentileCalculator;
  let integrationService: PercentileIntegrationService;

  beforeEach(() => {
    calculator = new PercentileCalculator();
    integrationService = new PercentileIntegrationService();
  });

  describe('PercentileCalculator', () => {
    it('should calculate correct percentiles for single metric', () => {
      const demographics: UserDemographics = {
        age: 25,
        gender: 'male',
        weight: 80,
        experienceLevel: 'intermediate'
      };

      // Add sample data - 10 users with weights from 60-150kg
      const sampleData: PerformanceData[] = [];
      for (let i = 0; i < 10; i++) {
        sampleData.push({
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          weight: 60 + (i * 10), // 60, 70, 80, ..., 150
          reps: 5,
          estimatedOneRM: (60 + (i * 10)) * 1.167,
          bodyWeight: 80,
          date: new Date(),
          userId: `user-${i}`,
          demographics
        });
      }

      calculator.addBulkPerformanceData(sampleData);

      // Test user with 100kg (should be 50th percentile - 5th out of 10)
      const result = calculator.calculatePercentile(
        'bench-press',
        100,
        'weight',
        demographics
      );

      expect(result.percentile).toBe(40); // 4 users below 100kg out of 10 = 40th percentile
      expect(result.rank).toBe(6); // 6th position when sorted descending
      expect(result.totalUsers).toBe(10);
      expect(result.metric).toBe('weight');
      expect(result.value).toBe(100);
    });

    it('should segment users correctly by demographics', () => {
      const maleDemographics: UserDemographics = {
        age: 25,
        gender: 'male',
        weight: 80,
        experienceLevel: 'intermediate'
      };

      const femaleDemographics: UserDemographics = {
        age: 25,
        gender: 'female',
        weight: 60,
        experienceLevel: 'intermediate'
      };

      // Add male users
      for (let i = 0; i < 5; i++) {
        calculator.addPerformanceData({
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          weight: 80 + (i * 10),
          reps: 5,
          estimatedOneRM: (80 + (i * 10)) * 1.167,
          bodyWeight: 80,
          date: new Date(),
          userId: `male-${i}`,
          demographics: maleDemographics
        });
      }

      // Add female users
      for (let i = 0; i < 5; i++) {
        calculator.addPerformanceData({
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          weight: 40 + (i * 10),
          reps: 5,
          estimatedOneRM: (40 + (i * 10)) * 1.167,
          bodyWeight: 60,
          date: new Date(),
          userId: `female-${i}`,
          demographics: femaleDemographics
        });
      }

      // Test male user - should only compare against other males
      const maleResult = calculator.calculatePercentile(
        'bench-press',
        100,
        'weight',
        maleDemographics
      );

      expect(maleResult.totalUsers).toBe(5); // Only males in segment
      expect(maleResult.segment).toContain('Men');

      // Test female user - should only compare against other females
      const femaleResult = calculator.calculatePercentile(
        'bench-press',
        60,
        'weight',
        femaleDemographics
      );

      expect(femaleResult.totalUsers).toBe(5); // Only females in segment
      expect(femaleResult.segment).toContain('Women');
    });

    it('should calculate all metrics correctly', () => {
      const demographics: UserDemographics = {
        age: 30,
        gender: 'male',
        weight: 80,
        experienceLevel: 'advanced'
      };

      const performanceData: PerformanceData = {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        weight: 100,
        reps: 5,
        estimatedOneRM: 116.7,
        bodyWeight: 80,
        date: new Date(),
        userId: 'test-user',
        demographics
      };

      // Add some comparison data
      for (let i = 0; i < 10; i++) {
        calculator.addPerformanceData({
          ...performanceData,
          userId: `user-${i}`,
          weight: 80 + (i * 5),
          estimatedOneRM: (80 + (i * 5)) * 1.167
        });
      }

      const percentiles = calculator.getExercisePercentiles('bench-press', performanceData);

      expect(percentiles).toHaveLength(4); // weight, oneRM, volume, relative_strength
      expect(percentiles.find(p => p.metric === 'weight')).toBeDefined();
      expect(percentiles.find(p => p.metric === 'oneRM')).toBeDefined();
      expect(percentiles.find(p => p.metric === 'volume')).toBeDefined();
      expect(percentiles.find(p => p.metric === 'relative_strength')).toBeDefined();

      const volumePercentile = percentiles.find(p => p.metric === 'volume');
      expect(volumePercentile?.value).toBe(500); // 100kg * 5 reps
    });

    it('should handle edge cases correctly', () => {
      const demographics: UserDemographics = {
        age: 25,
        gender: 'male',
        weight: 80,
        experienceLevel: 'beginner'
      };

      // Test with no data
      const emptyResult = calculator.calculatePercentile(
        'nonexistent-exercise',
        100,
        'weight',
        demographics
      );

      expect(emptyResult.percentile).toBe(50); // Default percentile
      expect(emptyResult.totalUsers).toBe(0);

      // Test with single data point
      calculator.addPerformanceData({
        exerciseId: 'squat',
        exerciseName: 'Squat',
        weight: 100,
        reps: 5,
        estimatedOneRM: 116.7,
        bodyWeight: 80,
        date: new Date(),
        userId: 'single-user',
        demographics
      });

      const singleResult = calculator.calculatePercentile(
        'squat',
        120,
        'weight',
        demographics
      );

      expect(singleResult.percentile).toBe(100); // Better than the only other user
      expect(singleResult.totalUsers).toBe(1);
    });
  });

  describe('PercentileIntegrationService', () => {
    it('should process workout and update percentiles', async () => {
      const user: User = {
        id: 'test-user',
        email: 'test@example.com',
        profile: {
          age: 28,
          gender: 'male',
          weight: 75,
          totalWorkouts: 50
        }
      };

      const exercise: Exercise = {
        id: 'bench-press',
        name: 'Bench Press',
        category: 'chest',
        bodyParts: ['chest'],
        muscleGroups: ['pectorals'],
        equipment: 'barbell'
      };

      const workout: Workout = {
        id: 'workout-1',
        userId: 'test-user',
        name: 'Push Day',
        exercises: [{
          exerciseId: 'bench-press',
          sets: [
            { weight: 80, reps: 8, type: 'normal' },
            { weight: 85, reps: 6, type: 'normal' },
            { weight: 90, reps: 4, type: 'normal' }
          ]
        }],
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 3600,
        totalVolume: 0
      };

      const updates = await integrationService.processWorkout(workout, [exercise], user);

      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0].exerciseId).toBe('bench-press');
      expect(updates[0].exerciseName).toBe('Bench Press');

      // Check that percentiles were calculated
      const percentiles = integrationService.getUserExercisePercentiles('test-user', 'bench-press');
      expect(percentiles.length).toBe(4); // All metrics
    });

    it('should detect personal bests correctly', async () => {
      const user: User = {
        id: 'test-user',
        email: 'test@example.com',
        profile: {
          age: 25,
          gender: 'female',
          weight: 60,
          totalWorkouts: 30
        }
      };

      const exercise: Exercise = {
        id: 'squat',
        name: 'Squat',
        category: 'legs',
        bodyParts: ['legs'],
        muscleGroups: ['quadriceps'],
        equipment: 'barbell'
      };

      // First workout
      const workout1: Workout = {
        id: 'workout-1',
        userId: 'test-user',
        name: 'Leg Day 1',
        exercises: [{
          exerciseId: 'squat',
          sets: [{ weight: 60, reps: 5, type: 'normal' }]
        }],
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 3600,
        totalVolume: 0
      };

      await integrationService.processWorkout(workout1, [exercise], user);

      // Second workout with improvement
      const workout2: Workout = {
        id: 'workout-2',
        userId: 'test-user',
        name: 'Leg Day 2',
        exercises: [{
          exerciseId: 'squat',
          sets: [{ weight: 70, reps: 5, type: 'normal' }]
        }],
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 3600,
        totalVolume: 0
      };

      const updates = await integrationService.processWorkout(workout2, [exercise], user);

      // Should detect new PR
      expect(updates.some(update => update.isNewPR)).toBe(true);

      const personalBest = integrationService.getUserPersonalBest('test-user', 'squat');
      expect(personalBest?.weight).toBe(70);
    });

    it('should handle bulk historical data import', async () => {
      const users: User[] = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          profile: { age: 25, gender: 'male', weight: 80, totalWorkouts: 100 }
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          profile: { age: 30, gender: 'female', weight: 65, totalWorkouts: 75 }
        }
      ];

      const exercises: Exercise[] = [
        {
          id: 'bench-press',
          name: 'Bench Press',
          category: 'chest',
          bodyParts: ['chest'],
          muscleGroups: ['pectorals'],
          equipment: 'barbell'
        }
      ];

      const workouts: Workout[] = [
        {
          id: 'workout-1',
          userId: 'user-1',
          name: 'Push Day',
          exercises: [{
            exerciseId: 'bench-press',
            sets: [{ weight: 100, reps: 5, type: 'normal' }]
          }],
          startedAt: new Date(),
          completedAt: new Date(),
          duration: 3600,
          totalVolume: 0
        },
        {
          id: 'workout-2',
          userId: 'user-2',
          name: 'Push Day',
          exercises: [{
            exerciseId: 'bench-press',
            sets: [{ weight: 50, reps: 8, type: 'normal' }]
          }],
          startedAt: new Date(),
          completedAt: new Date(),
          duration: 3600,
          totalVolume: 0
        }
      ];

      await integrationService.importHistoricalData(workouts, exercises, users);

      // Check that data was imported correctly
      const user1Percentiles = integrationService.getUserExercisePercentiles('user-1', 'bench-press');
      const user2Percentiles = integrationService.getUserExercisePercentiles('user-2', 'bench-press');

      expect(user1Percentiles.length).toBeGreaterThan(0);
      expect(user2Percentiles.length).toBeGreaterThan(0);

      // Male user should have higher percentile in mixed comparison
      const user1OneRM = user1Percentiles.find(p => p.metric === 'oneRM');
      const user2OneRM = user2Percentiles.find(p => p.metric === 'oneRM');

      expect(user1OneRM?.percentile).toBeGreaterThan(user2OneRM?.percentile || 0);
    });

    it('should calculate overall user percentile correctly', () => {
      const user: User = {
        id: 'test-user',
        email: 'test@example.com',
        profile: { age: 28, gender: 'male', weight: 80, totalWorkouts: 50 }
      };

      // Simulate some percentile data
      integrationService['userProfiles'].set('test-user', {
        userId: 'test-user',
        demographics: {
          age: 28,
          gender: 'male',
          weight: 80,
          experienceLevel: 'intermediate'
        },
        lastUpdated: new Date(),
        exercisePercentiles: new Map([
          ['bench-press', [
            { percentile: 80, rank: 2, totalUsers: 10, segment: 'Men 26-35, 75-90kg', exerciseId: 'bench-press', metric: 'oneRM', value: 120, isPersonalBest: true },
            { percentile: 75, rank: 3, totalUsers: 10, segment: 'Men 26-35, 75-90kg', exerciseId: 'bench-press', metric: 'weight', value: 100, isPersonalBest: false }
          ]],
          ['squat', [
            { percentile: 60, rank: 4, totalUsers: 10, segment: 'Men 26-35, 75-90kg', exerciseId: 'squat', metric: 'oneRM', value: 140, isPersonalBest: true }
          ]]
        ]),
        personalBests: new Map()
      });

      const overall = integrationService.getUserOverallPercentile('test-user');

      expect(overall.overallPercentile).toBe(72); // Average of 80, 75, 60
      expect(overall.strongestExercises.length).toBeGreaterThan(0);
      expect(overall.improvementAreas.length).toBeGreaterThan(0);
      expect(overall.strongestExercises[0].percentile).toBe(80); // Highest percentile first
    });
  });

  describe('Real-time Updates', () => {
    it('should notify subscribers of percentile updates', async () => {
      let receivedUpdates: any[] = [];
      
      const unsubscribe = integrationService.onPercentileUpdate((updates) => {
        receivedUpdates = updates;
      });

      const user: User = {
        id: 'test-user',
        email: 'test@example.com',
        profile: { age: 25, gender: 'male', weight: 75, totalWorkouts: 20 }
      };

      const exercise: Exercise = {
        id: 'deadlift',
        name: 'Deadlift',
        category: 'back',
        bodyParts: ['back'],
        muscleGroups: ['latissimus'],
        equipment: 'barbell'
      };

      const workout: Workout = {
        id: 'workout-1',
        userId: 'test-user',
        name: 'Pull Day',
        exercises: [{
          exerciseId: 'deadlift',
          sets: [{ weight: 120, reps: 5, type: 'normal' }]
        }],
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 3600,
        totalVolume: 0
      };

      await integrationService.processWorkout(workout, [exercise], user);

      expect(receivedUpdates.length).toBeGreaterThan(0);
      expect(receivedUpdates[0].exerciseId).toBe('deadlift');
      expect(receivedUpdates[0].isNewPR).toBe(true);

      unsubscribe();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = Date.now();
      
      // Add 1000 performance records
      const largeDataset: PerformanceData[] = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          weight: 50 + Math.random() * 100,
          reps: 3 + Math.floor(Math.random() * 8),
          estimatedOneRM: 60 + Math.random() * 120,
          bodyWeight: 60 + Math.random() * 40,
          date: new Date(),
          userId: `user-${i}`,
          demographics: {
            age: 18 + Math.floor(Math.random() * 32),
            gender: Math.random() > 0.5 ? 'male' : 'female',
            weight: 60 + Math.random() * 40,
            experienceLevel: 'intermediate'
          }
        });
      }

      calculator.addBulkPerformanceData(largeDataset);

      const result = calculator.calculatePercentile(
        'bench-press',
        100,
        'weight',
        { age: 25, gender: 'male', weight: 80, experienceLevel: 'intermediate' }
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.totalUsers).toBeGreaterThan(0);
      expect(result.percentile).toBeGreaterThanOrEqual(0);
      expect(result.percentile).toBeLessThanOrEqual(100);
    });

    it('should handle invalid or missing data gracefully', () => {
      const demographics: UserDemographics = {
        age: 25,
        gender: 'male',
        weight: 80,
        experienceLevel: 'intermediate'
      };

      // Test with invalid exercise ID
      const result = calculator.calculatePercentile(
        'invalid-exercise',
        100,
        'weight',
        demographics
      );

      expect(result.percentile).toBe(50);
      expect(result.totalUsers).toBe(0);

      // Test with extreme demographics that don't match any segment
      const extremeDemographics: UserDemographics = {
        age: 150,
        gender: 'other',
        weight: 300,
        experienceLevel: 'beginner'
      };

      const extremeResult = calculator.calculatePercentile(
        'bench-press',
        100,
        'weight',
        extremeDemographics
      );

      expect(extremeResult.segment).toContain('All Users'); // Should fall back to general segment
    });
  });
});