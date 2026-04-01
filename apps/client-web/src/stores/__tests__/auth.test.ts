import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import * as authApi from '@/api/auth';

// Mock auth API
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  getCurrentUser: vi.fn(),
}));

describe('Auth Store', () => {
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    setActivePinia(createPinia());

    // Mock localStorage
    localStorageMock = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageMock[key];
        }),
      },
      writable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty token', () => {
      const store = useAuthStore();
      expect(store.token).toBe('');
    });

    it('should initialize with token from localStorage', () => {
      localStorageMock['token'] = 'uat_stored_token';
      const store = useAuthStore();
      expect(store.token).toBe('uat_stored_token');
    });

    it('should initialize with null user', () => {
      const store = useAuthStore();
      expect(store.user).toBeNull();
    });

    it('should initialize with false isLoggedIn', () => {
      const store = useAuthStore();
      expect(store.isLoggedIn).toBe(false);
    });

    it('should initialize with false loading', () => {
      const store = useAuthStore();
      expect(store.loading).toBe(false);
    });
  });

  describe('getters', () => {
    it('isAuthenticated should return false when no token', () => {
      const store = useAuthStore();
      expect(store.isAuthenticated).toBe(false);
    });

    it('isAuthenticated should return false when token exists but not logged in', () => {
      const store = useAuthStore();
      store.token = 'uat_some_token';
      store.isLoggedIn = false;
      expect(store.isAuthenticated).toBe(false);
    });

    it('isAuthenticated should return true when token exists and logged in', () => {
      const store = useAuthStore();
      store.token = 'uat_valid_token';
      store.isLoggedIn = true;
      expect(store.isAuthenticated).toBe(true);
    });

    it('userInfo should return default values when user is null', () => {
      const store = useAuthStore();
      expect(store.userInfo).toEqual({
        id: '',
        email: '',
        username: '',
        avatar: '',
      });
    });

    it('userInfo should return user data when user exists', () => {
      const store = useAuthStore();
      store.user = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        avatar: 'avatar.jpg',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-01',
      };
      expect(store.userInfo).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        avatar: 'avatar.jpg',
      });
    });
  });

  describe('login', () => {
    it('should login successfully with credentials', async () => {
      const store = useAuthStore();
      const mockResponse = {
        access_token: 'uat_new_token',
        refresh_token: 'urt_new_refresh_token',
        user: {
          id: 'user_123',
          email: 'test@example.com',
          username: 'testuser',
          role: 'user',
          status: 'active',
          createdAt: '2024-01-01',
        },
      };
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any);

      await store.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(store.token).toBe('uat_new_token');
      expect(store.user).toEqual(mockResponse.user);
      expect(store.isLoggedIn).toBe(true);
      expect(localStorageMock['token']).toBe('uat_new_token');
      expect(localStorageMock['refreshToken']).toBe('urt_new_refresh_token');
    });

    it('should handle login with token field (alternative response format)', async () => {
      const store = useAuthStore();
      const mockResponse = {
        token: 'uat_alternative_token',
        user: {
          id: 'user_456',
          email: 'test2@example.com',
          username: 'testuser2',
          role: 'user',
          status: 'active',
          createdAt: '2024-01-01',
        },
      };
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any);

      await store.login({
        email: 'test2@example.com',
        password: 'password123',
      });

      expect(store.token).toBe('uat_alternative_token');
      expect(store.user).toEqual(mockResponse.user);
    });

    it('should set loading to true during login', async () => {
      const store = useAuthStore();
      vi.mocked(authApi.login).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                access_token: 'uat_token',
                user: { id: '1', email: 'test@test.com', username: 'test', role: 'user', status: 'active', createdAt: '2024-01-01' },
              } as any);
            }, 10);
          })
      );

      const loginPromise = store.login({ email: 'test@test.com', password: 'pass' });
      expect(store.loading).toBe(true);

      await loginPromise;
      expect(store.loading).toBe(false);
    });

    it('should set loading to false even if login fails', async () => {
      const store = useAuthStore();
      vi.mocked(authApi.login).mockRejectedValue(new Error('Login failed'));

      try {
        await store.login({ email: 'test@test.com', password: 'wrong' });
      } catch {
        // Expected to throw
      }

      expect(store.loading).toBe(false);
    });

    it('should reject invalid access token prefix', async () => {
      const store = useAuthStore();
      const mockResponse = {
        access_token: 'invalid_token',
        user: { id: '1', email: 'test@test.com', username: 'test', role: 'user', status: 'active', createdAt: '2024-01-01' },
      };
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any);

      await expect(
        store.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Invalid access token format');

      expect(store.token).toBe('');
      expect(store.isLoggedIn).toBe(false);
    });

    it('should reject invalid refresh token prefix', async () => {
      const store = useAuthStore();
      const mockResponse = {
        access_token: 'uat_valid_token',
        refresh_token: 'invalid_refresh_token',
        user: { id: '1', email: 'test@test.com', username: 'test', role: 'user', status: 'active', createdAt: '2024-01-01' },
      };
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any);

      await expect(
        store.login({ email: 'test@test.com', password: 'pass' })
      ).rejects.toThrow('Invalid refresh token format');

      expect(store.token).toBe('');
      expect(store.isLoggedIn).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const store = useAuthStore();
      store.token = 'uat_existing_token';
      store.user = { id: '1', email: 'test@test.com', username: 'test', role: 'user', status: 'active', createdAt: '2024-01-01' };
      store.isLoggedIn = true;
      localStorageMock['token'] = 'uat_existing_token';
      localStorageMock['refreshToken'] = 'urt_existing_refresh_token';
      vi.mocked(authApi.logout).mockResolvedValue({} as any);

      await store.logout();

      expect(authApi.logout).toHaveBeenCalled();
      expect(store.token).toBe('');
      expect(store.user).toBeNull();
      expect(store.isLoggedIn).toBe(false);
      expect(localStorageMock['token']).toBeUndefined();
      expect(localStorageMock['refreshToken']).toBeUndefined();
    });

    it('should clear state even if logout API fails', async () => {
      const store = useAuthStore();
      store.token = 'uat_existing_token';
      store.user = { id: '1', email: 'test@test.com', username: 'test', role: 'user', status: 'active', createdAt: '2024-01-01' };
      store.isLoggedIn = true;
      vi.mocked(authApi.logout).mockRejectedValue(new Error('Logout failed'));

      // The logout function has try-finally, so it should complete even if API fails
      try {
        await store.logout();
      } catch {
        // Error is expected but state should still be cleared
      }

      expect(store.token).toBe('');
      expect(store.user).toBeNull();
      expect(store.isLoggedIn).toBe(false);
    });
  });

  describe('refreshAccessToken', () => {
    it('should throw error when no refresh token exists', async () => {
      const store = useAuthStore();
      // Ensure no refresh token in localStorage
      delete localStorageMock['refreshToken'];

      await expect(store.refreshAccessToken()).rejects.toThrow('No refresh token');
    });


  });

  describe('fetchCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const store = useAuthStore();
      store.token = 'uat_valid_token';
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-01',
      };
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser as any);

      await store.fetchCurrentUser();

      expect(authApi.getCurrentUser).toHaveBeenCalled();
      expect(store.user).toEqual(mockUser);
      expect(store.isLoggedIn).toBe(true);
    });

    it('should not fetch user when no token exists', async () => {
      const store = useAuthStore();
      store.token = '';

      await store.fetchCurrentUser();

      expect(authApi.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should logout when fetch user fails', async () => {
      const store = useAuthStore();
      store.token = 'uat_invalid_token';
      store.user = { id: '1', email: 'test@test.com', username: 'test', role: 'user', status: 'active', createdAt: '2024-01-01' };
      store.isLoggedIn = true;
      vi.mocked(authApi.getCurrentUser).mockRejectedValue(new Error('Invalid token'));
      vi.mocked(authApi.logout).mockResolvedValue({} as any);

      await store.fetchCurrentUser();

      expect(store.user).toBeNull();
      expect(store.isLoggedIn).toBe(false);
      expect(store.token).toBe('');
    });

    it('should logout when token has invalid prefix', async () => {
      const store = useAuthStore();
      store.token = 'invalid_token';
      store.user = { id: '1', email: 'test@test.com', username: 'test', role: 'user', status: 'active', createdAt: '2024-01-01' };
      store.isLoggedIn = true;

      await store.fetchCurrentUser();

      expect(authApi.getCurrentUser).not.toHaveBeenCalled();
      expect(store.user).toBeNull();
      expect(store.isLoggedIn).toBe(false);
      expect(store.token).toBe('');
    });
  });

  describe('initAuth', () => {
    it('should initialize auth with stored token', async () => {
      localStorageMock['token'] = 'uat_stored_token';
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-01',
      };
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUser as any);

      const store = useAuthStore();
      store.initAuth();

      expect(store.token).toBe('uat_stored_token');
    });

    it('should not initialize when no stored token', () => {
      const store = useAuthStore();
      const fetchSpy = vi.spyOn(store, 'fetchCurrentUser');

      store.initAuth();

      expect(fetchSpy).not.toHaveBeenCalled();
    });


  });
});
