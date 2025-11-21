import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WorkoutForm } from '../components/WorkoutForm';

// Mock RestTimer component to avoid native module dependencies
jest.mock('../components/RestTimer', () => ({
  RestTimer: () => null,
}));

describe('WorkoutForm - Comment Integration', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('includes comment field in the form', () => {
    const { getByText, getByPlaceholderText } = render(
      <WorkoutForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(getByText('How did it go?')).toBeTruthy();
    expect(getByPlaceholderText(/Share your thoughts about this workout/)).toBeTruthy();
  });

  it('submits workout with comment', async () => {
    const { getByPlaceholderText, getByText } = render(
      <WorkoutForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Fill in required fields
    const workoutNameInput = getByPlaceholderText('e.g., Upper Body Strength');
    fireEvent.changeText(workoutNameInput, 'Test Workout');

    // Fill in exercise
    const exerciseNameInput = getByPlaceholderText('e.g., Push-ups, Squats, Bench Press');
    fireEvent.changeText(exerciseNameInput, 'Bench Press');

    const setsInput = getByPlaceholderText('3');
    fireEvent.changeText(setsInput, '3');

    const repsInput = getByPlaceholderText('10');
    fireEvent.changeText(repsInput, '10');

    // Add comment
    const commentInput = getByPlaceholderText(/Share your thoughts about this workout/);
    fireEvent.changeText(commentInput, 'Great workout! Hit a new PR on bench press.');

    // Submit form
    const submitButton = getByText('Save Workout');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Workout',
          comment: 'Great workout! Hit a new PR on bench press.',
          exercises: expect.arrayContaining([
            expect.objectContaining({
              name: 'Bench Press',
              sets: 3,
              reps: 10,
            }),
          ]),
        })
      );
    });
  });

  it('submits workout without comment (optional field)', async () => {
    const { getByPlaceholderText, getByText } = render(
      <WorkoutForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Fill in required fields only
    const workoutNameInput = getByPlaceholderText('e.g., Upper Body Strength');
    fireEvent.changeText(workoutNameInput, 'Test Workout');

    const exerciseNameInput = getByPlaceholderText('e.g., Push-ups, Squats, Bench Press');
    fireEvent.changeText(exerciseNameInput, 'Squats');

    const setsInput = getByPlaceholderText('3');
    fireEvent.changeText(setsInput, '4');

    const repsInput = getByPlaceholderText('10');
    fireEvent.changeText(repsInput, '8');

    // Submit without adding comment
    const submitButton = getByText('Save Workout');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Workout',
          comment: undefined, // Comment should be undefined when empty
          exercises: expect.arrayContaining([
            expect.objectContaining({
              name: 'Squats',
              sets: 4,
              reps: 8,
            }),
          ]),
        })
      );
    });
  });

  it('enforces comment length limit (max 500 characters)', async () => {
    const { getByPlaceholderText, getByText } = render(
      <WorkoutForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Fill in required fields
    const workoutNameInput = getByPlaceholderText('e.g., Upper Body Strength');
    fireEvent.changeText(workoutNameInput, 'Test Workout');

    const exerciseNameInput = getByPlaceholderText('e.g., Push-ups, Squats, Bench Press');
    fireEvent.changeText(exerciseNameInput, 'Deadlift');

    const setsInput = getByPlaceholderText('3');
    fireEvent.changeText(setsInput, '5');

    const repsInput = getByPlaceholderText('10');
    fireEvent.changeText(repsInput, '5');

    // Add comment at exactly 500 characters
    const maxComment = 'a'.repeat(500);
    const commentInput = getByPlaceholderText(/Share your thoughts about this workout/);
    fireEvent.changeText(commentInput, maxComment);

    // Submit form - should work with exactly 500 characters
    const submitButton = getByText('Save Workout');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          comment: maxComment,
        })
      );
    });
  });

  it('displays character counter for comment', () => {
    const { getByText } = render(
      <WorkoutForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Character counter should show 500 / 500 initially
    expect(getByText('500 / 500')).toBeTruthy();
  });
});
