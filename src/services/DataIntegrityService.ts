/**
 * Data Integrity Service
 * 
 * Provides comprehensive data validation, integrity checking, and repair
 * mechanisms for maintaining data consistency across local and remote stores.
 */

import { databaseService } from '@/db/DatabaseService';
import { supabaseService } from './SupabaseService';
import { logger } from '@/utils/logger';
import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

const UserProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  displayName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const WorkoutSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(200),
  templateId: z.string().uuid().optional(),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  duration: z.number().min(0).optional(),
  totalVolume: z.number().min(0).optional(),
  exercises: z.array(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const SocialPostSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  type: z.enum(['workout', 'achievement', 'general']),
  visibility: z.enum(['public', 'friends', 'private']),
  workoutId: z.string().uuid().optional(),
  achievementId: z.string().uuid().optional(),
  likesCount: z.number().min(0),
  commentsCount: z.number().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const XPTransactionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number(),
  source: z.enum(['workout', 'achievement', 'streak', 'social', 'bonus']),
  sourceId: z.string().uuid().optional(),
  description: z.string().max(500),
  multiplier: z.number().min(0).max(10),
  createdAt: z.date(),
});

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ValidationWarning {
  field: string;
  message: string;
  value: any;
  suggestion?: string;
}

export interface IntegrityReport {
  timestamp: Date;
  tables: TableIntegrityReport[];
  summary: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    repairedRecords: number;
    criticalErrors: number;
  };
}

export interface TableIntegrityReport {
  table: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  repairActions: RepairAction[];
}

export interface RepairAction {
  id: string;
  type: 'fix' | 'remove' | 'update' | 'merge';
  description: string;
  recordId: string;
  originalData: any;
  proposedData: any;
  applied: boolean;
  timestamp: Date;
}

export interface DataConsistencyCheck {
  table: string;
  localRecords: number;
  remoteRecords: number;
  missingLocal: string[];
  missingRemote: string[];
  inconsistentRecords: InconsistentRecord[];
}

export interface InconsistentRecord {
  id: string;
  localData: any;
  remoteData: any;
  differences: FieldDifference[];
  lastModified: {
    local: Date;
    remote: Date;
  };
}

export interface FieldDifference {
  field: string;
  localValue: any;
  remoteValue: any;
  type: 'value_mismatch' | 'type_mismatch' | 'missing_local' | 'missing_remote';
}

// ============================================================================
// Data Integrity Service
// ============================================================================

export class DataIntegrityService {
  private static instance: DataIntegrityService;
  private validationSchemas: Map<string, z.ZodSchema> = new Map();

  private constructor() {
    this.initializeSchemas();
  }

  public static getInstance(): DataIntegrityService {
    if (!DataIntegrityService.instance) {
      DataIntegrityService.instance = new DataIntegrityService();
    }
    return DataIntegrityService.instance;
  }

  /**
   * Initialize validation schemas for different data types
   */
  private initializeSchemas(): void {
    this.validationSchemas.set('user_profiles', UserProfileSchema);
    this.validationSchemas.set('workout_sessions', WorkoutSessionSchema);
    this.validationSchemas.set('social_posts', SocialPostSchema);
    this.validationSchemas.set('xp_transactions', XPTransactionSchema);
  }

  // ============================================================================
  // Data Validation Methods
  // ============================================================================

  /**
   * Validate a single record against its schema
   */
  validateRecord(table: string, record: any): ValidationResult {
    const schema = this.validationSchemas.get(table);
    if (!schema) {
      return {
        isValid: false,
        errors: [{
          field: 'table',
          message: `No validation schema found for table: ${table}`,
          value: table,
          severity: 'critical'
        }],
        warnings: []
      };
    }

    try {
      // Validate with Zod schema
      schema.parse(record);
      
      // Additional business logic validation
      const businessValidation = this.validateBusinessRules(table, record);
      
      return {
        isValid: businessValidation.errors.length === 0,
        errors: businessValidation.errors,
        warnings: businessValidation.warnings
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors?.map(err => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message || 'Validation error',
          value: (err as any).input || record,
          severity: this.determineSeverity(err.code || 'unknown')
        })) || [];

        return {
          isValid: false,
          errors,
          warnings: []
        };
      }

      return {
        isValid: false,
        errors: [{
          field: 'unknown',
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          value: record,
          severity: 'critical'
        }],
        warnings: []
      };
    }
  }

  /**
   * Validate business rules for specific record types
   */
  private validateBusinessRules(table: string, record: any): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    switch (table) {
      case 'user_profiles':
        this.validateUserProfileRules(record, errors, warnings);
        break;
      case 'workout_sessions':
        this.validateWorkoutSessionRules(record, errors, warnings);
        break;
      case 'social_posts':
        this.validateSocialPostRules(record, errors, warnings);
        break;
      case 'xp_transactions':
        this.validateXPTransactionRules(record, errors, warnings);
        break;
    }

    return { errors, warnings };
  }

  /**
   * Validate user profile business rules
   */
  private validateUserProfileRules(record: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Check display name length and content
    if (record.displayName && record.displayName.length < 3) {
      warnings.push({
        field: 'displayName',
        message: 'Display name is very short',
        value: record.displayName,
        suggestion: 'Consider using a longer, more descriptive name'
      });
    }

    // Check for inappropriate content (basic check)
    if (record.displayName && /[<>{}]/.test(record.displayName)) {
      errors.push({
        field: 'displayName',
        message: 'Display name contains invalid characters',
        value: record.displayName,
        severity: 'medium'
      });
    }

    // Check bio length
    if (record.bio && record.bio.length > 500) {
      errors.push({
        field: 'bio',
        message: 'Bio exceeds maximum length',
        value: record.bio.length,
        severity: 'medium'
      });
    }

    // Check avatar URL validity
    if (record.avatar && !this.isValidImageUrl(record.avatar)) {
      warnings.push({
        field: 'avatar',
        message: 'Avatar URL may not be a valid image',
        value: record.avatar,
        suggestion: 'Ensure the URL points to a valid image file'
      });
    }
  }

  /**
   * Validate workout session business rules
   */
  private validateWorkoutSessionRules(record: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Check workout duration
    if (record.duration && record.duration > 14400) { // 4 hours
      warnings.push({
        field: 'duration',
        message: 'Workout duration is unusually long',
        value: record.duration,
        suggestion: 'Verify the workout duration is correct'
      });
    }

    // Check if completed workout has completion time
    if (record.completedAt && !record.duration) {
      warnings.push({
        field: 'duration',
        message: 'Completed workout missing duration',
        value: record.duration,
        suggestion: 'Calculate duration from start and completion times'
      });
    }

    // Check if started date is in the future
    if (record.startedAt && new Date(record.startedAt) > new Date()) {
      errors.push({
        field: 'startedAt',
        message: 'Workout start time cannot be in the future',
        value: record.startedAt,
        severity: 'high'
      });
    }

    // Check completion before start
    if (record.completedAt && record.startedAt && 
        new Date(record.completedAt) < new Date(record.startedAt)) {
      errors.push({
        field: 'completedAt',
        message: 'Workout completion time cannot be before start time',
        value: record.completedAt,
        severity: 'high'
      });
    }
  }

  /**
   * Validate social post business rules
   */
  private validateSocialPostRules(record: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Check content length
    if (record.content && record.content.trim().length === 0) {
      errors.push({
        field: 'content',
        message: 'Post content cannot be empty',
        value: record.content,
        severity: 'high'
      });
    }

    // Check for spam patterns
    if (record.content && this.detectSpamPatterns(record.content)) {
      warnings.push({
        field: 'content',
        message: 'Content may contain spam patterns',
        value: record.content,
        suggestion: 'Review content for promotional or repetitive text'
      });
    }

    // Validate workout reference
    if (record.type === 'workout' && !record.workoutId) {
      errors.push({
        field: 'workoutId',
        message: 'Workout posts must reference a workout',
        value: record.workoutId,
        severity: 'high'
      });
    }

    // Validate achievement reference
    if (record.type === 'achievement' && !record.achievementId) {
      errors.push({
        field: 'achievementId',
        message: 'Achievement posts must reference an achievement',
        value: record.achievementId,
        severity: 'high'
      });
    }
  }

  /**
   * Validate XP transaction business rules
   */
  private validateXPTransactionRules(record: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Check for reasonable XP amounts
    if (record.amount > 10000) {
      warnings.push({
        field: 'amount',
        message: 'XP amount is unusually high',
        value: record.amount,
        suggestion: 'Verify the XP calculation is correct'
      });
    }

    if (record.amount < 0) {
      errors.push({
        field: 'amount',
        message: 'XP amount cannot be negative',
        value: record.amount,
        severity: 'high'
      });
    }

    // Check multiplier reasonableness
    if (record.multiplier > 5) {
      warnings.push({
        field: 'multiplier',
        message: 'XP multiplier is very high',
        value: record.multiplier,
        suggestion: 'Verify the multiplier calculation'
      });
    }

    // Validate source reference
    if (['workout', 'achievement', 'streak'].includes(record.source) && !record.sourceId) {
      errors.push({
        field: 'sourceId',
        message: `${record.source} XP transactions must have a source ID`,
        value: record.sourceId,
        severity: 'high'
      });
    }
  }

  // ============================================================================
  // Integrity Checking Methods
  // ============================================================================

  /**
   * Perform comprehensive integrity check on all data
   */
  async performFullIntegrityCheck(): Promise<IntegrityReport> {
    logger.info('Starting full data integrity check');
    
    const tables = ['user_profiles', 'workout_sessions', 'social_posts', 'xp_transactions'];
    const tableReports: TableIntegrityReport[] = [];
    
    let totalRecords = 0;
    let validRecords = 0;
    let invalidRecords = 0;
    let repairedRecords = 0;
    let criticalErrors = 0;

    for (const table of tables) {
      try {
        const report = await this.checkTableIntegrity(table);
        tableReports.push(report);
        
        totalRecords += report.totalRecords;
        validRecords += report.validRecords;
        invalidRecords += report.invalidRecords;
        repairedRecords += report.repairActions.filter(action => action.applied).length;
        criticalErrors += report.errors.filter(error => error.severity === 'critical').length;
      } catch (error) {
        logger.error('Failed to check integrity for table', { table, error });
      }
    }

    const report: IntegrityReport = {
      timestamp: new Date(),
      tables: tableReports,
      summary: {
        totalRecords,
        validRecords,
        invalidRecords,
        repairedRecords,
        criticalErrors
      }
    };

    logger.info('Full integrity check completed', { 
      totalRecords, 
      validRecords, 
      invalidRecords, 
      criticalErrors 
    });

    return report;
  }

  /**
   * Check integrity for a specific table
   */
  async checkTableIntegrity(table: string): Promise<TableIntegrityReport> {
    const records = await databaseService.instance.getManager().getAll(table);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const repairActions: RepairAction[] = [];
    
    let validCount = 0;
    let invalidCount = 0;

    for (const record of records) {
      const validation = this.validateRecord(table, record);
      
      if (validation.isValid) {
        validCount++;
      } else {
        invalidCount++;
        errors.push(...validation.errors);
        
        // Generate repair actions for invalid records
        const repairs = await this.generateRepairActions(table, record, validation.errors);
        repairActions.push(...repairs);
      }
      
      warnings.push(...validation.warnings);
    }

    return {
      table,
      totalRecords: records.length,
      validRecords: validCount,
      invalidRecords: invalidCount,
      errors,
      warnings,
      repairActions
    };
  }

  /**
   * Check data consistency between local and remote stores
   */
  async checkDataConsistency(userId: string): Promise<DataConsistencyCheck[]> {
    logger.info('Starting data consistency check', { userId });
    
    const tables = ['user_profiles', 'workout_sessions', 'social_posts'];
    const checks: DataConsistencyCheck[] = [];

    for (const table of tables) {
      try {
        const check = await this.checkTableConsistency(table, userId);
        checks.push(check);
      } catch (error) {
        logger.error('Failed to check consistency for table', { table, error });
      }
    }

    return checks;
  }

  /**
   * Check consistency for a specific table
   */
  private async checkTableConsistency(table: string, userId: string): Promise<DataConsistencyCheck> {
    // Get local records
    const localRecords = await databaseService.instance.getManager().getAllByIndex(table, 'userId', userId);
    
    // Get remote records (simplified - would need proper implementation)
    let remoteRecords: any[] = [];
    try {
      switch (table) {
        case 'user_profiles':
          const profile = await supabaseService.getUserProfile(userId);
          remoteRecords = profile ? [profile] : [];
          break;
        case 'workout_sessions':
          remoteRecords = await supabaseService.getUserWorkouts(userId, 1000);
          break;
        case 'social_posts':
          // Would need a method to get user's posts
          remoteRecords = [];
          break;
      }
    } catch (error) {
      logger.error('Failed to fetch remote records', { table, error });
    }

    // Compare records
    const localIds = new Set(localRecords.map(r => r.id));
    const remoteIds = new Set(remoteRecords.map(r => r.id));
    
    const missingLocal = remoteRecords
      .filter(r => !localIds.has(r.id))
      .map(r => r.id);
    
    const missingRemote = localRecords
      .filter(r => !remoteIds.has(r.id))
      .map(r => r.id);

    // Find inconsistent records
    const inconsistentRecords: InconsistentRecord[] = [];
    
    for (const localRecord of localRecords) {
      const remoteRecord = remoteRecords.find(r => r.id === localRecord.id);
      if (remoteRecord) {
        const differences = this.compareRecords(localRecord, remoteRecord);
        if (differences.length > 0) {
          inconsistentRecords.push({
            id: localRecord.id,
            localData: localRecord,
            remoteData: remoteRecord,
            differences,
            lastModified: {
              local: new Date(localRecord.updatedAt || localRecord.createdAt),
              remote: new Date(remoteRecord.updated_at || remoteRecord.created_at)
            }
          });
        }
      }
    }

    return {
      table,
      localRecords: localRecords.length,
      remoteRecords: remoteRecords.length,
      missingLocal,
      missingRemote,
      inconsistentRecords
    };
  }

  // ============================================================================
  // Repair Methods
  // ============================================================================

  /**
   * Generate repair actions for invalid records
   */
  private async generateRepairActions(table: string, record: any, errors: ValidationError[]): Promise<RepairAction[]> {
    const actions: RepairAction[] = [];

    for (const error of errors) {
      const action = await this.createRepairAction(table, record, error);
      if (action) {
        actions.push(action);
      }
    }

    return actions;
  }

  /**
   * Create a specific repair action for an error
   */
  private async createRepairAction(table: string, record: any, error: ValidationError): Promise<RepairAction | null> {
    const actionId = crypto.randomUUID();
    
    switch (error.field) {
      case 'displayName':
        if (error.message.includes('invalid characters')) {
          return {
            id: actionId,
            type: 'fix',
            description: 'Remove invalid characters from display name',
            recordId: record.id,
            originalData: record,
            proposedData: {
              ...record,
              displayName: record.displayName.replace(/[<>{}]/g, '')
            },
            applied: false,
            timestamp: new Date()
          };
        }
        break;
        
      case 'startedAt':
        if (error.message.includes('future')) {
          return {
            id: actionId,
            type: 'fix',
            description: 'Set workout start time to current time',
            recordId: record.id,
            originalData: record,
            proposedData: {
              ...record,
              startedAt: new Date()
            },
            applied: false,
            timestamp: new Date()
          };
        }
        break;
        
      case 'amount':
        if (error.message.includes('negative')) {
          return {
            id: actionId,
            type: 'fix',
            description: 'Set XP amount to absolute value',
            recordId: record.id,
            originalData: record,
            proposedData: {
              ...record,
              amount: Math.abs(record.amount)
            },
            applied: false,
            timestamp: new Date()
          };
        }
        break;
    }

    // Default action for critical errors
    if (error.severity === 'critical') {
      return {
        id: actionId,
        type: 'remove',
        description: `Remove record with critical error: ${error.message}`,
        recordId: record.id,
        originalData: record,
        proposedData: null,
        applied: false,
        timestamp: new Date()
      };
    }

    return null;
  }

  /**
   * Apply repair actions to fix data integrity issues
   */
  async applyRepairActions(actions: RepairAction[]): Promise<number> {
    let appliedCount = 0;

    for (const action of actions) {
      try {
        await this.applyRepairAction(action);
        action.applied = true;
        appliedCount++;
        logger.info('Repair action applied', { actionId: action.id, type: action.type });
      } catch (error) {
        logger.error('Failed to apply repair action', { actionId: action.id, error });
      }
    }

    return appliedCount;
  }

  /**
   * Apply a single repair action
   */
  private async applyRepairAction(action: RepairAction): Promise<void> {
    const table = this.getTableFromRecordId(action.recordId);
    
    switch (action.type) {
      case 'fix':
      case 'update':
        await databaseService.instance.getManager().put(table, action.proposedData);
        break;
        
      case 'remove':
        await databaseService.instance.getManager().delete(table, action.recordId);
        break;
        
      case 'merge':
        // Merge logic would depend on specific requirements
        await databaseService.instance.getManager().put(table, action.proposedData);
        break;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Compare two records and find differences
   */
  private compareRecords(local: any, remote: any): FieldDifference[] {
    const differences: FieldDifference[] = [];
    const allFields = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const field of allFields) {
      if (field in local && field in remote) {
        if (local[field] !== remote[field]) {
          differences.push({
            field,
            localValue: local[field],
            remoteValue: remote[field],
            type: typeof local[field] !== typeof remote[field] ? 'type_mismatch' : 'value_mismatch'
          });
        }
      } else if (field in local) {
        differences.push({
          field,
          localValue: local[field],
          remoteValue: undefined,
          type: 'missing_remote'
        });
      } else {
        differences.push({
          field,
          localValue: undefined,
          remoteValue: remote[field],
          type: 'missing_local'
        });
      }
    }

    return differences;
  }

  /**
   * Determine error severity based on Zod error code
   */
  private determineSeverity(code: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (code) {
      case 'invalid_type':
      case 'invalid_literal':
        return 'critical';
      case 'invalid_string':
      case 'invalid_number':
        return 'high';
      case 'too_small':
      case 'too_big':
        return 'medium';
      case 'unknown':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Check if URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname.toLowerCase();
      return /\.(jpg|jpeg|png|gif|webp|svg)$/.test(pathname);
    } catch {
      return false;
    }
  }

  /**
   * Detect spam patterns in text content
   */
  private detectSpamPatterns(content: string): boolean {
    const spamPatterns = [
      /(.)\1{10,}/, // Repeated characters
      /https?:\/\/[^\s]+/gi, // Multiple URLs
      /\b(buy|sale|discount|offer|free|win|prize)\b/gi, // Promotional keywords
    ];

    return spamPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Get table name from record ID (simplified implementation)
   */
  private getTableFromRecordId(recordId: string): string {
    // This would need to be implemented based on your ID scheme
    // For now, return a default table
    return 'user_profiles';
  }
}

// Export singleton instance
export const dataIntegrityService = DataIntegrityService.getInstance();