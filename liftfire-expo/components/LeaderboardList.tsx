// Leaderboard list component
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { LeaderboardEntry } from '../types';

interface LeaderboardListProps {
  friendsOnly?: boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const LeaderboardList: React.FC<LeaderboardListProps> = ({ friendsOnly = false }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache
      const now = Date.now();
      if (!forceRefresh && lastFetch && (now - lastFetch) < CACHE_DURATION) {
        return; // Use cached data
      }

      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      setCurrentUserId(user.id);

      if (friendsOnly) {
        // Fetch friends-only leaderboard
        const { data: friendships, error: friendsError } = await supabase
          .from('friendships')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        if (friendsError) throw friendsError;

        const friendIds = friendships?.map(f => f.friend_id) || [];
        friendIds.push(user.id); // Include current user

        if (friendIds.length === 0) {
          setEntries([]);
          return;
        }

        // Fetch workouts for friends this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const { data: workouts, error: workoutsError } = await supabase
          .from('workouts')
          .select('user_id, xp_earned, users!workouts_user_id_fkey(username)')
          .in('user_id', friendIds)
          .gte('completed_at', weekStart.toISOString());

        if (workoutsError) throw workoutsError;

        // Aggregate by user
        const userStats = new Map<string, { username: string; xp: number; count: number }>();
        
        workouts?.forEach(workout => {
          const userId = workout.user_id;
          const username = (workout.users as any)?.username || 'Unknown';
          const existing = userStats.get(userId) || { username, xp: 0, count: 0 };
          existing.xp += workout.xp_earned;
          existing.count += 1;
          userStats.set(userId, existing);
        });

        // Convert to leaderboard entries and sort
        const leaderboardData: LeaderboardEntry[] = Array.from(userStats.entries())
          .map(([userId, stats]) => ({
            username: stats.username,
            xp_week: stats.xp,
            workouts_week: stats.count,
            rank: 0, // Will be set after sorting
          }))
          .sort((a, b) => b.xp_week - a.xp_week)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));

        setEntries(leaderboardData);
      } else {
        // Fetch global leaderboard from materialized view
        const { data, error: leaderboardError } = await supabase
          .from('weekly_leaderboard_public')
          .select('*')
          .order('rank', { ascending: true })
          .limit(50);

        if (leaderboardError) throw leaderboardError;

        setEntries(data || []);
      }

      setLastFetch(now);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leaderboard';
      setError(errorMessage);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [friendsOnly, lastFetch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard(true);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.username === currentUserId;
    const medalEmoji = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '';

    return (
      <View style={[styles.item, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.rankContainer}>
          {medalEmoji ? (
            <Text style={styles.medal}>{medalEmoji}</Text>
          ) : (
            <Text style={styles.rank}>{item.rank}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.username, isCurrentUser && styles.currentUsername]}>
            {item.username}
            {isCurrentUser && ' (You)'}
          </Text>
          <Text style={styles.workoutCount}>{item.workouts_week} workouts</Text>
        </View>
        <View style={styles.xpContainer}>
          <Text style={[styles.xp, isCurrentUser && styles.currentXp]}>
            {item.xp_week}
          </Text>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyText}>
          {friendsOnly
            ? 'No friends have completed workouts this week'
            : 'No leaderboard data available'}
        </Text>
      </View>
    );
  };

  // Optimize FlatList performance with getItemLayout
  const getItemLayout = useCallback((_data: unknown, index: number) => ({
    length: 80, // Approximate height of leaderboard item
    offset: 80 * index,
    index,
  }), []);

  return (
    <FlatList
      data={entries}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item.username}-${index}`}
      getItemLayout={getItemLayout}
      contentContainerStyle={[
        styles.listContent,
        entries.length === 0 && styles.emptyListContent,
      ]}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#007AFF"
        />
      }
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={10}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  medal: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  currentUsername: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  workoutCount: {
    fontSize: 12,
    color: '#666',
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  xp: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  currentXp: {
    color: '#0051D5',
  },
  xpLabel: {
    fontSize: 12,
    color: '#666',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
  },
});
