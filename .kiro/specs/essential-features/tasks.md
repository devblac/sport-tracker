# Essential Features - Implementation Tasks

## Phase 1: Rest Timer (Priority: HIGH, Effort: 2-3 hours)

### Task 1.1: Create RestTimer Component
- [ ] Create `components/RestTimer.tsx`
- [ ] Implement circular progress indicator
- [ ] Add countdown display (large numbers)
- [ ] Add Skip and +30s buttons
- [ ] Implement haptic feedback at milestones
- [ ] Add audio notification (optional, user setting)
- [ ] Test with app backgrounding/foregrounding

### Task 1.2: Integrate Timer into Workout Flow
- [ ] Update `app/workout/[id].tsx` to show timer after set completion
- [ ] Add timer settings to user preferences
- [ ] Persist timer state in AsyncStorage
- [ ] Add timer configuration in Settings screen

### Task 1.3: Testing
- [ ] Test timer accuracy
- [ ] Test background/foreground transitions
- [ ] Test haptic feedback on different devices
- [ ] Test skip and add time functionality

**Acceptance**: Timer works reliably, persists across app states, provides clear feedback

---

## Phase 2: Workout Comments (Priority: HIGH, Effort: 1 hour)

### Task 2.1: Add Comment Field to Database
- [ ] Run migration to add `comment` column to `workouts` table
- [ ] Update TypeScript types to include comment field

### Task 2.2: Create Comment UI Components
- [ ] Create `components/CommentInput.tsx`
- [ ] Add comment field to workout completion screen
- [ ] Add comment display to workout detail view
- [ ] Add edit functionality to existing workouts
- [ ] Add character counter (500 max)

### Task 2.3: Update Workout Hooks
- [ ] Update `useWorkouts` hook to handle comments
- [ ] Add comment to workout save/update operations
- [ ] Update WorkoutCard to show comment preview

**Acceptance**: Users can add, edit, and view comments on workouts

---

## Phase 3: Personal Records (Priority: HIGH, Effort: 4-5 hours)

### Task 3.1: Database Schema
- [ ] Create `personal_records` table migration
- [ ] Add RLS policies for personal_records
- [ ] Create indexes for performance
- [ ] Update TypeScript types

### Task 3.2: PR Calculation Logic
- [ ] Create `lib/prCalculator.ts`
- [ ] Implement 1RM calculation: `weight × (1 + reps / 30)`
- [ ] Implement PR detection on workout save
- [ ] Add PR comparison logic

### Task 3.3: PR Badge Component
- [ ] Create `components/PRBadge.tsx`
- [ ] Add gold star icon and "NEW PR!" text
- [ ] Implement entrance animation
- [ ] Show improvement percentage

### Task 3.4: PR List Screen
- [ ] Create `app/records/index.tsx`
- [ ] Display PRs grouped by exercise
- [ ] Add filter by muscle group
- [ ] Add filter by time period
- [ ] Add search functionality
- [ ] Show PR history timeline

### Task 3.5: Integration
- [ ] Update workout save flow to detect PRs
- [ ] Show PR celebration modal on new PR
- [ ] Award XP bonus for PRs (+50 XP)
- [ ] Add PR badge to exercise cards
- [ ] Add "Personal Records" link to Profile tab

### Task 3.6: PR Hook
- [ ] Create `hooks/usePersonalRecords.ts`
- [ ] Implement PR fetching
- [ ] Implement PR filtering
- [ ] Cache PR data

**Acceptance**: PRs automatically detected, displayed with badges, viewable in dedicated screen

---

## Phase 4: Analytics & Charts (Priority: MEDIUM, Effort: 6-8 hours)

### Task 4.1: Install Chart Library
- [ ] Evaluate chart libraries (react-native-chart-kit vs victory-native)
- [ ] Install chosen library
- [ ] Create chart wrapper components

### Task 4.2: Data Aggregation Logic
- [ ] Create `lib/chartData.ts`
- [ ] Implement volume calculation
- [ ] Implement frequency grouping by week
- [ ] Implement muscle distribution calculation
- [ ] Implement exercise progress tracking
- [ ] Add caching for calculated data

### Task 4.3: Chart Components
- [ ] Create `components/VolumeChart.tsx`
- [ ] Create `components/FrequencyChart.tsx`
- [ ] Create `components/MuscleDistributionChart.tsx`
- [ ] Create `components/ExerciseProgressChart.tsx`
- [ ] Add time period selector component

### Task 4.4: Analytics Screen
- [ ] Create `app/analytics/index.tsx`
- [ ] Add time period filter (1M, 3M, 6M, 1Y, All)
- [ ] Display all charts with proper spacing
- [ ] Add loading states
- [ ] Add empty states with helpful messages
- [ ] Optimize for performance (lazy loading)

### Task 4.5: Analytics Hook
- [ ] Create `hooks/useAnalytics.ts`
- [ ] Implement data fetching
- [ ] Implement caching strategy
- [ ] Add memoization for expensive calculations

### Task 4.6: Integration
- [ ] Add "Analytics" section to Profile tab
- [ ] Add navigation to analytics screen
- [ ] Test with various data sizes
- [ ] Optimize query performance

**Acceptance**: Charts display correctly, load quickly, handle edge cases gracefully

---

## Phase 5: Workout Plans (Priority: MEDIUM, Effort: 8-10 hours)

### Task 5.1: Database Schema
- [ ] Create `workout_plans` table migration
- [ ] Create `plan_workouts` table migration
- [ ] Create `user_plan_progress` table migration
- [ ] Add RLS policies for all plan tables
- [ ] Create indexes for performance
- [ ] Update TypeScript types

### Task 5.2: Default System Plans
- [ ] Create `lib/defaultPlans.ts`
- [ ] Define Beginner Full Body plan (4 weeks)
- [ ] Define PPL Split plan (6 weeks)
- [ ] Define Strength Builder plan (8 weeks)
- [ ] Create migration to seed system plans

### Task 5.3: Plan Components
- [ ] Create `components/PlanCard.tsx`
- [ ] Create `components/PlanWeekView.tsx`
- [ ] Create `components/PlanProgressBar.tsx`
- [ ] Add difficulty indicator component

### Task 5.4: Plans List Screen
- [ ] Create `app/plans/index.tsx`
- [ ] Display active plan at top
- [ ] Display system plans
- [ ] Display user custom plans
- [ ] Add "Create Plan" button
- [ ] Add search/filter functionality

### Task 5.5: Plan Detail Screen
- [ ] Create `app/plans/[id].tsx`
- [ ] Show plan overview
- [ ] Show weekly schedule
- [ ] Show workout list by week
- [ ] Add "Start Plan" button
- [ ] Add "Continue Plan" button
- [ ] Add progress indicator
- [ ] Add edit/duplicate buttons

### Task 5.6: Plan Builder
- [ ] Create `app/plans/new.tsx`
- [ ] Step 1: Plan details form
- [ ] Step 2: Add workouts per week
- [ ] Step 3: Assign templates or create workouts
- [ ] Step 4: Review and save
- [ ] Add validation

### Task 5.7: Plan Progress Logic
- [ ] Create `lib/planScheduler.ts`
- [ ] Implement plan activation
- [ ] Implement week completion detection
- [ ] Implement plan completion detection
- [ ] Add celebration animations

### Task 5.8: Plans Hook
- [ ] Create `hooks/usePlans.ts`
- [ ] Implement plan CRUD operations
- [ ] Implement progress tracking
- [ ] Implement plan activation/deactivation

### Task 5.9: Integration
- [ ] Add "Workout Plans" button to Workouts tab
- [ ] Update Home tab to show active plan
- [ ] Link workouts to active plan
- [ ] Add plan completion achievement
- [ ] Test full plan lifecycle

**Acceptance**: Users can browse, start, follow, and complete workout plans

---

## Phase 6: Profile Tab Reorganization (Priority: MEDIUM, Effort: 2 hours)

### Task 6.1: Update Profile Screen Layout
- [ ] Update `app/(tabs)/profile.tsx`
- [ ] Add "Personal Records" section with navigation
- [ ] Add "Analytics" section with navigation
- [ ] Reorganize existing sections (Stats, Achievements, Settings)
- [ ] Add icons for each section
- [ ] Improve visual hierarchy

### Task 6.2: Update Home Tab
- [ ] Update `app/(tabs)/index.tsx`
- [ ] Show active plan if user has one
- [ ] Show today's scheduled workout
- [ ] Add quick stats (workouts this week, current streak)
- [ ] Add recent achievements section

**Acceptance**: Profile and Home tabs have clear, intuitive navigation to all features

---

## Phase 7: Testing & Polish (Priority: HIGH, Effort: 3-4 hours)

### Task 7.1: Integration Testing
- [ ] Test complete workout flow with timer
- [ ] Test PR detection and display
- [ ] Test analytics with various data sizes
- [ ] Test plan activation and completion
- [ ] Test offline functionality

### Task 7.2: Performance Testing
- [ ] Profile chart rendering performance
- [ ] Test with 100+ workouts
- [ ] Test with 50+ PRs
- [ ] Optimize slow queries
- [ ] Add loading states where needed

### Task 7.3: UX Polish
- [ ] Add loading skeletons
- [ ] Add empty states with helpful CTAs
- [ ] Add success animations
- [ ] Add error handling with retry
- [ ] Test on different screen sizes

### Task 7.4: Documentation
- [ ] Update README with new features
- [ ] Add feature documentation
- [ ] Update user guide
- [ ] Document database schema changes

**Acceptance**: All features work smoothly, handle errors gracefully, provide good UX

---

## Phase 8: Deployment (Priority: HIGH, Effort: 1-2 hours)

### Task 8.1: Database Migrations
- [ ] Review all migrations
- [ ] Test migrations on staging
- [ ] Run migrations on production
- [ ] Verify RLS policies

### Task 8.2: Build & Deploy
- [ ] Run type check
- [ ] Run linter
- [ ] Build for web
- [ ] Build Android APK
- [ ] Test builds
- [ ] Deploy to production

### Task 8.3: Monitoring
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Fix critical issues

**Acceptance**: All features deployed successfully, no critical bugs

---

## Summary

**Total Estimated Effort**: 27-35 hours (4-5 days)

**Priority Order**:
1. Rest Timer (immediate value)
2. Workout Comments (quick win)
3. Personal Records (core feature)
4. Analytics & Charts (high value)
5. Workout Plans (long-term engagement)

**Dependencies**:
- Rest Timer: None
- Comments: None
- PRs: Requires workout tracking
- Analytics: Requires workout data
- Plans: Requires templates system

**Risk Mitigation**:
- Start with highest value, lowest risk features
- Test each phase before moving to next
- Keep features simple for MVP
- Add complexity in future iterations
