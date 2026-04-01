import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  unescapeHtml,
  escapeJavaScript,
  escapeCss,
  isSafeUrl,
  sanitizeUrl,
  sanitizeInput,
  sanitizeSqlInput,
  isAllowedFileType,
  sanitizeFilename,
  containsXssVector,
  deepSanitize,
  getXssConfig,
} from '../xss';

describe('XSS Utils', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = escapeHtml(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should escape ampersand', () => {
      const input = 'Tom & Jerry';
      const result = escapeHtml(input);
      expect(result).toBe('Tom &amp; Jerry');
    });

    it('should escape single quote', () => {
      const input = "It's a test";
      const result = escapeHtml(input);
      expect(result).toBe('It&#x27;s a test');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(escapeHtml(null as any)).toBe('');
      expect(escapeHtml(undefined as any)).toBe('');
    });

    it('should not modify safe strings', () => {
      const input = 'Hello World 123';
      expect(escapeHtml(input)).toBe(input);
    });
  });

  describe('unescapeHtml', () => {
    it('should unescape HTML entities', () => {
      const input = '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;';
      const result = unescapeHtml(input);
      expect(result).toBe('<script>alert("xss")</script>');
    });

    it('should unescape ampersand', () => {
      const input = 'Tom &amp; Jerry';
      const result = unescapeHtml(input);
      expect(result).toBe('Tom & Jerry');
    });

    it('should handle empty string', () => {
      expect(unescapeHtml('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(unescapeHtml(null as any)).toBe('');
      expect(unescapeHtml(undefined as any)).toBe('');
    });
  });

  describe('escapeJavaScript', () => {
    it('should escape quotes', () => {
      const input = 'alert("xss")';
      const result = escapeJavaScript(input);
      expect(result).toContain('\\"');
    });

    it('should escape backslashes', () => {
      const input = 'C:\\Windows\\System32';
      const result = escapeJavaScript(input);
      expect(result).toContain('\\\\');
    });

    it('should escape newlines', () => {
      const input = 'line1\nline2';
      const result = escapeJavaScript(input);
      expect(result).toContain('\\n');
    });

    it('should escape HTML tags', () => {
      const input = '<script>';
      const result = escapeJavaScript(input);
      expect(result).toContain('\\u003c');
      expect(result).toContain('\\u003e');
    });
  });

  describe('escapeCss', () => {
    it('should escape HTML tags in CSS', () => {
      const input = '<script>';
      const result = escapeCss(input);
      expect(result).toContain('\\');
    });

    it('should escape quotes', () => {
      const input = 'content: "value"';
      const result = escapeCss(input);
      expect(result).toContain('\\');
    });
  });

  describe('isSafeUrl', () => {
    it('should return true for http URLs', () => {
      expect(isSafeUrl('http://example.com')).toBe(true);
    });

    it('should return true for https URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
    });

    it('should return true for mailto URLs', () => {
      expect(isSafeUrl('mailto:test@example.com')).toBe(true);
    });

    it('should return true for tel URLs', () => {
      expect(isSafeUrl('tel:+1234567890')).toBe(true);
    });

    it('should return false for javascript URLs', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    });

    it('should return false for data URLs with HTML', () => {
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('should return true for relative URLs', () => {
      expect(isSafeUrl('/path/to/page')).toBe(true);
      expect(isSafeUrl('./relative/path')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isSafeUrl('')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isSafeUrl(null as any)).toBe(false);
      expect(isSafeUrl(undefined as any)).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should return safe URL unchanged', () => {
      const url = 'https://example.com';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should remove javascript protocol prefix', () => {
      const url = 'javascript:alert(1)';
      const result = sanitizeUrl(url);
      expect(result).not.toContain('javascript:');
    });

    it('should handle empty string', () => {
      expect(sanitizeUrl('')).toBe('');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert(1)</script>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(1)">test</div>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onclick');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<iframe');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    it('should limit input length', () => {
      const longInput = 'a'.repeat(15000);
      const result = sanitizeInput(longInput);
      expect(result.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('sanitizeSqlInput', () => {
    it('should escape single quotes', () => {
      const input = "' OR '1'='1";
      const result = sanitizeSqlInput(input);
      expect(result).toContain("''");
    });

    it('should remove semicolons', () => {
      const input = 'DROP TABLE users;';
      const result = sanitizeSqlInput(input);
      expect(result).not.toContain(';');
    });

    it('should remove SQL comments', () => {
      const input = 'SELECT * FROM users -- comment';
      const result = sanitizeSqlInput(input);
      expect(result).not.toContain('--');
    });

    it('should remove UNION SELECT', () => {
      const input = "' UNION SELECT * FROM passwords --";
      const result = sanitizeSqlInput(input);
      expect(result.toLowerCase()).not.toContain('union select');
    });
  });

  describe('isAllowedFileType', () => {
    it('should return true for allowed types', () => {
      expect(isAllowedFileType('document.pdf', ['.pdf', '.doc'])).toBe(true);
      expect(isAllowedFileType('image.jpg', ['.jpg', '.png'])).toBe(true);
    });

    it('should return false for disallowed types', () => {
      expect(isAllowedFileType('script.exe', ['.pdf', '.doc'])).toBe(false);
      expect(isAllowedFileType('virus.bat', ['.jpg', '.png'])).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isAllowedFileType('document.PDF', ['.pdf'])).toBe(true);
      expect(isAllowedFileType('image.JPG', ['.jpg'])).toBe(true);
    });

    it('should return false for files without extension', () => {
      expect(isAllowedFileType('README', ['.txt'])).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path separators', () => {
      const input = '../../../etc/passwd';
      const result = sanitizeFilename(input);
      expect(result).not.toContain('/');
      expect(result).not.toContain('\\');
    });

    it('should remove special characters', () => {
      const input = 'file<>:"|?*.txt';
      const result = sanitizeFilename(input);
      expect(result).toBe('file_______.txt');
    });

    it('should handle empty string', () => {
      expect(sanitizeFilename('')).toBe('');
    });

    it('should limit length to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe('containsXssVector', () => {
    it('should detect script tags', () => {
      expect(containsXssVector('<script>alert(1)</script>')).toBe(true);
    });

    it('should detect javascript protocol', () => {
      expect(containsXssVector('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsXssVector('<div onmouseover="alert(1)">')).toBe(true);
    });

    it('should detect iframe tags', () => {
      expect(containsXssVector('<iframe src="evil.com">')).toBe(true);
    });

    it('should return false for safe content', () => {
      expect(containsXssVector('Hello World')).toBe(false);
      expect(containsXssVector('<p>Safe HTML</p>')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(containsXssVector('')).toBe(false);
    });
  });

  describe('deepSanitize', () => {
    it('should sanitize strings in object', () => {
      const input = { name: '<script>alert(1)</script>' };
      const result = deepSanitize(input);
      expect(result.name).toContain('&lt;script&gt;');
      expect(result.name).not.toContain('<script>');
    });

    it('should sanitize nested objects', () => {
      const input = { user: { name: '<script>alert(1)</script>' } };
      const result = deepSanitize(input);
      expect(result.user.name).toContain('&lt;script&gt;');
      expect(result.user.name).not.toContain('<script>');
    });

    it('should sanitize arrays', () => {
      const input = ['<script>alert(1)</script>', 'safe'];
      const result = deepSanitize(input);
      expect(result[0]).toContain('&lt;script&gt;');
      expect(result[0]).not.toContain('<script>');
      expect(result[1]).toBe('safe');
    });

    it('should preserve numbers', () => {
      const input = { count: 123 };
      const result = deepSanitize(input);
      expect(result.count).toBe(123);
    });

    it('should preserve booleans', () => {
      const input = { active: true };
      const result = deepSanitize(input);
      expect(result.active).toBe(true);
    });

    it('should handle null and undefined', () => {
      const input = { a: null, b: undefined };
      const result = deepSanitize(input);
      expect(result.a).toBeNull();
      expect(result.b).toBeUndefined();
    });

    it('should use custom escape function', () => {
      const input = { name: 'test' };
      const customEscape = (s: string) => s.toUpperCase();
      const result = deepSanitize(input, customEscape);
      expect(result.name).toBe('TEST');
    });
  });

  describe('getXssConfig', () => {
    it('should return XSS configuration', () => {
      const config = getXssConfig();
      expect(config).toHaveProperty('ALLOWED_TAGS');
      expect(config).toHaveProperty('ALLOWED_ATTRIBUTES');
      expect(config).toHaveProperty('ALLOWED_PROTOCOLS');
      expect(config).toHaveProperty('MAX_INPUT_LENGTH');
    });

    it('should return a copy of config', () => {
      const config1 = getXssConfig();
      const config2 = getXssConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });
});
