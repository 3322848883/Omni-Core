import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';
import {
  generateSignatureSync,
  requiresSignature,
} from './signature';
import { getCsrfToken, refreshCsrfToken } from './csrf';

// 请求配置接口扩展
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    skipSignature?: boolean;
    skipCsrf?: boolean;
    retryCount?: number;
  }
}

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: '/api/v1/client',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 允许携带 Cookie
});

// 最大重试次数
const MAX_RETRY_COUNT = 3;

/**
 * 生成请求 ID
 * @returns 请求 ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 从 URL 中提取路径
 * @param url 完整 URL
 * @returns 路径
 */
function extractPath(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.pathname;
  } catch {
    // 如果 URL 解析失败，直接返回原始值
    return url.split('?')[0];
  }
}

/**
 * 序列化请求体
 * @param data 请求数据
 * @returns 序列化后的字符串
 */
function serializeBody(data: any): string {
  if (!data) return '';
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

// 请求拦截器
instance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 添加请求 ID
    config.headers['X-Request-ID'] = generateRequestId();

    // 添加客户端版本
    config.headers['X-Client-Version'] =
      import.meta.env.VITE_APP_VERSION || '1.0.0';

    // 添加设备 ID
    const deviceId = localStorage.getItem('deviceId');
    if (deviceId) {
      config.headers['X-Device-ID'] = deviceId;
    }

    // 添加认证 Token
    // Try to get token from authStore first, fallback to localStorage
    let token = '';
    try {
      const authStore = useAuthStore();
      token = authStore.token;
    } catch (e) {
      // Store not initialized yet
    }
    // Fallback to localStorage if store token is empty
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('token') || '';
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加 CSRF Token（如果不是跳过 CSRF 的请求）
    if (!config.skipCsrf) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // 对敏感操作添加请求签名（如果不是跳过签名的请求）
    if (!config.skipSignature) {
      const method = config.method?.toUpperCase() || 'GET';
      const path = extractPath(config.url || '');

      if (requiresSignature(method, path)) {
        const body = serializeBody(config.data);
        const signatureData = generateSignatureSync(method, path, body);

        config.headers['X-Signature'] = signatureData.signature;
        config.headers['X-Timestamp'] = String(signatureData.timestamp);
        config.headers['X-Nonce'] = signatureData.nonce;
        config.headers['X-Signature-Version'] = signatureData.version;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 检查响应头中是否有新的 CSRF Token
    const newCsrfToken = response.headers['x-csrf-token'];
    if (newCsrfToken) {
      refreshCsrfToken(newCsrfToken);
    }

    // 如果响应有标准格式，处理 data 字段
    if (response.data && response.data.success !== undefined) {
      if (response.data.success) {
        // 修改 response.data 为实际的 data 内容
        response.data = response.data.data;
      } else {
        const errorMsg = response.data.message || 'Request failed';
        ElMessage.error(errorMsg);
        return Promise.reject(new Error(errorMsg));
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    const { response, config } = error;

    // 处理 CSRF Token 过期
    if (response?.status === 403) {
      const errorCode = (response.data as any)?.code;
      if (errorCode === 'CSRF_TOKEN_INVALID' || errorCode === 'CSRF_TOKEN_EXPIRED') {
        // 尝试刷新 CSRF Token 并重试
        if (config && (config.retryCount || 0) < MAX_RETRY_COUNT) {
          config.retryCount = (config.retryCount || 0) + 1;
          try {
            await refreshCsrfToken();
            return instance(config);
          } catch {
            // 刷新失败，继续处理错误
          }
        }
      }
    }

    // 处理 Token 过期
    if (response?.status === 401) {
      const errorMessage = (response.data as any)?.message || '';
      const errorCode = (response.data as any)?.code;

      // Check for token expiration by message or code
      const isTokenExpired = errorMessage.toLowerCase().includes('expired') ||
                            errorCode === 'TOKEN_EXPIRED' ||
                            errorCode === 401;

      if (isTokenExpired) {
        const authStore = useAuthStore();

        // 尝试刷新 Token
        try {
          await authStore.refreshAccessToken();
          // 重试原请求
          if (config) {
            return instance(config);
          }
        } catch {
          // 刷新失败，登出并跳转
          authStore.logout();
          window.location.href = '/login';
        }
      }
    }

    // 错误消息处理
    let errorMsg = 'Network error';

    if (response) {
      const { status, data } = response;

      switch (status) {
        case 400:
          errorMsg = (data as any)?.message || 'Bad request';
          break;
        case 401:
          errorMsg = 'Unauthorized, please login again';
          break;
        case 403:
          errorMsg = (data as any)?.message || 'Access denied';
          break;
        case 404:
          errorMsg = 'Resource not found';
          break;
        case 409:
          errorMsg = (data as any)?.message || 'Resource conflict';
          break;
        case 422:
          errorMsg = (data as any)?.message || 'Validation failed';
          break;
        case 429:
          errorMsg = 'Too many requests, please try again later';
          break;
        case 500:
          errorMsg = 'Server error';
          break;
        case 503:
          errorMsg = 'Service unavailable';
          break;
        default:
          errorMsg = (data as any)?.message || `Request failed (${status})`;
      }
    } else if (error.request) {
      errorMsg = 'No response from server';
    } else {
      errorMsg = error.message;
    }

    ElMessage.error(errorMsg);
    return Promise.reject(error);
  }
);

// 请求封装 - 使用 async/await 提取 response.data
export const request = {
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig & { skipSignature?: boolean; skipCsrf?: boolean }
  ): Promise<T> {
    const res = await instance.get<T>(url, config);
    return res.data;
  },

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { skipSignature?: boolean; skipCsrf?: boolean }
  ): Promise<T> {
    const res = await instance.post<T>(url, data, config);
    return res.data;
  },

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { skipSignature?: boolean; skipCsrf?: boolean }
  ): Promise<T> {
    const res = await instance.put<T>(url, data, config);
    return res.data;
  },

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & { skipSignature?: boolean; skipCsrf?: boolean }
  ): Promise<T> {
    const res = await instance.patch<T>(url, data, config);
    return res.data;
  },

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig & { skipSignature?: boolean; skipCsrf?: boolean }
  ): Promise<T> {
    const res = await instance.delete<T>(url, config);
    return res.data;
  },
};

// 导出封装后的 request 对象作为默认导出
export default request;

// 导出 axios 实例（供需要直接使用 instance 的场景）
export { instance };

// 导出类型
export type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError };
