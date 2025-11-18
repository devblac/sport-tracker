# Complete MVP Features - Requirements

## Overview

This spec consolidates all remaining features needed to complete the LiftFire React Native MVP. These features were identified as missing or incomplete during the refactor from the legacy web app.

## Feature Categories

### 1. Workout Enhancement Features
- Rest Timer
- Workout Comments
- Exercise Library Browser
- Template System (visible and usable)

### 2. Progress Tracking Features
- Personal Records (PRs)
- Analytics & Charts
- Progress Photos (future)
- Body Measurements (future)

### 3. Planning & Structure Features
- Workout Plans (multi-week programs)
- Workout Templates (improved visibility)
- Exercise Library (searchable, filterable)

### 4. Gamification Enhancements
- Achievement System (already exists, needs visibility)
- Streak Tracking (already exists, needs prominence)
- XP System (already exists, needs better feedback)
- Level System (already exists, needs celebration)

### 5. Social Features (Already Implemented)
- Friends System ✅
- Activity Feed ✅
- Likes ✅
- Leaderboard ✅

### 6. UI/UX Improvements
- Dark Mode (already exists via theme system)
- Onboarding Flow
- Empty States
- Loading States
- Error Handling

## Detailed Requirements

### 1. Rest Timer

**User Story**: As a user, I want a rest timer between sets so I can maintain consistent rest periods.

**Requirements**:
- Auto-start timer after completing a set (configurable)
- Default rest times: 30s, 60s, 90s, 120s, 180s
- Visual countdown with circular progress
- Haptic feedback at 10s, 5s, 0s
- Audio notification at 0s (optional)
- Skip rest button
- Add 30s button
- Persist timer if app backgrounds
- Resume timer when app returns

**Acceptance Criteria**:
- Timer starts automatically after set completion
- User can configure default rest time in settings
- Timer persists across app states
- Haptic and audio feedback work correctly
- User can skip or extend rest time

---

### 2. Personal Records (PRs)

**User Story**: As a user, I want to track my personal records so I can see my strength progress.

**Requirements**:
- Auto-detect PRs using 1RM formula: `weight × (1 + reps / 30)`
- Show PR badge on exercises that are new PRs
- PR celebration animation when achieved
- PR history per exercise
- Filter PRs by exercise, muscle group, time period
- Award XP bonus for PRs (+50 XP)
- PR achievement unlocks

**Database Schema**:
```sql
CREATE TABLE personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  reps INTEGER NOT NULL,
  estimated_1rm DECIMAL(10,2) NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  achieved_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pr_user_exercise ON personal_records(user_id, exercise_id);
CREATE INDEX idx_pr_achieved_at ON personal_records(achieved_at DESC);
```

**Acceptance Criteria**:
- PRs automatically detected on workout save
- PR badge shows on new PRs
- PR celebration animation plays
- PR history accessible from Profile → Personal Records
- PRs filterable and searchable
- XP bonus awarded for PRs

---

### 3. Workout Comments

**User Story**: As a user, I want to add comments to workouts so I can remember how I felt.

**Requirements**:
- Comment field on workout completion screen
- Edit comments on past workouts
- 500 character limit
- Optional field
- Show comment preview on workout cards
- Full comment visible on workout detail

**Database Change**:
```sql
ALTER TABLE workouts ADD COLUMN comment TEXT;
```

**Acceptance Criteria**:
- User can add comment when completing workout
- User can edit comment on past workouts
- Comment preview shows on workout cards
- Full comment visible on workout detail
- Character counter shows remaining characters

---

### 4. Analytics & Charts

**User Story**: As a user, I want to see my progress visualized so I understand my training trends.

**Requirements**:

**Chart Types**:
1. **Workout Volume Chart**: Total volume (sets × reps × weight) over time
2. **Workout Frequency Chart**: Workouts per week over last 12 weeks
3. **Muscle Group Distribution**: Pie/bar chart of muscle groups trained
4. **Exercise Progress Chart**: Strength progress for specific exercises
5. **XP Progress Chart**: XP earned over time

**Features**:
- Time period filters: 1M, 3M, 6M, 1Y, All Time
- Exercise selector for progress chart
- Export data as CSV (future)
- Share charts (future)

**Technical**:
- Use `react-native-chart-kit` or `victory-native`
- Cache calculated data
- Lazy load charts
- Optimize for large datasets (sample if > 100 workouts)

**Acceptance Criteria**:
- All 5 chart types display correctly
- Time period filters work
- Charts load in < 500ms
- Charts handle empty data gracefully
- Charts accessible from Profile → Analytics

---

### 5. Workout Plans

**User Story**: As a user, I want to follow structured workout plans so I can achieve specific goals.

**Requirements**:

**Plan Structure**:
- Multi-week programs (4-12 weeks typical)
- Each plan has: name, description, duration, difficulty (1-5), goal
- Plans contain scheduled workouts by week and day
- Track progress (current week, completed workouts)
- Mark workouts as complete within plan
- Plan completion celebration

**Default System Plans**:
1. **Beginner Full Body** (4 weeks, 3x/week)
2. **Push/Pull/Legs Split** (6 weeks, 6x/week)
3. **Strength Builder** (8 weeks, 4x/week)

**User Plans**:
- Create custom plans
- Edit user-created plans
- Duplicate any plan (system or user)
- Delete user-created plans

**Database Schema**:
```sql
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  goal TEXT, -- 'strength', 'hypertrophy', 'endurance', 'general'
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE plan_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  workout_template_id UUID REFERENCES workout_templates(id),
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_plan_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
  current_week INTEGER DEFAULT 1,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, plan_id, is_active)
);
```

**Acceptance Criteria**:
- User can browse system and custom plans
- User can start a plan
- User can see current week's workouts
- User can mark workouts as complete
- Progress tracked automatically
- Plan completion triggers celebration
- Plans accessible from Workouts → Workout Plans

---

### 6. Exercise Library Enhancement

**User Story**: As a user, I want to browse exercises so I can learn new movements.

**Requirements**:
- Searchable exercise library (20 default exercises)
- Filter by category (strength, cardio, flexibility)
- Filter by muscle group
- Filter by equipment type
- Exercise detail view with instructions
- Add exercise to workout from library

**Current State**:
- Library exists with 20 exercises
- Components exist but not well integrated

**Improvements Needed**:
- Better navigation to exercise library
- Exercise detail screen
- Add to workout functionality
- Search and filter UI

**Acceptance Criteria**:
- Exercise library accessible from workout creation
- Search works correctly
- Filters work correctly
- Exercise details show instructions
- Can add exercise to workout from library

---

### 7. Template System Visibility

**User Story**: As a user, I want to easily find and use workout templates.

**Requirements**:
- Templates visible on Workouts screen
- "Browse Templates" button prominent
- Template preview shows exercises
- One-tap to start workout from template
- Template categories (Push, Pull, Legs, Full Body)

**Current State**:
- 4 system templates exist
- Template screen exists
- Not visible from main workouts screen ✅ FIXED

**Improvements Needed**:
- Template preview cards
- Better template detail view
- Easier template-to-workout flow

**Acceptance Criteria**:
- Templates easily discoverable
- Template preview shows key info
- Starting workout from template is intuitive
- Template categories clear

---

### 8. Gamification Visibility

**User Story**: As a user, I want to see my achievements and progress prominently.

**Requirements**:

**Current State** (Already Implemented):
- XP system ✅
- Level system ✅
- Streak tracking ✅
- Achievements (5-10 basic) ✅

**Improvements Needed**:
- More prominent XP display
- Level-up celebration animation
- Achievement unlock celebration
- Streak milestone celebrations
- Progress bar on profile
- Achievement showcase

**Acceptance Criteria**:
- XP and level visible on profile header
- Level-up triggers celebration
- Achievement unlocks show modal
- Streak milestones celebrated (7, 30, 100 days)
- Achievements browsable and filterable

---

### 9. Onboarding Flow

**User Story**: As a new user, I want guidance on how to use the app.

**Requirements**:
- Welcome screen on first launch
- Quick tutorial (3-4 screens)
- Goal setting (strength, muscle, endurance, general)
- Experience level (beginner, intermediate, advanced)
- Skip option
- Never show again after completion

**Screens**:
1. Welcome to LiftFire
2. Track Your Workouts
3. Earn XP & Level Up
4. Compete with Friends
5. Set Your Goal

**Acceptance Criteria**:
- Onboarding shows on first launch only
- User can skip
- Goal and experience saved to profile
- Onboarding never shows again

---

### 10. Empty States & Loading States

**User Story**: As a user, I want helpful guidance when screens are empty.

**Requirements**:

**Empty States Needed**:
- No workouts yet → "Create your first workout"
- No friends yet → "Find friends to compete with"
- No achievements yet → "Complete workouts to unlock achievements"
- No PRs yet → "Keep training to set personal records"
- No analytics data → "Complete more workouts to see your progress"

**Loading States Needed**:
- Workout list loading → Skeleton cards
- Profile loading → Skeleton profile
- Charts loading → Skeleton charts
- Feed loading → Skeleton feed items

**Acceptance Criteria**:
- All empty states have helpful CTAs
- All loading states use skeleton loaders
- Empty states are encouraging, not discouraging
- Loading states match final content layout

---

## Information Architecture

### Navigation Structure

```
Bottom Tabs (4):
├── Home
│   ├── Active Plan (if any)
│   ├── Today's Workout
│   ├── Quick Stats (workouts this week, streak)
│   ├── Recent Achievements
│   └── XP Progress Bar
│
├── Workouts
│   ├── My Workouts (list)
│   ├── Browse Templates (button) ✅
│   ├── Workout Plans (button) ← NEW
│   ├── Exercise Library (button) ← NEW
│   └── + Create Workout (FAB)
│
├── Social
│   ├── Activity Feed
│   ├── Friends
│   └── Leaderboard
│
└── Profile
    ├── Profile Header (avatar, name, level, XP)
    ├── Stats Overview
    ├── Personal Records ← NEW
    ├── Analytics & Charts ← NEW
    ├── Achievements
    ├── Settings
    └── Logout
```

---

## Success Metrics

### Engagement
- 70%+ users use rest timer
- 50%+ users view analytics within first week
- 30%+ users start a workout plan within first month
- 60%+ users use templates

### Retention
- Users with active plans: 2x retention
- Users tracking PRs: 30% more workouts
- Analytics viewers: 40% more frequent returns

### Performance
- Rest timer: < 50ms response
- PR detection: < 200ms per workout
- Charts: < 500ms render time
- Plan loading: < 300ms

---

## Out of Scope (Future)

- Progress photos
- Body measurements
- Nutrition tracking
- Advanced analytics (predictions, percentiles)
- Social sharing to external platforms
- Video demonstrations
- AI workout recommendations
- Wearable integrations
- Real-time updates (using polling for MVP)
- Push notifications
- Comments on workouts (social)
- Groups and communities

---

## Technical Constraints

### Performance
- All files < 500 lines
- Direct Supabase calls (no abstractions)
- Lazy loading for heavy features
- Aggressive caching
- Optimize for free tier

### Security
- RLS on all tables
- Input validation with Zod
- Sanitize user content
- No service keys in client

### Compatibility
- React Native (Expo SDK 54)
- Web + Android + iOS
- Offline support for workouts only
- Online required for social features

---

## Timeline Estimate

| Feature | Effort | Priority |
|---------|--------|----------|
| Rest Timer | 2-3h | HIGH |
| Workout Comments | 1h | HIGH |
| Personal Records | 4-5h | HIGH |
| Analytics & Charts | 6-8h | MEDIUM |
| Workout Plans | 8-10h | MEDIUM |
| Exercise Library | 2-3h | MEDIUM |
| Template Visibility | 1-2h | HIGH |
| Gamification Visibility | 2-3h | MEDIUM |
| Onboarding | 3-4h | LOW |
| Empty/Loading States | 2-3h | MEDIUM |

**Total**: 31-44 hours (5-6 days)

---

## Dependencies

- Existing workout tracking ✅
- Existing template system ✅
- Existing exercise library ✅
- Existing gamification system ✅
- Existing social features ✅
- Chart library (to be installed)
- Supabase database with RLS ✅

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Chart performance | High | Sample data, limit points |
| PR calculation complexity | Medium | Cache PRs, optimize queries |
| Plan scheduling complexity | Medium | Keep simple, no auto-progression |
| User confusion | Medium | Progressive disclosure, onboarding |
| Scope creep | High | Stick to spec, defer enhancements |
