"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middlewares/auth");
const subscriptionService = __importStar(require("@/services/subscriptionService"));
const response_1 = require("@/utils/response");
const constants_1 = require("@/constants");
const service_type_1 = require("@/constants/service-type");
const router = (0, express_1.Router)();
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
        (0, response_1.successResponse)(res, formattedPlans, 'Subscription plans retrieved successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /info - Get current user subscription info
 */
router.get('/info', auth_1.authenticate, async (req, res, next) => {
    try {
        const subscription = await subscriptionService.getUserSubscription(req.user.user_id);
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
                label: service_type_1.ServiceTypeMeta[type]?.label || type,
                color: service_type_1.ServiceTypeMeta[type]?.color || '#666666',
                icon: service_type_1.ServiceTypeMeta[type]?.icon || 'circle',
            })),
            effectiveServiceTypeDetails: subscription.effectiveServiceTypes.map((type) => ({
                type,
                label: service_type_1.ServiceTypeMeta[type]?.label || type,
                color: service_type_1.ServiceTypeMeta[type]?.color || '#666666',
                icon: service_type_1.ServiceTypeMeta[type]?.icon || 'circle',
            })),
            accessibleNodes: subscription.accessibleNodes,
        };
        (0, response_1.successResponse)(res, formattedSubscription, 'Subscription info retrieved successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /url - Get subscription URL
 */
router.get('/url', auth_1.authenticate, async (req, res, next) => {
    try {
        const subscriptionUrl = await subscriptionService.generateSubscriptionUrl(req.user.user_id);
        (0, response_1.successResponse)(res, subscriptionUrl, 'Subscription URL generated successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /reset-uuid - Reset VPN UUID
 */
router.post('/reset-uuid', auth_1.authenticate, async (req, res, next) => {
    try {
        const result = await subscriptionService.resetVpnUuid(req.user.user_id);
        (0, response_1.successResponse)(res, result, 'VPN UUID reset successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /order - Create subscription order
 */
router.post('/order', auth_1.authenticate, async (req, res, next) => {
    try {
        const data = req.body;
        // Validate required fields
        if (!data.planId) {
            return (0, response_1.errorResponse)(res, 'Plan ID is required', constants_1.ERROR_CODES.VALIDATION_ERROR, constants_1.HTTP_STATUS.BAD_REQUEST, [{ field: 'planId', message: 'Plan ID is required' }]);
        }
        const result = await subscriptionService.createSubscriptionOrder(req.user.user_id, data);
        (0, response_1.createdResponse)(res, result, 'Subscription order created successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=subscription.js.map