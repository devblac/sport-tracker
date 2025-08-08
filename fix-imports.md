# Comprehensive Import Fix Strategy

## Root Cause
Vite has stricter ES module resolution than Create React App. Mixed imports (values and types together) can cause module resolution issues.

## Pattern to Fix
**Before (problematic):**
```typescript
import { syncQueue, SyncOperation } from '@/utils/syncQueue';
```

**After (Vite-compatible):**
```typescript
import { syncQueue } from '@/utils/syncQueue';
import type { SyncOperation } from '@/utils/syncQueue';
```

## Files That Need Fixing
Based on the comprehensive scan, these files have mixed imports that need separation:

1. ✅ `src/utils/syncManager.ts` - FIXED
2. ✅ `src/hooks/useSync.ts` - FIXED  
3. `src/components/ui/Toast.tsx` - FIXED
4. `src/utils/userRoles.ts` - FIXED
5. `src/types/index.ts` - FIXED

## Additional Files to Check
- Any file importing from stores with mixed value/type imports
- Files with wildcard exports that might cause issues
- Files importing from utils index with mixed imports

## Strategy
1. Separate type imports from value imports
2. Use explicit imports instead of wildcard exports where possible
3. Import types directly from source files when re-exports cause issues
4. Use relative imports when alias resolution fails

This approach ensures compatibility with Vite's stricter module system while maintaining functionality.