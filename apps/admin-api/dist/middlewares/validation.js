"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidation = exports.NodeValidation = exports.OrderValidation = exports.UserValidation = exports.ValidationRules = void 0;
exports.validate = validate;
const errors_1 = require("../utils/errors");
/**
 * 验证规则定义
 */
exports.ValidationRules = {
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
    // 用户ID验证 (usr_开头)
    userId: {
        pattern: /^usr_[a-zA-Z0-9_]+$/,
        message: '无效的用户ID格式',
    },
    // 订单号验证
    orderNo: {
        pattern: /^ORD\d{8}\d{6}$/,
        message: '无效的订单号格式',
    },
    // 节点代码验证
    nodeCode: {
        pattern: /^[a-z0-9-]+$/,
        min: 3,
        max: 50,
        message: '节点代码只能包含小写字母、数字和连字符，长度3-50位',
    },
    // 用户名验证 - 支持中文、字母、数字和下划线
    username: {
        min: 2,
        max: 30,
        pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/,
        message: '用户名只能包含中文、字母、数字和下划线，长度2-30位',
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
    // 状态值验证
    status: {
        values: ['active', 'inactive', 'pending', 'banned', 'deleted'],
        message: '无效的状态值',
    },
    // 日期格式验证 (YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss)
    date: {
        pattern: /^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}:\d{2})?$/,
        message: '日期格式必须为YYYY-MM-DD或YYYY-MM-DD HH:mm:ss',
    },
    // 协议类型验证
    protocol: {
        values: ['vless', 'vmess', 'trojan', 'shadowsocks'],
        message: '无效的协议类型',
    },
    // 支付方式验证
    paymentMethod: {
        values: ['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant', 'manual'],
        message: '无效的支付方式',
    },
    // 订单状态验证
    orderStatus: {
        values: ['pending', 'completed', 'cancelled', 'refunded'],
        message: '无效的订单状态',
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
    // 金额验证
    amount: {
        min: 0,
        max: 999999.99,
        message: '金额必须在0-999999.99之间',
    },
    // 流量限制验证 (字节)
    trafficLimit: {
        min: 0,
        max: 109951162777600, // 100TB
        message: '流量限制必须在0-100TB之间',
    },
    // 时长天数验证
    durationDays: {
        min: 1,
        max: 3650, // 10年
        message: '时长天数必须在1-3650之间',
    },
};
/**
 * 验证单个值
 */
function validateValue(value, field, rule) {
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
            return `${field} 长度不能少于 ${rule.min} 个字符`;
        }
        if (rule.max !== undefined && value.length > rule.max) {
            return `${field} 长度不能超过 ${rule.max} 个字符`;
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
function validateData(data, schema, location) {
    const errors = [];
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
function validate(schema) {
    return (req, res, next) => {
        const errors = [];
        // 验证 body
        if (schema.body) {
            const bodyErrors = validateData(req.body, schema.body, 'body');
            errors.push(...bodyErrors);
        }
        // 验证 query
        if (schema.query) {
            const queryErrors = validateData(req.query, schema.query, 'query');
            errors.push(...queryErrors);
        }
        // 验证 params
        if (schema.params) {
            const paramsErrors = validateData(req.params, schema.params, 'params');
            errors.push(...paramsErrors);
        }
        // 如果有错误，抛出 ValidationError
        if (errors.length > 0) {
            const message = errors.map(e => `${e.field}: ${e.message}`).join(', ');
            next(new errors_1.ValidationError(message, errors));
            return;
        }
        next();
    };
}
/**
 * 预定义的验证模式 - 用户相关
 */
exports.UserValidation = {
    // 创建用户
    create: {
        body: {
            email: {
                required: true,
                type: 'string',
                pattern: exports.ValidationRules.email.pattern,
                message: exports.ValidationRules.email.message,
            },
            username: {
                required: true,
                type: 'string',
                min: exports.ValidationRules.username.min,
                max: exports.ValidationRules.username.max,
                pattern: exports.ValidationRules.username.pattern,
                message: exports.ValidationRules.username.message,
            },
            password: {
                type: 'string',
                min: exports.ValidationRules.password.min,
                max: exports.ValidationRules.password.max,
                pattern: exports.ValidationRules.password.pattern,
                message: exports.ValidationRules.password.message,
            },
            trafficLimit: {
                type: 'number',
                min: exports.ValidationRules.trafficLimit.min,
                max: exports.ValidationRules.trafficLimit.max,
            },
            expireDate: {
                type: 'string',
                pattern: exports.ValidationRules.date.pattern,
                message: exports.ValidationRules.date.message,
            },
        },
    },
    // 更新用户
    update: {
        body: {
            username: {
                type: 'string',
                min: exports.ValidationRules.username.min,
                max: exports.ValidationRules.username.max,
                pattern: exports.ValidationRules.username.pattern,
                message: exports.ValidationRules.username.message,
            },
            trafficLimit: {
                type: 'number',
                min: exports.ValidationRules.trafficLimit.min,
                max: exports.ValidationRules.trafficLimit.max,
            },
            expireDate: {
                type: 'string',
                pattern: exports.ValidationRules.date.pattern,
                message: exports.ValidationRules.date.message,
            },
            status: {
                type: 'number',
                min: 0,
                max: 3,
            },
        },
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
    },
    // 用户列表查询
    list: {
        query: {
            page: {
                type: 'string',
                validator: (value) => {
                    const page = parseInt(value, 10);
                    if (isNaN(page) || page < exports.ValidationRules.page.min) {
                        return exports.ValidationRules.page.message;
                    }
                    return null;
                },
            },
            limit: {
                type: 'string',
                validator: (value) => {
                    const limit = parseInt(value, 10);
                    if (isNaN(limit) || limit < exports.ValidationRules.pageSize.min || limit > exports.ValidationRules.pageSize.max) {
                        return exports.ValidationRules.pageSize.message;
                    }
                    return null;
                },
            },
            status: {
                type: 'string',
            },
            search: {
                type: 'string',
                max: 100,
            },
        },
    },
    // 用户ID参数
    byId: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
    },
    // 封禁用户
    ban: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        body: {
            reason: {
                type: 'string',
                max: 500,
            },
        },
    },
    // 流量统计查询
    traffic: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        query: {
            days: {
                type: 'string',
                validator: (value) => {
                    const days = parseInt(value, 10);
                    if (isNaN(days) || days < 1 || days > 365) {
                        return '天数必须在1-365之间';
                    }
                    return null;
                },
            },
        },
    },
};
/**
 * 预定义的验证模式 - 订单相关
 */
exports.OrderValidation = {
    // 创建订单
    create: {
        body: {
            userId: {
                required: true,
                type: 'string',
            },
            orderType: {
                required: true,
                type: 'string',
                min: 1,
                max: 50,
            },
            amount: {
                required: true,
                type: 'number',
                min: exports.ValidationRules.amount.min,
                max: exports.ValidationRules.amount.max,
            },
            trafficLimit: {
                type: 'number',
                min: exports.ValidationRules.trafficLimit.min,
                max: exports.ValidationRules.trafficLimit.max,
            },
            durationDays: {
                type: 'number',
                min: exports.ValidationRules.durationDays.min,
                max: exports.ValidationRules.durationDays.max,
            },
        },
    },
    // 更新订单
    update: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        body: {
            amount: {
                type: 'number',
                min: exports.ValidationRules.amount.min,
                max: exports.ValidationRules.amount.max,
            },
            trafficLimit: {
                type: 'number',
                min: exports.ValidationRules.trafficLimit.min,
                max: exports.ValidationRules.trafficLimit.max,
            },
            durationDays: {
                type: 'number',
                min: exports.ValidationRules.durationDays.min,
                max: exports.ValidationRules.durationDays.max,
            },
            startDate: {
                type: 'string',
                pattern: exports.ValidationRules.date.pattern,
                message: exports.ValidationRules.date.message,
            },
            endDate: {
                type: 'string',
                pattern: exports.ValidationRules.date.pattern,
                message: exports.ValidationRules.date.message,
            },
        },
    },
    // 订单列表查询
    list: {
        query: {
            page: {
                type: 'string',
                validator: (value) => {
                    const page = parseInt(value, 10);
                    if (isNaN(page) || page < exports.ValidationRules.page.min) {
                        return exports.ValidationRules.page.message;
                    }
                    return null;
                },
            },
            limit: {
                type: 'string',
                validator: (value) => {
                    const limit = parseInt(value, 10);
                    if (isNaN(limit) || limit < exports.ValidationRules.pageSize.min || limit > exports.ValidationRules.pageSize.max) {
                        return exports.ValidationRules.pageSize.message;
                    }
                    return null;
                },
            },
            status: {
                type: 'string',
                values: exports.ValidationRules.orderStatus.values,
                message: exports.ValidationRules.orderStatus.message,
            },
            userId: {
                type: 'string',
            },
            startDate: {
                type: 'string',
                pattern: exports.ValidationRules.date.pattern,
                message: exports.ValidationRules.date.message,
            },
            endDate: {
                type: 'string',
                pattern: exports.ValidationRules.date.pattern,
                message: exports.ValidationRules.date.message,
            },
        },
    },
    // 订单ID参数
    byId: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
    },
    // 支付订单
    pay: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        body: {
            paymentMethod: {
                type: 'string',
                values: exports.ValidationRules.paymentMethod.values,
                message: exports.ValidationRules.paymentMethod.message,
            },
        },
    },
    // 取消订单
    cancel: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        body: {
            reason: {
                type: 'string',
                max: 500,
            },
        },
    },
    // 退款订单
    refund: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        body: {
            reason: {
                type: 'string',
                max: 500,
            },
        },
    },
    // 创建支付
    createPayment: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        body: {
            provider: {
                required: true,
                type: 'string',
                values: ['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant'],
                message: '无效的支付提供商',
            },
            returnUrl: {
                type: 'string',
                max: 500,
            },
            cancelUrl: {
                type: 'string',
                max: 500,
            },
        },
    },
    // 支付退款
    paymentRefund: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        body: {
            amount: {
                type: 'number',
                min: 0.01,
                message: '退款金额必须大于0',
            },
            reason: {
                type: 'string',
                max: 500,
            },
        },
    },
};
/**
 * 预定义的验证模式 - 节点相关
 */
exports.NodeValidation = {
    // 创建节点
    create: {
        body: {
            code: {
                required: true,
                type: 'string',
                min: exports.ValidationRules.nodeCode.min,
                max: exports.ValidationRules.nodeCode.max,
                pattern: exports.ValidationRules.nodeCode.pattern,
                message: exports.ValidationRules.nodeCode.message,
            },
            name: {
                required: true,
                type: 'string',
                min: 1,
                max: 100,
            },
            region: {
                type: 'string',
                max: 50,
            },
            country: {
                type: 'string',
                max: 50,
            },
            city: {
                type: 'string',
                max: 50,
            },
            latitude: {
                type: 'number',
                min: -90,
                max: 90,
            },
            longitude: {
                type: 'number',
                min: -180,
                max: 180,
            },
            host: {
                required: true,
                type: 'string',
                min: 1,
                max: 255,
            },
            port: {
                required: true,
                type: 'number',
                min: 1,
                max: 65535,
                message: '端口号必须在1-65535之间',
            },
            protocol: {
                required: true,
                type: 'string',
                values: exports.ValidationRules.protocol.values,
                message: exports.ValidationRules.protocol.message,
            },
            maxConnections: {
                type: 'number',
                min: 1,
                max: 100000,
            },
            priority: {
                type: 'number',
                min: 0,
                max: 100,
            },
            isBackup: {
                type: 'boolean',
            },
            serviceType: {
                type: 'string',
            },
            serviceGroup: {
                type: 'string',
                max: 50,
            },
            isPremium: {
                type: 'boolean',
            },
            bandwidthLimit: {
                type: 'number',
                min: 0,
            },
            qosLevel: {
                type: 'number',
                min: 1,
                max: 5,
            },
            maxUsers: {
                type: 'number',
                min: 1,
                max: 100000,
            },
            ipType: {
                type: 'string',
            },
            lineType: {
                type: 'string',
            },
            ispName: {
                type: 'string',
                max: 100,
            },
            supportsIPv6: {
                type: 'boolean',
            },
        },
    },
    // 更新节点
    update: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        body: {
            name: {
                type: 'string',
                min: 1,
                max: 100,
            },
            region: {
                type: 'string',
                max: 50,
            },
            country: {
                type: 'string',
                max: 50,
            },
            city: {
                type: 'string',
                max: 50,
            },
            latitude: {
                type: 'number',
                min: -90,
                max: 90,
            },
            longitude: {
                type: 'number',
                min: -180,
                max: 180,
            },
            host: {
                type: 'string',
                min: 1,
                max: 255,
            },
            port: {
                type: 'number',
                min: 1,
                max: 65535,
                message: '端口号必须在1-65535之间',
            },
            protocol: {
                type: 'string',
                values: exports.ValidationRules.protocol.values,
                message: exports.ValidationRules.protocol.message,
            },
            maxConnections: {
                type: 'number',
                min: 1,
                max: 100000,
            },
            priority: {
                type: 'number',
                min: 0,
                max: 100,
            },
            isBackup: {
                type: 'boolean',
            },
            serviceType: {
                type: 'string',
            },
            serviceGroup: {
                type: 'string',
                max: 50,
            },
            isPremium: {
                type: 'boolean',
            },
            bandwidthLimit: {
                type: 'number',
                min: 0,
            },
            qosLevel: {
                type: 'number',
                min: 1,
                max: 5,
            },
            maxUsers: {
                type: 'number',
                min: 1,
                max: 100000,
            },
            ipType: {
                type: 'string',
            },
            lineType: {
                type: 'string',
            },
            ispName: {
                type: 'string',
                max: 100,
            },
            supportsIPv6: {
                type: 'boolean',
            },
            ipRotationEnabled: {
                type: 'boolean',
            },
            ipRotationInterval: {
                type: 'number',
                min: 60,
                max: 86400 * 7,
                message: 'IP轮换间隔必须在60秒到7天之间',
            },
        },
    },
    // 节点列表查询
    list: {
        query: {
            page: {
                type: 'string',
                validator: (value) => {
                    const page = parseInt(value, 10);
                    if (isNaN(page) || page < exports.ValidationRules.page.min) {
                        return exports.ValidationRules.page.message;
                    }
                    return null;
                },
            },
            limit: {
                type: 'string',
                validator: (value) => {
                    const limit = parseInt(value, 10);
                    if (isNaN(limit) || limit < exports.ValidationRules.pageSize.min || limit > exports.ValidationRules.pageSize.max) {
                        return exports.ValidationRules.pageSize.message;
                    }
                    return null;
                },
            },
            status: {
                type: 'string',
                values: ['online', 'offline', 'maintenance'],
                message: '无效的节点状态',
            },
            region: {
                type: 'string',
                max: 50,
            },
            protocol: {
                type: 'string',
                values: exports.ValidationRules.protocol.values,
                message: exports.ValidationRules.protocol.message,
            },
            serviceType: {
                type: 'string',
            },
            serviceGroup: {
                type: 'string',
                max: 50,
            },
            isPremium: {
                type: 'string',
                validator: (value) => {
                    if (value !== 'true' && value !== 'false' && value !== '0' && value !== '1') {
                        return 'isPremium 必须是布尔值';
                    }
                    return null;
                },
            },
            minQosLevel: {
                type: 'string',
                validator: (value) => {
                    const level = parseInt(value, 10);
                    if (isNaN(level) || level < 1 || level > 5) {
                        return 'QoS等级必须在1-5之间';
                    }
                    return null;
                },
            },
            ipType: {
                type: 'string',
            },
            lineType: {
                type: 'string',
            },
            ispName: {
                type: 'string',
                max: 100,
            },
            minIpScore: {
                type: 'string',
                validator: (value) => {
                    const score = parseInt(value, 10);
                    if (isNaN(score) || score < 0 || score > 100) {
                        return 'IP评分必须在0-100之间';
                    }
                    return null;
                },
            },
            supportsIPv6: {
                type: 'string',
                validator: (value) => {
                    if (value !== 'true' && value !== 'false' && value !== '0' && value !== '1') {
                        return 'supportsIPv6 必须是布尔值';
                    }
                    return null;
                },
            },
        },
    },
    // 节点ID参数
    byId: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
    },
    // 检查IP
    checkIp: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        body: {
            ip: {
                type: 'string',
                max: 45,
                message: '无效的IP地址格式',
            },
        },
    },
    // 更新节点配置
    updateConfig: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        body: {
            config: {
                required: true,
                type: 'object',
            },
        },
    },
};
/**
 * 预定义的验证模式 - 认证相关
 */
exports.AuthValidation = {
    // 登录
    login: {
        body: {
            username: {
                required: true,
                type: 'string',
                min: 1,
                max: 50,
            },
            password: {
                required: true,
                type: 'string',
                min: 1,
                max: 128,
            },
            mfaCode: {
                type: 'string',
                pattern: /^\d{6}$/,
                message: 'MFA验证码必须是6位数字',
            },
        },
    },
    // 刷新令牌
    refresh: {
        body: {
            refreshToken: {
                required: true,
                type: 'string',
                min: 10,
            },
        },
    },
};
//# sourceMappingURL=validation.js.map