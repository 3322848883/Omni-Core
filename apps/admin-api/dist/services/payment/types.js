"use strict";
// Payment Service Types
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDER_STATUS_TRANSITIONS = exports.PaymentError = void 0;
exports.isValidPaymentProvider = isValidPaymentProvider;
exports.isValidPaymentStatus = isValidPaymentStatus;
exports.isValidWebhookEvent = isValidWebhookEvent;
exports.validateAmount = validateAmount;
exports.validateCurrency = validateCurrency;
exports.validateString = validateString;
exports.getNestedValue = getNestedValue;
exports.canTransitionOrderStatus = canTransitionOrderStatus;
/**
 * 支付错误类
 */
class PaymentError extends Error {
    code;
    provider;
    constructor(message, code, provider) {
        super(message);
        this.code = code;
        this.provider = provider;
        this.name = 'PaymentError';
    }
}
exports.PaymentError = PaymentError;
/**
 * 验证支付提供商字符串
 */
function isValidPaymentProvider(provider) {
    const validProviders = ['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant'];
    return validProviders.includes(provider);
}
/**
 * 验证支付状态字符串
 */
function isValidPaymentStatus(status) {
    const validStatuses = ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded'];
    return validStatuses.includes(status);
}
/**
 * 类型守卫：验证对象是否为有效的 PaymentWebhookEvent
 */
function isValidWebhookEvent(event) {
    if (typeof event !== 'object' || event === null) {
        return false;
    }
    const e = event;
    return (typeof e.id === 'string' &&
        typeof e.type === 'string' &&
        typeof e.provider === 'string' &&
        isValidPaymentProvider(e.provider) &&
        typeof e.rawBody === 'string');
}
/**
 * 验证并解析金额
 * @param value - 要验证的值
 * @param fieldName - 字段名称（用于错误消息）
 * @returns 解析后的金额
 */
function validateAmount(value, fieldName = 'amount') {
    let amount;
    if (typeof value === 'string') {
        amount = parseFloat(value);
    }
    else if (typeof value === 'number') {
        amount = value;
    }
    else {
        throw new PaymentError(`${fieldName} must be a number or numeric string`, 'INVALID_AMOUNT');
    }
    if (isNaN(amount) || amount < 0) {
        throw new PaymentError(`${fieldName} must be a valid non-negative number`, 'INVALID_AMOUNT');
    }
    return amount;
}
/**
 * 验证并解析货币代码
 * @param value - 要验证的值
 * @returns 标准化后的货币代码
 */
function validateCurrency(value) {
    if (typeof value !== 'string') {
        throw new PaymentError('Currency must be a string', 'INVALID_CURRENCY');
    }
    const currency = value.toUpperCase().trim();
    // 基本货币代码验证（3个大写字母）
    if (!/^[A-Z]{3}$/.test(currency)) {
        throw new PaymentError(`Invalid currency code: ${value}. Expected 3-letter ISO code.`, 'INVALID_CURRENCY');
    }
    return currency;
}
/**
 * 验证字符串字段
 * @param value - 要验证的值
 * @param fieldName - 字段名称
 * @param options - 验证选项
 */
function validateString(value, fieldName, options = {}) {
    const { required = true, minLength, maxLength } = options;
    if (value === undefined || value === null) {
        if (required) {
            throw new PaymentError(`${fieldName} is required`, 'MISSING_FIELD');
        }
        return undefined;
    }
    if (typeof value !== 'string') {
        throw new PaymentError(`${fieldName} must be a string`, 'INVALID_TYPE');
    }
    const str = value.trim();
    if (minLength !== undefined && str.length < minLength) {
        throw new PaymentError(`${fieldName} must be at least ${minLength} characters`, 'INVALID_LENGTH');
    }
    if (maxLength !== undefined && str.length > maxLength) {
        throw new PaymentError(`${fieldName} must be at most ${maxLength} characters`, 'INVALID_LENGTH');
    }
    return str;
}
/**
 * 安全地访问嵌套对象属性
 * @param obj - 对象
 * @param path - 属性路径（如 'data.amount.value'）
 * @returns 属性值或 undefined
 */
function getNestedValue(obj, path) {
    if (typeof obj !== 'object' || obj === null) {
        return undefined;
    }
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (typeof current !== 'object' || current === null) {
            return undefined;
        }
        current = current[key];
    }
    return current;
}
// Payment state machine definition
exports.ORDER_STATUS_TRANSITIONS = [
    { from: null, to: 'pending', allowed: true },
    { from: 'pending', to: 'paid', allowed: true },
    { from: 'pending', to: 'cancelled', allowed: true },
    { from: 'pending', to: 'expired', allowed: true },
    { from: 'paid', to: 'completed', allowed: true },
    { from: 'paid', to: 'refunded', allowed: true },
    { from: 'completed', to: 'refunded', allowed: true },
];
function canTransitionOrderStatus(fromStatus, toStatus) {
    const transition = exports.ORDER_STATUS_TRANSITIONS.find((t) => t.from === fromStatus && t.to === toStatus);
    return transition?.allowed ?? false;
}
//# sourceMappingURL=types.js.map