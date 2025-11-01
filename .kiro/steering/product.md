# Product Overview

**LiftFire - Fitness Tracking MVP** is a React Native Expo application focused on simple workout tracking with basic gamification and lightweight social features. The app is designed to motivate users through XP, streaks, and friend competition.

## MVP Core Features (Only)
- **Workout Tracking**: Simple CRUD for workouts and exercises
- **Basic Gamification**: XP calculation, user levels, streak tracking, 5-10 basic achievements
- **Lightweight Social**: Friend connections, recent activity feed, likes on workouts, weekly leaderboard
- **Offline Support**: SQLite storage for workouts with background sync (workouts only, not social)
- **Cross-Platform**: Web + Android + iOS (single codebase with React Native Web)

## Deferred Features (Post-MVP)
See `.kiro/specs/mvp-refactor/future-enhancements.md` for complete list:
- Advanced analytics, charts, progress visualization
- Workout templates, exercise library, video demonstrations
- Real-time updates, media uploads, push notifications
- Comments, sharing, groups, complex leagues
- Premium features, marketplace, mentorship
- AI/ML features, wearables, enterprise tools

## Target Users
Fitness enthusiasts who want a simple, fast app to track workouts and compete with friends without complexity.

## Current Status
- **In Progress**: Complete MVP refactor from 215K lines to 38K lines (82% reduction)
- **Technology**: React Native Expo + TypeScript + Supabase
- **Approach**: Clean rewrite, not incremental refactor
- **Timeline**: 6-week phased implementation
- **Goal**: Production-ready MVP optimized for free-tier services