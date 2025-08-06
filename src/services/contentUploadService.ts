// Content Upload Service - Simple system for trainers to upload content
// Cost-effective approach using local storage and basic file handling

import { PremiumContent, PremiumContentData, TrainerProfile } from '../types/marketplace';
import { contentModerationService } from './contentModerationService';
import { premiumContentService } from './premiumContentService';

interface UploadProgress {
  contentId: string;
  step: 'basic_info' | 'content_data' | 'media' | 'review' | 'complete';
  progress: number; // 0-100
  errors: string[];
  warnings: string[];
}

interface ContentDraft {
  id: string;
  trainer_id: string;
  basic_info: Partial<PremiumContent>;
  content_data?: PremiumContentData;
  media_files: UploadedFile[];
  status: 'draft' | 'review' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: number;
  url: string; // Local blob URL or external URL
  uploaded_at: Date;
}

class ContentUploadService {
  private readonly STORAGE_KEY = 'content_drafts';
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
  private readonly ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

  /**
   * Start new content creation process
   */
  async startContentCreation(trainerId: string): Promise<string> {
    const contentId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const draft: ContentDraft = {
      id: contentId,
      trainer_id: trainerId,
      basic_info: {
        trainer_id: trainerId,
        is_active: false,
        is_featured: false,
        rating: 0,
        review_count: 0,
        purchase_count: 0,
        tags: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      media_files: [],
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.saveDraft(draft);
    return contentId;
  }

  /**
   * Update basic content information
   */
  async updateBasicInfo(contentId: string, basicInfo: Partial<PremiumContent>): Promise<UploadProgress> {
    const draft = await this.getDraft(contentId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    // Validate basic info
    const validation = await contentModerationService.validatePremiumContent(basicInfo);
    
    draft.basic_info = { ...draft.basic_info, ...basicInfo };
    draft.updated_at = new Date();
    
    await this.saveDraft(draft);

    return {
      contentId,
      step: 'basic_info',
      progress: validation.approved ? 25 : 15,
      errors: validation.issues,
      warnings: validation.warnings
    };
  }

  /**
   * Upload content data (workouts, guides, etc.)
   */
  async uploadContentData(contentId: string, contentData: PremiumContentData): Promise<UploadProgress> {
    const draft = await this.getDraft(contentId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    // Validate content data
    const errors: string[] = [];
    const warnings: string[] = [];

    if (contentData.workouts) {
      for (const workout of contentData.workouts) {
        if (!workout.name || workout.name.length < 3) {
          errors.push(`Workout "${workout.name || 'Unnamed'}" needs a proper name`);
        }
        if (!workout.exercises || workout.exercises.length === 0) {
          errors.push(`Workout "${workout.name}" must have at least one exercise`);
        }
      }
    }

    if (contentData.sections) {
      for (const section of contentData.sections) {
        if (!section.title || section.title.length < 3) {
          errors.push(`Section "${section.title || 'Unnamed'}" needs a proper title`);
        }
        if (!section.content || section.content.length < 50) {
          warnings.push(`Section "${section.title}" content is quite short`);
        }
      }
    }

    draft.content_data = contentData;
    draft.updated_at = new Date();
    
    await this.saveDraft(draft);

    return {
      contentId,
      step: 'content_data',
      progress: errors.length === 0 ? 50 : 35,
      errors,
      warnings
    };
  }

  /**
   * Upload media files (images, videos)
   */
  async uploadMediaFile(contentId: string, file: File, type: 'preview_image' | 'preview_video' | 'content_media'): Promise<UploadProgress> {
    const draft = await this.getDraft(contentId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      errors.push(...validation.errors);
    }

    if (errors.length === 0) {
      // Create blob URL for local storage (in production, upload to cloud storage)
      const blobUrl = URL.createObjectURL(file);
      
      const uploadedFile: UploadedFile = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'document',
        size: file.size,
        url: blobUrl,
        uploaded_at: new Date()
      };

      draft.media_files.push(uploadedFile);

      // Update basic info with media URLs
      if (type === 'preview_image' && uploadedFile.type === 'image') {
        draft.basic_info.preview_image = blobUrl;
      } else if (type === 'preview_video' && uploadedFile.type === 'video') {
        draft.basic_info.preview_video_url = blobUrl;
      }

      draft.updated_at = new Date();
      await this.saveDraft(draft);
    }

    return {
      contentId,
      step: 'media',
      progress: errors.length === 0 ? 75 : 60,
      errors,
      warnings
    };
  }

  /**
   * Submit content for review
   */
  async submitForReview(contentId: string): Promise<UploadProgress> {
    const draft = await this.getDraft(contentId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    // Final validation
    const validation = await contentModerationService.validatePremiumContent(draft.basic_info);
    
    if (validation.approved) {
      draft.status = 'review';
      draft.updated_at = new Date();
      await this.saveDraft(draft);

      // In a real system, this would notify moderators
      // For now, auto-approve after a delay (simulate review process)
      setTimeout(() => {
        this.autoApproveContent(contentId);
      }, 5000); // 5 second delay to simulate review

      return {
        contentId,
        step: 'review',
        progress: 90,
        errors: [],
        warnings: ['Content submitted for review. This usually takes 24-48 hours.']
      };
    }

    return {
      contentId,
      step: 'review',
      progress: 75,
      errors: validation.issues,
      warnings: validation.warnings
    };
  }

  /**
   * Get draft by ID
   */
  async getDraft(contentId: string): Promise<ContentDraft | null> {
    try {
      const drafts = await this.getAllDrafts();
      return drafts.find(d => d.id === contentId) || null;
    } catch (error) {
      console.error('Error getting draft:', error);
      return null;
    }
  }

  /**
   * Get all drafts for a trainer
   */
  async getTrainerDrafts(trainerId: string): Promise<ContentDraft[]> {
    try {
      const drafts = await this.getAllDrafts();
      return drafts.filter(d => d.trainer_id === trainerId);
    } catch (error) {
      console.error('Error getting trainer drafts:', error);
      return [];
    }
  }

  /**
   * Delete draft
   */
  async deleteDraft(contentId: string): Promise<void> {
    try {
      const drafts = await this.getAllDrafts();
      const updatedDrafts = drafts.filter(d => d.id !== contentId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedDrafts));

      // Clean up blob URLs
      const draft = drafts.find(d => d.id === contentId);
      if (draft) {
        draft.media_files.forEach(file => {
          if (file.url.startsWith('blob:')) {
            URL.revokeObjectURL(file.url);
          }
        });
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }

  /**
   * Get upload progress for content
   */
  async getUploadProgress(contentId: string): Promise<UploadProgress | null> {
    const draft = await this.getDraft(contentId);
    if (!draft) {
      return null;
    }

    let progress = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Calculate progress based on completion
    if (draft.basic_info.title && draft.basic_info.description && draft.basic_info.price) {
      progress += 25;
    }

    if (draft.content_data) {
      progress += 25;
    }

    if (draft.basic_info.preview_image) {
      progress += 15;
    }

    if (draft.basic_info.preview_video_url) {
      progress += 15;
    }

    if (draft.status === 'review') {
      progress += 10;
    }

    if (draft.status === 'approved') {
      progress = 100;
    }

    return {
      contentId,
      step: draft.status === 'approved' ? 'complete' : 
            draft.status === 'review' ? 'review' :
            draft.content_data ? 'media' :
            draft.basic_info.title ? 'content_data' : 'basic_info',
      progress,
      errors,
      warnings
    };
  }

  // ===== PRIVATE METHODS =====

  private async getAllDrafts(): Promise<ContentDraft[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading drafts:', error);
      return [];
    }
  }

  private async saveDraft(draft: ContentDraft): Promise<void> {
    try {
      const drafts = await this.getAllDrafts();
      const existingIndex = drafts.findIndex(d => d.id === draft.id);
      
      if (existingIndex >= 0) {
        drafts[existingIndex] = draft;
      } else {
        drafts.push(draft);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  private validateFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check file type
    const isValidImage = this.ALLOWED_IMAGE_TYPES.includes(file.type);
    const isValidVideo = this.ALLOWED_VIDEO_TYPES.includes(file.type);
    const isValidDocument = this.ALLOWED_DOCUMENT_TYPES.includes(file.type);

    if (!isValidImage && !isValidVideo && !isValidDocument) {
      errors.push(`Invalid file type. Allowed types: ${[
        ...this.ALLOWED_IMAGE_TYPES,
        ...this.ALLOWED_VIDEO_TYPES,
        ...this.ALLOWED_DOCUMENT_TYPES
      ].join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async autoApproveContent(contentId: string): Promise<void> {
    try {
      const draft = await this.getDraft(contentId);
      if (!draft || draft.status !== 'review') {
        return;
      }

      // Convert draft to published content
      const publishedContent: PremiumContent = {
        id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...draft.basic_info as PremiumContent,
        content_data: draft.content_data,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Add to premium content catalog
      const catalog = await premiumContentService.getPremiumContentCatalog();
      catalog.push(publishedContent);
      localStorage.setItem('premium_content_catalog', JSON.stringify(catalog));

      // Update draft status
      draft.status = 'approved';
      draft.updated_at = new Date();
      await this.saveDraft(draft);

      console.log(`Content ${contentId} has been approved and published!`);
    } catch (error) {
      console.error('Error auto-approving content:', error);
    }
  }
}

export const contentUploadService = new ContentUploadService();