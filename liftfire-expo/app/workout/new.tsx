import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useWorkouts } from '../../hooks/useWorkouts';
import { WorkoutForm } from '../../components/WorkoutForm';
import { CreateWorkoutInput } from '../../types';

export default function NewWorkoutScreen() {
  const { createWorkout } = useWorkouts();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateWorkoutInput) => {
    setLoading(true);
    
    try {
      const result = await createWorkout(data);
      
      if (result.success) {
        Alert.alert(
          'Success',
          'Workout created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to the created workout detail or back to workouts list
                if (result.workout) {
                  router.replace(`/workout/${result.workout.id}`);
                } else {
                  router.back();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create workout');
      }
    } catch (error) {
      console.error('Error creating workout:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard this workout?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => router.back()
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'New Workout',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      
      <WorkoutForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        submitButtonText="Create Workout"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
});