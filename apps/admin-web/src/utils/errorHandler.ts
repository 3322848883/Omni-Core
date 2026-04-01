import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@stores/auth';

/**
 * 错误操作类型
 */
export type ErrorAction = 'login' | 'contact_admin' | 'retry' | 'correct' | 'refresh' | 'none';

/**
 * 错误信息配置接口
 */
export interface ErrorInfo {
  /** 用户友好的错误消息 */
  message: string;
  /** 建议的操作 */
  action: ErrorAction;
  /** 操作按钮文本 */
  actionText?: string;
  /** 消息持续时间（毫秒），0 表示不自动关闭 */
  duration?: number;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
}

/**
 * 错误码到错误信息的映射
 */
export const ErrorMessages: Record<string, ErrorInfo> = {
  // 认证相关错误
  'UNAUTHORIZED': {
    message: '登录已过期，请重新登录',
    action: 'login',
    actionText: '去登录',
    duration: 0,
    showClose: true,
  },
  'TOKEN_EXPIRED': {
    message: '登录已过期，请重新登录',
    action: 'login',
    actionText: '去登录',
    duration: 0,
    showClose: true,
  },
  'TOKEN_INVALID': {
    message: '登录状态无效，请重新登录',
    action: 'login',
    actionText: '去登录',
    duration: 0,
    showClose: true,
  },

  // 权限相关错误
  'FORBIDDEN': {
    message: '无权访问此资源，如需帮助请联系管理员',
    action: 'contact_admin',
    actionText: '联系管理员',
    duration: 5000,
    showClose: true,
  },
  'PERMISSION_DENIED': {
    message: '权限不足，无法执行此操作',
    action: 'contact_admin',
    actionText: '联系管理员',
    duration: 5000,
    showClose: true,
  },

  // 限流相关错误
  'RATE_LIMITED': {
    message: '请求过于频繁，请稍后再试',
    action: 'retry',
    actionText: '重试',
    duration: 5000,
    showClose: true,
  },
  'TOO_MANY_REQUESTS': {
    message: '操作过于频繁，请稍后再试',
    action: 'retry',
    actionText: '重试',
    duration: 5000,
    showClose: true,
  },

  // 验证相关错误
  'VALIDATION_ERROR': {
    message: '输入信息有误，请检查并修正',
    action: 'correct',
    actionText: '知道了',
    duration: 5000,
    showClose: true,
  },
  'BAD_REQUEST': {
    message: '请求参数错误，请检查输入',
    action: 'correct',
    actionText: '知道了',
    duration: 5000,
    showClose: true,
  },

  // 资源相关错误
  'NOT_FOUND': {
    message: '请求的资源不存在或已被删除',
    action: 'refresh',
    actionText: '刷新页面',
    duration: 5000,
    showClose: true,
  },
  'RESOURCE_NOT_FOUND': {
    message: '资源不存在，请刷新后重试',
    action: 'refresh',
    actionText: '刷新页面',
    duration: 5000,
    showClose: true,
  },
  'CONFLICT': {
    message: '资源冲突，请刷新后重试',
    action: 'refresh',
    actionText: '刷新页面',
    duration: 5000,
    showClose: true,
  },

  // 网络相关错误
  'NETWORK_ERROR': {
    message: '网络连接失败，请检查网络设置',
    action: 'retry',
    actionText: '重试',
    duration: 0,
    showClose: true,
  },
  'TIMEOUT': {
    message: '请求超时，请检查网络后重试',
    action: 'retry',
    actionText: '重试',
    duration: 0,
    showClose: true,
  },
  'CONNECTION_ERROR': {
    message: '无法连接到服务器，请检查网络',
    action: 'retry',
    actionText: '重试',
    duration: 0,
    showClose: true,
  },

  // 服务器相关错误
  'SERVER_ERROR': {
    message: '服务器繁忙，请稍后再试',
    action: 'retry',
    actionText: '重试',
    duration: 5000,
    showClose: true,
  },
  'INTERNAL_ERROR': {
    message: '服务器内部错误，请稍后再试或联系管理员',
    action: 'retry',
    actionText: '重试',
    duration: 5000,
    showClose: true,
  },
  'SERVICE_UNAVAILABLE': {
    message: '服务暂时不可用，请稍后再试',
    action: 'retry',
    actionText: '重试',
    duration: 5000,
    showClose: true,
  },

  // 默认错误
  'UNKNOWN_ERROR': {
    message: '操作失败，请稍后重试',
    action: 'retry',
    actionText: '重试',
    duration: 5000,
    showClose: true,
  },
};

/**
 * HTTP 状态码到错误码的映射
 */
const HttpStatusToErrorCode: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'TOO_MANY_REQUESTS',
  500: 'SERVER_ERROR',
  502: 'SERVICE_UNAVAILABLE',
  503: 'SERVICE_UNAVAILABLE',
  504: 'TIMEOUT',
};

/**
 * 获取错误码
 * @param error 错误对象
 * @returns 错误码
 */
function getErrorCode(error: any): string {
  // 优先使用服务器返回的错误码
  if (error?.code) {
    return error.code;
  }

  // 根据 HTTP 状态码映射
  if (error?.response?.status) {
    return HttpStatusToErrorCode[error.response.status] || 'UNKNOWN_ERROR';
  }

  // 根据错误类型判断
  if (error?.message) {
    const msg = error.message.toLowerCase();
    if (msg.includes('timeout') || msg.includes('etimedout')) {
      return 'TIMEOUT';
    }
    if (msg.includes('network') || msg.includes('enetunreach') || msg.includes('econnrefused')) {
      return 'NETWORK_ERROR';
    }
  }

  // 检查是否是网络错误（无响应）
  if (error?.request && !error?.response) {
    return 'NETWORK_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

/**
 * 执行错误操作
 * @param action 操作类型
 * @param retryCallback 重试回调函数
 */
function executeErrorAction(
  action: ErrorAction,
  retryCallback?: () => void
): void {
  switch (action) {
    case 'login':
      // 延迟执行，让用户看到提示
      setTimeout(() => {
        const authStore = useAuthStore();
        authStore.logout();
        window.location.href = '/login';
      }, 1500);
      break;

    case 'contact_admin':
      // 显示联系管理员的对话框
      setTimeout(() => {
        ElMessageBox.confirm(
          '如需访问此资源，请联系系统管理员申请权限',
          '权限不足',
          {
            confirmButtonText: '联系管理员',
            cancelButtonText: '取消',
            type: 'warning',
          }
        ).catch(() => {
          // 用户取消，不做处理
        });
      }, 500);
      break;

    case 'retry':
      // 如果有重试回调，延迟执行
      if (retryCallback) {
        setTimeout(() => {
          retryCallback();
        }, 2000);
      }
      break;

    case 'refresh':
      // 延迟刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      break;

    case 'correct':
    case 'none':
    default:
      // 不需要额外操作
      break;
  }
}

/**
 * 统一的错误处理函数
 * @param error 错误对象
 * @param options 处理选项
 */
export function handleError(
  error: any,
  options?: {
    /** 自定义错误消息 */
    customMessage?: string;
    /** 重试回调函数 */
    onRetry?: () => void;
    /** 是否静默处理（不显示消息） */
    silent?: boolean;
  }
): ErrorInfo {
  const code = getErrorCode(error);
  const errorInfo = ErrorMessages[code] || ErrorMessages['UNKNOWN_ERROR'];

  // 使用自定义消息或默认消息
  const message = options?.customMessage || errorInfo.message;

  // 静默模式不显示消息
  if (!options?.silent) {
    ElMessage.error({
      message,
      duration: errorInfo.duration,
      showClose: errorInfo.showClose,
    });
  }

  // 执行对应的错误操作
  executeErrorAction(errorInfo.action, options?.onRetry);

  return {
    ...errorInfo,
    message,
  };
}

/**
 * 处理 API 错误
 * @param error Axios 错误对象
 * @param options 处理选项
 */
export function handleApiError(
  error: any,
  options?: {
    /** 自定义错误消息 */
    customMessage?: string;
    /** 重试回调函数 */
    onRetry?: () => void;
    /** 是否静默处理 */
    silent?: boolean;
    /** 默认错误码 */
    defaultCode?: string;
  }
): ErrorInfo {
  // 尝试从响应数据中提取错误信息
  const responseData = error?.response?.data;
  const serverCode = responseData?.code;
  const serverMessage = responseData?.message || responseData?.error?.message;

  // 如果有服务器返回的错误码，优先使用
  if (serverCode && ErrorMessages[serverCode]) {
    const errorInfo = ErrorMessages[serverCode];
    const message = serverMessage || errorInfo.message;

    if (!options?.silent) {
      ElMessage.error({
        message,
        duration: errorInfo.duration,
        showClose: errorInfo.showClose,
      });
    }

    executeErrorAction(errorInfo.action, options?.onRetry);

    return {
      ...errorInfo,
      message,
    };
  }

  // 使用默认错误处理
  return handleError(error, options);
}