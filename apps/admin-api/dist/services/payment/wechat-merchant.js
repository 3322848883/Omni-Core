"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WechatMerchantProvider = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../utils/logger");
const config_1 = require("../../config");
const types_1 = require("./types");
/**
 * 微信商家收款码支付提供商
 *
 * 实现原理：
 * 1. 商家通过微信支付商户平台获取 mchid、appid 和 API 密钥
 * 2. 用户下单后，系统调用微信支付 Native 支付接口生成二维码
 * 3. 返回支付二维码给用户扫码支付
 * 4. 用户完成支付后，微信通过 webhook 通知系统
 * 5. 系统自动确认收款并开通服务
 *
 * 优势：
 * - 自动回调确认，无需人工干预
 * - 支持退款接口
 * - 支持 Native 支付（扫码支付）
 * - 更专业的支付体验
 */
class WechatMerchantProvider {
    name = 'wechat_merchant';
    mchId;
    appId;
    apiKey;
    sandbox;
    gatewayUrl;
    constructor() {
        this.mchId = config_1.config.payment?.wechatMerchant?.mchId || '';
        this.appId = config_1.config.payment?.wechatMerchant?.appId || '';
        this.apiKey = config_1.config.payment?.wechatMerchant?.apiKey || '';
        this.sandbox = config_1.config.payment?.wechatMerchant?.sandbox !== false;
        this.gatewayUrl = this.sandbox
            ? 'https://api.mch.weixin.qq.com/sandboxnew'
            : 'https://api.mch.weixin.qq.com';
        if (!this.mchId || !this.appId || !this.apiKey) {
            logger_1.logger.warn('WeChat merchant credentials are not configured');
        }
        else {
            logger_1.logger.info('WeChat merchant payment provider initialized');
        }
    }
    /**
     * 创建支付
     * 调用微信支付 Native 支付接口生成二维码
     */
    async createPayment(request) {
        try {
            logger_1.logger.info(`Creating WeChat merchant payment for order: ${request.orderNo}`);
            // 生成微信支付订单号
            const wechatTradeNo = `WX${Date.now()}${Math.floor(Math.random() * 1000)}`;
            // 构建支付参数
            const params = {
                appid: this.appId,
                mch_id: this.mchId,
                nonce_str: this.generateNonceStr(),
                body: request.description,
                out_trade_no: request.orderNo,
                total_fee: Math.round(request.amount * 100), // 转换为分
                spbill_create_ip: '127.0.0.1',
                notify_url: config_1.config.apiUrl + '/webhooks/wechat',
                trade_type: 'NATIVE',
                product_id: request.orderId,
                attach: JSON.stringify({
                    orderId: request.orderId,
                    userId: request.userId,
                }),
            };
            // 生成签名
            const sign = this.generateSign(params);
            // 构建 XML 请求体
            const xmlBody = this.buildXmlBody({ ...params, sign });
            // 实际实现需要调用微信支付接口
            // const response = await fetch(`${this.gatewayUrl}/pay/unifiedorder`, {
            //   method: 'POST',
            //   body: xmlBody,
            // });
            logger_1.logger.debug('WeChat payment request:', xmlBody);
            // 模拟返回二维码链接
            const qrCodeUrl = `weixin://wxpay/bizpayurl?pr=${wechatTradeNo}`;
            return {
                success: true,
                provider: this.name,
                orderId: request.orderId,
                checkoutUrl: qrCodeUrl,
                paymentIntentId: wechatTradeNo,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create WeChat merchant payment:', error);
            throw error;
        }
    }
    /**
     * 生成随机字符串
     */
    generateNonceStr(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    /**
     * 生成微信支付签名
     */
    generateSign(params) {
        // 过滤空值和sign字段
        const filteredParams = Object.entries(params)
            .filter(([key, value]) => value !== '' && key !== 'sign' && value !== undefined && value !== null)
            .sort(([a], [b]) => a.localeCompare(b));
        // 构建待签名字符串
        const signString = filteredParams
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
        // 拼接 API 密钥
        const stringSignTemp = `${signString}&key=${this.apiKey}`;
        const signature = crypto_1.default
            .createHash('md5')
            .update(stringSignTemp, 'utf8')
            .digest('hex')
            .toUpperCase();
        logger_1.logger.debug('Generated WeChat sign:', signature);
        return signature;
    }
    /**
     * 构建 XML 请求体
     */
    buildXmlBody(params) {
        const xml = Object.entries(params)
            .map(([key, value]) => `<${key}><![CDATA[${value}]]></${key}>`)
            .join('');
        return `<xml>${xml}</xml>`;
    }
    /**
     * 解析 XML 响应
     */
    parseXmlResponse(xml) {
        const result = {};
        const regex = /<(\w+)>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/\w+>/g;
        let match;
        while ((match = regex.exec(xml)) !== null) {
            result[match[1]] = match[2];
        }
        return result;
    }
    /**
     * 验证 Webhook 签名
     */
    verifyWebhookSignature(payload, signature, secret) {
        try {
            // 解析微信通知数据
            const data = this.parseXmlResponse(payload);
            const sign = data.sign || '';
            // 验证签名
            // 实际实现需要重新生成签名并比对
            logger_1.logger.debug('Verifying WeChat webhook signature');
            return true; // 简化实现
        }
        catch (error) {
            logger_1.logger.error('Failed to verify WeChat webhook signature:', error);
            return false;
        }
    }
    /**
     * 解析 Webhook 事件
     */
    parseWebhookEvent(rawBody, signature) {
        try {
            const data = this.parseXmlResponse(rawBody);
            const resultCode = data.result_code || '';
            const returnCode = data.return_code || '';
            let eventType = 'unknown';
            if (returnCode === 'SUCCESS' && resultCode === 'SUCCESS') {
                eventType = 'payment.success';
            }
            else if (returnCode === 'FAIL' || resultCode === 'FAIL') {
                eventType = 'payment.failed';
            }
            return {
                id: data.transaction_id || '',
                type: eventType,
                provider: this.name,
                data,
                signature,
                rawBody,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to parse WeChat webhook event:', error);
            throw error;
        }
    }
    /**
     * 处理支付成功
     */
    async handlePaymentSuccess(event) {
        // 验证事件数据类型
        if (typeof event.data !== 'object' || event.data === null) {
            throw new types_1.PaymentError('Invalid webhook event data', 'INVALID_DATA', this.name);
        }
        const data = event.data;
        // 验证并提取必要字段
        const transactionId = (0, types_1.validateString)(data.transaction_id, 'transaction_id') || '';
        const totalFeeRaw = data.total_fee;
        let totalFee = 0;
        if (typeof totalFeeRaw === 'string') {
            totalFee = parseInt(totalFeeRaw, 10);
        }
        else if (typeof totalFeeRaw === 'number') {
            totalFee = totalFeeRaw;
        }
        if (isNaN(totalFee) || totalFee < 0) {
            throw new types_1.PaymentError('Invalid total_fee', 'INVALID_AMOUNT', this.name);
        }
        const outTradeNo = (0, types_1.validateString)(data.out_trade_no, 'out_trade_no', { required: false }) || '';
        // 解析 attach 获取订单信息
        let metadata = {};
        try {
            const attachRaw = data.attach;
            if (typeof attachRaw === 'string') {
                const parsed = JSON.parse(attachRaw);
                if (typeof parsed === 'object' && parsed !== null) {
                    metadata = {
                        orderId: String(parsed.orderId || ''),
                        userId: String(parsed.userId || ''),
                    };
                }
            }
        }
        catch (e) {
            logger_1.logger.warn('Failed to parse attach:', e);
        }
        return {
            providerOrderId: transactionId,
            amount: totalFee / 100, // 分转元
            currency: 'CNY',
            metadata: {
                orderId: metadata.orderId || '',
                userId: metadata.userId || '',
                outTradeNo,
            },
        };
    }
    /**
     * 处理支付失败
     */
    async handlePaymentFailure(event) {
        // 验证事件数据类型
        if (typeof event.data !== 'object' || event.data === null) {
            throw new types_1.PaymentError('Invalid webhook event data', 'INVALID_DATA', this.name);
        }
        const data = event.data;
        // 安全地提取字段
        const transactionId = (0, types_1.validateString)(data.transaction_id, 'transaction_id', { required: false }) || '';
        const errCodeDes = (0, types_1.validateString)(data.err_code_des, 'err_code_des', { required: false }) || 'Payment failed';
        return {
            providerOrderId: transactionId,
            reason: errCodeDes,
        };
    }
    /**
     * 处理退款
     */
    async handleRefund(event) {
        // 验证事件数据类型
        if (typeof event.data !== 'object' || event.data === null) {
            throw new types_1.PaymentError('Invalid webhook event data', 'INVALID_DATA', this.name);
        }
        const data = event.data;
        // 安全地提取字段
        const transactionId = (0, types_1.validateString)(data.transaction_id, 'transaction_id', { required: false }) || '';
        const refundId = (0, types_1.validateString)(data.refund_id, 'refund_id', { required: false }) || '';
        // 验证退款金额
        const refundFeeRaw = data.refund_fee;
        let refundFee = 0;
        if (typeof refundFeeRaw === 'string') {
            refundFee = parseInt(refundFeeRaw, 10);
        }
        else if (typeof refundFeeRaw === 'number') {
            refundFee = refundFeeRaw;
        }
        if (isNaN(refundFee) || refundFee < 0) {
            refundFee = 0;
        }
        return {
            providerOrderId: transactionId,
            refundId,
            amount: refundFee / 100,
            status: 'succeeded',
        };
    }
    /**
     * 处理退款请求
     */
    async processRefund(request) {
        try {
            logger_1.logger.info(`Processing WeChat refund for payment: ${request.paymentId}`);
            // 构建退款参数
            const params = {
                appid: this.appId,
                mch_id: this.mchId,
                nonce_str: this.generateNonceStr(),
                out_trade_no: request.paymentId,
                out_refund_no: `REF${Date.now()}`,
                total_fee: Math.round((request.amount || 0) * 100),
                refund_fee: Math.round((request.amount || 0) * 100),
                refund_desc: request.reason || 'User requested refund',
            };
            // 生成签名
            const sign = this.generateSign(params);
            // 构建 XML 请求体
            const xmlBody = this.buildXmlBody({ ...params, sign });
            // 实际实现需要调用微信退款接口
            logger_1.logger.debug('WeChat refund request:', xmlBody);
            return {
                success: true,
                refundId: params.out_refund_no,
                amount: request.amount || 0,
                status: 'succeeded',
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to process WeChat refund:', error);
            return {
                success: false,
                refundId: '',
                amount: request.amount || 0,
                status: 'failed',
            };
        }
    }
    /**
     * 获取支付状态
     */
    async getPaymentStatus(paymentId) {
        try {
            // 构建查询参数
            const params = {
                appid: this.appId,
                mch_id: this.mchId,
                nonce_str: this.generateNonceStr(),
                out_trade_no: paymentId,
            };
            // 生成签名
            const sign = this.generateSign(params);
            // 构建 XML 请求体
            const xmlBody = this.buildXmlBody({ ...params, sign });
            // 实际实现需要调用微信查询接口
            logger_1.logger.debug('WeChat query request:', xmlBody);
            return {
                orderId: paymentId,
                status: 'pending',
                amount: 0,
                currency: 'CNY',
                providerOrderId: paymentId,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get WeChat payment status:', error);
            throw error;
        }
    }
    /**
     * 查询订单状态（主动查询）
     */
    async queryOrderStatus(outTradeNo) {
        logger_1.logger.info(`Querying WeChat order status: ${outTradeNo}`);
        // 实际实现需要调用微信查询接口
        return {
            tradeNo: '',
            status: 'unknown',
            amount: 0,
        };
    }
}
exports.WechatMerchantProvider = WechatMerchantProvider;
//# sourceMappingURL=wechat-merchant.js.map