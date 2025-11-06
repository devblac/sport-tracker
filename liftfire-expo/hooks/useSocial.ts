// Social features hook for friends activity feed and likes
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { FriendWorkout } from '../types';

const POLL_INTERVAL = 50000; // 50 seconds (45-60 second range)

export const useSocial = () => {
  const [feed, setFeed] = useState<FriendWorkout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch friends' recent workouts directly from workouts table
  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get list of friend IDs
      const { data: friendships, error: friendsError } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;

      const friendIds = friendships?.map(f => f.friend_id) || [];

      if (friendIds.length === 0) {
        setFeed([]);
        return;
      }

      // Fetch friends' workouts with user info and likes
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          id,
          user_id,
          name,
          notes,
          duration_minutes,
          xp_earned,
          completed_at,
          created_at,
          synced,
          user:users!workouts_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            level
          )
        `)
        .in('user_id', friendIds)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (workoutsError) throw workoutsError;

      // Fetch likes count and user's like status for each workout
      const workoutIds = workouts?.map(w => w.id) || [];
      
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('workout_id, user_id')
        .in('workout_id', workoutIds);

      if (likesError) throw likesError;

      // Build feed with likes info
      const feedWithLikes: FriendWorkout[] = (workouts || []).map(workout => {
        const workoutLikes = likes?.filter(l => l.workout_id === workout.id) || [];
        return {
          ...workout,
          likes_count: workoutLikes.length,
          liked_by_me: workoutLikes.some(l => l.user_id === user.id),
        } as any;
      });

      setFeed(feedWithLikes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch feed';
      setError(errorMessage);
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Like a workout with optimistic update
  const likeWorkout = useCallback(async (workoutId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Optimistic update
      setFeed(prevFeed => 
        prevFeed.map(workout => 
          workout.id === workoutId
            ? {
                ...workout,
                likes_count: (workout.likes_count || 0) + 1,
                liked_by_me: true,
              }
            : workout
        )
      );

      // Insert like
      const { error: likeError } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          workout_id: workoutId,
        });

      if (likeError) {
        // Revert optimistic update on error
        setFeed(prevFeed => 
          prevFeed.map(workout => 
            workout.id === workoutId
              ? {
                  ...workout,
                  likes_count: Math.max((workout.likes_count || 1) - 1, 0),
                  liked_by_me: false,
                }
              : workout
          )
        );
        throw likeError;
      }
    } catch (err) {
      console.error('Error liking workout:', err);
      throw err;
    }
  }, []);

  // Unlike a workout with optimistic update
  const unlikeWorkout = useCallback(async (workoutId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Optimistic update
      setFeed(prevFeed => 
        prevFeed.map(workout => 
          workout.id === workoutId
            ? {
                ...workout,
                likes_count: Math.max((workout.likes_count || 1) - 1, 0),
                liked_by_me: false,
              }
            : workout
        )
      );

      // Delete like
      const { error: unlikeError } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('workout_id', workoutId);

      if (unlikeError) {
        // Revert optimistic update on error
        setFeed(prevFeed => 
          prevFeed.map(workout => 
            workout.id === workoutId
              ? {
                  ...workout,
                  likes_count: (workout.likes_count || 0) + 1,
                  liked_by_me: true,
                }
              : workout
          )
        );
        throw unlikeError;
      }
    } catch (err) {
      console.error('Error unliking workout:', err);
      throw err;
    }
  }, []);

  // Toggle like (convenience function)
  const toggleLike = useCallback(async (workoutId: string, currentlyLiked: boolean) => {
    if (currentlyLiked) {
      await unlikeWorkout(workoutId);
    } else {
      await likeWorkout(workoutId);
    }
  }, [likeWorkout, unlikeWorkout]);

  // Start polling for feed updates
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(() => {
      fetchFeed();
    }, POLL_INTERVAL);
  }, [fetchFeed]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Load feed on mount and start polling
  useEffect(() => {
    fetchFeed();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [fetchFeed, startPolling, stopPolling]);

  return {
    feed,
    loading,
    error,
    likeWorkout,
    unlikeWorkout,
    toggleLike,
    refreshFeed: fetchFeed,
  };
};
