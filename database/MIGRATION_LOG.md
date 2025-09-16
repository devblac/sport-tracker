# Database Migration Log

This file tracks all database schema changes for the Sport Tracker PWA.

## Migration Naming Convention

Migrations follow the format: `{number}-{description}.sql`

- **Number**: 2-digit sequential number (01-, 02-, 03-...)
- **Description**: Kebab-case description of the change
- **Extension**: Always `.sql`

## Migration History

### 13-streak-system.sql
- **Date**: 2025-09-13
- **Description**: Initial streak system implementation
- **Tables Added**:
  - `streak_schedules` - User workout schedules
  - `streak_periods` - Continuous streak periods
  - `streak_days` - Individual day records
  - `streak_notifications` - Streak notifications
  - `streak_rewards` - Milestone rewards
- **Functions Added**:
  - `calculate_streak_stats()` - Calculate user streak statistics
  - `record_streak_workout()` - Record workout for streak tracking
  - `handle_workout_completed()` - Trigger function for workout completion
- **Triggers Added**:
  - `on_workout_completed` - Auto-update streaks when workouts complete
- **Status**: ✅ Applied
- **Notes**: Fixed INDEX syntax errors, made idempotent

### 14-validate-streak-setup.sql
- **Date**: 2025-09-13
- **Description**: Validation script for streak system setup
- **Purpose**: Verify all streak tables, functions, and policies are working
- **Status**: ✅ Applied
- **Notes**: Validation script, not a schema change

## How to Apply Migrations

1. **Run migrations in order** (001, 002, 003...)
2. **Never skip migrations** - each builds on the previous
3. **Test in development first** before applying to production
4. **Update this log** when adding new migrations

## Next Migration Number

**Next available number**: `15-`

## Rollback Procedures

Each migration should include rollback instructions. For emergencies:

### Rollback 13- (Streak Tables)
```sql
-- WARNING: This will delete all streak data!
DROP TRIGGER IF EXISTS on_workout_completed ON public.workout_sessions;
DROP FUNCTION IF EXISTS public.handle_workout_completed();
DROP FUNCTION IF EXISTS public.record_streak_workout(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.calculate_streak_stats(UUID, UUID);

DROP TABLE IF EXISTS public.streak_rewards CASCADE;
DROP TABLE IF EXISTS public.streak_notifications CASCADE;
DROP TABLE IF EXISTS public.streak_days CASCADE;
DROP TABLE IF EXISTS public.streak_periods CASCADE;
DROP TABLE IF EXISTS public.streak_schedules CASCADE;
```

## Migration Checklist

Before applying any migration:

- [ ] Backup database
- [ ] Test migration in development
- [ ] Review rollback procedure
- [ ] Update this migration log
- [ ] Verify application compatibility
- [ ] Test core functionality after migration