/**
 * Result pattern implementation for better error handling
 * Inspired by Rust's Result<T, E> type
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(public readonly value: T) {}

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Success(fn(this.value));
  }

  mapError<F>(_fn: (error: never) => F): Result<T, F> {
    return this as any;
  }

  flatMap<U, F>(fn: (value: T) => Result<U, F>): Result<U, F> {
    return fn(this.value);
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  unwrapOrElse(_fn: (error: never) => T): T {
    return this.value;
  }
}

export class Failure<E> {
  readonly isSuccess = false;
  readonly isFailure = true;

  constructor(public readonly error: E) {}

  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as any;
  }

  mapError<F>(fn: (error: E) => F): Result<never, F> {
    return new Failure(fn(this.error));
  }

  flatMap<U, F>(_fn: (value: never) => Result<U, F>): Result<U, E | F> {
    return this as any;
  }

  unwrap(): never {
    throw this.error;
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }

  unwrapOrElse<T>(fn: (error: E) => T): T {
    return fn(this.error);
  }
}

// Factory functions
export const success = <T>(value: T): Success<T> => new Success(value);
export const failure = <E>(error: E): Failure<E> => new Failure(error);

// Utility functions
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> => result.isSuccess;
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> => result.isFailure;

/**
 * Wrap a function that might throw into a Result
 */
export const tryCatch = <T, E = Error>(
  fn: () => T,
  errorHandler?: (error: unknown) => E
): Result<T, E> => {
  try {
    return success(fn());
  } catch (error) {
    const handledError = errorHandler ? errorHandler(error) : (error as E);
    return failure(handledError);
  }
};

/**
 * Wrap an async function that might throw into a Result
 */
export const tryCatchAsync = async <T, E = Error>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => E
): Promise<Result<T, E>> => {
  try {
    const value = await fn();
    return success(value);
  } catch (error) {
    const handledError = errorHandler ? errorHandler(error) : (error as E);
    return failure(handledError);
  }
};

/**
 * Combine multiple Results into a single Result
 * If all are successful, returns Success with array of values
 * If any fail, returns the first Failure
 */
export const combine = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  
  for (const result of results) {
    if (result.isFailure) {
      return result as any;
    }
    values.push(result.value);
  }
  
  return success(values);
};

/**
 * Transform a Result with an async function
 */
export const mapAsync = async <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<U>
): Promise<Result<U, E>> => {
  if (result.isFailure) {
    return result as any;
  }
  
  try {
    const value = await fn(result.value);
    return success(value);
  } catch (error) {
    return failure(error as E);
  }
};

/**
 * Custom error types for better error handling
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly url?: string
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation?: string,
    public readonly table?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public readonly requiredRole?: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Example usage in a service:
/*
export class ExerciseService {
  async getExercise(id: string): Promise<Result<Exercise, DatabaseError | ValidationError>> {
    if (!id) {
      return failure(new ValidationError('Exercise ID is required', 'id'));
    }

    return tryCatchAsync(
      async () => {
        const exercise = await this.repository.findById(id);
        if (!exercise) {
          throw new Error('Exercise not found');
        }
        return exercise;
      },
      (error) => new DatabaseError(error.message, 'findById', 'exercises')
    );
  }
}
*/