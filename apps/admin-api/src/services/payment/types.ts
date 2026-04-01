// Payment Service Types

export type PaymentProvider = 'stripe' | 'paypal' | 'alipay' | 'wechat' | 'alipay_merchant' | 'wechat_merchant';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

/**
 * 支付错误类
 */
export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly provider?: PaymentProvider
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * 验证支付提供商字符串
 */
export function isValidPaymentProvider(provider: string): provider is PaymentProvider {
  const validProviders: PaymentProvider[] = ['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant'];
  return validProviders.includes(provider as PaymentProvider);
}

/**
 * 验证支付状态字符串
 */
export function isValidPaymentStatus(status: string): status is PaymentStatus {
  const validStatuses: PaymentStatus[] = ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded'];
  return validStatuses.includes(status as PaymentStatus);
}

export interface PaymentOrder {
  id: string;
  orderNo: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerOrderId?: string;
  clientSecret?: string;
  checkoutUrl?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentRequest {
  orderId: string;
  orderNo: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentResponse {
  success: boolean;
  provider: PaymentProvider;
  orderId: string;
  clientSecret?: string;
  checkoutUrl?: string;
  paymentIntentId?: string;
}

export interface PaymentWebhookEvent {
  id: string;
  type: string;
  provider: PaymentProvider;
  data: unknown;
  signature?: string;
  rawBody: string;
}

/**
 * 类型守卫：验证对象是否为有效的 PaymentWebhookEvent
 */
export function isValidWebhookEvent(event: unknown): event is PaymentWebhookEvent {
  if (typeof event !== 'object' || event === null) {
    return false;
  }

  const e = event as Record<string, unknown>;

  return (
    typeof e.id === 'string' &&
    typeof e.type === 'string' &&
    typeof e.provider === 'string' &&
    isValidPaymentProvider(e.provider) &&
    typeof e.rawBody === 'string'
  );
}

/**
 * 验证并解析金额
 * @param value - 要验证的值
 * @param fieldName - 字段名称（用于错误消息）
 * @returns 解析后的金额
 */
export function validateAmount(value: unknown, fieldName = 'amount'): number {
  let amount: number;

  if (typeof value === 'string') {
    amount = parseFloat(value);
  } else if (typeof value === 'number') {
    amount = value;
  } else {
    throw new PaymentError(
      `${fieldName} must be a number or numeric string`,
      'INVALID_AMOUNT'
    );
  }

  if (isNaN(amount) || amount < 0) {
    throw new PaymentError(
      `${fieldName} must be a valid non-negative number`,
      'INVALID_AMOUNT'
    );
  }

  return amount;
}

/**
 * 验证并解析货币代码
 * @param value - 要验证的值
 * @returns 标准化后的货币代码
 */
export function validateCurrency(value: unknown): string {
  if (typeof value !== 'string') {
    throw new PaymentError('Currency must be a string', 'INVALID_CURRENCY');
  }

  const currency = value.toUpperCase().trim();

  // 基本货币代码验证（3个大写字母）
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new PaymentError(
      `Invalid currency code: ${value}. Expected 3-letter ISO code.`,
      'INVALID_CURRENCY'
    );
  }

  return currency;
}

/**
 * 验证字符串字段
 * @param value - 要验证的值
 * @param fieldName - 字段名称
 * @param options - 验证选项
 */
export function validateString(
  value: unknown,
  fieldName: string,
  options: { required?: boolean; minLength?: number; maxLength?: number } = {}
): string | undefined {
  const { required = true, minLength, maxLength } = options;

  if (value === undefined || value === null) {
    if (required) {
      throw new PaymentError(`${fieldName} is required`, 'MISSING_FIELD');
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new PaymentError(`${fieldName} must be a string`, 'INVALID_TYPE');
  }

  const str = value.trim();

  if (minLength !== undefined && str.length < minLength) {
    throw new PaymentError(
      `${fieldName} must be at least ${minLength} characters`,
      'INVALID_LENGTH'
    );
  }

  if (maxLength !== undefined && str.length > maxLength) {
    throw new PaymentError(
      `${fieldName} must be at most ${maxLength} characters`,
      'INVALID_LENGTH'
    );
  }

  return str;
}

/**
 * 安全地访问嵌套对象属性
 * @param obj - 对象
 * @param path - 属性路径（如 'data.amount.value'）
 * @returns 属性值或 undefined
 */
export function getNestedValue<T = unknown>(obj: unknown, path: string): T | undefined {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current as T;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
}

export interface PaymentStatusResponse {
  orderId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt?: Date;
  providerOrderId?: string;
}

export interface IPaymentProvider {
  readonly name: PaymentProvider;

  /**
   * Create a payment session/intent
   */
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;

  /**
   * Parse webhook event
   */
  parseWebhookEvent(rawBody: string, signature: string): PaymentWebhookEvent;

  /**
   * Handle payment success webhook
   */
  handlePaymentSuccess(event: PaymentWebhookEvent): Promise<{
    providerOrderId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  }>;

  /**
   * Handle payment failure webhook
   */
  handlePaymentFailure(event: PaymentWebhookEvent): Promise<{
    providerOrderId: string;
    reason?: string;
  }>;

  /**
   * Handle refund webhook
   */
  handleRefund(event: PaymentWebhookEvent): Promise<{
    providerOrderId: string;
    refundId: string;
    amount: number;
    status: string;
  }>;

  /**
   * Process refund
   */
  processRefund(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Get payment status
   */
  getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse>;
}

// Order status transition types
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'expired';

export interface OrderStatusTransition {
  from: OrderStatus | null;
  to: OrderStatus;
  allowed: boolean;
  requiresAction?: boolean;
}

// Payment state machine definition
export const ORDER_STATUS_TRANSITIONS: OrderStatusTransition[] = [
  { from: null, to: 'pending', allowed: true },
  { from: 'pending', to: 'paid', allowed: true },
  { from: 'pending', to: 'cancelled', allowed: true },
  { from: 'pending', to: 'expired', allowed: true },
  { from: 'paid', to: 'completed', allowed: true },
  { from: 'paid', to: 'refunded', allowed: true },
  { from: 'completed', to: 'refunded', allowed: true },
];

export function canTransitionOrderStatus(
  fromStatus: OrderStatus | null,
  toStatus: OrderStatus
): boolean {
  const transition = ORDER_STATUS_TRANSITIONS.find(
    (t) => t.from === fromStatus && t.to === toStatus
  );
  return transition?.allowed ?? false;
}
