import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const vi = jest;
import { getUserById, updateUser, changePassword } from '../userService';
import { NotFoundError, UnauthorizedError, ConflictError } from '@/errors/AppError';

// Mock database
vi.mock('@/config/database', () => ({
  default: vi.fn(() => ({
    where: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(1),
    returning: vi.fn().mockResolvedValue([]),
    whereNot: vi.fn().mockReturnThis(),
  })),
}));

// Mock crypto utils
vi.mock('@/utils/crypto', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

describe('User Service', () => {
  const mockUser = {
    user_id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    password_hash: 'hashed_password',
    vpn_uuid: 'vpn-uuid-123',
    status: '1',
    traffic_limit: 1000000,
    traffic_used: 0,
    expire_date: null,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserById', () => {
    it('should return user info for valid user ID', async () => {
      const db = require('@/config/database').default;
      db().first.mockResolvedValueOnce(mockUser);

      const result = await getUserById('user-123');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
    });

    it('should throw NotFoundError when user not found', async () => {
      const db = require('@/config/database').default;
      db().first.mockResolvedValueOnce(null);

      await expect(getUserById('non-existent-user')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateUser', () => {
    it('should update user information successfully', async () => {
      const db = require('@/config/database').default;
      db().first.mockResolvedValueOnce(mockUser);
      db().returning.mockResolvedValueOnce([{
        ...mockUser,
        email: 'new@example.com',
        username: 'newuser',
      }]);

      const result = await updateUser('user-123', {
        email: 'new@example.com',
        username: 'newuser',
      });

      expect(result).toBeDefined();
      expect(result.email).toBe('new@example.com');
      expect(result.username).toBe('newuser');
    });

    it('should throw NotFoundError when user not found', async () => {
      const db = require('@/config/database').default;
      db().first.mockResolvedValueOnce(null);

      await expect(updateUser('non-existent-user', {})).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when email is already taken', async () => {
      const db = require('@/config/database').default;
      db().first
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ user_id: 'other-user', email: 'existing@example.com' });

      await expect(updateUser('user-123', {
        email: 'existing@example.com',
      })).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError when username is already taken', async () => {
      const db = require('@/config/database').default;
      db().first
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ user_id: 'other-user', username: 'existinguser' });

      await expect(updateUser('user-123', {
        username: 'existinguser',
      })).rejects.toThrow(ConflictError);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const db = require('@/config/database').default;
      db().first.mockResolvedValueOnce(mockUser);
      
      const { verifyPassword } = require('@/utils/crypto');
      (verifyPassword as jest.Mock).mockResolvedValueOnce(true);

      await expect(changePassword('user-123', 'oldpass', 'newpass')).resolves.not.toThrow();
    });

    it('should throw NotFoundError when user not found', async () => {
      const db = require('@/config/database').default;
      db().first.mockResolvedValueOnce(null);

      await expect(changePassword('non-existent-user', 'oldpass', 'newpass')).rejects.toThrow(NotFoundError);
    });

    it('should throw UnauthorizedError when old password is invalid', async () => {
      const db = require('@/config/database').default;
      db().first.mockResolvedValueOnce(mockUser);
      
      const { verifyPassword } = require('@/utils/crypto');
      (verifyPassword as jest.Mock).mockResolvedValueOnce(false);

      await expect(changePassword('user-123', 'wrongpass', 'newpass')).rejects.toThrow(UnauthorizedError);
    });
  });
});
