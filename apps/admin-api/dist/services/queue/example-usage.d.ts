export declare class QueueServiceExample {
    /**
     * 发送简单邮件任务示例
     */
    static sendSimpleEmail(to: string | string[], subject: string, text?: string, html?: string): Promise<boolean>;
    /**
     * 发送个人收款码支付通知邮件任务示例
     */
    static sendQRPaymentNotification(params: {
        adminEmail: string;
        orderNo: string;
        orderId: string;
        userEmail: string;
        userId: string;
        amount: number;
        currency: string;
        paymentMethod: 'alipay' | 'wechat';
        paymentTime: Date;
    }): Promise<boolean>;
    /**
     * 发送支付成功通知邮件任务示例
     */
    static sendPaymentSuccessNotification(params: {
        adminEmail: string;
        orderNo: string;
        orderId: string;
        userEmail: string;
        userId: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        paymentTime: Date;
        requiresManualConfirmation?: boolean;
    }): Promise<boolean>;
    /**
     * 记录用户流量统计任务示例
     */
    static recordUserTraffic(userId: string, uploadBytes: number, downloadBytes: number, date?: Date): Promise<boolean>;
    /**
     * 记录节点流量统计任务示例
     */
    static recordNodeTraffic(nodeId: string, uploadBytes: number, downloadBytes: number, date?: Date): Promise<boolean>;
    /**
     * 生成每日流量汇总任务示例
     */
    static generateDailySummary(date?: Date): Promise<boolean>;
}
//# sourceMappingURL=example-usage.d.ts.map