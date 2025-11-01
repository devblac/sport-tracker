# Requirements Document

## Introduction

This specification defines the requirements for refactoring the LiftFire fitness application from its current state (~215,000 lines of code) into a lean, production-ready MVP using React Native Expo. The refactor aims to reduce code complexity by 85-90%, eliminate over-engineering, use Supabase as the complete backend solution, and deliver a working cross-platform application (Web + Android + iOS) with minimal code and maximum clarity.

## Glossary

- **Expo Application**: The React Native Expo application that runs on Web, Android, and iOS using a single codebase with React Native Web for web compatibility
- **Supabase**: Backend-as-a-Service (BaaS) platform providing PostgreSQL database, authentication, real-time subscriptions, storage, and Edge Functions (TypeScript)
- **MVP (Minimum Viable Product)**: The simplest version of the product that delivers core value with essential features: auth, workout tracking, basic gamification (XP, levels, streaks, achievements), essential social features (friends, feed, leaderboards), offline-first functionality, and progress stats
- **Row Level Security (RLS)**: Database-level security policies in Supabase that restrict data access based on user identity, eliminating the need for custom backend API
- **React Native Web**: Library that enables React Native components to run in web browsers, allowing true cross-platform development
- **Edge Functions**: Serverless TypeScript functions hosted on Supabase for backend logic that cannot be handled by RLS alone
- **Code Reduction Target**: Goal to reduce codebase from ~215,000 lines to ~30,000-40,000 lines (80-85% reduction) while including essential gamification, social, and offline features
- **Service Key**: Supabase admin key that bypasses RLS - must NEVER be exposed in client code

## Requirements

### Requirement 1

**User Story:** As a product owner, I want to identify and retain only MVP-essential features, so that the codebase is minimal and focused on core value delivery

#### Acceptance Criteria

1. THE Expo Application SHALL include user authentication (sign up, login, logout) as a core feature
2. THE Expo Application SHALL include simple workout tracking with CRUD operations (create, read, update, delete workouts)
3. THE Expo Application SHALL include basic gamification (XP calculation, user levels, streak tracking, simple achievements)
4. THE Expo Application SHALL include essential social features (friend connections, social feed showing workout completions, simple leaderboards)
5. THE Expo Application SHALL include offline-first functionality with local storage and background sync
6. THE Expo Application SHALL include personal progress summary showing basic statistics
7. THE Expo Application SHALL exclude non-essential features including: advanced analytics, A/B testing, marketplace, mentorship, percentile calculations, complex league systems, viral content optimization, payment processing, and content moderation

### Requirement 2

**User Story:** As a developer, I want to use Supabase as the complete backend solution, so that I avoid building and maintaining custom backend infrastructure

#### Acceptance Criteria

1. THE Expo Application SHALL use Supabase Auth for all authentication operations (sign up, login, logout, session management)
2. THE Expo Application SHALL use Supabase Postgres with Row Level Security (RLS) for all data storage and queries
3. THE Expo Application SHALL use Supabase Storage for any file uploads (if needed)
4. WHEN complex backend logic is required, THE System SHALL use Supabase Edge Functions written in TypeScript
5. THE Expo Application SHALL use the Supabase JavaScript client library for all backend interactions

### Requirement 3

**User Story:** As a security engineer, I want proper security architecture using Supabase RLS, so that user data is protected without custom backend code

#### Acceptance Criteria

1. THE System SHALL implement Row Level Security (RLS) policies on all Supabase database tables to restrict data access by user
2. THE Expo Application SHALL use only the Supabase anon key (public key) in client code
3. THE System SHALL NEVER expose the Supabase service key (admin key) in client code or version control
4. THE Expo Application SHALL store Supabase keys in environment variables using a .env file
5. THE System SHALL use Supabase Auth JWT tokens for automatic user authentication in RLS policies

### Requirement 4

**User Story:** As a mobile developer, I want to use React Native Expo for true cross-platform development, so that one codebase runs on Web, Android, and iOS

#### Acceptance Criteria

1. THE Expo Application SHALL be built using React Native Expo with TypeScript
2. THE Expo Application SHALL use React Native Web to enable web browser compatibility
3. THE Expo Application SHALL run with the command "npx expo start" for development on all platforms
4. THE Expo Application SHALL use Expo's built-in components and APIs to minimize external dependencies
5. THE Expo Application SHALL be testable on Web and Android without requiring iOS development environment initially

### Requirement 5

**User Story:** As a developer, I want a minimal technology stack with few dependencies, so that the codebase is simple and easy to understand

#### Acceptance Criteria

1. THE Expo Application SHALL use React Native, Expo, TypeScript, and Supabase client as the core technology stack
2. THE Expo Application SHALL use minimal external dependencies, preferring Expo built-in solutions
3. THE Expo Application SHALL use React hooks for state management instead of complex state management libraries
4. THE Expo Application SHALL use Expo Router OR React Navigation for navigation (whichever is simpler)
5. THE Expo Application SHALL avoid unnecessary abstractions, preferring direct Supabase client calls over wrapper services

### Requirement 6

**User Story:** As a developer, I want to prioritize code brevity and clarity over perfect architecture, so that the codebase is easy to learn and modify

#### Acceptance Criteria

1. THE Expo Application SHALL prefer fewer files over perfect separation of concerns
2. THE Expo Application SHALL avoid creating abstraction layers (repositories, service containers, factories) unless absolutely necessary
3. THE Expo Application SHALL use direct Supabase client calls in components and hooks
4. THE Expo Application SHALL keep components small and readable, preferring inline logic over excessive extraction
5. THE Expo Application SHALL reduce total lines of code from ~215,000 to ~30,000-40,000 (80-85% reduction)

### Requirement 7

**User Story:** As a developer, I want offline-first functionality for workouts only, so that users can track workouts without internet while keeping social features simple

#### Acceptance Criteria

1. THE Expo Application SHALL store workout data locally using SQLite for offline access
2. WHEN network connectivity is available, THE Expo Application SHALL synchronize local workout changes to Supabase
3. THE Expo Application SHALL queue offline workout operations and process them in order when connectivity is restored
4. THE Expo Application SHALL NOT implement offline storage for social features (friends, likes, leaderboard) to reduce complexity
5. THE Expo Application SHALL use polling (every 45-60 seconds) instead of real-time subscriptions for social data updates

### Requirement 8

**User Story:** As a user, I want basic gamification features that motivate me, so that I stay engaged with the app

#### Acceptance Criteria

1. THE System SHALL calculate XP for completed workouts based on duration and intensity
2. THE System SHALL track user levels based on accumulated XP with simple level thresholds
3. THE System SHALL track workout streaks (consecutive days with workouts)
4. THE System SHALL award simple achievements for milestones (e.g., "First Workout", "10 Workouts", "7 Day Streak")
5. THE System SHALL display XP, level, and current streak on the user profile

### Requirement 9

**User Story:** As a user, I want lightweight social features to connect with friends and compare progress, so that I stay motivated without expensive infrastructure

#### Acceptance Criteria

1. THE System SHALL implement friend connections with follow/accept workflow using a single friendships table
2. THE System SHALL display recent friends' workout activity by querying workouts table directly (no separate social_feed table)
3. THE System SHALL implement likes on workouts with optimistic UI updates (no real-time subscriptions)
4. THE System SHALL provide weekly leaderboard (global and friends-only) using a materialized view refreshed hourly
5. THE System SHALL exclude real-time subscriptions, media uploads, notifications, comments, and full social feed pagination from the MVP

### Requirement 10

**User Story:** As a developer, I want clear setup instructions and configuration, so that the application can be run immediately after cloning

#### Acceptance Criteria

1. THE Project SHALL include a README.md with setup instructions for running "npx expo start"
2. THE Project SHALL include a .env.example file showing required Supabase configuration variables
3. THE Project SHALL include instructions for creating a Supabase project and obtaining API keys
4. THE Project SHALL include database migration SQL files for setting up the Supabase schema
5. THE Project SHALL be runnable on Web and Android with minimal configuration after setting environment variables
