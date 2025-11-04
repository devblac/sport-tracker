# Implementation Plan

- [x] 1. Project initialization and setup



  - Initialize new Expo project with TypeScript template
  - Configure Expo Router for file-based navigation
  - Set up Supabase project and obtain API keys
  - Create .env.example file with required environment variables
  - Install core dependencies (Supabase client, SecureStore, SQLite, NetInfo)
  - Configure TypeScript with strict mode
  - Set up basic folder structure (app/, components/, hooks/, lib/, types/)
  - Create README.md with setup instructions
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 2. Supabase database schema and security





  - [x] 2.1 Create core database tables


    - Write migration for users table with XP, level, and streak fields
    - Write migration for workouts table with user_id foreign key
    - Write migration for exercises table with workout_id foreign key
    - Write migration for friendships table with status field
    - Write migration for likes table (user_id, workout_id) with unique constraint
    - Write migration for achievements table with achievement_type
    - Create materialized view weekly_leaderboard with refresh function
    - Create view weekly_leaderboard_public for anonymized access
    - _Requirements: 3.1, 3.5, 9.4_
  - [x] 2.2 Implement Row Level Security policies

    - Enable RLS on all tables
    - Create policy: users can view all profiles (SELECT)
    - Create policy: users can update only own profile (UPDATE)
    - Create policy: users can manage only own workouts (ALL)
    - Create policy: users can view friends' workouts (SELECT with friendship join)
    - Create policy: users can manage exercises through workout ownership
    - Create policy: users can view own and friends' friendships
    - Create policy: users can manage own likes
    - Test RLS policies with different user contexts
    - _Requirements: 3.1, 3.4_
  - [x] 2.3 Create database indexes

    - Add index on workouts(user_id, completed_at DESC)
    - Add index on exercises(workout_id)
    - Add index on friendships(user_id, friend_id, status)
    - Add index on likes(workout_id, user_id)
    - Add index on weekly_leaderboard(xp_week DESC)
    - _Requirements: 3.1_

- [x] 3. Authentication implementation




  - [x] 3.1 Set up Supabase client


    - Create lib/supabase.ts with Supabase client initialization
    - Configure Supabase URL and anon key from environment variables
    - Set up auth state change listener
    - _Requirements: 2.1, 2.5, 3.2, 3.3_
  - [x] 3.2 Create secure token storage


    - Create lib/secureStorage.ts with SecureStore helpers
    - Implement saveToken, getToken, deleteToken functions
    - Add token validation before storage
    - _Requirements: 3.4, 3.5_
  - [x] 3.3 Build authentication hook


    - Create hooks/useAuth.ts with sign up, login, logout functions
    - Implement session persistence using SecureStore
    - Add automatic token refresh logic
    - Handle auth state changes
    - Implement error handling for auth failures
    - _Requirements: 1.1, 3.4, 3.5_
  - [x] 3.4 Create authentication screens


    - Create app/(auth)/login.tsx with email/password form
    - Create app/(auth)/signup.tsx with registration form
    - Add input validation (email format, password strength)
    - Display loading states during auth operations
    - Show error messages for failed auth attempts
    - _Requirements: 1.1_

- [x] 4. Local storage and offline infrastructure





  - [x] 4.1 Set up SQLite database


    - Create lib/database.ts with SQLite initialization
    - Define local schema for workouts, exercises, social_feed tables
    - Implement safe data whitelisting before persist
    - Add database migration logic for schema updates
    - _Requirements: 7.1, 7.3_
  - [x] 4.2 Implement offline sync queue


    - Create lib/offlineSync.ts with queue management
    - Implement queueOperation function for offline workout actions ONLY
    - Create processQueue function to sync workouts when online
    - Add NetInfo listener to detect connectivity changes
    - Implement "last write wins" conflict resolution
    - Store queue in SQLite with operation type and timestamp
    - NO offline queue for social features (likes, friends)
    - _Requirements: 7.2, 7.3, 7.4_
  - [x] 4.3 Create offline sync hook


    - Create hooks/useOfflineSync.ts
    - Expose queueOperation, syncNow, pendingCount
    - Add background sync on app foreground
    - Implement sync status indicators
    - _Requirements: 7.2, 7.3_

- [x] 5. Workout tracking implementation





  - [x] 5.1 Create workout data types


    - Define TypeScript interfaces in types/index.ts for Workout, Exercise
    - Add validation schemas for workout creation
    - Include synced flag for offline tracking
    - _Requirements: 1.2_
  - [x] 5.2 Build workout management hook


    - Create hooks/useWorkouts.ts with CRUD operations
    - Implement createWorkout with offline queue support
    - Implement updateWorkout with optimistic updates
    - Implement deleteWorkout with local and remote deletion
    - Fetch workouts from Supabase with local cache fallback
    - Add loading and error states
    - _Requirements: 1.2, 7.1, 7.2_
  - [x] 5.3 Create workout list screen


    - Create app/(tabs)/workouts.tsx with FlatList
    - Display workout cards with name, date, duration, XP
    - Add pull-to-refresh functionality
    - Show offline indicator when not synced
    - Implement pagination (20 workouts per page)
    - Add empty state for no workouts
    - _Requirements: 1.2_
  - [x] 5.4 Build workout form components


    - Create components/WorkoutForm.tsx for create/edit
    - Add exercise selection with sets, reps, weight inputs
    - Implement form validation
    - Add save button with loading state
    - Support offline workout creation
    - _Requirements: 1.2_
  - [x] 5.5 Create workout detail screen


    - Create app/workout/[id].tsx to display workout details
    - Show all exercises with sets, reps, weight
    - Add edit and delete buttons
    - Display XP earned and completion time
    - _Requirements: 1.2_

- [x] 6. Gamification system implementation




  - [x] 6.1 Port XP calculation logic


    - Create lib/gamification.ts with XP calculation functions
    - Port calculateWorkoutXP from existing codebase
    - Implement level calculation based on XP thresholds
    - Add streak bonus multiplier (20% for 7+ day streak)
    - Keep logic simple and minimal
    - _Requirements: 8.1, 8.2_
  - [x] 6.2 Implement streak tracking


    - Create lib/streaks.ts with streak calculation logic
    - Calculate current streak from workout dates
    - Update user streak on workout completion
    - Store streak in users table
    - _Requirements: 8.3_
  - [x] 6.3 Build achievement system


    - Define achievement types in types/index.ts
    - Create lib/achievements.ts with unlock logic
    - Implement basic achievements: "First Workout", "10 Workouts", "7 Day Streak"
    - Check and award achievements on workout completion
    - Store achievements in achievements table
    - _Requirements: 8.4_
  - [x] 6.4 Create gamification hook


    - Create hooks/useGamification.ts
    - Fetch user XP, level, streak from Supabase
    - Calculate level progress percentage
    - Fetch user achievements
    - Update gamification data on workout completion
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 6.5 Build gamification UI components


    - Create components/XPBar.tsx with progress visualization
    - Create components/StreakDisplay.tsx with fire icon
    - Create components/AchievementBadge.tsx for achievement display
    - Add gamification stats to profile screen
    - Show XP earned notification after workout completion
    - _Requirements: 8.5_

- [x] 7. Social features implementation




  - [x] 7.1 Implement friend system


    - Create hooks/useFriends.ts with friend management
    - Implement sendFriendRequest function
    - Implement acceptFriendRequest and rejectFriendRequest
    - Fetch friends list with status filtering
    - Add friend search by username
    - _Requirements: 9.1_
  - [x] 7.2 Build friends activity feed


    - Create hooks/useSocial.ts for feed management
    - Fetch friends' recent workouts directly from workouts table
    - Query: SELECT \* FROM workouts WHERE user_id IN (friend_ids) ORDER BY completed_at DESC LIMIT 20
    - Implement polling (every 45-60 seconds) for updates
    - NO offline caching for social data (workouts only)
    - _Requirements: 9.2, 7.4, 7.5_
  - [x] 7.3 Implement like functionality

    - Add likeWorkout function in useSocial hook
    - Implement unlike functionality
    - Store likes in likes table (user_id, workout_id)
    - Show liked state in UI
    - Use optimistic updates for instant feedback
    - NO real-time updates (poll on refresh)
    - _Requirements: 9.3_
  - [x] 7.4 Create friends activity screen


    - Create app/(tabs)/social.tsx with friends' workouts
    - Use FlatList for workout items
    - Create components/FriendWorkoutItem.tsx for display
    - Show friend username, workout name, duration, XP, like button
    - Add pull-to-refresh (triggers manual poll)
    - NO pagination for MVP (limit to 20 recent workouts)
    - _Requirements: 9.2, 9.3_
  - [x] 7.5 Build weekly leaderboard


    - Create components/LeaderboardList.tsx
    - Fetch from weekly_leaderboard_public view
    - Display rank, username, weekly XP, workout count
    - Highlight current user's rank
    - Add toggle for global vs friends-only leaderboard
    - Cache leaderboard data (5 minute expiration)
    - Create Edge Function to refresh materialized view hourly
    - _Requirements: 9.4_

- [x] 8. Profile and progress screens




  - [x] 8.1 Create profile screen


    - Create app/(tabs)/profile.tsx
    - Display user avatar, username, display name
    - Show XP, level, current streak, longest streak
    - Display achievement badges
    - Add edit profile button
    - Show total workouts count
    - _Requirements: 1.3, 8.5_
  - [x] 8.2 Build progress statistics


    - Create components/StatsCard.tsx for stat display
    - Calculate total workouts, total XP, average workout duration
    - Show weekly workout count
    - Display current week progress
    - Add simple charts for workout history (optional)
    - _Requirements: 1.3_
  - [x] 8.3 Implement profile editing


    - Create app/profile/edit.tsx screen
    - Allow editing display name and avatar
    - Use Supabase Storage for avatar uploads
    - Validate inputs before submission
    - Show success/error messages
    - _Requirements: 1.1_

- [x] 9. Navigation and app layout




  - [x] 9.1 Set up Expo Router navigation


    - Configure app/\_layout.tsx with tab navigation
    - Create tabs for Home, Workouts, Social, Profile
    - Add authentication guard for protected routes
    - Implement deep linking support
    - _Requirements: 4.3, 4.4_
  - [x] 9.2 Create home/dashboard screen


    - Create app/(tabs)/index.tsx
    - Show quick stats (today's workouts, current streak)
    - Display recent workouts (last 5)
    - Show friend activity preview
    - Add quick action buttons (Start Workout, View Progress)
    - _Requirements: 1.3_
  - [x] 9.3 Implement loading and error states


    - Create components/LoadingSpinner.tsx
    - Create components/ErrorMessage.tsx
    - Add loading states to all data fetching
    - Show error messages with retry buttons
    - Implement skeleton loaders for lists
    - _Requirements: 7.3_

- [x] 10. Polish and user experience





  - [x] 10.1 Add toast notifications


    - Install and configure toast library (react-native-toast-message)
    - Show success toasts for workout completion, friend requests
    - Show error toasts for failed operations
    - Display sync status notifications
    - _Requirements: 7.5_
  - [x] 10.2 Implement pull-to-refresh


    - Add pull-to-refresh to workout list
    - Add pull-to-refresh to social feed
    - Add pull-to-refresh to leaderboard
    - Trigger sync on pull-to-refresh
    - _Requirements: 7.2_
  - [x] 10.3 Add offline indicators


    - Show offline banner when no connectivity
    - Display sync pending count in UI
    - Add synced/unsynced badges on workout cards
    - Show "Offline Mode" in navigation header
    - _Requirements: 7.1, 7.3_
  - [x] 10.4 Optimize performance


    - Implement FlatList optimization (getItemLayout)
    - Add image caching for avatars
    - Lazy load screens with React.lazy
    - Optimize SQLite queries with indexes
    - Reduce bundle size (target < 5MB)
    - _Requirements: 4.2, 4.4_

- [x] 11. Testing




  - [x] 11.1 Write unit tests for core logic

    - Test XP calculation functions
    - Test streak calculation logic
    - Test achievement unlock conditions
    - Test offline sync queue operations
    - Test data validation functions
    - _Requirements: 6.1, 6.3_
  - [x] 11.2 Test authentication flows


    - Test sign up with valid/invalid inputs
    - Test login with correct/incorrect credentials
    - Test token refresh logic
    - Test logout and data cleanup
    - _Requirements: 1.1, 3.4_
  - [x] 11.3 Manual testing on platforms


    - Test on web browser (Chrome, Safari)
    - Test on Android device/emulator
    - Test offline functionality on all platforms
    - Test polling updates for social features
    - Verify RLS policies work correctly
    - _Requirements: 4.3, 4.5_

- [ ] 12. Documentation and deployment preparation
  - [ ] 12.1 Complete README documentation
    - Document setup instructions for Expo
    - Document Supabase project setup steps
    - List all required environment variables
    - Add troubleshooting section
    - Include screenshots of key features
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ] 12.2 Create deployment configurations
    - Configure eas.json for Expo Application Services
    - Set up production environment variables
    - Create app.json with proper metadata
    - Configure app icons and splash screens
    - _Requirements: 10.4, 10.5_
  - [ ] 12.3 Build and test production builds
    - Build web version with npx expo export:web
    - Build Android APK for testing
    - Test production builds on devices
    - Verify all features work in production mode
    - _Requirements: 10.5_

- [ ] 13. Final integration and cleanup
  - [ ] 13.1 End-to-end feature verification
    - Verify complete user journey: signup → workout → social → profile
    - Test friend request flow end-to-end
    - Verify XP and achievements are awarded correctly
    - Test offline workout creation and sync
    - Verify leaderboard updates correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ] 13.2 Code cleanup and optimization
    - Remove unused dependencies
    - Remove console.log statements
    - Fix TypeScript any types
    - Ensure consistent code formatting
    - Remove commented-out code
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ] 13.3 Security audit
    - Verify no secrets in code or version control
    - Confirm RLS policies are enabled on all tables
    - Test that users cannot access other users' data
    - Verify tokens are stored in SecureStore only
    - Check that sensitive data is not logged
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
