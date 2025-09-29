// Strategy Pattern for Validation - Better maintainability and extensibility

import { z } from 'zod';
import { ValidationResult, ValidationError } from './userValidation';

// Base validation strategy interface
interface ValidationStrategy<T> {
  validate(data: unknown): ValidationResult<T>;
  getSchema(): z.ZodSchema<T>;
}

// Abstract base class for common validation logic
abstract class BaseValidationStrategy<T> implements ValidationStrategy<T> {
  abstract getSchema(): z.ZodSchema<T>;

  validate(data: unknown): ValidationResult<T> {
    try {
      const result = this.getSchema().parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return this.handleZodError(error);
      }
      return this.handleUnknownError(error);
    }
  }

  private handleZodError(error: z.ZodError): ValidationResult<never> {
    const validationErrors: ValidationError[] = error.issues.map(issue => ({
      field: issue.path.join('.') || undefined,
      message: issue.message,
      code: issue.code,
    }));

    return {
      success: false,
      errors: error.issues.map(issue => issue.message),
      validationErrors,
    };
  }

  private handleUnknownError(error: unknown): ValidationResult<never> {
    const message = error instanceof Error ? error.message : 'Unknown validation error';
    return {
      success: false,
      errors: [message],
      validationErrors: [{ message, code: 'unknown_error' }],
    };
  }
}

// Concrete validation strategies
export class UserLoginValidationStrategy extends BaseValidationStrategy<{email: string; password: string}> {
  getSchema() {
    return z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required'),
    });
  }
}

export class UserRegistrationValidationStrategy extends BaseValidationStrategy<{
  email: string;
  username: string;
  password: string;
  display_name: string;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
}> {
  getSchema() {
    return z.object({
      email: z.string().email('Invalid email format'),
      username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be less than 30 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
      password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and numbers'),
      display_name: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
      fitness_level: z.enum(['beginner', 'intermediate', 'advanced'], {
        errorMap: () => ({ message: 'Invalid fitness level' })
      }),
    });
  }
}

// Validation context for managing strategies
export class ValidationContext {
  private strategies = new Map<string, ValidationStrategy<any>>();

  constructor() {
    this.registerDefaultStrategies();
  }

  private registerDefaultStrategies() {
    this.strategies.set('login', new UserLoginValidationStrategy());
    this.strategies.set('registration', new UserRegistrationValidationStrategy());
  }

  validate<T>(type: string, data: unknown): ValidationResult<T> {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`No validation strategy found for type: ${type}`);
    }
    return strategy.validate(data);
  }

  registerStrategy<T>(type: string, strategy: ValidationStrategy<T>) {
    this.strategies.set(type, strategy);
  }
}

// Usage example:
// const validator = new ValidationContext();
// const result = validator.validate('login', { email: 'test@example.com', password: 'password' });