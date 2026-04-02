/**
 * PCI DSS 合规工具类
 * 用于确保支付数据处理符合 PCI DSS 标准
 */
export declare class PCIDSSUtil {
    /**
     * 屏蔽信用卡号
     * @param cardNumber 信用卡号
     * @returns 屏蔽后的信用卡号
     */
    static maskCardNumber(cardNumber: string): string;
    /**
     * 屏蔽CVV
     * @param cvv CVV码
     * @returns 屏蔽后的CVV
     */
    static maskCVV(cvv: string): string;
    /**
     * 验证信用卡号格式
     * @param cardNumber 信用卡号
     * @returns 是否有效
     */
    static isValidCardNumber(cardNumber: string): boolean;
    /**
     * 检查是否包含敏感支付数据
     * @param data 数据对象
     * @returns 是否包含敏感数据
     */
    static containsSensitiveData(data: any): boolean;
    /**
     * 清理敏感数据
     * @param data 数据对象
     * @returns 清理后的数据
     */
    static sanitizeData(data: any): any;
    /**
     * 生成合规的交易ID
     * @returns 交易ID
     */
    static generateTransactionId(): string;
    /**
     * 检查支付处理是否符合PCI DSS标准
     * @param paymentData 支付数据
     * @returns 合规检查结果
     */
    static checkCompliance(paymentData: any): {
        compliant: boolean;
        issues: string[];
    };
}
//# sourceMappingURL=pci-dss.d.ts.map