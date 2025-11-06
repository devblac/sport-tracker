// Home Screen - Dashboard with quick stats and recent activity
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useGamification } from '../../hooks/useGamification';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useSocial } from '../../hooks/useSocial';
import { OfflineBanner } from '../../components/OfflineBanner';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { level, currentStreak, loading: gamificationLoading } = useGamification();
  const { workouts, loading: workoutsLoading } = useWorkouts();
  const { feed, loading: feedLoading } = useSocial();

  // Calculate today's workouts
  const todayWorkouts = workouts.filter(workout => {
    const workoutDate = new Date(workout.completed_at);
    const today = new Date();
    return (
      workoutDate.getDate() === today.getDate() &&
      workoutDate.getMonth() === today.getMonth() &&
      workoutDate.getFullYear() === today.getFullYear()
    );
  });

  // Get recent workouts (last 5)
  const recentWorkouts = workouts.slice(0, 5);

  // Get friend activity preview (last 3)
  const friendActivityPreview = feed.slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back!</Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.email?.split('@')[0] || 'Guest'}
            </Text>
          </View>
        </View>

        {/* Quick Stats Card */}
        {!gamificationLoading && (
          <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>Today's Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {todayWorkouts.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workouts</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {currentStreak}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {level}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Level</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/workout/new')}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Start Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.primary }]}
          onPress={() => router.push('/workouts')}
        >
          <Ionicons name="bar-chart" size={24} color={colors.primary} />
          <Text style={[styles.actionButtonTextSecondary, { color: colors.primary }]}>
            View Progress
          </Text>
        </TouchableOpacity>

        {/* Recent Workouts */}
        {!workoutsLoading && recentWorkouts.length > 0 && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Recent Workouts
                </Text>
                <TouchableOpacity onPress={() => router.push('/workouts')}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                </TouchableOpacity>
              </View>
            </View>

            {recentWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={[styles.workoutItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/workout/${workout.id}`)}
              >
                <View style={styles.workoutItemHeader}>
                  <Text style={[styles.workoutItemTitle, { color: colors.text }]}>
                    {workout.name}
                  </Text>
                  <Text style={[styles.workoutItemXP, { color: colors.primary }]}>
                    +{workout.xp_earned} XP
                  </Text>
                </View>
                <View style={styles.workoutItemDetails}>
                  <View style={styles.workoutItemDetail}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.workoutItemDetailText, { color: colors.textSecondary }]}>
                      {workout.duration_minutes || 0} min
                    </Text>
                  </View>
                  <View style={styles.workoutItemDetail}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.workoutItemDetailText, { color: colors.textSecondary }]}>
                      {new Date(workout.completed_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Friend Activity Preview */}
        {!feedLoading && friendActivityPreview.length > 0 && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Friend Activity
                </Text>
                <TouchableOpacity onPress={() => router.push('/social')}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                </TouchableOpacity>
              </View>
            </View>

            {friendActivityPreview.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={[styles.activityItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push('/social')}
              >
                <View style={styles.activityHeader}>
                  <View style={[styles.activityAvatar, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.activityAvatarText, { color: colors.primary }]}>
                      {activity.user?.username?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityUsername, { color: colors.text }]}>
                      {activity.user?.username || 'Unknown'}
                    </Text>
                    <Text style={[styles.activityText, { color: colors.textSecondary }]}>
                      completed {activity.name}
                    </Text>
                  </View>
                  <View style={styles.activityStats}>
                    <Ionicons name="heart" size={16} color={colors.error} />
                    <Text style={[styles.activityLikes, { color: colors.textSecondary }]}>
                      {activity.likes_count || 0}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}



        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
  workoutItem: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  workoutItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  workoutItemXP: {
    fontSize: 14,
    fontWeight: '700',
  },
  workoutItemDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  workoutItemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutItemDetailText: {
    fontSize: 12,
  },
  activityItem: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  activityInfo: {
    flex: 1,
  },
  activityUsername: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityText: {
    fontSize: 12,
  },
  activityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityLikes: {
    fontSize: 12,
  },
  bottomSpacer: {
    height: 40,
  },
});
