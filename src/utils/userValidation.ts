import { z } from 'zod';
import {
  UserSchema,
  UserRegistrationSchema,
  UserLoginSchema,
  UserProfileUpdateSchema,
  UserSettingsUpdateSchema,
  PasswordChangeSchema,
  type User,
  type UserRegistration,
  type UserLogin,
  type UserProfileUpdate,
  type UserSettingsUpdate,
  type PasswordChange,
} from '@/schemas/user';
import { logger } from '@/utils/logger';

/**
 * Validation error type
 */
export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  validationErrors?: ValidationError[];
}

/**
 * Standardized error message formatter
 */
const formatValidationError = (issue: z.ZodIssue): ValidationError => {
  const field = Array.isArray(issue.path) && issue.path.length > 0 ? issue.path.join('.') : undefined;
  const message = issue.message || 'Validation error';
  
  return {
    field,
    message,
    code: issue.code,
  };
};

/**
 * Generic validation function with standardized error format
 */
const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> => {
  try {
    // Add debug logging
    logger.info('Validating data', { 
      dataType: typeof data,
      dataKeys: data && typeof data === 'object' ? Object.keys(data) : 'not an object',
      data: data && typeof data === 'object' ? JSON.stringify(data) : data
    });
    
    const result = schema.parse(data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // Log the full error for debugging
    logger.error('Validation error caught', { 
      error,
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      hasErrors: error && 'errors' in error,
      errorsType: error && 'errors' in error ? typeof error.errors : 'no errors property',
      // Add more detailed error info for ZodError
      zodErrorDetails: error instanceof z.ZodError ? {
        issues: error.issues,
        formErrors: error.formErrors,
        message: error.message
      } : 'not a ZodError'
    });
    
    if (error instanceof z.ZodError) {
      // Process validation issues with standardized format
      let errors: string[] = ['Validation error occurred'];
      let validationErrors: ValidationError[] = [];
      
      try {
        if (error.issues && Array.isArray(error.issues)) {
          validationErrors = error.issues.map(formatValidationError);
          
          // Create simple error messages for backward compatibility
          errors = error.issues.map(issue => issue.message || 'Validation error');
        }
      } catch (mappingError) {
        logger.error('Error processing validation issues', mappingError);
        errors = ['Error processing validation details'];
        validationErrors = [{
          message: 'Error processing validation details',
          code: 'processing_error'
        }];
      }
      
      logger.warn('Validation failed', { 
        errors, 
        validationErrors,
        data: typeof data === 'object' ? JSON.stringify(data) : data,
        errorDetails: error.message 
      });
      
      return {
        success: false,
        errors,
        validationErrors,
      };
    }
    
    // Handle other types of errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    logger.error('Unexpected validation error', { error: errorMessage, data });
    
    return {
      success: false,
      errors: [errorMessage],
      validationErrors: [{
        message: errorMessage,
        code: 'unknown_error'
      }],
    };
  }
};

/**
 * Validate user data
 */
export const validateUser = (data: unknown): ValidationResult<User> => {
  return validateData(UserSchema, data);
};

/**
 * Validate user registration data
 */
export const validateUserRegistration = (data: unknown): ValidationResult<UserRegistration> => {
  try {
    return validateData(UserRegistrationSchema, data);
  } catch (error) {
    logger.error('Critical error in validateUserRegistration', error);
    return {
      success: false,
      errors: ['Registration validation failed. Please check your input and try again.'],
    };
  }
};

/**
 * Validate user login data
 */
export const validateUserLogin = (data: unknown): ValidationResult<UserLogin> => {
  return validateData(UserLoginSchema, data);
};

/**
 * Validate user profile update data
 */
export const validateUserProfileUpdate = (data: unknown): ValidationResult<UserProfileUpdate> => {
  return validateData(UserProfileUpdateSchema, data);
};

/**
 * Validate user settings update data
 */
export const validateUserSettingsUpdate = (data: unknown): ValidationResult<UserSettingsUpdate> => {
  return validateData(UserSettingsUpdateSchema, data);
};

/**
 * Validate password change data
 */
export const validatePasswordChange = (data: unknown): ValidationResult<PasswordChange> => {
  return validateData(PasswordChangeSchema, data);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  try {
    z.string().email().parse(email);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate username format
 */
export const isValidUsername = (username: string): boolean => {
  try {
    z.string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_-]+$/)
      .parse(username);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate password strength
 */
export const isStrongPassword = (password: string): boolean => {
  try {
    z.string()
      .min(8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .parse(password);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get password strength score (0-4)
 */
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }
  
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain lowercase letters');
  }
  
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain uppercase letters');
  }
  
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain numbers');
  }
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
    if (score === 5) score = 4; // Cap at 4
  } else if (score === 4) {
    feedback.push('Consider adding special characters for extra security');
  }
  
  return { score, feedback };
};

/**
 * Sanitize user input
 */
export const sanitizeUserInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Validate and sanitize display name
 */
export const validateDisplayName = (displayName: string): ValidationResult<string> => {
  const sanitized = sanitizeUserInput(displayName);
  
  if (sanitized.length === 0) {
    const errorMessage = 'Display name cannot be empty';
    return {
      success: false,
      errors: [errorMessage],
      validationErrors: [{
        field: 'display_name',
        message: errorMessage,
        code: 'required'
      }],
    };
  }
  
  if (sanitized.length > 50) {
    const errorMessage = 'Display name is too long (max 50 characters)';
    return {
      success: false,
      errors: [errorMessage],
      validationErrors: [{
        field: 'display_name',
        message: errorMessage,
        code: 'too_long'
      }],
    };
  }
  
  return {
    success: true,
    data: sanitized,
  };
};

/**
 * Validate and sanitize bio
 */
export const validateBio = (bio: string): ValidationResult<string> => {
  const sanitized = sanitizeUserInput(bio);
  
  if (sanitized.length > 500) {
    const errorMessage = 'Bio is too long (max 500 characters)';
    return {
      success: false,
      errors: [errorMessage],
      validationErrors: [{
        field: 'bio',
        message: errorMessage,
        code: 'too_long'
      }],
    };
  }
  
  return {
    success: true,
    data: sanitized,
  };
};

/**
 * Check if username is available (mock implementation)
 */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  // In a real app, this would check against the database
  // For now, we'll simulate some taken usernames
  const takenUsernames = ['admin', 'test', 'user', 'guest', 'trainer'];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return !takenUsernames.includes(username.toLowerCase());
};

/**
 * Check if email is available (mock implementation)
 */
export const isEmailAvailable = async (email: string): Promise<boolean> => {
  // In a real app, this would check against the database
  // For now, we'll simulate some taken emails
  const takenEmails = ['admin@example.com', 'test@example.com'];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return !takenEmails.includes(email.toLowerCase());
};

/**
 * Validate user age (if birth date is provided)
 */
export const validateAge = (birthDate: Date): ValidationResult<number> => {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ? age - 1
    : age;
  
  if (actualAge < 13) {
    const errorMessage = 'Users must be at least 13 years old';
    return {
      success: false,
      errors: [errorMessage],
      validationErrors: [{
        field: 'birth_date',
        message: errorMessage,
        code: 'too_young'
      }],
    };
  }
  
  if (actualAge > 120) {
    const errorMessage = 'Please enter a valid birth date';
    return {
      success: false,
      errors: [errorMessage],
      validationErrors: [{
        field: 'birth_date',
        message: errorMessage,
        code: 'invalid_date'
      }],
    };
  }
  
  return {
    success: true,
    data: actualAge,
  };
};

/**
 * Validate height (in cm or inches based on units)
 */
export const validateHeight = (height: number, units: 'metric' | 'imperial'): ValidationResult<number> => {
  const minHeight = units === 'metric' ? 100 : 39; // 100cm or 39 inches
  const maxHeight = units === 'metric' ? 250 : 98; // 250cm or 98 inches
  
  if (height < minHeight || height > maxHeight) {
    const unit = units === 'metric' ? 'cm' : 'inches';
    const errorMessage = `Height must be between ${minHeight} and ${maxHeight} ${unit}`;
    return {
      success: false,
      errors: [errorMessage],
      validationErrors: [{
        field: 'height',
        message: errorMessage,
        code: 'out_of_range'
      }],
    };
  }
  
  return {
    success: true,
    data: height,
  };
};

/**
 * Validate weight (in kg or lbs based on units)
 */
export const validateWeight = (weight: number, units: 'metric' | 'imperial'): ValidationResult<number> => {
  const minWeight = units === 'metric' ? 30 : 66; // 30kg or 66 lbs
  const maxWeight = units === 'metric' ? 300 : 661; // 300kg or 661 lbs
  
  if (weight < minWeight || weight > maxWeight) {
    const unit = units === 'metric' ? 'kg' : 'lbs';
    const errorMessage = `Weight must be between ${minWeight} and ${maxWeight} ${unit}`;
    return {
      success: false,
      errors: [errorMessage],
      validationErrors: [{
        field: 'weight',
        message: errorMessage,
        code: 'out_of_range'
      }],
    };
  }
  
  return {
    success: true,
    data: weight,
  };
};