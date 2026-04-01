import request from '@/utils/request';
import type { Plan, PlanDetail, SubscriptionInfo } from '@/types/subscription';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  trafficLimit: number;
  features: string[];
  isPopular?: boolean;
  sortOrder: number;
  status: number;
}

export interface SubscriptionUrl {
  url: string;
  qrCode: string;
}

// Get subscription plans (aliased as getPlanList for store compat)
export function getPlanList() {
  return request.get<Plan[]>('/subscription/plans');
}

export function getSubscriptionPlans() {
  return getPlanList();
}

// Get plan by ID
export function getPlanById(planId: string) {
  return request.get<PlanDetail>(`/subscription/plans/${planId}`);
}

// Get plans by group
export function getPlansByGroup(groupId: string) {
  return request.get<Plan[]>(`/subscription/plans`, { params: { groupId } });
}

// Get current subscription (aliased as getCurrentSubscription for store compat)
export function getCurrentSubscription() {
  return request.get<SubscriptionInfo>('/subscription/info');
}

export function getSubscriptionInfo() {
  return getCurrentSubscription();
}

// Get subscription URL
export function getSubscriptionUrl() {
  return request.get<SubscriptionUrl>('/subscription/url');
}

// Reset subscription UUID
export function resetSubscriptionUuid() {
  return request.post<{ vpnUuid: string }>('/subscription/reset-uuid');
}

// Create subscription order
export function createSubscriptionOrder(planId: string) {
  return request.post('/subscription/order', { planId });
}

// Get accessible nodes count
export function getAccessibleNodesCount() {
  return request.get<{
    total: number;
    byType: Record<string, number>;
    byIpType: Record<string, number>;
    byLineType: Record<string, number>;
  }>('/subscription/accessible-nodes-count');
}

// Get IP types metadata
export function getIpTypes() {
  return request.get<Array<{
    type: string;
    label: string;
    description: string;
    color: string;
  }>>('/meta/ip-types');
}

// Get line types metadata
export function getLineTypes() {
  return request.get<Array<{
    type: string;
    label: string;
    description: string;
    color: string;
  }>>('/meta/line-types');
}
