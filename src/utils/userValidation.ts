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
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Generic validation function
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
      // Safely handle the issues array (ZodError uses 'issues', not 'errors')
      let errors: string[] = ['Validation error occurred'];
      
      try {
        if (error.issues && Array.isArray(error.issues)) {
          errors = error.issues.map(issue => {
            const path = Array.isArray(issue.path) ? issue.path.join('.') : '';
            const message = issue.message || 'Validation error';
            return path ? `${path}: ${message}` : message;
          });
        }
      } catch (mappingError) {
        logger.error('Error processing validation issues', mappingError);
        errors = ['Error processing validation details'];
      }
      
      logger.warn('Validation failed', { 
        errors, 
        data: typeof data === 'object' ? JSON.stringify(data) : data,
        errorDetails: error.message 
      });
      
      return {
        success: false,
        errors,
      };
    }
    
    // Handle other types of errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    logger.error('Unexpected validation error', { error: errorMessage, data });
    
    return {
      success: false,
      errors: [errorMessage],
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
    return {
      success: false,
      errors: ['Display name cannot be empty'],
    };
  }
  
  if (sanitized.length > 50) {
    return {
      success: false,
      errors: ['Display name is too long (max 50 characters)'],
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
    return {
      success: false,
      errors: ['Bio is too long (max 500 characters)'],
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
    return {
      success: false,
      errors: ['Users must be at least 13 years old'],
    };
  }
  
  if (actualAge > 120) {
    return {
      success: false,
      errors: ['Please enter a valid birth date'],
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
    return {
      success: false,
      errors: [`Height must be between ${minHeight} and ${maxHeight} ${unit}`],
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
    return {
      success: false,
      errors: [`Weight must be between ${minWeight} and ${maxWeight} ${unit}`],
    };
  }
  
  return {
    success: true,
    data: weight,
  };
};