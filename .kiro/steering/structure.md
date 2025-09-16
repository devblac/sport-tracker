# Project Structure & Organization

## Source Code Organization (`src/`)

```
src/
├── components/         # Reusable React components
│   ├── ui/            # Base UI components (buttons, inputs, etc.)
│   ├── workouts/      # Workout-related components
│   ├── social/        # Social features components
│   ├── gamification/  # XP, achievements, streaks
│   ├── realtime/      # Real-time features
│   └── experiments/   # A/B testing components
├── pages/             # Route-level page components
├── layouts/           # Layout wrapper components
├── stores/            # Zustand state stores
├── services/          # API services and business logic
├── hooks/             # Custom React hooks
├── contexts/          # React context providers
├── utils/             # Utility functions and helpers
├── types/             # TypeScript type definitions
├── schemas/           # Zod validation schemas
├── constants/         # App constants and configuration
├── data/              # Static data and mock data
├── assets/            # Images, icons, and static assets
└── lib/               # Third-party library configurations
```

## Key Conventions

### Component Organization
- **Feature-based grouping**: Components grouped by domain (workouts, social, etc.)
- **Lazy loading**: All page components are lazy-loaded for performance
- **Barrel exports**: Use index files for clean imports

### File Naming
- **PascalCase** for React components (`WorkoutPlayer.tsx`)
- **camelCase** for utilities, hooks, and services (`useWorkout.ts`)
- **kebab-case** for non-component files when appropriate

### Import Patterns
- Use `@/` path alias for all internal imports
- Group imports: external libraries first, then internal modules
- Lazy load page components with React.lazy()

### State Management
- **Zustand stores** in `/stores` directory
- Feature-specific stores (auth, workout, social, etc.)
- Persistent stores for offline-first functionality

### Testing Structure
- Tests co-located with components or in `/src/test` directory
- Test utilities in `/src/tests` directory
- Mock data and fixtures organized by feature

## Configuration Files
- **Root level**: Build tools, linting, and project configuration
- **Database**: SQL files and migrations in `/database` directory
- **Supabase**: Configuration and functions in `/supabase` directory
- **Documentation**: Project docs in `/docs` directory

## Development Patterns
- **Offline-first**: All features should work without network
- **Mobile-first**: Responsive design starting from mobile
- **Performance-focused**: Code splitting and lazy loading by default
- **Type-safe**: Comprehensive TypeScript usage with Zod validation