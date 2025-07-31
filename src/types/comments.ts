/**
 * Advanced Comments Types
 * 
 * Extended type definitions for nested comments, likes, and mentions.
 */

export interface AdvancedComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string; // For nested replies
  
  // Engagement
  likesCount: number;
  repliesCount: number;
  
  // Mentions
  mentions: CommentMention[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  isPinned: boolean;
  
  // Moderation
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
}

export interface CommentMention {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  startIndex: number;
  endIndex: number;
}

export interface CommentLike {
  id: string;
  commentId: string;
  userId: string;
  createdAt: Date;
}

export interface CommentThread {
  comment: AdvancedComment;
  replies: CommentThread[];
  author: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
    currentLevel: number;
    isOnline: boolean;
  };
  userInteraction: {
    hasLiked: boolean;
    canReply: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

export interface CommentFormData {
  content: string;
  mentions: CommentMention[];
  parentCommentId?: string;
}

export interface MentionSuggestion {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  currentLevel: number;
  isOnline: boolean;
  relevanceScore: number; // For sorting suggestions
}

export interface CommentNotification {
  id: string;
  type: 'comment' | 'reply' | 'mention' | 'like';
  commentId: string;
  postId: string;
  fromUserId: string;
  toUserId: string;
  isRead: boolean;
  createdAt: Date;
}

// Comment parsing and formatting
export interface ParsedComment {
  segments: CommentSegment[];
  mentions: CommentMention[];
  plainText: string;
}

export interface CommentSegment {
  type: 'text' | 'mention' | 'hashtag' | 'url';
  content: string;
  data?: {
    userId?: string;
    username?: string;
    url?: string;
    hashtag?: string;
  };
}

// Comment validation
export interface CommentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  processedContent: string;
  mentions: CommentMention[];
}

// Comment statistics
export interface CommentStats {
  totalComments: number;
  totalReplies: number;
  totalLikes: number;
  averageDepth: number;
  topContributors: Array<{
    userId: string;
    username: string;
    commentCount: number;
  }>;
  engagementRate: number;
}

// Comment moderation
export interface CommentModerationAction {
  id: string;
  commentId: string;
  action: 'delete' | 'hide' | 'pin' | 'unpin' | 'warn';
  reason: string;
  moderatorId: string;
  createdAt: Date;
}

export const COMMENT_CONSTANTS = {
  MAX_CONTENT_LENGTH: 2000,
  MAX_MENTIONS_PER_COMMENT: 10,
  MAX_NESTING_DEPTH: 5,
  MENTION_PATTERN: /@([a-zA-Z0-9_]+)/g,
  HASHTAG_PATTERN: /#([a-zA-Z0-9_]+)/g,
  URL_PATTERN: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
};