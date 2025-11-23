# Complete MVP Features - Implementation Tasks

## Implementation Order

**Priority**: HIGH → MEDIUM → LOW
**Approach**: Implement in order, test each phase before moving to next

---

## Phase 1: Rest Timer (HIGH Priority, 2-3 hours) ✅ COMPLETE

### 1.1 Create RestTimer Component
- [x] Create `components/RestTimer.tsx`
- [x] Implement circular progress indicator with color coding
- [x] Add large countdown display
- [x] Add play/pause, reset, +15s/-15s, +30s, +1m buttons
- [x] Implement haptic feedback (Expo Haptics)
- [x] Add audio notification (Expo Audio)
- [x] Preset durations (30s, 1m, 1.5m, 2m, 3m)

### 1.2 Integration
- [x] Add timer button to WorkoutForm after each exercise
- [x] Install expo-haptics and expo-av dependencies
- [x] Create unit tests for RestTimer
- [x] Modal overlay with bottom sheet design

**Acceptance**: Timer works with haptics, presets, and quick adjustments

**Note**: Timer state persistence and background handling deferred (not critical for MVP)

---

## Phase 2: Workout Comments (HIGH Priority, 1 hour)

### 2.1 Database Migration
- [x] Create migration: `ALTER TABLE workouts ADD COLUMN comment TEXT`




- [x] Apply migration via Supabase MCP


- [x] Update TypeScript types
















### 2.2 UI Components
- [x] Create `components/CommentInput.tsx`

- [x] Add comment field to workout completion





- [x] Add comment to workout detail view




- [x] Add character counter (500 max)




- [x] Show comment preview on WorkoutCard





### 2.3 Hook Updates
- [x] Update `useWorkouts` to handle comments




- [x] Add comment to save/update operations

- [x] Test comment CRUD operations



**Acceptance**: Users can add, edit, view comments on workouts

---

## Phase 3: Personal Records (HIGH Priority, 4-5 hours)

### 3.1 Database Schema
- [x] Create `personal_records` table migration



-

- [x] Add RLS policies




- [x] Create indexes








- [x] Apply via Supabase MCP




- [ ] Update TypeScript types
-

- [x] Create `lib/prCalculator.ts`







- [ ] Create `lib/prCalculator.ts`

-

- [x] Implement 1RM calculation


-

- [x] Implement PR detection





- [x] Add PR comparison logic




### 3.3 PR Components
- [ ] Create `components/PRBadge.tsx`
- [ ] Create `components/CelebrationModal.tsx`
- [ ] Add PR celebration animation
- [ ] Show improvement percentage

### 3.4 PR List Screen
- [ ] Create `app/records/index.tsx`
- [ ] Display PRs by exercise
- [ ] Add filters (muscle group, time period)
- [ ] Add search functionality
- [ ] Show PR history timeline

### 3.5 PR Hook
- [ ] Create `hooks/usePersonalRecords.ts`
- [ ] Implement PR fetching
- [ ] Implement PR filtering
- [ ] Add caching

### 3.6 Integration
- [ ] Detect PRs on workout save
- [ ] Show PR celebration modal
- [ ] Award XP bonus (+50 XP)
- [ ] Add PR badge to exercises
- [ ] Add "Personal Records" to Profile tab

**Acceptance**: PRs auto-detected, celebrated, viewable in dedicated screen

---

## Phase 4: Analytics & Charts (MEDIUM Priority, 6-8 hours)

### 4.1 Chart Library Setup
- [ ] Install `react-native-chart-kit` or `victory-native`
- [ ] Create chart wrapper components
- [ ] Test basic chart rendering

### 4.2 Data Aggregation
- [ ] Create `lib/chartData.ts`
- [ ] Implement volume calculation
- [ ] Implement frequency grouping
- [ ] Implement muscle distribution
- [ ] Implement exercise progress
- [ ] Add caching logic

### 4.3 Chart Components
- [ ] Create `components/VolumeChart.tsx`
- [ ] Create `components/FrequencyChart.tsx`
- [ ] Create `components/MuscleDistributionChart.tsx`
- [ ] Create `components/ExerciseProgressChart.tsx`
- [ ] Add time period selector

### 4.4 Analytics Screen
- [ ] Create `app/analytics/index.tsx`
- [ ] Add time period filter
- [ ] Display all charts
- [ ] Add loading states
- [ ] Add empty states
- [ ] Optimize performance

### 4.5 Analytics Hook
- [ ] Create `hooks/useAnalytics.ts`
- [ ] Implement data fetching
- [ ] Implement caching
- [ ] Add memoization

### 4.6 Integration
- [ ] Add "Analytics" to Profile tab
- [ ] Test with various data sizes
- [ ] Optimize queries

**Acceptance**: Charts display correctly, load quickly, handle edge cases

---

## Phase 5: Workout Plans (MEDIUM Priority, 8-10 hours)

### 5.1 Database Schema
- [ ] Create `workout_plans` table migration
- [ ] Create `plan_workouts` table migration
- [ ] Create `user_plan_progress` table migration
- [ ] Add RLS policies
- [ ] Create indexes
- [ ] Apply via Supabase MCP
- [ ] Update TypeScript types

### 5.2 Default Plans
- [ ] Create `lib/defaultPlans.ts`
- [ ] Define Beginner Full Body (4 weeks)
- [ ] Define PPL Split (6 weeks)
- [ ] Define Strength Builder (8 weeks)
- [ ] Create seed migration

### 5.3 Plan Components
- [ ] Create `components/PlanCard.tsx`
- [ ] Create `components/PlanWeekView.tsx`
- [ ] Create `components/PlanProgressBar.tsx`

### 5.4 Plans List Screen
- [ ] Create `app/plans/index.tsx`
- [ ] Display active plan
- [ ] Display system plans
- [ ] Display user plans
- [ ] Add "Create Plan" button

### 5.5 Plan Detail Screen
- [ ] Create `app/plans/[id].tsx`
- [ ] Show plan overview
- [ ] Show weekly schedule
- [ ] Show workout list
- [ ] Add "Start Plan" button
- [ ] Add progress indicator

### 5.6 Plan Builder
- [ ] Create `app/plans/new.tsx`
- [ ] Plan details form
- [ ] Add workouts per week
- [ ] Assign templates
- [ ] Review and save

### 5.7 Plan Logic
- [ ] Create `lib/planScheduler.ts`
- [ ] Implement plan activation
- [ ] Implement week completion
- [ ] Implement plan completion
- [ ] Add celebrations

### 5.8 Plans Hook
- [ ] Create `hooks/usePlans.ts`
- [ ] Implement CRUD operations
- [ ] Implement progress tracking
- [ ] Add caching

### 5.9 Integration
- [ ] Add "Workout Plans" to Workouts tab
- [ ] Update Home tab for active plan
- [ ] Link workouts to plan
- [ ] Add plan completion achievement

**Acceptance**: Users can browse, start, follow, complete plans

---

## Phase 6: Exercise Library Enhancement (MEDIUM Priority, 2-3 hours)

### 6.1 Exercise Detail Screen
- [ ] Create `app/exercises/[id].tsx`
- [ ] Show exercise details
- [ ] Show instructions
- [ ] Show muscle groups
- [ ] Add "Add to Workout" button

### 6.2 Library Improvements
- [ ] Enhance `app/exercises/index.tsx`
- [ ] Improve search UI
- [ ] Improve filter UI
- [ ] Add category tabs
- [ ] Add equipment filter

### 6.3 Integration
- [ ] Add "Exercise Library" to Workouts tab
- [ ] Link from workout creation
- [ ] Test search and filters

**Acceptance**: Exercise library easily accessible, searchable, filterable

---

## Phase 7: Template Visibility (HIGH Priority, 1-2 hours)

### 7.1 Template Enhancements
- [ ] Create template preview cards
- [ ] Improve template detail view
- [ ] Add template categories
- [ ] Show exercise count

### 7.2 Integration
- [ ] Ensure "Browse Templates" button visible ✅ DONE
- [ ] Improve template-to-workout flow
- [ ] Test template usage

**Acceptance**: Templates easily discoverable and usable

---

## Phase 8: Gamification Visibility (MEDIUM Priority, 2-3 hours)

### 8.1 Celebration Components
- [ ] Enhance `components/CelebrationModal.tsx`
- [ ] Add level-up celebration
- [ ] Add achievement unlock celebration
- [ ] Add streak milestone celebration
- [ ] Add confetti animation

### 8.2 Profile Enhancements
- [ ] Add XP progress bar to profile header
- [ ] Make level more prominent
- [ ] Add achievement showcase
- [ ] Add streak display

### 8.3 Home Tab Enhancements
- [ ] Add XP progress to home
- [ ] Show recent achievements
- [ ] Show current streak
- [ ] Add quick stats

### 8.4 Celebrations
- [ ] Trigger level-up modal
- [ ] Trigger achievement modal
- [ ] Trigger streak milestone modal
- [ ] Test all celebrations

**Acceptance**: Gamification features prominent and celebrated

---

## Phase 9: Empty & Loading States (MEDIUM Priority, 2-3 hours)

### 9.1 Empty State Component
- [ ] Create `components/EmptyState.tsx`
- [ ] Add icon, title, message, CTA
- [ ] Make reusable

### 9.2 Empty States
- [ ] Add to workouts list
- [ ] Add to friends list
- [ ] Add to achievements
- [ ] Add to PRs
- [ ] Add to analytics
- [ ] Add to plans

### 9.3 Loading States
- [ ] Enhance skeleton loaders
- [ ] Add to all list screens
- [ ] Add to charts
- [ ] Add to profile

**Acceptance**: All screens have helpful empty and loading states

---

## Phase 10: Onboarding (LOW Priority, 3-4 hours)

### 10.1 Onboarding Screens
- [ ] Create `app/onboarding/index.tsx`
- [ ] Screen 1: Welcome
- [ ] Screen 2: Track Workouts
- [ ] Screen 3: Earn XP
- [ ] Screen 4: Compete with Friends
- [ ] Screen 5: Set Goal

### 10.2 Onboarding Logic
- [ ] Create `hooks/useOnboarding.ts`
- [ ] Check if first launch
- [ ] Save goal and experience level
- [ ] Mark onboarding complete
- [ ] Never show again

### 10.3 Integration
- [ ] Show on first app launch
- [ ] Add skip button
- [ ] Save user preferences
- [ ] Test flow

**Acceptance**: Onboarding shows once, helps new users

---

## Phase 11: Profile & Home Tab Reorganization (MEDIUM Priority, 2 hours)

### 11.1 Profile Tab
- [ ] Update `app/(tabs)/profile.tsx`
- [ ] Add Personal Records section
- [ ] Add Analytics section
- [ ] Reorganize sections
- [ ] Add icons
- [ ] Improve hierarchy

### 11.2 Home Tab
- [ ] Update `app/(tabs)/index.tsx`
- [ ] Show active plan
- [ ] Show today's workout
- [ ] Add quick stats
- [ ] Add recent achievements
- [ ] Add XP progress

**Acceptance**: Profile and Home tabs well-organized, intuitive

---

## Phase 12: Testing & Polish (HIGH Priority, 3-4 hours)

### 12.1 Integration Testing
- [ ] Test complete workout flow with timer
- [ ] Test PR detection and celebration
- [ ] Test analytics with various data
- [ ] Test plan lifecycle
- [ ] Test offline functionality

### 12.2 Performance Testing
- [ ] Profile chart rendering
- [ ] Test with 100+ workouts
- [ ] Test with 50+ PRs
- [ ] Optimize slow queries
- [ ] Add loading states

### 12.3 UX Polish
- [ ] Add loading skeletons
- [ ] Add empty states
- [ ] Add success animations
- [ ] Add error handling
- [ ] Test on different screens

### 12.4 Documentation
- [ ] Update README
- [ ] Add feature docs
- [ ] Update user guide
- [ ] Document schema changes

**Acceptance**: All features work smoothly, good UX

---

## Phase 13: Deployment (HIGH Priority, 1-2 hours)

### 13.1 Database Migrations
- [ ] Review all migrations
- [ ] Test on staging
- [ ] Run on production
- [ ] Verify RLS policies

### 13.2 Build & Deploy
- [ ] Run type check
- [ ] Run linter
- [ ] Build for web
- [ ] Build Android APK
- [ ] Test builds
- [ ] Deploy

### 13.3 Monitoring
- [ ] Monitor error logs
- [ ] Check performance
- [ ] Gather feedback
- [ ] Fix critical issues

**Acceptance**: All features deployed, no critical bugs

---

## Summary

**Total Effort**: 37-50 hours (5-7 days)

**Critical Path**:
1. Rest Timer (immediate value)
2. Workout Comments (quick win)
3. Personal Records (core feature)
4. Analytics (high value)
5. Workout Plans (engagement)

**Dependencies**:
- Rest Timer: None
- Comments: None
- PRs: Workout tracking ✅
- Analytics: Workout data ✅
- Plans: Templates ✅

**Milestones**:
- Day 1-2: Rest Timer, Comments, PRs
- Day 3-4: Analytics, Charts
- Day 5-6: Workout Plans
- Day 7: Polish, Testing, Deploy
