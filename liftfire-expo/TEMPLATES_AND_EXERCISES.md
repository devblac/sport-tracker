# Workout Templates & Exercise Library

## Overview

This document describes the workout template and exercise library implementation for the LiftFire MVP.

## Features

### Exercise Library
- **20 default exercises** covering all major muscle groups
- Categories: Strength, Cardio, Flexibility
- Equipment types: Barbell, Dumbbell, Machine, Bodyweight, Cable, Other, None
- Difficulty levels: 1-5 stars
- Search and filter functionality
- Muscle group filtering
- Equipment filtering

### Workout Templates
- **4 default system templates**:
  1. **Push Day** - Chest, shoulders, triceps (60 min, difficulty 3)
  2. **Pull Day** - Back, biceps (60 min, difficulty 3)
  3. **Leg Day** - Complete lower body (70 min, difficulty 4)
  4. **Full Body** - Beginner-friendly full body (50 min, difficulty 2)

- **User custom templates**:
  - Create new templates
  - Edit existing templates (user-created only)
  - Delete templates (user-created only)
  - Duplicate any template (system or user)

## File Structure

```
liftfire-expo/
├── lib/
│   ├── exercises.ts          # Exercise library with 20 default exercises
│   └── templates.ts           # Template library with 4 default templates
├── hooks/
│   ├── useExercises.ts        # Hook for exercise library (search/filter)
│   └── useTemplates.ts        # Hook for template CRUD operations
├── components/
│   ├── ExerciseLibrary.tsx    # Exercise browser component
│   └── TemplateList.tsx       # Template list component
├── app/
│   ├── exercises/
│   │   └── index.tsx          # Exercise library screen
│   └── templates/
│       └── index.tsx          # Templates screen
└── supabase/
    └── migrations/
        └── 004_workout_templates.sql  # Database schema
```

## Usage

### Browse Exercise Library

```typescript
import { useExercises } from '../hooks/useExercises';

const { exercises, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter } = useExercises();

// Search exercises
setSearchQuery('bench');

// Filter by category
setCategoryFilter('strength');

// Filter by muscle group
setMuscleGroupFilter('chest');
```

### Browse Templates

```typescript
import { useTemplates } from '../hooks/useTemplates';

const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useTemplates();

// Create new template
await createTemplate({
  name: 'My Custom Workout',
  notes: 'Custom workout description',
  is_template: true,
  category: 'strength',
  difficulty: 3,
  estimated_duration: 60,
  exercises: [
    {
      id: 'ex-1',
      exercise_id: 'bench-press',
      name: 'Bench Press',
      sets: 4,
      reps: 8,
      weight: null,
      notes: '',
    },
  ],
  user_id: user.id,
});

// Update template
await updateTemplate(templateId, {
  name: 'Updated Name',
  difficulty: 4,
});

// Delete template
await deleteTemplate(templateId);

// Duplicate template
await duplicateTemplate(templateId);
```

### Use Template in Workout Creation

```typescript
// In workout/new.tsx
const { templateId } = useLocalSearchParams();

if (templateId) {
  const template = getTemplateById(templateId);
  // Pre-fill workout form with template data
}
```

## Database Schema

### workout_templates Table

```sql
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  notes TEXT,
  is_template BOOLEAN DEFAULT true,
  category TEXT,
  difficulty INTEGER (1-5),
  estimated_duration INTEGER (minutes),
  exercises JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Exercise JSON Structure

```json
{
  "id": "ex-1",
  "exercise_id": "bench-press",
  "name": "Bench Press",
  "sets": 4,
  "reps": 8,
  "weight": null,
  "notes": "Warm up first"
}
```

## Row Level Security (RLS)

- Users can only view their own templates
- Users can create, update, and delete their own templates
- System templates (id starts with 'template-') are read-only
- System templates are loaded from `lib/templates.ts` (not in database)

## MVP Simplifications

### What's Included
✅ 20 essential exercises covering all major muscle groups
✅ 4 default workout templates (Push, Pull, Legs, Full Body)
✅ Search and filter exercises
✅ Create, edit, delete, duplicate templates
✅ Use templates to create workouts
✅ Local + Supabase storage for user templates

### What's Deferred (Post-MVP)
❌ Exercise videos/GIFs
❌ Exercise form tips and detailed instructions
❌ Community-shared templates
❌ Template marketplace
❌ Exercise variations and progressions
❌ Custom exercise creation
❌ Exercise history and personal records
❌ Template ratings and reviews
❌ Advanced template features (supersets, circuits, rest timers)

## Integration with Existing Features

### Workout Creation
- Templates can be selected when creating a new workout
- Template exercises pre-fill the workout form
- Users can modify template data before saving

### Gamification
- Creating templates doesn't earn XP (only completing workouts)
- No achievements for template creation in MVP

### Offline Support
- Exercise library is static (always available offline)
- User templates sync with Supabase when online
- System templates are always available (hardcoded)

## Testing

### Manual Testing Checklist
- [ ] Browse exercise library
- [ ] Search exercises by name
- [ ] Filter exercises by category
- [ ] Filter exercises by muscle group
- [ ] Browse workout templates
- [ ] Create new template
- [ ] Edit user template
- [ ] Delete user template
- [ ] Duplicate template
- [ ] Use template to create workout
- [ ] Verify system templates cannot be edited/deleted
- [ ] Test offline access to exercise library
- [ ] Test template sync with Supabase

## Future Enhancements

See `.kiro/specs/mvp-refactor/future-enhancements.md` for:
- Workout Templates Library (community templates)
- Exercise Video Demonstrations
- Custom Exercise Creation
- Template Marketplace
- Advanced Template Features

## Security Considerations

- ✅ RLS enabled on workout_templates table
- ✅ Users can only access their own templates
- ✅ Input validation with Zod schemas
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (React Native handles this)
- ✅ Data whitelisting before storage

## Performance

- Exercise library: Static array (instant access)
- Templates: Cached in React state after initial load
- Search/filter: Client-side (no API calls)
- Template CRUD: Direct Supabase calls (no caching layer)

## Accessibility

- All interactive elements have proper touch targets (44x44 minimum)
- Text inputs have clear labels
- Error messages are descriptive
- Loading states are indicated
- Empty states provide guidance

## Known Limitations

1. **Exercise library is static** - Cannot add custom exercises in MVP
2. **No exercise media** - Text-only instructions
3. **No template sharing** - Templates are private to each user
4. **No template categories** - Simple list view only
5. **No template search** - Only exercise search is available

## Migration Path

To apply the database migration:

```bash
# Using Supabase CLI
supabase db push

# Or using MCP
mcp_supabase_apply_migration --name workout_templates --query "$(cat supabase/migrations/004_workout_templates.sql)"
```

## Support

For issues or questions:
1. Check this documentation
2. Review `.kiro/specs/mvp-refactor/` for design decisions
3. Check `future-enhancements.md` for deferred features
