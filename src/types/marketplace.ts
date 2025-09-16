// ============================================================================
// MARKETPLACE TYPES
// ============================================================================
// Types for trainer marketplace, payments, and premium content
// ============================================================================

export interface TrainerProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  specialties: string[];
  certifications: string[];
  experience: number; // years
  rating: number;
  totalReviews: number;
  hourlyRate: number;
  currency: string;
  availability: {
    timezone: string;
    schedule: {
      [key: string]: { // day of week
        available: boolean;
        slots: TimeSlot[];
      };
    };
  };
  profileImage?: string;
  coverImage?: string;
  languages: string[];
  isVerified: boolean;
  isActive: boolean;
  totalEarnings: number;
  totalClients: number;
  joinedAt: Date;
  lastActive: Date;
}

export interface TimeSlot {
  startTime: string; // HH:mm format
  endTime: string;
  isBooked?: boolean;
  sessionId?: string;
}

export interface PremiumContent {
  id: string;
  trainerId: string;
  title: string;
  description: string;
  type: 'workout_plan' | 'nutrition_guide' | 'video_course' | 'ebook' | 'template';
  price: number;
  currency: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // minutes for videos, weeks for plans
  previewImages: string[];
  previewVideo?: string;
  content: {
    // Flexible content structure based on type
    [key: string]: any;
  };
  rating: number;
  totalReviews: number;
  totalSales: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingSession {
  id: string;
  trainerId: string;
  clientId: string;
  type: 'one_on_one' | 'group' | 'consultation';
  title: string;
  description: string;
  scheduledAt: Date;
  duration: number; // minutes
  price: number;
  currency: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  meetingLink?: string;
  notes?: string;
  feedback?: {
    clientRating?: number;
    clientReview?: string;
    trainerNotes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Purchase {
  id: string;
  userId: string;
  trainerId: string;
  itemType: 'content' | 'session';
  itemId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  stripePaymentIntentId?: string;
  purchasedAt: Date;
  refundedAt?: Date;
  refundReason?: string;
}

export interface TrainerReview {
  id: string;
  trainerId: string;
  userId: string;
  type: 'session' | 'content';
  itemId: string;
  rating: number; // 1-5
  review: string;
  pros?: string[];
  cons?: string[];
  wouldRecommend: boolean;
  isVerified: boolean; // verified purchase
  createdAt: Date;
  trainerResponse?: {
    message: string;
    respondedAt: Date;
  };
}

export interface TrainerEarnings {
  trainerId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: string; // ISO date string
  totalEarnings: number;
  totalSales: number;
  sessionEarnings: number;
  contentEarnings: number;
  platformFee: number;
  netEarnings: number;
  currency: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'paypal' | 'bank_transfer';
  isDefault: boolean;
  cardLast4?: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  stripePaymentMethodId?: string;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'basic' | 'premium' | 'trainer';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  price: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface TrainerSearchFilters {
  specialties?: string[];
  minRating?: number;
  maxHourlyRate?: number;
  languages?: string[];
  availability?: {
    date: string;
    timeSlot: string;
  };
  sortBy?: 'rating' | 'price_low' | 'price_high' | 'experience' | 'reviews';
}

export interface ContentSearchFilters {
  type?: PremiumContent['type'];
  category?: string;
  difficulty?: PremiumContent['difficulty'];
  minRating?: number;
  maxPrice?: number;
  tags?: string[];
  sortBy?: 'rating' | 'price_low' | 'price_high' | 'newest' | 'popular';
}

export interface TrainerDashboardStats {
  totalEarnings: number;
  monthlyEarnings: number;
  totalClients: number;
  activeClients: number;
  totalSessions: number;
  upcomingSessions: number;
  contentSales: number;
  averageRating: number;
  totalReviews: number;
  profileViews: number;
  conversionRate: number; // views to bookings
}

export interface MarketplaceConfig {
  platformFeePercentage: number;
  minWithdrawalAmount: number;
  payoutSchedule: 'daily' | 'weekly' | 'monthly';
  supportedCurrencies: string[];
  maxSessionDuration: number;
  minSessionDuration: number;
  cancellationPolicy: {
    freeUntilHours: number;
    partialRefundUntilHours: number;
    noRefundAfterHours: number;
  };
}

// Form Types
export interface BookSessionForm {
  trainerId: string;
  sessionType: TrainingSession['type'];
  date: string;
  timeSlot: string;
  duration: number;
  message?: string;
  paymentMethodId: string;
}

export interface CreateContentForm {
  title: string;
  description: string;
  type: PremiumContent['type'];
  price: number;
  category: string;
  tags: string[];
  difficulty: PremiumContent['difficulty'];
  duration?: number;
  previewImages: File[];
  previewVideo?: File;
  content: any;
}

export interface TrainerProfileForm {
  displayName: string;
  bio: string;
  specialties: string[];
  certifications: string[];
  experience: number;
  hourlyRate: number;
  languages: string[];
  availability: TrainerProfile['availability'];
  profileImage?: File;
  coverImage?: File;
}

// Store State Types
export interface MarketplaceState {
  // Trainers
  trainers: TrainerProfile[];
  selectedTrainer: TrainerProfile | null;
  trainerSearchFilters: TrainerSearchFilters;
  
  // Content
  premiumContent: PremiumContent[];
  selectedContent: PremiumContent | null;
  contentSearchFilters: ContentSearchFilters;
  
  // User's purchases and sessions
  userPurchases: Purchase[];
  userSessions: TrainingSession[];
  
  // Trainer dashboard (if user is trainer)
  trainerProfile: TrainerProfile | null;
  trainerStats: TrainerDashboardStats | null;
  trainerEarnings: TrainerEarnings[];
  
  // Payment
  paymentMethods: PaymentMethod[];
  subscription: Subscription | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  searchTrainers: (filters: TrainerSearchFilters) => Promise<void>;
  searchContent: (filters: ContentSearchFilters) => Promise<void>;
  bookSession: (sessionData: BookSessionForm) => Promise<void>;
  purchaseContent: (contentId: string, paymentMethodId: string) => Promise<void>;
  createTrainerProfile: (profileData: TrainerProfileForm) => Promise<void>;
  updateTrainerProfile: (profileData: Partial<TrainerProfileForm>) => Promise<void>;
  createContent: (contentData: CreateContentForm) => Promise<void>;
  addPaymentMethod: (paymentMethod: Omit<PaymentMethod, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  cancelSession: (sessionId: string, reason: string) => Promise<void>;
  leaveReview: (review: Omit<TrainerReview, 'id' | 'createdAt'>) => Promise<void>;
}