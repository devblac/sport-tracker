/**
 * PRBadge Usage Examples
 * 
 * This file demonstrates how to use the PRBadge component
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { PRBadge } from './PRBadge';

export function PRBadgeExamples() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>PRBadge Examples</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Small size with improvement:</Text>
        <PRBadge isNewPR={true} improvement={12.5} size="small" />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Medium size (default) with improvement:</Text>
        <PRBadge isNewPR={true} improvement={25.3} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Large size with improvement:</Text>
        <PRBadge isNewPR={true} improvement={8.7} size="large" />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Without improvement percentage:</Text>
        <PRBadge isNewPR={true} size="medium" />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Not a PR (renders nothing):</Text>
        <PRBadge isNewPR={false} />
        <Text style={styles.note}>^ Nothing should appear above</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>In a workout card context:</Text>
        <View style={styles.workoutCard}>
          <View style={styles.exerciseRow}>
            <Text style={styles.exerciseName}>Bench Press</Text>
            <PRBadge isNewPR={true} improvement={15.2} size="small" />
          </View>
          <Text style={styles.exerciseDetails}>225 lbs × 5 reps</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1C1C1E',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6D6D70',
    marginBottom: 8,
  },
  note: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 4,
  },
  workoutCard: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#6D6D70',
  },
});
