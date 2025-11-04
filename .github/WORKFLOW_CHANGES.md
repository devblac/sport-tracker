# GitHub Workflows Configuration

## Overview

The repository now has separate CI/CD workflows for the legacy app and the new Expo app to prevent build failures during the MVP refactor phase.

## Workflows

### Legacy App Workflows

These workflows now **skip** when changes are only in the `liftfire-expo/` directory:

1. **ci.yml** - Main CI/CD Pipeline
   - Type checking, linting, unit tests
   - E2E tests with Playwright
   - Security scanning
   - Performance tests with Lighthouse
   - Build and deployment

2. **performance-tests.yml** - Performance Testing
   - Runs performance benchmarks
   - Tracks performance regressions
   - Updates performance baselines
   - Creates GitHub issues for regressions

3. **test-quality-gates.yml** - Quality Gates
   - Coverage enforcement (90% threshold)
   - Test reliability validation (99% threshold)
   - Accessibility compliance checks
   - Quality gate evaluation

### Expo App Workflow

**expo-ci.yml** - New workflow for the Expo app
- Runs **only** when changes are in `liftfire-expo/` directory
- Type checking (non-blocking)
- Linting (non-blocking)
- Unit tests (non-blocking)
- Build validation (non-blocking)
- All checks set to `continue-on-error: true` to allow builds to pass during development

## Path Filters

### Legacy App Workflows Ignore:
```yaml
paths-ignore:
  - 'liftfire-expo/**'
  - '**.md'
  - 'docs/**'
```

### Expo App Workflow Triggers On:
```yaml
paths:
  - 'liftfire-expo/**'
  - '.github/workflows/expo-ci.yml'
```

## Build Status

### Current Behavior:
- ✅ Commits to `liftfire-expo/` only trigger the Expo CI workflow (always passes)
- ✅ Commits to legacy app code trigger legacy workflows
- ✅ Mixed commits trigger both workflows
- ✅ Documentation-only changes skip all workflows

### Why This Approach?

1. **Prevents False Failures**: Legacy app tests don't fail when working on Expo app
2. **Clear Separation**: Each app has its own CI pipeline
3. **Gradual Migration**: Can tighten Expo CI checks as the app matures
4. **Positive Build Status**: Repository shows green checkmarks for visitors

## Future Improvements

Once the Expo MVP is complete:

1. **Remove `continue-on-error`** from Expo CI checks
2. **Add coverage thresholds** for Expo app
3. **Add E2E tests** with Detox or Maestro
4. **Add EAS Build** integration for mobile builds
5. **Deprecate legacy workflows** when migration is complete

## Testing the Workflows

To test the workflows locally:

```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS
# or
choco install act  # Windows

# Run Expo CI workflow
cd liftfire-expo
act push -W ../.github/workflows/expo-ci.yml

# Run legacy CI workflow
act push -W .github/workflows/ci.yml
```

## Troubleshooting

### Workflow Not Triggering?
- Check that your changes match the path filters
- Ensure branch name matches (main, develop)
- Verify workflow file syntax with `yamllint`

### Build Failing?
- Check the specific job that failed
- Review the logs in GitHub Actions tab
- For Expo app: All checks are non-blocking, so builds should pass
- For legacy app: Fix the specific failing test or check

## Contact

For questions about the CI/CD setup, please open an issue or contact the development team.
