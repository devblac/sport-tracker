import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CommentInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  label?: string;
  showCharacterCount?: boolean;
  error?: string;
  editable?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Add a comment about this workout...',
  maxLength = 500,
  label = 'Comment',
  showCharacterCount = true,
  error,
  editable = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars <= 50;

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {showCharacterCount && (
          <Text
            style={[
              styles.characterCount,
              isNearLimit && styles.characterCountWarning,
              remainingChars === 0 && styles.characterCountError,
            ]}
          >
            {remainingChars} / {maxLength}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
          !editable && styles.inputWrapperDisabled,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            !editable && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          multiline
          numberOfLines={4}
          maxLength={maxLength}
          editable={editable}
          textAlignVertical="top"
        />

        {value.length > 0 && editable && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  characterCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  characterCountWarning: {
    color: '#FF9500',
    fontWeight: '600',
  },
  characterCountError: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    minHeight: 100,
    position: 'relative',
  },
  inputWrapperFocused: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  inputWrapperError: {
    borderColor: '#FF3B30',
  },
  inputWrapperDisabled: {
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E5EA',
  },
  input: {
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
    minHeight: 100,
  },
  inputDisabled: {
    color: '#8E8E93',
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
  },
});
