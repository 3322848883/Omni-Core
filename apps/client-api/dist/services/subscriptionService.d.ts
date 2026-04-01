import { SubscriptionPlan, SubscriptionInfo, SubscriptionUrl, CreateOrderData, Order } from '@/types/user';
import { ServiceType } from '@/constants/service-type';
/**
 * Get all available subscription plans
 */
export declare const getPlans: () => Promise<Array<SubscriptionPlan & {
    serviceTypes: ServiceType[];
    serviceTypeDetails: Array<{
        type: ServiceType;
        label: string;
        color: string;
        icon: string;
    }>;
    groupId: string;
    groupName: string;
}>>;
/**
 * Get user current subscription info
 */
export declare const getUserSubscription: (userId: string) => Promise<SubscriptionInfo & {
    serviceTypes: ServiceType[];
    effectiveServiceTypes: ServiceType[];
    accessibleNodes: {
        total: number;
        byType: Record<ServiceType, number>;
    };
}>;
/**
 * Generate subscription URL for user
 */
export declare const generateSubscriptionUrl: (userId: string) => Promise<SubscriptionUrl>;
/**
 * Reset user VPN UUID
 */
export declare const resetVpnUuid: (userId: string) => Promise<{
    vpnUuid: string;
}>;
/**
 * Create subscription order
 */
export declare const createSubscriptionOrder: (userId: string, data: CreateOrderData) => Promise<{
    order: Order;
    paymentUrl?: string;
}>;
//# sourceMappingURL=subscriptionService.d.ts.map