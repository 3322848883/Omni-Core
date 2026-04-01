import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatTraffic,
  formatCurrency,
  formatDuration,
  formatRelativeTime,
} from '../format';

describe('format', () => {
  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-03-21 14:30:45');
      const result = formatDate(date);
      expect(result).toBe('2024-03-21 14:30:45');
    });

    it('should format date with custom format', () => {
      const date = new Date('2024-03-21 14:30:45');
      const result = formatDate(date, 'YYYY/MM/DD');
      expect(result).toBe('2024/03/21');
    });

    it('should format date string', () => {
      const result = formatDate('2024-03-21T14:30:45');
      expect(result).toBe('2024-03-21 14:30:45');
    });

    it('should format timestamp', () => {
      const timestamp = new Date('2024-03-21 14:30:45').getTime();
      const result = formatDate(timestamp);
      expect(result).toBe('2024-03-21 14:30:45');
    });

    it('should pad single digit values', () => {
      const date = new Date('2024-01-05 08:05:09');
      const result = formatDate(date);
      expect(result).toBe('2024-01-05 08:05:09');
    });

    it('should handle year only format', () => {
      const date = new Date('2024-03-21 14:30:45');
      const result = formatDate(date, 'YYYY');
      expect(result).toBe('2024');
    });

    it('should handle date only format', () => {
      const date = new Date('2024-03-21 14:30:45');
      const result = formatDate(date, 'YYYY-MM-DD');
      expect(result).toBe('2024-03-21');
    });

    it('should handle time only format', () => {
      const date = new Date('2024-03-21 14:30:45');
      const result = formatDate(date, 'HH:mm:ss');
      expect(result).toBe('14:30:45');
    });
  });

  describe('formatTraffic', () => {
    it('should return "0 B" for zero bytes', () => {
      expect(formatTraffic(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatTraffic(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatTraffic(1024)).toBe('1 KB');
    });

    it('should format megabytes', () => {
      expect(formatTraffic(1024 * 1024)).toBe('1 MB');
    });

    it('should format gigabytes', () => {
      expect(formatTraffic(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format terabytes', () => {
      expect(formatTraffic(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });

    it('should format petabytes', () => {
      expect(formatTraffic(1024 * 1024 * 1024 * 1024 * 1024)).toBe('1 PB');
    });

    it('should use default 2 decimal places', () => {
      expect(formatTraffic(1536)).toBe('1.5 KB');
    });

    it('should respect custom decimal places', () => {
      expect(formatTraffic(1536, 0)).toBe('2 KB');
      expect(formatTraffic(1536, 3)).toBe('1.5 KB');
    });

    it('should handle large numbers', () => {
      expect(formatTraffic(5 * 1024 * 1024 * 1024)).toBe('5 GB');
    });

    it('should handle fractional values correctly', () => {
      expect(formatTraffic(1500 * 1024 * 1024)).toBe('1.46 GB');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency', () => {
      expect(formatCurrency(100)).toBe('$100.00');
    });

    it('should format with decimals', () => {
      expect(formatCurrency(99.99)).toBe('$99.99');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative amount', () => {
      expect(formatCurrency(-50)).toBe('-$50.00');
    });

    it('should format EUR currency', () => {
      expect(formatCurrency(100, 'EUR')).toBe('€100.00');
    });

    it('should format CNY currency', () => {
      const result = formatCurrency(100, 'CNY');
      expect(result).toContain('100.00');
    });

    it('should format large amounts', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should format with thousand separators', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(formatDuration(300)).toBe('5分钟');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3660)).toBe('1小时1分钟');
    });

    it('should format days and hours', () => {
      expect(formatDuration(90000)).toBe('1天1小时');
    });

    it('should format zero seconds', () => {
      expect(formatDuration(0)).toBe('0分钟');
    });

    it('should handle exact day', () => {
      expect(formatDuration(86400)).toBe('1天0小时');
    });

    it('should handle exact hour', () => {
      expect(formatDuration(3600)).toBe('1小时0分钟');
    });

    it('should handle multiple days', () => {
      expect(formatDuration(172800)).toBe('2天0小时');
    });

    it('should handle multiple hours', () => {
      expect(formatDuration(7200)).toBe('2小时0分钟');
    });

    it('should handle complex duration', () => {
      expect(formatDuration(90061)).toBe('1天1小时');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "刚刚" for recent time', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('刚刚');
    });

    it('should return minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('5分钟前');
    });

    it('should return hours ago', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('2小时前');
    });

    it('should return days ago', () => {
      const date = new
 Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('3天前');
    });

    it('should handle timestamp', () => {
      const timestamp = Date.now() - 60000;
      expect(formatRelativeTime(timestamp)).toBe('1分钟前');
    });

    it('should handle date string', () => {
      const dateStr = new Date(Date.now() - 3600000).toISOString();
      expect(formatRelativeTime(dateStr)).toBe('1小时前');
    });

    it('should handle multiple days correctly', () => {
      const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('7天前');
    });
  });
});
