import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreateWorkoutInput, CreateWorkoutSchema } from '../types';

interface ExerciseFormData {
  id?: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
}

interface WorkoutFormProps {
  initialData?: Partial<CreateWorkoutInput>;
  onSubmit: (data: CreateWorkoutInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  submitButtonText?: string;
}

export const WorkoutForm: React.FC<WorkoutFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitButtonText = 'Save Workout',
}) => {
  const [workoutName, setWorkoutName] = useState(initialData?.name || '');
  const [workoutNotes, setWorkoutNotes] = useState(initialData?.notes || '');
  const [duration, setDuration] = useState(
    initialData?.duration_minutes?.toString() || ''
  );
  const [exercises, setExercises] = useState<ExerciseFormData[]>(
    initialData?.exercises?.map(ex => ({
      name: ex.name,
      sets: ex.sets.toString(),
      reps: ex.reps.toString(),
      weight: ex.weight?.toString() || '',
      notes: ex.notes || '',
    })) || [
      { name: '', sets: '', reps: '', weight: '', notes: '' }
    ]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const addExercise = useCallback(() => {
    setExercises(prev => [
      ...prev,
      { name: '', sets: '', reps: '', weight: '', notes: '' }
    ]);
  }, []);

  const removeExercise = useCallback((index: number) => {
    if (exercises.length <= 1) {
      Alert.alert('Error', 'At least one exercise is required');
      return;
    }

    setExercises(prev => prev.filter((_, i) => i !== index));
  }, [exercises.length]);

  const updateExercise = useCallback((index: number, field: keyof ExerciseFormData, value: string) => {
    setExercises(prev => prev.map((exercise, i) => 
      i === index ? { ...exercise, [field]: value } : exercise
    ));
    
    // Clear field-specific errors
    const errorKey = `exercise_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate workout name
    if (!workoutName.trim()) {
      newErrors.name = 'Workout name is required';
    } else if (workoutName.length > 100) {
      newErrors.name = 'Workout name is too long';
    }

    // Validate duration
    if (duration && (isNaN(Number(duration)) || Number(duration) <= 0)) {
      newErrors.duration = 'Duration must be a positive number';
    } else if (duration && Number(duration) > 600) {
      newErrors.duration = 'Duration cannot exceed 600 minutes';
    }

    // Validate notes
    if (workoutNotes.length > 500) {
      newErrors.notes = 'Notes are too long';
    }

    // Validate exercises
    exercises.forEach((exercise, index) => {
      if (!exercise.name.trim()) {
        newErrors[`exercise_${index}_name`] = 'Exercise name is required';
      } else if (exercise.name.length > 100) {
        newErrors[`exercise_${index}_name`] = 'Exercise name is too long';
      }

      if (!exercise.sets.trim()) {
        newErrors[`exercise_${index}_sets`] = 'Sets is required';
      } else if (isNaN(Number(exercise.sets)) || Number(exercise.sets) <= 0) {
        newErrors[`exercise_${index}_sets`] = 'Sets must be a positive number';
      } else if (Number(exercise.sets) > 50) {
        newErrors[`exercise_${index}_sets`] = 'Too many sets';
      }

      if (!exercise.reps.trim()) {
        newErrors[`exercise_${index}_reps`] = 'Reps is required';
      } else if (isNaN(Number(exercise.reps)) || Number(exercise.reps) <= 0) {
        newErrors[`exercise_${index}_reps`] = 'Reps must be a positive number';
      } else if (Number(exercise.reps) > 1000) {
        newErrors[`exercise_${index}_reps`] = 'Too many reps';
      }

      if (exercise.weight && (isNaN(Number(exercise.weight)) || Number(exercise.weight) < 0)) {
        newErrors[`exercise_${index}_weight`] = 'Weight must be a positive number';
      } else if (exercise.weight && Number(exercise.weight) > 2000) {
        newErrors[`exercise_${index}_weight`] = 'Weight is too high';
      }

      if (exercise.notes.length > 200) {
        newErrors[`exercise_${index}_notes`] = 'Exercise notes are too long';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [workoutName, duration, workoutNotes, exercises]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    try {
      const formData: CreateWorkoutInput = {
        name: workoutName.trim(),
        notes: workoutNotes.trim() || undefined,
        duration_minutes: duration ? Number(duration) : undefined,
        exercises: exercises.map(exercise => ({
          name: exercise.name.trim(),
          sets: Number(exercise.sets),
          reps: Number(exercise.reps),
          weight: exercise.weight ? Number(exercise.weight) : undefined,
          notes: exercise.notes.trim() || undefined,
        })),
      };

      // Validate with Zod schema
      CreateWorkoutSchema.parse(formData);

      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  }, [validateForm, workoutName, workoutNotes, duration, exercises, onSubmit]);

  const renderExercise = (exercise: ExerciseFormData, index: number) => (
    <View key={index} style={styles.exerciseContainer}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseTitle}>Exercise {index + 1}</Text>
        {exercises.length > 1 && (
          <TouchableOpacity
            onPress={() => removeExercise(index)}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Exercise Name *</Text>
        <TextInput
          style={[
            styles.input,
            errors[`exercise_${index}_name`] && styles.inputError
          ]}
          value={exercise.name}
          onChangeText={(value) => updateExercise(index, 'name', value)}
          placeholder="e.g., Push-ups, Squats, Bench Press"
          maxLength={100}
        />
        {errors[`exercise_${index}_name`] && (
          <Text style={styles.errorText}>{errors[`exercise_${index}_name`]}</Text>
        )}
      </View>

      <View style={styles.row}>
        <View style={[styles.inputContainer, styles.flex1]}>
          <Text style={styles.label}>Sets *</Text>
          <TextInput
            style={[
              styles.input,
              errors[`exercise_${index}_sets`] && styles.inputError
            ]}
            value={exercise.sets}
            onChangeText={(value) => updateExercise(index, 'sets', value)}
            placeholder="3"
            keyboardType="numeric"
            maxLength={2}
          />
          {errors[`exercise_${index}_sets`] && (
            <Text style={styles.errorText}>{errors[`exercise_${index}_sets`]}</Text>
          )}
        </View>

        <View style={[styles.inputContainer, styles.flex1]}>
          <Text style={styles.label}>Reps *</Text>
          <TextInput
            style={[
              styles.input,
              errors[`exercise_${index}_reps`] && styles.inputError
            ]}
            value={exercise.reps}
            onChangeText={(value) => updateExercise(index, 'reps', value)}
            placeholder="10"
            keyboardType="numeric"
            maxLength={4}
          />
          {errors[`exercise_${index}_reps`] && (
            <Text style={styles.errorText}>{errors[`exercise_${index}_reps`]}</Text>
          )}
        </View>

        <View style={[styles.inputContainer, styles.flex1]}>
          <Text style={styles.label}>Weight (lbs)</Text>
          <TextInput
            style={[
              styles.input,
              errors[`exercise_${index}_weight`] && styles.inputError
            ]}
            value={exercise.weight}
            onChangeText={(value) => updateExercise(index, 'weight', value)}
            placeholder="135"
            keyboardType="numeric"
            maxLength={4}
          />
          {errors[`exercise_${index}_weight`] && (
            <Text style={styles.errorText}>{errors[`exercise_${index}_weight`]}</Text>
          )}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            errors[`exercise_${index}_notes`] && styles.inputError
          ]}
          value={exercise.notes}
          onChangeText={(value) => updateExercise(index, 'notes', value)}
          placeholder="Optional notes about this exercise"
          multiline
          numberOfLines={2}
          maxLength={200}
        />
        {errors[`exercise_${index}_notes`] && (
          <Text style={styles.errorText}>{errors[`exercise_${index}_notes`]}</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Workout Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="e.g., Upper Body Strength"
            maxLength={100}
          />
          {errors.name && (
            <Text style={styles.errorText}>{errors.name}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput
            style={[styles.input, errors.duration && styles.inputError]}
            value={duration}
            onChangeText={setDuration}
            placeholder="45"
            keyboardType="numeric"
            maxLength={3}
          />
          {errors.duration && (
            <Text style={styles.errorText}>{errors.duration}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Workout Notes</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              errors.notes && styles.inputError
            ]}
            value={workoutNotes}
            onChangeText={setWorkoutNotes}
            placeholder="Optional notes about this workout"
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          {errors.notes && (
            <Text style={styles.errorText}>{errors.notes}</Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          <TouchableOpacity onPress={addExercise} style={styles.addButton}>
            <Ionicons name="add" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {exercises.map((exercise, index) => renderExercise(exercise, index))}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>{submitButtonText}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  exerciseContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  removeButton: {
    padding: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});