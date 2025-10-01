# Test Maintenance Procedures and Troubleshooting Guide

## Daily Maintenance Procedures

### 1. Test Health Check (5 minutes)

```bash
# Run quick test health check
npm test -- --run --reporter=basic | tee daily-test-status.log

# Check for critical failures
grep -E "FAIL.*critical|Error.*security" daily-test-status.log

# Monitor test execution time
grep "Duration" daily-test-status.log
```

**Expected Results:**
- Test execution time < 2 minutes
- No critical security test failures
- Pass rate > 95%

**Alert Conditions:**
- Pass rate drops below 90%
- Execution time exceeds 3 minutes
- Any security test failures

### 2. Coverage Quick Check (3 minutes)

```bash
# Generate basic coverage report
npm run test:coverage -- --run --reporter=text-summary

# Check overall coverage percentage
grep "All files" coverage/text-summary.txt
```

**Expected Results:**
- Overall coverage > 85%
- No major coverage drops from previous day

### 3. Performance Monitoring (2 minutes)

```bash
# Check for memory leaks
npm test -- --run 2>&1 | grep -i "memory\|leak\|heap"

# Monitor test performance
npm run test:performance -- --run --reporter=json > performance-check.json
```

## Weekly Maintenance Procedures

### 1. Comprehensive Test Analysis (30 minutes)

```bash
# Generate detailed test report
npm test -- --run --reporter=verbose --reporter=json > weekly-test-report.json

# Analyze failure patterns
node scripts/analyze-test-patterns.js weekly-test-report.json

# Generate coverage trend report
npm run test:coverage -- --run --reporter=html
```

**Analysis Tasks:**
- Identify recurring test failures
- Review coverage trends by module
- Check for new flaky tests
- Validate performance benchmarks

### 2. Mock Service Validation (15 minutes)

```bash
# Validate Supabase mocks
npm run test:integration -- --grep "supabase" --run

# Check auth service mocks
npm run test:auth -- --run

# Verify API endpoint mocks
npm run test:api -- --run
```

**Validation Checklist:**
- [ ] All Supabase operations properly mocked
- [ ] Auth flows working in test environment
- [ ] API responses match expected formats
- [ ] Error scenarios properly simulated

### 3. Accessibility Audit (20 minutes)

```bash
# Run automated accessibility tests
npm run test:accessibility -- --run

# Generate accessibility report
npm run a11y:audit -- --output-format=html

# Review manual test checklist
cat docs/accessibility-manual-checklist.md
```

## Monthly Maintenance Procedures

### 1. Test Infrastructure Review (2 hours)

#### Coverage System Health Check
```bash
# Validate coverage collection
npm run test:coverage -- --run --reporter=json > coverage-health.json

# Check per-module thresholds
node scripts/validate-coverage-thresholds.js

# Review coverage watermarks
grep -A 10 "watermarks" vitest.config.ts
```

#### Reliability Tracking Validation
```bash
# Generate reliability metrics
node scripts/calculate-test-reliability.js --window=50

# Check flaky test detection
node scripts/detect-flaky-tests.js --window=20

# Review reliability trends
node scripts/generate-reliability-report.js
```

### 2. Performance Baseline Updates (1 hour)

```bash
# Update performance baselines
npm run test:performance -- --update-baselines

# Validate regression detection
npm run test:regression -- --run

# Review performance trends
node scripts/analyze-performance-trends.js
```

### 3. Quality Gate Effectiveness Review (1 hour)

```bash
# Test quality gate enforcement
npm run quality:validate-all

# Review threshold appropriateness
node scripts/analyze-quality-thresholds.js

# Check CI/CD integration
npm run test:ci-integration
```

## Troubleshooting Guide

### Common Test Failures

#### 1. Component Import Errors

**Symptoms:**
```
Error: Element type is invalid: expected a string (for built-in components) 
or a class/function (for composite components) but got: undefined.
```

**Diagnosis:**
```bash
# Check component exports
grep -r "export.*Component" src/components/

# Verify import statements
grep -r "import.*Component" src/components/
```

**Solutions:**
```typescript
// ✅ Correct default export
export default function ComponentName() { ... }

// ✅ Correct named export
export function ComponentName() { ... }
export { ComponentName };

// ✅ Correct import for default export
import ComponentName from './ComponentName';

// ✅ Correct import for named export
import { ComponentName } from './ComponentName';

// ❌ Avoid mixed exports without proper default
export { ComponentName }; // Missing default
import ComponentName from './ComponentName'; // Will be undefined
```

#### 2. Mock Framework Inconsistencies

**Symptoms:**
```
ReferenceError: jest is not defined
```

**Diagnosis:**
```bash
# Find Jest usage in Vitest environment
grep -r "jest\." src/ --include="*.test.*"
```

**Solutions:**
```typescript
// ✅ Use Vitest mocks
import { vi } from 'vitest';
const mockFn = vi.fn();
const mockModule = vi.mock('./module');

// ❌ Don't use Jest syntax in Vitest
const mockFn = jest.fn(); // Will fail
```

#### 3. Supabase Mock Issues

**Symptoms:**
```
TypeError: Cannot read properties of undefined (reading 'from')
```

**Diagnosis:**
```bash
# Check Supabase mock implementation
cat src/test/mocks/supabase.ts

# Verify mock usage in tests
grep -r "createClient\|supabase" src/ --include="*.test.*"
```

**Solutions:**
```typescript
// ✅ Proper Supabase mock
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      update: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      delete: vi.fn(() => Promise.resolve({ data: {}, error: null }))
    }))
  }))
}));
```

#### 4. Async Test Timeouts

**Symptoms:**
```
Test timeout of 5000ms exceeded
```

**Diagnosis:**
```bash
# Find long-running tests
grep -r "await.*Promise\|setTimeout" src/ --include="*.test.*"
```

**Solutions:**
```typescript
// ✅ Increase timeout for specific tests
test('long running operation', async () => {
  // test implementation
}, 10000); // 10 second timeout

// ✅ Use fake timers for time-dependent tests
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('timer test', () => {
  const callback = vi.fn();
  setTimeout(callback, 1000);
  
  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
});
```

### Coverage Issues

#### 1. Coverage Collection Failures

**Symptoms:**
```
Error: ENOENT: no such file or directory, open 'coverage/.tmp/coverage-*.json'
```

**Diagnosis:**
```bash
# Check coverage directory permissions
ls -la coverage/
mkdir -p coverage/.tmp

# Verify Vitest coverage configuration
grep -A 20 "coverage:" vitest.config.ts
```

**Solutions:**
```bash
# Create coverage directories
mkdir -p coverage/.tmp coverage/html coverage/json

# Fix permissions (Unix/Linux)
chmod 755 coverage/
chmod 755 coverage/.tmp

# Update Vitest config for Windows compatibility
```

```typescript
// vitest.config.ts - Windows-compatible paths
export default defineConfig({
  test: {
    coverage: {
      reportsDirectory: './coverage',
      tempDirectory: './coverage/.tmp'
    }
  }
});
```

#### 2. Per-Module Coverage Enforcement

**Symptoms:**
```
Coverage threshold not enforced for individual modules
```

**Diagnosis:**
```bash
# Check coverage rules configuration
node scripts/validate-coverage-rules.js

# Test coverage enforcement
npm run coverage:enforce-per-module
```

**Solutions:**
```typescript
// Update coverage enforcer
const COVERAGE_RULES = [
  { pattern: 'src/components/**/*.tsx', minCoverage: 75, type: 'component' },
  { pattern: 'src/utils/**/*.ts', minCoverage: 85, type: 'utility' },
  { pattern: 'src/services/**/*.ts', minCoverage: 85, type: 'service' }
];

// Implement proper file matching
function validateModuleCoverage(coverageReport) {
  const violations = [];
  
  for (const rule of COVERAGE_RULES) {
    const matchingFiles = glob.sync(rule.pattern);
    
    for (const file of matchingFiles) {
      const fileCoverage = coverageReport[file];
      if (fileCoverage && fileCoverage.lines.pct < rule.minCoverage) {
        violations.push({
          file,
          expected: rule.minCoverage,
          actual: fileCoverage.lines.pct,
          type: rule.type
        });
      }
    }
  }
  
  return violations;
}
```

### Performance Issues

#### 1. Memory Leaks in Tests

**Symptoms:**
```
MaxListenersExceededWarning: Possible EventEmitter memory leak detected
```

**Diagnosis:**
```bash
# Monitor memory usage during tests
npm test -- --run --reporter=verbose 2>&1 | grep -i "memory\|heap"

# Check for event listener cleanup
grep -r "addEventListener\|removeEventListener" src/
```

**Solutions:**
```typescript
// ✅ Proper cleanup in tests
afterEach(() => {
  // Clean up event listeners
  document.removeEventListener('click', mockHandler);
  
  // Clear timers
  vi.clearAllTimers();
  
  // Reset mocks
  vi.clearAllMocks();
});

// ✅ Use cleanup utilities
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

#### 2. Slow Test Execution

**Symptoms:**
```
Test execution time > 3 minutes
```

**Diagnosis:**
```bash
# Profile test execution
npm test -- --run --reporter=verbose | grep -E "Duration|ms"

# Identify slow tests
node scripts/identify-slow-tests.js
```

**Solutions:**
```typescript
// ✅ Optimize test data generation
const createMockUser = () => ({
  id: 'user-1',
  name: 'Test User',
  // Minimal required fields only
});

// ✅ Use test parallelization
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2
      }
    }
  }
});

// ✅ Mock expensive operations
vi.mock('./expensiveCalculation', () => ({
  calculateComplexMetrics: vi.fn(() => ({ result: 'mocked' }))
}));
```

## Emergency Procedures

### Critical Test Failure Response

1. **Immediate Assessment (5 minutes)**
   ```bash
   # Check if it's a widespread issue
   npm test -- --run --bail=1
   
   # Identify affected areas
   npm test -- --run --reporter=json | jq '.testResults[].status'
   ```

2. **Rollback Decision (10 minutes)**
   ```bash
   # Check recent changes
   git log --oneline -10
   
   # Identify potential culprit commits
   git bisect start HEAD HEAD~10
   ```

3. **Quick Fix or Revert (15 minutes)**
   ```bash
   # If quick fix possible
   # Apply minimal fix and test
   
   # If not, revert problematic changes
   git revert <commit-hash>
   npm test -- --run
   ```

### CI/CD Pipeline Failure

1. **Pipeline Analysis**
   ```bash
   # Check CI logs
   # Review quality gate failures
   # Identify threshold violations
   ```

2. **Temporary Threshold Adjustment**
   ```bash
   # Lower thresholds temporarily if needed
   # Document the adjustment
   # Set reminder to restore original thresholds
   ```

3. **Root Cause Investigation**
   ```bash
   # Analyze failure patterns
   # Check for environmental issues
   # Review recent infrastructure changes
   ```

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Test Reliability Metrics**
   - Overall pass rate (target: >99%)
   - Flaky test count (target: <1%)
   - Test execution time (target: <2 minutes)

2. **Coverage Metrics**
   - Overall coverage (target: >90%)
   - Per-module coverage compliance
   - Coverage trend analysis

3. **Performance Metrics**
   - Memory usage during tests
   - Test execution performance
   - CI/CD pipeline duration

### Alert Thresholds

```yaml
# Alert configuration
alerts:
  test_reliability:
    critical: < 95%
    warning: < 98%
  
  coverage:
    critical: < 80%
    warning: < 85%
  
  execution_time:
    critical: > 300s
    warning: > 180s
  
  flaky_tests:
    critical: > 5%
    warning: > 2%
```

## Documentation Updates

### When to Update Documentation

1. **After Infrastructure Changes**
   - Update configuration examples
   - Revise troubleshooting procedures
   - Update maintenance schedules

2. **After Threshold Adjustments**
   - Document new thresholds
   - Update alert configurations
   - Revise quality gate criteria

3. **After Major Bug Fixes**
   - Add new troubleshooting entries
   - Update known issues list
   - Revise best practices

### Documentation Maintenance Schedule

- **Weekly**: Update known issues and quick fixes
- **Monthly**: Review and update procedures
- **Quarterly**: Comprehensive documentation review and updates

This maintenance guide should be reviewed and updated monthly to ensure it remains current with the evolving test infrastructure and requirements.