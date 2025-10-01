# Test Factory System

This directory contains a comprehensive test factory system for generating consistent, valid test data across all test suites in the Sport Tracker PWA.

## Overview

The test factory system provides:

- **Consistent Data Generation**: All factories generate data that matches production schemas
- **Edge Case Testing**: Specialized factories for boundary conditions and error scenarios
- **Schema Validation**: Automatic validation against Zod schemas
- **Performance Testing**: Factories for large datasets and memory-intensive scenarios
- **Accessibility Testing**: Data for testing accessibility features

## Factory Types

### 1. Core Factories (`test-factories.ts`)

Main factories for generating realistic test data:

- `UserFactory` - Creates users with different roles and experience levels
- `ExerciseFactory` - Creates exercises with various types and difficulties
- `WorkoutFactory` - Creates workouts in different states (planned, in-progress, completed)
- `SetFactory` - Creates workout sets with different types and configurations
- `SocialFactory` - Creates social posts, friends, and comments
- `AchievementFactory` - Creates achievements with different rarities and requirements

#### Usage Examples

```typescript
import { UserFactory, WorkoutFactory, BatchFactories } from '@/test/test-factories';

// Create a single user
const user = UserFactory.create();

// Create a premium user
const premiumUser = UserFactory.createPremium();

// Create a workout for a specific user
const workout = WorkoutFactory.create({ user_id: user.id });

// Create multiple users
const users = BatchFactories.users(10);

// Create a complete scenario
const scenario = ScenarioFactories.completeWorkoutFlow();
```

### 2. Edge Case Factories (`edge-case-factories.ts`)

Specialized factories for testing edge cases and boundary conditions:

- `BoundaryFactories` - Data at minimum/maximum valid values
- `ErrorScenarioFactories` - Invalid data for testing error handling
- `PerformanceTestFactories` - Large datasets for performance testing
- `ConcurrencyTestFactories` - Data for testing concurrent operations
- `AccessibilityTestFactories` - Data for accessibility testing

#### Usage Examples

```typescript
import { BoundaryFactories, ErrorScenarioFactories } from '@/test/edge-case-factories';

// Create minimal valid user
const minUser = BoundaryFactories.users.minimal();

// Create invalid data for error testing
const invalidUser = ErrorScenarioFactories.invalidData.invalidEmail();

// Create large dataset for performance testing
const manyUsers = PerformanceTestFactories.largeDatasets.manyUsers(1000);
```

### 3. Schema Validation Factories (`schema-validation-factories.ts`)

Factories that guarantee schema compliance:

- `ValidatedUserFactory` - Schema-compliant user generation
- `ValidatedExerciseFactory` - Schema-compliant exercise generation
- `ValidatedWorkoutFactory` - Schema-compliant workout generation
- `ValidatedSetFactory` - Schema-compliant set generation

#### Usage Examples

```typescript
import { ValidatedFactories, SchemaValidator } from '@/test/schema-validation-factories';

// Create guaranteed valid user
const user = ValidatedFactories.User.create();

// Create registration data
const registration = ValidatedFactories.User.createRegistration();

// Validate any data against schema
const result = SchemaValidator.validate(UserSchema, userData);
```

## Test Utilities (`test-utils.tsx`)

Additional utilities for testing React components:

- Custom render function with providers
- Mock data generators
- Test helpers for async operations
- Accessibility testing helpers
- Performance measurement utilities

#### Usage Examples

```typescript
import { render, testHelpers, a11yHelpers } from '@/test/test-utils';

// Render component with providers
render(<MyComponent />, { withWorkout: true, withGamification: true });

// Simulate user typing
await testHelpers.simulateTyping(inputElement, 'test text');

// Check accessibility
const isAccessible = a11yHelpers.isKeyboardAccessible(element);
```

## Fixtures (`fixtures/index.ts`)

Predefined test data for consistent testing scenarios:

- User fixtures (new, experienced, premium users)
- Exercise fixtures (common exercises with full data)
- Workout fixtures (empty, template, completed workouts)
- Achievement fixtures (different rarities and categories)

## Best Practices

### 1. Use Appropriate Factory Type

- Use **core factories** for general testing
- Use **edge case factories** for boundary testing
- Use **validated factories** when schema compliance is critical
- Use **fixtures** for consistent, predefined scenarios

### 2. Override Defaults When Needed

```typescript
// Good: Override specific fields
const user = UserFactory.create({
  role: 'premium',
  profile: { fitness_level: 'expert' }
});

// Avoid: Creating completely custom objects
const user = { id: '1', name: 'Test' }; // Missing required fields
```

### 3. Use Batch Factories for Multiple Items

```typescript
// Good: Use batch factories
const users = BatchFactories.users(10);

// Avoid: Manual loops
const users = Array.from({ length: 10 }, () => UserFactory.create());
```

### 4. Test Edge Cases

```typescript
describe('User validation', () => {
  it('should handle minimal valid user', () => {
    const user = BoundaryFactories.users.minimal();
    expect(validateUser(user)).toBe(true);
  });

  it('should reject invalid email', () => {
    const user = ErrorScenarioFactories.invalidData.invalidEmail();
    expect(validateUser(user)).toBe(false);
  });
});
```

### 5. Use Scenarios for Complex Tests

```typescript
describe('Workout flow', () => {
  it('should complete workout successfully', () => {
    const { user, exercises, workout } = ScenarioFactories.completeWorkoutFlow();
    
    // Test the complete flow with related data
    expect(workout.user_id).toBe(user.id);
    expect(workout.exercises.length).toBeGreaterThan(0);
  });
});
```

## Performance Considerations

- Factories are optimized for test execution speed
- Large datasets should use `PerformanceTestFactories`
- Memory-intensive tests should clean up after execution
- Use `testHelpers.measurePerformance()` to monitor test performance

## Schema Compliance

All factories generate data that passes Zod schema validation:

- Core factories generate realistic data that should pass validation
- Validated factories guarantee schema compliance
- Edge case factories include both valid and invalid data for comprehensive testing

## Maintenance

When adding new features:

1. Update relevant factories with new fields
2. Add new validation cases for schema changes
3. Create edge cases for new boundary conditions
4. Update fixtures with new realistic scenarios
5. Add performance test cases for new large data structures

## Testing the Factories

Run the factory tests to ensure all factories work correctly:

```bash
npm test src/test/__tests__/factories/test-factories.test.ts
```

This comprehensive test suite validates:
- All factories generate valid data
- Schema compliance is maintained
- Edge cases work correctly
- Performance is acceptable
- Consistency is maintained across factory calls