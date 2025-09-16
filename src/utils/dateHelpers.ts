// ============================================================================
// DATE HELPERS
// ============================================================================
// Centralized date handling utilities
// ============================================================================

export class DateHelpers {
  /**
   * Safely convert various date formats to Date object
   */
  static toDate(dateInput: Date | string | null | undefined): Date {
    if (!dateInput) return new Date();
    
    if (dateInput instanceof Date) {
      return dateInput;
    }
    
    if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    
    return new Date();
  }

  /**
   * Get time difference in milliseconds
   */
  static getTimeDifference(date1: Date | string, date2: Date | string = new Date()): number {
    return this.toDate(date2).getTime() - this.toDate(date1).getTime();
  }

  /**
   * Check if date is older than specified milliseconds
   */
  static isOlderThan(date: Date | string, maxAge: number): boolean {
    return this.getTimeDifference(date) > maxAge;
  }

  /**
   * Format time difference for display
   */
  static formatTimeSince(date: Date | string): string {
    const diff = this.getTimeDifference(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Recently';
  }
}