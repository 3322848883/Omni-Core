import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import * as subscriptionService from '@/services/subscriptionService';
import { successResponse, createdResponse, errorResponse } from '@/utils/response';
import { HTTP_STATUS, ERROR_CODES } from '@/constants';
import { CreateOrderData } from '@/types/user';
import { ServiceTypeMeta } from '@/constants/service-type';

const router = Router();

/**
 * GET /plans - Get all available subscription plans
 */
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await subscriptionService.getPlans();

    // 格式化响应，包含 serviceTypes 和 serviceTypeDetails
    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      durationDays: plan.durationDays,
      trafficLimit: plan.trafficLimit,
      features: plan.features,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
      status: plan.status,
      serviceTypes: plan.serviceTypes,
      serviceTypeDetails: plan.serviceTypeDetails,
      groupId: plan.groupId,
      groupName: plan.groupName,
    }));

    successResponse(res, formattedPlans, 'Subscription plans retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /info - Get current user subscription info
 */
router.get('/info', authenticate, async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user!.user_id);

    // 格式化响应，包含 serviceTypes、effectiveServiceTypes 和 accessibleNodes
    const formattedSubscription = {
      userId: subscription.userId,
      status: subscription.status,
      trafficLimit: subscription.trafficLimit,
      trafficUsed: subscription.trafficUsed,
      trafficRemaining: subscription.trafficRemaining,
      usagePercent: subscription.usagePercent,
      expireDate: subscription.expireDate,
      daysRemaining: subscription.daysRemaining,
      planName: subscription.planName,
      serviceTypes: subscription.serviceTypes,
      effectiveServiceTypes: subscription.effectiveServiceTypes,
      serviceTypeDetails: subscription.serviceTypes.map((type) => ({
        type,
        label: ServiceTypeMeta[type]?.label || type,
        color: ServiceTypeMeta[type]?.color || '#666666',
        icon: ServiceTypeMeta[type]?.icon || 'circle',
      })),
      effectiveServiceTypeDetails: subscription.effectiveServiceTypes.map((type) => ({
        type,
        label: ServiceTypeMeta[type]?.label || type,
        color: ServiceTypeMeta[type]?.color || '#666666',
        icon: ServiceTypeMeta[type]?.icon || 'circle',
      })),
      accessibleNodes: subscription.accessibleNodes,
    };

    successResponse(res, formattedSubscription, 'Subscription info retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /url - Get subscription URL
 */
router.get('/url', authenticate, async (req, res, next) => {
  try {
    const subscriptionUrl = await subscriptionService.generateSubscriptionUrl(req.user!.user_id);
    successResponse(res, subscriptionUrl, 'Subscription URL generated successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /reset-uuid - Reset VPN UUID
 */
router.post('/reset-uuid', authenticate, async (req, res, next) => {
  try {
    const result = await subscriptionService.resetVpnUuid(req.user!.user_id);
    successResponse(res, result, 'VPN UUID reset successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /order - Create subscription order
 */
router.post('/order', authenticate, async (req, res, next) => {
  try {
    const data: CreateOrderData = req.body;

    // Validate required fields
    if (!data.planId) {
      return errorResponse(
        res,
        'Plan ID is required',
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'planId', message: 'Plan ID is required' }]
      );
    }

    const result = await subscriptionService.createSubscriptionOrder(req.user!.user_id, data);
    createdResponse(res, result, 'Subscription order created successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
