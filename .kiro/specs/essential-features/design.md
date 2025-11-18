# Essential Features - Design

## Architecture Overview

### Design Principles
1. **Progressive Enhancement** - Features appear as user progresses
2. **Contextual Placement** - Features where users expect them
3. **Minimal Friction** - Default behaviors that work for 80% of users
4. **Visual Hierarchy** - Important info prominent, details accessible
5. **Performance First** - Lazy load, cache aggressively, optimize queries

## Component Design

### 1. Rest Timer Component

**Location**: Modal overlay during workout
**Trigger**: Automatic after completing a set

```typescript
interface RestTimerProps {
  defaultDuration: number; // seconds
  onComplete: () => void;
  onSkip: () => void;
}

// Features:
// - Circular progress indicator
// - Large countdown number
// - Skip button (bottom left)
// - +30s button (bottom right)
// - Haptic feedback at 10s, 5s, 0s
// - Audio beep at 0s (optional, user setting)
```

**State Management**:
- Local component state (no global state needed)
- Persist timer in AsyncStorage if app backgrounds
- Resume timer when app returns to foreground

**UX Details**:
- Auto-start with 60s default (configurable in settings)
- Vibrate at 10s remaining
- Strong vibrate + sound at 0s
- Timer stays on screen until dismissed
- Can adjust time mid-countdown

### 2. Personal Records System

**Location**: Profile tab → Personal Records section

```typescript
interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  workout_id: string;
  achieved_at: string;
  created_at: string;
}

// PR Detection Logic:
// - Calculate 1RM: weight × (1 + reps / 30)
// - Compare to previous best 1RM for exercise
// - If higher, create new PR record
// - Show celebration animation
```

**PR Badge Component**:
```typescript
interface PRBadgeProps {
  isNewPR: boolean;
  previousBest?: number;
  improvement?: number; // percentage
}

// Visual:
// - Gold star icon
// - "NEW PR!" text
// - "+5% from previous" subtext
// - Animated entrance
```

**PR List Screen**:
- Group by muscle group or exercise
- Sort by date (newest first) or weight (highest first)
- Filter by time period (this month, this year, all time)
- Search by exercise name
- Tap to see PR history timeline

### 3. Workout Comments

**Location**: Workout completion screen & workout detail

```typescript
interface WorkoutComment {
  workout_id: string;
  comment: string; // max 500 chars
  created_at: string;
  updated_at: string;
}

// Component:
// - Multiline text input
// - Character counter (500 max)
// - Placeholder: "How did this workout feel?"
// - Auto-save on blur
// - Edit icon on workout cards if comment exists
```

**UX Details**:
- Optional field (not required)
- Show comment preview on workout cards (first 50 chars)
- Tap to expand full comment
- Edit anytime from workout detail

### 4. Analytics & Charts

**Location**: Profile tab → Analytics section

#### Chart Types

**A. Workout Volume Chart**
```typescript
interface VolumeDataPoint {
  date: string;
  volume: number; // sum of (sets × reps × weight)
}

// Visual:
// - Line chart with gradient fill
// - X-axis: dates
// - Y-axis: volume (kg or lbs)
// - Dots on data points
// - Tap dot to see workout details
```

**B. Workout Frequency Chart**
```typescript
interface FrequencyDataPoint {
  week: string;
  count: number; // workouts per week
}

// Visual:
// - Bar chart
// - X-axis: week numbers
// - Y-axis: workout count
// - Color: green if >= 3, yellow if 2, red if < 2
```

**C. Muscle Group Distribution**
```typescript
interface MuscleDistribution {
  muscle_group: string;
  percentage: number;
  workout_count: number;
}

// Visual:
// - Pie chart or horizontal bar chart
// - Color-coded by muscle group
// - Show percentage and count
```

**D. Exercise Progress Chart**
```typescript
interface ExerciseProgress {
  date: string;
  weight: number;
  reps: number;
  estimated_1rm: number;
}

// Visual:
// - Line chart showing 1RM over time
// - Exercise selector dropdown
// - Show trend line
// - Highlight PRs with star markers
```

**Data Aggregation**:
```typescript
// Calculate volume
const calculateVolume = (workouts: Workout[]) => {
  return workouts.reduce((total, workout) => {
    const workoutVolume = workout.exercises.reduce((sum, ex) => {
      return sum + (ex.sets * ex.reps * (ex.weight || 0));
    }, 0);
    return total + workoutVolume;
  }, 0);
};

// Group by week
const groupByWeek = (workouts: Workout[]) => {
  const weeks = new Map<string, Workout[]>();
  workouts.forEach(workout => {
    const week = getWeekNumber(workout.completed_at);
    if (!weeks.has(week)) weeks.set(week, []);
    weeks.get(week)!.push(workout);
  });
  return weeks;
};

// Calculate muscle distribution
const calculateMuscleDistribution = (workouts: Workout[]) => {
  const muscleCount = new Map<string, number>();
  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      const exercise = getExerciseById(ex.exercise_id);
      exercise?.muscle_groups.forEach(muscle => {
        muscleCount.set(muscle, (muscleCount.get(muscle) || 0) + 1);
      });
    });
  });
  return muscleCount;
};
```

**Performance Optimization**:
- Cache chart data in memory
- Recalculate only when new workout added
- Use memoization for expensive calculations
- Limit data points to last 100 workouts for charts

### 5. Workout Plans

**Location**: Workouts tab → Workout Plans button

#### Plan Structure

```typescript
interface WorkoutPlan {
  id: string;
  user_id: string;
  name: string;
  description: string;
  duration_weeks: number;
  difficulty: number; // 1-5
  goal: string; // "strength", "hypertrophy", "endurance"
  is_system: boolean;
  created_at: string;
}

interface PlanWorkout {
  id: string;
  plan_id: string;
  week_number: number;
  day_number: number;
  workout_template_id: string;
  name: string;
  notes: string;
}

interface UserPlanProgress {
  id: string;
  user_id: string;
  plan_id: string;
  current_week: number;
  started_at: string;
  completed_at?: string;
  is_active: boolean;
}
```

#### Default System Plans

**1. Beginner Full Body (4 weeks)**
```
Week 1-4: 3 workouts per week
- Day 1: Full Body A (Squat, Bench, Row)
- Day 2: Rest
- Day 3: Full Body B (Deadlift, OHP, Pull-ups)
- Day 4: Rest
- Day 5: Full Body C (Lunges, Dips, Curls)
- Day 6-7: Rest
```

**2. Push/Pull/Legs Split (6 weeks)**
```
Week 1-6: 6 workouts per week
- Day 1: Push (Chest, Shoulders, Triceps)
- Day 2: Pull (Back, Biceps)
- Day 3: Legs (Quads, Hamstrings, Calves)
- Day 4: Push
- Day 5: Pull
- Day 6: Legs
- Day 7: Rest
```

**3. Strength Builder (8 weeks)**
```
Week 1-4: Linear progression
Week 5-8: Increased volume
- Day 1: Squat focus
- Day 2: Bench focus
- Day 3: Rest
- Day 4: Deadlift focus
- Day 5: OHP focus
- Day 6-7: Rest
```

#### Plan UI Components

**Plan Card**:
```typescript
interface PlanCardProps {
  plan: WorkoutPlan;
  progress?: UserPlanProgress;
  onStart: () => void;
  onContinue: () => void;
  onView: () => void;
}

// Visual:
// - Plan name (bold)
// - Duration badge (e.g., "6 weeks")
// - Difficulty stars (1-5)
// - Progress bar if active
// - "Start Plan" or "Continue" button
```

**Plan Detail Screen**:
- Plan overview (name, description, goal)
- Weekly schedule view
- Workout list by week
- Progress indicator
- "Start Plan" or "Mark Week Complete" button
- Edit/Duplicate buttons (for user plans)

**Plan Builder**:
- Step 1: Plan details (name, duration, difficulty, goal)
- Step 2: Add workouts per week
- Step 3: Assign templates or create custom workouts
- Step 4: Review and save

## Data Flow

### Rest Timer Flow
```
User completes set
  ↓
RestTimer component mounts
  ↓
Start countdown from default duration
  ↓
Update every second
  ↓
Haptic feedback at milestones
  ↓
Timer complete → onComplete callback
  ↓
Component unmounts
```

### PR Detection Flow
```
User saves workout
  ↓
For each exercise:
  Calculate 1RM = weight × (1 + reps / 30)
  ↓
  Query previous best 1RM for exercise
  ↓
  If new 1RM > previous:
    Create PR record
    Show PR celebration
    Award XP bonus (+50 XP)
    Unlock achievement if applicable
```

### Analytics Data Flow
```
User opens Analytics screen
  ↓
Check cache for chart data
  ↓
If cache miss or stale:
  Fetch workouts from last 6 months
  ↓
  Calculate metrics:
    - Volume per week
    - Frequency per week
    - Muscle distribution
    - Exercise progress
  ↓
  Cache results
  ↓
Render charts with cached data
```

### Plan Progress Flow
```
User starts plan
  ↓
Create UserPlanProgress record
  ↓
Set current_week = 1
  ↓
Show current week's workouts
  ↓
User completes workout
  ↓
Mark workout as complete
  ↓
If all workouts in week complete:
  Show "Week Complete" celebration
  ↓
  Increment current_week
  ↓
If current_week > duration_weeks:
  Mark plan as completed
  ↓
  Show "Plan Complete" celebration
  ↓
  Award achievement
```

## UI/UX Specifications

### Color Palette
```typescript
const colors = {
  // PR indicators
  prGold: '#FFD700',
  prBadge: '#FFA500',
  
  // Chart colors
  volumeBlue: '#4A90E2',
  frequencyGreen: '#7ED321',
  strengthPurple: '#9013FE',
  
  // Plan difficulty
  difficulty1: '#7ED321', // Easy - Green
  difficulty2: '#F5A623', // Medium - Orange
  difficulty3: '#E94B3C', // Hard - Red
  difficulty4: '#9013FE', // Very Hard - Purple
  difficulty5: '#000000', // Extreme - Black
};
```

### Typography
```typescript
const typography = {
  prBadge: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: '400',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
  },
  planDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
};
```

### Spacing
```typescript
const spacing = {
  chartPadding: 16,
  cardGap: 12,
  sectionGap: 24,
  timerSize: 200, // diameter
};
```

### Animations
```typescript
// PR Badge entrance
const prBadgeAnimation = {
  from: { scale: 0, opacity: 0 },
  to: { scale: 1, opacity: 1 },
  duration: 500,
  easing: 'spring',
};

// Chart data entrance
const chartAnimation = {
  from: { opacity: 0, translateY: 20 },
  to: { opacity: 1, translateY: 0 },
  duration: 300,
  easing: 'ease-out',
};

// Timer pulse
const timerPulse = {
  scale: [1, 1.05, 1],
  duration: 1000,
  repeat: Infinity,
};
```

## Database Queries

### Get Personal Records
```sql
-- Get all PRs for user
SELECT pr.*, w.name as workout_name
FROM personal_records pr
LEFT JOIN workouts w ON pr.workout_id = w.id
WHERE pr.user_id = $1
ORDER BY pr.achieved_at DESC;

-- Get PR for specific exercise
SELECT *
FROM personal_records
WHERE user_id = $1 AND exercise_id = $2
ORDER BY weight DESC, reps DESC
LIMIT 1;
```

### Get Analytics Data
```sql
-- Volume over time
SELECT 
  DATE_TRUNC('week', completed_at) as week,
  SUM(
    (SELECT SUM(sets * reps * COALESCE(weight, 0))
     FROM exercises e
     WHERE e.workout_id = w.id)
  ) as total_volume
FROM workouts w
WHERE user_id = $1
  AND completed_at >= NOW() - INTERVAL '6 months'
GROUP BY week
ORDER BY week;

-- Workout frequency
SELECT 
  DATE_TRUNC('week', completed_at) as week,
  COUNT(*) as workout_count
FROM workouts
WHERE user_id = $1
  AND completed_at >= NOW() - INTERVAL '3 months'
GROUP BY week
ORDER BY week;
```

### Get Plan Progress
```sql
-- Get active plan with progress
SELECT 
  p.*,
  upp.current_week,
  upp.started_at,
  (
    SELECT COUNT(*)
    FROM plan_workouts pw
    WHERE pw.plan_id = p.id
      AND pw.week_number = upp.current_week
  ) as workouts_this_week,
  (
    SELECT COUNT(*)
    FROM workouts w
    WHERE w.user_id = upp.user_id
      AND w.plan_id = p.id
      AND DATE_TRUNC('week', w.completed_at) = 
          DATE_TRUNC('week', upp.started_at + (upp.current_week - 1) * INTERVAL '1 week')
  ) as completed_this_week
FROM workout_plans p
JOIN user_plan_progress upp ON p.id = upp.plan_id
WHERE upp.user_id = $1
  AND upp.is_active = true;
```

## Error Handling

### Rest Timer
- **App backgrounds**: Save timer state, resume on foreground
- **Timer interrupted**: Allow restart or skip
- **No permission for notifications**: Graceful degradation, visual only

### Personal Records
- **PR calculation fails**: Log error, continue without PR detection
- **Duplicate PR**: Use latest, ignore duplicates
- **Missing exercise data**: Skip PR for that exercise

### Analytics
- **No workout data**: Show empty state with encouragement
- **Chart render fails**: Show error message, offer retry
- **Large dataset**: Sample data, show warning about limited view

### Workout Plans
- **Plan not found**: Show error, redirect to plans list
- **Invalid plan structure**: Validate on save, prevent corruption
- **Concurrent plan edits**: Last write wins, show warning

## Testing Strategy

### Unit Tests
- PR calculation logic
- Volume/frequency calculations
- Timer countdown logic
- Plan progress tracking

### Integration Tests
- PR detection on workout save
- Chart data aggregation
- Plan activation/completion flow

### Manual Testing
- Rest timer with app backgrounding
- PR celebration animations
- Chart rendering with various data sizes
- Plan navigation and progress tracking

## Accessibility

- **Rest Timer**: Large text, high contrast, haptic feedback
- **Charts**: Alt text for data points, table view alternative
- **PR Badges**: Screen reader announces "New personal record"
- **Plans**: Clear hierarchy, keyboard navigation support

## Performance Targets

- Rest timer: < 50ms response time
- PR detection: < 200ms per workout
- Chart rendering: < 500ms for 100 data points
- Plan loading: < 300ms

## Security Considerations

- RLS policies on all new tables
- Validate plan ownership before edits
- Sanitize comment input (XSS prevention)
- Rate limit PR calculations (prevent abuse)
