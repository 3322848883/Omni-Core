import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Cookies from 'js-cookie';
import { login as loginApi, getCurrentUser } from '@api/auth';
import { validateAccessToken, validateRefreshToken, isClientToken } from '@utils/token';
import type { LoginForm, UserInfo } from '../types/user';

const TOKEN_KEY = 'admin_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string>(Cookies.get(TOKEN_KEY) || '');
  const refreshToken = ref<string>(Cookies.get(REFRESH_TOKEN_KEY) || '');
  const userInfo = ref<UserInfo | null>(null);
  const loading = ref(false);

  // Getters
  const isAuthenticated = computed(() => {
    // 验证 token 前缀，确保是管理端 token
    return !!token.value && validateAccessToken(token.value);
  });
  const isAdmin = computed(() => userInfo.value?.role === 'admin' || userInfo.value?.role === 'super_admin');

  // Actions
  const setToken = (newToken: string, newRefreshToken: string) => {
    // 验证 token 前缀，防止错误的 token 类型被存储
    if (!validateAccessToken(newToken)) {
      console.error('Invalid access token format: expected aat_ prefix');
      if (isClientToken(newToken)) {
        throw new Error('User token cannot be used for admin access. Please use admin credentials.');
      }
      throw new Error('Invalid token format');
    }
    if (!validateRefreshToken(newRefreshToken)) {
      console.error('Invalid refresh token format: expected art_ prefix');
      throw new Error('Invalid refresh token format');
    }

    token.value = newToken;
    refreshToken.value = newRefreshToken;
    Cookies.set(TOKEN_KEY, newToken, { expires: 1 }); // 1 day
    Cookies.set(REFRESH_TOKEN_KEY, newRefreshToken, { expires: 7 }); // 7 days
  };

  const clearToken = () => {
    token.value = '';
    refreshToken.value = '';
    userInfo.value = null;
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
  };

  const login = async (form: LoginForm) => {
    loading.value = true;
    try {
      const res = await loginApi(form);
      // API returns accessToken, map to token for store
      setToken(res.accessToken, res.refreshToken);
      // Fetch user info separately since login only returns tokens
      await fetchUserInfo();
      return res;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    clearToken();
  };

  const fetchUserInfo = async () => {
    if (!token.value) return;
    try {
      const res = await getCurrentUser();
      userInfo.value = res;
    } catch {
      clearToken();
    }
  };

  return {
    token,
    refreshToken,
    userInfo,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    fetchUserInfo,
    setToken,
    clearToken,
  };
});
