import { z } from 'zod';

// Base schemas
export const UserRoleSchema = z.enum(['guest', 'basic', 'premium', 'trainer', 'admin']);

export const FitnessLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);

export const UnitsSchema = z.enum(['metric', 'imperial']);

export const ThemeSchema = z.enum(['light', 'dark', 'oled', 'halloween', 'system']);

export const ProfileVisibilitySchema = z.enum(['public', 'friends', 'private']);

export const WorkoutSharingSchema = z.enum(['public', 'friends', 'private']);

export const DayOfWeekSchema = z.enum([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]);

// Notification settings schemas
export const QuietHoursSchema = z.object({
  enabled: z.boolean(),
  start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
});

export const NotificationSettingsSchema = z.object({
  workout_reminders: z.boolean(),
  social_activity: z.boolean(),
  achievements: z.boolean(),
  challenges: z.boolean(),
  quiet_hours: QuietHoursSchema,
});

// Privacy settings schema
export const PrivacySettingsSchema = z.object({
  profile_visibility: ProfileVisibilitySchema,
  workout_sharing: WorkoutSharingSchema,
  allow_friend_requests: z.boolean(),
});

// User settings schema
export const UserSettingsSchema = z.object({
  theme: ThemeSchema,
  notifications: NotificationSettingsSchema,
  privacy: PrivacySettingsSchema,
  units: UnitsSchema,
});

// Gamification schema
export const GamificationSchema = z.object({
  level: z.number().int().min(1),
  total_xp: z.number().int().min(0),
  current_streak: z.number().int().min(0),
  best_streak: z.number().int().min(0),
  sick_days_used: z.number().int().min(0).max(12), // Max 12 sick days per year
  last_sick_day_reset: z.date(),
  achievements_unlocked: z.array(z.string()),
});

// User profile schema
export const UserProfileSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
  bio: z.string().max(500, 'Bio too long').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  fitness_level: FitnessLevelSchema,
  goals: z.array(z.string()).max(10, 'Too many goals'),
  scheduled_days: z.array(DayOfWeekSchema).min(1, 'At least one workout day required'),
  height: z.number().positive('Height must be positive').optional(),
  weight: z.number().positive('Weight must be positive').optional(),
  birth_date: z.date().max(new Date(), 'Birth date cannot be in the future').optional(),
  location: z.string().max(100, 'Location too long').optional(),
});

// Main user schema
export const UserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email format').optional(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  role: UserRoleSchema,
  profile: UserProfileSchema,
  settings: UserSettingsSchema,
  gamification: GamificationSchema,
  created_at: z.date(),
  updated_at: z.date().optional(),
  last_login: z.date().optional(),
  is_active: z.boolean().default(true),
});

// Registration schema (for new users)
export const UserRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  display_name: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
  fitness_level: FitnessLevelSchema.optional().default('beginner'),
});

// Login schema
export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Profile update schema (partial updates allowed)
export const UserProfileUpdateSchema = UserProfileSchema.partial();

// Settings update schema (partial updates allowed)
export const UserSettingsUpdateSchema = UserSettingsSchema.partial().extend({
  notifications: NotificationSettingsSchema.partial().optional(),
  privacy: PrivacySettingsSchema.partial().optional(),
});

// Password change schema
export const PasswordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

// Type exports (inferred from schemas)
export type UserRole = z.infer<typeof UserRoleSchema>;
export type FitnessLevel = z.infer<typeof FitnessLevelSchema>;
export type Units = z.infer<typeof UnitsSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type ProfileVisibility = z.infer<typeof ProfileVisibilitySchema>;
export type WorkoutSharing = z.infer<typeof WorkoutSharingSchema>;
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;
export type QuietHours = z.infer<typeof QuietHoursSchema>;
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;
export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type Gamification = z.infer<typeof GamificationSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;
export type UserSettingsUpdate = z.infer<typeof UserSettingsUpdateSchema>;
export type PasswordChange = z.infer<typeof PasswordChangeSchema>;