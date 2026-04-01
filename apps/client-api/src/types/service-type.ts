// Service Type Types
import { ServiceType } from '../constants/service-type';

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  currentTypes?: ServiceType[];
  requiredType?: ServiceType;
}

export interface NodeServiceTypeInfo {
  serviceType: ServiceType;
  label: string;
  description: string;
  nodeCount: number;
}
