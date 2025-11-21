/**
 * CommentInput Component - Usage Examples
 * 
 * A reusable component for adding comments to workouts with character counting,
 * validation, and clear functionality.
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { CommentInput } from './CommentInput';

// Example 1: Basic usage
export const BasicExample = () => {
  const [comment, setComment] = useState('');

  return (
    <CommentInput
      value={comment}
      onChangeText={setComment}
    />
  );
};

// Example 2: With validation
export const ValidationExample = () => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleChange = (text: string) => {
    setComment(text);
    if (text.length > 0) {
      setError('');
    }
  };

  const handleSubmit = () => {
    if (comment.trim().length === 0) {
      setError('Comment cannot be empty');
      return;
    }
    // Submit logic here
  };

  return (
    <CommentInput
      value={comment}
      onChangeText={handleChange}
      error={error}
    />
  );
};

// Example 3: Custom configuration
export const CustomExample = () => {
  const [comment, setComment] = useState('');

  return (
    <CommentInput
      value={comment}
      onChangeText={setComment}
      placeholder="How did this workout feel?"
      maxLength={200}
      label="Workout Notes"
      showCharacterCount={true}
    />
  );
};

// Example 4: Read-only mode
export const ReadOnlyExample = () => {
  const comment = "Great workout! Felt strong on all lifts.";

  return (
    <CommentInput
      value={comment}
      onChangeText={() => {}}
      editable={false}
      label="Previous Comment"
    />
  );
};

// Example 5: In a form context
export const FormExample = () => {
  const [workoutData, setWorkoutData] = useState({
    name: '',
    comment: '',
  });

  const handleCommentChange = (text: string) => {
    setWorkoutData(prev => ({ ...prev, comment: text }));
  };

  return (
    <View>
      {/* Other form fields */}
      <CommentInput
        value={workoutData.comment}
        onChangeText={handleCommentChange}
        placeholder="Add notes about your workout..."
        label="Workout Comment"
      />
    </View>
  );
};
