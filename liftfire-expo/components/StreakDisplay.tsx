/**
 * Streak Display Component
 * 
 * Displays user's current workout streak with fire icon
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak?: number;
  compact?: boolean;
}

export function StreakDisplay({ currentStreak, longestStreak, compact = false }: StreakDisplayProps) {
  // Determine fire icon intensity based on streak
  const getFireIcon = (streak: number): string => {
    if (streak === 0) return '🔥';
    if (streak < 7) return '🔥';
    if (streak < 30) return '🔥🔥';
    if (streak < 100) return '🔥🔥🔥';
    return '🔥🔥🔥🔥';
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.fireIcon}>{getFireIcon(currentStreak)}</Text>
        <Text style={styles.compactStreakText}>{currentStreak}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainStreak}>
        <Text style={styles.fireIconLarge}>{getFireIcon(currentStreak)}</Text>
        <View style={styles.streakInfo}>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </View>
      </View>

      {longestStreak !== undefined && longestStreak > 0 && (
        <View style={styles.longestStreak}>
          <Text style={styles.longestStreakLabel}>Longest Streak</Text>
          <Text style={styles.longestStreakNumber}>{longestStreak} days</Text>
        </View>
      )}

      {currentStreak === 0 && (
        <Text style={styles.motivationText}>
          Complete a workout to start your streak! 💪
        </Text>
      )}

      {currentStreak > 0 && currentStreak < 7 && (
        <Text style={styles.motivationText}>
          Keep going! {7 - currentStreak} more days to unlock streak bonus!
        </Text>
      )}

      {currentStreak >= 7 && (
        <Text style={styles.bonusText}>
          🎉 Streak bonus active! +{getStreakBonusPercentage(currentStreak)}% XP
        </Text>
      )}
    </View>
  );
}

// Helper function to get streak bonus percentage
function getStreakBonusPercentage(streak: number): number {
  if (streak >= 90) return 100;
  if (streak >= 60) return 70;
  if (streak >= 30) return 50;
  if (streak >= 14) return 30;
  if (streak >= 7) return 20;
  return 0;
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff3e0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  mainStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fireIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  fireIconLarge: {
    fontSize: 48,
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff6f00',
  },
  streakLabel: {
    fontSize: 16,
    color: '#666',
  },
  compactStreakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6f00',
    marginLeft: 4,
  },
  longestStreak: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ffcc80',
    marginTop: 8,
  },
  longestStreakLabel: {
    fontSize: 14,
    color: '#666',
  },
  longestStreakNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6f00',
  },
  motivationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  bonusText: {
    fontSize: 14,
    color: '#ff6f00',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: 'bold',
  },
});
