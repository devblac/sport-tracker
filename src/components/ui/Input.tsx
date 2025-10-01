import React from 'react';
import { cn } from '@/utils';
import { Eye, EyeOff } from 'lucide-react';
import { sanitizeUserContent } from '@/utils/xssProtection';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  sanitizeInput?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  sanitizeInput = true,
  className,
  type = 'text',
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const isPassword = type === 'password';
  const actualType = isPassword && showPassword ? 'text' : type;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle input sanitization
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (sanitizeInput && type !== 'password' && type !== 'email') {
      // Only sanitize for display/text inputs, not passwords or emails
      const sanitized = sanitizeUserContent(e.target.value);
      e.target.value = sanitized;
    }
    props.onChange?.(e);
  };

  return (
    <div className={cn('space-y-1', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium transition-colors',
            error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
          )}
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          type={actualType}
          className={cn(
            // Base styles
            'w-full px-3 py-2 text-base bg-white dark:bg-gray-800',
            'border border-gray-300 dark:border-gray-600 rounded-lg',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'text-gray-900 dark:text-gray-100',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            // Mobile optimizations
            'text-base', // Prevents zoom on iOS
            'touch-manipulation',
            // Icon padding
            leftIcon && 'pl-10',
            (rightIcon || isPassword) && 'pr-10',
            // Error styles
            error && 'border-red-500 focus:ring-red-500',
            // Transition
            'transition-all duration-200',
            // Focus glow effect
            isFocused && !error && 'shadow-lg shadow-primary-500/20',
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
          onChange={handleInputChange}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
        
        {rightIcon && !isPassword && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={cn(
          'text-sm',
          error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};