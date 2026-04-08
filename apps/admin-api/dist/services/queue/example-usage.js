"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueServiceExample = void 0;
const index_1 = require("./index");
const config_1 = require("../../config");
class QueueServiceExample {
    /**
     * 发送简单邮件任务示例
     */
    static async sendSimpleEmail(to, subject, text, html) {
        try {
            if (!index_1.queueService.isReady()) {
                await index_1.queueService.connect();
            }
            const payload = {
                type: 'simple',
                to,
                subject,
                text,
                html,
            };
            return await index_1.queueService.sendToQueue(config_1.config.queues.email, payload);
        }
        catch (error) {
            console.error('Failed to send simple email to queue:', error);
            return false;
        }
    }
    /**
     * 发送个人收款码支付通知邮件任务示例
     */
    static async sendQRPaymentNotification(params) {
        try {
            if (!index_1.queueService.isReady()) {
                await index_1.queueService.connect();
            }
            const payload = {
                type: 'qr_payment',
                to: params.adminEmail,
                subject: '',
                qrPaymentParams: {
                    ...params,
                    paymentTime: params.paymentTime.toISOString(),
                },
            };
            return await index_1.queueService.sendToQueue(config_1.config.queues.email, payload);
        }
        catch (error) {
            console.error('Failed to send QR payment notification to queue:', error);
            return false;
        }
    }
    /**
     * 发送支付成功通知邮件任务示例
     */
    static async sendPaymentSuccessNotification(params) {
        try {
            if (!index_1.queueService.isReady()) {
                await index_1.queueService.connect();
            }
            const payload = {
                type: 'payment_success',
                to: params.adminEmail,
                subject: '',
                paymentSuccessParams: {
                    ...params,
                    paymentTime: params.paymentTime.toISOString(),
                },
            };
            return await index_1.queueService.sendToQueue(config_1.config.queues.email, payload);
        }
        catch (error) {
            console.error('Failed to send payment success notification to queue:', error);
            return false;
        }
    }
    /**
     * 记录用户流量统计任务示例
     */
    static async recordUserTraffic(userId, uploadBytes, downloadBytes, date) {
        try {
            if (!index_1.queueService.isReady()) {
                await index_1.queueService.connect();
            }
            const payload = {
                type: 'user_traffic',
                userId,
                uploadBytes,
                downloadBytes,
                date: date ? date.toISOString().split('T')[0] : undefined,
            };
            return await index_1.queueService.sendToQueue(config_1.config.queues.trafficStats, payload);
        }
        catch (error) {
            console.error('Failed to send user traffic stats to queue:', error);
            return false;
        }
    }
    /**
     * 记录节点流量统计任务示例
     */
    static async recordNodeTraffic(nodeId, uploadBytes, downloadBytes, date) {
        try {
            if (!index_1.queueService.isReady()) {
                await index_1.queueService.connect();
            }
            const payload = {
                type: 'node_traffic',
                nodeId,
                uploadBytes,
                downloadBytes,
                date: date ? date.toISOString().split('T')[0] : undefined,
            };
            return await index_1.queueService.sendToQueue(config_1.config.queues.trafficStats, payload);
        }
        catch (error) {
            console.error('Failed to send node traffic stats to queue:', error);
            return false;
        }
    }
    /**
     * 生成每日流量汇总任务示例
     */
    static async generateDailySummary(date) {
        try {
            if (!index_1.queueService.isReady()) {
                await index_1.queueService.connect();
            }
            const payload = {
                type: 'daily_summary',
                date: date ? date.toISOString().split('T')[0] : undefined,
            };
            return await index_1.queueService.sendToQueue(config_1.config.queues.trafficStats, payload);
        }
        catch (error) {
            console.error('Failed to send daily summary task to queue:', error);
            return false;
        }
    }
}
exports.QueueServiceExample = QueueServiceExample;
//# sourceMappingURL=example-usage.js.map