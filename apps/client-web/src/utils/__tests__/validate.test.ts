import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  passwordStrength,
  isValidUUID,
  isValidURL,
  isValidPhone,
  getPasswordStrengthText,
  getPasswordStrengthColor,
} from '../validate';

describe('validate', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should return true for email with subdomain', () => {
      expect(isValidEmail('test@mail.example.com')).toBe(true);
    });

    it('should return true for email with plus sign', () => {
      expect(isValidEmail('test+tag@example.com')).toBe(true);
    });

    it('should return true for email with numbers', () => {
      expect(isValidEmail('user123@test.com')).toBe(true);
    });

    it('should return false for email without @', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('should return false for email without domain', () => {
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should return false for email without username', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should return false for email with spaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should return false for email with multiple @', () => {
      expect(isValidEmail('test@@example.com')).toBe(false);
    });
  });

  describe('passwordStrength', () => {
    it('should return 0 for empty password', () => {
      expect(passwordStrength('')).toBe(0);
    });

    it('should return 1 for short password with lowercase only (< 8 chars)', () => {
      // Password with only lowercase gets 1 point for length < 8
      expect(passwordStrength('abc123')).toBe(1);
    });

    it('should return 1 for password with only lowercase and length >= 8', () => {
      expect(passwordStrength('abcdefgh')).toBe(1);
    });

    it('should return 2 for password with lowercase, uppercase and length >= 8', () => {
      expect(passwordStrength('Abcdefgh')).toBe(2);
    });

    it('should return 3 for password with lowercase, uppercase, digits and length >= 8', () => {
      expect(passwordStrength('Abcdefgh1')).toBe(3);
    });

    it('should return 4 for strong password with all criteria', () => {
      expect(passwordStrength('Abcdefgh1!')).toBe(4);
    });

    it('should return 4 for password with special characters', () => {
      expect(passwordStrength('MyP@ssw0rd')).toBe(4);
    });

    it('should return 3 for password with only lowercase, digits and special chars', () => {
      expect(passwordStrength('abcdefgh1!')).toBe(3);
    });

    it('should return 2 for password with only uppercase and digits', () => {
      expect(passwordStrength('ABCDEFGH1')).toBe(2);
    });

    it('should handle very long password', () => {
      // Very long password with uppercase, digits and special chars
      expect(passwordStrength('Aa' + 'A'.repeat(98) + '1!')).toBe(4);
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should return true for valid UUID v1', () => {
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should return true for valid UUID with uppercase', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('should return false for invalid UUID format', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
    });

    it('should return false for UUID with wrong length', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidUUID('')).toBe(false);
    });

    it('should return false for UUID without dashes', () => {
      expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
    });

    it('should return false for UUID with wrong version', () => {
      expect(isValidUUID('550e8400-e29b-61d4-a716-446655440000')).toBe(false);
    });

    it('should return false for UUID with wrong variant', () => {
      expect(isValidUUID('550e8400-e29b-41d4-c716-446655440000')).toBe(false);
    });
  });

  describe('isValidURL', () => {
    it('should return true for valid HTTP URL', () => {
      expect(isValidURL('http://example.com')).toBe(true);
    });

    it('should return true for valid HTTPS URL', () => {
      expect(isValidURL('https://example.com')).toBe(true);
    });

    it('should return true for URL with path', () => {
      expect(isValidURL('https://example.com/path/to/resource')).toBe(true);
    });

    it('should return true for URL with query params', () => {
      expect(isValidURL('https://example.com?key=value')).toBe(true);
    });

    it('should return true for URL with port', () => {
      expect(isValidURL('https://example.com:8080')).toBe(true);
    });

    it('should return false for invalid URL', () => {
      expect(isValidURL('not a url')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidURL('')).toBe(false);
    });

    it('should return false for URL without protocol', () => {
      expect(isValidURL('example.com')).toBe(false);
    });

    it('should return true for FTP URL', () => {
      expect(isValidURL('ftp://example.com')).toBe(true);
    });

    it('should return true for file URL', () => {
      expect(isValidURL('file:///path/to/file')).toBe(true);
    });
  });

  describe('isValidPhone', () => {
    it('should return true for valid China mobile number', () => {
      expect(isValidPhone('13800138000')).toBe(true);
    });

    it('should return true for valid China mobile starting with 13x', () => {
      expect(isValidPhone('13912345678')).toBe(true);
    });

    it('should return true for valid China mobile starting with 15x', () => {
      expect(isValidPhone('15012345678')).toBe(true);
    });

    it('should return true for valid China mobile starting with 18x', () => {
      expect(isValidPhone('18812345678')).toBe(true);
    });

    it('should return true for valid China mobile starting with 19x', () => {
      expect(isValidPhone('19912345678')).toBe(true);
    });

    it('should return false for phone number with 10 digits', () => {
      expect(isValidPhone('1380013800')).toBe(false);
    });

    it('should return false for phone number with 12 digits', () => {
      expect(isValidPhone('138001380000')).toBe(false);
    });

    it('should return false for phone number starting with 12', () => {
      expect(isValidPhone('12800138000')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidPhone('')).toBe(false);
    });

    it('should return false for phone with letters', () => {
      expect(isValidPhone('1380013800a')).toBe(false);
    });

    it('should return false for phone with spaces', () => {
      expect(isValidPhone('138 0013 8000')).toBe(false);
    });
  });

  describe('getPasswordStrengthText', () => {
    it('should return "太短" for strength 0', () => {
      expect(getPasswordStrengthText(0)).toBe('太短');
    });

    it('should return "弱" for strength 1', () => {
      expect(getPasswordStrengthText(1)).toBe('弱');
    });

    it('should return "一般" for strength 2', () => {
      expect(getPasswordStrengthText(2)).toBe('一般');
    });

    it('should return "强" for strength 3', () => {
      expect(getPasswordStrengthText(3)).toBe('强');
    });

    it('should return "非常强" for strength 4', () => {
      expect(getPasswordStrengthText(4)).toBe('非常强');
    });

    it('should return "未知" for invalid strength', () => {
      expect(getPasswordStrengthText(5)).toBe('未知');
    });

    it('should return "未知" for negative strength', () => {
      expect(getPasswordStrengthText(-1)).toBe('未知');
    });
  });

  describe('getPasswordStrengthColor', () => {
    it('should return red for strength 0', () => {
      expect(getPasswordStrengthColor(0)).toBe('#F56C6C');
    });

    it('should return red for strength 1', () => {
      expect(getPasswordStrengthColor(1)).toBe('#F56C6C');
    });

    it('should return orange for strength 2', () => {
      expect(getPasswordStrengthColor(2)).toBe('#E6A23C');
    });

    it('should return green for strength 3', () => {
      expect(getPasswordStrengthColor(3)).toBe('#67C23A');
    });

    it('should return blue for strength 4', () => {
      expect(getPasswordStrengthColor(4)).toBe('#409EFF');
    });

    it('should return gray for invalid strength', () => {
      expect(getPasswordStrengthColor(5)).toBe('#909399');
    });

    it('should return gray for negative strength', () => {
      expect(getPasswordStrengthColor(-1)).toBe('#909399');
    });
  });
});
