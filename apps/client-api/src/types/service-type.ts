// Service Type Related Types

import { ServiceType } from '@/constants/service-type';

/**
 * 访问检查结果
 */
export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  currentTypes?: ServiceType[];
  requiredType?: ServiceType;
}

/**
 * 节点配置
 */
export interface NodeConfig {
  id: string;
  name: string;
  server: string;
  port: number;
  protocol: string;
  cipher: string;
  serviceType: ServiceType;
  ipType: string;
  lineType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
