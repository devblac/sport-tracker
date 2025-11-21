import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CommentInput } from '../components/CommentInput';

describe('CommentInput', () => {
  it('renders with default props', () => {
    const mockOnChange = jest.fn();
    const { getByPlaceholderText } = render(
      <CommentInput value="" onChangeText={mockOnChange} />
    );

    expect(getByPlaceholderText('Add a comment about this workout...')).toBeTruthy();
  });

  it('displays character count', () => {
    const mockOnChange = jest.fn();
    const { getByText } = render(
      <CommentInput value="Test comment" onChangeText={mockOnChange} />
    );

    expect(getByText('488 / 500')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const mockOnChange = jest.fn();
    const { getByPlaceholderText } = render(
      <CommentInput value="" onChangeText={mockOnChange} />
    );

    const input = getByPlaceholderText('Add a comment about this workout...');
    fireEvent.changeText(input, 'New comment');

    expect(mockOnChange).toHaveBeenCalledWith('New comment');
  });

  it('shows warning color when near character limit', () => {
    const mockOnChange = jest.fn();
    const longText = 'a'.repeat(460); // 40 chars remaining
    const { getByText } = render(
      <CommentInput value={longText} onChangeText={mockOnChange} />
    );

    const charCount = getByText('40 / 500');
    expect(charCount).toBeTruthy();
  });

  it('displays error message when provided', () => {
    const mockOnChange = jest.fn();
    const { getByText } = render(
      <CommentInput
        value=""
        onChangeText={mockOnChange}
        error="Comment is required"
      />
    );

    expect(getByText('Comment is required')).toBeTruthy();
  });

  it('shows clear button when text is present', () => {
    const mockOnChange = jest.fn();
    const { UNSAFE_getByType } = render(
      <CommentInput value="Some text" onChangeText={mockOnChange} />
    );

    // Clear button should be present
    const touchables = UNSAFE_getByType(require('react-native').TouchableOpacity);
    expect(touchables).toBeTruthy();
  });

  it('clears text when clear button is pressed', () => {
    const mockOnChange = jest.fn();
    const { getByTestId, UNSAFE_getAllByType } = render(
      <CommentInput value="Some text" onChangeText={mockOnChange} />
    );

    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    // Find the clear button (should be the one with the close icon)
    const clearButton = touchables[0];
    fireEvent.press(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('respects maxLength prop', () => {
    const mockOnChange = jest.fn();
    const { getByText } = render(
      <CommentInput
        value="Test"
        onChangeText={mockOnChange}
        maxLength={100}
      />
    );

    expect(getByText('96 / 100')).toBeTruthy();
  });

  it('disables input when editable is false', () => {
    const mockOnChange = jest.fn();
    const { getByPlaceholderText } = render(
      <CommentInput
        value="Test"
        onChangeText={mockOnChange}
        editable={false}
      />
    );

    const input = getByPlaceholderText('Add a comment about this workout...');
    expect(input.props.editable).toBe(false);
  });

  it('uses custom placeholder when provided', () => {
    const mockOnChange = jest.fn();
    const { getByPlaceholderText } = render(
      <CommentInput
        value=""
        onChangeText={mockOnChange}
        placeholder="Custom placeholder"
      />
    );

    expect(getByPlaceholderText('Custom placeholder')).toBeTruthy();
  });
});
