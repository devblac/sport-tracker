/**
 * Database Schema
 * 
 * Defines the IndexedDB schema for the fitness app with all required stores and indexes.
 */

import type { DBSchema } from './IndexedDBManager';

export const FITNESS_APP_SCHEMA: DBSchema = {
  name: 'FitnessAppDB',
  version: 3,
  stores: [
    // ============================================================================
    // Core Exercise Data
    // ============================================================================
    {
      name: 'exercises',
      keyPath: 'id',
      indexes: [
        { name: 'category', keyPath: 'category' },
        { name: 'bodyPart', keyPath: 'bodyPart' },
        { name: 'equipment', keyPath: 'equipment' },
        { name: 'name', keyPath: 'name' },
        { name: 'muscleGroups', keyPath: 'muscleGroups', multiEntry: true }
      ]
    },

    // ============================================================================
    // User Data
    // ============================================================================
    {
      name: 'users',
      keyPath: 'id',
      indexes: [
        { name: 'username', keyPath: 'username', unique: true },
        { name: 'email', keyPath: 'email', unique: true },
        { name: 'createdAt', keyPath: 'createdAt' }
      ]
    },

    {
      name: 'userProfiles',
      keyPath: 'userId',
      indexes: [
        { name: 'displayName', keyPath: 'displayName' },
        { name: 'fitnessLevel', keyPath: 'fitnessLevel' },
        { name: 'currentLevel', keyPath: 'currentLevel' }
      ]
    },

    // ============================================================================
    // Workout System
    // ============================================================================
    {
      name: 'workoutTemplates',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'name', keyPath: 'name' },
        { name: 'category', keyPath: 'category' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'isPublic', keyPath: 'isPublic' }
      ]
    },

    {
      name: 'workouts',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'templateId', keyPath: 'templateId' },
        { name: 'startedAt', keyPath: 'startedAt' },
        { name: 'completedAt', keyPath: 'completedAt' },
        { name: 'status', keyPath: 'status' }
      ]
    },

    {
      name: 'workoutExercises',
      keyPath: 'id',
      indexes: [
        { name: 'workoutId', keyPath: 'workoutId' },
        { name: 'exerciseId', keyPath: 'exerciseId' },
        { name: 'order', keyPath: 'order' }
      ]
    },

    {
      name: 'workoutSets',
      keyPath: 'id',
      indexes: [
        { name: 'workoutExerciseId', keyPath: 'workoutExerciseId' },
        { name: 'setNumber', keyPath: 'setNumber' },
        { name: 'completedAt', keyPath: 'completedAt' }
      ]
    },

    // ============================================================================
    // Gamification System
    // ============================================================================
    {
      name: 'userXP',
      keyPath: 'userId',
      indexes: [
        { name: 'currentLevel', keyPath: 'currentLevel' },
        { name: 'totalXP', keyPath: 'totalXP' },
        { name: 'updatedAt', keyPath: 'updatedAt' }
      ]
    },

    {
      name: 'xpTransactions',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'source', keyPath: 'source' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'userId_createdAt', keyPath: ['userId', 'createdAt'] }
      ]
    },

    {
      name: 'achievements',
      keyPath: 'id',
      indexes: [
        { name: 'category', keyPath: 'category' },
        { name: 'rarity', keyPath: 'rarity' },
        { name: 'type', keyPath: 'type' }
      ]
    },

    {
      name: 'userAchievements',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'achievementId', keyPath: 'achievementId' },
        { name: 'unlockedAt', keyPath: 'unlockedAt' },
        { name: 'userId_achievementId', keyPath: ['userId', 'achievementId'], unique: true }
      ]
    },

    // ============================================================================
    // Streaks System
    // ============================================================================
    {
      name: 'userStreaks',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'type', keyPath: 'type' },
        { name: 'isActive', keyPath: 'isActive' },
        { name: 'userId_type', keyPath: ['userId', 'type'] }
      ]
    },

    {
      name: 'streakEntries',
      keyPath: 'id',
      indexes: [
        { name: 'streakId', keyPath: 'streakId' },
        { name: 'date', keyPath: 'date' },
        { name: 'streakId_date', keyPath: ['streakId', 'date'], unique: true }
      ]
    },

    {
      name: 'streakRewards',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'streakId', keyPath: 'streakId' },
        { name: 'milestone', keyPath: 'milestone' },
        { name: 'claimedAt', keyPath: 'claimedAt' }
      ]
    },

    // ============================================================================
    // Social System
    // ============================================================================
    {
      name: 'friendships',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'friendId', keyPath: 'friendId' },
        { name: 'status', keyPath: 'status' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'userId_friendId', keyPath: ['userId', 'friendId'], unique: true }
      ]
    },

    {
      name: 'friendRequests',
      keyPath: 'id',
      indexes: [
        { name: 'senderId', keyPath: 'senderId' },
        { name: 'receiverId', keyPath: 'receiverId' },
        { name: 'status', keyPath: 'status' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'receiverId_status', keyPath: ['receiverId', 'status'] }
      ]
    },

    {
      name: 'socialPosts',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'type', keyPath: 'type' },
        { name: 'visibility', keyPath: 'visibility' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'isPinned', keyPath: 'isPinned' },
        { name: 'userId_createdAt', keyPath: ['userId', 'createdAt'] }
      ]
    },

    {
      name: 'postLikes',
      keyPath: 'id',
      indexes: [
        { name: 'postId', keyPath: 'postId' },
        { name: 'userId', keyPath: 'userId' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'postId_userId', keyPath: ['postId', 'userId'], unique: true }
      ]
    },

    {
      name: 'postComments',
      keyPath: 'id',
      indexes: [
        { name: 'postId', keyPath: 'postId' },
        { name: 'userId', keyPath: 'userId' },
        { name: 'parentCommentId', keyPath: 'parentCommentId' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'postId_createdAt', keyPath: ['postId', 'createdAt'] }
      ]
    },

    {
      name: 'postShares',
      keyPath: 'id',
      indexes: [
        { name: 'postId', keyPath: 'postId' },
        { name: 'userId', keyPath: 'userId' },
        { name: 'platform', keyPath: 'platform' },
        { name: 'createdAt', keyPath: 'createdAt' }
      ]
    },

    // ============================================================================
    // Privacy System
    // ============================================================================
    {
      name: 'privacySettings',
      keyPath: 'userId',
      indexes: [
        { name: 'profileVisibility', keyPath: 'profileVisibility' },
        { name: 'updatedAt', keyPath: 'updatedAt' }
      ]
    },

    {
      name: 'blockedUsers',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'blockedUserId', keyPath: 'blockedUserId' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'userId_blockedUserId', keyPath: ['userId', 'blockedUserId'], unique: true }
      ]
    },

    {
      name: 'reportedUsers',
      keyPath: 'id',
      indexes: [
        { name: 'reporterId', keyPath: 'reporterId' },
        { name: 'reportedUserId', keyPath: 'reportedUserId' },
        { name: 'reason', keyPath: 'reason' },
        { name: 'status', keyPath: 'status' },
        { name: 'createdAt', keyPath: 'createdAt' }
      ]
    },

    // ============================================================================
    // Notifications System
    // ============================================================================
    {
      name: 'notifications',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'type', keyPath: 'type' },
        { name: 'isRead', keyPath: 'isRead' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'userId_isRead', keyPath: ['userId', 'isRead'] },
        { name: 'userId_createdAt', keyPath: ['userId', 'createdAt'] }
      ]
    },

    {
      name: 'notificationSettings',
      keyPath: 'userId',
      indexes: [
        { name: 'updatedAt', keyPath: 'updatedAt' }
      ]
    },

    // ============================================================================
    // Progress Tracking
    // ============================================================================
    {
      name: 'personalRecords',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'exerciseId', keyPath: 'exerciseId' },
        { name: 'recordType', keyPath: 'recordType' },
        { name: 'achievedAt', keyPath: 'achievedAt' },
        { name: 'userId_exerciseId_recordType', keyPath: ['userId', 'exerciseId', 'recordType'] }
      ]
    },

    {
      name: 'progressSnapshots',
      keyPath: 'id',
      indexes: [
        { name: 'userId', keyPath: 'userId' },
        { name: 'date', keyPath: 'date' },
        { name: 'type', keyPath: 'type' },
        { name: 'userId_date', keyPath: ['userId', 'date'] }
      ]
    },

    // ============================================================================
    // Sync and Offline Support
    // ============================================================================
    {
      name: 'syncQueue',
      keyPath: 'id',
      indexes: [
        { name: 'operation', keyPath: 'operation' },
        { name: 'status', keyPath: 'status' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'priority', keyPath: 'priority' }
      ]
    },

    {
      name: 'syncMetadata',
      keyPath: 'key',
      indexes: [
        { name: 'lastSync', keyPath: 'lastSync' },
        { name: 'syncVersion', keyPath: 'syncVersion' }
      ]
    },

    // Temporarily commented out to avoid version upgrade issues
    // {
    //   name: 'syncConflicts',
    //   keyPath: 'id',
    //   indexes: [
    //     { name: 'entity', keyPath: 'entity' },
    //     { name: 'entityId', keyPath: 'entityId' },
    //     { name: 'status', keyPath: 'status' },
    //     { name: 'createdAt', keyPath: 'createdAt' }
    //   ]
    // },

    // ============================================================================
    // League System (Duolingo-style competitive leagues)
    // ============================================================================
    {
      name: 'userLeagueStats',
      keyPath: 'userId',
      indexes: [
        { name: 'currentLeague', keyPath: 'currentLeague' },
        { name: 'currentGroup', keyPath: 'currentGroup' },
        { name: 'totalPoints', keyPath: 'totalPoints' },
        { name: 'weeklyPoints', keyPath: 'weeklyPoints' },
        { name: 'position', keyPath: 'position' }
      ]
    },

    {
      name: 'leagueGroups',
      keyPath: 'id',
      indexes: [
        { name: 'leagueId', keyPath: 'leagueId' },
        { name: 'weekNumber', keyPath: 'weekNumber' },
        { name: 'year', keyPath: 'year' },
        { name: 'status', keyPath: 'status' },
        { name: 'startDate', keyPath: 'startDate' },
        { name: 'endDate', keyPath: 'endDate' },
        { name: 'leagueId_weekNumber_year', keyPath: ['leagueId', 'weekNumber', 'year'] }
      ]
    },

    // ============================================================================
    // Competition Cycles (Weekly automated competitions)
    // ============================================================================
    {
      name: 'competitionCycles',
      keyPath: 'id',
      indexes: [
        { name: 'weekNumber', keyPath: 'weekNumber' },
        { name: 'year', keyPath: 'year' },
        { name: 'status', keyPath: 'status' },
        { name: 'startDate', keyPath: 'startDate' },
        { name: 'endDate', keyPath: 'endDate' },
        { name: 'createdAt', keyPath: 'createdAt' },
        { name: 'weekNumber_year', keyPath: ['weekNumber', 'year'] }
      ]
    },

    // ============================================================================
    // App Settings and Cache
    // ============================================================================
    {
      name: 'appSettings',
      keyPath: 'key',
      indexes: [
        { name: 'updatedAt', keyPath: 'updatedAt' }
      ]
    },

    {
      name: 'cache',
      keyPath: 'key',
      indexes: [
        { name: 'expiresAt', keyPath: 'expiresAt' },
        { name: 'createdAt', keyPath: 'createdAt' }
      ]
    }
  ]
};

// Migration helpers for future schema updates
export const MIGRATION_SCRIPTS = {
  1: {
    description: 'Initial schema creation',
    up: async () => {
      // Initial schema - no migration needed
    }
  },
  2: {
    description: 'Add league system tables for competitive fitness leagues',
    up: async () => {
      // Migration handled automatically by schema upgrade
      // New stores: userLeagueStats, leagueGroups
    }
  },
  3: {
    description: 'Add competition cycles table for automated weekly competitions',
    up: async () => {
      // Migration handled automatically by schema upgrade
      // New stores: competitionCycles
    }
  }
  // Future migrations will be added here
};