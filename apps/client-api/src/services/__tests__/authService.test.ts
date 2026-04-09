import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import * as authService from '../authService';
import db from '@/config/database';
import { AppError } from '@/errors/AppError';

// Mock database
jest.mock('@/config/database', () => ({
  default: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    increment: jest.fn().mockReturnThis(),
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('token'),
  verify: jest.fn(),
}));

// Mock redis
jest.mock('@/services/tokenBlacklist', () => ({
  addToBlacklist: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      // Mock database calls
      (db as any).where.mockReturnThis();
      (db as any).first.mockResolvedValue(null); // User not found

      (db as any).insert.mockReturnThis();
      (db as any).where.mockReturnThis();

      // Mock the increment method for invite rewards
      (db as any).increment.mockReturnThis();

      const result = await authService.register(userData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('username', userData.username);
      expect(result).toHaveProperty('email', userData.email);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      // Mock database calls
      (db.select as any).mockReturnThis();
      (db.from as any).mockReturnThis();
      (db.where as any).mockReturnThis();
      (db.first as any).mockResolvedValue({ user_id: 1, username: 'testuser' }); // User found

      await expect(authService.register(userData)).rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
      };

      // Mock database calls
      (db.select as any).mockReturnThis();
      (db.from as any).mockReturnThis();
      (db.where as any).mockReturnThis();
      (db.first as any).mockResolvedValue(user);

      // Mock bcrypt compare
      const bcrypt = await import('bcryptjs');
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await authService.login(loginData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw error with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = {
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
      };

      // Mock database calls
      (db.select as any).mockReturnThis();
      (db.from as any).mockReturnThis();
      (db.where as any).mockReturnThis();
      (db.first as any).mockResolvedValue(user);

      // Mock bcrypt compare
      const bcrypt = await import('bcryptjs');
      (bcrypt.compare as any).mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow(AppError);
    });

    it('should throw error if user not found', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock database calls
      (db.select as any).mockReturnThis();
      (db.from as any).mockReturnThis();
      (db.where as any).mockReturnThis();
      (db.first as any).mockResolvedValue(null); // User not found

      await expect(authService.login(loginData)).rejects.toThrow(AppError);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const token = 'test_token';

      const result = await authService.logout(token);

      expect(result).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'refresh_token';
      const user = {
        user_id: 1,
        username: 'testuser',
        email: 'test@example.com',
      };

      // Mock jsonwebtoken verify
      const jwt = await import('jsonwebtoken');
      (jwt.verify as any).mockReturnValue({
        sub: user.user_id,
        type: 'refresh',
      });

      // Mock database calls
      (db.select as any).mockReturnThis();
      (db.from as any).mockReturnThis();
      (db.where as any).mockReturnThis();
      (db.first as any).mockResolvedValue(user);

      const result = await authService.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });
});
