// Friend workout item component for social feed
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FriendWorkout } from '../types';

interface FriendWorkoutItemProps {
  workout: FriendWorkout;
  onLike: (workoutId: string, currentlyLiked: boolean) => void;
}

export const FriendWorkoutItem: React.FC<FriendWorkoutItemProps> = ({ workout, onLike }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <View style={styles.container}>
      {/* User info */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {workout.user?.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {workout.user?.display_name || workout.user?.username || 'Unknown'}
          </Text>
          <Text style={styles.timestamp}>{formatDate(workout.completed_at)}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv {workout.user?.level || 1}</Text>
        </View>
      </View>

      {/* Workout info */}
      <View style={styles.content}>
        <Text style={styles.workoutName}>{workout.name}</Text>
        <View style={styles.stats}>
          {workout.duration_minutes && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Duration:</Text>
              <Text style={styles.statValue}>{workout.duration_minutes} min</Text>
            </View>
          )}
          <View style={styles.stat}>
            <Text style={styles.statLabel}>XP:</Text>
            <Text style={styles.statValue}>+{workout.xp_earned}</Text>
          </View>
        </View>
        {workout.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {workout.notes}
          </Text>
        )}
      </View>

      {/* Like button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => onLike(workout.id, workout.liked_by_me || false)}
        >
          <Text style={[styles.likeIcon, workout.liked_by_me && styles.likedIcon]}>
            {workout.liked_by_me ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.likeCount}>
            {workout.likes_count || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  levelBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  likedIcon: {
    // Already using filled heart emoji
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});
