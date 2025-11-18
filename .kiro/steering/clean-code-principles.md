---
inclusion: always
---

# Clean Code & Simplicity Principles

## Core Philosophy

**Less code is better code.** Write the minimum amount of code needed to solve the problem. Every line of code is a liability that must be maintained, tested, and understood.

## Code Quality Standards

### File Size Limits
- **Maximum 500 lines per file** - If approaching this limit, refactor into smaller modules
- **Maximum 50 lines per function** - Break down complex functions into smaller, focused ones
- **Prefer inline logic** when it's clear and simple (< 5 lines)

### Simplicity First
- ❌ **No over-engineering** - Don't build for hypothetical future requirements
- ❌ **No unnecessary abstractions** - Only abstract when you have 3+ similar implementations
- ❌ **No premature optimization** - Make it work first, optimize only when needed
- ❌ **No "just in case" code** - Delete unused code immediately
- ✅ **Direct implementations** - Call APIs/databases directly, no wrapper layers
- ✅ **Inline when clear** - Don't extract functions just to extract them
- ✅ **Flat structure** - Avoid deep folder hierarchies (max 3 levels)

### Documentation Philosophy
- ❌ **No excessive markdown files** - Don't create docs for every small feature
- ❌ **No redundant comments** - Code should be self-explanatory
- ✅ **Comment the "why"** not the "what" - Only explain non-obvious decisions
- ✅ **Update README** only when setup/architecture changes significantly
- ✅ **Inline comments** for complex logic explaining reasoning

## Architecture Patterns

### What to Avoid
```
❌ Service containers and dependency injection
❌ Repository pattern (unless 3+ data sources)
❌ Factory pattern (unless 5+ similar objects)
❌ Multiple service implementations (Mock vs Real)
❌ Complex caching layers
❌ Event buses and pub/sub (unless truly needed)
❌ Middleware chains (unless framework requires)
❌ Barrel exports (index.ts files)
❌ Path aliases (@/ imports)
```

### What to Prefer
```
✅ Direct function calls
✅ Simple imports (relative paths)
✅ Inline logic when < 5 lines
✅ Pure functions when possible
✅ Composition over inheritance
✅ Explicit over implicit
✅ Fewer files over perfect separation
```

## Database & API Patterns

### Idempotency
- **All data operations must be idempotent** - Safe to retry without side effects
- **Use upsert operations** - INSERT ... ON CONFLICT UPDATE
- **Check before create** - Prevent duplicate records
- **Use unique constraints** - Let database enforce uniqueness
- **Transaction safety** - Wrap related operations in transactions

### Direct Database Access
```typescript
// ❌ DON'T: Unnecessary abstraction
class UserRepository {
  async findById(id: string) {
    return await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}

// ✅ DO: Direct access
const user = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

### Query Optimization
- **Filter at source** - Use WHERE clauses, not array.filter()
- **Limit results** - Always use LIMIT/pagination
- **Select only needed fields** - Don't SELECT *
- **Use indexes** - Add indexes for frequently queried fields
- **Avoid N+1 queries** - Use joins or batch queries

## Code Style

### Naming Conventions
- **Be descriptive** - `getUserById` not `get`
- **No abbreviations** - `user` not `usr`, `message` not `msg`
- **Consistent casing** - camelCase for variables/functions, PascalCase for classes/components
- **Boolean prefixes** - `isActive`, `hasPermission`, `canEdit`

### Function Design
```typescript
// ❌ DON'T: Too many parameters
function createUser(name, email, age, role, status, preferences, settings) { }

// ✅ DO: Use object parameter
function createUser({ name, email, age, role, status, preferences, settings }) { }

// ❌ DON'T: Nested logic
function processOrder(order) {
  if (order.status === 'pending') {
    if (order.items.length > 0) {
      if (order.user.verified) {
        // ... 20 more lines
      }
    }
  }
}

// ✅ DO: Early returns
function processOrder(order) {
  if (order.status !== 'pending') return;
  if (order.items.length === 0) return;
  if (!order.user.verified) return;
  
  // ... clear logic flow
}
```

### Error Handling
```typescript
// ❌ DON'T: Silent failures
try {
  await saveData(data);
} catch (e) {
  // ignore
}

// ✅ DO: Handle or propagate
try {
  await saveData(data);
} catch (error) {
  console.error('Failed to save data:', error);
  throw new Error('Data save failed');
}
```

## Testing Philosophy

### Test What Matters
- ✅ **Test business logic** - Core functionality and edge cases
- ✅ **Test integrations** - API calls, database operations
- ✅ **Test user flows** - Critical paths through the app
- ❌ **Don't test trivial code** - Getters, setters, simple mappers
- ❌ **Don't test framework code** - React hooks, library internals
- ❌ **Don't aim for 100% coverage** - Aim for 80% of critical code

### Test Structure
```typescript
// ✅ DO: Clear, focused tests
describe('createUser', () => {
  it('creates user with valid data', async () => {
    const user = await createUser({ name: 'John', email: 'john@example.com' });
    expect(user.id).toBeDefined();
  });

  it('throws error for duplicate email', async () => {
    await createUser({ name: 'John', email: 'john@example.com' });
    await expect(createUser({ name: 'Jane', email: 'john@example.com' }))
      .rejects.toThrow('Email already exists');
  });
});
```

## Performance Guidelines

### Optimization Rules
1. **Measure first** - Don't optimize without profiling
2. **Optimize bottlenecks** - Focus on the slowest 20%
3. **Use appropriate data structures** - Map for lookups, Set for uniqueness
4. **Lazy load** - Load data only when needed
5. **Cache wisely** - Cache expensive operations, not everything

### Common Patterns
```typescript
// ❌ DON'T: Inefficient loops
const userIds = users.map(u => u.id);
const activeUsers = users.filter(u => u.active);
const userNames = users.map(u => u.name);

// ✅ DO: Single pass
const { userIds, activeUsers, userNames } = users.reduce((acc, user) => {
  acc.userIds.push(user.id);
  if (user.active) acc.activeUsers.push(user);
  acc.userNames.push(user.name);
  return acc;
}, { userIds: [], activeUsers: [], userNames: [] });
```

## Security Best Practices

### Input Validation
- **Validate all inputs** - Use schema validation (Zod, Yup)
- **Sanitize user data** - Remove HTML, SQL injection attempts
- **Whitelist, don't blacklist** - Define what's allowed, not what's forbidden
- **Fail securely** - Default to deny, not allow

### Data Protection
- **Never log sensitive data** - Passwords, tokens, PII
- **Use environment variables** - Never hardcode secrets
- **Encrypt at rest** - Sensitive data in database
- **Use HTTPS only** - All API communications
- **Implement rate limiting** - Prevent abuse

## Refactoring Checklist

Before writing code, ask:
1. ☑️ Is this the simplest solution?
2. ☑️ Can I write this in fewer lines?
3. ☑️ Am I adding unnecessary abstraction?
4. ☑️ Will this be easy to test?
5. ☑️ Is this code self-explanatory?
6. ☑️ Am I following existing patterns?
7. ☑️ Does this file stay under 500 lines?

## Code Review Standards

### What to Look For
- **Unnecessary complexity** - Can it be simpler?
- **Missing error handling** - What if this fails?
- **Performance issues** - N+1 queries, inefficient loops
- **Security vulnerabilities** - SQL injection, XSS
- **Inconsistent patterns** - Does it match the codebase?
- **Missing tests** - Is critical logic tested?
- **Poor naming** - Are variables/functions clear?

### Red Flags
- 🚩 Files over 500 lines
- 🚩 Functions over 50 lines
- 🚩 Nested logic > 3 levels deep
- 🚩 Duplicate code (DRY violation)
- 🚩 Magic numbers/strings
- 🚩 Commented-out code
- 🚩 TODO comments older than 1 week

## Human-Like Code

### Write Code That Reads Like Prose
```typescript
// ❌ DON'T: Cryptic
const u = await db.q('SELECT * FROM u WHERE id = ?', [id]);
if (u && u.s === 'a') { /* ... */ }

// ✅ DO: Clear and readable
const user = await database.query('SELECT * FROM users WHERE id = ?', [id]);
if (user && user.status === 'active') { /* ... */ }
```

### Professional but Natural
- Use **clear variable names** that explain themselves
- Write **straightforward logic** without clever tricks
- Add **helpful comments** for complex business rules
- Structure code **logically** with clear flow
- Use **consistent formatting** throughout

## Summary

**The goal is to write code that:**
- ✅ Solves the problem with minimum complexity
- ✅ Is easy to understand and maintain
- ✅ Performs well without premature optimization
- ✅ Is secure by default
- ✅ Can be tested easily
- ✅ Looks like it was written by a thoughtful human, not generated

**Remember:** Every line of code is a liability. Write less, achieve more.
