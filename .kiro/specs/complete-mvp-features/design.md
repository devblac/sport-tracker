# Complete MVP Features - Design

## Architecture Principles

1. **Direct Implementation** - No unnecessary abstractions
2. **Performance First** - Lazy load, cache, optimize
3. **Simple State** - React hooks + Context, no complex state management
4. **Offline Capable** - Workouts work offline, social requires online
5. **Security Default** - RLS on all tables, validate all inputs

## Component Architecture

### File Organization

```
liftfire-expo/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx (Home - enhanced)
│   │   ├── workouts.tsx (enhanced with plans/library buttons)
│   │   ├── profile.tsx (enhanced with PRs/analytics)
│   │   └── social.tsx (existing)
│   ├── plans/
│   │   ├── index.tsx (plans list)
│   │   ├── [id].tsx (plan detail)
│   │   └── new.tsx (create plan)
│   ├── records/
│   │   └── index.tsx (personal records)
│   ├── analytics/
│   │   └── index.tsx (charts screen)
│   ├── exercises/
│   │   ├── index.tsx (library - enhance existing)
│   │   └── [id].tsx (exercise detail)
│   └── onboarding/
│       └── index.tsx (first-time user flow)
├── components/
│   ├── RestTimer.tsx (new)
│   ├── PRBadge.tsx (new)
│   ├── VolumeChart.tsx (new)
│   ├── FrequencyChart.tsx (new)
│   ├── MuscleDistributionChart.tsx (new)
│   ├── ExerciseProgressChart.tsx (new)
│   ├── PlanCard.tsx (new)
│   ├── PlanWeekView.tsx (new)
│   ├── CommentInput.tsx (new)
│   ├── EmptyState.tsx (new)
│   └── CelebrationModal.tsx (new)
├── hooks/
│   ├── useRestTimer.ts (new)
│   ├── usePersonalRecords.ts (new)
│   ├── useAnalytics.ts (new)
│   ├── usePlans.ts (new)
│   └── useOnboarding.ts (new)
└── lib/
    ├── prCalculator.ts (new)
    ├── chartData.ts (new)
    ├── planScheduler.ts (new)
    └── celebrations.ts (new)
```

## Data Flow Patterns

### Rest Timer Flow
```
Set completed → RestTimer mounts → Countdown starts
→ Haptic at milestones → Timer complete → Callback
→ Component unmounts
```

### PR Detection Flow
```
Workout saved → For each exercise:
  Calculate 1RM → Query previous best
  → If new > previous: Create PR + Celebrate + Award XP
```

### Analytics Flow
```
Open Analytics → Check cache → If stale:
  Fetch workouts → Calculate metrics → Cache results
→ Render charts
```

### Plan Progress Flow
```
Start plan → Create progress record → Show week 1
→ Complete workout → Check if week done
→ If yes: Celebrate + Increment week
→ If plan done: Celebrate + Award achievement
```

## Component Specifications

### RestTimer Component

```typescript
interface RestTimerProps {
  defaultDuration: number; // seconds
  onComplete: () => void;
  onSkip: () => void;
  autoStart?: boolean;
}

// Features:
// - Circular progress (200x200)
// - Large countdown text (48px)
// - Skip button (bottom-left)
// - +30s button (bottom-right)
// - Haptic: light at 10s, medium at 5s, heavy at 0s
// - Audio beep at 0s (if enabled)
// - Persist state in AsyncStorage
```

### PRBadge Component

```typescript
interface PRBadgeProps {
  isNewPR: boolean;
  improvement?: number; // percentage
  size?: 'small' | 'medium' | 'large';
}

// Visual:
// - Gold star icon (⭐)
// - "NEW PR!" text
// - "+X%" improvement text
// - Animated scale entrance
```

### Chart Components

```typescript
// All charts share common props
interface BaseChartProps {
  data: any[];
  loading?: boolean;
  height?: number;
  onDataPointPress?: (point: any) => void;
}

// VolumeChart: Line chart with gradient
// FrequencyChart: Bar chart with color coding
// MuscleDistributionChart: Horizontal bar chart
// ExerciseProgressChart: Line chart with PR markers
```

### PlanCard Component

```typescript
interface PlanCardProps {
  plan: WorkoutPlan;
  progress?: UserPlanProgress;
  onPress: () => void;
  onStart?: () => void;
}

// Visual:
// - Plan name (bold, 18px)
// - Duration badge (e.g., "6 weeks")
// - Difficulty stars (⭐⭐⭐)
// - Progress bar (if active)
// - "Start" or "Continue" button
```

### CelebrationModal Component

```typescript
interface CelebrationModalProps {
  type: 'pr' | 'level-up' | 'achievement' | 'streak' | 'plan-complete';
  title: string;
  message: string;
  icon: string;
  onClose: () => void;
}

// Features:
// - Confetti animation
// - Large icon (80x80)
// - Title and message
// - XP bonus display (if applicable)
// - "Awesome!" button to close
```

## Database Schema

### Personal Records

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

-- RLS Policies
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PRs"
  ON personal_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PRs"
  ON personal_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Workout Plans

```sql
CREATE TABLE workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  goal TEXT CHECK (goal IN ('strength', 'hypertrophy', 'endurance', 'general')),
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE plan_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number > 0),
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  workout_template_id UUID REFERENCES workout_templates(id),
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(plan_id, week_number, day_number)
);

CREATE TABLE user_plan_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
  current_week INTEGER DEFAULT 1,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_active_plan 
  ON user_plan_progress(user_id, is_active) 
  WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plan_progress ENABLE ROW LEVEL SECURITY;

-- Plans: Users can view system plans and own plans
CREATE POLICY "Users can view plans"
  ON workout_plans FOR SELECT
  USING (is_system = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can create own plans"
  ON workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

-- Plan workouts: Inherit from plan visibility
CREATE POLICY "Users can view plan workouts"
  ON plan_workouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_plans
      WHERE id = plan_id
      AND (is_system = TRUE OR user_id = auth.uid())
    )
  );

-- Progress: Users can only see own progress
CREATE POLICY "Users can view own progress"
  ON user_plan_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_plan_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_plan_progress FOR UPDATE
  USING (auth.uid() = user_id);
```

### Workout Comments

```sql
-- Add to existing workouts table
ALTER TABLE workouts ADD COLUMN comment TEXT;
```

## Core Algorithms

### PR Calculation

```typescript
// Calculate estimated 1RM using Epley formula
const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
};

// Detect if new PR
const detectPR = async (
  userId: string,
  exerciseId: string,
  weight: number,
  reps: number
): Promise<boolean> => {
  const new1RM = calculate1RM(weight, reps);
  
  // Get previous best
  const { data: previousPR } = await supabase
    .from('personal_records')
    .select('estimated_1rm')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .order('estimated_1rm', { ascending: false })
    .limit(1)
    .single();
  
  if (!previousPR) return true; // First time = PR
  
  return new1RM > previousPR.estimated_1rm;
};
```

### Volume Calculation

```typescript
const calculateVolume = (workouts: Workout[]): VolumeDataPoint[] => {
  const volumeByDate = new Map<string, number>();
  
  workouts.forEach(workout => {
    const date = workout.completed_at.split('T')[0];
    const workoutVolume = workout.exercises.reduce((sum, ex) => {
      return sum + (ex.sets * ex.reps * (ex.weight || 0));
    }, 0);
    
    volumeByDate.set(
      date,
      (volumeByDate.get(date) || 0) + workoutVolume
    );
  });
  
  return Array.from(volumeByDate.entries())
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => a.date.localeCompare(b.date));
};
```

### Muscle Distribution

```typescript
const calculateMuscleDistribution = (
  workouts: Workout[],
  exercises: ExerciseLibraryItem[]
): MuscleDistribution[] => {
  const muscleCount = new Map<string, number>();
  
  workouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      const exercise = exercises.find(e => e.id === ex.exercise_id);
      exercise?.muscle_groups.forEach(muscle => {
        muscleCount.set(muscle, (muscleCount.get(muscle) || 0) + 1);
      });
    });
  });
  
  const total = Array.from(muscleCount.values()).reduce((a, b) => a + b, 0);
  
  return Array.from(muscleCount.entries())
    .map(([muscle, count]) => ({
      muscle_group: muscle,
      count,
      percentage: (count / total) * 100
    }))
    .sort((a, b) => b.count - a.count);
};
```

## Performance Optimizations

### Caching Strategy

```typescript
// Cache analytics data
const analyticsCache = {
  data: null as AnalyticsData | null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes
  
  get(): AnalyticsData | null {
    if (Date.now() - this.timestamp > this.ttl) {
      return null; // Expired
    }
    return this.data;
  },
  
  set(data: AnalyticsData) {
    this.data = data;
    this.timestamp = Date.now();
  },
  
  invalidate() {
    this.data = null;
    this.timestamp = 0;
  }
};

// Invalidate cache on new workout
const onWorkoutSaved = () => {
  analyticsCache.invalidate();
  prCache.invalidate();
};
```

### Query Optimization

```typescript
// Fetch only needed data
const fetchAnalyticsData = async (userId: string, months: number) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const { data } = await supabase
    .from('workouts')
    .select('id, completed_at, xp_earned, exercises(sets, reps, weight, exercise_id)')
    .eq('user_id', userId)
    .gte('completed_at', startDate.toISOString())
    .order('completed_at', { ascending: true });
  
  return data;
};
```

## UI/UX Specifications

### Color System

```typescript
const celebrationColors = {
  pr: '#FFD700',        // Gold
  levelUp: '#9013FE',   // Purple
  achievement: '#FFA500', // Orange
  streak: '#FF6B35',    // Red-orange
  planComplete: '#7ED321' // Green
};

const chartColors = {
  volume: '#4A90E2',    // Blue
  frequency: '#7ED321', // Green
  strength: '#9013FE',  // Purple
  muscle: ['#FF6B35', '#FFA500', '#FFD700', '#7ED321', '#4A90E2']
};
```

### Typography

```typescript
const typography = {
  celebration: {
    title: { fontSize: 28, fontWeight: '700' },
    message: { fontSize: 16, fontWeight: '400' }
  },
  chart: {
    title: { fontSize: 18, fontWeight: '600' },
    label: { fontSize: 12, fontWeight: '400' },
    value: { fontSize: 14, fontWeight: '600' }
  },
  pr: {
    badge: { fontSize: 12, fontWeight: '700' },
    improvement: { fontSize: 10, fontWeight: '600' }
  }
};
```

### Animations

```typescript
// PR Badge entrance
const prAnimation = {
  from: { scale: 0, rotate: '-180deg' },
  to: { scale: 1, rotate: '0deg' },
  duration: 500,
  easing: 'spring'
};

// Celebration confetti
const confettiAnimation = {
  particles: 50,
  duration: 3000,
  colors: ['#FFD700', '#FFA500', '#FF6B35']
};

// Level up glow
const levelUpGlow = {
  from: { opacity: 0, scale: 0.8 },
  to: { opacity: 1, scale: 1.2 },
  duration: 1000,
  repeat: 3
};
```

## Error Handling

### Graceful Degradation

```typescript
// If PR calculation fails, continue without PR
try {
  await detectAndSavePR(workout);
} catch (error) {
  console.error('PR detection failed:', error);
  // Continue - don't block workout save
}

// If chart fails to render, show error state
const ChartErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <EmptyState
        icon="alert-circle"
        title="Chart Error"
        message="Unable to load chart"
        action={{ label: 'Retry', onPress: () => setHasError(false) }}
      />
    );
  }
  
  return children;
};
```

## Testing Strategy

### Unit Tests
- PR calculation logic
- Volume/frequency calculations
- Timer countdown logic
- Plan progress tracking

### Integration Tests
- PR detection on workout save
- Chart data aggregation
- Plan activation flow

### Manual Testing
- Rest timer with backgrounding
- PR celebrations
- Chart rendering with various data
- Plan navigation

## Accessibility

- Large touch targets (44x44pt minimum)
- High contrast colors
- Screen reader support
- Haptic feedback for important actions
- Clear visual hierarchy

## Security

- RLS on all new tables
- Validate all inputs with Zod
- Sanitize comments (XSS prevention)
- Rate limit PR calculations
- No service keys in client code
