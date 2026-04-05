import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as jwtUtils from '../jwt';
import { config } from '../../config';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('../../config', () => ({
  config: {
    jwt: {
      secret: 'test_secret_key_123',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
  },
}));

vi.mock('jsonwebtoken');

describe('JWT Utils', () => {
  const mockPayload = {
    sub: 'admin-123',
    username: 'adminuser',
    role: 'admin',
    email: 'admin@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload and options', () => {
      // Arrange
      const expectedToken = 'mock_access_token';
      vi.mocked(jwt.sign).mockReturnValue(expectedToken);

      // Act
      const result = jwtUtils.generateAccessToken(mockPayload);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        mockPayload,
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn as any || '15m' }
      );
      expect(result).toBe(expectedToken);
    });

    it('should use default expiresIn when config is not set', () => {
      // Arrange
      const expectedToken = 'mock_access_token';
      const originalExpiresIn = config.jwt.expiresIn;
      config.jwt.expiresIn = undefined;
      vi.mocked(jwt.sign).mockReturnValue(expectedToken);

      // Act
      const result = jwtUtils.generateAccessToken(mockPayload);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        mockPayload,
        config.jwt.secret,
        { expiresIn: '15m' }
      );
      expect(result).toBe(expectedToken);

      // Restore
      config.jwt.expiresIn = originalExpiresIn;
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload and options', () => {
      // Arrange
      const expectedToken = 'mock_refresh_token';
      const expectedPayload = { ...mockPayload, type: 'refresh' };
      vi.mocked(jwt.sign).mockReturnValue(expectedToken);

      // Act
      const result = jwtUtils.generateRefreshToken(mockPayload);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        expectedPayload,
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn as any || '7d' }
      );
      expect(result).toBe(expectedToken);
    });

    it('should use default refreshExpiresIn when config is not set', () => {
      // Arrange
      const expectedToken = 'mock_refresh_token';
      const originalRefreshExpiresIn = config.jwt.refreshExpiresIn;
      config.jwt.refreshExpiresIn = undefined;
      vi.mocked(jwt.sign).mockReturnValue(expectedToken);

      // Act
      const result = jwtUtils.generateRefreshToken(mockPayload);

      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { ...mockPayload, type: 'refresh' },
        config.jwt.secret,
        { expiresIn: '7d' }
      );
      expect(result).toBe(expectedToken);

      // Restore
      config.jwt.refreshExpiresIn = originalRefreshExpiresIn;
    });
  });

  describe('verifyToken', () => {
    it('should verify token and return decoded payload', () => {
      // Arrange
      const token = 'mock_token';
      const decodedPayload = { ...mockPayload, iat: Date.now() / 1000, exp: Date.now() / 1000 + 3600 };
      vi.mocked(jwt.verify).mockReturnValue(decodedPayload as any);

      // Act
      const result = jwtUtils.verifyToken(token);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, config.jwt.secret);
      expect(result).toEqual(decodedPayload);
    });

    it('should throw error when token is invalid', () => {
      // Arrange
      const token = 'invalid_token';
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      expect(() => jwtUtils.verifyToken(token)).toThrow('Invalid token');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify access token with prefix and return decoded payload', () => {
      // Arrange
      const token = 'aat_mock_token';
      const jwtToken = 'mock_token';
      const decodedPayload = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };
      vi.mocked(jwt.verify).mockReturnValue(decodedPayload as any);

      // Act
      const result = jwtUtils.verifyAccessToken(token);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(jwtToken, config.jwt.secret);
      expect(result).toEqual(decodedPayload);
    });

    it('should verify access token without prefix and return decoded payload', () => {
      // Arrange
      const token = 'mock_token';
      const decodedPayload = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };
      vi.mocked(jwt.verify).mockReturnValue(decodedPayload as any);

      // Act
      const result = jwtUtils.verifyAccessToken(token);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, config.jwt.secret);
      expect(result).toEqual(decodedPayload);
    });

    it('should throw error when access token is invalid', () => {
      // Arrange
      const token = 'aat_invalid_token';
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      expect(() => jwtUtils.verifyAccessToken(token)).toThrow('Invalid token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token with prefix and return decoded payload', () => {
      // Arrange
      const token = 'art_mock_token';
      const jwtToken = 'mock_token';
      const decodedPayload = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'refresh',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 604800, // 7 days
      };
      vi.mocked(jwt.verify).mockReturnValue(decodedPayload as any);

      // Act
      const result = jwtUtils.verifyRefreshToken(token);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(jwtToken, config.jwt.secret);
      expect(result).toEqual(decodedPayload);
    });

    it('should verify refresh token without prefix and return decoded payload', () => {
      // Arrange
      const token = 'mock_token';
      const decodedPayload = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'refresh',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 604800,
      };
      vi.mocked(jwt.verify).mockReturnValue(decodedPayload as any);

      // Act
      const result = jwtUtils.verifyRefreshToken(token);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, config.jwt.secret);
      expect(result).toEqual(decodedPayload);
    });

    it('should throw error when refresh token is invalid', () => {
      // Arrange
      const token = 'art_invalid_token';
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      expect(() => jwtUtils.verifyRefreshToken(token)).toThrow('Invalid token');
    });
  });

  describe('decodeToken', () => {
    it('should decode valid token and return payload', () => {
      // Arrange
      const token = 'mock_token';
      const decodedPayload = { ...mockPayload, iat: Date.now() / 1000 };
      vi.mocked(jwt.decode).mockReturnValue(decodedPayload as any);

      // Act
      const result = jwtUtils.decodeToken(token);

      // Assert
      expect(jwt.decode).toHaveBeenCalledWith(token);
      expect(result).toEqual(decodedPayload);
    });

    it('should return null when token is invalid', () => {
      // Arrange
      const token = 'invalid_token';
      vi.mocked(jwt.decode).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = jwtUtils.decodeToken(token);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid authorization header', () => {
      // Arrange
      const authHeader = 'Bearer mock_token';

      // Act
      const result = jwtUtils.extractTokenFromHeader(authHeader);

      // Assert
      expect(result).toBe('mock_token');
    });

    it('should return null when authorization header is missing', () => {
      // Act
      const result = jwtUtils.extractTokenFromHeader(undefined);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when authorization header format is invalid', () => {
      // Arrange
      const authHeader = 'InvalidHeaderFormat mock_token';

      // Act
      const result = jwtUtils.extractTokenFromHeader(authHeader);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when token is missing from header', () => {
      // Arrange
      const authHeader = 'Bearer ';

      // Act
      const result = jwtUtils.extractTokenFromHeader(authHeader);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('isValidAccessTokenFormat', () => {
    it('should return true for valid access token format', () => {
      // Arrange
      const validPayload = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access',
      };
      const header = { typ: 'JWT', alg: 'HS256' };
      const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64');
      const payloadBase64 = Buffer.from(JSON.stringify(validPayload)).toString('base64');
      const signature = 'mock_signature';
      const token = `aat_${headerBase64}.${payloadBase64}.${signature}`;

      // Act
      const result = jwtUtils.isValidAccessTokenFormat(token);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for invalid token format', () => {
      // Arrange
      const invalidToken = 'invalid_token_format';

      // Act
      const result = jwtUtils.isValidAccessTokenFormat(invalidToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for token with missing parts', () => {
      // Arrange
      const invalidToken = 'aat_invalid.token';

      // Act
      const result = jwtUtils.isValidAccessTokenFormat(invalidToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for token with invalid header', () => {
      // Arrange
      const invalidToken = 'aat_invalid_header.base64payload.signature';

      // Act
      const result = jwtUtils.isValidAccessTokenFormat(invalidToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for token with missing required fields', () => {
      // Arrange
      const invalidPayload = {
        sub: 'admin-123',
        username: 'adminuser',
        // Missing role and type
      };
      const header = { typ: 'JWT', alg: 'HS256' };
      const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64');
      const payloadBase64 = Buffer.from(JSON.stringify(invalidPayload)).toString('base64');
      const signature = 'mock_signature';
      const token = `aat_${headerBase64}.${payloadBase64}.${signature}`;

      // Act
      const result = jwtUtils.isValidAccessTokenFormat(token);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isValidRefreshTokenFormat', () => {
    it('should return true for valid refresh token format with art_ prefix', () => {
      // Arrange
      const validPayload = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'refresh',
      };
      const header = { typ: 'JWT', alg: 'HS256' };
      const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64');
      const payloadBase64 = Buffer.from(JSON.stringify(validPayload)).toString('base64');
      const signature = 'mock_signature';
      const token = `art_${headerBase64}.${payloadBase64}.${signature}`;

      // Act
      const result = jwtUtils.isValidRefreshTokenFormat(token);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for valid refresh token format with crt_ prefix', () => {
      // Arrange
      const validPayload = {
        sub: 'user-123',
        username: 'user',
        role: 'user',
        type: 'refresh',
      };
      const header = { typ: 'JWT', alg: 'HS256' };
      const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64');
      const payloadBase64 = Buffer.from(JSON.stringify(validPayload)).toString('base64');
      const signature = 'mock_signature';
      const token = `crt_${headerBase64}.${payloadBase64}.${signature}`;

      // Act
      const result = jwtUtils.isValidRefreshTokenFormat(token);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for refresh token without prefix', () => {
      // Arrange
      const token = 'mock_token_without_prefix';

      // Act
      const result = jwtUtils.isValidRefreshTokenFormat(token);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for refresh token with invalid format', () => {
      // Arrange
      const invalidToken = 'art_invalid_token_format';

      // Act
      const result = jwtUtils.isValidRefreshTokenFormat(invalidToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for refresh token with wrong type', () => {
      // Arrange
      const invalidPayload = {
        sub: 'admin-123',
        username: 'adminuser',
        role: 'admin',
        type: 'access', // Wrong type
      };
      const header = { typ: 'JWT', alg: 'HS256' };
      const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64');
      const payloadBase64 = Buffer.from(JSON.stringify(invalidPayload)).toString('base64');
      const signature = 'mock_signature';
      const token = `art_${headerBase64}.${payloadBase64}.${signature}`;

      // Act
      const result = jwtUtils.isValidRefreshTokenFormat(token);

      // Assert
      expect(result).toBe(false);
    });
  });
});
