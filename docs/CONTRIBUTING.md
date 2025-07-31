# 🤝 Contributing Guide

## Welcome Contributors!

Thank you for your interest in contributing to Sport Tracker PWA! This guide will help you get started with contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Documentation](#documentation)

## 📜 Code of Conduct

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Git** for version control
- **VS Code** (recommended) with suggested extensions

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sport-tracker.git
   cd sport-tracker
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/sport-tracker.git
   ```

### Initial Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```

4. **Check code quality**:
   ```bash
   npm run lint
   npm run type-check
   ```

## 🔄 Development Workflow

### Branch Strategy

We use **Git Flow** with the following branches:

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: New features
- **`bugfix/*`**: Bug fixes
- **`hotfix/*`**: Critical production fixes

### Creating a Feature Branch

```bash
# Update your local develop branch
git checkout develop
git pull upstream develop

# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git add .
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### Commit Message Convention

We follow **Conventional Commits** specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

#### Examples

```bash
feat: add workout template creation
fix: resolve timer not stopping on workout completion
docs: update API documentation for exercise service
style: format code according to prettier rules
refactor: extract common workout calculations to utility
perf: optimize exercise search with debouncing
test: add integration tests for workout player
chore: update dependencies to latest versions
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Update develop branch
git checkout develop
git merge upstream/develop

# Update your feature branch
git checkout feature/your-feature-name
git rebase develop
```

## 📝 Coding Standards

### TypeScript Guidelines

#### Type Safety
```typescript
// ✅ Good: Use specific types
interface WorkoutExercise {
  exerciseId: string;
  sets: SetData[];
  restTime?: number;
}

// ❌ Bad: Use any type
interface WorkoutExercise {
  exerciseId: any;
  sets: any[];
  restTime: any;
}
```

#### Naming Conventions
```typescript
// ✅ Good: Descriptive names
const calculateOneRepMax = (weight: number, reps: number): number => {
  return weight * (1 + reps / 30);
};

// ❌ Bad: Unclear names
const calc = (w: number, r: number): number => {
  return w * (1 + r / 30);
};
```

#### Interface Design
```typescript
// ✅ Good: Clear, focused interfaces
interface Exercise {
  readonly id: string;
  name: string;
  category: ExerciseCategory;
  bodyParts: BodyPart[];
  instructions: string[];
}

// ❌ Bad: Unclear or overly broad interfaces
interface Exercise {
  id: any;
  data: any;
  info: any;
}
```

### React Component Guidelines

#### Component Structure
```typescript
// ✅ Good: Clear component structure
interface WorkoutCardProps {
  workout: Workout;
  onSelect?: (workout: Workout) => void;
  className?: string;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onSelect,
  className
}) => {
  const handleClick = useCallback(() => {
    onSelect?.(workout);
  }, [workout, onSelect]);

  return (
    <Card className={cn('workout-card', className)} onClick={handleClick}>
      <CardHeader>
        <CardTitle>{workout.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
};
```

#### Hooks Usage
```typescript
// ✅ Good: Custom hooks for complex logic
const useWorkoutTimer = (initialTime: number = 0) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setTime(initialTime);
    setIsRunning(false);
  }, [initialTime]);

  return { time, isRunning, start, stop, reset };
};
```

### CSS/Styling Guidelines

#### Tailwind CSS Usage
```typescript
// ✅ Good: Semantic class combinations
<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
  Start Workout
</button>

// ✅ Good: Use cn utility for conditional classes
<div className={cn(
  'workout-card',
  'p-4 rounded-lg border',
  {
    'border-green-500': workout.status === 'completed',
    'border-blue-500': workout.status === 'in_progress',
    'border-gray-300': workout.status === 'planned'
  },
  className
)}>
```

#### Component Styling
```typescript
// ✅ Good: Consistent spacing and responsive design
<div className="space-y-4 p-4 md:p-6">
  <h2 className="text-xl md:text-2xl font-bold">Workout History</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {workouts.map(workout => (
      <WorkoutCard key={workout.id} workout={workout} />
    ))}
  </div>
</div>
```

### File Organization

#### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── workouts/       # Workout-specific components
│   ├── exercises/      # Exercise-specific components
│   └── auth/           # Authentication components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # Business logic services
├── stores/             # State management
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── test/               # Test utilities
```

#### File Naming
- **Components**: PascalCase (`WorkoutCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useWorkout.ts`)
- **Services**: PascalCase (`WorkoutService.ts`)
- **Utils**: camelCase (`dateTime.ts`)
- **Types**: camelCase (`workout.ts`)

## 🧪 Testing Requirements

### Test Coverage

All contributions must maintain or improve test coverage:

- **Minimum coverage**: 80% for lines, branches, functions, and statements
- **New features**: Must include comprehensive tests
- **Bug fixes**: Must include regression tests

### Testing Guidelines

#### Unit Tests
```typescript
// ✅ Good: Focused unit test
describe('calculateOneRepMax', () => {
  it('should calculate 1RM using Epley formula', () => {
    const result = calculateOneRepMax(100, 8);
    expect(result).toBeCloseTo(126.67, 2);
  });

  it('should handle edge case of 1 rep', () => {
    const result = calculateOneRepMax(100, 1);
    expect(result).toBe(100);
  });

  it('should throw error for invalid inputs', () => {
    expect(() => calculateOneRepMax(-100, 8)).toThrow();
    expect(() => calculateOneRepMax(100, -1)).toThrow();
  });
});
```

#### Component Tests
```typescript
// ✅ Good: Component behavior test
describe('WorkoutCard', () => {
  it('should display workout information correctly', () => {
    const workout = createMockWorkout();
    render(<WorkoutCard workout={workout} />);
    
    expect(screen.getByText(workout.name)).toBeInTheDocument();
    expect(screen.getByText(workout.description)).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const onSelect = vi.fn();
    const workout = createMockWorkout();
    
    render(<WorkoutCard workout={workout} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    
    expect(onSelect).toHaveBeenCalledWith(workout);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- WorkoutCard.test.tsx
```

## 🔍 Pull Request Process

### Before Submitting

1. **Ensure your code follows our standards**:
   ```bash
   npm run lint
   npm run type-check
   npm run format
   ```

2. **Run the full test suite**:
   ```bash
   npm test
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Update documentation** if needed

### PR Template

When creating a pull request, use this template:

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Coverage maintained or improved

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Testing** in development environment
4. **Approval** and merge by maintainer

### Review Criteria

Reviewers will check for:
- **Code quality** and adherence to standards
- **Test coverage** and quality
- **Performance** implications
- **Security** considerations
- **Documentation** completeness
- **Backward compatibility**

## 🐛 Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check documentation** for solutions
3. **Try the latest version** to see if the issue persists

### Issue Types

#### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
```

#### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Issue Labels

- **`bug`**: Something isn't working
- **`enhancement`**: New feature or request
- **`documentation`**: Improvements or additions to documentation
- **`good first issue`**: Good for newcomers
- **`help wanted`**: Extra attention is needed
- **`priority: high`**: High priority issue
- **`priority: low`**: Low priority issue

## 📚 Documentation

### Documentation Standards

#### Code Comments
```typescript
/**
 * Calculates the one-rep max using the Epley formula
 * @param weight - The weight lifted
 * @param reps - The number of repetitions performed
 * @returns The estimated one-rep max
 * @throws {Error} When weight or reps are negative
 */
export const calculateOneRepMax = (weight: number, reps: number): number => {
  if (weight < 0 || reps < 0) {
    throw new Error('Weight and reps must be positive numbers');
  }
  
  if (reps === 1) {
    return weight;
  }
  
  // Epley formula: 1RM = weight × (1 + reps/30)
  return weight * (1 + reps / 30);
};
```

#### README Updates
When adding new features, update the relevant documentation:
- Main README.md
- API documentation
- Architecture documentation
- Deployment guide

#### JSDoc Standards
```typescript
/**
 * Service for managing workout data and operations
 * 
 * @example
 * ```typescript
 * const workoutService = WorkoutService.getInstance();
 * const workout = await workoutService.createWorkout({
 *   name: 'Push Day',
 *   exercises: [...]
 * });
 * ```
 */
export class WorkoutService {
  /**
   * Creates a new workout
   * @param workoutData - The workout data to create
   * @returns Promise that resolves to the created workout
   */
  async createWorkout(workoutData: WorkoutCreate): Promise<Workout> {
    // Implementation
  }
}
```

## 🎯 Getting Help

### Communication Channels

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: For real-time chat (link in README)

### Mentorship

New contributors can request mentorship by:
1. Looking for issues labeled `good first issue`
2. Commenting on issues asking for guidance
3. Reaching out to maintainers

### Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

## 🏆 Recognition

Contributors will be recognized in:
- **Contributors section** in README
- **Release notes** for significant contributions
- **Hall of Fame** for outstanding contributions

### Contribution Types

We recognize various types of contributions:
- **Code**: Bug fixes, features, refactoring
- **Documentation**: Writing, editing, translating
- **Design**: UI/UX improvements, graphics
- **Testing**: Writing tests, finding bugs
- **Community**: Helping others, organizing events

## 📄 License

By contributing to Sport Tracker PWA, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to Sport Tracker PWA! Your efforts help make fitness tracking better for everyone. 🏋️‍♀️💪

*This contributing guide is a living document and will be updated as the project evolves. Last updated: January 2025*