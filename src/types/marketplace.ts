// Marketplace Types - Cost-effective implementation
// Focus on simple, revenue-generating features without complex backend

export interface PremiumContent {
  id: string;
  title: string;
  description: string;
  type: 'workout_plan' | 'program' | 'guide' | 'video_series';
  category: 'strength' | 'cardio' | 'flexibility' | 'nutrition' | 'general';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks?: number; // For programs
  price: number; // In cents (e.g., 999 = $9.99)
  currency: 'USD' | 'EUR' | 'GBP';
  
  // Trainer info
  trainer_id: string;
  trainer_name: string;
  trainer_avatar?: string;
  
  // Content metadata
  preview_image?: string;
  preview_video_url?: string; // YouTube/Vimeo embed
  tags: string[];
  rating: number; // 0-5
  review_count: number;
  purchase_count: number;
  
  // Content structure (stored locally after purchase)
  content_data?: PremiumContentData;
  
  // Status
  is_featured: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PremiumContentData {
  // For workout plans
  workouts?: PremiumWorkout[];
  
  // For guides (PDF-like content)
  sections?: ContentSection[];
  
  // For video series
  videos?: VideoContent[];
  
  // Additional resources
  resources?: ContentResource[];
}

export interface PremiumWorkout {
  id: string;
  name: string;
  description: string;
  exercises: PremiumWorkoutExercise[];
  estimated_duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment_needed: string[];
  notes?: string;
}

export interface PremiumWorkoutExercise {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string; // e.g., "8-12", "AMRAP", "30 seconds"
  weight_guidance?: string; // e.g., "70% 1RM", "RPE 8"
  rest_time: number; // seconds
  notes?: string;
  superset_group?: string; // For grouping exercises
}

export interface ContentSection {
  id: string;
  title: string;
  content: string; // Markdown content
  images?: string[];
  order: number;
}

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  video_url: string; // YouTube/Vimeo embed
  duration: number; // seconds
  thumbnail?: string;
  order: number;
}

export interface ContentResource {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'link' | 'calculator';
  url?: string;
  description?: string;
}

export interface TrainerProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url?: string;
  
  // Credentials
  certifications: TrainerCertification[];
  specializations: string[];
  experience_years: number;
  
  // Social proof
  rating: number; // 0-5
  review_count: number;
  total_sales: number;
  follower_count: number;
  
  // Content stats
  content_count: number;
  featured_content_ids: string[];
  
  // Contact & social
  website_url?: string;
  instagram_handle?: string;
  youtube_channel?: string;
  
  // Revenue sharing
  revenue_share_percentage: number; // Default 70%
  total_earnings: number;
  
  // Status
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TrainerCertification {
  id: string;
  name: string;
  organization: string;
  credential_id?: string;
  issued_date: Date;
  expiry_date?: Date;
  verification_status: 'pending' | 'verified' | 'expired';
}

// Purchase and ownership tracking
export interface PurchasedContent {
  content_id: string;
  user_id: string;
  purchase_date: Date;
  price_paid: number;
  currency: string;
  payment_method: 'stripe' | 'paypal' | 'apple_pay' | 'google_pay';
  transaction_id: string;
  
  // Usage tracking
  last_accessed?: Date;
  completion_percentage: number;
  is_favorite: boolean;
}

// Simple review system
export interface ContentReview {
  id: string;
  content_id: string;
  user_id: string;
  rating: number; // 1-5
  review_text?: string;
  is_verified_purchase: boolean;
  created_at: Date;
  updated_at: Date;
}

// Payment integration types
export interface PaymentIntent {
  content_id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  created_at: Date;
}

// Content categories for organization
export const CONTENT_CATEGORIES = {
  strength: {
    name: 'Strength Training',
    icon: '💪',
    color: '#ef4444'
  },
  cardio: {
    name: 'Cardio & Conditioning',
    icon: '🏃',
    color: '#f97316'
  },
  flexibility: {
    name: 'Flexibility & Mobility',
    icon: '🧘',
    color: '#84cc16'
  },
  nutrition: {
    name: 'Nutrition & Diet',
    icon: '🥗',
    color: '#22c55e'
  },
  general: {
    name: 'General Fitness',
    icon: '⚡',
    color: '#3b82f6'
  }
} as const;

export const DIFFICULTY_LEVELS = {
  beginner: {
    name: 'Beginner',
    color: '#22c55e',
    description: 'New to fitness or this type of training'
  },
  intermediate: {
    name: 'Intermediate',
    color: '#f59e0b',
    description: '6+ months of consistent training experience'
  },
  advanced: {
    name: 'Advanced',
    color: '#ef4444',
    description: '2+ years of training experience'
  }
} as const;