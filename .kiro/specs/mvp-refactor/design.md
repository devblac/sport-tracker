# Design Document

## Overview

This design document outlines the architecture for refactoring LiftFire from a 215K-line React PWA into a lean 30-40K-line React Native Expo application. The design prioritizes simplicity, minimal code, and direct Supabase integration while supporting Web, Android, and iOS platforms.

### Design Principles

1. **Less Code is Better**: Prefer inline logic over abstractions, fewer files over perfect separation
2. **Direct Supabase Integration**: Use Supabase client directly in components/hooks, no wrapper services
3. **Security via RLS**: All data security enforced by Supabase Row Level Security policies
4. **Offline-First**: Local storage with background sync, works without connectivity
5. **Cross-Platform**: Single codebase for Web + Android + iOS using React Native Web

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Expo Application                        │
│  (React Native + TypeScript + React Native Web)         │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │   Screens  │  │   Hooks    │  │ Components │       │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘       │
│        │                │                │              │
│        └────────────────┴────────────────┘              │
│                         │                               │
│              ┌──────────▼──────────┐                    │
│              │  Supabase Client    │                    │
│              │  (Direct Calls)     │                    │
│              └──────────┬──────────┘                    │
│                         │                               │
│              ┌──────────▼──────────┐                    │
│              │  Local Storage      │                    │
│              │  (AsyncStorage/     │                    │
│              │   SQLite)           │                    │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
                         │
                         │ HTTPS + JWT
                         │
┌────────────────────────▼─────────────────────────────────┐
│                    Supabase Backend                       │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   Auth   │  │ Postgres │  │ Storage  │  │  Edge   │ │
│  │          │  │   + RLS  │  │          │  │Functions│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└───────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend (Expo Application)**
- React Native 0.74+ with Expo SDK 51+
- TypeScript for type safety
- React Native Web for web compatibility
- Expo Router for navigation
- AsyncStorage for simple key-value storage
- Expo SQLite for structured offline data
- Supabase JS client for backend communication

**Backend (Supabase)**
- Supabase Auth for authentication
- PostgreSQL with Row Level Security
- Supabase Storage for profile images
- Edge Functions (TypeScript/Deno) for complex logic
- Real-time subscriptions for live updates


## Components and Interfaces

### Project Structure

```
liftfire-expo/
├── app/                          # Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── index.tsx            # Home/Dashboard
│   │   ├── workouts.tsx         # Workout list
│   │   ├── social.tsx           # Social feed
│   │   └── profile.tsx          # User profile
│   ├── workout/
│   │   ├── [id].tsx             # Workout detail
│   │   └── new.tsx              # Create workout
│   └── _layout.tsx              # Root layout
├── components/
│   ├── WorkoutCard.tsx
│   ├── SocialFeedItem.tsx
│   ├── LeaderboardList.tsx
│   ├── AchievementBadge.tsx
│   └── StatsCard.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useWorkouts.ts
│   ├── useSocial.ts
│   ├── useGamification.ts
│   └── useOfflineSync.ts
├── lib/
│   ├── supabase.ts              # Supabase client setup
│   └── storage.ts               # Local storage helpers
├── types/
│   └── index.ts                 # TypeScript types
├── .env.example
├── app.json
├── package.json
└── tsconfig.json
```

### Key Components

**Authentication Components**
- `LoginScreen`: Email/password login form
- `SignupScreen`: User registration form
- Uses Supabase Auth directly, no custom backend

**Workout Components**
- `WorkoutCard`: Display workout summary (name, date, duration, XP earned)
- `WorkoutForm`: Create/edit workout (exercise selection, sets, reps, weight)
- `WorkoutList`: List of user's workouts with offline indicator

**Social Components**
- `SocialFeedItem`: Display friend's workout post with like button
- `FriendsList`: List of friends with status indicators
- `LeaderboardList`: Ranked list of users by XP

**Gamification Components**
- `XPBar`: Visual progress bar for current level
- `StreakDisplay`: Current streak count with fire icon
- `AchievementBadge`: Achievement icon with unlock status

### Core Hooks

**useAuth**
```typescript
// Direct Supabase Auth usage
const { user, signIn, signUp, signOut, loading } = useAuth();
```

**useWorkouts**
```typescript
// Fetch workouts with offline support
const { workouts, createWorkout, updateWorkout, deleteWorkout, syncing } = useWorkouts();
```

**useSocial**
```typescript
// Social features with real-time updates
const { feed, friends, sendFriendRequest, likePost } = useSocial();
```

**useGamification**
```typescript
// XP, levels, streaks, achievements
const { xp, level, streak, achievements } = useGamification();
```

**useOfflineSync**
```typescript
// Background sync management
const { queueOperation, syncNow, pendingCount } = useOfflineSync();
```


## Data Models

### Supabase Database Schema

**users table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
```

**workouts table**
```sql
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  duration_minutes INTEGER,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced BOOLEAN DEFAULT false
);

-- RLS Policies
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own workouts" ON workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts" ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON workouts FOR DELETE USING (auth.uid() = user_id);
```

**exercises table**
```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own exercises" ON exercises 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workouts 
      WHERE workouts.id = exercises.workout_id 
      AND workouts.user_id = auth.uid()
    )
  );
```

**friendships table**
```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- RLS Policies
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own friendships" ON friendships 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friendships" ON friendships 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update friendships" ON friendships 
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
```

**likes table**
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workout_id)
);

-- RLS Policies
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can create own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (auth.uid() = user_id);
```

**weekly_leaderboard materialized view**
```sql
CREATE MATERIALIZED VIEW weekly_leaderboard AS
SELECT 
  user_id,
  SUM(xp_earned) as xp_week,
  COUNT(*) as workouts_week
FROM workouts
WHERE completed_at >= date_trunc('week', NOW())
GROUP BY user_id
ORDER BY xp_week DESC;

-- Public view (anonymized)
CREATE VIEW weekly_leaderboard_public AS
SELECT 
  u.username,
  wl.xp_week,
  wl.workouts_week,
  ROW_NUMBER() OVER (ORDER BY wl.xp_week DESC) as rank
FROM weekly_leaderboard wl
JOIN users u ON u.id = wl.user_id;

-- Refresh function (called hourly via Edge Function)
CREATE OR REPLACE FUNCTION refresh_weekly_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW weekly_leaderboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**achievements table**
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON achievements 
  FOR SELECT USING (auth.uid() = user_id);
```

### TypeScript Types

```typescript
// types/index.ts
export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  notes?: string;
  duration_minutes?: number;
  xp_earned: number;
  completed_at: string;
  created_at: string;
  synced: boolean;
  exercises?: Exercise[];
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  friend?: User;
}

export interface Like {
  id: string;
  user_id: string;
  workout_id: string;
  created_at: string;
}

export interface FriendWorkout extends Workout {
  user?: User;
  likes_count?: number;
  liked_by_me?: boolean;
}

export interface LeaderboardEntry {
  username: string;
  xp_week: number;
  workouts_week: number;
  rank: number;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description?: string;
  unlocked_at: string;
}
```


## Error Handling

### Error Handling Strategy

**Network Errors**
- Detect offline state using NetInfo
- Queue operations locally when offline
- Show offline indicator in UI
- Retry failed operations when connectivity restored

**Authentication Errors**
- Handle expired tokens with automatic refresh
- Redirect to login on auth failure
- Show user-friendly error messages
- Clear local data on logout

**Validation Errors**
- Validate input on client before submission
- Display inline validation errors
- Show toast notifications for server errors
- Log errors for debugging (non-sensitive data only)

**Sync Conflicts**
- Use "last write wins" strategy for MVP
- Track `updated_at` timestamps
- Show conflict notification to user
- Allow manual conflict resolution in future version

### Error Handling Implementation

```typescript
// lib/errorHandler.ts
export const handleError = (error: any, context: string) => {
  console.error(`[${context}]`, error);
  
  if (error.message?.includes('network')) {
    return 'Network error. Changes will sync when online.';
  }
  
  if (error.message?.includes('auth')) {
    return 'Authentication error. Please log in again.';
  }
  
  return 'Something went wrong. Please try again.';
};

// Usage in hooks
try {
  await supabase.from('workouts').insert(workout);
} catch (error) {
  const message = handleError(error, 'createWorkout');
  showToast(message);
  queueForSync(workout); // Queue for later sync
}
```


## Testing Strategy

### Testing Approach

**Unit Testing**
- Test utility functions (XP calculation, date helpers)
- Test data transformation logic
- Use Jest with React Native preset
- Focus on business logic, not UI

**Integration Testing**
- Test Supabase client integration
- Test offline sync logic
- Test authentication flow
- Mock Supabase responses

**Manual Testing**
- Test on Web (Chrome, Safari)
- Test on Android device/emulator
- Test offline functionality
- Test real-time updates

**No E2E Testing for MVP**
- Skip Detox/Appium to reduce complexity
- Manual testing sufficient for MVP
- Add E2E tests post-MVP if needed

### Test Examples

```typescript
// __tests__/xpCalculation.test.ts
import { calculateWorkoutXP } from '../lib/gamification';

describe('XP Calculation', () => {
  it('calculates XP based on duration', () => {
    const xp = calculateWorkoutXP(60); // 60 minutes
    expect(xp).toBe(60); // 1 XP per minute
  });
  
  it('applies streak multiplier', () => {
    const xp = calculateWorkoutXP(60, 7); // 60 min, 7-day streak
    expect(xp).toBe(72); // 60 * 1.2 (20% bonus)
  });
});

// __tests__/offlineSync.test.ts
import { queueOperation, processQueue } from '../lib/offlineSync';

describe('Offline Sync', () => {
  it('queues operations when offline', async () => {
    const operation = { type: 'CREATE_WORKOUT', data: {...} };
    await queueOperation(operation);
    
    const queue = await getQueue();
    expect(queue).toContainEqual(operation);
  });
});
```

### Testing Commands

```bash
# Run unit tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```


## Key Design Decisions

### 1. React Native Expo vs React PWA

**Decision**: Use React Native Expo with React Native Web

**Rationale**:
- True native mobile experience (better performance, native APIs)
- Single codebase for Web + Android + iOS
- Expo provides excellent developer experience
- React Native Web enables web compatibility
- Easier to publish to app stores

**Trade-offs**:
- Slightly larger bundle size than pure web
- Some web-specific features may need workarounds
- Learning curve for React Native if team is web-focused

### 2. Supabase vs Custom Backend

**Decision**: Use Supabase exclusively (no custom backend)

**Rationale**:
- Eliminates need to build/maintain backend infrastructure
- Row Level Security provides robust data protection
- Built-in auth, real-time, storage
- Edge Functions for complex logic
- Reduces codebase significantly

**Trade-offs**:
- Vendor lock-in to Supabase
- Limited control over backend infrastructure
- Edge Functions have cold start latency
- Must design around RLS constraints

### 3. Offline-First Architecture

**Decision**: Implement offline-first with local SQLite + sync queue

**Rationale**:
- Essential for fitness app (gym often has poor connectivity)
- Better user experience (instant feedback)
- Reduces server load
- Aligns with PWA principles

**Trade-offs**:
- Increased complexity in sync logic
- Potential for data conflicts
- Larger local storage requirements
- More testing scenarios

### 4. State Management

**Decision**: Use React hooks + Context API (no Redux/Zustand)

**Rationale**:
- Sufficient for MVP scope
- Reduces dependencies
- Simpler mental model
- Less boilerplate code

**Trade-offs**:
- May need refactor if app grows significantly
- Less tooling for debugging state
- Potential prop drilling in deep components

### 5. Navigation

**Decision**: Use Expo Router (file-based routing)

**Rationale**:
- Modern, intuitive file-based routing
- Deep linking support out of the box
- Web-compatible URLs
- Less boilerplate than React Navigation

**Trade-offs**:
- Newer library (less mature than React Navigation)
- Smaller community/fewer examples
- Some advanced navigation patterns may be harder

### 6. Styling

**Decision**: Use React Native StyleSheet + minimal UI library

**Rationale**:
- Native performance (no CSS-in-JS overhead)
- Simple, predictable styling
- Small bundle size
- Use React Native Paper or NativeBase for basic components

**Trade-offs**:
- Less flexible than web CSS
- No Tailwind CSS (not compatible with React Native)
- More verbose than utility-first CSS

### 7. Local Storage

**Decision**: Use Expo SQLite for structured data + AsyncStorage for simple key-value

**Rationale**:
- SQLite provides relational queries for offline data
- AsyncStorage for simple settings/tokens
- Both are Expo-native solutions
- Good performance for mobile

**Trade-offs**:
- More complex than single storage solution
- Need to manage two storage systems
- SQLite requires schema management

### 8. Gamification Complexity

**Decision**: Simple XP system with basic achievements

**Rationale**:
- Sufficient for MVP motivation
- Easy to understand and implement
- Reduces backend complexity
- Can expand post-MVP

**Trade-offs**:
- Less engaging than complex systems
- May not differentiate from competitors
- Limited progression mechanics

### 9. Social Features Scope

**Decision**: Lightweight social features (friends + likes + activity feed + weekly leaderboard) with NO real-time, NO media uploads, NO notifications

**Rationale**:
- Stays within Supabase free tier (1M monthly reads, 500MB DB)
- Read-heavy operations are cheap (query workouts directly)
- No separate social_feed table (query workouts of friends)
- Polling instead of real-time subscriptions
- Materialized view for leaderboard (hourly refresh)
- Reduces infrastructure costs significantly

**Trade-offs**:
- No instant updates (45-60 second polling)
- No rich media content
- No push notifications
- Limited engagement features
- May need to upgrade for scale

**Cost Optimization**:
- Friends activity: Query workouts table directly (no duplication)
- Likes: Simple table with unique constraint
- Leaderboard: Materialized view refreshed hourly via Edge Function
- No offline sync for social data (workouts only)
- No file storage for avatars in MVP (use initials/default)

### 10. Code Organization

**Decision**: Flat structure with minimal abstraction

**Rationale**:
- Easier to navigate for small team
- Reduces over-engineering
- Faster development
- Aligns with "less code is better" principle

**Trade-offs**:
- May need refactor as app grows
- Less scalable architecture
- Potential code duplication


## Implementation Phases

### Phase 1: Project Setup & Authentication (Week 1)

**Goals**:
- Initialize Expo project with TypeScript
- Set up Supabase project and configure RLS
- Implement authentication (signup, login, logout)
- Create basic navigation structure

**Deliverables**:
- Working Expo app with auth flow
- Supabase project with users table
- Environment configuration
- README with setup instructions

### Phase 2: Workout Tracking (Week 2)

**Goals**:
- Implement workout CRUD operations
- Create workout forms and list views
- Set up local SQLite storage
- Implement basic offline support

**Deliverables**:
- Create/edit/delete workouts
- Exercise tracking within workouts
- Offline workout creation
- Sync indicator in UI

### Phase 3: Gamification (Week 3)

**Goals**:
- Implement XP calculation logic
- Add level progression system
- Create streak tracking
- Build achievement system

**Deliverables**:
- XP awarded on workout completion
- Level display on profile
- Streak counter with visual indicator
- Basic achievements (first workout, 10 workouts, 7-day streak)

### Phase 4: Social Features (Week 4)

**Goals**:
- Implement friend system
- Create social feed
- Add like functionality
- Build leaderboard

**Deliverables**:
- Friend request/accept flow
- Feed showing friends' workouts
- Like button on posts
- Leaderboard sorted by XP

### Phase 5: Offline Sync & Polish (Week 5)

**Goals**:
- Implement robust offline sync
- Add real-time updates
- Polish UI/UX
- Test on multiple devices

**Deliverables**:
- Reliable offline queue processing
- Real-time feed updates
- Smooth animations and transitions
- Tested on Web + Android

### Phase 6: Testing & Deployment (Week 6)

**Goals**:
- Write unit tests for core logic
- Manual testing on all platforms
- Prepare for app store submission
- Deploy web version

**Deliverables**:
- Test coverage for critical paths
- Bug fixes from testing
- Android APK/AAB ready for Play Store
- Web version deployed


## Security Considerations

### Authentication Security

**Supabase Auth Best Practices**:
- Use email verification for new accounts
- Implement password strength requirements (min 8 chars, mixed case, numbers)
- Store JWT tokens securely using Expo SecureStore
- Implement automatic token refresh
- Add rate limiting on auth endpoints (Supabase built-in)

**Session Management**:
- Set appropriate token expiration (1 hour access, 7 days refresh)
- Clear tokens on logout
- Handle expired sessions gracefully
- Implement "remember me" functionality

### Data Security

**Row Level Security (RLS)**:
- Enable RLS on all tables
- Users can only read/write their own data
- Friends can view each other's public data
- Leaderboard data is public (read-only)
- Never expose service key in client code

**Input Validation**:
- Validate all user inputs on client
- Use TypeScript for type safety
- Sanitize text inputs to prevent XSS
- Limit file upload sizes and types
- Use Supabase's built-in validation

**API Security**:
- Use HTTPS for all requests (Supabase default)
- Include JWT token in all authenticated requests
- Implement rate limiting (Supabase Edge Functions)
- Log security events (failed auth, suspicious activity)

### Privacy Considerations

**User Data**:
- Collect minimal personal information
- Allow users to delete their account
- Provide data export functionality
- Make profile visibility configurable (public/friends-only)

**Social Features**:
- Friend requests require explicit acceptance
- Users can block other users
- Workout data is private by default
- Leaderboard participation is opt-in (future feature)

### Environment Variables

**Required Environment Variables**:
```bash
# .env.example
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# NEVER include these in client code:
# SUPABASE_SERVICE_KEY=your-service-key (backend only)
```

**Security Rules**:
- Only use `EXPO_PUBLIC_` prefix for client-safe variables
- Never commit `.env` file to version control
- Use different Supabase projects for dev/staging/prod
- Rotate keys if accidentally exposed

### Code Security

**Dependency Management**:
- Use `npm audit` to check for vulnerabilities
- Keep dependencies up to date
- Minimize number of dependencies
- Review dependency licenses

**Code Review**:
- Review all code changes for security issues
- Check for hardcoded secrets
- Validate RLS policies before deployment
- Test authentication flows thoroughly


## Performance Optimization

### Bundle Size Optimization

**Code Splitting**:
- Use Expo Router's automatic code splitting
- Lazy load screens not needed at startup
- Split large libraries (charts, animations)
- Target < 5MB initial bundle size

**Asset Optimization**:
- Compress images (WebP format)
- Use vector icons (Expo Vector Icons)
- Lazy load images in lists
- Cache assets locally

### Runtime Performance

**List Rendering**:
- Use FlatList for long lists (workouts, feed)
- Implement pagination (20 items per page)
- Use `getItemLayout` for fixed-height items
- Add pull-to-refresh

**Database Queries**:
- Index frequently queried columns (user_id, created_at)
- Limit query results (LIMIT 20)
- Use Supabase's built-in caching
- Implement optimistic updates

**Real-time Subscriptions**:
- Subscribe only to relevant data (friends' posts)
- Unsubscribe when component unmounts
- Throttle real-time updates (max 1 per second)
- Use Supabase filters to reduce data transfer

### Offline Performance

**Local Storage**:
- Index SQLite tables properly
- Batch database operations
- Use transactions for multiple writes
- Implement background sync (not blocking UI)

**Sync Strategy**:
- Sync in background when app is active
- Prioritize user-initiated actions
- Batch sync operations
- Show sync progress indicator

### Network Optimization

**Request Optimization**:
- Batch API requests where possible
- Use Supabase's `select` to fetch only needed fields
- Implement request caching (5 minutes for leaderboard)
- Compress request/response data

**Image Handling**:
- Use Supabase Storage CDN
- Generate thumbnails for profile images
- Lazy load images in feed
- Cache images locally

### Monitoring

**Performance Metrics**:
- Track app startup time (< 3 seconds)
- Monitor API response times (< 500ms)
- Track sync queue length
- Log slow queries (> 1 second)

**Error Tracking**:
- Use Sentry or similar for error tracking
- Log network failures
- Track offline queue failures
- Monitor auth errors


## Deployment Strategy

### Development Environment

**Local Development**:
```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on web
npx expo start --web

# Run on Android
npx expo start --android

# Run on iOS (Mac only)
npx expo start --ios
```

**Supabase Setup**:
1. Create Supabase project at supabase.com
2. Run database migrations from `supabase/migrations/`
3. Copy API keys to `.env` file
4. Enable RLS on all tables
5. Test auth flow

### Staging Environment

**Expo Development Build**:
- Create development build for testing
- Use Expo EAS Build for cloud builds
- Test on physical devices
- Share with beta testers via Expo Go

**Supabase Staging**:
- Create separate Supabase project for staging
- Use staging environment variables
- Test migrations before production
- Monitor staging logs

### Production Deployment

**Web Deployment**:
- Build web version: `npx expo export:web`
- Deploy to Vercel/Netlify/Cloudflare Pages
- Configure custom domain
- Enable HTTPS (automatic on most platforms)

**Android Deployment**:
```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

**iOS Deployment** (future):
```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Environment Configuration

**Development (.env.development)**:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
```

**Production (.env.production)**:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
```

### Continuous Integration

**GitHub Actions** (optional for MVP):
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
```

### Monitoring & Analytics

**Production Monitoring**:
- Use Sentry for error tracking
- Monitor Supabase dashboard for database performance
- Track user analytics (Expo Analytics or Mixpanel)
- Set up alerts for critical errors

**Key Metrics**:
- Daily active users (DAU)
- Workout completion rate
- App crash rate
- API error rate
- Sync success rate


## Migration from Current Codebase

### Migration Strategy

**Approach**: Clean rewrite, not incremental refactor

**Rationale**:
- Current codebase is too complex to refactor incrementally
- Different technology stack (React PWA → React Native Expo)
- Opportunity to eliminate technical debt
- Faster than trying to salvage existing code

### Code to Preserve

**Business Logic**:
- XP calculation formulas (`src/utils/xpCalculation.ts`)
- Workout validation logic (`src/utils/workoutValidation.ts`)
- Date/time helpers (`src/utils/dateHelpers.ts`)
- Achievement definitions (`src/data/fitnessAchievements.ts`)

**Data Models**:
- Workout types (`src/types/workout.ts`)
- User types (`src/types/index.ts`)
- Gamification types (`src/types/gamification.ts`)

**Database Schema**:
- Supabase migrations from `supabase/migrations/`
- RLS policies (review and simplify)
- Core table structures

### Code to Discard

**Over-engineered Abstractions**:
- Service containers (`src/services/ServiceContainer.ts`)
- Repository patterns (`src/repositories/`)
- Multiple service implementations (Mock vs Real)
- Complex caching layers

**Unused Features**:
- Marketplace (`src/components/marketplace/`)
- Mentorship (`src/components/mentorship.bak/`)
- Percentiles (`src/components/percentiles/`)
- A/B testing (`src/components/experiments/`)
- Viral content (`src/services/ViralContentOptimizer.ts`)

**Test Infrastructure**:
- Complex test utilities (`src/test/`)
- Test pages (`src/pages/*TestPage.tsx`)
- Performance benchmarking tools

**Build Configuration**:
- Vite config (switching to Expo)
- PWA config (switching to native)
- Multiple build variants

### Migration Checklist

**Phase 1: Setup**
- [ ] Create new Expo project
- [ ] Set up Supabase project
- [ ] Configure environment variables
- [ ] Set up version control

**Phase 2: Core Logic**
- [ ] Port XP calculation logic
- [ ] Port workout validation
- [ ] Port date helpers
- [ ] Define TypeScript types

**Phase 3: Database**
- [ ] Create simplified database schema
- [ ] Write RLS policies
- [ ] Create indexes
- [ ] Test with sample data

**Phase 4: Features**
- [ ] Implement authentication
- [ ] Implement workout tracking
- [ ] Implement gamification
- [ ] Implement social features
- [ ] Implement offline sync

**Phase 5: Testing**
- [ ] Unit test core logic
- [ ] Manual test all features
- [ ] Test offline functionality
- [ ] Test on multiple devices

**Phase 6: Deployment**
- [ ] Deploy web version
- [ ] Build Android APK
- [ ] Submit to Play Store
- [ ] Monitor production

### Data Migration

**User Data Migration** (if needed):
- Export user data from current database
- Transform to new schema format
- Import to new Supabase project
- Verify data integrity
- Notify users of migration

**No Migration for MVP**:
- Start fresh with new users
- Avoid complexity of data migration
- Faster time to market
- Clean slate for testing


## Future Enhancements (Post-MVP)

### Short-term Enhancements (3-6 months)

**Enhanced Social Features**:
- Comments on workout posts
- Share workouts to external platforms
- Private messaging between friends
- Group challenges

**Advanced Gamification**:
- Weekly/monthly challenges
- Badges and titles
- Customizable avatars
- Seasonal events

**Workout Features**:
- Workout templates library
- Exercise video demonstrations
- Rest timer between sets
- Workout history charts

**User Experience**:
- Dark mode
- Multiple language support
- Customizable themes
- Haptic feedback

### Medium-term Enhancements (6-12 months)

**Analytics & Insights**:
- Progress tracking charts
- Personal records tracking
- Muscle group analysis
- Workout recommendations

**Premium Features**:
- Advanced workout plans
- Nutrition tracking
- Personal trainer matching
- Ad-free experience

**Platform Expansion**:
- iOS app release
- Apple Watch integration
- Wear OS support
- Desktop app

**Community Features**:
- Public leaderboards
- Gym/location-based groups
- Event organization
- User-generated content

### Long-term Vision (12+ months)

**AI & Machine Learning**:
- Personalized workout recommendations
- Form analysis using camera
- Injury prevention suggestions
- Adaptive training plans

**Marketplace**:
- Workout plan marketplace
- Coaching services
- Equipment recommendations
- Supplement tracking

**Enterprise Features**:
- Gym management tools
- Corporate wellness programs
- Team challenges
- Admin dashboard

**Advanced Technology**:
- AR workout guidance
- Voice commands
- Biometric integration
- Smart equipment connectivity

### Technical Debt to Address

**Code Quality**:
- Increase test coverage to 80%
- Add E2E testing
- Implement code review process
- Set up automated linting

**Performance**:
- Optimize bundle size further
- Implement advanced caching
- Add service worker for web
- Optimize database queries

**Infrastructure**:
- Set up CI/CD pipeline
- Implement blue-green deployment
- Add load testing
- Set up monitoring dashboards

**Security**:
- Implement 2FA
- Add security audit logging
- Penetration testing
- GDPR compliance review


## Local Storage Security Rules

### Critical Security Principles

**1. Never Store Secrets Locally**
- NEVER store service keys in SQLite or AsyncStorage
- NEVER store JWT tokens in SQLite or AsyncStorage
- Use Expo SecureStore ONLY for tokens (access token, refresh token)
- Assume all local storage is public and can be inspected

**2. Client is Public**
- Database schema and queries are not secret
- All security enforcement happens in Supabase RLS
- JWT must be verified on every write operation
- Client-side validation is for UX only, not security

**3. Local Cache = Non-Sensitive Only**
- Cache only display-safe data (workout names, exercise lists, public profiles)
- If data is sensitive (email, phone, private messages), fetch on demand
- Never cache PII (Personally Identifiable Information)
- Implement cache expiration (24 hours max)

**4. PII Minimization**
- Store only IDs and display-safe fields locally
- Avoid storing email, phone, address, payment info
- Use user_id instead of email for relationships
- Redact sensitive fields before caching

**5. Whitelist Before Persist**
```typescript
// Good: Whitelist safe fields
const safeWorkout = {
  id: workout.id,
  name: workout.name,
  duration_minutes: workout.duration_minutes,
  xp_earned: workout.xp_earned,
  completed_at: workout.completed_at
};
await db.insert('workouts', safeWorkout);

// Bad: Storing everything
await db.insert('workouts', workout); // May contain sensitive data
```

**6. AsyncStorage Usage**
- Use ONLY for tiny UI state (theme preference, onboarding completed)
- Use for flags and timestamps only
- NEVER for tokens, user profiles, or lists
- Maximum 10 keys total

**7. SecureStore for Tokens**
```typescript
// lib/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

export const saveToken = async (key: string, value: string) => {
  await SecureStore.setItemAsync(key, value);
};

export const getToken = async (key: string) => {
  return await SecureStore.getItemAsync(key);
};

export const deleteToken = async (key: string) => {
  await SecureStore.deleteItemAsync(key);
};

// Usage
await saveToken('access_token', token);
await saveToken('refresh_token', refreshToken);
```

**8. Logout Cleanup**
```typescript
// Clear all local data on logout
const logout = async () => {
  // Clear SecureStore
  await deleteToken('access_token');
  await deleteToken('refresh_token');
  
  // Clear SQLite (best effort)
  await db.execute('DELETE FROM workouts');
  await db.execute('DELETE FROM exercises');
  await db.execute('DELETE FROM social_feed');
  
  // Clear AsyncStorage
  await AsyncStorage.clear();
  
  // Sign out from Supabase
  await supabase.auth.signOut();
};
```

**9. Error Logging**
```typescript
// Good: Redacted logging
console.error('Auth failed', { userId: user.id, timestamp: Date.now() });

// Bad: Exposing tokens
console.error('Auth failed', { token: accessToken }); // NEVER DO THIS
```

**10. Data Validation**
```typescript
// Validate before storing locally
const isValidForCache = (data: any) => {
  // Check for sensitive fields
  const sensitiveFields = ['email', 'phone', 'password', 'token', 'ssn'];
  const keys = Object.keys(data);
  
  return !keys.some(key => 
    sensitiveFields.some(field => key.toLowerCase().includes(field))
  );
};

if (isValidForCache(workout)) {
  await db.insert('workouts', workout);
}
```

### Local Storage Strategy Summary

| Data Type | Storage | Reason |
|-----------|---------|--------|
| Access Token | SecureStore | Encrypted, secure |
| Refresh Token | SecureStore | Encrypted, secure |
| User ID | AsyncStorage | Non-sensitive, needed for queries |
| Theme Preference | AsyncStorage | UI state only |
| Workout Data | SQLite | Non-sensitive, needs queries |
| Exercise Data | SQLite | Non-sensitive, needs queries |
| Social Feed | SQLite | Public data, temporary cache |
| User Email | NEVER | Fetch from Supabase when needed |
| User Phone | NEVER | Fetch from Supabase when needed |
| Payment Info | NEVER | Never store locally |

