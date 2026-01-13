import {
  parseFlexibleDate,
  getDefaultStartDate,
  isValidDateRange,
} from '../../../src/utils/date.util';
import { differenceInDays } from 'date-fns';

describe('Date Util', () => {
  describe('parseFlexibleDate', () => {
    it('should parse yyyy-MM-dd format', () => {
      const result = parseFlexibleDate('2025-01-15');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(15);
    });

    it('should parse MM/dd/yyyy format', () => {
      const result = parseFlexibleDate('01/15/2025');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(15);
    });

    it('should parse MMM d, yyyy format', () => {
      const result = parseFlexibleDate('Jan 15, 2025');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(15);
    });

    it('should parse MMMM d, yyyy format', () => {
      const result = parseFlexibleDate('January 15, 2025');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(15);
    });

    it('should parse d MMM yyyy format', () => {
      const result = parseFlexibleDate('15 Jan 2025');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(15);
    });

    it('should parse d MMMM yyyy format', () => {
      const result = parseFlexibleDate('15 January 2025');
      expect(result).not.toBeNull();
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(0);
      expect(result?.getDate()).toBe(15);
    });

    it('should handle different month names', () => {
      const feb = parseFlexibleDate('Feb 28, 2025');
      expect(feb?.getMonth()).toBe(1);

      const mar = parseFlexibleDate('Mar 15, 2025');
      expect(mar?.getMonth()).toBe(2);

      const dec = parseFlexibleDate('Dec 25, 2025');
      expect(dec?.getMonth()).toBe(11);
    });

    it('should return null for invalid format', () => {
      const result = parseFlexibleDate('invalid date');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseFlexibleDate('');
      expect(result).toBeNull();
    });

    it('should return null for partially valid format', () => {
      const result = parseFlexibleDate('2025-13-01');
      expect(result).toBeNull();
    });
  });

  describe('getDefaultStartDate', () => {
    it('should return date 30 days before today', () => {
      const today = new Date();
      const defaultStart = getDefaultStartDate();

      const daysDiff = differenceInDays(today, defaultStart);

      expect(daysDiff).toBe(30);
    });

    it('should return a valid Date object', () => {
      const result = getDefaultStartDate();
      expect(result).toBeInstanceOf(Date);
      expect(isNaN(result.getTime())).toBe(false);
    });

    it('should be before current date', () => {
      const now = new Date();
      const defaultStart = getDefaultStartDate();
      expect(defaultStart.getTime()).toBeLessThan(now.getTime());
    });
  });

  describe('isValidDateRange', () => {
    it('should return true for valid range (start before end)', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-31');
      expect(isValidDateRange(start, end)).toBe(true);
    });

    it('should return true for same start and end date', () => {
      const date = new Date('2025-01-15');
      expect(isValidDateRange(date, date)).toBe(true);
    });

    it('should return false for invalid range (start after end)', () => {
      const start = new Date('2025-01-31');
      const end = new Date('2025-01-01');
      expect(isValidDateRange(start, end)).toBe(false);
    });

    it('should handle dates with time components', () => {
      const start = new Date('2025-01-01T10:00:00');
      const end = new Date('2025-01-31T15:30:00');
      expect(isValidDateRange(start, end)).toBe(true);
    });

    it('should return false when end time is before start time on same day', () => {
      const start = new Date('2025-01-15T15:00:00');
      const end = new Date('2025-01-15T10:00:00');
      expect(isValidDateRange(start, end)).toBe(false);
    });
  });
});
