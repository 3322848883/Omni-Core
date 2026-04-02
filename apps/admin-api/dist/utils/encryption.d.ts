/**
 * 加密工具类
 * 用于加密和解密敏感信息，如支付凭证、API密钥等
 */
export declare class EncryptionUtil {
    private static readonly algorithm;
    private static readonly ivLength;
    private static readonly key;
    /**
     * 加密数据
     * @param data 要加密的数据
     * @returns 加密后的字符串
     */
    static encrypt(data: string): string;
    /**
     * 解密数据
     * @param encryptedData 加密的数据
     * @returns 解密后的字符串
     */
    static decrypt(encryptedData: string): string;
    /**
     * 生成安全的随机字符串
     * @param length 字符串长度
     * @returns 随机字符串
     */
    static generateRandomString(length: number): string;
    /**
     * 哈希处理敏感信息（用于日志等场景）
     * @param data 敏感数据
     * @returns 哈希后的字符串
     */
    static hash(data: string): string;
    /**
     * 屏蔽敏感信息（用于日志等场景）
     * @param data 敏感数据
     * @param visibleChars 可见字符数
     * @returns 屏蔽后的字符串
     */
    static mask(data: string, visibleChars?: number): string;
}
//# sourceMappingURL=encryption.d.ts.map