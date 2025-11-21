import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../types';

interface WorkoutCardProps {
  workout: Workout;
  onPress: () => void;
  onDelete?: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onPress,
  onDelete,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'No duration';
    
    if (minutes < 60) {
      return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: onDelete 
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {workout.name}
          </Text>
          {!workout.synced && (
            <View style={styles.offlineIndicator}>
              <Ionicons name="cloud-offline" size={16} color="#FF9500" />
            </View>
          )}
        </View>
        {onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
          <Text style={styles.detailText}>
            {formatDate(workout.completed_at)}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#8E8E93" />
          <Text style={styles.detailText}>
            {formatDuration(workout.duration_minutes)}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="trophy-outline" size={16} color="#8E8E93" />
          <Text style={styles.detailText}>
            {workout.xp_earned} XP
          </Text>
        </View>

        {workout.exercises && workout.exercises.length > 0 && (
          <View style={styles.detailItem}>
            <Ionicons name="fitness-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>
              {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {workout.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {workout.notes}
        </Text>
      )}

      {workout.comment && (
        <View style={styles.commentContainer}>
          <Ionicons name="chatbox-outline" size={14} color="#8E8E93" />
          <Text style={styles.comment} numberOfLines={2}>
            {workout.comment}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  offlineIndicator: {
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  notes: {
    fontSize: 14,
    color: '#6D6D70',
    marginTop: 12,
    fontStyle: 'italic',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  comment: {
    flex: 1,
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
});