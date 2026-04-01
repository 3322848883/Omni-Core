// Auth Store
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import * as authApi from '@/api/auth';
import type { LoginRequest } from '@/api/auth';
import type { User } from '@/types/user';
import { validateAccessToken, validateRefreshToken } from '@/utils/token';

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '');
  const refreshTokenValue = ref<string>(localStorage.getItem('refreshToken') || '');
  const user = ref<User | null>(null);
  const isLoggedIn = ref<boolean>(false);
  const loading = ref<boolean>(false);

  // Getters
  const isAuthenticated = computed(() => !!token.value && isLoggedIn.value);

  const userInfo = computed(() => ({
    id: user.value?.id || '',
    email: user.value?.email || '',
    username: user.value?.username || '',
    avatar: user.value?.avatar || '',
  }));

  // Actions
  /**
   * User login
   */
  async function login(credentials: LoginRequest) {
    loading.value = true;
    try {
      const response = await authApi.login(credentials);
      // Backend may return { token, user } or { access_token, refresh_token, user }
      const accessToken = (response as any).access_token || (response as any).token;
      const refreshTokenStr = (response as any).refresh_token;
      const userData = (response as any).user || response;

      // Validate access token prefix
      if (!validateAccessToken(accessToken)) {
        throw new Error('Invalid access token format: token must start with "uat_"');
      }

      // Validate refresh token prefix if provided
      if (refreshTokenStr && !validateRefreshToken(refreshTokenStr)) {
        throw new Error('Invalid refresh token format: token must start with "urt_"');
      }

      // Save Token
      token.value = accessToken;
      if (refreshTokenStr) {
        refreshTokenValue.value = refreshTokenStr;
        localStorage.setItem('refreshToken', refreshTokenStr);
      }

      // Persist storage
      localStorage.setItem('token', accessToken);

      // Set user state
      user.value = userData;
      isLoggedIn.value = true;

      return response;
    } catch (error: any) {
      // Clear any partial state on error
      token.value = '';
      refreshTokenValue.value = '';
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      // Show error message
      const errorMessage = error?.message || 'Login failed';
      ElMessage.error(errorMessage);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * User logout
   */
  async function logout() {
    try {
      await authApi.logout();
    } finally {
      // Clear state
      token.value = '';
      refreshTokenValue.value = '';
      user.value = null;
      isLoggedIn.value = false;

      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  /**
   * Refresh Token
   */
  async function refreshAccessToken() {
    if (!refreshTokenValue.value) {
      throw new Error('No refresh token');
    }

    // Validate refresh token prefix before using
    if (!validateRefreshToken(refreshTokenValue.value)) {
      // Clear invalid token
      refreshTokenValue.value = '';
      localStorage.removeItem('refreshToken');
      throw new Error('Invalid refresh token format: token must start with "urt_"');
    }

    const response: any = await authApi.refreshToken();
    const accessToken = (response as any).access_token || (response as any).token;

    // Validate new access token prefix
    if (!validateAccessToken(accessToken)) {
      throw new Error('Invalid access token format received from server');
    }

    token.value = accessToken;
    localStorage.setItem('token', accessToken);

    return response;
  }

  /**
   * Fetch current user
   */
  async function fetchCurrentUser() {
    if (!token.value) return;

    // Validate token prefix before using
    if (!validateAccessToken(token.value)) {
      // Invalid token format, clear and logout
      await logout();
      return;
    }

    try {
      const response = await authApi.getCurrentUser();
      user.value = response as unknown as User;
      isLoggedIn.value = true;
    } catch {
      // Token invalid, clear login state
      await logout();
    }
  }

  /**
   * Initialize auth state
   */
  function initAuth() {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      // Validate token prefix before restoring
      if (!validateAccessToken(savedToken)) {
        // Invalid token format, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return;
      }
      token.value = savedToken;
      fetchCurrentUser();
    }
  }

  return {
    // State
    token,
    user,
    isLoggedIn,
    loading,
    // Getters
    isAuthenticated,
    userInfo,
    // Actions
    login,
    logout,
    refreshAccessToken,
    fetchCurrentUser,
    initAuth,
  };
});
