import { request } from '@/utils/request';

// 支付方式类型
export type PaymentMethodType = 'alipay' | 'wechat' | 'paypal' | 'stripe' | 'qrcode';

// 支付方式状态
export type PaymentMethodStatus = 'active' | 'inactive' | 'maintenance';

// 支付方式
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  icon: string;
  description?: string;
  status: PaymentMethodStatus;
  sortOrder: number;
  config?: Record<string, any>;
}

// 个人收款码
export interface QRCode {
  id: string;
  name: string;
  type: 'alipay' | 'wechat';
  imageUrl: string;
  thumbnailUrl: string;
  minAmount?: number;
  maxAmount?: number;
  description?: string;
  status: 'active' | 'inactive';
  sortOrder: number;
}

// 创建订单数据
export interface CreateOrderData {
  planId: string;
  period?: string;
  paymentMethod: PaymentMethodType;
  qrCodeId?: string;
  couponCode?: string;
  remark?: string;
}

// 订单信息
export interface Order {
  id: string;
  orderNo: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod?: PaymentMethodType;
  paymentStatus?: 'pending' | 'success' | 'failed' | 'waiting_confirmation';
  paidAt?: string;
  createdAt: string;
  completedAt?: string;
  remark?: string;
}

// 支付信息
export interface PaymentInfo {
  orderId: string;
  orderNo: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  paymentUrl?: string;
  qrCode?: string;
  qrCodeData?: QRCode;
  expiresAt: string;
  clientSecret?: string;
}

// 付款凭证上传结果
export interface UploadProofResult {
  success: boolean;
  proofId: string;
  message: string;
}

// 付款凭证状态
export interface PaymentProofStatus {
  orderId: string;
  status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewRemark?: string;
  imageUrl?: string;
  remark?: string;
}

// 支付结果状态
export type PaymentResultStatus = 'success' | 'failed' | 'waiting_confirmation' | 'processing';

// 支付结果
export interface PaymentResult {
  orderId: string;
  orderNo: string;
  status: PaymentResultStatus;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  message?: string;
  completedAt?: string;
  nextAction?: 'return_to_orders' | 'contact_support' | 'retry_payment';
}

/**
 * 获取可用的支付方式列表
 */
export function getPaymentMethods(): Promise<PaymentMethod[]> {
  return request.get('/payment/methods');
}

/**
 * 获取个人收款码列表
 */
export function getQRCodes(): Promise<QRCode[]> {
  return request.get('/payment/qrcodes');
}

/**
 * 创建订单
 * @param data 订单数据
 */
export function createOrder(data: CreateOrderData): Promise<Order> {
  return request.post('/orders', data);
}

/**
 * 获取订单支付信息
 * @param orderId 订单ID
 */
export function getPaymentInfo(orderId: string): Promise<PaymentInfo> {
  return request.get(`/orders/${orderId}/payment`);
}

/**
 * 上传付款凭证（用于个人收款码支付）
 * @param orderId 订单ID
 * @param file 付款凭证图片文件
 * @param remark 备注信息
 */
export function uploadPaymentProof(
  orderId: string,
  file: File,
  remark?: string
): Promise<UploadProofResult> {
  const formData = new FormData();
  formData.append('proof', file);
  if (remark) {
    formData.append('remark', remark);
  }

  return request.post(`/orders/${orderId}/payment-proof`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 查询付款凭证状态
 * @param orderId 订单ID
 */
export function getPaymentProofStatus(orderId: string): Promise<PaymentProofStatus> {
  return request.get(`/orders/${orderId}/payment-proof/status`);
}

/**
 * 获取支付结果
 * @param orderId 订单ID
 */
export function getPaymentResult(orderId: string): Promise<PaymentResult> {
  return request.get(`/orders/${orderId}/payment-result`);
}

/**
 * 取消订单
 * @param orderId 订单ID
 * @param reason 取消原因
 */
export function cancelOrder(orderId: string, reason?: string): Promise<void> {
  return request.post(`/orders/${orderId}/cancel`, { reason });
}

/**
 * 验证支付状态（轮询检查）
 * @param orderId 订单ID
 */
export function verifyPayment(orderId: string): Promise<{ status: PaymentResultStatus; message?: string }> {
  return request.post(`/orders/${orderId}/verify-payment`);
}

/**
 * 获取 Stripe 支付 Intent
 * @param orderId 订单ID
 */
export function createStripePaymentIntent(orderId: string): Promise<{ clientSecret: string }> {
  return request.post(`/orders/${orderId}/stripe-intent`);
}

/**
 * 获取 PayPal 订单信息
 * @param orderId 订单ID
 */
export function createPayPalOrder(orderId: string): Promise<{ orderId: string; approvalUrl: string }> {
  return request.post(`/orders/${orderId}/paypal-order`);
}

/**
 * 捕获 PayPal 支付
 * @param orderId 订单ID
 * @param paypalOrderId PayPal 订单ID
 */
export function capturePayPalPayment(orderId: string, paypalOrderId: string): Promise<void> {
  return request.post(`/orders/${orderId}/paypal-capture`, { paypalOrderId });
}
