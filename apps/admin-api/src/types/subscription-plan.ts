// Subscription Plan Types

import { ServiceType } from '../shared/constants/service-type';
import { IpType, LineType } from '../shared/constants/ip-type';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  primaryServiceType: ServiceType;
  allowedServiceTypes: ServiceType[];
  trafficLimit: number;
  durationDays: number;
  price: number;
  currency: string;
  features: string[];
  ipType: IpType;
  lineType: LineType;
  group?: string;
  serviceTypes?: ServiceType[];
  priorityBoost?: number;
  guaranteedBandwidth?: number;
  maxConnections?: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanFeature {
  id: string;
  planId: string;
  featureKey: string;
  featureValue: string | number | boolean;
  description?: string;
}

export interface PlanPricing {
  id: string;
  planId: string;
  countryCode: string;
  price: number;
  currency: string;
  isActive: boolean;
}

export interface CreatePlanRequest {
  name: string;
  description: string;
  primaryServiceType: ServiceType;
  allowedServiceTypes: ServiceType[];
  trafficLimit: number;
  durationDays: number;
  price: number;
  currency?: string;
  features?: string[];
  ipType?: IpType;
  lineType?: LineType;
}

export interface UpdatePlanRequest {
  name?: string;
  description?: string;
  primaryServiceType?: ServiceType;
  allowedServiceTypes?: ServiceType[];
  trafficLimit?: number;
  durationDays?: number;
  price?: number;
  currency?: string;
  features?: string[];
  ipType?: IpType;
  lineType?: LineType;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreatePlanData {
  name: string;
  description: string;
  primaryServiceType?: ServiceType;
  allowedServiceTypes?: ServiceType[];
  serviceTypes?: ServiceType[];
  trafficLimit: number;
  durationDays: number;
  price: number;
  currency?: string;
  features?: string[];
  ipType?: IpType;
  lineType?: LineType;
  group?: string;
  priorityBoost?: number;
  guaranteedBandwidth?: number;
  maxConnections?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePlanData {
  name?: string;
  description?: string;
  primaryServiceType?: ServiceType;
  allowedServiceTypes?: ServiceType[];
  serviceTypes?: ServiceType[];
  trafficLimit?: number;
  durationDays?: number;
  price?: number;
  currency?: string;
  features?: string[];
  ipType?: IpType;
  lineType?: LineType;
  group?: string;
  priorityBoost?: number;
  guaranteedBandwidth?: number;
  maxConnections?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface PlanStats {
  totalPlans: number;
  activePlans: number;
  totalSubscriptions: number;
  revenue: number;
  planId?: string;
}

export interface PlanListQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  serviceType?: ServiceType;
  group?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PlanListResponse {
  items: SubscriptionPlan[];
  total: number;
  page: number;
  pageSize: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PlanGroup {
  id: string;
  name: string;
  description: string;
  serviceTypes: ServiceType[];
  ipTypes: IpType[];
  lineTypes: LineType[];
  allowedIpTypes?: IpType[];
  allowedLineTypes?: IpType[];
  icon?: string;
  color?: string;
  recommendedFor?: string[];
}
