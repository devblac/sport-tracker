// ============================================================================
// SAFE INPUT HOOK
// ============================================================================
// Hook for sanitizing and validating user inputs
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import DOMPurify from 'dompurify';

interface UseSafeInputOptions<T> {
  schema?: z.ZodSchema<T>;
  sanitize?: boolean;
  maxLength?: number;
  allowedTags?: string[];
}

interface SafeInputState<T> {
  value: T;
  rawValue: string;
  isValid: boolean;
  errors: string[];
  isDirty: boolean;
}

export function useSafeInput<T = string>(
  initialValue: T,
  options: UseSafeInputOptions<T> = {}
) {
  const {
    schema,
    sanitize = true,
    maxLength,
    allowedTags = []
  } = options;

  const [state, setState] = useState<SafeInputState<T>>({
    value: initialValue,
    rawValue: String(initialValue),
    isValid: true,
    errors: [],
    isDirty: false
  });

  const sanitizeInput = useCallback((input: string): string => {
    if (!sanitize) return input;

    // Basic sanitization
    let sanitized = input.trim();

    // Length limit
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // HTML sanitization for rich text
    if (allowedTags.length > 0) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: ['href', 'target', 'rel']
      });
    } else {
      // Strip all HTML for plain text
      sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
    }

    return sanitized;
  }, [sanitize, maxLength, allowedTags]);

  const validateInput = useCallback((value: T): { isValid: boolean; errors: string[] } => {
    if (!schema) return { isValid: true, errors: [] };

    const result = schema.safeParse(value);
    if (result.success) {
      return { isValid: true, errors: [] };
    }

    const errors = result.error.errors.map(err => err.message);
    return { isValid: false, errors };
  }, [schema]);

  const setValue = useCallback((newValue: string) => {
    const sanitized = sanitizeInput(newValue);
    const typedValue = sanitized as T; // Type assertion - could be improved with better typing
    const validation = validateInput(typedValue);

    setState({
      value: typedValue,
      rawValue: newValue,
      isValid: validation.isValid,
      errors: validation.errors,
      isDirty: true
    });
  }, [sanitizeInput, validateInput]);

  const reset = useCallback(() => {
    setState({
      value: initialValue,
      rawValue: String(initialValue),
      isValid: true,
      errors: [],
      isDirty: false
    });
  }, [initialValue]);

  const inputProps = useMemo(() => ({
    value: state.rawValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(e.target.value);
    }
  }), [state.rawValue, setValue]);

  return {
    ...state,
    setValue,
    reset,
    inputProps
  };
}

// Specialized hooks for common use cases
export function useSafeTextInput(initialValue = '', maxLength?: number) {
  return useSafeInput(initialValue, {
    schema: z.string().max(maxLength || 1000),
    sanitize: true,
    maxLength
  });
}

export function useSafeEmailInput(initialValue = '') {
  return useSafeInput(initialValue, {
    schema: z.string().email('Invalid email format'),
    sanitize: true
  });
}

export function useSafeNumberInput(initialValue = 0, min?: number, max?: number) {
  return useSafeInput(initialValue, {
    schema: z.number().min(min || -Infinity).max(max || Infinity),
    sanitize: false
  });
}