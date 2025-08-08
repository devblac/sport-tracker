# Comprehensive Import Fix Strategy

## Root Cause
Vite is stricter about ES module re-exports than CRA was. The issue is with files that import from:
1. `@/types` (main index) - re-exports from schemas
2. `@/stores` (main index) - re-exports types
3. Any other barrel exports that re-export types

## Strategy
Instead of fixing one by one, let's:
1. Identify all problematic re-export barrels
2. Update imports to go directly to source files
3. Keep the barrel exports for backward compatibility but discourage their use

## Files to Fix
Based on the search, the main issues are:
- Imports from `@/types` (main index) that re-export from schemas
- Some imports from `@/stores` for types

## Solution
Update all imports to use direct imports from schema files instead of re-exports.