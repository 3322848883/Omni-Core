import { describe, it, expect } from 'vitest';
import {
  TOKEN_PREFIX,
  validateTokenPrefix,
  validateAccessToken,
  validateRefreshToken,
  extractTokenPayload,
  isTokenExpired,
  getTokenExpiration,
  formatTokenForDisplay,
} from '../token';

describe('Token Utils', () => {
  describe('TOKEN_PREFIX', () => {
    it('should have correct prefix constants', () => {
      expect(TOKEN_PREFIX.ACCESS).toBe('uat_');
      expect(TOKEN_PREFIX.REFRESH).toBe('urt_');
    });
  });

  describe('validateTokenPrefix', () => {
    it('should return true for valid prefix', () => {
      expect(validateTokenPrefix('uat_abc123', 'uat_')).toBe(true);
      expect(validateTokenPrefix('urt_xyz789', 'urt_')).toBe(true);
    });

    it('should return false for invalid prefix', () => {
      expect(validateTokenPrefix('invalid_abc123', 'uat_')).toBe(false);
      expect(validateTokenPrefix('abc123', 'uat_')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateTokenPrefix('', 'uat_')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(validateTokenPrefix(null as any, 'uat_')).toBe(false);
      expect(validateTokenPrefix(undefined as any, 'uat_')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(validateTokenPrefix(123 as any, 'uat_')).toBe(false);
      expect(validateTokenPrefix({} as any, 'uat_')).toBe(false);
      expect(validateTokenPrefix([] as any, 'uat_')).toBe(false);
    });
  });

  describe('validateAccessToken', () => {
    it('should return true for valid access token', () => {
      expect(validateAccessToken('uat_validToken123')).toBe(true);
      expect(validateAccessToken('uat_')).toBe(true);
    });

    it('should return false for invalid access token', () => {
      expect(validateAccessToken('urt_refreshToken123')).toBe(false);
      expect(validateAccessToken('invalid_token')).toBe(false);
      expect(validateAccessToken('token')).toBe(false);
    });

    it('should return false for empty/null/undefined', () => {
      expect(validateAccessToken('')).toBe(false);
      expect(validateAccessToken(null as any)).toBe(false);
      expect(validateAccessToken(undefined as any)).toBe(false);
    });
  });

  describe('validateRefreshToken', () => {
    it('should return true for valid refresh token', () => {
      expect(validateRefreshToken('urt_validToken123')).toBe(true);
      expect(validateRefreshToken('urt_')).toBe(true);
    });

    it('should return false for invalid refresh token', () => {
      expect(validateRefreshToken('uat_accessToken123')).toBe(false);
      expect(validateRefreshToken('invalid_token')).toBe(false);
      expect(validateRefreshToken('token')).toBe(false);
    });

    it('should return false for empty/null/undefined', () => {
      expect(validateRefreshToken('')).toBe(false);
      expect(validateRefreshToken(null as any)).toBe(false);
      expect(validateRefreshToken(undefined as any)).toBe(false);
    });
  });

  describe('extractTokenPayload', () => {
    it('should extract payload from valid JWT', () => {
      // Create a mock JWT: header.payload.signature
      const payload = { sub: '123', exp: 1234567890, iat: 1234567800 };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `header.${base64Payload}.signature`;

      const result = extractTokenPayload(token);
      expect(result).toEqual(payload);
    });

    it('should handle base64url encoding', () => {
      const payload = { test: 'value' };
      const base64Payload = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
      const token = `header.${base64Payload}.signature`;

      const result = extractTokenPayload(token);
      expect(result).toEqual(payload);
    });

    it('should return null for invalid JWT format', () => {
      expect(extractTokenPayload('invalid')).toBeNull();
      expect(extractTokenPayload('only.two.parts')).toBeNull();
      expect(extractTokenPayload('too.many.parts.here.now')).toBeNull();
    });

    it('should return null for invalid JSON in payload', () => {
      const token = 'header.invalid_json.signature';
      expect(extractTokenPayload(token)).toBeNull();
    });

    it('should return null for empty/null/undefined', () => {
      expect(extractTokenPayload('')).toBeNull();
      expect(extractTokenPayload(null as any)).toBeNull();
      expect(extractTokenPayload(undefined as any)).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 100;
      const payload = { exp: pastExp };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `header.${base64Payload}.signature`;

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return false for valid token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: futureExp };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `header.${base64Payload}.signature`;

      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for token expiring within 10 seconds', () => {
      const nearExp = Math.floor(Date.now() / 1000) + 5;
      const payload = { exp: nearExp };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `header.${base64Payload}.signature`;

      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid')).toBe(true);
      expect(isTokenExpired('')).toBe(true);
    });

    it('should return true for token without exp', () => {
      const payload = { sub: '123' };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `header.${base64Payload}.signature`;

      expect(isTokenExpired(token)).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration timestamp', () => {
      const exp = 1234567890;
      const payload = { exp };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `header.${base64Payload}.signature`;

      expect(getTokenExpiration(token)).toBe(exp * 1000);
    });

    it('should return null for invalid token', () => {
      expect(getTokenExpiration('invalid')).toBeNull();
      expect(getTokenExpiration('')).toBeNull();
    });

    it('should return null for token without exp', () => {
      const payload = { sub: '123' };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `header.${base64Payload}.signature`;

      expect(getTokenExpiration(token)).toBeNull();
    });
  });

  describe('formatTokenForDisplay', () => {
    it('should format long token correctly', () => {
      const token = 'uat_veryLongTokenStringHere12345';
      expect(formatTokenForDisplay(token)).toBe('uat_very...2345');
    });

    it('should return *** for short token', () => {
      expect(formatTokenForDisplay('short')).toBe('***');
      expect(formatTokenForDisplay('12345')).toBe('***');
    });

    it('should return *** for empty/null/undefined', () => {
      expect(formatTokenForDisplay('')).toBe('***');
      expect(formatTokenForDisplay(null as any)).toBe('***');
      expect(formatTokenForDisplay(undefined as any)).toBe('***');
    });
  });
});
