# MVP Refactor Principles

## Core Philosophy

When working on the LiftFire MVP refactor, follow these principles:

**Simplify Everything**
- Reduce verbosity and remove over-engineering
- Make code cleaner and easier to maintain
- Remove unnecessary abstractions and layers
- Prefer inline logic over excessive extraction

**Preserve Essential Functionality**
- Keep core features: auth, workout tracking, basic gamification, lightweight social, offline support
- Remove non-essential features: see `.kiro/specs/mvp-refactor/future-enhancements.md`
- Focus on MVP scope only

**Optimize for Free Tier**
- Design to run on Netlify/Render free tier (web)
- Use Supabase free tier (1M reads/month, 500MB DB)
- Avoid expensive operations: real-time subscriptions, file storage, heavy sync
- Use polling instead of real-time (45-60 seconds)
- Materialized views for leaderboards (hourly refresh)

**Prioritize Security**
- Use Supabase Row Level Security (RLS) on all tables
- Never expose service keys in client code
- Store tokens in Expo SecureStore only
- Validate all inputs with Zod schemas
- Sanitize user-generated content
- Whitelist data before local storage

**Optimize for Efficiency**
- Target 82% code reduction (215K → 38K lines)
- Bundle size < 5MB
- Startup time < 3 seconds
- Direct Supabase client calls (no wrapper services)
- Minimal dependencies (~30 total)

**Ready for Testing**
- Clear structure with minimal files
- Simple, testable code
- No complex mocking required
- Manual testing on Web + Android
- Unit tests for core logic only

**Quick Deployment**
- Single Expo build process
- Environment variables for configuration
- README with setup instructions
- Deploy web to Netlify/Vercel
- Build Android APK with EAS

## Technology Stack

**Frontend**: React Native Expo + TypeScript + React Native Web
**Backend**: Supabase (Auth, Postgres, Storage, Edge Functions)
**State**: React hooks + Context (no Redux/Zustand)
**Navigation**: Expo Router (file-based)
**Storage**: SQLite (workouts) + AsyncStorage (UI state) + SecureStore (tokens)
**Styling**: React Native StyleSheet + minimal UI library

## What to Remove

❌ Service containers, repositories, factories
❌ Multiple service implementations (Mock vs Real)
❌ Complex caching layers
❌ Query optimizers
❌ Service monitoring
❌ Circuit breakers
❌ A/B testing framework
❌ Viral content optimization
❌ Percentile calculations
❌ Marketplace
❌ Mentorship system
❌ Content moderation AI
❌ Test pages and backup files
❌ PWA/Capacitor configuration

## What to Keep (Simplified)

✅ XP calculation (basic formula only)
✅ Workout validation (Zod schemas)
✅ Date helpers (used functions only)
✅ Achievement definitions (5-10 basic)
✅ Authentication (direct Supabase Auth)
✅ Workout tracking (direct Supabase queries)
✅ Basic gamification (XP, levels, streaks, achievements)
✅ Lightweight social (friends, likes, activity feed, leaderboard)
✅ Offline support (workouts only, not social)

## Code Style

**DO**:
- Write inline logic when clear
- Use direct Supabase calls
- Keep functions < 50 lines
- Use TypeScript strict mode
- Comment complex logic (why, not what)
- Use descriptive names
- Prefer fewer files

**DON'T**:
- Create abstractions without clear benefit
- Extract functions prematurely
- Add dependencies without evaluation
- Write "just in case" code
- Optimize prematurely
- Create deep folder hierarchies

## Reference Documents

- **Requirements**: `.kiro/specs/mvp-refactor/requirements.md`
- **Design**: `.kiro/specs/mvp-refactor/design.md`
- **Tasks**: `.kiro/specs/mvp-refactor/tasks.md`
- **Future Features**: `.kiro/specs/mvp-refactor/future-enhancements.md`
- **Simplification Strategy**: `.kiro/specs/mvp-refactor/SIMPLIFICATION_STRATEGY.md`

## When in Doubt

Ask yourself:
1. Is this code essential for MVP?
2. Can I write this more simply?
3. Am I adding abstraction without clear benefit?
4. Will this work on free tier?
5. Is this secure?
6. Is this easy to test?

If any answer is "no", simplify or remove it.
