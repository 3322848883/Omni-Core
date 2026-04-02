"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionUtil = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * 加密工具类
 * 用于加密和解密敏感信息，如支付凭证、API密钥等
 */
class EncryptionUtil {
    static algorithm = 'aes-256-cbc';
    static ivLength = 16;
    static key = process.env.ENCRYPTION_KEY || 'default_encryption_key_change_in_production';
    /**
     * 加密数据
     * @param data 要加密的数据
     * @returns 加密后的字符串
     */
    static encrypt(data) {
        const iv = crypto_1.default.randomBytes(this.ivLength);
        const cipher = crypto_1.default.createCipheriv(this.algorithm, Buffer.from(this.key), iv);
        let encrypted = cipher.update(data);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }
    /**
     * 解密数据
     * @param encryptedData 加密的数据
     * @returns 解密后的字符串
     */
    static decrypt(encryptedData) {
        const textParts = encryptedData.split(':');
        const iv = Buffer.from(textParts.shift() || '', 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto_1.default.createDecipheriv(this.algorithm, Buffer.from(this.key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
    /**
     * 生成安全的随机字符串
     * @param length 字符串长度
     * @returns 随机字符串
     */
    static generateRandomString(length) {
        return crypto_1.default.randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }
    /**
     * 哈希处理敏感信息（用于日志等场景）
     * @param data 敏感数据
     * @returns 哈希后的字符串
     */
    static hash(data) {
        return crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    /**
     * 屏蔽敏感信息（用于日志等场景）
     * @param data 敏感数据
     * @param visibleChars 可见字符数
     * @returns 屏蔽后的字符串
     */
    static mask(data, visibleChars = 4) {
        if (!data)
            return '';
        if (data.length <= visibleChars * 2) {
            return '*'.repeat(data.length);
        }
        const start = data.substring(0, visibleChars);
        const end = data.substring(data.length - visibleChars);
        return start + '*'.repeat(data.length - visibleChars * 2) + end;
    }
}
exports.EncryptionUtil = EncryptionUtil;
//# sourceMappingURL=encryption.js.map