/**
 * End-to-End Integration Tests
 * 
 * Tests for complete user workflows, cross-service integration,
 * and real-world usage scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceRegistry, serviceRegistry } from '../ServiceRegistry';
import { serviceConfigManager } from '../ServiceConfigManager';
import { ResourceUsageMonitor, resourceUsageMonitor } from '../ResourceUsageMonitor';

// Mock complete Supabase client for E2E testing
const createE2ESupabaseClient = () => {
  const mockData = {
    users: [
      { id: 1, email: 'test@example.com', name: 'Test User', role: 'basic' }
    ],
    workouts: [
      { id: 1, name: 'Morning Routine', user_id: 1, exercises: [] },
      { id: 2, name: 'Evening Workout', user_id: 1, exercises: [] }
    ],
    exercises: [
      { id: 1, name: 'Push-ups', category: 'strength' },
      { id: 2, name: 'Running', category: 'cardio' }
    ],
    social_posts: [
      { id: 1, user_id: 1, content: 'Great workout today!', created_at: new Date() }
    ],
    achievements: [
      { id: 1, name: 'First Workout', description: 'Complete your first workout' }
    ],
    user_xp: [
      { user_id: 1, total_xp: 100, level: 1 }
    ],
    streaks: [
      { user_id: 1, current_streak: 5, longest_streak: 10 }
    ]
  };

  let currentUser: any = null;
  let subscriptions: Map<string, any> = new Map();

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: currentUser ? { user: currentUser } : null },
        error: null
      }),
      signInWithPassword: vi.fn().mockImplementation(async ({ email, password }) => {
        if (email === 'test@example.com' && password === 'password') {
          currentUser = mockData.users[0];
          return { data: { user: currentUser }, error: null };
        }
        return { data: { user: null }, error: { message: 'Invalid credentials' } };
      }),
      signUp: vi.fn().mockImplementation(async ({ email, password }) => {
        const newUser = { id: Date.now(), email, name: 'New User', role: 'basic' };
        mockData.users.push(newUser);
        currentUser = newUser;
        return { data: { user: newUser }, error: null };
      }),
      signOut: vi.fn().mockImplementation(async () => {
        currentUser = null;
        return { error: null };
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation((data) => {
        const newRecord = { id: Date.now(), ...data };
        (mockData as any)[table].push(newRecord);
        return Promise.resolve({ data: [newRecord], error: null });
      }),
      update: vi.fn().mockImplementation((data) => {
        // Simulate update
        return Promise.resolve({ data: [data], error: null });
      }),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockImplementation((data) => {
        const newRecord = { id: Date.now(), ...data };
        (mockData as any)[table].push(newRecord);
        return Promise.resolve({ data: [newRecord], error: null });
      }),
      eq: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation(() => {
        return Promise.resolve({ data: (mockData as any)[table] || [], error: null });
      })
    })),
    channel: vi.fn((channelName: string) => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        const subscription = { channelName, callback, unsubscribe: vi.fn() };
        subscriptions.set(channelName, subscription);
        setTimeout(() => callback('SUBSCRIBED'), 50);
        return subscription;
      })
    })),
    removeChannel: vi.fn((channel) => {
      subscriptions.delete(channel.channelName);
    }),
    rpc: vi.fn().mockImplementation((functionName, params) => {
      // Mock RPC functions
      switch (functionName) {
        case 'calculate_user_level':
          return Promise.resolve({ data: { level: 2, xp: 250 }, error: null });
        case 'get_user_percentile':
          return Promise.resolve({ data: { percentile: 75 }, error: null });
        default:
          return Promise.resolve({ data: null, error: null });
      }
    }),
    
    // Test utilities
    _getCurrentUser: () => currentUser,
    _getMockData: () => mockData,
    _getSubscriptions: () => subscriptions,
    _triggerRealtimeEvent: (channel: string, event: string, payload: any) => {
      const subscription = subscriptions.get(channel);
      if (subscription) {
        subscription.callback(event, payload);
      }
    }
  };
};

const mockSupabaseClient = createE2ESupabaseClient();

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('End-to-End Integration Tests', () => {
  let registry: ServiceRegistry;
  let resourceMonitor: ResourceUsageMonitor;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    registry = ServiceRegistry.getInstance();
    resourceMonitor = resourceUsageMonitor;
    
    // Configure for E2E testing
    serviceConfigManager.updateConfig({
      useRealServices: true,
      supabaseEnabled: true,
      offlineMode: false
    });
    
    resourceMonitor.reset();
    await registry.initialize();
  });

  afterEach(async () => {
    await registry.shutdown();
  });

  describe('Complete User Journey - New User Registration', () => {
    it('should handle complete new user registration and onboarding', async () => {
      const userEmail = 'newuser@example.com';
      const userPassword = 'securepassword';
      
      // Step 1: User registration
      const authService = registry.auth;
      const signUpResult = await authService.signUp({
        email: userEmail,
        password: userPassword
      });
      
      expect(signUpResult.data?.user).toBeDefined();
      expect(signUpResult.error).toBeNull();
      
      // Step 2: Verify authentication state
      const isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(true);
      
      // Step 3: Initialize user profile and preferences
      const workoutService = registry.workout;
      const templates = await workoutService.getWorkoutTemplates();
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      
      // Step 4: Set up gamification profile
      const gamificationService = registry.gamification;
      if (gamificationService) {
        const userXP = await gamificationService.getUserXP();
        expect(userXP).toBeDefined();
      }
      
      // Step 5: Initialize social features
      const socialService = registry.social;
      if (socialService && 'getFeed' in socialService) {
        const feed = await socialService.getFeed();
        expect(Array.isArray(feed)).toBe(true);
      }
      
      // Verify resource usage tracking
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.apiCalls.total).toBeGreaterThan(0);
    });

    it('should handle user onboarding with sample data creation', async () => {
      // Authenticate user
      const authService = registry.auth;
      await authService.signInWithPassword({
        email: 'test@example.com',
        password: 'password'
      });
      
      // Create initial workout template
      const workoutService = registry.workout;
      const newWorkout = await workoutService.createWorkoutTemplate({
        name: 'My First Workout',
        exercises: [
          { exerciseId: 1, sets: 3, reps: 10 },
          { exerciseId: 2, duration: 300 } // 5 minutes
        ]
      });
      
      expect(newWorkout).toBeDefined();
      
      // Award first workout achievement
      const gamificationService = registry.gamification;
      if (gamificationService) {
        await gamificationService.awardXP(50, 'first_workout');
        
        const achievements = await gamificationService.getUserAchievements();
        expect(Array.isArray(achievements)).toBe(true);
      }
      
      // Create first social post
      const socialService = registry.social;
      if (socialService && 'createPost' in socialService) {
        const post = await socialService.createPost({
          content: 'Just completed my first workout!',
          workoutId: newWorkout.id
        });
        expect(post).toBeDefined();
      }
    });
  });

  describe('Complete User Journey - Workout Session', () => {
    it('should handle complete workout session from start to finish', async () => {
      // Authenticate user
      const authService = registry.auth;
      await authService.signInWithPassword({
        email: 'test@example.com',
        password: 'password'
      });
      
      const workoutService = registry.workout;
      const gamificationService = registry.gamification;
      const socialService = registry.social;
      
      // Step 1: Select workout template
      const templates = await workoutService.getWorkoutTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const selectedTemplate = templates[0];
      
      // Step 2: Start workout session
      const workoutSession = await workoutService.startWorkout(selectedTemplate.id);
      expect(workoutSession).toBeDefined();
      expect(workoutSession.status).toBe('active');
      
      // Step 3: Complete exercises
      const exercises = selectedTemplate.exercises || [];
      for (const exercise of exercises) {
        await workoutService.completeExercise(workoutSession.id, exercise.id, {
          sets: exercise.sets || 1,
          reps: exercise.reps || 10,
          weight: 50
        });
      }
      
      // Step 4: Complete workout
      const completedWorkout = await workoutService.completeWorkout(workoutSession.id);
      expect(completedWorkout.status).toBe('completed');
      
      // Step 5: Award XP and check achievements
      if (gamificationService) {
        await gamificationService.awardXP(100, 'workout_completed');
        
        const userLevel = await gamificationService.getUserLevel();
        expect(userLevel).toBeGreaterThan(0);
        
        // Check for new achievements
        const achievements = await gamificationService.checkAchievements();
        expect(Array.isArray(achievements)).toBe(true);
      }
      
      // Step 6: Update streak
      const streakService = registry.streaks;
      if (streakService) {
        await streakService.updateStreak();
        
        const currentStreak = await streakService.getCurrentStreak();
        expect(currentStreak).toBeGreaterThan(0);
      }
      
      // Step 7: Share workout on social feed
      if (socialService && 'createPost' in socialService) {
        const post = await socialService.createPost({
          content: `Just completed ${selectedTemplate.name}! 💪`,
          workoutId: completedWorkout.id,
          xpEarned: 100
        });
        expect(post).toBeDefined();
      }
      
      // Verify comprehensive resource tracking
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.apiCalls.total).toBeGreaterThan(5); // Multiple API calls
      expect(usage.database.writes).toBeGreaterThan(0); // Data was written
    });

    it('should handle workout session with real-time updates', async () => {
      // Authenticate user
      const authService = registry.auth;
      await authService.signInWithPassword({
        email: 'test@example.com',
        password: 'password'
      });
      
      const socialService = registry.social;
      
      // Set up real-time subscription for social updates
      let receivedUpdates = 0;
      if (socialService && 'subscribeToFeed' in socialService) {
        await socialService.subscribeToFeed((update) => {
          receivedUpdates++;
          resourceMonitor.trackRealtimeMessage('received');
        });
      }
      
      // Start workout and trigger real-time updates
      const workoutService = registry.workout;
      const templates = await workoutService.getWorkoutTemplates();
      const workoutSession = await workoutService.startWorkout(templates[0].id);
      
      // Simulate real-time workout progress updates
      mockSupabaseClient._triggerRealtimeEvent('workout-progress', 'UPDATE', {
        workoutId: workoutSession.id,
        progress: 50
      });
      
      // Simulate friend completing workout (social update)
      mockSupabaseClient._triggerRealtimeEvent('social-feed', 'INSERT', {
        userId: 2,
        content: 'Just finished a great workout!',
        timestamp: new Date()
      });
      
      // Complete workout
      await workoutService.completeWorkout(workoutSession.id);
      
      // Verify real-time updates were received
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.realtime.messagesReceived).toBeGreaterThan(0);
    });
  });

  describe('Complete User Journey - Social Interaction', () => {
    it('should handle complete social interaction workflow', async () => {
      // Authenticate user
      const authService = registry.auth;
      await authService.signInWithPassword({
        email: 'test@example.com',
        password: 'password'
      });
      
      const socialService = registry.social;
      const gamificationService = registry.gamification;
      
      if (!socialService) return;
      
      // Step 1: Get social feed
      if ('getFeed' in socialService) {
        const feed = await socialService.getFeed();
        expect(Array.isArray(feed)).toBe(true);
      }
      
      // Step 2: Create a post
      if ('createPost' in socialService) {
        const newPost = await socialService.createPost({
          content: 'Feeling motivated today! 🔥',
          type: 'motivation'
        });
        expect(newPost).toBeDefined();
        
        // Step 3: Like a post
        if ('likePost' in socialService) {
          await socialService.likePost(newPost.id);
        }
        
        // Step 4: Comment on a post
        if ('commentOnPost' in socialService) {
          const comment = await socialService.commentOnPost(newPost.id, {
            content: 'Great motivation!'
          });
          expect(comment).toBeDefined();
        }
      }
      
      // Step 5: Add a friend
      if ('sendFriendRequest' in socialService) {
        await socialService.sendFriendRequest(2); // Friend user ID
      }
      
      // Step 6: Award social XP
      if (gamificationService) {
        await gamificationService.awardXP(25, 'social_interaction');
      }
      
      // Verify social activity tracking
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.apiCalls.total).toBeGreaterThan(3); // Multiple social actions
    });

    it('should handle social challenges and competitions', async () => {
      // Authenticate user
      const authService = registry.auth;
      await authService.signInWithPassword({
        email: 'test@example.com',
        password: 'password'
      });
      
      const socialService = registry.social;
      const gamificationService = registry.gamification;
      
      if (!socialService) return;
      
      // Step 1: Join a challenge
      if ('joinChallenge' in socialService) {
        const challenge = await socialService.joinChallenge(1); // Challenge ID
        expect(challenge).toBeDefined();
      }
      
      // Step 2: Complete challenge activity
      const workoutService = registry.workout;
      const templates = await workoutService.getWorkoutTemplates();
      const workoutSession = await workoutService.startWorkout(templates[0].id);
      await workoutService.completeWorkout(workoutSession.id);
      
      // Step 3: Update challenge progress
      if ('updateChallengeProgress' in socialService) {
        await socialService.updateChallengeProgress(1, {
          workoutsCompleted: 1,
          xpEarned: 100
        });
      }
      
      // Step 4: Check leaderboard
      if ('getChallengeLeaderboard' in socialService) {
        const leaderboard = await socialService.getChallengeLeaderboard(1);
        expect(Array.isArray(leaderboard)).toBe(true);
      }
      
      // Step 5: Award challenge XP
      if (gamificationService) {
        await gamificationService.awardXP(150, 'challenge_progress');
      }
    });
  });

  describe('Complete User Journey - Progress Tracking', () => {
    it('should handle comprehensive progress tracking and analytics', async () => {
      // Authenticate user
      const authService = registry.auth;
      await authService.signInWithPassword({
        email: 'test@example.com',
        password: 'password'
      });
      
      const workoutService = registry.workout;
      const gamificationService = registry.gamification;
      const streakService = registry.streaks;
      
      // Step 1: Complete multiple workouts over time
      const workoutSessions = [];
      for (let i = 0; i < 5; i++) {
        const templates = await workoutService.getWorkoutTemplates();
        const session = await workoutService.startWorkout(templates[0].id);
        await workoutService.completeWorkout(session.id);
        workoutSessions.push(session);
        
        // Award XP for each workout
        if (gamificationService) {
          await gamificationService.awardXP(100, 'workout_completed');
        }
        
        // Update streak
        if (streakService) {
          await streakService.updateStreak();
        }
      }
      
      // Step 2: Check progress analytics
      const workoutHistory = await workoutService.getWorkoutHistory();
      expect(workoutHistory.length).toBe(5);
      
      // Step 3: Check XP and level progression
      if (gamificationService) {
        const totalXP = await gamificationService.getUserXP();
        expect(totalXP).toBeGreaterThanOrEqual(500); // 5 workouts * 100 XP
        
        const currentLevel = await gamificationService.getUserLevel();
        expect(currentLevel).toBeGreaterThan(1);
        
        const achievements = await gamificationService.getUserAchievements();
        expect(achievements.length).toBeGreaterThan(0);
      }
      
      // Step 4: Check streak progress
      if (streakService) {
        const currentStreak = await streakService.getCurrentStreak();
        expect(currentStreak).toBeGreaterThanOrEqual(5);
        
        const streakHistory = await streakService.getStreakHistory();
        expect(Array.isArray(streakHistory)).toBe(true);
      }
      
      // Step 5: Generate progress report
      const progressReport = {
        workoutsCompleted: workoutHistory.length,
        totalXP: gamificationService ? await gamificationService.getUserXP() : 0,
        currentLevel: gamificationService ? await gamificationService.getUserLevel() : 1,
        currentStreak: streakService ? await streakService.getCurrentStreak() : 0
      };
      
      expect(progressReport.workoutsCompleted).toBe(5);
      expect(progressReport.totalXP).toBeGreaterThan(0);
      expect(progressReport.currentLevel).toBeGreaterThan(0);
      expect(progressReport.currentStreak).toBeGreaterThan(0);
    });

    it('should handle percentile calculations and comparisons', async () => {
      // Authenticate user
      const authService = registry.auth;
      await authService.signInWithPassword({
        email: 'test@example.com',
        password: 'password'
      });
      
      const workoutService = registry.workout;
      
      // Complete workouts to generate performance data
      for (let i = 0; i < 3; i++) {
        const templates = await workoutService.getWorkoutTemplates();
        const session = await workoutService.startWorkout(templates[0].id);
        
        // Record exercise performance
        await workoutService.recordExercisePerformance(session.id, 1, {
          weight: 50 + i * 5, // Progressive overload
          reps: 10,
          sets: 3
        });
        
        await workoutService.completeWorkout(session.id);
      }
      
      // Calculate user percentile
      const databaseService = registry.database;
      const percentileResult = await databaseService.rpc('get_user_percentile', {
        user_id: 1,
        exercise_id: 1
      });
      
      expect(percentileResult.data).toBeDefined();
      expect(percentileResult.data.percentile).toBeGreaterThan(0);
      expect(percentileResult.data.percentile).toBeLessThanOrEqual(100);
    });
  });

  describe('Cross-Service Integration Scenarios', () => {
    it('should handle complex cross-service workflows', async () => {
      // Authenticate user
      const authService = registry.auth;
      await authService.signInWithPassword({
        email: 'test@example.com',
        password: 'password'
      });
      
      const workoutService = registry.workout;
      const gamificationService = registry.gamification;
      const socialService = registry.social;
      const streakService = registry.streaks;
      
      // Scenario: User completes workout, earns achievement, shares on social, maintains streak
      
      // Step 1: Complete workout
      const templates = await workoutService.getWorkoutTemplates();
      const session = await workoutService.startWorkout(templates[0].id);
      const completedWorkout = await workoutService.completeWorkout(session.id);
      
      // Step 2: Award XP and check for achievements
      let newAchievements = [];
      if (gamificationService) {
        await gamificationService.awardXP(100, 'workout_completed');
        newAchievements = await gamificationService.checkAchievements();
      }
      
      // Step 3: Update streak
      let streakMilestone = false;
      if (streakService) {
        await streakService.updateStreak();
        const currentStreak = await streakService.getCurrentStreak();
        streakMilestone = currentStreak % 5 === 0; // Every 5 days
      }
      
      // Step 4: Share on social if achievement or milestone
      if ((newAchievements.length > 0 || streakMilestone) && socialService && 'createPost' in socialService) {
        const postContent = newAchievements.length > 0 
          ? `Just earned the "${newAchievements[0].name}" achievement! 🏆`
          : `${streakMilestone ? 'Streak milestone reached!' : 'Great workout today!'} 💪`;
          
        await socialService.createPost({
          content: postContent,
          workoutId: completedWorkout.id,
          achievements: newAchievements.map(a => a.id)
        });
      }
      
      // Step 5: Verify all services were integrated
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.apiCalls.total).toBeGreaterThan(5); // Multiple service calls
      expect(usage.database.writes).toBeGreaterThan(0); // Data persistence
    });

    it('should handle service failures with graceful degradation', async () => {
      // Authenticate user
      const authService = registry.auth;
      await authService.signInWithPassword({
        email: 'test@example.com',
        password: 'password'
      });
      
      // Simulate social service failure
      const socialService = registry.social;
      if (socialService && 'createPost' in socialService) {
        vi.spyOn(socialService, 'createPost').mockRejectedValue(new Error('Social service unavailable'));
      }
      
      // Complete workout workflow despite social service failure
      const workoutService = registry.workout;
      const gamificationService = registry.gamification;
      
      const templates = await workoutService.getWorkoutTemplates();
      const session = await workoutService.startWorkout(templates[0].id);
      const completedWorkout = await workoutService.completeWorkout(session.id);
      
      // XP should still be awarded
      if (gamificationService) {
        await gamificationService.awardXP(100, 'workout_completed');
        const userXP = await gamificationService.getUserXP();
        expect(userXP).toBeGreaterThan(0);
      }
      
      // Social post should fail gracefully
      if (socialService && 'createPost' in socialService) {
        try {
          await socialService.createPost({
            content: 'Workout completed!',
            workoutId: completedWorkout.id
          });
        } catch (error) {
          // Should handle error gracefully
          expect(error.message).toBe('Social service unavailable');
        }
      }
      
      // Core functionality should remain intact
      expect(completedWorkout.status).toBe('completed');
    });

    it('should handle offline/online synchronization', async () => {
      // Authenticate user
      const authService = registry.auth;
      await authService.signInWithPassword({
        email: 'test@example.com',
        password: 'password'
      });
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      
      window.dispatchEvent(new Event('offline'));
      
      // Perform operations while offline
      const workoutService = registry.workout;
      const templates = await workoutService.getWorkoutTemplates(); // Should work from cache
      expect(templates).toBeDefined();
      
      const session = await workoutService.startWorkout(templates[0].id); // Should work locally
      expect(session).toBeDefined();
      
      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      
      window.dispatchEvent(new Event('online'));
      
      // Complete workout online
      const completedWorkout = await workoutService.completeWorkout(session.id);
      expect(completedWorkout.status).toBe('completed');
      
      // Verify synchronization occurred
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.apiCalls.total).toBeGreaterThan(0);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should maintain performance across complete user workflows', async () => {
      const startTime = Date.now();
      
      // Authenticate user
      const authService = registry.auth;
      await authService.signInWithPassword({
        email: 'test@example.com',
        password: 'password'
      });
      
      // Perform comprehensive user workflow
      const workoutService = registry.workout;
      const gamificationService = registry.gamification;
      const socialService = registry.social;
      
      // Get data
      const templates = await workoutService.getWorkoutTemplates();
      
      if (gamificationService) {
        await gamificationService.getUserXP();
        await gamificationService.getUserAchievements();
      }
      
      if (socialService && 'getFeed' in socialService) {
        await socialService.getFeed();
      }
      
      // Complete workout
      const session = await workoutService.startWorkout(templates[0].id);
      await workoutService.completeWorkout(session.id);
      
      // Social interaction
      if (socialService && 'createPost' in socialService) {
        await socialService.createPost({
          content: 'Workflow completed!',
          workoutId: session.id
        });
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Performance expectations
      expect(totalTime).toBeLessThan(5000); // Complete workflow under 5 seconds
      
      // Resource usage should be reasonable
      const usage = resourceMonitor.getCurrentUsage();
      expect(usage.apiCalls.total).toBeLessThan(20); // Reasonable number of API calls
      
      // Should provide optimization suggestions if needed
      const suggestions = resourceMonitor.getOptimizationSuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});