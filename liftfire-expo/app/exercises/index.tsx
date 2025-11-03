// Exercise Library Screen - Browse available exercises
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExerciseLibrary } from '../../components/ExerciseLibrary';
import { ExerciseLibraryItem } from '../../types';
import { router } from 'expo-router';

export default function ExercisesScreen() {
  const handleSelectExercise = (exercise: ExerciseLibraryItem) => {
    // Show exercise details (could be a modal or new screen)
    router.push({
      pathname: '/exercises/[id]',
      params: { id: exercise.id },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exercise Library</Text>
        <Text style={styles.subtitle}>20 exercises available</Text>
      </View>

      <ExerciseLibrary onSelectExercise={handleSelectExercise} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
