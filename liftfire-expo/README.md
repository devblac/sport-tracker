# LiftFire MVP - Fitness Tracking Simplified

A React Native Expo application for fitness tracking with basic gamification and lightweight social features.

## 🎯 MVP Features

- ✅ User Authentication (Supabase Auth)
- ✅ Workout Tracking (CRUD with offline support)
- ✅ Basic Gamification (XP, levels, streaks, achievements)
- ✅ Lightweight Social (friends, likes, activity feed, leaderboard)
- ✅ Offline Support (workouts only, SQLite + sync queue)
- ✅ Cross-Platform (Web + Android + iOS)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Expo CLI (installed via npx)
- Supabase account (free tier)

### Installation

1. **Clone and install dependencies**

```bash
cd liftfire-expo
npm install
```

2. **Set up environment variables**

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your Supabase credentials
```

Get your Supabase credentials from: https://supabase.com/dashboard/project/_/settings/api

3. **Start development server**

```bash
npm start
```

Then choose your platform:
- Press `w` for web
- Press `a` for Android
- Press `i` for iOS (Mac only)

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

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for project to be ready (~2 minutes)

### 2. Get API Keys

1. Go to Project Settings → API
2. Copy:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: Your public API key

3. Add to `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Database Migrations

See `supabase/migrations/` folder for SQL migration files.

Run them in order in the Supabase SQL Editor:
1. `001_create_users_table.sql`
2. `002_create_workouts_table.sql`
3. `003_create_exercises_table.sql`
4. `004_create_friendships_table.sql`
5. `005_create_likes_table.sql`
6. `006_create_achievements_table.sql`
7. `007_create_leaderboard_view.sql`
8. `008_enable_rls.sql`

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

## 📚 Documentation

- **Full Spec**: See `../.kiro/specs/mvp-refactor/` in parent directory
- **Requirements**: `requirements.md`
- **Design**: `design.md`
- **Tasks**: `tasks.md`
- **Future Features**: `future-enhancements.md`

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

Required variables in `.env`:

```env
# Supabase (required)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Security Notes**:
- Only use `EXPO_PUBLIC_` prefix for client-safe variables
- Never add service_role key to client code
- Never commit `.env` to version control

## 🐛 Troubleshooting

### Port Already in Use
```bash
npx kill-port 8081
npm start
```

### Android Emulator Not Detected
```bash
adb devices
adb kill-server
adb start-server
```

### Supabase Connection Issues
- Verify URL and anon key in `.env`
- Check project is active in Supabase dashboard
- Verify network connectivity

## 📄 License

See LICENSE file for details.

## 🤝 Contributing

This is an MVP refactor focused on simplification. When contributing:

1. Follow MVP principles (less code, no over-engineering)
2. Use direct Supabase calls (no wrapper services)
3. Keep functions < 50 lines
4. Write tests for core logic only
5. Ensure security (RLS, SecureStore, validation)

---

**Status**: MVP Refactor In Progress  
**Version**: 1.0.0  
**Last Updated**: 2025-10-31
