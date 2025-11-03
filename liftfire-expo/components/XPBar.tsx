/**
 * XP Bar Component
 * 
 * Displays user's current level and progress to next level
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface XPBarProps {
  level: number;
  xp: number;
  levelProgress: number;
  xpToNextLevel: number;
}

export function XPBar({ level, xp, levelProgress, xpToNextLevel }: XPBarProps) {
  return (
    <View style={styles.container}>
      {/* Level and XP Info */}
      <View style={styles.header}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.xpText}>{xpToNextLevel} XP to next level</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${Math.min(levelProgress, 100)}%` }
          ]} 
        />
      </View>

      {/* Progress Percentage */}
      <Text style={styles.progressText}>{Math.round(levelProgress)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  xpText: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
});
