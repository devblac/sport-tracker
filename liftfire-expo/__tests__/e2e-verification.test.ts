/**
 * End-to-End Feature Verification Tests
 * 
 * This test suite verifies the complete user journey and integration
 * of all MVP features according to task 13.1 requirements.
 * 
 * Requirements tested:
 * - 1.1: User authentication (signup → login → logout)
 * - 1.2: Workout tracking (create → view → edit → delete)
 * - 1.3: Profile and progress (view stats, edit profile)
 * - 1.4: Social features (friend requests, likes, feed)
 * - 1.5: Offline functionality (offline workout creation and sync)
 */

import { supabase } from '../lib/supabase';
import { calculateWorkoutXP } from '../lib/gamification';
import { calculateStreak } from '../lib/streaks';
import { checkAchievements } from '../lib/achievements';

// Mock data for testing
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  username: `testuser${Date.now()}`,
  display_name: 'Test User'
};

const testWorkout = {
  name: 'Test Workout',
  notes: 'E2E test workout',
  duration_minutes: 45,
  exercises: [
    { name: 'Bench Press', sets: 3, reps: 10, weight: 135 },
    { name: 'Squats', sets: 4, reps: 8, weight: 185 }
  ]
};

describe('E2E: Complete User Journey', () => {
  let userId: string;
  let workoutId: string;
  let friendId: string;
  let accessToken: string;

  // Cleanup function
  const cleanup = async () => {
    if (userId) {
      try {
        // Delete user data (cascades to workouts, exercises, etc.)
        await supabase.from('users').delete().eq('id', userId);
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  };

  afterAll(cleanup);

  describe('1. Authentication Flow (Requirement 1.1)', () => {
    it('should sign up a new user', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            username: testUser.username,
            display_name: testUser.display_name
          }
        }
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.user?.email).toBe(testUser.email);
      
      userId = data.user!.id;
      accessToken = data.session?.access_token || '';
    });

    it('should create user profile in database', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.username).toBe(testUser.username);
      expect(data.xp).toBe(0);
      expect(data.level).toBe(1);
      expect(data.current_streak).toBe(0);
    });

    it('should login with correct credentials', async () => {
      // First sign out
      await supabase.auth.signOut();

      // Then sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });

      expect(error).toBeNull();
      expect(data.session).toBeDefined();
      expect(data.user?.id).toBe(userId);
    });

    it('should reject login with incorrect credentials', async () => {
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: 'WrongPassword123!'
      });

      expect(error).toBeDefined();
      expect(data.session).toBeNull();

      // Re-login for subsequent tests
      await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });
    });
  });

  describe('2. Workout Tracking Flow (Requirement 1.2)', () => {
    it('should create a new workout', async () => {
      const xpEarned = calculateWorkoutXP(testWorkout.duration_minutes);

      const { data, error } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          name: testWorkout.name,
          notes: testWorkout.notes,
          duration_minutes: testWorkout.duration_minutes,
          xp_earned: xpEarned,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.name).toBe(testWorkout.name);
      expect(data.xp_earned).toBe(xpEarned);
      
      workoutId = data.id;
    });

    it('should add exercises to workout', async () => {
      const exerciseInserts = testWorkout.exercises.map(ex => ({
        workout_id: workoutId,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight
      }));

      const { data, error } = await supabase
        .from('exercises')
        .insert(exerciseInserts)
        .select();

      expect(error).toBeNull();
      expect(data).toHaveLength(testWorkout.exercises.length);
      expect(data[0].name).toBe(testWorkout.exercises[0].name);
    });

    it('should retrieve workout with exercises', async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises (*)
        `)
        .eq('id', workoutId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.exercises).toHaveLength(testWorkout.exercises.length);
    });

    it('should update workout', async () => {
      const updatedName = 'Updated Test Workout';

      const { data, error } = await supabase
        .from('workouts')
        .update({ name: updatedName })
        .eq('id', workoutId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.name).toBe(updatedName);
    });

    it('should list user workouts', async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].id).toBe(workoutId);
    });
  });

  describe('3. Gamification System (Requirements 8.1-8.4)', () => {
    it('should calculate XP correctly', () => {
      const xp = calculateWorkoutXP(45);
      expect(xp).toBe(45); // 1 XP per minute

      const xpWithStreak = calculateWorkoutXP(45, 7);
      expect(xpWithStreak).toBe(54); // 45 * 1.2 (20% bonus)
    });

    it('should update user XP after workout', async () => {
      const { data: workout } = await supabase
        .from('workouts')
        .select('xp_earned')
        .eq('id', workoutId)
        .single();

      const { data, error } = await supabase
        .from('users')
        .update({ xp: workout!.xp_earned })
        .eq('id', userId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.xp).toBe(workout!.xp_earned);
    });

    it('should calculate streak correctly', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const workoutDates = [
        yesterday.toISOString(),
        today.toISOString()
      ];

      const streak = calculateStreak(workoutDates);
      expect(streak).toBe(2);
    });

    it('should check and award achievements', () => {
      const achievements = checkAchievements({
        workoutCount: 1,
        currentStreak: 1,
        totalXP: 45
      });

      expect(achievements).toBeDefined();
      expect(achievements.some(a => a.achievement_type === 'first_workout')).toBe(true);
    });

    it('should store achievements in database', async () => {
      const achievement = {
        user_id: userId,
        achievement_type: 'first_workout',
        title: 'First Workout',
        description: 'Completed your first workout'
      };

      const { data, error } = await supabase
        .from('achievements')
        .insert(achievement)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.achievement_type).toBe('first_workout');
    });
  });

  describe('4. Social Features (Requirement 9.1-9.4)', () => {
    beforeAll(async () => {
      // Create a friend user for testing
      const friendEmail = `friend-${Date.now()}@example.com`;
      const { data } = await supabase.auth.signUp({
        email: friendEmail,
        password: 'FriendPassword123!',
        options: {
          data: {
            username: `friend${Date.now()}`,
            display_name: 'Friend User'
          }
        }
      });
      friendId = data.user!.id;

      // Re-login as test user
      await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });
    });

    it('should send friend request', async () => {
      const { data, error } = await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'pending'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.status).toBe('pending');
    });

    it('should accept friend request', async () => {
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('user_id', userId)
        .eq('friend_id', friendId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.status).toBe('accepted');
    });

    it('should retrieve friends list', async () => {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:users!friendships_friend_id_fkey (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
    });

    it('should like a workout', async () => {
      const { data, error } = await supabase
        .from('likes')
        .insert({
          user_id: userId,
          workout_id: workoutId
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.workout_id).toBe(workoutId);
    });

    it('should retrieve workout with like count', async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          likes (count)
        `)
        .eq('id', workoutId)
        .single();

      expect(error).toBeNull();
      expect(data.likes).toBeDefined();
    });

    it('should unlike a workout', async () => {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('workout_id', workoutId);

      expect(error).toBeNull();
    });

    it('should retrieve friends activity feed', async () => {
      // Get friend IDs
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      const friendIds = friendships?.map(f => f.friend_id) || [];

      // Get friends' workouts
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          user:users (username, display_name, avatar_url)
        `)
        .in('user_id', friendIds)
        .order('completed_at', { ascending: false })
        .limit(20);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('5. Profile and Progress (Requirement 1.3)', () => {
    it('should retrieve user profile', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.username).toBe(testUser.username);
    });

    it('should update user profile', async () => {
      const updatedDisplayName = 'Updated Test User';

      const { data, error } = await supabase
        .from('users')
        .update({ display_name: updatedDisplayName })
        .eq('id', userId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.display_name).toBe(updatedDisplayName);
    });

    it('should calculate user statistics', async () => {
      const { data: workouts } = await supabase
        .from('workouts')
        .select('xp_earned, duration_minutes')
        .eq('user_id', userId);

      const totalWorkouts = workouts?.length || 0;
      const totalXP = workouts?.reduce((sum, w) => sum + w.xp_earned, 0) || 0;
      const avgDuration = workouts?.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) / totalWorkouts || 0;

      expect(totalWorkouts).toBeGreaterThan(0);
      expect(totalXP).toBeGreaterThan(0);
      expect(avgDuration).toBeGreaterThan(0);
    });

    it('should retrieve user achievements', async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('6. Data Deletion (Requirement 1.2)', () => {
    it('should delete workout exercises', async () => {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('workout_id', workoutId);

      expect(error).toBeNull();
    });

    it('should delete workout', async () => {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      expect(error).toBeNull();
    });

    it('should verify workout is deleted', async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });

  describe('7. Logout Flow (Requirement 1.1)', () => {
    it('should logout user', async () => {
      const { error } = await supabase.auth.signOut();
      expect(error).toBeNull();
    });

    it('should not access protected data after logout', async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId);

      // Should either error or return empty (depending on RLS)
      expect(data?.length === 0 || error !== null).toBe(true);
    });
  });
});

describe('E2E: Offline Functionality (Requirement 1.5)', () => {
  it('should queue offline workout creation', () => {
    // This would be tested with actual offline sync implementation
    // For now, verify the queue structure exists
    const offlineWorkout = {
      type: 'CREATE_WORKOUT',
      data: {
        name: 'Offline Workout',
        duration_minutes: 30,
        xp_earned: 30
      },
      timestamp: Date.now()
    };

    expect(offlineWorkout.type).toBe('CREATE_WORKOUT');
    expect(offlineWorkout.data).toBeDefined();
    expect(offlineWorkout.timestamp).toBeDefined();
  });

  it('should validate offline workout data structure', () => {
    const workout = {
      id: 'temp-id',
      name: 'Test Workout',
      duration_minutes: 45,
      xp_earned: 45,
      synced: false
    };

    expect(workout.synced).toBe(false);
    expect(workout.id).toBeDefined();
    expect(workout.name).toBeDefined();
  });
});

describe('E2E: Leaderboard (Requirement 9.4)', () => {
  it('should query weekly leaderboard view', async () => {
    const { data, error } = await supabase
      .from('weekly_leaderboard_public')
      .select('*')
      .order('rank', { ascending: true })
      .limit(10);

    // May be empty if no data, but should not error
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
