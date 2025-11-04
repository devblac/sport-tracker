// Social feed screen showing friends' workout activity
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useSocial } from '../../hooks/useSocial';
import { FriendWorkoutItem } from '../../components/FriendWorkoutItem';
import { LeaderboardList } from '../../components/LeaderboardList';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { FriendWorkout } from '../../types';
import { useTheme } from '../../hooks/useTheme';

type TabType = 'feed' | 'leaderboard';

export default function SocialScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const { feed, loading, error, toggleLike, refreshFeed } = useSocial();
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabType>('feed');
  const [friendsOnly, setFriendsOnly] = React.useState(false);

  // Show guest message if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Social</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Connect with friends and compete
          </Text>
        </View>

        <View style={[styles.guestContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.guestIconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="people" size={64} color={colors.primary} />
          </View>
          
          <Text style={[styles.guestTitle, { color: colors.text }]}>
            Social Features Require an Account
          </Text>
          
          <Text style={[styles.guestMessage, { color: colors.textSecondary }]}>
            Create an account to unlock social features like:
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Add friends and see their workouts
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Like and comment on activities
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Compete on weekly leaderboards
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Sync your data across devices
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.guestButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Ionicons name="person-add" size={20} color="#FFFFFF" />
            <Text style={styles.guestButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.guestButtonSecondary, { borderColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[styles.guestButtonSecondaryText, { color: colors.primary }]}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshFeed();
    setRefreshing(false);
  };

  const handleLike = async (workoutId: string, currentlyLiked: boolean) => {
    try {
      await toggleLike(workoutId, currentlyLiked);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const renderItem = ({ item }: { item: FriendWorkout }) => (
    <FriendWorkoutItem workout={item} onLike={handleLike} />
  );

  const renderEmpty = () => {
    if (loading && !refreshing) {
      return <ListSkeleton count={5} type="feed" />;
    }

    if (error) {
      return (
        <ErrorMessage
          message={error}
          onRetry={handleRefresh}
          fullScreen={false}
        />
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={styles.emptyTitle}>No Activity Yet</Text>
        <Text style={styles.emptyText}>
          Add friends to see their workout activity here
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'feed' ? 'See what your friends are up to' : 'Weekly rankings'}
        </Text>
      </View>

      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Leaderboard filter toggle */}
      {activeTab === 'leaderboard' && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, !friendsOnly && styles.activeFilter]}
            onPress={() => setFriendsOnly(false)}
          >
            <Text style={[styles.filterText, !friendsOnly && styles.activeFilterText]}>
              Global
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, friendsOnly && styles.activeFilter]}
            onPress={() => setFriendsOnly(true)}
          >
            <Text style={[styles.filterText, friendsOnly && styles.activeFilterText]}>
              Friends
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {activeTab === 'feed' ? (
        <FlatList
          data={feed}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            feed.length === 0 && styles.emptyListContent,
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
        />
      ) : (
        <LeaderboardList friendsOnly={friendsOnly} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  activeFilter: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: '#007AFF',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    minHeight: 400,
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  guestContainer: {
    flex: 1,
    margin: 20,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  guestIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  guestMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  featureList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  guestButtonSecondary: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    width: '100%',
    alignItems: 'center',
  },
  guestButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
