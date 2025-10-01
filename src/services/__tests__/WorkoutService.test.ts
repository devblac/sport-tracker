import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkoutService } from '../WorkoutService';
import { getDatabaseService } from '@/db/DatabaseService';

// Mock the database service
vi.mock('@/db/DatabaseService');

const mockDatabaseService = {
  workouts: {
    create: vi.fn(),
    getById: vi.fn(),
    getByUserId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn()
  },
  exercises: {
    getById: vi.fn(),
    getAll: vi.fn()
  },
  exerciseHistory: {
    create: vi.fn(),
    getByWorkoutId: vi.fn()
  }
};

const mockWorkout = {
  id: 'workout-1',
  user_id: 'user-1',
  name: 'Test Workout',
  status: 'planned' as const,
  exercises: [],
  started_at: null,
  completed_at: null,
  is_template: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

describe('WorkoutService', () => {
  let workoutService: WorkoutService;

  beforeEach(() => {
    vi.clearAllMocks();
    (getDatabaseService as any).mockReturnValue(mockDatabaseService);
    workoutService = new WorkoutService();
  });

  describe('createWorkout', () => {
    it('should create a workout successfully', async () => {
      mockDatabaseService.workouts.create.mockResolvedValue(mockWorkout);

      const workoutData = {
        name: 'Test Workout',
        user_id: 'user-1',
        exercises: []
      };

      const result = await workoutService.createWorkout(workoutData);

      expect(mockDatabaseService.workouts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Workout',
          user_id: 'user-1',
          status: 'planned'
        })
      );
      expect(result).toEqual(mockWorkout);
    });

    it('should validate workout data before creation', async () => {
      const invalidData = {
        name: '', // Empty name should fail
        user_id: 'user-1',
        exercises: []
      };

      await expect(workoutService.createWorkout(invalidData))
        .rejects.toThrow('Workout name is required');
    });

    it('should handle database errors', async () => {
      mockDatabaseService.workouts.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      const workoutData = {
        name: 'Test Workout',
        user_id: 'user-1',
        exercises: []
      };

      await expect(workoutService.createWorkout(workoutData))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('startWorkout', () => {
    it('should start a workout successfully', async () => {
      const startedWorkout = {
        ...mockWorkout,
        status: 'in_progress' as const,
        started_at: new Date().toISOString()
      };

      mockDatabaseService.workouts.getById.mockResolvedValue(mockWorkout);
      mockDatabaseService.workouts.update.mockResolvedValue(startedWorkout);

      const result = await workoutService.startWorkout('workout-1');

      expect(mockDatabaseService.workouts.update).toHaveBeenCalledWith(
        'workout-1',
        expect.objectContaining({
          status: 'in_progress',
          started_at: expect.any(String)
        })
      );
      expect(result.status).toBe('in_progress');
    });

    it('should not start already active workout', async () => {
      const activeWorkout = {
        ...mockWorkout,
        status: 'in_progress' as const
      };

      mockDatabaseService.workouts.getById.mockResolvedValue(activeWorkout);

      await expect(workoutService.startWorkout('workout-1'))
        .rejects.toThrow('Workout is already in progress');
    });

    it('should not start completed workout', async () => {
      const completedWorkout = {
        ...mockWorkout,
        status: 'completed' as const
      };

      mockDatabaseService.workouts.getById.mockResolvedValue(completedWorkout);

      await expect(workoutService.startWorkout('workout-1'))
        .rejects.toThrow('Cannot start completed workout');
    });
  });

  describe('completeWorkout', () => {
    it('should complete a workout successfully', async () => {
      const activeWorkout = {
        ...mockWorkout,
        status: 'in_progress' as const,
        exercises: [
          {
            id: 'exercise-1',
            exercise_id: 'bench-press',
            name: 'Bench Press',
            sets: [
              { id: 'set-1', weight: 80, reps: 10, type: 'normal', completed: true }
            ]
          }
        ]
      };

      const completedWorkout = {
        ...activeWorkout,
        status: 'completed' as const,
        completed_at: new Date().toISOString()
      };

      mockDatabaseService.workouts.getById.mockResolvedValue(activeWorkout);
      mockDatabaseService.workouts.update.mockResolvedValue(completedWorkout);

      const result = await workoutService.completeWorkout('workout-1');

      expect(mockDatabaseService.workouts.update).toHaveBeenCalledWith(
        'workout-1',
        expect.objectContaining({
          status: 'completed',
          completed_at: expect.any(String)
        })
      );
      expect(result.status).toBe('completed');
    });

    it('should save exercise history on completion', async () => {
      const activeWorkout = {
        ...mockWorkout,
        status: 'in_progress' as const,
        exercises: [
          {
            id: 'exercise-1',
            exercise_id: 'bench-press',
            name: 'Bench Press',
            sets: [
              { id: 'set-1', weight: 80, reps: 10, type: 'normal', completed: true }
            ]
          }
        ]
      };

      mockDatabaseService.workouts.getById.mockResolvedValue(activeWorkout);
      mockDatabaseService.workouts.update.mockResolvedValue({
        ...activeWorkout,
        status: 'completed' as const
      });

      await workoutService.completeWorkout('workout-1');

      expect(mockDatabaseService.exerciseHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workout_id: 'workout-1',
          exercise_id: 'bench-press',
          sets: expect.any(Array)
        })
      );
    });

    it('should not complete workout without exercises', async () => {
      const emptyWorkout = {
        ...mockWorkout,
        status: 'in_progress' as const,
        exercises: []
      };

      mockDatabaseService.workouts.getById.mockResolvedValue(emptyWorkout);

      await expect(workoutService.completeWorkout('workout-1'))
        .rejects.toThrow('Cannot complete workout without exercises');
    });
  });

  describe('addExerciseToWorkout', () => {
    it('should add exercise to workout', async () => {
      const workoutWithExercise = {
        ...mockWorkout,
        exercises: [
          {
            id: 'exercise-1',
            exercise_id: 'bench-press',
            name: 'Bench Press',
            sets: []
          }
        ]
      };

      mockDatabaseService.workouts.getById.mockResolvedValue(mockWorkout);
      mockDatabaseService.exercises.getById.mockResolvedValue({
        id: 'bench-press',
        name: 'Bench Press'
      });
      mockDatabaseService.workouts.update.mockResolvedValue(workoutWithExercise);

      const result = await workoutService.addExerciseToWorkout('workout-1', {
        exercise_id: 'bench-press',
        name: 'Bench Press'
      });

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].name).toBe('Bench Press');
    });

    it('should prevent duplicate exercises', async () => {
      const workoutWithExercise = {
        ...mockWorkout,
        exercises: [
          {
            id: 'exercise-1',
            exercise_id: 'bench-press',
            name: 'Bench Press',
            sets: []
          }
        ]
      };

      mockDatabaseService.workouts.getById.mockResolvedValue(workoutWithExercise);

      await expect(workoutService.addExerciseToWorkout('workout-1', {
        exercise_id: 'bench-press',
        name: 'Bench Press'
      })).rejects.toThrow('Exercise already exists in workout');
    });
  });

  describe('logSet', () => {
    it('should log a set to exercise', async () => {
      const workoutWithExercise = {
        ...mockWorkout,
        exercises: [
          {
            id: 'exercise-1',
            exercise_id: 'bench-press',
            name: 'Bench Press',
            sets: []
          }
        ]
      };

      const setData = {
        weight: 80,
        reps: 10,
        type: 'normal' as const
      };

      mockDatabaseService.workouts.getById.mockResolvedValue(workoutWithExercise);
      mockDatabaseService.workouts.update.mockResolvedValue({
        ...workoutWithExercise,
        exercises: [
          {
            ...workoutWithExercise.exercises[0],
            sets: [{ id: 'set-1', ...setData, completed: true }]
          }
        ]
      });

      const result = await workoutService.logSet('workout-1', 'exercise-1', setData);

      expect(result.exercises[0].sets).toHaveLength(1);
      expect(result.exercises[0].sets[0]).toMatchObject(setData);
    });

    it('should validate set data', async () => {
      const invalidSetData = {
        weight: -10, // Negative weight should fail
        reps: 0,
        type: 'normal' as const
      };

      await expect(workoutService.logSet('workout-1', 'exercise-1', invalidSetData))
        .rejects.toThrow('Weight must be positive');
    });
  });

  describe('getUserWorkouts', () => {
    it('should get user workouts with pagination', async () => {
      const workouts = [mockWorkout];
      mockDatabaseService.workouts.getByUserId.mockResolvedValue(workouts);

      const result = await workoutService.getUserWorkouts('user-1', {
        limit: 10,
        offset: 0
      });

      expect(mockDatabaseService.workouts.getByUserId).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          limit: 10,
          offset: 0
        })
      );
      expect(result).toEqual(workouts);
    });

    it('should filter workouts by status', async () => {
      const completedWorkouts = [{ ...mockWorkout, status: 'completed' as const }];
      mockDatabaseService.workouts.getByUserId.mockResolvedValue(completedWorkouts);

      const result = await workoutService.getUserWorkouts('user-1', {
        status: 'completed'
      });

      expect(mockDatabaseService.workouts.getByUserId).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          status: 'completed'
        })
      );
      expect(result[0].status).toBe('completed');
    });
  });

  describe('calculateWorkoutStats', () => {
    it('should calculate workout statistics', async () => {
      const workoutWithSets = {
        ...mockWorkout,
        exercises: [
          {
            id: 'exercise-1',
            exercise_id: 'bench-press',
            name: 'Bench Press',
            sets: [
              { id: 'set-1', weight: 80, reps: 10, type: 'normal', completed: true },
              { id: 'set-2', weight: 80, reps: 8, type: 'normal', completed: true }
            ]
          }
        ]
      };

      const stats = await workoutService.calculateWorkoutStats(workoutWithSets);

      expect(stats).toMatchObject({
        totalSets: 2,
        totalReps: 18,
        totalVolume: 1440, // (80 * 10) + (80 * 8)
        exerciseCount: 1,
        duration: expect.any(Number)
      });
    });

    it('should handle empty workout', async () => {
      const stats = await workoutService.calculateWorkoutStats(mockWorkout);

      expect(stats).toMatchObject({
        totalSets: 0,
        totalReps: 0,
        totalVolume: 0,
        exerciseCount: 0,
        duration: 0
      });
    });
  });

  describe('offline functionality', () => {
    it('should queue operations when offline', async () => {
      // Simulate offline mode
      workoutService.setOfflineMode(true);

      const workoutData = {
        name: 'Offline Workout',
        user_id: 'user-1',
        exercises: []
      };

      const result = await workoutService.createWorkout(workoutData);

      // Should create local workout with pending sync
      expect(result.id).toMatch(/^local-/);
      expect(workoutService.getPendingOperations()).toHaveLength(1);
    });

    it('should sync operations when back online', async () => {
      // Add pending operation
      workoutService.addPendingOperation({
        type: 'create',
        data: mockWorkout,
        timestamp: Date.now()
      });

      mockDatabaseService.workouts.create.mockResolvedValue(mockWorkout);

      await workoutService.syncPendingOperations();

      expect(mockDatabaseService.workouts.create).toHaveBeenCalled();
      expect(workoutService.getPendingOperations()).toHaveLength(0);
    });
  });
});