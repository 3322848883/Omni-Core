import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/AppError';

/**
 * 验证规则定义
 */
export const ValidationRules = {
  // 邮箱验证
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: '请输入有效的邮箱地址',
  },

  // 密码验证：8-32位，包含大小写字母和数字
  password: {
    min: 8,
    max: 32,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: '密码需包含大小写字母和数字，长度8-32位',
  },

  // UUID 验证
  uuid: {
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    message: '无效的UUID格式',
  },

  // 用户名验证
  username: {
    min: 3,
    max: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: '用户名只能包含字母、数字和下划线，长度3-20位',
  },

  // 分页参数 - 页码
  page: {
    min: 1,
    default: 1,
    message: '页码必须大于0',
  },

  // 分页参数 - 每页数量
  pageSize: {
    min: 1,
    max: 100,
    default: 20,
    message: '每页数量必须在1-100之间',
  },

  // 日期格式验证 (YYYY-MM-DD)
  date: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: '日期格式必须为YYYY-MM-DD',
  },

  // 订单状态验证
  orderStatus: {
    values: ['pending', 'completed', 'cancelled', 'refunded'],
    message: '无效的订单状态',
  },

  // 支付方式验证
  paymentMethod: {
    values: ['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant', 'crypto'],
    message: '无效的支付方式',
  },

  // 加密货币验证
  cryptoCurrency: {
    values: ['BTC', 'ETH', 'USDT', 'BCH', 'LTC'],
    message: '无效的加密货币类型',
  },

  // 正整数验证
  positiveInt: {
    min: 1,
    message: '必须为正整数',
  },

  // 非负整数验证
  nonNegativeInt: {
    min: 0,
    message: '必须为非负整数',
  },

  // 节点ID验证
  nodeId: {
    pattern: /^[a-zA-Z0-9_-]+$/,
    min: 1,
    max: 100,
    message: '无效的节点ID格式',
  },

  // 令牌验证
  token: {
    min: 10,
    max: 2048,
    message: '无效的令牌格式',
  },
};

/**
 * 验证函数类型
 */
type ValidatorFunction = (value: unknown, field: string) => string | null;

/**
 * 字段验证规则
 */
interface FieldValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  min?: number;
  max?: number;
  pattern?: RegExp;
  values?: string[];
  validator?: ValidatorFunction;
  message?: string;
  transform?: (value: unknown) => unknown;
}

/**
 * 验证模式
 */
export interface ValidationSchema {
  body?: Record<string, FieldValidationRule>;
  query?: Record<string, FieldValidationRule>;
  params?: Record<string, FieldValidationRule>;
}

/**
 * 验证单个值
 */
function validateValue(
  value: unknown,
  field: string,
  rule: FieldValidationRule
): string | null {
  // 必填验证
  if (rule.required && (value === undefined || value === null || value === '')) {
    return rule.message || `${field} 是必填项`;
  }

  // 如果值为空且不是必填项，跳过其他验证
  if (value === undefined || value === null || value === '') {
    return null;
  }

  // 类型验证
  if (rule.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rule.type) {
      return `${field} 必须是 ${rule.type} 类型`;
    }
  }

  // 字符串长度验证
  if (typeof value === 'string') {
    if (rule.min !== undefined && value.length < rule.min) {
      return rule.message || `${field} 长度不能少于 ${rule.min} 个字符`;
    }
    if (rule.max !== undefined && value.length > rule.max) {
      return rule.message || `${field} 长度不能超过 ${rule.max} 个字符`;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message || `${field} 格式不正确`;
    }
  }

  // 数值范围验证
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return `${field} 不能小于 ${rule.min}`;
    }
    if (rule.max !== undefined && value > rule.max) {
      return `${field} 不能大于 ${rule.max}`;
    }
  }

  // 枚举值验证
  if (rule.values && typeof value === 'string' && !rule.values.includes(value)) {
    return `${field} 必须是以下值之一: ${rule.values.join(', ')}`;
  }

  // 自定义验证器
  if (rule.validator) {
    return rule.validator(value, field);
  }

  return null;
}

/**
 * 验证请求数据
 */
function validateData(
  data: Record<string, unknown>,
  schema: Record<string, FieldValidationRule>,
  location: string
): Array<{ field: string; message: string }> {
  const errors: Array<{ field: string; message: string }> = [];

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    const error = validateValue(value, field, rule);

    if (error) {
      errors.push({ field, message: error });
    }
  }

  return errors;
}

/**
 * 创建验证中间件
 */
export function validate(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ field: string; message: string }> = [];

    // 验证 body
    if (schema.body) {
      const bodyErrors = validateData(req.body, schema.body, 'body');
      errors.push(...bodyErrors);
    }

    // 验证 query
    if (schema.query) {
      const queryErrors = validateData(req.query as Record<string, unknown>, schema.query, 'query');
      errors.push(...queryErrors);
    }

    // 验证 params
    if (schema.params) {
      const paramsErrors = validateData(req.params, schema.params, 'params');
      errors.push(...paramsErrors);
    }

    // 如果有错误，抛出 ValidationError
    if (errors.length > 0) {
      next(new ValidationError(errors));
      return;
    }

    next();
  };
}

/**
 * 预定义的验证模式 - 认证相关
 */
export const AuthValidation = {
  // 注册
  register: {
    body: {
      email: {
        required: true,
        type: 'string',
        pattern: ValidationRules.email.pattern,
        message: ValidationRules.email.message,
      },
      username: {
        required: true,
        type: 'string',
        min: ValidationRules.username.min,
        max: ValidationRules.username.max,
        pattern: ValidationRules.username.pattern,
        message: ValidationRules.username.message,
      },
      password: {
        required: true,
        type: 'string',
        min: ValidationRules.password.min,
        max: ValidationRules.password.max,
        pattern: ValidationRules.password.pattern,
        message: ValidationRules.password.message,
      },
      confirmPassword: {
        required: true,
        type: 'string',
      },
      agreeTerms: {
        required: true,
        type: 'boolean',
        validator: (value) => {
          if (value !== true) {
            return '必须同意服务条款';
          }
          return null;
        },
      },
      inviteCode: {
        type: 'string',
        max: 50,
      },
    },
  } as ValidationSchema,

  // 登录
  login: {
    body: {
      email: {
        required: true,
        type: 'string',
        pattern: ValidationRules.email.pattern,
        message: ValidationRules.email.message,
      },
      password: {
        required: true,
        type: 'string',
        min: 1,
        max: 128,
      },
    },
  } as ValidationSchema,

  // 刷新令牌
  refresh: {
    body: {
      refreshToken: {
        required: true,
        type: 'string',
        min: ValidationRules.token.min,
        max: ValidationRules.token.max,
      },
    },
  } as ValidationSchema,

  // 忘记密码
  forgotPassword: {
    body: {
      email: {
        required: true,
        type: 'string',
        pattern: ValidationRules.email.pattern,
        message: ValidationRules.email.message,
      },
    },
  } as ValidationSchema,

  // 重置密码
  resetPassword: {
    body: {
      token: {
        required: true,
        type: 'string',
        min: 10,
      },
      newPassword: {
        required: true,
        type: 'string',
        min: ValidationRules.password.min,
        max: ValidationRules.password.max,
        pattern: ValidationRules.password.pattern,
        message: ValidationRules.password.message,
      },
    },
  } as ValidationSchema,

  // 更新密码
  updatePassword: {
    body: {
      oldPassword: {
        required: true,
        type: 'string',
        min: 1,
        max: 128,
      },
      newPassword: {
        required: true,
        type: 'string',
        min: ValidationRules.password.min,
        max: ValidationRules.password.max,
        pattern: ValidationRules.password.pattern,
        message: ValidationRules.password.message,
      },
    },
  } as ValidationSchema,
};

/**
 * 预定义的验证模式 - 用户相关
 */
export const UserValidation = {
  // 更新用户信息
  update: {
    body: {
      email: {
        type: 'string',
        pattern: ValidationRules.email.pattern,
        message: ValidationRules.email.message,
      },
      username: {
        type: 'string',
        min: ValidationRules.username.min,
        max: ValidationRules.username.max,
        pattern: ValidationRules.username.pattern,
        message: ValidationRules.username.message,
      },
      avatar: {
        type: 'string',
        max: 2048,
      },
    },
  } as ValidationSchema,

  // 修改密码
  changePassword: {
    body: {
      oldPassword: {
        required: true,
        type: 'string',
        min: 1,
        max: 128,
      },
      newPassword: {
        required: true,
        type: 'string',
        min: ValidationRules.password.min,
        max: ValidationRules.password.max,
        pattern: ValidationRules.password.pattern,
        message: ValidationRules.password.message,
      },
    },
  } as ValidationSchema,

  // 上传头像
  uploadAvatar: {
    body: {
      file: {
        required: true,
        type: 'string',
      },
    },
  } as ValidationSchema,
};

/**
 * 预定义的验证模式 - 订单相关
 */
export const OrderValidation = {
  // 创建订单
  create: {
    body: {
      planId: {
        required: true,
        type: 'string',
        min: 1,
        max: 100,
      },
      paymentMethod: {
        type: 'string',
        values: ValidationRules.paymentMethod.values,
        message: ValidationRules.paymentMethod.message,
      },
    },
  } as ValidationSchema,

  // 订单列表查询
  list: {
    query: {
      page: {
        type: 'string',
        validator: (value) => {
          const page = parseInt(value as string, 10);
          if (isNaN(page) || page < ValidationRules.page.min) {
            return ValidationRules.page.message;
          }
          return null;
        },
      },
      limit: {
        type: 'string',
        validator: (value) => {
          const limit = parseInt(value as string, 10);
          if (isNaN(limit) || limit < ValidationRules.pageSize.min || limit > ValidationRules.pageSize.max) {
            return ValidationRules.pageSize.message;
          }
          return null;
        },
      },
      status: {
        type: 'string',
        values: ValidationRules.orderStatus.values,
        message: ValidationRules.orderStatus.message,
      },
    },
  } as ValidationSchema,

  // 订单ID参数
  byId: {
    params: {
      id: {
        required: true,
        type: 'string',
        min: 1,
        max: 100,
      },
    },
  } as ValidationSchema,
};

/**
 * 预定义的验证模式 - 节点相关
 */
export const NodeValidation = {
  // 节点列表查询
  list: {
    query: {
      region: {
        type: 'string',
        max: 50,
      },
      ipType: {
        type: 'string',
        max: 50,
      },
      lineType: {
        type: 'string',
        max: 50,
      },
      ispName: {
        type: 'string',
        max: 100,
      },
    },
  } as ValidationSchema,

  // 节点ID参数
  byId: {
    params: {
      id: {
        required: true,
        type: 'string',
        min: ValidationRules.nodeId.min,
        max: ValidationRules.nodeId.max,
        pattern: ValidationRules.nodeId.pattern,
        message: ValidationRules.nodeId.message,
      },
    },
  } as ValidationSchema,
};

/**
 * 预定义的验证模式 - 邀请相关
 */
export const InviteValidation = {
  // 验证邀请码
  validate: {
    body: {
      code: {
        required: true,
        type: 'string',
        min: 1,
        max: 50,
      },
    },
  } as ValidationSchema,

  // 创建邀请码
  create: {
    body: {
      count: {
        type: 'number',
        min: 1,
        max: 100,
      },
      expireDays: {
        type: 'number',
        min: 1,
        max: 365,
      },
    },
  } as ValidationSchema,
};

/**
 * 预定义的验证模式 - 加密货币相关
 */
export const CryptoValidation = {
  // 创建加密货币钱包
  createWallet: {
    body: {
      orderId: {
        required: true,
        type: 'string',
        min: 1,
        max: 100,
      },
      currency: {
        required: true,
        type: 'string',
        values: ValidationRules.cryptoCurrency.values,
        message: ValidationRules.cryptoCurrency.message,
      },
    },
  } as ValidationSchema,

  // 模拟交易
  simulateTransaction: {
    body: {
      walletId: {
        required: true,
        type: 'string',
        min: 1,
        max: 100,
      },
      amount: {
        type: 'number',
        min: 0,
      },
    },
  } as ValidationSchema,

  // 钱包ID参数
  walletId: {
    params: {
      walletId: {
        required: true,
        type: 'string',
        min: 1,
        max: 100,
      },
    },
  } as ValidationSchema,

  // 支付ID参数
  paymentId: {
    params: {
      paymentId: {
        required: true,
        type: 'string',
        min: 1,
        max: 100,
      },
    },
  } as ValidationSchema,
};
