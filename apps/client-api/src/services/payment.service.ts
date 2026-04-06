import db from '@/config/database';
import { generateOrderId, generateOrderNo } from '@/utils/crypto';
import { NotFoundError, ValidationError, ConflictError } from '@/errors/AppError';
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } from '@/constants';
import { PaymentQrCode, PaymentProof, CreatePaymentProofData, Order } from '@/types/user';
import { ServiceType } from '@/constants/service-type';

/**
 * Format database QR code to PaymentQrCode type
 */
const formatQrCode = (qrCode: Record<string, unknown>): PaymentQrCode => {
  return {
    id: qrCode.id as string,
    name: qrCode.name as string,
    type: qrCode.type as 'alipay' | 'wechat',
    accountName: qrCode.account_name as string,
    accountNumber: qrCode.account_number as string | undefined,
    qrCodeImageUrl: qrCode.qr_code_image_url as string,
    isEnabled: qrCode.is_enabled === 1 || qrCode.is_enabled === true,
    sortOrder: (qrCode.sort_order as number) || 0,
    createdAt: new Date(qrCode.created_at as string),
    updatedAt: new Date(qrCode.updated_at as string),
  };
};

/**
 * Format database payment proof to PaymentProof type
 */
const formatPaymentProof = (proof: Record<string, unknown>): PaymentProof => {
  return {
    id: proof.id as string,
    orderId: proof.order_id as string,
    userId: proof.user_id as string,
    qrCodeId: proof.qr_code_id as string,
    amount: parseFloat(proof.amount as string),
    payerName: proof.payer_name as string | undefined,
    payerAccount: proof.payer_account as string | undefined,
    transactionId: proof.transaction_id as string | undefined,
    proofImageUrl: proof.proof_image_url as string,
    status: proof.status as 'pending' | 'approved' | 'rejected',
    remark: proof.remark as string | undefined,
    reviewedAt: proof.reviewed_at ? new Date(proof.reviewed_at as string) : undefined,
    reviewedBy: proof.reviewed_by as string | undefined,
    createdAt: new Date(proof.created_at as string),
    updatedAt: new Date(proof.updated_at as string),
  };
};

/**
 * Format database order to Order type
 */
const formatOrder = (order: Record<string, unknown>): Order => {
  return {
    id: order.order_id as string,
    orderNo: order.order_no as string,
    userId: order.user_id as string,
    planId: order.plan_id as string | null,
    orderType: order.order_type as string,
    status: order.status as string,
    amount: parseFloat(order.amount as string),
    trafficLimit: order.traffic_limit as number | null,
    durationDays: order.duration_days as number | null,
    startDate: order.start_date ? new Date(order.start_date as string) : null,
    endDate: order.end_date ? new Date(order.end_date as string) : null,
    paymentMethod: order.payment_method as string | null,
    paymentTime: order.payment_time ? new Date(order.payment_time as string) : null,
    createdAt: new Date(order.created_at as string),
    updatedAt: new Date(order.updated_at as string),
  };
};

/**
 * Get all enabled QR codes
 */
export const getEnabledQrCodes = async (): Promise<PaymentQrCode[]> => {
  const qrCodes = await db('payment_qr_codes')
    .where({ is_enabled: true })
    .orderBy('sort_order', 'asc')
    .select('*');

  return qrCodes.map(formatQrCode);
};

/**
 * Get QR code by ID
 */
export const getQrCodeById = async (id: string): Promise<PaymentQrCode | null> => {
  const qrCode = await db('payment_qr_codes')
    .where({ id })
    .first();

  if (!qrCode) {
    return null;
  }

  return formatQrCode(qrCode);
};

/**
 * Create order with personal QR code payment method
 */
export const createOrderWithQrCode = async (
  userId: string,
  planId: string,
  qrCodeId: string,
  paymentMethod: string
): Promise<Order> => {
  // Validate plan
  const plan = await db('subscription_plans')
    .where({ plan_id: planId })
    .first();

  if (!plan) {
    throw new NotFoundError('Subscription plan', planId);
  }

  if (plan.status !== 1) {
    throw new ValidationError([{ field: 'planId', message: 'This plan is not available' }]);
  }

  // Validate QR code
  const qrCode = await getQrCodeById(qrCodeId);
  if (!qrCode) {
    throw new NotFoundError('Payment QR code', qrCodeId);
  }

  if (!qrCode.isEnabled) {
    throw new ValidationError([{ field: 'qrCodeId', message: 'This payment method is not available' }]);
  }

  // Check if user has pending order for same plan
  const existingPendingOrder = await db('orders')
    .where({
      user_id: userId,
      plan_id: planId,
      status: ORDER_STATUS.PENDING,
    })
    .first();

  if (existingPendingOrder) {
    throw new ConflictError('You already have a pending order for this plan');
  }

  // Calculate order dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.duration_days);

  // Parse service types
  let serviceTypes: ServiceType[] = [ServiceType.STANDARD];
  if (plan.service_types) {
    if (typeof plan.service_types === 'string') {
      try {
        serviceTypes = JSON.parse(plan.service_types);
      } catch {
        serviceTypes = [plan.service_types as ServiceType];
      }
    } else if (Array.isArray(plan.service_types)) {
      serviceTypes = plan.service_types;
    }
  }

  // Create order
  const orderId = generateOrderId();
  const orderNo = generateOrderNo();

  await db('orders').insert({
    order_id: orderId,
    order_no: orderNo,
    user_id: userId,
    plan_id: planId,
    order_type: 'subscription',
    status: ORDER_STATUS.PENDING,
    amount: plan.price,
    traffic_limit: plan.traffic_limit,
    duration_days: plan.duration_days,
    service_types: JSON.stringify(serviceTypes),
    start_date: startDate,
    end_date: endDate,
    payment_method: paymentMethod,
    payment_time: null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Return created order
  const order = await db('orders').where({ order_id: orderId }).first();
  return formatOrder(order);
};

/**
 * Upload payment proof
 */
export const uploadPaymentProof = async (
  userId: string,
  data: CreatePaymentProofData
): Promise<PaymentProof> => {
  const { orderId, qrCodeId, amount, payerName, payerAccount, transactionId, proofImageUrl } = data;

  // Validate order
  const order = await db('orders')
    .where({ order_id: orderId, user_id: userId })
    .first();

  if (!order) {
    throw new NotFoundError('Order', orderId);
  }

  if (order.status !== ORDER_STATUS.PENDING) {
    throw new ValidationError([
      { field: 'orderId', message: `Cannot upload proof for order with status: ${order.status}` },
    ]);
  }

  // Validate QR code
  const qrCode = await getQrCodeById(qrCodeId);
  if (!qrCode) {
    throw new NotFoundError('Payment QR code', qrCodeId);
  }

  // Check if proof already exists
  const existingProof = await db('payment_proofs')
    .where({ order_id: orderId })
    .first();

  if (existingProof) {
    throw new ConflictError('Payment proof already exists for this order');
  }

  // Create payment proof
  const [proof] = await db('payment_proofs')
    .insert({
      order_id: orderId,
      user_id: userId,
      qr_code_id: qrCodeId,
      amount,
      payer_name: payerName || null,
      payer_account: payerAccount || null,
      transaction_id: transactionId || null,
      proof_image_url: proofImageUrl,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('*');

  // Update order payment status
  await db('orders')
    .where({ order_id: orderId })
    .update({
      payment_method: qrCode.type === 'alipay' ? PAYMENT_METHOD.ALIPAY_PERSONAL : PAYMENT_METHOD.WECHAT_PERSONAL,
      updated_at: new Date(),
    });

  return formatPaymentProof(proof);
};

/**
 * Get payment proof by order ID
 */
export const getPaymentProofByOrderId = async (
  orderId: string,
  userId: string
): Promise<PaymentProof | null> => {
  // Validate order belongs to user
  const order = await db('orders')
    .where({ order_id: orderId, user_id: userId })
    .first();

  if (!order) {
    throw new NotFoundError('Order', orderId);
  }

  const proof = await db('payment_proofs')
    .where({ order_id: orderId })
    .first();

  if (!proof) {
    return null;
  }

  return formatPaymentProof(proof);
};

/**
 * Get payment proof status
 */
export const getPaymentProofStatus = async (
  orderId: string,
  userId: string
): Promise<{ hasProof: boolean; proof?: PaymentProof }> => {
  const proof = await getPaymentProofByOrderId(orderId, userId);

  if (!proof) {
    return { hasProof: false };
  }

  return { hasProof: true, proof };
};
