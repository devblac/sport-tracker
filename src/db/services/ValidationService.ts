/**
 * Database Validation Service
 * 
 * Provides input validation and sanitization for database operations.
 * Implements security best practices for user data handling.
 */

import { z } from 'zod';
import type { 
  User, 
  UserProfile, 
  Exercise, 
  Workout, 
  SocialPost, 
  PostComment 
} from '@/types/database';

// ============================================================================
// Validation Schemas
// ============================================================================

export const UserValidationSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  role: z.enum(['guest', 'basic', 'premium']),
  isActive: z.boolean()
});

export const UserProfileValidationSchema = z.object({
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Display name contains invalid characters'),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  currentLevel: z.number()
    .int('Level must be an integer')
    .min(1, 'Level must be at least 1')
    .max(100, 'Level cannot exceed 100'),
  height: z.number()
    .min(50, 'Height must be at least 50cm')
    .max(300, 'Height cannot exceed 300cm')
    .optional(),
  weight: z.number()
    .min(20, 'Weight must be at least 20kg')
    .max(500, 'Weight cannot exceed 500kg')
    .optional(),
  fitnessGoals: z.array(z.string().max(100))
    .max(10, 'Cannot have more than 10 fitness goals'),
  preferredWorkoutDays: z.array(z.number().int().min(0).max(6))
    .max(7, 'Cannot have more than 7 workout days')
});

export const ExerciseValidationSchema = z.object({
  name: z.string()
    .min(1, 'Exercise name is required')
    .max(100, 'Exercise name must be less than 100 characters'),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters'),
  bodyPart: z.string()
    .min(1, 'Body part is required')
    .max(50, 'Body part must be less than 50 characters'),
  equipment: z.string()
    .min(1, 'Equipment is required')
    .max(50, 'Equipment must be less than 50 characters'),
  muscleGroups: z.array(z.string().max(50))
    .min(1, 'At least one muscle group is required')
    .max(10, 'Cannot have more than 10 muscle groups'),
  instructions: z.array(z.string().max(500))
    .min(1, 'At least one instruction is required')
    .max(20, 'Cannot have more than 20 instructions'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  tips: z.array(z.string().max(200))
    .max(10, 'Cannot have more than 10 tips')
    .optional()
});

export const WorkoutValidationSchema = z.object({
  name: z.string()
    .min(1, 'Workout name is required')
    .max(100, 'Workout name must be less than 100 characters'),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  duration: z.number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 minute')
    .max(600, 'Duration cannot exceed 600 minutes')
    .optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  totalVolume: z.number()
    .min(0, 'Total volume cannot be negative')
    .optional(),
  caloriesBurned: z.number()
    .int('Calories must be an integer')
    .min(0, 'Calories cannot be negative')
    .max(10000, 'Calories cannot exceed 10000')
    .optional()
});

export const SocialPostValidationSchema = z.object({
  type: z.enum(['workout_completed', 'achievement_unlocked', 'personal_record', 'general']),
  content: z.string()
    .min(1, 'Post content is required')
    .max(2000, 'Post content must be less than 2000 characters'),
  visibility: z.enum(['public', 'friends', 'private']),
  workoutId: z.string().uuid().optional(),
  achievementId: z.string().uuid().optional(),
  imageUrls: z.array(z.string().url())
    .max(10, 'Cannot have more than 10 images')
    .optional(),
  tags: z.array(z.string().max(50))
    .max(20, 'Cannot have more than 20 tags')
    .optional(),
  isPinned: z.boolean()
});

export const PostCommentValidationSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be less than 1000 characters'),
  parentCommentId: z.string().uuid().optional()
});

// ============================================================================
// Validation Service
// ============================================================================

export class ValidationService {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(content: string): string {
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate and sanitize user input
   */
  static validateUser(data: Partial<User>): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
    const validated = UserValidationSchema.parse(data);
    
    return {
      ...validated,
      username: validated.username.toLowerCase().trim(),
      email: validated.email.toLowerCase().trim()
    };
  }

  /**
   * Validate and sanitize user profile input
   */
  static validateUserProfile(data: Partial<UserProfile>): Omit<UserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
    const validated = UserProfileValidationSchema.parse(data);
    
    return {
      ...validated,
      displayName: this.sanitizeHtml(validated.displayName.trim()),
      bio: validated.bio ? this.sanitizeHtml(validated.bio.trim()) : undefined,
      fitnessGoals: validated.fitnessGoals.map(goal => this.sanitizeHtml(goal.trim()))
    };
  }

  /**
   * Validate and sanitize exercise input
   */
  static validateExercise(data: Partial<Exercise>): Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> {
    const validated = ExerciseValidationSchema.parse(data);
    
    return {
      ...validated,
      name: this.sanitizeHtml(validated.name.trim()),
      category: this.sanitizeHtml(validated.category.trim()),
      bodyPart: this.sanitizeHtml(validated.bodyPart.trim()),
      equipment: this.sanitizeHtml(validated.equipment.trim()),
      muscleGroups: validated.muscleGroups.map(mg => this.sanitizeHtml(mg.trim())),
      instructions: validated.instructions.map(inst => this.sanitizeHtml(inst.trim())),
      tips: validated.tips?.map(tip => this.sanitizeHtml(tip.trim()))
    };
  }

  /**
   * Validate and sanitize workout input
   */
  static validateWorkout(data: Partial<Workout>): Omit<Workout, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
    const validated = WorkoutValidationSchema.parse(data);
    
    return {
      ...validated,
      name: this.sanitizeHtml(validated.name.trim()),
      notes: validated.notes ? this.sanitizeHtml(validated.notes.trim()) : undefined
    };
  }

  /**
   * Validate and sanitize social post input
   */
  static validateSocialPost(data: Partial<SocialPost>): Omit<SocialPost, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'sharesCount'> {
    const validated = SocialPostValidationSchema.parse(data);
    
    return {
      ...validated,
      content: this.sanitizeHtml(validated.content.trim()),
      tags: validated.tags?.map(tag => this.sanitizeHtml(tag.trim().toLowerCase()))
    };
  }

  /**
   * Validate and sanitize comment input
   */
  static validateComment(data: Partial<PostComment>): Pick<PostComment, 'content' | 'parentCommentId'> {
    const validated = PostCommentValidationSchema.parse(data);
    
    return {
      content: this.sanitizeHtml(validated.content.trim()),
      parentCommentId: validated.parentCommentId
    };
  }

  /**
   * Validate user ownership of entity
   */
  static validateOwnership(entityUserId: string, currentUserId: string): void {
    if (entityUserId !== currentUserId) {
      throw new Error('Access denied: User does not own this resource');
    }
  }

  /**
   * Validate UUID format
   */
  static validateUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Rate limiting check (basic implementation)
   */
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(userId: string, action: string, maxRequests = 100, windowMs = 60000): void {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const limit = this.rateLimitMap.get(key);

    if (!limit || now > limit.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return;
    }

    if (limit.count >= maxRequests) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    limit.count++;
  }

  /**
   * Clean up expired rate limit entries
   */
  static cleanupRateLimits(): void {
    const now = Date.now();
    for (const [key, limit] of this.rateLimitMap.entries()) {
      if (now > limit.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }
}

// Clean up rate limits every 5 minutes
setInterval(() => {
  ValidationService.cleanupRateLimits();
}, 5 * 60 * 1000);