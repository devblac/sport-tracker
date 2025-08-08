# Module Resolution Fix

## Issue
The app was showing this error:
```
userRoles.ts:1 Uncaught SyntaxError: The requested module '/src/schemas/user.ts' does not provide an export named 'UserRole' (at userRoles.ts:1:10)
```

## Root Cause
There were two issues with module imports:

1. **Incomplete import in types/index.ts**: The file was importing `Gamification` from `@/schemas` instead of `@/schemas/user`
2. **Potential alias resolution issue**: The `userRoles.ts` file was using the `@/` alias which might not resolve properly in some cases

## Fixes Applied

### 1. Fixed incomplete import in types/index.ts
**Before:**
```typescript
import type { Gamification } from '@/schemas';
```

**After:**
```typescript
import type { Gamification } from '@/schemas/user';
```

### 2. Changed alias import to relative import in userRoles.ts
**Before:**
```typescript
import { UserRole } from '@/schemas/user';
```

**After:**
```typescript
import { UserRole } from '../schemas/user';
```

## Why This Happened
This issue occurred when we switched from the previous development server to Vite. Vite has stricter module resolution and doesn't tolerate incomplete import paths or certain alias resolution issues that might have been overlooked before.

## Verification
The app should now load without the module resolution error. The `UserRole` type is properly exported from `src/schemas/user.ts` and should be accessible to all importing files.

## Development Server Change
The project is now using **Vite** instead of the previous development server:
- **Previous**: Likely Create React App or similar (port 3000)
- **Current**: Vite (port 5173)
- **Benefits**: Faster hot reload, better build performance, modern tooling

This change provides better development experience and faster builds, but requires stricter adherence to ES module standards.