# Performance Optimizations

This document outlines the performance optimizations implemented in the LiftFire Expo app.

## FlatList Optimizations

### Implemented Optimizations

1. **getItemLayout**: Pre-calculated item heights for instant scrolling
   - Workouts list: 140px per item
   - Social feed: 160px per item
   - Leaderboard: 80px per item

2. **removeClippedSubviews**: Unmounts off-screen components to reduce memory usage

3. **maxToRenderPerBatch**: Limits initial render to 10 items per batch

4. **updateCellsBatchingPeriod**: 50ms delay between batches for smoother scrolling

5. **windowSize**: Renders 10 screens worth of content (5 above, 5 below)

## Database Optimizations

### SQLite Indexes

The following indexes are created for optimal query performance:

```sql
CREATE INDEX idx_workouts_user_id ON workouts (user_id);
CREATE INDEX idx_workouts_synced ON workouts (synced);
CREATE INDEX idx_exercises_workout_id ON exercises (workout_id);
CREATE INDEX idx_social_feed_cached_at ON social_feed (cached_at DESC);
CREATE INDEX idx_sync_queue_status ON sync_queue (status);
```

### Query Optimization

- Limit queries to necessary fields only
- Use pagination (20 items per page)
- Cache frequently accessed data
- Batch database operations

## Bundle Size Optimization

### Current Dependencies (Minimal)

- Core: React Native, Expo SDK
- Backend: Supabase client
- Storage: SQLite, AsyncStorage, SecureStore
- UI: React Native Paper components
- Utilities: Zod validation, NetInfo

### Bundle Analysis

Run `npm run analyze` to analyze bundle size and identify optimization opportunities.

Target: < 5MB initial bundle size

## Image Optimization

### Avatar Caching

- Use Expo's built-in image caching
- Compress images before upload
- Use appropriate image sizes (thumbnails for lists)

### Implementation

```typescript
import { Image } from 'expo-image';

<Image
  source={{ uri: avatarUrl }}
  cachePolicy="memory-disk"
  contentFit="cover"
  style={styles.avatar}
/>
```

## Lazy Loading

### Screen Lazy Loading

Use React.lazy for non-critical screens:

```typescript
import { lazyLoadScreen, LazyLoadFallback } from '../lib/lazyLoad';

const ProfileEditScreen = lazyLoadScreen(() => import('./profile/edit'));

// In component
<Suspense fallback={<LazyLoadFallback />}>
  <ProfileEditScreen />
</Suspense>
```

## Network Optimization

### Request Optimization

1. **Batch API requests** where possible
2. **Use Supabase select** to fetch only needed fields
3. **Implement request caching** (5 minutes for leaderboard)
4. **Compress request/response data**

### Offline-First Strategy

- Store workouts locally in SQLite
- Queue operations when offline
- Sync in background when online
- Reduce server load with local-first approach

## Memory Management

### Component Optimization

1. **useCallback** for event handlers to prevent re-renders
2. **useMemo** for expensive calculations
3. **React.memo** for pure components
4. **Cleanup effects** to prevent memory leaks

### Example

```typescript
const handlePress = useCallback(() => {
  // Handler logic
}, [dependencies]);

const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);
```

## Monitoring

### Performance Metrics to Track

- App startup time (target: < 3 seconds)
- API response times (target: < 500ms)
- Sync queue length
- Memory usage
- Frame rate (target: 60 FPS)

### Tools

- React DevTools Profiler
- Expo Performance Monitor
- Chrome DevTools (for web)
- Android Studio Profiler (for Android)

## Best Practices

1. **Avoid inline functions** in render methods
2. **Use PureComponent or React.memo** for list items
3. **Implement virtualization** for long lists (FlatList)
4. **Optimize images** (compress, resize, cache)
5. **Minimize re-renders** with proper state management
6. **Use production builds** for testing performance
7. **Profile regularly** to identify bottlenecks

## Future Optimizations

- Implement code splitting for larger features
- Add service worker for web caching
- Optimize font loading
- Implement progressive image loading
- Add performance monitoring (Sentry, Firebase)
