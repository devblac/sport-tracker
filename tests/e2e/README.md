# E2E Testing Suite - Sport Tracker PWA

This comprehensive End-to-End testing suite covers all critical functionality of the Sport Tracker PWA, including workout flows, social features, performance metrics, and accessibility compliance.

## 🚀 Quick Start

### Installation
```bash
# Install E2E testing dependencies
npm install

# Install Playwright browsers
npm run test:e2e:install
```

### Running Tests
```bash
# Run all E2E tests
npm run test:e2e:full

# Run specific test suites
npm run test:e2e:workout
npm run test:e2e:social
npm run test:e2e:integration
npm run test:e2e:performance
npm run test:e2e:accessibility

# Run tests with browser UI (for debugging)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# Generate and view test report
npm run test:e2e:report
```

## 📋 Test Coverage

### 1. Workout Flow Tests (`workout-flow.spec.ts`)
- ✅ Complete workout flow - Quick start
- ✅ Workout flow with templates
- ✅ Workout pause and resume functionality
- ✅ Workout auto-save functionality
- ✅ Offline workout functionality
- ✅ Rest timer functionality
- ✅ Exercise history and previous sets display

**Key Features Tested:**
- Workout creation and completion
- Set logging with different types (normal, failure, dropset, warmup)
- Rest timer with skip functionality
- Auto-save and recovery after interruption
- Offline workout completion and sync
- Exercise history integration

### 2. Social System Tests (`social-system.spec.ts`)
- ✅ Social feed displays and interactions work
- ✅ Add gym friend flow
- ✅ Challenge participation flow
- ✅ Workout sharing creates social post
- ✅ Achievement sharing creates social post
- ✅ Social notifications work
- ✅ Privacy settings affect social visibility
- ✅ Leaderboard and rankings display correctly

**Key Features Tested:**
- Social feed interactions (like, comment, share)
- Friend request system
- Challenge participation and leaderboards
- Automatic social post creation from workouts/achievements
- Privacy controls and visibility settings
- Real-time notifications

### 3. Integration Tests (`integration.spec.ts`)
- ✅ Workout completion triggers gamification and social updates
- ✅ Streak system integrates with workout completion
- ✅ Personal records trigger achievements and social posts
- ✅ Offline workout syncs with online systems
- ✅ Challenge participation integrates with workout system
- ✅ Exercise history integrates across workout sessions
- ✅ Gamification system integrates with all user actions
- ✅ Data consistency across app sections

**Key Features Tested:**
- Cross-system integration (workout → gamification → social)
- Data consistency across different app sections
- Offline/online synchronization
- Achievement and XP system integration
- Personal record tracking and celebration

### 4. Performance Tests (`performance.spec.ts`)
- ✅ Lighthouse performance audit - Home page
- ✅ Page load performance metrics
- ✅ Bundle size and resource loading
- ✅ Lazy loading performance
- ✅ Offline performance and caching
- ✅ Memory usage and performance over time
- ✅ Database query performance
- ✅ Animation and interaction performance

**Performance Targets:**
- Time to Interactive: < 3 seconds
- First Contentful Paint: < 1.5 seconds
- Bundle size: < 5MB total
- Memory increase: < 50MB during heavy usage
- Search performance: < 1 second
- Navigation animations: < 500ms

### 5. Accessibility Tests (`accessibility.spec.ts`)
- ✅ Home page accessibility audit
- ✅ Workout page accessibility audit
- ✅ Social page accessibility audit
- ✅ Keyboard navigation works throughout app
- ✅ Screen reader compatibility - ARIA labels and roles
- ✅ Color contrast and visual accessibility
- ✅ Focus management and visual indicators
- ✅ Alternative text for images and media
- ✅ Form validation and error messaging accessibility
- ✅ Mobile accessibility and touch targets
- ✅ Reduced motion preferences
- ✅ Language and internationalization accessibility

**Accessibility Standards:**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios
- Touch target sizes (44px minimum)
- Reduced motion support

## 🏗️ Test Architecture

### Page Object Model
Tests use the Page Object Model pattern for maintainable and reusable test code:

```
tests/e2e/pages/
├── BasePage.ts          # Common functionality and navigation
├── WorkoutPage.ts       # Workout-specific interactions
└── SocialPage.ts        # Social features interactions
```

### Test Utilities
Common test helpers and utilities:

```
tests/e2e/utils/
└── test-helpers.ts      # Reusable test functions
```

### Configuration
- `playwright.config.ts` - Main Playwright configuration
- `global-setup.ts` - Test environment setup
- `global-teardown.ts` - Test cleanup

## 🔧 Test Configuration

### Browsers Tested
- ✅ Chromium (Desktop)
- ✅ Firefox (Desktop)
- ✅ WebKit/Safari (Desktop)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

### Test Environments
- **Development**: `http://localhost:5173`
- **Staging**: Configurable via `STAGING_URL` environment variable

### Reporting
- HTML Report: Interactive test results
- JSON Report: Machine-readable results
- JUnit Report: CI/CD integration
- Screenshots: On test failure
- Videos: On test failure
- Traces: On retry

## 📊 Test Data Management

### Test User Setup
Each test runs with a consistent test user:
```javascript
{
  id: 'test-user-e2e',
  email: 'test@example.com',
  username: 'testuser',
  role: 'basic',
  profile: {
    display_name: 'Test User',
    fitness_level: 'intermediate',
    goals: ['strength', 'muscle_gain'],
    scheduled_days: ['monday', 'wednesday', 'friday']
  },
  gamification: {
    level: 5,
    total_xp: 1250,
    current_streak: 3,
    best_streak: 7,
    achievements_unlocked: ['first_workout', 'week_warrior']
  }
}
```

### Data Isolation
- Each test starts with clean localStorage
- IndexedDB is cleared between test runs
- Mock data is consistent and predictable

## 🚨 Debugging Tests

### Running Individual Tests
```bash
# Run specific test file
npx playwright test tests/e2e/workout-flow.spec.ts

# Run specific test by name
npx playwright test -g "Complete workout flow"

# Run with browser UI for debugging
npx playwright test --headed --slowMo=1000

# Debug with Playwright Inspector
npx playwright test --debug
```

### Test Artifacts
When tests fail, the following artifacts are generated:
- Screenshots: `test-results/screenshots/`
- Videos: `test-results/videos/`
- Traces: `test-results/traces/`
- HTML Report: `playwright-report/`

### Common Issues and Solutions

#### Test Timeouts
- Increase timeout in `playwright.config.ts`
- Add explicit waits for slow operations
- Check network conditions

#### Element Not Found
- Verify `data-testid` attributes exist in components
- Check element visibility conditions
- Use proper waiting strategies

#### Flaky Tests
- Add proper wait conditions
- Use `waitForLoadState('networkidle')`
- Implement retry logic for unstable operations

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:e2e:install
      - run: npm run test:e2e:full
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📈 Performance Monitoring

### Lighthouse Integration
Performance tests include Lighthouse audits with thresholds:
- Performance: 80+
- Accessibility: 90+
- Best Practices: 80+
- SEO: 80+
- PWA: 80+

### Core Web Vitals
Tests monitor and assert on:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

## 🎯 Test Maintenance

### Adding New Tests
1. Create test file in appropriate category
2. Use Page Object Model for interactions
3. Add proper `data-testid` attributes to components
4. Include accessibility checks
5. Update this documentation

### Updating Existing Tests
1. Maintain backward compatibility
2. Update page objects if UI changes
3. Verify test data requirements
4. Run full suite to check for regressions

### Best Practices
- Use descriptive test names
- Keep tests independent and isolated
- Use proper waiting strategies
- Include both positive and negative test cases
- Test error conditions and edge cases
- Maintain test data consistency

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Accessibility Testing Guide](https://playwright.dev/docs/accessibility-testing)
- [Performance Testing with Lighthouse](https://github.com/GoogleChrome/lighthouse-ci)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 🤝 Contributing

When adding new features to the app:
1. Add corresponding `data-testid` attributes
2. Write E2E tests for new functionality
3. Update page objects if needed
4. Run full test suite before submitting PR
5. Update test documentation

For questions or issues with the test suite, please check the test artifacts and logs, or reach out to the development team.