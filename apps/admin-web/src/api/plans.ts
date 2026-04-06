import request from '@/utils/request';

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  serviceType: string;
  groupId: string | null;
  maxDevices: number;
  maxTrafficGb: number | null;
  isActive: boolean;
  sortOrder: number;
  features: string[];
  settings: Record<string, any>;
  allowedIpTypes: string[];
  allowedLineTypes: string[];
  minIpScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanListResponse {
  items: Plan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PlanQuery {
  page?: number;
  limit?: number;
  serviceType?: string;
  group?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function getPlans(params: PlanQuery = {}) {
  return request.get<PlanListResponse>('/plans', { params });
}

export function getPlanById(id: string) {
  return request.get<{ plan: Plan }>(`/plans/${id}`);
}

export function createPlan(data: Partial<Plan>) {
  return request.post('/plans', data);
}

export function updatePlan(id: string, data: Partial<Plan>) {
  return request.put(`/plans/${id}`, data);
}

export function deletePlan(id: string) {
  return request.delete(`/plans/${id}`);
}

export function togglePlanStatus(id: string, isActive: boolean) {
  return request.post(`/plans/${id}/${isActive ? 'activate' : 'deactivate'}`);
}

export interface PlanStats {
  planId: string;
  planName: string;
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageSubscriptionDuration: number;
  userRetentionRate: number;
  subscriptionsByServiceType: Record<string, number>;
  growthTrend: Array<{
    period: string;
    newSubscriptions: number;
    churnedSubscriptions: number;
    netGrowth: number;
  }>;
}

export function getPlanStats(id: string) {
  return request.get<PlanStats>(`/plans/${id}/stats`);
}

export interface PlansOverviewStats {
  totalSubscribers: number;
  totalRevenue: number;
  newSubscribers: number;
  avgRevenuePerUser: number;
  plansDistribution: Array<{
    name: string;
    value: number;
  }>;
  revenueTrend: Array<{
    month: string;
    revenue: number;
    cumulative: number;
  }>;
  subscriberTrend: Array<{
    date: string;
    newSubscribers: number;
    totalSubscribers: number;
  }>;
  topPlans: Array<{
    name: string;
    subscriberCount: number;
    revenue: number;
    conversionRate: number;
    growth: number;
  }>;
}

export function getPlansOverviewStats(params?: { startDate?: string; endDate?: string; planId?: string }) {
  return request.get<PlansOverviewStats>('/plans/stats/overview', { params });
}
