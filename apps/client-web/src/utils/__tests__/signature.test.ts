import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateNonce,
  generateTimestamp,
  isTimestampValid,
  sortAndStringifyParams,
  buildSignatureString,
  generateSignatureSync,
  requiresSignature,
  getSignatureConfig,
  type SignatureParams,
} from '../signature';

describe('Signature Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateNonce', () => {
    it('should generate a 16-character nonce', () => {
      const nonce = generateNonce();
      expect(nonce).toHaveLength(16);
    });

    it('should generate unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });

    it('should only contain alphanumeric characters', () => {
      const nonce = generateNonce();
      expect(nonce).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('generateTimestamp', () => {
    it('should return current timestamp in milliseconds', () => {
      const timestamp = generateTimestamp();
      expect(timestamp).toBe(1705312800000); // 2024-01-15T10:00:00Z
    });
  });

  describe('isTimestampValid', () => {
    it('should return true for current timestamp', () => {
      const now = Date.now();
      expect(isTimestampValid(now)).toBe(true);
    });

    it('should return true for timestamp within 5 minutes', () => {
      const fourMinutesAgo = Date.now() - 4 * 60 * 1000;
      expect(isTimestampValid(fourMinutesAgo)).toBe(true);
    });

    it('should return false for timestamp older than 5 minutes', () => {
      const sixMinutesAgo = Date.now() - 6 * 60 * 1000;
      expect(isTimestampValid(sixMinutesAgo)).toBe(false);
    });

    it('should return false for future timestamp more than 5 minutes ahead', () => {
      const sixMinutesLater = Date.now() + 6 * 60 * 1000;
      expect(isTimestampValid(sixMinutesLater)).toBe(false);
    });
  });

  describe('sortAndStringifyParams', () => {
    it('should sort params alphabetically', () => {
      const params = { z: 1, a: 2, m: 3 };
      const result = sortAndStringifyParams(params);
      expect(result).toBe('a=2&m=3&z=1');
    });

    it('should handle nested objects', () => {
      const params = { a: 1, b: { c: 2 } };
      const result = sortAndStringifyParams(params);
      expect(result).toBe('a=1&b={"c":2}');
    });

    it('should skip undefined and null values', () => {
      const params = { a: 1, b: undefined, c: null, d: 2 };
      const result = sortAndStringifyParams(params);
      expect(result).toBe('a=1&d=2');
    });

    it('should handle empty object', () => {
      const result = sortAndStringifyParams({});
      expect(result).toBe('');
    });
  });

  describe('buildSignatureString', () => {
    it('should build signature string with all params', () => {
      const params: SignatureParams = {
        method: 'POST',
        path: '/api/users',
        timestamp: 1705312800000,
        nonce: 'abc123',
        body: '{"name":"test"}',
      };
      const result = buildSignatureString(params);
      expect(result).toContain('POST');
      expect(result).toContain('/api/users');
      expect(result).toContain('1705312800000');
      expect(result).toContain('abc123');
    });

    it('should build signature string without body', () => {
      const params: SignatureParams = {
        method: 'GET',
        path: '/api/users',
        timestamp: 1705312800000,
        nonce: 'abc123',
      };
      const result = buildSignatureString(params);
      expect(result).toBe('GET|/api/users|1705312800000|abc123|');
    });

    it('should uppercase method', () => {
      const params: SignatureParams = {
        method: 'post',
        path: '/api/users',
        timestamp: 1705312800000,
        nonce: 'abc123',
      };
      const result = buildSignatureString(params);
      expect(result.startsWith('POST')).toBe(true);
    });
  });

  describe('generateSignatureSync', () => {
    it('should generate signature with all required fields', () => {
      const result = generateSignatureSync('POST', '/api/users', '{"test":1}');
      expect(result).toHaveProperty('signature');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('nonce');
      expect(result).toHaveProperty('version');
      expect(result.signature.length).toBeGreaterThan(0);
    });

    it('should generate different signatures for different inputs', () => {
      const timestamp1 = 1705312800000;
      const nonce1 = 'abc123def4567890';
      const result1 = generateSignatureSync('POST', '/api/users', '{"test":1}', timestamp1, nonce1);

      const timestamp2 = 1705312801000;
      const nonce2 = 'xyz789abc1234567';
      const result2 = generateSignatureSync('POST', '/api/users', '{"test":2}', timestamp2, nonce2);

      expect(result1.signature).not.toBe(result2.signature);
    });

    it('should generate different signatures for different timestamps', () => {
      const timestamp1 = 1705312800000;
      const timestamp2 = 1705312801000;
      const nonce = 'abc123def4567890';

      const result1 = generateSignatureSync('POST', '/api/users', '{"test":1}', timestamp1, nonce);
      const result2 = generateSignatureSync('POST', '/api/users', '{"test":1}', timestamp2, nonce);

      expect(result1.signature).not.toBe(result2.signature);
    });

    it('should generate different signatures for different nonces', () => {
      const timestamp = 1705312800000;
      const nonce1 = 'abc123def4567890';
      const nonce2 = 'xyz789abc1234567';

      const result1 = generateSignatureSync('POST', '/api/users', '{"test":1}', timestamp, nonce1);
      const result2 = generateSignatureSync('POST', '/api/users', '{"test":1}', timestamp, nonce2);

      expect(result1.signature).not.toBe(result2.signature);
    });
  });

  describe('requiresSignature', () => {
    it('should return true for sensitive POST requests', () => {
      expect(requiresSignature('POST', '/orders')).toBe(true);
      expect(requiresSignature('POST', '/users/me')).toBe(true);
    });

    it('should return true for PUT requests to sensitive paths', () => {
      expect(requiresSignature('PUT', '/users/me')).toBe(true);
    });

    it('should return false for GET requests', () => {
      expect(requiresSignature('GET', '/orders')).toBe(false);
    });

    it('should return false for non-sensitive paths', () => {
      expect(requiresSignature('POST', '/public/info')).toBe(false);
    });

    it('should be case insensitive for methods', () => {
      expect(requiresSignature('post', '/orders')).toBe(true);
    });
  });

  describe('getSignatureConfig', () => {
    it('should return signature configuration', () => {
      const config = getSignatureConfig();
      expect(config).toHaveProperty('TIMESTAMP_VALIDITY');
      expect(config).toHaveProperty('NONCE_LENGTH');
      expect(config).toHaveProperty('ALGORITHM');
      expect(config).toHaveProperty('VERSION');
      expect(config.TIMESTAMP_VALIDITY).toBe(5 * 60 * 1000);
      expect(config.NONCE_LENGTH).toBe(16);
    });

    it('should return a copy of config', () => {
      const config1 = getSignatureConfig();
      const config2 = getSignatureConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });
});
