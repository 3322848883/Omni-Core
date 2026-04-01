// Node Types

import { ServiceType } from '../constants/service-type';

export interface Node {
  id: string;
  code: string;
  name: string;
  host: string;
  port: number;
  ip: string;
  status: string;
  type: string;
  location: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  load: number;
  uptime: number;
  protocol: string;
  healthScore: number;
  loadPercent: number;
  activeConnections: number;
  maxConnections: number;
  priority: number;
  isBackup: boolean;
  isp: string;
  ispName: string;
  ipType: string;
  ipTypeLabel: string;
  ipScore: number;
  lineType: string;
  lineTypeLabel: string;
  supportsIPv6: boolean;
  serviceType: ServiceType;
  costLevel: number;
}

export interface NodeConnectionConfig {
  protocol: string;
  host: string;
  port: number;
  uuid?: string;
  alterId?: number;
  security?: string;
  network?: string;
  path?: string;
  host_header?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  latency?: number;
  error?: string;
}
