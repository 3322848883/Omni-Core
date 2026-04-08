"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTaskHandler = exports.EmailTaskHandler = void 0;
const email_1 = require("../email");
const logger_1 = require("../../utils/logger");
class EmailTaskHandler {
    async handle(payload) {
        try {
            logger_1.logger.info('EmailTaskHandler: Processing email task', { type: payload.type, to: payload.to });
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
                    logger_1.logger.warn('EmailTaskHandler: Unknown email task type', { type: payload.type });
            }
        }
        catch (error) {
            logger_1.logger.error('EmailTaskHandler: Failed to process email task', error);
            throw error;
        }
    }
    async handleSimpleEmail(payload) {
        if (!payload.text && !payload.html) {
            throw new Error('Simple email requires either text or html content');
        }
        const success = await email_1.emailService.sendEmail({
            to: payload.to,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
        });
        if (!success) {
            throw new Error('Failed to send simple email');
        }
    }
    async handleQRPaymentNotification(payload) {
        if (!payload.qrPaymentParams) {
            throw new Error('QR payment notification requires qrPaymentParams');
        }
        const params = {
            ...payload.qrPaymentParams,
            paymentTime: new Date(payload.qrPaymentParams.paymentTime),
        };
        const success = await email_1.emailService.sendQRPaymentNotification(params);
        if (!success) {
            throw new Error('Failed to send QR payment notification email');
        }
    }
    async handlePaymentSuccessNotification(payload) {
        if (!payload.paymentSuccessParams) {
            throw new Error('Payment success notification requires paymentSuccessParams');
        }
        const params = {
            ...payload.paymentSuccessParams,
            paymentTime: new Date(payload.paymentSuccessParams.paymentTime),
        };
        const success = await email_1.emailService.sendPaymentSuccessNotification(params);
        if (!success) {
            throw new Error('Failed to send payment success notification email');
        }
    }
}
exports.EmailTaskHandler = EmailTaskHandler;
exports.emailTaskHandler = new EmailTaskHandler();
//# sourceMappingURL=email-handler.js.map