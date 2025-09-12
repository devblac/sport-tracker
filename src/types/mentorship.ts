export interface MentorProfile {
  id: string;
  user_id: string;
  specialties: string[];
  experience_years: number;
  certification_level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  bio: string;
  availability_hours: string[];
  max_mentees: number;
  current_mentees: number;
  rating: number;
  total_reviews: number;
  success_stories: number;
  preferred_communication: ('chat' | 'video' | 'voice')[];
  languages: string[];
  created_at: Date;
  updated_at: Date;
}

export interface MenteeProfile {
  id: string;
  user_id: string;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  preferred_workout_types: string[];
  available_hours: string[];
  preferred_communication: ('chat' | 'video' | 'voice')[];
  languages: string[];
  looking_for: string[];
  created_at: Date;
  updated_at: Date;
}

export interface MentorshipConnection {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: 'pending' | 'active' | 'completed' | 'paused' | 'cancelled';
  started_at: Date;
  expected_duration_weeks: number;
  goals: MentorshipGoal[];
  progress_notes: MentorshipNote[];
  communication_preferences: {
    frequency: 'daily' | 'weekly' | 'bi-weekly';
    preferred_method: 'chat' | 'video' | 'voice';
    timezone: string;
  };
  created_at: Date;
  updated_at: Date;
}

export interface MentorshipGoal {
  id: string;
  title: string;
  description: string;
  target_date: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  progress_percentage: number;
  milestones: MentorshipMilestone[];
  created_at: Date;
  updated_at: Date;
}

export interface MentorshipMilestone {
  id: string;
  title: string;
  description: string;
  target_date: Date;
  completed: boolean;
  completed_at?: Date;
  notes?: string;
}

export interface MentorshipNote {
  id: string;
  connection_id: string;
  author_id: string;
  author_type: 'mentor' | 'mentee';
  content: string;
  type: 'progress_update' | 'feedback' | 'goal_adjustment' | 'general';
  attachments?: string[];
  created_at: Date;
}

export interface MentorshipMessage {
  id: string;
  connection_id: string;
  sender_id: string;
  sender_type: 'mentor' | 'mentee';
  content: string;
  message_type: 'text' | 'voice' | 'image' | 'workout_share' | 'goal_update';
  read: boolean;
  created_at: Date;
}

export interface MentorshipReview {
  id: string;
  connection_id: string;
  reviewer_id: string;
  reviewer_type: 'mentor' | 'mentee';
  rating: number;
  review_text: string;
  categories: {
    communication: number;
    expertise: number;
    motivation: number;
    availability: number;
    results: number;
  };
  would_recommend: boolean;
  created_at: Date;
}

export interface MentorshipMatch {
  mentor: MentorProfile;
  mentee: MenteeProfile;
  compatibility_score: number;
  matching_factors: {
    goals_alignment: number;
    schedule_compatibility: number;
    communication_preference: number;
    experience_level_match: number;
    language_match: number;
    specialty_match: number;
  };
  reasons: string[];
}

export interface MentorshipStats {
  total_connections: number;
  active_connections: number;
  completed_connections: number;
  average_rating: number;
  success_rate: number;
  total_mentoring_hours: number;
  goals_achieved: number;
  response_time_avg: number;
}