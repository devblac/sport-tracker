# Documento de Diseño - App de Fitness Gamificada PWA

## Overview

Esta PWA de fitness gamificada combina el seguimiento tradicional de entrenamientos con elementos sociales y de gamificación avanzados. La aplicación está diseñada con arquitectura offline-first, optimizada para móviles pero accesible desde cualquier dispositivo, con un sistema de roles robusto que soporta desde usuarios invitados hasta personal trainers y administradores.

### Principios de Diseño

- **Mobile-First**: Diseño prioritario para dispositivos móviles con adaptación responsive
- **Offline-First**: Funcionalidad completa sin conexión a internet
- **Performance-First**: Carga rápida, lazy loading y optimizaciones agresivas
- **Gamification-First**: Elementos de juego integrados naturalmente en cada interacción
- **Social-First**: Funcionalidades sociales que fomentan engagement y viralidad

## Arquitectura

### Arquitectura General del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend PWA                         │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (React/Vue + PWA Shell)                          │
│  ├── Mobile-First Components                               │
│  ├── Responsive Design System                              │
│  └── Offline UI States                                     │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                      │
│  ├── Workout Engine                                        │
│  ├── Gamification Engine                                   │
│  ├── Social Engine                                         │
│  └── AI Recommendation Engine                              │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                │
│  ├── Local Storage (IndexedDB)                             │
│  ├── Cache Management                                      │
│  ├── Sync Queue                                           │
│  └── Service Worker                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                           │
├─────────────────────────────────────────────────────────────┤
│  API Gateway + Load Balancer                              │
├─────────────────────────────────────────────────────────────┤
│  Microservices Architecture                                │
│  ├── Auth Service (JWT + OAuth)                           │
│  ├── User Management Service                              │
│  ├── Workout Service                                      │
│  ├── Social Service                                       │
│  ├── Gamification Service                                 │
│  ├── Content Service (Exercises)                          │
│  ├── Analytics Service                                    │
│  ├── Notification Service                                 │
│  └── Payment Service                                      │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                │
│  ├── PostgreSQL (Primary Database)                        │
│  ├── Redis (Cache + Sessions)                             │
│  ├── S3 (Media Storage)                                   │
│  └── ElasticSearch (Analytics)                            │
└─────────────────────────────────────────────────────────────┘
```

### Arquitectura Frontend (PWA)

#### Estructura de Capas

**1. Presentation Layer**

```
src/
├── components/
│   ├── ui/                 # Design system components
│   ├── workout/           # Workout-specific components
│   ├── social/            # Social features components
│   ├── gamification/      # XP, achievements, streaks
│   └── shared/            # Reusable components
├── pages/                 # Route-based page components
├── layouts/               # Layout wrappers
└── hooks/                 # Custom React hooks
```

**2. Business Logic Layer**

```
src/
├── services/
│   ├── WorkoutEngine.ts   # Core workout logic
│   ├── GamificationEngine.ts # XP, achievements, streaks
│   ├── SocialEngine.ts    # Friends, feed, sharing
│   ├── SyncEngine.ts      # Offline/online sync
│   └── AIEngine.ts        # Recommendations
├── stores/                # State management (Zustand/Redux)
└── utils/                 # Helper functions
```

**3. Data Layer**

```
src/
├── db/
│   ├── IndexedDBManager.ts # Local database
│   ├── CacheManager.ts     # Intelligent caching
│   └── SyncQueue.ts        # Offline operations queue
├── api/                    # API client layer
└── types/                  # TypeScript definitions
```

## Componentes y Interfaces

### Navegación Mobile-First

#### Bottom Navigation (5 Secciones Principales)

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Content Area                        │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  🏠     📊     💪     👥     👤                            │
│ Home  Progress Workout Social Profile                      │
└─────────────────────────────────────────────────────────────┘
```

**1. Home (🏠)**

- Dashboard con streak actual
- Quick start workout
- Feed de gym friends (últimas 3 actividades)
- Próximo challenge/achievement
- Weather-based workout suggestions

**2. Progress (📊)**

- Gráficos de progreso personal
- Personal records timeline
- Percentiles globales
- Achievement gallery
- XP y nivel actual

**3. Workout (💪)** - Centro de la app

- Active workout player
- Workout templates
- Exercise database browser
- Quick workout creator
- Timer y rest periods

**4. Social (👥)**

- Gym friends feed completo
- Challenges activos
- Leaderboards
- Mentorship connections
- Content sharing hub

**5. Profile (👤)**

- Configuración personal
- Theme dark/light toggle
- Privacy settings
- Premium upgrade CTA
- Add gym friends
- Mentor/trainer options

### Componentes Core del Sistema

#### 1. Workout Engine Components

```typescript
// Workout Player - Componente central durante entrenamientos
interface WorkoutPlayerProps {
  workout: Workout;
  onSetComplete: (setData: SetData) => void;
  onWorkoutComplete: (summary: WorkoutSummary) => void;
}

// Set Logger - Registro de series con historial
interface SetLoggerProps {
  exercise: Exercise;
  previousSets?: SetData[]; // Mostrar datos históricos
  onSetLog: (set: SetData) => void;
  setTypes: ["normal", "failure", "dropset", "warmup"];
}

// Rest Timer - Cronómetro automático entre sets
interface RestTimerProps {
  duration: number;
  autoStart: boolean;
  onComplete: () => void;
  onSkip: () => void;
}
```

#### 2. Exercise Detail Components

```typescript
// Exercise Detail View con 4 pestañas
interface ExerciseDetailProps {
  exercise: Exercise;
  userHistory: ExerciseHistory[];
  personalRecords: PersonalRecord[];
}

// Pestañas del detalle
interface ExerciseTabsProps {
  tabs: {
    about: ExerciseAboutTab; // GIF + instrucciones
    history: ExerciseHistoryTab; // Historial completo
    charts: ExerciseChartsTab; // Gráficos de progreso
    records: ExerciseRecordsTab; // PRs + records history
  };
}
```

#### 3. Gamification Components

```typescript
// XP Progress Bar - Barra de experiencia
interface XPProgressProps {
  currentXP: number;
  levelXP: number;
  level: number;
  showAnimation: boolean;
}

// Achievement Card - Tarjetas de logros
interface AchievementCardProps {
  achievement: Achievement;
  progress?: number;
  unlocked: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

// Streak Display - Mostrar racha actual
interface StreakDisplayProps {
  currentStreak: number;
  scheduledDays: string[]; // ['monday', 'thursday']
  compensationDays?: string[];
  sickDaysUsed: number;
  maxSickDays: number;
}
```

#### 4. Social Components

```typescript
// Gym Friend Card - Tarjeta de amigo
interface GymFriendCardProps {
  friend: User;
  lastWorkout?: Date;
  currentStreak: number;
  mutualFriends?: number;
  onMessage: () => void;
}

// Social Feed Item - Item del feed social
interface SocialFeedItemProps {
  post: SocialPost;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

// Challenge Card - Tarjeta de desafío
interface ChallengeCardProps {
  challenge: Challenge;
  userProgress: number;
  leaderboard: ChallengeParticipant[];
  onJoin: () => void;
}
```

## Modelos de Datos

### Modelos Core

```typescript
// Usuario con roles
interface User {
  id: string;
  email: string;
  username: string;
  role: "guest" | "basic" | "premium" | "trainer" | "admin";
  profile: UserProfile;
  settings: UserSettings;
  gamification: UserGamification;
  created_at: Date;
}

interface UserProfile {
  display_name: string;
  avatar_url?: string;
  age?: number;
  weight?: number;
  height?: number;
  fitness_level: "beginner" | "intermediate" | "advanced";
  goals: string[];
  scheduled_days: string[]; // Para streaks inteligentes
}

interface UserGamification {
  level: number;
  total_xp: number;
  current_streak: number;
  best_streak: number;
  sick_days_used: number;
  last_sick_day_reset: Date;
  achievements_unlocked: string[];
}

// Ejercicio con información completa
interface Exercise {
  id: string;
  name: string;
  type: "machine" | "dumbbell" | "barbell";
  category: string;
  body_parts: string[];
  muscle_groups: string[];
  equipment: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  instructions: string;
  gif_url?: string;
  muscle_diagram_url?: string;
  created_at: Date;
  updated_at: Date;
}

// Workout con flexibilidad de templates
interface Workout {
  id: string;
  user_id: string;
  name: string;
  exercises: WorkoutExercise[];
  is_template: boolean;
  is_completed: boolean;
  template_id?: string; // Si viene de template
  started_at?: Date;
  completed_at?: Date;
  duration?: number;
  total_volume: number;
  notes?: string;
}

interface WorkoutExercise {
  exercise_id: string;
  order: number;
  sets: SetData[];
  rest_time: number;
  notes?: string;
}

interface SetData {
  weight: number;
  reps: number;
  rpe?: number;
  type: "normal" | "failure" | "dropset" | "warmup";
  completed: boolean;
  completed_at?: Date;
}
```

### Modelos de Gamificación

```typescript
// Sistema de achievements
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "strength" | "consistency" | "social" | "milestone";
  rarity: "common" | "rare" | "epic" | "legendary";
  requirements: AchievementRequirement[];
  xp_reward: number;
  unlock_content?: string; // Contenido que desbloquea
}

interface AchievementRequirement {
  type: "workout_count" | "streak_days" | "weight_lifted" | "social_action";
  target_value: number;
  timeframe?: "daily" | "weekly" | "monthly" | "all_time";
}

// Sistema de challenges
interface Challenge {
  id: string;
  name: string;
  description: string;
  type: "individual" | "group" | "global";
  category: "strength" | "consistency" | "volume";
  start_date: Date;
  end_date: Date;
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward[];
  participants_count: number;
  max_participants?: number;
}

interface ChallengeParticipant {
  user_id: string;
  progress: number;
  rank: number;
  joined_at: Date;
}
```

### Modelos Sociales

```typescript
// Sistema de gym friends
interface GymFriend {
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: Date;
  last_interaction?: Date;
}

// Feed social
interface SocialPost {
  id: string;
  user_id: string;
  type:
    | "workout_completed"
    | "achievement_unlocked"
    | "personal_record"
    | "challenge_completed";
  data: any; // Datos específicos del tipo de post
  created_at: Date;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  visibility: "public" | "friends" | "private";
}

// Sistema de mentorship
interface MentorshipConnection {
  mentor_id: string;
  mentee_id: string;
  status: "active" | "completed" | "paused";
  started_at: Date;
  goals: string[];
  progress_notes: MentorshipNote[];
}
```

## Gestión de Estado

### Arquitectura de Estado (Zustand)

```typescript
// Store principal de la aplicación
interface AppStore {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;

  // Workout state
  activeWorkout: Workout | null;
  workoutHistory: Workout[];
  templates: Workout[];

  // Exercise state
  exercises: Exercise[];
  exerciseHistory: Map<string, ExerciseHistory[]>;

  // Social state
  gymFriends: GymFriend[];
  socialFeed: SocialPost[];

  // Gamification state
  userStats: UserStats;
  achievements: Achievement[];
  activeChallenges: Challenge[];

  // UI state
  theme: "light" | "dark";
  activeTab: string;
  isOffline: boolean;
  syncStatus: "idle" | "syncing" | "error";
}

// Actions organizadas por dominio
interface AppActions {
  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;

  // Workout actions
  startWorkout: (template?: Workout) => void;
  logSet: (exerciseId: string, setData: SetData) => void;
  completeWorkout: () => Promise<void>;

  // Social actions
  addGymFriend: (username: string) => Promise<void>;
  likePost: (postId: string) => void;

  // Sync actions
  syncData: () => Promise<void>;
  queueOfflineAction: (action: OfflineAction) => void;
}
```

## Manejo de Errores

### Estrategia de Error Handling

```typescript
// Error boundaries por dominio
interface ErrorBoundaryStrategy {
  workout: {
    // Errores durante workout no deben perder progreso
    fallback: "save-and-retry";
    recovery: "auto-save-local";
  };

  social: {
    // Errores sociales no afectan funcionalidad core
    fallback: "graceful-degradation";
    recovery: "queue-for-retry";
  };

  sync: {
    // Errores de sync se manejan en background
    fallback: "offline-mode";
    recovery: "exponential-backoff";
  };
}

// Tipos de errores específicos
enum AppErrorType {
  NETWORK_ERROR = "network_error",
  SYNC_CONFLICT = "sync_conflict",
  WORKOUT_DATA_LOSS = "workout_data_loss",
  AUTH_EXPIRED = "auth_expired",
  STORAGE_FULL = "storage_full",
  PERMISSION_DENIED = "permission_denied",
}
```

## Estrategia de Testing

### Pirámide de Testing

```
                    E2E Tests (10%)
                 ┌─────────────────┐
                 │ Critical Flows  │
                 │ - Login/Signup  │
                 │ - Complete WO   │
                 │ - Social Share  │
                 └─────────────────┘

              Integration Tests (20%)
           ┌─────────────────────────┐
           │ Component Integration   │
           │ - Workout Player       │
           │ - Exercise Detail      │
           │ - Social Feed          │
           │ - Offline Sync         │
           └─────────────────────────┘

         Unit Tests (70%)
    ┌─────────────────────────────────┐
    │ Business Logic & Utils          │
    │ - Workout calculations          │
    │ - XP/Achievement logic          │
    │ - Data transformations          │
    │ - Validation functions          │
    └─────────────────────────────────┘
```

### Testing por Funcionalidad

**Workout Engine Testing**

- Cálculos de volumen y 1RM
- Lógica de rest timers
- Validación de datos de sets
- Persistencia offline

**Gamification Testing**

- Cálculo de XP por actividades
- Lógica de achievements
- Sistema de streaks inteligentes
- Validación de challenges

**Social Engine Testing**

- Algoritmo de feed
- Sistema de notificaciones
- Validación de privacidad
- Generación de contenido compartible

## Priorización por Fases

### Fase 1 - MVP Core (8-10 semanas)

**Funcionalidades Esenciales:**

- Sistema de autenticación (Guest, Basic, Premium)
- CRUD de workouts offline-first
- Base de datos de ejercicios con sync
- Workout player con timer y set logging
- Sistema básico de templates
- Navegación mobile-first
- PWA básica con offline support

**Criterios de Éxito MVP:**

- Usuario puede crear cuenta y entrenar offline
- Datos se sincronizan cuando hay conexión
- App funciona como PWA instalable
- Performance: TTI < 3s, FCP < 1.5s

### Fase 2 - Gamificación Core (6-8 semanas)

**Funcionalidades de Gamificación:**

- Sistema de XP y niveles
- Achievements básicos (consistencia, milestones)
- Streaks inteligentes con días programados
- Personal records tracking
- Progress charts básicos
- Sistema de notificaciones

**Criterios de Éxito Gamificación:**

- 80%+ de usuarios completan primer achievement
- Streak retention > 60% después de 7 días
- Engagement diario aumenta 40%

### Fase 3 - Social Core (6-8 semanas)

**Funcionalidades Sociales:**

- Sistema de gym friends
- Feed social básico
- Sharing de workouts y achievements
- Sistema básico de likes y comentarios
- Challenges grupales simples
- Notificaciones sociales

**Criterios de Éxito Social:**

- 50%+ de usuarios agregan al menos 1 gym friend
- 30%+ de workouts se comparten
- Viral coefficient > 0.3

### Fase 4 - Features Avanzadas (8-10 semanas)

**Funcionalidades Avanzadas:**

- AI recommendations
- Percentiles globales
- Sistema de mentorship
- Marketplace básico para trainers
- Challenges complejos con leaderboards
- Analytics avanzados
- Content creation tools

### Fase 5 - Optimización y Escala (6-8 semanas)

**Optimizaciones:**

- Performance optimizations
- Advanced caching strategies
- Real-time features
- Advanced analytics
- A/B testing framework
- Monetization optimization

## Consideraciones de Performance

### Métricas Objetivo

```
Performance Targets:
├── Time to Interactive: < 3 segundos
├── First Contentful Paint: < 1.5 segundos
├── Largest Contentful Paint: < 2.5 segundos
├── Cumulative Layout Shift: < 0.1
├── First Input Delay: < 100ms
└── App Bundle Size: < 5MB total
```

### Estrategias de Optimización

**Code Splitting por Rutas:**

```typescript
// Lazy loading de rutas principales
const Home = lazy(() => import("./pages/Home"));
const Workout = lazy(() => import("./pages/Workout"));
const Social = lazy(() => import("./pages/Social"));
const Profile = lazy(() => import("./pages/Profile"));
```

**Caching Inteligente:**

```typescript
// Service Worker con estrategias específicas
const cacheStrategies = {
  exercises: "cache-first", // Datos estáticos
  workouts: "network-first", // Datos dinámicos
  social: "stale-while-revalidate", // Balance
  media: "cache-first-with-refresh", // Imágenes/videos
};
```

**Data Loading Optimization:**

```typescript
// Paginación inteligente
const PAGINATION_SIZES = {
  workoutHistory: 20,
  socialFeed: 15,
  exerciseHistory: 50,
  achievements: 30,
};

// Prefetching predictivo
const prefetchStrategies = {
  nextWorkout: "on-idle",
  exerciseDetails: "on-hover",
  socialContent: "on-scroll-near",
};
```

Este diseño proporciona una base sólida para desarrollar una PWA de fitness gamificada que rivalice con las mejores apps del mercado, con un enfoque claro en performance, engagement y viralidad.
