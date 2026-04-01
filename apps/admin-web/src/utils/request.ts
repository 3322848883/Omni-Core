import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@stores/auth';
import { refreshToken } from '@api/auth';

// Create axios instance
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1/admin',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * 生成请求 ID
 * @returns 请求 ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 生成设备 ID
 * @returns 设备 ID
 */
function generateDeviceId(): string {
  return `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取或生成设备 ID
 * @returns 设备 ID
 */
function getDeviceId(): string {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

/**
 * 订阅 token 刷新
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * 通知所有订阅者新 token
 */
function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
}

// Request interceptor
request.interceptors.request.use(
  (config) => {
    // 添加请求 ID
    config.headers['X-Request-ID'] = generateRequestId();

    // 添加客户端版本
    config.headers['X-Client-Version'] =
      import.meta.env.VITE_APP_VERSION || '1.0.0';

    // 添加设备 ID
    config.headers['X-Device-ID'] = getDeviceId();

    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    
    if (data.success === false) {
      ElMessage.error(data.error?.message || 'Request failed');
      return Promise.reject(new Error(data.error?.message));
    }
    
    return data.data;
  },
  async (error: AxiosError) => {
    const { response, config: originalConfig } = error;
    
    if (response) {
      const { status, data } = response;
      
      // Token expired, try to refresh
      if (status === 401 && originalConfig && !(originalConfig as any)._retry) {
        if (isRefreshing) {
          // Wait for token refresh
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken: string) => {
              if (originalConfig.headers) {
                originalConfig.headers.Authorization = `Bearer ${newToken}`;
              }
              resolve(request(originalConfig));
            });
          });
        }

        (originalConfig as any)._retry = true;
        isRefreshing = true;

        try {
          const authStore = useAuthStore();
          const res = await refreshToken();
          const newToken = res.accessToken || res.token;
          const newRefreshToken = res.refreshToken;
          
          authStore.setToken(newToken, newRefreshToken);
          
          // Update Authorization header
          if (originalConfig.headers) {
            originalConfig.headers.Authorization = `Bearer ${newToken}`;
          }
          
          onTokenRefreshed(newToken);
          isRefreshing = false;
          
          return request(originalConfig);
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];
          
          // Refresh failed, logout
          ElMessage.error('Session expired, please login again');
          useAuthStore().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      switch (status) {
        case 401:
          ElMessage.error('Session expired, please login again');
          useAuthStore().logout();
          window.location.href = '/login';
          break;
        case 403:
          ElMessage.error('Permission denied');
          break;
        case 404:
          ElMessage.error('Resource not found');
          break;
        case 500:
          ElMessage.error('Server error');
          break;
        default:
          ElMessage.error((data as any)?.error?.message || 'Request failed');
      }
    } else {
      ElMessage.error('Network error');
    }
    
    return Promise.reject(error);
  }
);

export default request;
