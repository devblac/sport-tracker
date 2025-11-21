import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkouts } from '../../hooks/useWorkouts';
import { Workout, Exercise } from '../../types';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getWorkoutById, deleteWorkout } = useWorkouts();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      const foundWorkout = getWorkoutById(id);
      setWorkout(foundWorkout || null);
      setLoading(false);
    }
  }, [id, getWorkoutById]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'No duration recorded';
    
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  };

  const handleEdit = () => {
    if (!workout) return;
    
    // Navigate to edit screen (we'll create this later or reuse the form)
    router.push({
      pathname: '/workout/edit/[id]',
      params: { id: workout.id },
    });
  };

  const handleDelete = () => {
    if (!workout) return;

    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!workout) return;

    setDeleting(true);
    
    try {
      const result = await deleteWorkout(workout.id);
      
      if (result.success) {
        Alert.alert(
          'Deleted',
          'Workout deleted successfully',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to delete workout');
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setDeleting(false);
    }
  };

  const renderExercise = (exercise: Exercise, index: number) => (
    <View key={exercise.id || index} style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.exerciseStats}>
          <Text style={styles.exerciseStatsText}>
            {exercise.sets} × {exercise.reps}
            {exercise.weight ? ` @ ${exercise.weight} lbs` : ''}
          </Text>
        </View>
      </View>
      
      {exercise.notes && (
        <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Loading...',
            headerShown: true,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Workout Not Found',
            headerShown: true,
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Workout Not Found</Text>
          <Text style={styles.errorSubtitle}>
            This workout may have been deleted or doesn't exist.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: workout.name,
          headerShown: true,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={handleEdit}
                style={styles.headerButton}
                disabled={deleting}
              >
                <Ionicons name="create-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.headerButton}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FF3B30" />
                ) : (
                  <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                )}
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sync Status */}
        {!workout.synced && (
          <View style={styles.syncWarning}>
            <Ionicons name="cloud-offline" size={20} color="#FF9500" />
            <Text style={styles.syncWarningText}>
              This workout hasn't been synced yet
            </Text>
          </View>
        )}

        {/* Workout Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(workout.completed_at)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#007AFF" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{formatTime(workout.completed_at)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="hourglass-outline" size={20} color="#007AFF" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{formatDuration(workout.duration_minutes)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="trophy-outline" size={20} color="#007AFF" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>XP Earned</Text>
                <Text style={styles.infoValue}>{workout.xp_earned} XP</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Workout Notes */}
        {workout.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </View>
        )}

        {/* Workout Comment */}
        {workout.comment && (
          <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
              <Text style={styles.commentTitle}>Comment</Text>
            </View>
            <Text style={styles.commentText}>{workout.comment}</Text>
          </View>
        )}

        {/* Exercises */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>
            Exercises ({workout.exercises?.length || 0})
          </Text>
          
          {workout.exercises && workout.exercises.length > 0 ? (
            workout.exercises.map((exercise, index) => renderExercise(exercise, index))
          ) : (
            <View style={styles.noExercisesContainer}>
              <Ionicons name="fitness-outline" size={48} color="#C7C7CC" />
              <Text style={styles.noExercisesText}>No exercises recorded</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  syncWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8,
  },
  syncWarningText: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 16,
    color: '#3C3C43',
    lineHeight: 22,
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  commentText: {
    fontSize: 16,
    color: '#3C3C43',
    lineHeight: 22,
  },
  exercisesSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  exerciseStats: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  exerciseStatsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  exerciseNotes: {
    fontSize: 14,
    color: '#6D6D70',
    fontStyle: 'italic',
  },
  noExercisesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noExercisesText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
});