/**
 * Timezone utilities for consistent date handling across the application
 * Ensures all date operations respect user's local timezone
 */

export class TimezoneUtils {
  /**
   * Get current date in user's timezone as YYYY-MM-DD string
   */
  static getCurrentDate(): string {
    const now = new Date();
    return this.formatDateForStorage(now);
  }

  /**
   * Format a Date object to YYYY-MM-DD string in user's local timezone
   */
  static formatDateForStorage(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Convert a date string to Date object at start of day in user's timezone
   */
  static parseUserDate(dateString: string): Date {
    // Parse as local date to avoid timezone shifts
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Convert a date string to Date object at end of day in user's timezone
   */
  static parseUserDateEndOfDay(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }

  /**
   * Check if a date string is today in user's timezone
   */
  static isToday(dateString: string): boolean {
    return dateString === this.getCurrentDate();
  }

  /**
   * Add days to a date string, maintaining user's timezone
   */
  static addDays(dateString: string, days: number): string {
    const date = this.parseUserDate(dateString);
    date.setDate(date.getDate() + days);
    return this.formatDateForStorage(date);
  }

  /**
   * Get date range for API queries with proper timezone handling
   */
  static getDateRange(dateString: string): { start: Date; end: Date } {
    return {
      start: this.parseUserDate(dateString),
      end: this.parseUserDateEndOfDay(dateString)
    };
  }

  /**
   * Convert database date to user's local date string
   */
  static dbDateToLocalString(dbDate: string | Date): string {
    const date = typeof dbDate === 'string' ? new Date(dbDate) : dbDate;
    return this.formatDateForStorage(date);
  }

  /**
   * Format date for display (user-friendly format)
   */
  static formatForDisplay(dateString: string, locale: string = 'en-US'): string {
    const date = this.parseUserDate(dateString);
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}