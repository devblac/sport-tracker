# Personal Records Screen

## Overview

The Personal Records (PRs) screen displays all personal records achieved by the user, grouped by exercise and showing the best performance for each.

## Location

- **File**: `app/records/index.tsx`
- **Route**: `/records`

## Features

### Display
- **PR Cards**: Shows exercise name, weight, reps, estimated 1RM, and date achieved
- **Ranking**: Each PR is ranked by estimated 1RM (highest to lowest)
- **Grouping**: PRs are grouped by exercise, showing only the best for each

### Filtering
- **Time Period Filters**:
  - All Time (default)
  - Last 7 Days
  - Last 30 Days
  - Last 90 Days
  - Last Year

### Search
- Real-time search by exercise name
- Clear button to reset search

### Empty States
- Helpful message when no PRs exist
- Call-to-action button to start a workout
- Search-specific empty state when no results found

## Navigation

The screen can be accessed from:
1. Profile tab → Personal Records section (to be added)
2. Direct navigation: `router.push('/records')`

## Data Source

PRs are fetched from the `personal_records` table in Supabase:
- Filtered by current user
- Ordered by achievement date (newest first)
- Grouped by exercise_id to show best performance

## Components Used

- `PRBadge`: Visual indicator for personal records
- `LoadingSpinner`: Loading state
- `ErrorMessage`: Error handling
- Theme colors from `ThemeContext`

## Testing

Tests are located in `__tests__/records-screen.test.tsx`:
- ✅ Displays PRs when loaded successfully
- ✅ Shows empty state when no PRs exist

## Future Enhancements

As noted in the task list, the following features are planned but not yet implemented:
- Muscle group filters
- PR history timeline view (showing progression over time)
- PR comparison charts
- Export PR data
