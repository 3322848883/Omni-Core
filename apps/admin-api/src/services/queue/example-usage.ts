import { queueService } from './index';
import { config } from '../../config';

export class QueueServiceExample {
  /**
   * 发送简单邮件任务示例
   */
  static async sendSimpleEmail(
    to: string | string[],
    subject: string,
    text?: string,
    html?: string
  ): Promise<boolean> {
    try {
      if (!queueService.isReady()) {
        await queueService.connect();
      }

      const payload = {
        type: 'simple' as const,
        to,
        subject,
        text,
        html,
      };

      return await queueService.sendToQueue(config.queues.email, payload);
    } catch (error) {
      console.error('Failed to send simple email to queue:', error);
      return false;
    }
  }

  /**
   * 发送个人收款码支付通知邮件任务示例
   */
  static async sendQRPaymentNotification(
    params: {
      adminEmail: string;
      orderNo: string;
      orderId: string;
      userEmail: string;
      userId: string;
      amount: number;
      currency: string;
      paymentMethod: 'alipay' | 'wechat';
      paymentTime: Date;
    }
  ): Promise<boolean> {
    try {
      if (!queueService.isReady()) {
        await queueService.connect();
      }

      const payload = {
        type: 'qr_payment' as const,
        to: params.adminEmail,
        subject: '',
        qrPaymentParams: {
          ...params,
          paymentTime: params.paymentTime.toISOString(),
        },
      };

      return await queueService.sendToQueue(config.queues.email, payload);
    } catch (error) {
      console.error('Failed to send QR payment notification to queue:', error);
      return false;
    }
  }

  /**
   * 发送支付成功通知邮件任务示例
   */
  static async sendPaymentSuccessNotification(
    params: {
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
    }
  ): Promise<boolean> {
    try {
      if (!queueService.isReady()) {
        await queueService.connect();
      }

      const payload = {
        type: 'payment_success' as const,
        to: params.adminEmail,
        subject: '',
        paymentSuccessParams: {
          ...params,
          paymentTime: params.paymentTime.toISOString(),
        },
      };

      return await queueService.sendToQueue(config.queues.email, payload);
    } catch (error) {
      console.error('Failed to send payment success notification to queue:', error);
      return false;
    }
  }

  /**
   * 记录用户流量统计任务示例
   */
  static async recordUserTraffic(
    userId: string,
    uploadBytes: number,
    downloadBytes: number,
    date?: Date
  ): Promise<boolean> {
    try {
      if (!queueService.isReady()) {
        await queueService.connect();
      }

      const payload = {
        type: 'user_traffic' as const,
        userId,
        uploadBytes,
        downloadBytes,
        date: date ? date.toISOString().split('T')[0] : undefined,
      };

      return await queueService.sendToQueue(config.queues.trafficStats, payload);
    } catch (error) {
      console.error('Failed to send user traffic stats to queue:', error);
      return false;
    }
  }

  /**
   * 记录节点流量统计任务示例
   */
  static async recordNodeTraffic(
    nodeId: string,
    uploadBytes: number,
    downloadBytes: number,
    date?: Date
  ): Promise<boolean> {
    try {
      if (!queueService.isReady()) {
        await queueService.connect();
      }

      const payload = {
        type: 'node_traffic' as const,
        nodeId,
        uploadBytes,
        downloadBytes,
        date: date ? date.toISOString().split('T')[0] : undefined,
      };

      return await queueService.sendToQueue(config.queues.trafficStats, payload);
    } catch (error) {
      console.error('Failed to send node traffic stats to queue:', error);
      return false;
    }
  }

  /**
   * 生成每日流量汇总任务示例
   */
  static async generateDailySummary(date?: Date): Promise<boolean> {
    try {
      if (!queueService.isReady()) {
        await queueService.connect();
      }

      const payload = {
        type: 'daily_summary' as const,
        date: date ? date.toISOString().split('T')[0] : undefined,
      };

      return await queueService.sendToQueue(config.queues.trafficStats, payload);
    } catch (error) {
      console.error('Failed to send daily summary task to queue:', error);
      return false;
    }
  }
}
