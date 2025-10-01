/**
 * Secure Textarea Component
 * Textarea with built-in XSS protection and content validation
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/utils';
import { AlertTriangle } from 'lucide-react';
import { sanitizeUserContent } from '@/utils/xssProtection';
import { useSecurity } from '@/hooks/useSecurity';

export interface SecureTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  validateContent?: boolean;
}

export const SecureTextarea: React.FC<SecureTextareaProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  maxLength = 1000,
  showCharCount = true,
  validateContent = true,
  className,
  id,
  value,
  onChange,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { validateInput } = useSecurity();
  
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const currentLength = typeof value === 'string' ? value.length : 0;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    
    if (validateContent) {
      const validation = validateInput(inputValue, 'text');
      
      if (!validation.isValid) {
        setValidationError(validation.errors[0]);
        return; // Don't update if validation fails
      } else {
        setValidationError(null);
      }
      
      // Use sanitized content
      e.target.value = validation.sanitized;
    }
    
    onChange?.(e);
  }, [onChange, validateContent, validateInput]);

  const displayError = error || validationError;

  return (
    <div className={cn('space-y-1', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium transition-colors',
            displayError ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
          )}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <textarea
          id={inputId}
          value={value}
          maxLength={maxLength}
          className={cn(
            // Base styles
            'w-full px-3 py-2 text-base bg-white dark:bg-gray-800',
            'border border-gray-300 dark:border-gray-600 rounded-lg',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'text-gray-900 dark:text-gray-100',
            'resize-vertical min-h-[80px]',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            // Mobile optimizations
            'text-base', // Prevents zoom on iOS
            'touch-manipulation',
            // Error styles
            displayError && 'border-red-500 focus:ring-red-500',
            // Transition
            'transition-all duration-200',
            // Focus glow effect
            isFocused && !displayError && 'shadow-lg shadow-primary-500/20',
            // Custom className
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onChange={handleChange}
          {...props}
        />
        
        {/* Character count */}
        {showCharCount && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white dark:bg-gray-800 px-1 rounded">
            {currentLength}/{maxLength}
          </div>
        )}
      </div>
      
      {/* Error or helper text */}
      {(displayError || helperText) && (
        <div className="flex items-start space-x-1">
          {displayError && <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
          <p className={cn(
            'text-sm',
            displayError ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          )}>
            {displayError || helperText}
          </p>
        </div>
      )}
    </div>
  );
};