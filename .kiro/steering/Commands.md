---
inclusion: always
---

# Development Commands & Workflow Guidelines

## Restricted Commands

- **DO NOT** run `npm run dev` - Development server should be managed by the user
- **DO NOT** use `cd` command - Use the `path` parameter in shell commands instead

## Test Execution Guidelines

- When running `npm test`, automatically press 'q' after tests complete to exit watch mode
- Use `npm run test:coverage` for coverage reports without watch mode
- For E2E tests, use `npm run test:e2e` or specific Playwright commands

## Preferred Development Commands

### Build & Validation

```bash
npm run build           # Production build
npm run type-check      # TypeScript validation
npm run lint            # ESLint check
npm run format          # Prettier formatting
```

### Testing

```bash
npm run test            # Unit tests (exit with 'q')
npm run test:coverage   # Coverage report
npm run test:ui         # Tests with UI
npm run test:e2e        # E2E tests
```

### Analysis & Performance

```bash
npm run build:analyze   # Bundle analysis
npm run lighthouse      # Performance audit
```

## Code Quality Workflow

1. Always run `npm run type-check` before builds
2. Use `npm run lint` to check code style
3. Run `npm run format` to fix formatting issues
4. Execute relevant tests before committing changes

## Mobile Development

- Use `npm run build:mobile` for mobile-optimized builds
- Test mobile performance with `npm run test:mobile`
- Validate mobile builds with `npm run validate:mobile`

## Deployment Preparation

- Run full test suite before deployment
- Execute `npm run build:analyze` to check bundle size
- Validate with `npm run lighthouse` for performance metrics
