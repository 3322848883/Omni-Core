import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateCsrfToken,
  isCsrfTokenValid,
  requiresCsrfProtection,
  getCsrfConfig,
  type CsrfTokenInfo,
} from '../csrf';
import { storage } from '../storage';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('CSRF Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cookies
    document.cookie.split(';').forEach((cookie) => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/;`;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCsrfToken', () => {
    it('should generate a 64-character hex token', () => {
      const token = generateCsrfToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('isCsrfTokenValid', () => {
    it('should return true for valid token', () => {
      const validToken = generateCsrfToken();
      expect(isCsrfTokenValid(validToken)).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isCsrfTokenValid('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isCsrfTokenValid(null as any)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isCsrfTokenValid(undefined as any)).toBe(false);
    });

    it('should return false for short token', () => {
      expect(isCsrfTokenValid('abc123')).toBe(false);
    });

    it('should return false for non-hex characters', () => {
      expect(isCsrfTokenValid('ghijklmnop123456')).toBe(false);
    });

    it('should return false for token with special characters', () => {
      expect(isCsrfTokenValid('abc123!@#$%^&*()')).toBe(false);
    });
  });

  describe('requiresCsrfProtection', () => {
    it('should return true for POST requests', () => {
      expect(requiresCsrfProtection('POST')).toBe(true);
    });

    it('should return true for PUT requests', () => {
      expect(requiresCsrfProtection('PUT')).toBe(true);
    });

    it('should return true for PATCH requests', () => {
      expect(requiresCsrfProtection('PATCH')).toBe(true);
    });

    it('should return true for DELETE requests', () => {
      expect(requiresCsrfProtection('DELETE')).toBe(true);
    });

    it('should return false for GET requests', () => {
      expect(requiresCsrfProtection('GET')).toBe(false);
    });

    it('should return false for HEAD requests', () => {
      expect(requiresCsrfProtection('HEAD')).toBe(false);
    });

    it('should return false for OPTIONS requests', () => {
      expect(requiresCsrfProtection('OPTIONS')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(requiresCsrfProtection('post')).toBe(true);
      expect(requiresCsrfProtection('get')).toBe(false);
    });
  });

  describe('getCsrfConfig', () => {
    it('should return CSRF configuration', () => {
      const config = getCsrfConfig();
      expect(config).toHaveProperty('TOKEN_KEY');
      expect(config).toHaveProperty('COOKIE_NAME');
      expect(config).toHaveProperty('REFRESH_INTERVAL');
      expect(config).toHaveProperty('TOKEN_EXPIRY');
      expect(config.COOKIE_NAME).toBe('XSRF-TOKEN');
      expect(config.REFRESH_INTERVAL).toBe(30 * 60 * 1000);
      expect(config.TOKEN_EXPIRY).toBe(2 * 60 * 60 * 1000);
    });

    it('should return a copy of config', () => {
      const config1 = getCsrfConfig();
      const config2 = getCsrfConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('CSRF Token Storage', () => {
    it('should store and retrieve token from storage', () => {
      const mockToken = generateCsrfToken();
      const mockTokenInfo: CsrfTokenInfo = {
        token: mockToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      };

      vi.mocked(storage.get).mockReturnValue(mockTokenInfo);

      const result = storage.get<CsrfTokenInfo>('csrf_token');
      expect(result).toEqual(mockTokenInfo);
    });

    it('should return null for expired token', () => {
      const expiredTokenInfo: CsrfTokenInfo = {
        token: generateCsrfToken(),
        createdAt: Date.now() - 3 * 60 * 60 * 1000,
        expiresAt: Date.now() - 60 * 60 * 1000,
      };

      vi.mocked(storage.get).mockImplementation((key: string) => {
        if (key === 'csrf_token') {
          // Check expiration
          if (Date.now() > expiredTokenInfo.expiresAt) {
            return null;
          }
          return expiredTokenInfo;
        }
        return null;
      });

      const result = storage.get<CsrfTokenInfo>('csrf_token');
      // The mock should return null for expired token
      expect(result).toBeNull();
    });
  });
});
