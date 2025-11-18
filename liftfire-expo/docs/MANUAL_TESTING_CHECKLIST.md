# Manual Testing Checklist

This document provides a comprehensive checklist for manually testing the LiftFire MVP across all platforms.

## Prerequisites

- Expo development server running (`npx expo start`)
- Web browser (Chrome, Safari)
- Android device/emulator configured
- Supabase project with test data
- Test user accounts created

## Test Environment Setup

### Test User Accounts

Create the following test accounts in Supabase:

1. **Primary Test User**
   - Email: test1@liftfire.app
   - Password: TestPass123!
   - Username: testuser1

2. **Secondary Test User** (for social features)
   - Email: test2@liftfire.app
   - Password: TestPass123!
   - Username: testuser2

### Test Data

Ensure the following test data exists:
- At least 5 workouts for each test user
- Friend connection between test users
- Some workouts with likes
- Achievement data

---

## 1. Web Browser Testing (Chrome)

### 1.1 Authentication Flow

- [ ] **Sign Up**
  - Navigate to signup page
  - Enter valid email, password, username
  - Verify account creation succeeds
  - Verify redirect to home screen
  - Verify user profile is created in database

- [ ] **Sign Up - Invalid Inputs**
  - Try invalid email format → Should show error
  - Try weak password (< 8 chars) → Should show error
  - Try duplicate username → Should show error

- [ ] **Login**
  - Navigate to login page
  - Enter correct credentials
  - Verify successful login
  - Verify redirect to home screen
  - Verify session persists on page refresh

- [ ] **Login - Invalid Credentials**
  - Try wrong password → Should show "Invalid credentials" error
  - Try non-existent email → Should show error

- [ ] **Logout**
  - Click logout button
  - Verify redirect to login screen
  - Verify session is cleared
  - Verify cannot access protected routes

### 1.2 Workout Tracking

- [ ] **Create Workout**
  - Click "New Workout" button
  - Enter workout name
  - Add 3 exercises with sets, reps, weight
  - Save workout
  - Verify workout appears in list
  - Verify XP is calculated and awarded

- [ ] **View Workout List**
  - Verify all workouts are displayed
  - Verify workouts are sorted by date (newest first)
  - Verify workout cards show: name, date, duration, XP
  - Verify pagination works (if > 20 workouts)

- [ ] **View Workout Details**
  - Click on a workout card
  - Verify all exercises are displayed
  - Verify sets, reps, weight are correct
  - Verify XP earned is shown
  - Verify completion time is shown

- [ ] **Edit Workout**
  - Open workout details
  - Click edit button
  - Modify workout name and exercises
  - Save changes
  - Verify changes are reflected

- [ ] **Delete Workout**
  - Open workout details
  - Click delete button
  - Confirm deletion
  - Verify workout is removed from list
  - Verify XP is recalculated

### 1.3 Gamification Features

- [ ] **XP and Levels**
  - Complete a workout
  - Verify XP is awarded (base 20 + duration + variety)
  - Verify level progress bar updates
  - Verify level up notification (if applicable)
  - Check profile page shows correct XP and level

- [ ] **Streak Tracking**
  - Complete workout today
  - Verify current streak increments
  - Verify streak display shows fire icon
  - Verify streak bonus applies to XP (7+ days = 20% bonus)
  - Check profile shows current and longest streak

- [ ] **Achievements**
  - Complete first workout → "First Steps" achievement
  - Complete 10 workouts → "Workout Warrior" achievement
  - Maintain 7-day streak → "Week Warrior" achievement
  - Verify achievement badges appear on profile
  - Verify achievement unlock notifications

### 1.4 Social Features

- [ ] **Friend System**
  - Search for another user by username
  - Send friend request
  - Switch to other test account
  - Accept friend request
  - Verify friendship status is "accepted"

- [ ] **Social Feed**
  - Navigate to social tab
  - Verify friends' recent workouts are displayed
  - Verify workout cards show: friend name, workout name, XP, date
  - Pull to refresh → Verify feed updates
  - Verify polling updates feed every 45-60 seconds

- [ ] **Like Functionality**
  - Click like button on friend's workout
  - Verify like count increments
  - Verify like button changes state (filled heart)
  - Click unlike → Verify like count decrements
  - Verify optimistic updates (instant feedback)

- [ ] **Weekly Leaderboard**
  - Navigate to leaderboard section
  - Verify users are ranked by weekly XP
  - Verify current user is highlighted
  - Toggle friends-only filter
  - Verify leaderboard updates (hourly refresh)

### 1.5 Profile and Progress

- [ ] **View Profile**
  - Navigate to profile tab
  - Verify user info: username, display name, avatar
  - Verify stats: XP, level, current streak, longest streak
  - Verify achievement badges are displayed
  - Verify total workouts count

- [ ] **Edit Profile**
  - Click edit profile button
  - Change display name
  - Save changes
  - Verify changes are reflected on profile
  - Verify changes persist after refresh

- [ ] **Progress Statistics**
  - View stats cards on profile
  - Verify total workouts count
  - Verify total XP
  - Verify weekly workout count
  - Verify average workout duration (if applicable)

### 1.6 Offline Functionality (Web)

- [ ] **Offline Workout Creation**
  - Open DevTools → Network tab
  - Set network to "Offline"
  - Create a new workout
  - Verify workout is saved locally
  - Verify offline indicator appears
  - Verify "pending sync" badge on workout card

- [ ] **Sync When Online**
  - Set network back to "Online"
  - Verify sync starts automatically
  - Verify offline indicator disappears
  - Verify workout is synced to Supabase
  - Verify "synced" status on workout card

- [ ] **Offline Limitations**
  - Go offline
  - Try to view social feed → Should show cached data or message
  - Try to like a workout → Should show "online only" message
  - Try to send friend request → Should show error

---

## 2. Web Browser Testing (Safari)

Repeat all tests from Section 1 in Safari to verify cross-browser compatibility.

### Key Safari-Specific Checks

- [ ] Verify localStorage works for token storage
- [ ] Verify date/time formatting is correct
- [ ] Verify animations and transitions work smoothly
- [ ] Verify form inputs work correctly
- [ ] Verify pull-to-refresh works (if supported)

---

## 3. Android Device/Emulator Testing

### 3.1 Setup

- [ ] Start Expo dev server: `npx expo start`
- [ ] Scan QR code with Expo Go app OR
- [ ] Press 'a' to open in Android emulator
- [ ] Verify app loads successfully

### 3.2 Authentication Flow

Repeat all authentication tests from Section 1.1:

- [ ] Sign up with valid inputs
- [ ] Sign up with invalid inputs
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials
- [ ] Logout and verify session cleared

### 3.3 Workout Tracking

Repeat all workout tests from Section 1.2:

- [ ] Create workout
- [ ] View workout list
- [ ] View workout details
- [ ] Edit workout
- [ ] Delete workout

### 3.4 Gamification Features

Repeat all gamification tests from Section 1.3:

- [ ] XP and levels
- [ ] Streak tracking
- [ ] Achievements

### 3.5 Social Features

Repeat all social tests from Section 1.4:

- [ ] Friend system
- [ ] Social feed
- [ ] Like functionality
- [ ] Weekly leaderboard

### 3.6 Profile and Progress

Repeat all profile tests from Section 1.5:

- [ ] View profile
- [ ] Edit profile
- [ ] Progress statistics

### 3.7 Offline Functionality (Android)

- [ ] **Enable Airplane Mode**
  - Swipe down notification panel
  - Enable airplane mode
  - Create a new workout
  - Verify workout is saved locally
  - Verify offline indicator appears

- [ ] **Sync When Online**
  - Disable airplane mode
  - Verify sync starts automatically
  - Verify workout syncs to Supabase
  - Verify offline indicator disappears

- [ ] **Background Sync**
  - Create workout offline
  - Close app (swipe away)
  - Enable network
  - Reopen app
  - Verify sync completes

### 3.8 Android-Specific Features

- [ ] **SecureStore**
  - Login
  - Close app completely
  - Reopen app
  - Verify session persists (auto-login)

- [ ] **SQLite Storage**
  - Create multiple workouts offline
  - Verify all are stored locally
  - Go online
  - Verify all sync successfully

- [ ] **Native UI**
  - Verify native components render correctly
  - Verify touch interactions feel responsive
  - Verify animations are smooth (60fps)
  - Verify keyboard behavior is correct

- [ ] **Performance**
  - Verify app startup time < 3 seconds
  - Verify list scrolling is smooth
  - Verify no lag when creating workouts
  - Verify no memory leaks (use Android Profiler)

---

## 4. Polling Updates for Social Features

### 4.1 Social Feed Polling

- [ ] **Automatic Polling**
  - Open social feed
  - Have another user (test2) complete a workout
  - Wait 45-60 seconds
  - Verify new workout appears in feed automatically

- [ ] **Manual Refresh**
  - Pull down on social feed
  - Verify loading indicator appears
  - Verify feed refreshes immediately
  - Verify latest workouts are shown

### 4.2 Leaderboard Polling

- [ ] **Hourly Refresh**
  - Note current leaderboard state
  - Have multiple users complete workouts
  - Wait for hourly refresh (check Edge Function logs)
  - Verify leaderboard updates with new rankings

- [ ] **Manual Refresh**
  - Pull down on leaderboard
  - Verify leaderboard refreshes
  - Verify rankings are updated

---

## 5. Row Level Security (RLS) Verification

### 5.1 User Data Isolation

- [ ] **Own Data Access**
  - Login as test1
  - Verify can view own workouts
  - Verify can edit own workouts
  - Verify can delete own workouts

- [ ] **Other User Data**
  - Login as test1
  - Try to access test2's workout directly (via URL manipulation)
  - Verify access is denied
  - Verify error message is shown

### 5.2 Social Data Access

- [ ] **Friends' Workouts**
  - Login as test1
  - Verify can view test2's workouts in social feed (if friends)
  - Verify cannot edit test2's workouts
  - Verify cannot delete test2's workouts

- [ ] **Non-Friends' Workouts**
  - Login as test1
  - Create test3 user (not friends with test1)
  - Verify test3's workouts do NOT appear in test1's feed

### 5.3 Leaderboard Access

- [ ] **Public Leaderboard**
  - Verify all users can view global leaderboard
  - Verify leaderboard data is read-only
  - Verify cannot modify leaderboard data

### 5.4 Profile Access

- [ ] **Public Profiles**
  - Verify can view any user's public profile
  - Verify can only edit own profile
  - Verify cannot modify other users' profiles

---

## 6. Edge Cases and Error Handling

### 6.1 Network Errors

- [ ] **Intermittent Connection**
  - Toggle network on/off rapidly
  - Verify app handles gracefully
  - Verify no crashes
  - Verify sync queue processes correctly

- [ ] **Slow Connection**
  - Throttle network to 3G speed
  - Create workout
  - Verify loading indicators appear
  - Verify operation completes eventually

### 6.2 Data Validation

- [ ] **Invalid Workout Data**
  - Try to create workout with empty name → Should show error
  - Try to add exercise with 0 sets → Should show error
  - Try to add exercise with negative weight → Should show error

- [ ] **Invalid Profile Data**
  - Try to set empty username → Should show error
  - Try to set username with special chars → Should show error

### 6.3 Concurrent Operations

- [ ] **Multiple Devices**
  - Login on web and Android simultaneously
  - Create workout on web
  - Verify appears on Android after refresh
  - Create workout on Android
  - Verify appears on web after refresh

### 6.4 Session Expiration

- [ ] **Token Refresh**
  - Login and wait for token to expire (1 hour)
  - Perform an action (create workout)
  - Verify token refreshes automatically
  - Verify action completes successfully

- [ ] **Expired Session**
  - Manually delete tokens from storage
  - Try to perform an action
  - Verify redirects to login
  - Verify error message is shown

---

## 7. Performance Verification

### 7.1 Load Times

- [ ] App startup time < 3 seconds
- [ ] Workout list loads < 1 second
- [ ] Social feed loads < 2 seconds
- [ ] Profile page loads < 1 second

### 7.2 Responsiveness

- [ ] List scrolling is smooth (60fps)
- [ ] Button clicks respond instantly
- [ ] Form inputs have no lag
- [ ] Animations are smooth

### 7.3 Memory Usage

- [ ] No memory leaks after extended use
- [ ] App uses < 100MB RAM on mobile
- [ ] No crashes after 30 minutes of use

---

## 8. Accessibility (Optional)

- [ ] Screen reader support (TalkBack on Android)
- [ ] Keyboard navigation on web
- [ ] Sufficient color contrast
- [ ] Touch targets are large enough (44x44px minimum)

---

## Test Results Summary

### Platform: ___________
### Date: ___________
### Tester: ___________

| Test Section | Pass | Fail | Notes |
|--------------|------|------|-------|
| 1. Web (Chrome) - Auth | ☐ | ☐ | |
| 1. Web (Chrome) - Workouts | ☐ | ☐ | |
| 1. Web (Chrome) - Gamification | ☐ | ☐ | |
| 1. Web (Chrome) - Social | ☐ | ☐ | |
| 1. Web (Chrome) - Profile | ☐ | ☐ | |
| 1. Web (Chrome) - Offline | ☐ | ☐ | |
| 2. Web (Safari) | ☐ | ☐ | |
| 3. Android - All Features | ☐ | ☐ | |
| 4. Polling Updates | ☐ | ☐ | |
| 5. RLS Verification | ☐ | ☐ | |
| 6. Edge Cases | ☐ | ☐ | |
| 7. Performance | ☐ | ☐ | |

### Critical Issues Found:
1. 
2. 
3. 

### Minor Issues Found:
1. 
2. 
3. 

### Recommendations:
1. 
2. 
3. 

---

## Notes

- This checklist should be completed for each major release
- Document all issues found with screenshots/videos
- Prioritize critical issues that block core functionality
- Minor UI/UX issues can be addressed in future iterations
- Update this checklist as new features are added
