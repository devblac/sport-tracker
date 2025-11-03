# Social Features Implementation

This document describes the social features implemented for the LiftFire MVP.

## Overview

The social features include:
- Friend system (send/accept/reject friend requests)
- Friends activity feed (see friends' recent workouts)
- Like functionality (like/unlike workouts)
- Weekly leaderboard (global and friends-only)

## Architecture

### Hooks

#### `useFriends.ts`
Manages friend relationships:
- `friends`: List of accepted friendships
- `pendingRequests`: Friend requests received
- `sentRequests`: Friend requests sent
- `sendFriendRequest(friendId)`: Send a friend request
- `acceptFriendRequest(friendshipId)`: Accept a friend request
- `rejectFriendRequest(friendshipId)`: Reject a friend request
- `searchUsers(searchTerm)`: Search for users by username
- `refreshFriends()`: Manually refresh friends list

#### `useSocial.ts`
Manages social feed and likes:
- `feed`: Array of friends' recent workouts (max 20)
- `likeWorkout(workoutId)`: Like a workout
- `unlikeWorkout(workoutId)`: Unlike a workout
- `toggleLike(workoutId, currentlyLiked)`: Toggle like state
- `refreshFeed()`: Manually refresh feed
- Automatic polling every 50 seconds for feed updates

### Components

#### `FriendWorkoutItem.tsx`
Displays a single workout in the social feed:
- User avatar and username
- User level badge
- Workout name, duration, and XP earned
- Like button with count
- Relative timestamp (e.g., "2h ago")

#### `LeaderboardList.tsx`
Displays weekly leaderboard:
- Supports global and friends-only modes
- Shows rank, username, weekly XP, and workout count
- Highlights current user's entry
- Medal emojis for top 3 (🥇🥈🥉)
- 5-minute cache to reduce database load
- Pull-to-refresh support

### Screens

#### `app/(tabs)/social.tsx`
Main social screen with two tabs:
1. **Feed Tab**: Shows friends' recent workouts
   - Pull-to-refresh to manually update
   - Like/unlike workouts
   - Empty state when no friends
2. **Leaderboard Tab**: Shows weekly rankings
   - Toggle between Global and Friends views
   - Pull-to-refresh to update

## Database Schema

### friendships table
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
```

### likes table
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workout_id)
);
```

### weekly_leaderboard materialized view
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

CREATE VIEW weekly_leaderboard_public AS
SELECT 
  u.username,
  wl.xp_week,
  wl.workouts_week,
  ROW_NUMBER() OVER (ORDER BY wl.xp_week DESC) as rank
FROM weekly_leaderboard wl
JOIN users u ON u.id = wl.user_id;
```

## Edge Function

### `refresh-leaderboard`
Refreshes the weekly leaderboard materialized view hourly.

**Deployment:**
```bash
supabase functions deploy refresh-leaderboard
```

**Scheduling:**
Set up a cron job to call this function every hour. See `supabase/functions/refresh-leaderboard/README.md` for details.

## Key Features

### Offline Support
- **NO offline caching for social data** (design decision for MVP)
- Social features require internet connection
- Only workout data is cached offline

### Polling vs Real-time
- Uses polling (every 50 seconds) instead of real-time subscriptions
- Reduces Supabase costs (free tier optimization)
- Manual refresh via pull-to-refresh

### Optimistic Updates
- Like/unlike actions update UI immediately
- Reverts on error
- Provides instant feedback to users

### Performance Optimizations
- Leaderboard caching (5 minutes)
- Limit feed to 20 recent workouts
- Materialized view for global leaderboard
- Efficient queries with proper indexes

## Security

### Row Level Security (RLS)
All social tables have RLS policies:

**friendships:**
- Users can view their own friendships
- Users can create friend requests
- Users can update friendships they're part of

**likes:**
- Users can view all likes
- Users can create their own likes
- Users can delete their own likes

**weekly_leaderboard_public:**
- Public read access (anonymized data)

## Usage

### Adding Friends
1. Search for users by username
2. Send friend request
3. Friend receives request in pending list
4. Friend accepts or rejects

### Viewing Feed
1. Navigate to Social tab
2. View friends' recent workouts
3. Like/unlike workouts
4. Pull down to refresh

### Checking Leaderboard
1. Navigate to Social tab
2. Switch to Leaderboard tab
3. Toggle between Global and Friends
4. See your rank and weekly XP

## Future Enhancements (Post-MVP)
- Comments on workouts
- Share workouts externally
- Push notifications for friend requests
- Real-time updates (when scaling up)
- Media uploads (workout photos)
- Private messaging
- Group challenges
