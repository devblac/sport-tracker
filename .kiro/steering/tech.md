# Technology Stack

## Frontend Framework
- **React 19** with TypeScript
- **Vite** as build tool with SWC for fast compilation
- **React Router DOM** for client-side routing

## Styling & UI
- **Tailwind CSS** with custom design system
- CSS variables for theming (light/dark mode support)
- Custom animations and keyframes for gamification effects
- Mobile-first responsive design

## State Management & Data
- **Zustand** for global state management
- **Zod** for schema validation and type safety
- **Supabase** for backend/database (in progress)
- **React Query/TanStack Query** patterns for data fetching

## PWA & Performance
- **Vite PWA Plugin** with Workbox for service worker
- Offline-first architecture with caching strategies
- Code splitting and lazy loading for optimal performance
- Bundle analysis and optimization

## Development Tools
- **ESLint** + **Prettier** for code formatting
- **Husky** + **lint-staged** for pre-commit hooks
- **Vitest** + **Testing Library** for unit testing
- **Playwright** for E2E testing

## Common Commands

### Development
```bash
npm run dev              # Start development server
npm run build           # Production build
npm run preview         # Preview production build
npm run type-check      # TypeScript validation
```

### Testing & Quality
```bash
npm run test            # Run unit tests
npm run test:ui         # Tests with UI
npm run test:coverage   # Coverage report
npm run lint            # ESLint check
npm run format          # Prettier formatting
```

### Analysis
```bash
npm run build:analyze   # Bundle analysis
npm run lighthouse      # Performance audit
```

## Code Organization
- Path aliases configured with `@/` pointing to `src/`
- Lazy loading for all page components
- Feature-based code splitting in build configuration