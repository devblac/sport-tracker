# Project Structure & Organization (MVP Refactor)

## Expo Project Structure

```
liftfire-expo/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (auth)/
│   │   ├── login.tsx            # Login screen
│   │   └── signup.tsx           # Signup screen
│   ├── (tabs)/                  # Main app tabs
│   │   ├── index.tsx            # Home/Dashboard
│   │   ├── workouts.tsx         # Workout list
│   │   ├── social.tsx           # Friends activity feed
│   │   └── profile.tsx          # User profile
│   ├── workout/
│   │   ├── [id].tsx             # Workout detail
│   │   └── new.tsx              # Create workout
│   └── _layout.tsx              # Root layout with auth guard
├── components/                   # Reusable UI components
│   ├── WorkoutCard.tsx
│   ├── FriendWorkoutItem.tsx
│   ├── LeaderboardList.tsx
│   ├── AchievementBadge.tsx
│   ├── XPBar.tsx
│   └── StatsCard.tsx
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts               # Authentication
│   ├── useWorkouts.ts           # Workout CRUD
│   ├── useSocial.ts             # Social features
│   ├── useGamification.ts       # XP, levels, streaks
│   └── useOfflineSync.ts        # Offline sync queue
├── lib/                          # Core utilities
│   ├── supabase.ts              # Supabase client setup
│   ├── database.ts              # SQLite setup
│   ├── offlineSync.ts           # Sync queue logic
│   ├── secureStorage.ts         # SecureStore helpers
│   └── gamification.ts          # XP calculation
├── types/
│   └── index.ts                 # TypeScript types
├── .env.example                 # Environment variables template
├── app.json                     # Expo configuration
├── eas.json                     # EAS Build configuration
├── package.json
└── tsconfig.json
```

## Key Conventions

### File Organization
- **Flat structure**: Prefer fewer files over deep nesting
- **Co-location**: Keep related code together
- **No barrel exports**: Direct imports for clarity

### File Naming
- **PascalCase** for React components (`WorkoutCard.tsx`)
- **camelCase** for hooks, utilities, and libraries (`useAuth.ts`, `gamification.ts`)
- **kebab-case** for config files (`app.json`, `eas.json`)

### Import Patterns
- No path aliases (Expo handles this)
- Relative imports for local files
- Direct imports (no index.ts barrel files)

### State Management
- **React hooks** + **Context API** only
- No Zustand, Redux, or other state libraries
- Direct Supabase calls in hooks

### Testing Structure
- `__tests__/` folders next to tested files
- Test utilities in `lib/` directory
- Mock Supabase responses for unit tests

## Configuration Files
- **app.json**: Expo app configuration
- **eas.json**: Build profiles (preview, production)
- **.env**: Environment variables (not committed)
- **.env.example**: Environment variables template
- **tsconfig.json**: TypeScript configuration

## Development Patterns
- **Offline-first for workouts**: SQLite storage with sync queue
- **Online-only for social**: No offline caching for social data
- **Mobile-first**: React Native components, web via React Native Web
- **Performance-focused**: FlatList for lists, lazy loading, code splitting
- **Type-safe**: TypeScript strict mode, Zod validation
- **Security-first**: RLS on all tables, tokens in SecureStore

## What We Removed
❌ Complex folder hierarchies (`src/services/`, `src/repositories/`)
❌ Barrel exports (`index.ts` files)
❌ Path aliases (`@/` imports)
❌ Multiple service implementations
❌ Service containers and registries
❌ Test pages and example components
❌ PWA/Vite configuration

## Simplification Principles
✅ **Fewer files**: ~150 files (vs ~700 in old codebase)
✅ **Flat structure**: Max 2-3 levels deep
✅ **Direct imports**: No abstraction layers
✅ **Clear naming**: Descriptive, no abbreviations
✅ **Co-located tests**: Tests next to source files