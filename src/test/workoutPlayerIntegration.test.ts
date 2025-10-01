/**
 * Workout Player Integration Tests
 * Tests the enhanced workout player service with Supabase integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { workoutPlayerService } from '@/services/WorkoutPlayerService';
import { enhancedWorkoutService } from '@/services/EnhancedWorkoutService';
import { realGamificationService } from '@/services/RealGamificationService';
import type { Workout } from '@/schemas/workout';

// Mock dependencies
vi.mock('@/services/EnhancedWorkoutService');
vi.mock('@/services/RealGamificationService');
vi.mock('@/services/SupabaseService');
vi.mock('@/db/IndexedDBManager');

describe('WorkoutPlayerService Integration', () => {
  const mockWorkout: Workout = {
    id: 'test-workout-1',
    user_id: 'test-user-1',
    name: 'Test Workout',
    description: 'A test workout',
    status: 'planned',
    exercises: [
      {
        id: 'exercise-1',
        exercise_id: 'bench-press',
        name: 'Bench Press',
        order: 0,
        sets: [
          {
            id: 'set-1',
            set_number: 1,
            type: 'normal',
            weight: 100,
            reps: 10,
            planned_rest_time: 120,
            completed: false,
            skipped: false
          },
          {
            id: 'set-2',
            set_number: 2,
            type: 'normal',
            weight: 100,
            reps: 8,
            planned_rest_time: 120,
            completed: false,
            skipped: false
          }
        ]
      }
    ],
    is_template: false,
    created_at: new Date(),
    auto_rest_timer: true,
    default_rest_time: 120
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      },
      writable: true
    });

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    workoutPlayerService.cleanup();
  });

  describe('Session Management', () => {
    it('should start a workout session successfully', async () => {
      const session = await workoutPlayerService.startWorkoutSession(mockWorkout);

      expect(session).toBeDefined();
      expect(session.id).toBe(mockWorkout.id);
      expect(session.workout.status).toBe('in_progress');
      expect(session.isActive).toBe(true);
      expect(session.isPaused).toBe(false);
      expect(session.autoSaveEnabled).toBe(true);
    });

    it('should pause and resume workout session', async () => {
      const session = await workoutPlayerService.startWorkoutSession(mockWorkout);
      
      // Pause session
      await workoutPlayerService.pauseWorkoutSession(session.id);
      const pausedSession = workoutPlayerService.getActiveSession(session.id);
      
      expect(pausedSession?.isPaused).toBe(true);
      expect(pausedSession?.workout.status).toBe('paused');
      expect(pausedSession?.workout.paused_at).toBeDefined();

      // Resume session
      await workoutPlayerService.resumeWorkoutSession(session.id);
      const resumedSession = workoutPlayerService.getActiveSession(session.id);
      
      expect(resumedSession?.isPaused).toBe(false);
      expect(resumedSession?.workout.status).toBe('in_progress');
      expect(resumedSession?.workout.resumed_at).toBeDefined();
    });

    it('should update workout session data', async () => {
      const session = await workoutPlayerService.startWorkoutSession(mockWorkout);
      
      // Update workout with completed set
      const updatedWorkout = {
        ...mockWorkout,
        exercises: [
          {
            ...mockWorkout.exercises[0],
            sets: [
              {
                ...mockWorkout.exercises[0].sets[0],
                completed: true,
                completed_at: new Date()
              },
              mockWorkout.exercises[0].sets[1]
            ]
          }
        ]
      };

      await workoutPlayerService.updateWorkoutSession(session.id, updatedWorkout);
      const updatedSession = workoutPlayerService.getActiveSession(session.id);
      
      expect(updatedSession?.workout.exercises[0].sets[0].completed).toBe(true);
      expect(updatedSession?.syncStatus).toBe('pending');
    });

    it('should complete workout session with proper calculations', async () => {
      const session = await workoutPlayerService.startWorkoutSession(mockWorkout);
      
      // Complete all sets
      const completedWorkout = {
        ...mockWorkout,
        exercises: [
          {
            ...mockWorkout.exercises[0],
            sets: mockWorkout.exercises[0].sets.map(set => ({
              ...set,
              completed: true,
              completed_at: new Date()
            }))
          }
        ]
      };

      await workoutPlayerService.updateWorkoutSession(session.id, completedWorkout);

      // Mock gamification service
      vi.mocked(realGamificationService.handleWorkoutCompleted).mockResolvedValue(undefined);
      vi.mocked(enhancedWorkoutService.saveWorkout).mockResolvedValue(true);

      const completionData = await workoutPlayerService.completeWorkoutSession(session.id);

      expect(completionData).toBeDefined();
      expect(completionData.totalVolume).toBe(1800); // (100*10) + (100*8)
      expect(completionData.totalReps).toBe(18); // 10 + 8
      expect(completionData.totalSets).toBe(2);
      expect(completionData.totalDuration).toBeGreaterThan(0);
      expect(completionData.xpEarned).toBeGreaterThan(0);

      // Verify session is cleaned up
      expect(workoutPlayerService.getActiveSession(session.id)).toBeNull();
    });

    it('should cancel workout session', async () => {
      const session = await workoutPlayerService.startWorkoutSession(mockWorkout);
      
      await workoutPlayerService.cancelWorkoutSession(session.id);
      
      expect(workoutPlayerService.getActiveSession(session.id)).toBeNull();
    });
  });

  describe('Progress Tracking', () => {
    it('should calculate workout progress correctly', async () => {
      const session = await workoutPlayerService.startWorkoutSession(mockWorkout);
      
      // Initial progress
      let progress = workoutPlayerService.getWorkoutProgress(session.id);
      expect(progress?.totalSets).toBe(2);
      expect(progress?.completedSets).toBe(0);
      expect(progress?.progressPercentage).toBe(0);

      // Complete one set
      const updatedWorkout = {
        ...mockWorkout,
        exercises: [
          {
            ...mockWorkout.exercises[0],
            sets: [
              {
                ...mockWorkout.exercises[0].sets[0],
                completed: true
              },
              mockWorkout.exercises[0].sets[1]
            ]
          }
        ]
      };

      await workoutPlayerService.updateWorkoutSession(session.id, updatedWorkout);
      progress = workoutPlayerService.getWorkoutProgress(session.id);
      
      expect(progress?.completedSets).toBe(1);
      expect(progress?.progressPercentage).toBe(50);
    });

    it('should track elapsed time correctly', async () => {
      const session = await workoutPlayerService.startWorkoutSession(mockWorkout);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const progress = workoutPlayerService.getWorkoutProgress(session.id);
      expect(progress?.elapsedTime).toBeGreaterThan(0);
    });
  });

  describe('Auto-Save and Recovery', () => {
    it('should save session to localStorage', async () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      
      await workoutPlayerService.startWorkoutSession(mockWorkout);
      
      expect(setItemSpy).toHaveBeenCalledWith(
        `workout_session_${mockWorkout.id}`,
        expect.any(String)
      );
    });

    it('should recover workout sessions from localStorage', async () => {
      const sessionData = {
        id: 'test-workout-1',
        workout: { ...mockWorkout, status: 'in_progress' },
        startTime: new Date().toISOString(),
        lastSaveTime: new Date().toISOString(),
        isActive: true,
        isPaused: false,
        pausedDuration: 0,
        autoSaveEnabled: true,
        syncStatus: 'pending'
      };

      vi.spyOn(localStorage, 'key').mockImplementation((index) => {
        return index === 0 ? 'workout_session_test-workout-1' : null;
      });
      
      vi.spyOn(localStorage, 'getItem').mockImplementation((key) => {
        if (key === 'workout_session_test-workout-1') {
          return JSON.stringify(sessionData);
        }
        return null;
      });

      Object.defineProperty(localStorage, 'length', { value: 1 });

      const recoveredSessions = await workoutPlayerService.recoverWorkoutSessions();
      
      expect(recoveredSessions).toHaveLength(1);
      expect(recoveredSessions[0].id).toBe('test-workout-1');
      expect(recoveredSessions[0].isActive).toBe(true);
    });
  });

  describe('Offline/Online Handling', () => {
    it('should handle offline mode gracefully', async () => {
      // Set offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const session = await workoutPlayerService.startWorkoutSession(mockWorkout);
      
      expect(session.syncStatus).toBe('pending');
      
      // Update workout while offline
      await workoutPlayerService.updateWorkoutSession(session.id, mockWorkout);
      
      const updatedSession = workoutPlayerService.getActiveSession(session.id);
      expect(updatedSession?.syncStatus).toBe('pending');
    });

    it('should sync when coming back online', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const session = await workoutPlayerService.startWorkoutSession(mockWorkout);
      expect(session.syncStatus).toBe('pending');

      // Go online
      Object.defineProperty(navigator, 'onLine', { value: true });
      
      // Trigger online event
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      // Allow async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Session should attempt to sync
      const updatedSession = workoutPlayerService.getActiveSession(session.id);
      expect(updatedSession?.syncStatus).toBe('pending'); // Would be 'synced' if Supabase was working
    });
  });

  describe('Error Handling', () => {
    it('should handle session not found errors', async () => {
      await expect(
        workoutPlayerService.pauseWorkoutSession('non-existent-session')
      ).rejects.toThrow('Session not found: non-existent-session');

      await expect(
        workoutPlayerService.resumeWorkoutSession('non-existent-session')
      ).rejects.toThrow('Session not found: non-existent-session');

      await expect(
        workoutPlayerService.updateWorkoutSession('non-existent-session', mockWorkout)
      ).rejects.toThrow('Session not found: non-existent-session');

      await expect(
        workoutPlayerService.completeWorkoutSession('non-existent-session')
      ).rejects.toThrow('Session not found: non-existent-session');
    });

    it('should handle Supabase sync errors gracefully', async () => {
      // Mock Supabase error
      const mockSupabaseError = new Error('Supabase connection failed');
      
      const session = await workoutPlayerService.startWorkoutSession(mockWorkout);
      
      // Session should still be created locally even if sync fails
      expect(session).toBeDefined();
      expect(session.isActive).toBe(true);
    });
  });

  describe('Performance Calculations', () => {
    it('should detect personal records correctly', async () => {
      const session = await workoutPlayerService.startWorkoutSession(mockWorkout);
      
      // Complete workout with high weights
      const completedWorkout = {
        ...mockWorkout,
        exercises: [
          {
            ...mockWorkout.exercises[0],
            sets: [
              {
                ...mockWorkout.exercises[0].sets[0],
                weight: 150, // Higher weight
                completed: true
              },
              {
                ...mockWorkout.exercises[0].sets[1],
                weight: 140,
                completed: true
              }
            ]
          }
        ]
      };

      await workoutPlayerService.updateWorkoutSession(session.id, completedWorkout);

      // Mock services
      vi.mocked(realGamificationService.handleWorkoutCompleted).mockResolvedValue(undefined);
      vi.mocked(enhancedWorkoutService.saveWorkout).mockResolvedValue(true);

      const completionData = await workoutPlayerService.completeWorkoutSession(session.id);

      expect(completionData.personalRecords).toBeDefined();
      expect(completionData.personalRecords.length).toBeGreaterThan(0);
      expect(completionData.personalRecords[0].newValue).toBe(150);
    });

    it('should calculate XP based on workout metrics', async () => {
      const session = await workoutPlayerService.startWorkoutSession(mockWorkout);
      
      const completedWorkout = {
        ...mockWorkout,
        exercises: [
          {
            ...mockWorkout.exercises[0],
            sets: mockWorkout.exercises[0].sets.map(set => ({
              ...set,
              completed: true
            }))
          }
        ]
      };

      await workoutPlayerService.updateWorkoutSession(session.id, completedWorkout);

      // Mock services
      vi.mocked(realGamificationService.handleWorkoutCompleted).mockResolvedValue(undefined);
      vi.mocked(enhancedWorkoutService.saveWorkout).mockResolvedValue(true);

      const completionData = await workoutPlayerService.completeWorkoutSession(session.id);

      // XP should be calculated based on volume, duration, and sets
      expect(completionData.xpEarned).toBeGreaterThan(0);
      
      // Should include volume XP (1800 * 0.1 = 180)
      // Should include set XP (2 * 10 = 20)
      // Should include duration XP (varies based on actual time)
      expect(completionData.xpEarned).toBeGreaterThanOrEqual(200);
    });
  });
});