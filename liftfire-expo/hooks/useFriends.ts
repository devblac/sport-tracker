// Friend management hook
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Friendship, User } from '../types';
import { showSuccessToast, showErrorToast } from '../lib/toast';

export const useFriends = () => {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch friends list with status filtering
  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Fetch accepted friendships
      const { data: acceptedFriends, error: friendsError } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          updated_at,
          friend:users!friendships_friend_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            xp,
            level,
            current_streak
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;

      // Fetch pending requests (received)
      const { data: pending, error: pendingError } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          updated_at,
          friend:users!friendships_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            xp,
            level,
            current_streak
          )
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Fetch sent requests
      const { data: sent, error: sentError } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          updated_at,
          friend:users!friendships_friend_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            xp,
            level,
            current_streak
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      setFriends((acceptedFriends || []) as any);
      setPendingRequests((pending || []) as any);
      setSentRequests((sent || []) as any);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch friends');
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send friend request
  const sendFriendRequest = useCallback(async (friendId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      if (user.id === friendId) {
        throw new Error('Cannot send friend request to yourself');
      }

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .single();

      if (existing) {
        if (existing.status === 'accepted') {
          throw new Error('Already friends');
        } else if (existing.status === 'pending') {
          throw new Error('Friend request already sent');
        }
      }

      // Create friend request
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending',
        });

      if (insertError) throw insertError;

      showSuccessToast('Friend request sent successfully');

      // Refresh friends list
      await fetchFriends();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send friend request';
      setError(errorMessage);
      showErrorToast(errorMessage);
      console.error('Error sending friend request:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFriends]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);

      if (updateError) throw updateError;

      showSuccessToast('Friend request accepted');

      // Refresh friends list
      await fetchFriends();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to accept friend request';
      setError(errorMessage);
      showErrorToast(errorMessage);
      console.error('Error accepting friend request:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFriends]);

  // Reject friend request
  const rejectFriendRequest = useCallback(async (friendshipId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);

      if (updateError) throw updateError;

      // Refresh friends list
      await fetchFriends();
    } catch (err: any) {
      setError(err.message || 'Failed to reject friend request');
      console.error('Error rejecting friend request:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFriends]);

  // Search users by username
  const searchUsers = useCallback(async (searchTerm: string): Promise<User[]> => {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error: searchError } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url, xp, level, current_streak')
        .ilike('username', `%${searchTerm}%`)
        .neq('id', user.id)
        .limit(10);

      if (searchError) throw searchError;

      return (data || []) as any;
    } catch (err: any) {
      console.error('Error searching users:', err);
      return [];
    }
  }, []);

  // Load friends on mount
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers,
    refreshFriends: fetchFriends,
  };
};
