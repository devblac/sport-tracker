# Essential Features - Requirements

## Overview

Add critical missing features to complete the MVP: rest timer, personal records, workout comments, analytics/charts, and workout plans. Focus on intuitive UX with proper information architecture.

## User Stories

### Rest Timer
**As a user**, I want a rest timer between sets so I can maintain consistent rest periods and optimize my workout.

**Acceptance Criteria:**
- Timer starts automatically after completing a set
- Default rest time is configurable (30s, 60s, 90s, 120s, 180s)
- Visual countdown with progress indicator
- Audio/haptic notification when rest is complete
- Can skip rest or add more time
- Timer persists if app goes to background
- Accessible from workout detail screen

### Personal Records (PRs)
**As a user**, I want to track my personal records so I can see my strength progress over time.

**Acceptance Criteria:**
- Automatically detect new PRs when logging workouts
- Show PR badge/indicator on exercises that are PRs
- View PR history per exercise (date, weight, reps)
- Filter PRs by exercise, muscle group, or time period
- Celebrate PR achievements with visual feedback
- PRs contribute to XP/achievements
- Accessible from Profile tab under "Personal Records" section

### Workout Comments
**As a user**, I want to add comments to my workouts so I can track how I felt and remember important details.

**Acceptance Criteria:**
- Add comment field to workout completion screen
- Edit comments on past workouts
- Comments visible on workout detail view
- Comments searchable (future enhancement)
- Character limit: 500 characters
- Optional field (not required)

### Analytics & Charts
**As a user**, I want to see my progress visualized so I can understand my training trends.

**Acceptance Criteria:**
- **Workout Volume Chart**: Total volume (sets × reps × weight) over time
- **Workout Frequency Chart**: Workouts per week over last 12 weeks
- **Muscle Group Distribution**: Pie chart of muscle groups trained
- **Strength Progress**: Line chart for specific exercises
- **XP Progress**: XP earned over time
- Time period filters: 1 month, 3 months, 6 months, 1 year, all time
- Accessible from Profile tab under "Analytics" section
- Export data as CSV (future enhancement)

### Workout Plans
**As a user**, I want to follow structured workout plans so I can achieve specific fitness goals.

**Acceptance Criteria:**
- Create multi-week workout plans (e.g., "12-Week Strength Program")
- Each plan has: name, description, duration, difficulty, goal
- Plans contain scheduled workouts (Day 1: Push, Day 2: Pull, etc.)
- Track plan progress (current week, completed workouts)
- Mark workouts as complete within plan
- Duplicate/customize existing plans
- 3 default system plans: Beginner Full Body (4 weeks), PPL Split (6 weeks), Strength Builder (8 weeks)
- Accessible from new "Plans" tab or Workouts submenu

## Information Architecture

### Current Tab Structure
```
Bottom Navigation:
├── Home (Dashboard)
├── Workouts
├── Social
└── Profile
```

### Proposed Enhanced Structure

#### Option A: Keep 4 Tabs (Recommended)
```
Bottom Navigation:
├── Home (Dashboard)
│   ├── Today's Workout (if plan active)
│   ├── Quick Stats (workouts this week, current streak)
│   ├── Recent Achievements
│   └── XP Progress Bar
│
├── Workouts
│   ├── My Workouts (list)
│   ├── Browse Templates (button)
│   ├── Workout Plans (button) ← NEW
│   └── + Create Workout (FAB)
│
├── Social
│   ├── Activity Feed
│   ├── Friends
│   └── Leaderboard
│
└── Profile
    ├── Profile Header (avatar, name, level, XP)
    ├── Stats Overview (total workouts, total XP, streak)
    ├── Personal Records ← NEW
    ├── Analytics & Charts ← NEW
    ├── Achievements
    ├── Settings
    └── Logout
```

#### Option B: Add 5th Tab (Alternative)
```
Bottom Navigation:
├── Home
├── Workouts
├── Progress ← NEW TAB
│   ├── Analytics & Charts
│   ├── Personal Records
│   ├── Achievements
│   └── Goals (future)
├── Social
└── Profile
```

**Recommendation**: **Option A** - Keep 4 tabs, add features to existing structure. Cleaner, less overwhelming, follows mobile UX best practices.

## Navigation Flows

### Rest Timer Flow
```
Workout Detail Screen
└── Complete Set Button
    └── Rest Timer Modal (auto-appears)
        ├── Skip Rest
        ├── Add 30s
        └── Timer Complete → Next Set
```

### Personal Records Flow
```
Profile Tab
└── Personal Records Section
    └── PR List Screen
        ├── Filter by Exercise
        ├── Filter by Muscle Group
        └── Exercise PR Detail
            └── PR History (timeline)
```

### Analytics Flow
```
Profile Tab
└── Analytics Section
    └── Analytics Screen
        ├── Time Period Selector
        ├── Volume Chart
        ├── Frequency Chart
        ├── Muscle Distribution
        └── Exercise Progress (select exercise)
```

### Workout Plans Flow
```
Workouts Tab
└── Workout Plans Button
    └── Plans List Screen
        ├── Active Plan (if any)
        ├── System Plans (3 default)
        ├── My Custom Plans
        └── + Create Plan
            └── Plan Builder
                ├── Plan Details
                ├── Add Workouts (by week/day)
                └── Save Plan
```

## User Experience Principles

### Discoverability
- **Progressive Disclosure**: Show advanced features after user completes first workout
- **Contextual Hints**: Tooltip on first workout completion: "Track your progress in Profile → Analytics"
- **Empty States**: Helpful empty states with clear CTAs

### Accessibility
- **Clear Hierarchy**: Primary actions prominent, secondary actions accessible but not distracting
- **Consistent Patterns**: Similar features use similar UI patterns
- **Touch Targets**: Minimum 44x44pt for all interactive elements

### Performance
- **Lazy Loading**: Load charts only when Analytics screen is opened
- **Caching**: Cache PR calculations, refresh on new workout
- **Optimistic UI**: Show updates immediately, sync in background

## Technical Constraints

### Database Schema Additions

**Personal Records Table:**
```sql
CREATE TABLE personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  reps INTEGER NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  achieved_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);
```

**Workout Plans Table:**
```sql
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  goal TEXT,
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
  is_active BOOLEAN DEFAULT TRUE
);
```

**Workout Comments:**
```sql
-- Add column to existing workouts table
ALTER TABLE workouts ADD COLUMN comment TEXT;
```

### Code Organization

```
liftfire-expo/
├── app/
│   ├── (tabs)/
│   │   ├── workouts.tsx (updated)
│   │   └── profile.tsx (updated)
│   ├── plans/
│   │   ├── index.tsx (new - plans list)
│   │   ├── [id].tsx (new - plan detail)
│   │   └── new.tsx (new - create plan)
│   ├── analytics/
│   │   └── index.tsx (new - analytics screen)
│   └── records/
│       └── index.tsx (new - personal records)
├── components/
│   ├── RestTimer.tsx (new)
│   ├── PRBadge.tsx (new)
│   ├── ProgressChart.tsx (new)
│   ├── PlanCard.tsx (new)
│   └── CommentInput.tsx (new)
├── hooks/
│   ├── useRestTimer.ts (new)
│   ├── usePersonalRecords.ts (new)
│   ├── useAnalytics.ts (new)
│   └── usePlans.ts (new)
└── lib/
    ├── prCalculator.ts (new)
    ├── chartData.ts (new)
    └── planScheduler.ts (new)
```

## Success Metrics

### Engagement
- 70%+ of users use rest timer on at least one workout
- 50%+ of users view their analytics within first week
- 30%+ of users start a workout plan within first month

### Retention
- Users with active plans have 2x higher retention
- Users who track PRs complete 30% more workouts
- Analytics viewers return 40% more frequently

### Performance
- Rest timer loads in < 100ms
- Charts render in < 500ms
- PR calculations complete in < 200ms

## Out of Scope (Future Enhancements)

- Advanced analytics (percentile rankings, predictions)
- Social sharing of PRs
- Plan marketplace/community plans
- Rest timer with custom intervals
- Video demonstrations in plans
- Nutrition tracking integration
- Workout plan recommendations (AI)

## Dependencies

- Existing workout tracking system
- Existing gamification system (XP, achievements)
- Supabase database with RLS
- Chart library: `react-native-chart-kit` or `victory-native`

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Chart library performance on large datasets | High | Limit data points, use sampling for > 100 workouts |
| PR calculation complexity | Medium | Cache PRs, recalculate only on new workouts |
| Plan scheduling complexity | Medium | Keep simple for MVP, no auto-progression |
| User confusion with new features | Medium | Progressive disclosure, onboarding tooltips |

## Timeline Estimate

- **Rest Timer**: 2-3 hours
- **Workout Comments**: 1 hour
- **Personal Records**: 4-5 hours
- **Analytics & Charts**: 6-8 hours
- **Workout Plans**: 8-10 hours

**Total**: 21-27 hours (3-4 days of focused work)

## Priority Order

1. **Rest Timer** - High value, low complexity
2. **Workout Comments** - Quick win, improves UX
3. **Personal Records** - Core feature, moderate complexity
4. **Analytics & Charts** - High value, higher complexity
5. **Workout Plans** - Most complex, highest long-term value
