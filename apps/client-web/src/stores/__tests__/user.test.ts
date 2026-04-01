import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '../user';
import * as authApi from '@/api/auth';
import * as userApi from '@/api/user';

// Mock APIs
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  updatePassword: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock('@/api/user', () => ({
  getCurrentUser: vi.fn(),
  updateUser: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
  },
}));

describe('User Store', () => {
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
      const store = useUserStore();
      expect(store.token).toBe('');
    });

    it('should initialize with token from localStorage', () => {
      localStorageMock['token'] = 'stored_token';
      const store = useUserStore();
      expect(store.token).toBe('stored_token');
    });

    it('should initialize with null userInfo', () => {
      const store = useUserStore();
      expect(store.userInfo).toBeNull();
    });

    it('should initialize with null currentUser', () => {
      const store = useUserStore();
      expect(store.currentUser).toBeNull();
    });

    it('should initialize with false loading', () => {
      const store = useUserStore();
      expect(store.loading).toBe(false);
    });

    it('should initialize with false isLoading', () => {
      const store = useUserStore();
      expect(store.isLoading).toBe(false);
    });
  });

  describe('getters', () => {
    it('isLoggedIn should return false when no token', () => {
      const store = useUserStore();
      expect(store.isLoggedIn).toBe(false);
    });

    it('isLoggedIn should return false when token exists but no userInfo', () => {
      const store = useUserStore();
      store.token = 'some_token';
      expect(store.isLoggedIn).toBe(false);
    });

    it('isLoggedIn should return true when token and userInfo exist', () => {
      const store = useUserStore();
      store.token = 'valid_token';
      store.userInfo = {
        id: 'user_123',
        userId: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        vpnUuid: 'vpn-uuid',
        status: 1,
        trafficLimit: 1000000000,
        trafficUsed: 500000000,
        expireDate: '2024-12-31',
        createdAt: '2024-01-01',
      };
      expect(store.isLoggedIn).toBe(true);
    });

    it('isExpired should return true when no expireDate', () => {
      const store = useUserStore();
      expect(store.isExpired).toBe(true);
    });

    it('isExpired should return true when expireDate is in the past', () => {
      const store = useUserStore();
      store.userInfo = {
        id: 'user_123',
        userId: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        vpnUuid: 'vpn-uuid',
        status: 1,
        trafficLimit: 1000000000,
        trafficUsed: 500000000,
        expireDate: '2020-01-01',
        createdAt: '2024-01-01',
      };
      expect(store.isExpired).toBe(true);
    });

    it('isExpired should return false when expireDate is in the future', () => {
      const store = useUserStore();
      store.userInfo = {
        id: 'user_123',
        userId: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        vpnUuid: 'vpn-uuid',
        status: 1,
        trafficLimit: 1000000000,
        trafficUsed: 500000000,
        expireDate: '2030-12-31',
        createdAt: '2024-01-01',
      };
      expect(store.isExpired).toBe(false);
    });

    it('trafficUsagePercent should return 0 when no userInfo', () => {
      const store = useUserStore();
      expect(store.trafficUsagePercent).toBe(0);
    });

    it('trafficUsagePercent should calculate percentage correctly', () => {
      const store = useUserStore();
      store.userInfo = {
        id: 'user_123',
        userId: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        vpnUuid: 'vpn-uuid',
        status: 1,
        trafficLimit: 1000,
        trafficUsed: 500,
        expireDate: '2024-12-31',
        createdAt: '2024-01-01',
      };
      expect(store.trafficUsagePercent).toBe(50);
    });

    it('trafficUsagePercent should round to nearest integer', () => {
      const store = useUserStore();
      store.userInfo = {
        id: 'user_123',
        userId: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        vpnUuid: 'vpn-uuid',
        status: 1,
        trafficLimit: 3,
        trafficUsed: 1,
        expireDate: '2024-12-31',
        createdAt: '2024-01-01',
      };
      expect(store.trafficUsagePercent).toBe(33);
    });

    it('remainingTraffic should return 0 when no userInfo', () => {
      const store = useUserStore();
      expect(store.remainingTraffic).toBe(0);
    });

    it('remainingTraffic should calculate remaining correctly', () => {
      const store = useUserStore();
      store.userInfo = {
        id: 'user_123',
        userId: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        vpnUuid: 'vpn-uuid',
        status: 1,
        trafficLimit: 1000,
        trafficUsed: 300,
        expireDate: '2024-12-31',
        createdAt: '2024-01-01',
      };
      expect(store.remainingTraffic).toBe(700);
    });

    it('remainingTraffic should return 0 when usage exceeds limit', () => {
      const store = useUserStore();
      store.userInfo = {
        id: 'user_123',
        userId: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        vpnUuid: 'vpn-uuid',
        status: 1,
        trafficLimit: 1000,
        trafficUsed: 1500,
        expireDate: '2024-12-31',
        createdAt: '2024-01-01',
      };
      expect(store.remainingTraffic).toBe(0);
    });

    it('daysRemaining should return 0 when no expireDate', () => {
      const store = useUserStore();
      expect(store.daysRemaining).toBe(0);
    });

    it('daysRemaining should calculate days correctly', () => {
      const store = useUserStore();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      store.userInfo = {
        id: 'user_123',
        userId: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        vpnUuid: 'vpn-uuid',
        status: 1,
        trafficLimit: 1000,
        trafficUsed: 500,
        expireDate: futureDate.toISOString(),
        createdAt: '2024-01-01',
      };
      expect(store.daysRemaining).toBe(30);
    });
  });

  describe('setToken', () => {
    it('should set token and persist to localStorage', () => {
      const store = useUserStore();
      store.setToken('new_token');
      expect(store.token).toBe('new_token');
      expect(localStorageMock['token']).toBe('new_token');
    });
  });

  describe('clearToken', () => {
    it('should clear token and userInfo', () => {
      const store = useUserStore();
      store.token = 'existing_token';
      store.userInfo = {
        id: 'user_123',
        userId: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        vpnUuid: 'vpn-uuid',
        status: 1,
        trafficLimit: 1000,
        trafficUsed: 500,
        expireDate: '2024-12-31',
        createdAt: '2024-01-01',
      };
      localStorageMock['token'] = 'existing_token';

      store.clearToken();

      expect(store.token).toBe('');
      expect(store.userInfo).toBeNull();
      expect(localStorageMock['token']).toBeUndefined();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const store = useUserStore();
      const mockResponse = {
        tokens: {
          accessToken: 'auth_token',
          refreshToken: 'refresh_token',
        },
        user: {
          id: 'user_123',
          userId: 'user_123',
          email: 'test@example.com',
          username: 'testuser',
          vpnUuid: 'vpn-uuid',
          status: 1,
          trafficLimit: 1000000000,
          trafficUsed: 500000000,
          expireDate: '2024-12-31',
          createdAt: '2024-01-01',
        },
      };
      vi.mocked(authApi.login).mockResolvedValue(mockResponse as any);

      const result = await store.login('test@example.com', 'password123');

      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toBe(true);
      expect(store.token).toBe('auth_token');
      expect(store.userInfo).toEqual(mockResponse.user);
    });

    it('should return false on login failure', async () => {
      const store = useUserStore();
      vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));

      const result = await store.login('test@example.com', 'wrong_password');

      expect(result).toBe(false);
      expect(store.token).toBe('');
    });

    it('should set isLoading during login', async () => {
      const store = useUserStore();
      vi.mocked(authApi.login).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                token: 'token',
                user: {
                  id: 'user_123',
                  userId: 'user_123',
                  email: 'test@example.com',
                  username: 'testuser',
                  vpnUuid: 'vpn-uuid',
                  status: 1,
                  trafficLimit: 1000,
                  trafficUsed: 500,
                  expireDate: '2024-12-31',
                  createdAt: '2024-01-01',
                },
              } as any);
            }, 10);
          })
      );

      const loginPromise = store.login('test@example.com', 'password');
      expect(store.isLoading).toBe(true);

      await loginPromise;
      expect(store.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const store = useUserStore();
      const mockResponse = {
        tokens: {
          accessToken: 'auth_token',
          refreshToken: 'refresh_token',
        },
        user: {
          id: 'user_123',
          userId: 'user_123',
          email: 'new@example.com',
          username: 'newuser',
          vpnUuid: 'vpn-uuid',
          status: 1,
          trafficLimit: 1000000000,
          trafficUsed: 0,
          expireDate: '2024-12-31',
          createdAt: '2024-01-01',
        },
      };
      vi.mocked(authApi.register).mockResolvedValue(mockResponse as any);

      const result = await store.register('new@example.com', 'password123', 'password123', 'newuser', true, 'invite_code');

      expect(authApi.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
        confirmPassword: 'password123',
        agreeTerms: true,
        inviteCode: 'invite_code',
      });
      expect(result).toBe(true);
      expect(store.token).toBe('auth_token');
    });

    it('should return false on registration failure', async () => {
      const store = useUserStore();
      vi.mocked(authApi.register).mockRejectedValue(new Error('Email already exists'));

      const result = await store.register('exists@example.com', 'password123', 'password123');

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const store = useUserStore();
      store.token = 'existing_token';
      store.userInfo = {
        id: 'user_123',
        userId: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        vpnUuid: 'vpn-uuid',
        status: 1,
        trafficLimit: 1000,
        trafficUsed: 500,
        expireDate: '2024-12-31',
        createdAt: '2024-01-01',
      };
      vi.mocked(authApi.logout).mockResolvedValue({} as any);

      await store.logout();

      expect(authApi.logout).toHaveBeenCalled();
      expect(store.token).toBe('');
      expect(store.userInfo).toBeNull();
    });

    it('should clear token even if logout API fails', async () => {
      const store = useUserStore();
      store.token = 'existing_token';
      vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'));

      await store.logout();

      expect(store.token).toBe('');
    });
  });

  describe('fetchUserInfo', () => {
    it('should fetch user info successfully', async () => {
      const store = useUserStore();
      store.token = 'valid_token';
      const mockUserInfo = {
        id: 'user_123',
        userId: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        vpnUuid: 'vpn-uuid',
        status: 1,
        trafficLimit: 1000000000,
        trafficUsed: 500000000,
        expireDate: '2024-12-31',
        createdAt: '2024-01-01',
      };
      vi.mocked(authApi.getCurrentUser).mockResolvedValue(mockUserInfo as any);

      const result = await store.fetchUserInfo();

      expect(authApi.getCurrentUser).toHaveBeenCalled();
      expect(result).toBe(true);
      expect(store.userInfo).toEqual(mockUserInfo);
    });

    it('should return false when no token', async () => {
      const store = useUserStore();
      store.token = '';

      const result = await store.fetchUserInfo();

      expect(result).toBe(false);
      expect(authApi.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should clear token on fetch failure', async () => {
      const store = useUserStore();
      store.token = 'invalid_token';
      vi.mocked(authApi.getCurrentUser).mockRejectedValue(new Error('Invalid token'));

      const result = await store.fetchUserInfo();

      expect(result).toBe(false);
      expect(store.token).toBe('');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const store = useUserStore();
      vi.mocked(authApi.updatePassword).mockResolvedValue({} as any);

      await store.updatePassword('oldPass123', 'newPass123');

      expect(authApi.updatePassword).toHaveBeenCalledWith({
        oldPassword: 'oldPass123',
        newPassword: 'newPass123',
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const store = useUserStore();
      vi.mocked(authApi.resetPassword).mockResolvedValue({} as any);

      await store.resetPassword('test@example.com');

      expect(authApi.resetPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });

  describe('fetchUser', () => {
    it('should fetch current user for profile', async () => {
      const store = useUserStore();
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-01',
      };
      vi.mocked(userApi.getCurrentUser).mockResolvedValue(mockUser as any);

      const result = await store.fetchUser();

      expect(userApi.getCurrentUser).toHaveBeenCalled();
      expect(store.currentUser).toEqual(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should set loading during fetch', async () => {
      const store = useUserStore();
      vi.mocked(userApi.getCurrentUser).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ id: '1', email: 'test@test.com', username: 'test', role: 'user', status: 'active', createdAt: '2024-01-01' } as any);
            }, 10);
          })
      );

      const fetchPromise = store.fetchUser();
      expect(store.loading).toBe(true);

      await fetchPromise;
      expect(store.loading).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('should update user info successfully', async () => {
      const store = useUserStore();
      const mockUpdatedUser = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'newusername',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-01',
      };
      vi.mocked(userApi.updateUser).mockResolvedValue(mockUpdatedUser as any);

      const result = await store.updateUser({ username: 'newusername' });

      expect(userApi.updateUser).toHaveBeenCalledWith({ username: 'newusername' });
      expect(store.currentUser).toEqual(mockUpdatedUser);
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should set loading during update', async () => {
      const store = useUserStore();
      vi.mocked(userApi.updateUser).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ id: '1', email: 'test@test.com', username: 'updated', role: 'user', status: 'active', createdAt: '2024-01-01' } as any);
            }, 10);
          })
      );

      const updatePromise = store.updateUser({ username: 'updated' });
      expect(store.loading).toBe(true);

      await updatePromise;
      expect(store.loading).toBe(false);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const store = useUserStore();
      vi.mocked(userApi.changePassword).mockResolvedValue({} as any);

      await store.changePassword({ oldPassword: 'oldPass', newPassword: 'newPass' });

      expect(userApi.changePassword).toHaveBeenCalledWith({
        oldPassword: 'oldPass',
        newPassword: 'newPass',
      });
    });
  });
});
