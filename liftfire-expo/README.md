# LiftFire MVP - Fitness Tracking Simplified

A React Native Expo application for fitness tracking with basic gamification and lightweight social features. Built with React Native, Expo, TypeScript, and Supabase.

## 🎯 MVP Features

- ✅ **User Authentication** - Email/password signup and login with Supabase Auth
- ✅ **Workout Tracking** - Create, edit, delete workouts with exercises (sets, reps, weight)
- ✅ **Basic Gamification** - XP calculation, user levels, streak tracking, achievements
- ✅ **Lightweight Social** - Friend connections, activity feed, likes, weekly leaderboard
- ✅ **Offline Support** - SQLite storage for workouts with background sync queue
- ✅ **Cross-Platform** - Single codebase for Web, Android, and iOS

## 📸 Screenshots

> **Note**: Add screenshots of key features here after building the app:
> - Login/Signup screens
> - Workout list and detail views
> - Social feed with friend activity
> - Profile with XP, level, and achievements
> - Leaderboard view

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** (LTS recommended) - [Download](https://nodejs.org/)
- **npm** or **yarn** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **Supabase account** (free tier) - [Sign up](https://supabase.com)

**For Android development:**
- Android Studio with Android SDK
- Android emulator or physical device

**For iOS development (Mac only):**
- Xcode 14+
- iOS Simulator or physical device

### Installation

1. **Clone the repository and navigate to the project**

```bash
git clone <repository-url>
cd liftfire-expo
```

2. **Install dependencies**

```bash
npm install
```

This will install all required packages including:
- React Native and Expo SDK
- Supabase client
- SQLite for offline storage
- React Native Paper for UI components
- And more (see package.json)

3. **Set up environment variables**

```bash
# Copy the example environment file
cp .env.example .env
```

Then edit `.env` with your Supabase credentials (see Supabase Setup section below).

4. **Set up Supabase database**

Follow the complete [Supabase Setup](#-supabase-setup) section below to:
- Create a Supabase project
- Get your API keys
- Run database migrations
- Deploy Edge Functions

5. **Start the development server**

```bash
npm start
```

Then choose your platform:
- Press `w` to open in **web browser**
- Press `a` to open in **Android emulator/device**
- Press `i` to open in **iOS simulator** (Mac only)

The Expo DevTools will open in your browser at `http://localhost:8081`

## 📱 Platform-Specific Commands

```bash
# Web
npm run web

# Android
npm run android

# iOS (Mac only)
npm run ios
```

## 🏗️ Project Structure

```
liftfire-expo/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Home screen
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Core utilities (Supabase, storage, etc.)
├── types/                 # TypeScript type definitions
├── assets/                # Images, icons, fonts
├── .env.example           # Environment variables template
├── app.json               # Expo configuration
└── package.json           # Dependencies and scripts
```

## 🔧 Available Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm test           # Run tests
npm run lint       # Lint code
npm run format     # Format code
npm run type-check # TypeScript validation
```

## 🗄️ Supabase Setup

This section provides detailed instructions for setting up your Supabase backend.

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `liftfire-mvp` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the region closest to your users
   - **Pricing Plan**: Free tier is sufficient for MVP
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be provisioned

### Step 2: Get API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll see two important values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: A long JWT token (starts with `eyJ...`)

3. Copy these values and add them to your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Security Warning:**
- **NEVER** use the `service_role` key in your client code
- Only use the `anon` key (it's safe for client-side use)
- The `anon` key respects Row Level Security (RLS) policies

### Step 3: Run Database Migrations

The database schema is defined in SQL migration files. You need to run these to set up your database.

#### Option A: Using Supabase SQL Editor (Recommended for MVP)

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open `supabase/migrations/00_mvp_schema.sql` from this project
4. Copy the entire contents and paste into the SQL Editor
5. Click **"Run"** (or press Ctrl/Cmd + Enter)
6. Verify success - you should see "Success. No rows returned"

This single migration creates:
- 6 tables: `users`, `workouts`, `exercises`, `friendships`, `likes`, `achievements`
- Row Level Security (RLS) policies for all tables
- Indexes for performance
- Materialized view for weekly leaderboard
- Helper functions for leaderboard refresh

#### Option B: Using Supabase CLI (For Production)

If you prefer using the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Step 4: Verify Database Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see these tables:
   - `users` - User profiles with XP, level, streaks
   - `workouts` - Workout records
   - `exercises` - Exercise details within workouts
   - `friendships` - Friend connections
   - `likes` - Workout likes
   - `achievements` - User achievements

3. Go to **Authentication** → **Policies**
4. Verify that RLS is enabled on all tables (you should see green "RLS enabled" badges)

### Step 5: Deploy Edge Function (Optional but Recommended)

The weekly leaderboard uses an Edge Function to refresh the materialized view hourly.

1. Install Supabase CLI (if not already installed):
```bash
npm install -g supabase
```

2. Login and link your project:
```bash
supabase login
supabase link --project-ref your-project-ref
```

3. Deploy the Edge Function:
```bash
supabase functions deploy refresh-leaderboard
```

4. Set up a cron job (using a service like [cron-job.org](https://cron-job.org)) to call the function hourly:
```
POST https://xxxxxxxxxxxxx.supabase.co/functions/v1/refresh-leaderboard
Authorization: Bearer YOUR_ANON_KEY
```

**Note**: For MVP, you can skip this step. The leaderboard will still work, but won't auto-refresh. Users can manually refresh by pulling down on the leaderboard screen.

### Step 6: Test Your Setup

1. Start your Expo app: `npm start`
2. Try signing up with a test account
3. Create a test workout
4. Verify data appears in Supabase Table Editor

If you encounter issues, see the [Troubleshooting](#-troubleshooting) section below.

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- **Tokens** stored in Expo SecureStore only
- **Service keys** never exposed in client code
- **Input validation** with Zod schemas
- **Local storage** whitelisted (no sensitive data)

## 📊 Code Metrics

- **Target**: 38K lines (82% reduction from old 215K)
- **Dependencies**: ~30 (80% reduction from old ~150)
- **Bundle Size**: < 5MB
- **Startup Time**: < 3 seconds

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage
```

## 🎮 Key Features Explained

### Authentication
- Email/password signup and login
- Secure token storage using Expo SecureStore
- Automatic session persistence
- Token refresh on expiration
- Guest mode for offline-only usage

### Workout Tracking
- Create workouts with multiple exercises
- Track sets, reps, and weight for each exercise
- Add notes to workouts and exercises
- Edit and delete workouts
- Offline-first: Create workouts without internet
- Automatic sync when back online

### Gamification System
- **XP (Experience Points)**: Earn XP for completing workouts
  - Base XP = workout duration in minutes
  - Streak bonus: +20% XP for 7+ day streaks
- **Levels**: Progress through levels based on total XP
  - Level 1: 0 XP
  - Level 2: 100 XP
  - Level 3: 250 XP
  - And so on (exponential curve)
- **Streaks**: Track consecutive days with workouts
  - Current streak displayed with fire icon
  - Longest streak recorded
- **Achievements**: Unlock badges for milestones
  - "First Workout" - Complete your first workout
  - "10 Workouts" - Complete 10 workouts
  - "7 Day Streak" - Maintain a 7-day workout streak
  - More achievements unlock as you progress

### Social Features
- **Friends**: Connect with other users
  - Send friend requests
  - Accept/reject requests
  - View friends list
- **Activity Feed**: See what your friends are doing
  - Recent workouts from friends
  - Like friends' workouts
  - Pull to refresh for latest updates
- **Leaderboard**: Compete with friends
  - Weekly XP rankings
  - Global and friends-only views
  - See your rank and progress

### Offline Support
- **Works without internet**: Create and track workouts offline
- **Automatic sync**: Changes sync when connection restored
- **Sync queue**: See pending changes waiting to sync
- **Conflict resolution**: "Last write wins" strategy
- **Note**: Social features require internet connection

## 📚 Documentation

### Project Documentation
- **Full Spec**: See `../.kiro/specs/mvp-refactor/` in parent directory
- **Requirements**: `requirements.md` - Detailed feature requirements
- **Design**: `design.md` - Architecture and design decisions
- **Tasks**: `tasks.md` - Implementation task list
- **Future Features**: `future-enhancements.md` - Post-MVP roadmap

### Additional Resources
- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **React Native Documentation**: [reactnative.dev](https://reactnative.dev)
- **TypeScript Documentation**: [typescriptlang.org/docs](https://www.typescriptlang.org/docs)

## 🎨 Code Style

- **TypeScript strict mode** (no `any` types)
- **Direct Supabase calls** (no wrapper services)
- **Functions < 50 lines**
- **Inline logic** when clear
- **Minimal abstractions**

## 🚧 Development Principles

1. **Less code is better** - Avoid over-engineering
2. **Security first** - Use RLS, SecureStore, validation
3. **Free tier optimized** - Stay within Supabase limits
4. **Easy to test** - Simple, testable code
5. **Direct implementation** - No unnecessary abstractions

## 📝 Environment Variables

### Required Variables

Your `.env` file must contain these variables:

```env
# Supabase Configuration (REQUIRED)
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Environment (OPTIONAL)
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### Optional Feature Flags

These are optional and default to `false` if not set:

```env
# Feature Flags (OPTIONAL)
EXPO_PUBLIC_FEATURE_SOCIAL_FEATURES=true
EXPO_PUBLIC_FEATURE_PREMIUM_FEATURES=false
EXPO_PUBLIC_FEATURE_AI_RECOMMENDATIONS=false
EXPO_PUBLIC_FEATURE_NEW_WORKOUT_PLAYER=true
EXPO_PUBLIC_FEATURE_REAL_TIME_NOTIFICATIONS=false
EXPO_PUBLIC_FEATURE_ADVANCED_ANALYTICS=false
EXPO_PUBLIC_FEATURE_BETA_FEATURES=true
```

### Environment-Specific Configuration

For different environments (development, staging, production), create separate `.env` files:

- `.env` - Development (local)
- `.env.staging` - Staging environment
- `.env.production` - Production environment

**Example `.env.production`:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key-here
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### Security Best Practices

**✅ DO:**
- Use `EXPO_PUBLIC_` prefix for all client-side variables
- Keep `.env` files in `.gitignore` (already configured)
- Use different Supabase projects for dev/staging/prod
- Rotate keys if accidentally exposed

**❌ DON'T:**
- Never add `SUPABASE_SERVICE_ROLE_KEY` to `.env` (backend only!)
- Never commit `.env` files to version control
- Never share your `.env` file publicly
- Never use production keys in development

### How Environment Variables Work in Expo

- Variables prefixed with `EXPO_PUBLIC_` are embedded in the app bundle
- They are accessible via `process.env.EXPO_PUBLIC_VARIABLE_NAME`
- Changes require restarting the Expo dev server
- In production builds, use EAS Secrets for sensitive values

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Expo Dev Server Won't Start

**Problem**: Port 8081 is already in use

**Solution**:
```bash
# Kill the process using port 8081
npx kill-port 8081

# Or on Windows:
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Then restart
npm start
```

#### 2. Android Emulator Not Detected

**Problem**: Expo can't find your Android emulator

**Solution**:
```bash
# Check if device is connected
adb devices

# If no devices listed, restart ADB
adb kill-server
adb start-server

# Start emulator from Android Studio or command line
emulator -avd <your-avd-name>
```

**Additional steps**:
- Ensure Android Studio is installed
- Verify ANDROID_HOME environment variable is set
- Check that emulator is running before pressing 'a' in Expo

#### 3. Supabase Connection Issues

**Problem**: "Failed to fetch" or "Network request failed"

**Solutions**:

a) **Verify environment variables**:
```bash
# Check .env file exists and has correct values
cat .env

# Restart Expo dev server after changing .env
npm start
```

b) **Check Supabase project status**:
- Go to your Supabase dashboard
- Verify project is active (not paused)
- Check project URL matches your `.env` file

c) **Test connection manually**:
```bash
# Test API endpoint
curl https://your-project.supabase.co/rest/v1/

# Should return: {"message":"The server is running"}
```

d) **Network connectivity**:
- Verify internet connection
- Check firewall settings
- Try disabling VPN if using one

#### 4. Authentication Errors

**Problem**: "Invalid API key" or "JWT expired"

**Solutions**:
- Verify you're using the `anon` key, not `service_role` key
- Check for extra spaces or line breaks in `.env`
- Regenerate API keys in Supabase if compromised
- Clear app data and try logging in again

#### 5. Database/RLS Errors

**Problem**: "Row Level Security policy violation" or "Permission denied"

**Solutions**:
- Verify RLS policies are enabled (see Supabase Setup)
- Check that you're logged in (auth token is valid)
- Review RLS policies in Supabase dashboard
- Test queries in Supabase SQL Editor with user context

#### 6. Offline Sync Issues

**Problem**: Workouts not syncing when back online

**Solutions**:
- Check network connectivity
- Verify Supabase credentials are correct
- Clear local SQLite database: Delete app data and reinstall
- Check sync queue in app (should show pending count)

#### 7. Build Errors

**Problem**: TypeScript errors or build failures

**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install

# Clear Expo cache
npx expo start -c

# Check TypeScript errors
npm run type-check
```

#### 8. iOS Simulator Issues (Mac only)

**Problem**: App won't open in iOS Simulator

**Solutions**:
- Ensure Xcode is installed and up to date
- Open Xcode and accept license agreements
- Install iOS Simulator: `xcode-select --install`
- Reset simulator: Device → Erase All Content and Settings

#### 9. Web Build Issues

**Problem**: App doesn't work in web browser

**Solutions**:
- Some React Native features don't work on web
- Check browser console for errors
- Verify React Native Web compatibility
- Use platform-specific code when needed:
```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web-specific code
}
```

#### 10. SQLite Database Errors

**Problem**: "Database is locked" or "Cannot open database"

**Solutions**:
- Close all database connections properly
- Restart the app
- Clear app data (Settings → Apps → LiftFire → Clear Data)
- Reinstall the app

### Getting Help

If you're still experiencing issues:

1. **Check Expo documentation**: [docs.expo.dev](https://docs.expo.dev)
2. **Check Supabase documentation**: [supabase.com/docs](https://supabase.com/docs)
3. **Search GitHub issues**: Check if others have reported similar issues
4. **Enable debug logging**: Set `EXPO_PUBLIC_DEBUG=true` in `.env`
5. **Check logs**:
   - Expo DevTools console
   - Browser console (for web)
   - Android Logcat: `adb logcat`
   - iOS Console: Xcode → Window → Devices and Simulators

### Debug Mode

Enable debug logging by adding to `.env`:
```env
EXPO_PUBLIC_DEBUG=true
```

This will show detailed logs for:
- Supabase API calls
- SQLite operations
- Offline sync queue
- Authentication flow

## 📄 License

See LICENSE file for details.

## 🚢 Deployment

### Web Deployment

Build and deploy the web version to platforms like Vercel, Netlify, or Cloudflare Pages:

```bash
# Build web version
npx expo export:web

# Output will be in dist/ folder
# Deploy dist/ folder to your hosting platform
```

**Recommended platforms**:
- **Vercel**: Automatic deployments from Git
- **Netlify**: Easy drag-and-drop deployment
- **Cloudflare Pages**: Fast global CDN

### Android Deployment

Build Android APK or AAB using Expo Application Services (EAS):

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

**Note**: You'll need an Expo account (free tier available).

### iOS Deployment (Mac only)

Build iOS app using EAS:

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

**Requirements**:
- Apple Developer account ($99/year)
- Mac computer for local builds (or use EAS cloud builds)

### Environment Variables for Production

For production builds, use EAS Secrets instead of `.env` files:

```bash
# Set production secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://prod.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-prod-key"
```

### Pre-Deployment Checklist

Before deploying to production:

- [ ] Run all tests: `npm test`
- [ ] Check TypeScript: `npm run type-check`
- [ ] Lint code: `npm run lint`
- [ ] Test on all platforms (Web, Android, iOS)
- [ ] Verify Supabase production database is set up
- [ ] Update app version in `app.json`
- [ ] Test offline functionality
- [ ] Verify RLS policies are enabled
- [ ] Check that no secrets are in code
- [ ] Test authentication flow
- [ ] Verify social features work
- [ ] Test on physical devices

## 🤝 Contributing

This is an MVP refactor focused on simplification and maintainability. When contributing:

### Code Guidelines

1. **Follow MVP principles**: Less code is better, avoid over-engineering
2. **Use direct Supabase calls**: No wrapper services or abstractions
3. **Keep functions small**: Target < 50 lines per function
4. **Write tests for core logic**: Focus on business logic, not UI
5. **Ensure security**: Use RLS, SecureStore, input validation
6. **TypeScript strict mode**: No `any` types
7. **Document complex logic**: Add comments explaining "why", not "what"

### Development Workflow

1. **Create a feature branch**: `git checkout -b feature/your-feature`
2. **Make your changes**: Follow code guidelines above
3. **Run tests**: `npm test`
4. **Check types**: `npm run type-check`
5. **Lint code**: `npm run lint`
6. **Format code**: `npm run format`
7. **Commit changes**: Use clear, descriptive commit messages
8. **Push and create PR**: Include description of changes

### Pull Request Guidelines

- Describe what your PR does and why
- Reference any related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Keep PRs focused and small
- Update documentation if needed

### Code Review Process

All PRs require:
- Passing tests
- TypeScript type checking
- Code review approval
- No merge conflicts

## 📄 License

See LICENSE file for details.

## 🙏 Acknowledgments

Built with:
- [React Native](https://reactnative.dev) - Mobile framework
- [Expo](https://expo.dev) - Development platform
- [Supabase](https://supabase.com) - Backend as a service
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [React Native Paper](https://reactnativepaper.com) - UI components

---

**Status**: MVP Complete  
**Version**: 1.0.0  
**Last Updated**: 2025-11-05  
**License**: MIT
