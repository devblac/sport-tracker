import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useSyncStatusIndicator, useOfflineSync } from '../../hooks/useOfflineSync';
import { WorkoutCard } from '../../components/WorkoutCard';
import { ErrorMessage } from '../../components/ErrorMessage';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Workout } from '../../types';

const WORKOUTS_PER_PAGE = 20;

export default function WorkoutsScreen() {
  const {
    workouts,
    loading,
    error,
    refreshing,
    deleteWorkout,
    refreshWorkouts,
    clearError,
  } = useWorkouts();

  const { statusText, statusColor } = useSyncStatusIndicator();
  const { syncNow } = useOfflineSync();

  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Paginated workouts
  const paginatedWorkouts = workouts.slice(0, currentPage * WORKOUTS_PER_PAGE);
  const hasMoreWorkouts = workouts.length > paginatedWorkouts.length;

  const handleWorkoutPress = useCallback((workout: Workout) => {
    router.push(`/workout/${workout.id}`);
  }, []);

  const handleDeleteWorkout = useCallback(async (workoutId: string) => {
    const result = await deleteWorkout(workoutId);
    if (!result.success && result.error) {
      Alert.alert('Error', result.error);
    }
  }, [deleteWorkout]);

  const handleCreateWorkout = useCallback(() => {
    router.push('/workout/new');
  }, []);

  const handleRefresh = useCallback(async () => {
    clearError();
    // Trigger sync first, then refresh workouts
    try {
      await syncNow();
    } catch (err) {
      console.error('Sync failed during refresh:', err);
    }
    await refreshWorkouts();
  }, [refreshWorkouts, clearError, syncNow]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreWorkouts) return;

    setLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setCurrentPage(prev => prev + 1);
      setLoadingMore(false);
    }, 500);
  }, [loadingMore, hasMoreWorkouts]);

  const renderWorkoutCard = useCallback(({ item }: { item: Workout }) => (
    <WorkoutCard
      workout={item}
      onPress={() => handleWorkoutPress(item)}
      onDelete={() => handleDeleteWorkout(item.id)}
    />
  ), [handleWorkoutPress, handleDeleteWorkout]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="fitness-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No Workouts Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start your fitness journey by creating your first workout!
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateWorkout}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create Workout</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadMoreFooter = () => {
    if (!hasMoreWorkouts) return null;

    return (
      <View style={styles.loadMoreContainer}>
        {loadingMore ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Optimize FlatList performance with getItemLayout
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 140, // Approximate height of WorkoutCard
    offset: 140 * index,
    index,
  }), []);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>My Workouts</Text>
        <View style={[styles.syncStatus, { backgroundColor: statusColor }]}>
          <Text style={styles.syncStatusText}>{statusText}</Text>
        </View>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={16} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Ionicons name="close" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{workouts.length}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {workouts.reduce((sum, w) => sum + w.xp_earned, 0)}
          </Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {workouts.filter(w => !w.synced).length}
          </Text>
          <Text style={styles.statLabel}>Pending Sync</Text>
        </View>
      </View>
    </View>
  );

  // Show loading state on initial load
  if (loading && workouts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <ListSkeleton count={5} type="workout" />
      </SafeAreaView>
    );
  }

  // Show error state if there's an error and no cached workouts
  if (error && workouts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <ErrorMessage
          message={error}
          onRetry={handleRefresh}
          fullScreen={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <FlatList
        data={paginatedWorkouts}
        renderItem={renderWorkoutCard}
        keyExtractor={(item) => item.id}
        getItemLayout={getItemLayout}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadMoreFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={workouts.length === 0 ? styles.emptyList : undefined}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />

      <TouchableOpacity style={styles.fab} onPress={handleCreateWorkout}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  syncStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});