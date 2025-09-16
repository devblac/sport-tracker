// ============================================================================
// MARKETPLACE SCHEMAS
// ============================================================================
// Zod validation schemas for marketplace types
// ============================================================================

import { z } from 'zod';

// Base schemas
export const timeSlotSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  isBooked: z.boolean().optional(),
  sessionId: z.string().optional()
});

export const availabilitySchema = z.object({
  timezone: z.string(),
  schedule: z.record(z.object({
    available: z.boolean(),
    slots: z.array(timeSlotSchema)
  }))
});

// Trainer profile schema
export const trainerProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(500, 'Bio too long'),
  specialties: z.array(z.string()).min(1, 'At least one specialty required'),
  certifications: z.array(z.string()),
  experience: z.number().min(0).max(50),
  rating: z.number().min(0).max(5),
  totalReviews: z.number().min(0),
  hourlyRate: z.number().min(10, 'Minimum rate is $10').max(500, 'Maximum rate is $500'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  availability: availabilitySchema,
  profileImage: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  languages: z.array(z.string()).min(1, 'At least one language required'),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  totalEarnings: z.number().min(0),
  totalClients: z.number().min(0),
  joinedAt: z.date(),
  lastActive: z.date()
});

// Form schemas
export const bookSessionFormSchema = z.object({
  trainerId: z.string(),
  sessionType: z.enum(['one_on_one', 'group', 'consultation']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  timeSlot: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  duration: z.number().min(15, 'Minimum 15 minutes').max(180, 'Maximum 3 hours'),
  message: z.string().max(500, 'Message too long').optional(),
  paymentMethodId: z.string()
}).refine(data => {
  // Validate date is not in the past
  const selectedDate = new Date(data.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
}, {
  message: 'Cannot book sessions in the past',
  path: ['date']
});

export const trainerProfileFormSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().min(50).max(500),
  specialties: z.array(z.string()).min(1).max(10),
  certifications: z.array(z.string()).max(20),
  experience: z.number().min(0).max(50),
  hourlyRate: z.number().min(10).max(500),
  languages: z.array(z.string()).min(1),
  availability: availabilitySchema
});

// Search filter schemas
export const trainerSearchFiltersSchema = z.object({
  specialties: z.array(z.string()).optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxHourlyRate: z.number().min(10).max(500).optional(),
  languages: z.array(z.string()).optional(),
  availability: z.object({
    date: z.string(),
    timeSlot: z.string()
  }).optional(),
  sortBy: z.enum(['rating', 'price_low', 'price_high', 'experience', 'reviews']).optional()
});

// Type inference
export type TrainerProfile = z.infer<typeof trainerProfileSchema>;
export type BookSessionForm = z.infer<typeof bookSessionFormSchema>;
export type TrainerProfileForm = z.infer<typeof trainerProfileFormSchema>;
export type TrainerSearchFilters = z.infer<typeof trainerSearchFiltersSchema>;

// Validation helpers
export const validateTrainerProfile = (data: unknown) => {
  return trainerProfileSchema.safeParse(data);
};

export const validateBookSessionForm = (data: unknown) => {
  return bookSessionFormSchema.safeParse(data);
};

export const validateTrainerSearchFilters = (data: unknown) => {
  return trainerSearchFiltersSchema.safeParse(data);
};