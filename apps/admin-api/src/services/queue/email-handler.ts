import { emailService } from '../email';
import { logger } from '../../utils/logger';

export interface EmailTaskPayload {
  type: 'simple' | 'qr_payment' | 'payment_success';
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  qrPaymentParams?: {
    adminEmail: string;
    orderNo: string;
    orderId: string;
    userEmail: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: 'alipay' | 'wechat';
    paymentTime: string;
  };
  paymentSuccessParams?: {
    adminEmail: string;
    orderNo: string;
    orderId: string;
    userEmail: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentTime: string;
    requiresManualConfirmation?: boolean;
  };
}

export class EmailTaskHandler {
  async handle(payload: EmailTaskPayload): Promise<void> {
    try {
      logger.info('EmailTaskHandler: Processing email task', { type: payload.type, to: payload.to });

      switch (payload.type) {
        case 'simple':
          await this.handleSimpleEmail(payload);
          break;
        case 'qr_payment':
          await this.handleQRPaymentNotification(payload);
          break;
        case 'payment_success':
          await this.handlePaymentSuccessNotification(payload);
          break;
        default:
          logger.warn('EmailTaskHandler: Unknown email task type', { type: payload.type });
      }
    } catch (error) {
      logger.error('EmailTaskHandler: Failed to process email task', error);
      throw error;
    }
  }

  private async handleSimpleEmail(payload: EmailTaskPayload): Promise<void> {
    if (!payload.text && !payload.html) {
      throw new Error('Simple email requires either text or html content');
    }

    const success = await emailService.sendEmail({
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    if (!success) {
      throw new Error('Failed to send simple email');
    }
  }

  private async handleQRPaymentNotification(payload: EmailTaskPayload): Promise<void> {
    if (!payload.qrPaymentParams) {
      throw new Error('QR payment notification requires qrPaymentParams');
    }

    const params = {
      ...payload.qrPaymentParams,
      paymentTime: new Date(payload.qrPaymentParams.paymentTime),
    };

    const success = await emailService.sendQRPaymentNotification(params);
    if (!success) {
      throw new Error('Failed to send QR payment notification email');
    }
  }

  private async handlePaymentSuccessNotification(payload: EmailTaskPayload): Promise<void> {
    if (!payload.paymentSuccessParams) {
      throw new Error('Payment success notification requires paymentSuccessParams');
    }

    const params = {
      ...payload.paymentSuccessParams,
      paymentTime: new Date(payload.paymentSuccessParams.paymentTime),
    };

    const success = await emailService.sendPaymentSuccessNotification(params);
    if (!success) {
      throw new Error('Failed to send payment success notification email');
    }
  }
}

export const emailTaskHandler = new EmailTaskHandler();
