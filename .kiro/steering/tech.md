# Technology Stack (MVP Refactor)

## Frontend Framework
- **React Native** with Expo SDK 51+
- **TypeScript** (strict mode, no `any` types)
- **React Native Web** for web browser compatibility
- **Expo Router** for file-based navigation

## Backend
- **Supabase** for everything:
  - Auth (email/password, JWT tokens)
  - Postgres database with Row Level Security (RLS)
  - Storage (for future avatar uploads)
  - Edge Functions (TypeScript/Deno for complex logic)

## State Management
- **React hooks** + **Context API** (no Redux/Zustand)
- Direct Supabase client calls in hooks
- No complex state management libraries

## Local Storage
- **Expo SQLite** for structured offline data (workouts only)
- **AsyncStorage** for simple UI state (theme, flags)
- **Expo SecureStore** for tokens (access token, refresh token)

## Styling
- **React Native StyleSheet** (native performance)
- **React Native Paper** OR **NativeBase** for basic UI components
- No Tailwind CSS (not compatible with React Native)

## Development Tools
- **ESLint** + **Prettier** for code formatting
- **Jest** with React Native preset for unit testing
- **Expo EAS Build** for cloud builds
- **Expo EAS Submit** for app store submission

## Common Commands

### Development
```bash
npx expo start           # Start Expo dev server
npx expo start --web     # Run on web
npx expo start --android # Run on Android
npx expo start --ios     # Run on iOS (Mac only)
```

### Building
```bash
eas build --platform android --profile preview  # Build APK
eas build --platform android --profile production # Build AAB
npx expo export:web      # Build web version
```

### Testing
```bash
npm test                 # Run unit tests
npm test -- --coverage   # Coverage report
```

## Code Organization
- Flat structure with minimal nesting
- File-based routing with Expo Router
- Direct Supabase calls (no wrapper services)
- Prefer fewer files over perfect separation

## Key Principles
- **Less code is better**: 215K → 38K lines (82% reduction)
- **No over-engineering**: Remove abstractions, service containers, repositories
- **Security first**: RLS on all tables, tokens in SecureStore
- **Free tier optimized**: Supabase free tier (1M reads/month, 500MB DB)
- **Easy to test**: Simple code, clear data flow, minimal mocking