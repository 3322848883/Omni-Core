import db from '@/config/database';
import { generateVpnUuid, generateOrderId, generateOrderNo } from '@/utils/crypto';
import { NotFoundError, ValidationError, ConflictError } from '@/errors/AppError';
import { ORDER_STATUS, SUBSCRIPTION_STATUS } from '@/constants';
import {
  SubscriptionPlan,
  SubscriptionInfo,
  SubscriptionUrl,
  CreateOrderData,
  Order,
} from '@/types/user';
import { ServiceType, ServiceTypeMeta, PLAN_GROUPS } from '@/constants/service-type';
import { nodeFilterService } from './nodeFilterService';

/**
 * Get all available subscription plans
 */
export const getPlans = async (): Promise<
  Array<
    SubscriptionPlan & {
      serviceTypes: ServiceType[];
      serviceTypeDetails: Array<{
        type: ServiceType;
        label: string;
        color: string;
        icon: string;
      }>;
      groupId: string;
      groupName: string;
    }
  >
> => {
  const plans = await db('subscription_plans')
    .where({ status: 1 })
    .orderBy('sort_order', 'asc')
    .select('*');

  return plans.map((plan) => {
    // 解析服务类型
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

    // 获取服务类型详情
    const serviceTypeDetails = serviceTypes.map((type) => ({
      type,
      label: ServiceTypeMeta[type]?.label || type,
      color: ServiceTypeMeta[type]?.color || '#666666',
      icon: ServiceTypeMeta[type]?.icon || 'circle',
    }));

    // 获取套餐组信息
    const group = PLAN_GROUPS.find((g) =>
      g.serviceTypes.every((st) => serviceTypes.includes(st))
    );

    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      durationDays: plan.duration_days,
      trafficLimit: plan.traffic_limit,
      features: plan.features ? JSON.parse(plan.features) : [],
      isPopular: plan.is_popular === 1,
      sortOrder: plan.sort_order,
      status: plan.status,
      serviceTypes,
      serviceTypeDetails,
      groupId: group?.id || 'standard',
      groupName: group?.name || '标准套餐',
    };
  });
};

/**
 * Get user current subscription info
 */
export const getUserSubscription = async (
  userId: string
): Promise<
  SubscriptionInfo & {
    serviceTypes: ServiceType[];
    effectiveServiceTypes: ServiceType[];
    accessibleNodes: {
      total: number;
      byType: Record<ServiceType, number>;
    };
  }
> => {
  const user = await db('users').where({ user_id: userId }).first();

  if (!user) {
    throw new NotFoundError('User', userId);
  }

  // Get active subscription if exists
  const subscription = await db('user_subscriptions')
    .where({ user_id: userId })
    .where('status', SUBSCRIPTION_STATUS.ACTIVE)
    .where('end_date', '>', new Date())
    .orderBy('created_at', 'desc')
    .first();

  // Get plan name if subscription exists
  let planName = null;
  let planServiceTypes: ServiceType[] = [ServiceType.STANDARD];

  if (subscription) {
    const plan = await db('subscription_plans').where({ id: subscription.plan_id }).first();
    planName = plan?.name || null;

    // 解析套餐的服务类型
    if (plan?.service_types) {
      if (typeof plan.service_types === 'string') {
        try {
          planServiceTypes = JSON.parse(plan.service_types);
        } catch {
          planServiceTypes = [plan.service_types as ServiceType];
        }
      } else if (Array.isArray(plan.service_types)) {
        planServiceTypes = plan.service_types;
      }
    }
  }

  // 获取用户有效的服务类型
  let effectiveServiceTypes: ServiceType[] = [ServiceType.STANDARD];
  if (user.effective_service_types) {
    if (typeof user.effective_service_types === 'string') {
      try {
        effectiveServiceTypes = JSON.parse(user.effective_service_types);
      } catch {
        effectiveServiceTypes = [user.effective_service_types as ServiceType];
      }
    } else if (Array.isArray(user.effective_service_types)) {
      effectiveServiceTypes = user.effective_service_types;
    }
  }

  const trafficLimit = user.traffic_limit || 0;
  const trafficUsed = user.traffic_used || 0;
  const trafficRemaining = Math.max(0, trafficLimit - trafficUsed);
  const usagePercent = trafficLimit > 0 ? Math.round((trafficUsed / trafficLimit) * 100) : 0;

  let daysRemaining = 0;
  if (user.expire_date) {
    const now = new Date();
    const expireDate = new Date(user.expire_date);
    daysRemaining = Math.max(
      0,
      Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
  }

  // 获取可访问节点统计
  const accessibleNodes = await nodeFilterService.getAccessibleNodeCount(userId);

  return {
    userId: user.user_id,
    status: subscription ? subscription.status : user.status,
    trafficLimit,
    trafficUsed,
    trafficRemaining,
    usagePercent,
    expireDate: user.expire_date ? new Date(user.expire_date).toISOString() : null,
    daysRemaining,
    planName,
    serviceTypes: planServiceTypes,
    effectiveServiceTypes,
    accessibleNodes,
  };
};

/**
 * Generate subscription URL for user
 */
export const generateSubscriptionUrl = async (userId: string): Promise<SubscriptionUrl> => {
  const user = await db('users').where({ user_id: userId }).first();

  if (!user) {
    throw new NotFoundError('User', userId);
  }

  // Generate subscription URL using VPN UUID
  const baseUrl = process.env.SUBSCRIPTION_BASE_URL || 'https://api.embarks.uk/sub';
  const url = `${baseUrl}/${user.vpn_uuid}`;

  // Generate QR code URL (using a QR code service or generate locally)
  const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  return {
    url,
    qrCode,
  };
};

/**
 * Reset user VPN UUID
 */
export const resetVpnUuid = async (userId: string): Promise<{ vpnUuid: string }> => {
  const user = await db('users').where({ user_id: userId }).first();

  if (!user) {
    throw new NotFoundError('User', userId);
  }

  // Generate new VPN UUID
  const newVpnUuid = generateVpnUuid();

  // Update user with new UUID
  await db('users')
    .where({ user_id: userId })
    .update({
      vpn_uuid: newVpnUuid,
      updated_at: new Date(),
    });

  return {
    vpnUuid: newVpnUuid,
  };
};

/**
 * Create subscription order
 */
export const createSubscriptionOrder = async (
  userId: string,
  data: CreateOrderData
): Promise<{ order: Order; paymentUrl?: string }> => {
  const { planId, paymentMethod } = data;

  // Validate plan
  const plan = await db('subscription_plans').where({ id: planId }).first();

  if (!plan) {
    throw new NotFoundError('Subscription plan', planId);
  }

  if (plan.status !== 1) {
    throw new ValidationError([{ field: 'planId', message: 'This plan is not available' }]);
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

  // Create order
  const orderId = generateOrderId();
  const orderNo = generateOrderNo();

  // 解析套餐的服务类型
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

  const [order] = await db('orders')
    .insert({
      id: orderId,
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
      payment_method: paymentMethod || null,
      payment_time: null,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning('*');

  // Generate payment URL if payment method provided
  let paymentUrl: string | undefined;
  if (paymentMethod) {
    // In production, integrate with actual payment gateway
    // For now, return a mock payment URL
    paymentUrl = `${process.env.PAYMENT_BASE_URL || 'https://pay.embarks.uk'}/pay/${orderNo}`;
  }

  return {
    order: formatOrder(order),
    paymentUrl,
  };
};

/**
 * Format database order to Order type
 */
const formatOrder = (order: Record<string, unknown>): Order => {
  return {
    id: order.id as string,
    orderNo: order.order_no as string,
    userId: order.user_id as string,
    planId: order.plan_id as string | null,
    orderType: order.order_type as string,
    status: order.status as string,
    amount: order.amount as number,
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
