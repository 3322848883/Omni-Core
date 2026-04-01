import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserInfo, AuthResponse } from '@/api/auth';
import * as authApi from '@/api/auth';
import * as userApi from '@/api/user';
import type { User } from '@/types/user';
import router from '@/router';

// Helper to safely parse JSON from localStorage
const getStoredUserInfo = (): UserInfo | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('userInfo');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

// Helper to safely get token from localStorage
const getStoredToken = (): string => {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
};

export const useUserStore = defineStore('user', () => {
  // State - 使用延迟初始化
  const token = ref<string>('');
  const userInfo = ref<UserInfo | null>(null);
  const currentUser = ref<User | null>(null);
  const loading = ref(false);
  const isLoading = ref(false);
  const initialized = ref(false);

  // Initialize from localStorage
  const initFromStorage = () => {
    if (initialized.value) return;
    token.value = getStoredToken();
    userInfo.value = getStoredUserInfo();
    initialized.value = true;
  };

  // Auto-initialize from storage on first access
  initFromStorage();

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value);
  const isExpired = computed(() => {
    if (!userInfo.value?.expireDate) return true;
    return new Date(userInfo.value.expireDate) < new Date();
  });
  const trafficUsagePercent = computed(() => {
    if (!userInfo.value) return 0;
    return Math.round((userInfo.value.trafficUsed / userInfo.value.trafficLimit) * 100);
  });
  const remainingTraffic = computed(() => {
    if (!userInfo.value) return 0;
    return Math.max(0, userInfo.value.trafficLimit - userInfo.value.trafficUsed);
  });
  const daysRemaining = computed(() => {
    if (!userInfo.value?.expireDate) return 0;
    const expireDate = new Date(userInfo.value.expireDate);
    const now = new Date();
    const diffTime = expireDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  // Actions
  const setToken = (newToken: string) => {
    token.value = newToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', newToken);
    }
  };

  const setUserInfo = (newUserInfo: UserInfo) => {
    userInfo.value = newUserInfo;
    if (typeof window !== 'undefined') {
      localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
    }
  };

  const clearToken = () => {
    token.value = '';
    userInfo.value = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
    }
  };

  const login = async (email: string, password: string) => {
    isLoading.value = true;
    try {
      const response = await authApi.login({ email, password }) as unknown as AuthResponse;
      setToken(response.tokens.accessToken);
      setUserInfo(response.user);
      return true;
    } catch (error) {
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (
    email: string,
    password: string,
    confirmPassword?: string,
    username?: string,
    agreeTerms?: boolean,
    inviteCode?: string
  ) => {
    isLoading.value = true;
    try {
      const response = await authApi.register({
        email,
        password,
        username: username || email.split('@')[0],
        confirmPassword: confirmPassword || password,
        agreeTerms: agreeTerms ?? true,
        inviteCode
      }) as unknown as AuthResponse;
      setToken(response.tokens.accessToken);
      setUserInfo(response.user);
      return true;
    } catch (error) {
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore error
    } finally {
      clearToken();
      router.push('/login');
    }
  };

  const fetchUserInfo = async () => {
    if (!token.value) return false;
    try {
      const data = await authApi.getCurrentUser() as unknown as UserInfo;
      userInfo.value = data;
      return true;
    } catch (error) {
      clearToken();
      return false;
    }
  };

  const updatePassword = async (oldPassword: string, newPassword: string) => {
    await authApi.updatePassword({ oldPassword, newPassword });
  };

  const resetPassword = async (email: string) => {
    await authApi.resetPassword({ email });
  };

  // Fetch current user (for profile page)
  const fetchUser = async () => {
    loading.value = true;
    try {
      const data = await userApi.getCurrentUser();
      currentUser.value = data as unknown as User;
      return data;
    } finally {
      loading.value = false;
    }
  };

  // Update user info
  const updateUser = async (data: { username?: string }) => {
    loading.value = true;
    try {
      const updated = await userApi.updateUser(data);
      currentUser.value = updated as unknown as User;
      return updated;
    } finally {
      loading.value = false;
    }
  };

  // Change password
  const changePassword = async (data: { oldPassword: string; newPassword: string; confirmPassword?: string }) => {
    await userApi.changePassword({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword || data.newPassword
    });
  };

  return {
    // State
    token,
    userInfo,
    currentUser,
    loading,
    isLoading,
    initialized,
    // Getters
    isLoggedIn,
    isExpired,
    trafficUsagePercent,
    remainingTraffic,
    daysRemaining,
    // Actions
    setToken,
    setUserInfo,
    clearToken,
    login,
    register,
    logout,
    fetchUserInfo,
    initFromStorage,
    updatePassword,
    resetPassword,
    fetchUser,
    updateUser,
    changePassword,
  };
});
