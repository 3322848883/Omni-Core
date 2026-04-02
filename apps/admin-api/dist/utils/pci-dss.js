"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PCIDSSUtil = void 0;
/**
 * PCI DSS 合规工具类
 * 用于确保支付数据处理符合 PCI DSS 标准
 */
class PCIDSSUtil {
    /**
     * 屏蔽信用卡号
     * @param cardNumber 信用卡号
     * @returns 屏蔽后的信用卡号
     */
    static maskCardNumber(cardNumber) {
        if (!cardNumber || cardNumber.length < 8) {
            return '**** **** **** ****';
        }
        const firstFour = cardNumber.substring(0, 4);
        const lastFour = cardNumber.substring(cardNumber.length - 4);
        const middleLength = cardNumber.length - 8;
        return `${firstFour} ${'*'.repeat(middleLength)} ${lastFour}`;
    }
    /**
     * 屏蔽CVV
     * @param cvv CVV码
     * @returns 屏蔽后的CVV
     */
    static maskCVV(cvv) {
        return '***';
    }
    /**
     * 验证信用卡号格式
     * @param cardNumber 信用卡号
     * @returns 是否有效
     */
    static isValidCardNumber(cardNumber) {
        // 移除所有非数字字符
        const cleaned = cardNumber.replace(/\D/g, '');
        // 检查长度
        if (cleaned.length < 13 || cleaned.length > 19) {
            return false;
        }
        // Luhn算法验证
        let sum = 0;
        let isEven = false;
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned[i], 10);
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            isEven = !isEven;
        }
        return sum % 10 === 0;
    }
    /**
     * 检查是否包含敏感支付数据
     * @param data 数据对象
     * @returns 是否包含敏感数据
     */
    static containsSensitiveData(data) {
        const sensitiveFields = [
            'card', 'credit', 'cvv', 'expiry', 'password', 'token',
            'cardNumber', 'creditCard', 'securityCode', 'expirationDate'
        ];
        if (typeof data === 'string') {
            return sensitiveFields.some(field => data.toLowerCase().includes(field));
        }
        if (typeof data === 'object' && data !== null) {
            for (const key in data) {
                if (sensitiveFields.includes(key.toLowerCase())) {
                    return true;
                }
                if (typeof data[key] === 'object' && data[key] !== null) {
                    if (this.containsSensitiveData(data[key])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    /**
     * 清理敏感数据
     * @param data 数据对象
     * @returns 清理后的数据
     */
    static sanitizeData(data) {
        if (typeof data === 'string') {
            return data;
        }
        if (typeof data === 'object' && data !== null) {
            const sanitized = Array.isArray(data) ? [] : {};
            for (const key in data) {
                const lowerKey = key.toLowerCase();
                // 屏蔽敏感字段
                if (lowerKey.includes('card') || lowerKey.includes('credit')) {
                    sanitized[key] = '**** **** **** ****';
                }
                else if (lowerKey.includes('cvv') || lowerKey.includes('security')) {
                    sanitized[key] = '***';
                }
                else if (lowerKey.includes('password')) {
                    sanitized[key] = '********';
                }
                else if (typeof data[key] === 'object' && data[key] !== null) {
                    sanitized[key] = this.sanitizeData(data[key]);
                }
                else {
                    sanitized[key] = data[key];
                }
            }
            return sanitized;
        }
        return data;
    }
    /**
     * 生成合规的交易ID
     * @returns 交易ID
     */
    static generateTransactionId() {
        return `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }
    /**
     * 检查支付处理是否符合PCI DSS标准
     * @param paymentData 支付数据
     * @returns 合规检查结果
     */
    static checkCompliance(paymentData) {
        const issues = [];
        // 检查是否包含敏感数据
        if (this.containsSensitiveData(paymentData)) {
            issues.push('Contains sensitive payment data');
        }
        // 检查交易ID
        if (!paymentData.transactionId || typeof paymentData.transactionId !== 'string') {
            issues.push('Missing or invalid transaction ID');
        }
        // 检查金额
        if (!paymentData.amount || typeof paymentData.amount !== 'number' || paymentData.amount <= 0) {
            issues.push('Invalid payment amount');
        }
        return {
            compliant: issues.length === 0,
            issues
        };
    }
}
exports.PCIDSSUtil = PCIDSSUtil;
//# sourceMappingURL=pci-dss.js.map