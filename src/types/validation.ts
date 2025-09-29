// Enhanced type safety for validation system

import { z } from 'zod';

// Branded types for better type safety
export type Email = string & { readonly __brand: 'Email' };
export type Username = string & { readonly __brand: 'Username' };
export type Password = string & { readonly __brand: 'Password' };

// Type guards with runtime validation
export const isEmail = (value: string): value is Email => {
  return z.string().email().safeParse(value).success;
};

export const isUsername = (value: string): value is Username => {
  return z.string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .safeParse(value).success;
};

export const isPassword = (value: string): value is Password => {
  return z.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .safeParse(value).success;
};

// Validation result with discriminated unions
export type ValidationSuccess<T> = {
  readonly success: true;
  readonly data: T;
};

export type ValidationFailure = {
  readonly success: false;
  readonly errors: readonly string[];
  readonly validationErrors: readonly ValidationError[];
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// Enhanced validation error with more context
export interface ValidationError {
  readonly field?: string;
  readonly message: string;
  readonly code: string;
  readonly severity: 'error' | 'warning';
  readonly context?: Record<string, unknown>;
}

// Type-safe validation schema builder
export class TypeSafeValidationBuilder<T> {
  private schema: z.ZodSchema<T>;

  constructor(schema: z.ZodSchema<T>) {
    this.schema = schema;
  }

  validate(data: unknown): ValidationResult<T> {
    const result = this.schema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      } as const;
    }

    const validationErrors: ValidationError[] = result.error.issues.map(issue => ({
      field: issue.path.join('.') || undefined,
      message: issue.message,
      code: issue.code,
      severity: 'error' as const,
      context: { path: issue.path, received: issue.received }
    }));

    return {
      success: false,
      errors: result.error.issues.map(issue => issue.message),
      validationErrors
    } as const;
  }

  refine<U extends T>(
    refinement: (data: T) => data is U,
    message: string
  ): TypeSafeValidationBuilder<U> {
    return new TypeSafeValidationBuilder(
      this.schema.refine(refinement, { message })
    );
  }

  transform<U>(transformer: (data: T) => U): TypeSafeValidationBuilder<U> {
    return new TypeSafeValidationBuilder(
      this.schema.transform(transformer)
    );
  }
}

// Factory for creating type-safe validators
export const createValidator = <T>(schema: z.ZodSchema<T>) => 
  new TypeSafeValidationBuilder(schema);

// Utility types for better inference
export type InferValidationInput<T> = T extends TypeSafeValidationBuilder<infer U> ? U : never;
export type InferValidationResult<T> = T extends TypeSafeValidationBuilder<infer U> ? ValidationResult<U> : never;

// Example usage with enhanced type safety:
const userLoginValidator = createValidator(
  z.object({
    email: z.string().email().transform(value => value as Email),
    password: z.string().min(8).transform(value => value as Password)
  })
);

// Type is automatically inferred as ValidationResult<{ email: Email; password: Password }>
// const result = userLoginValidator.validate(someData);