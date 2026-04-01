// Node Types
import type { PaginationParams } from './index';
import { ServiceType } from '@/constants/service-type';

export type NodeStatus = 'online' | 'offline' | 'busy' | 'maintenance';

export type ProtocolType = 'vless' | 'vmess' | 'trojan' | 'shadowsocks';

// IP类型
export type IpType = 'datacenter' | 'residential_dynamic' | 'residential_static' | 'mobile';

// 线路类型
export type LineType = 'standard' | 'cn2' | 'iepl' | 'iplc';

export interface Node {
  id: string;
  name: string;
  location: string;
  country: string;
  countryFlag: string;
  status: NodeStatus;
  latency?: number;
  load: number;
  protocols: ProtocolType[];
  testing?: boolean;
  // 服务类型相关字段
  service_type: ServiceType;
  service_type_label: string;
  service_type_color: string;
  qos_level: number;
  is_premium: boolean;
  // IP类型和线路类型
  ip_type?: IpType;
  line_type?: LineType;
  // ISP信息
  isp_name?: string;
  isp_id?: string;
  // IP评分 (0-100)
  ip_score?: number;
}

export interface NodeConfig {
  nodeId: string;
  protocol: ProtocolType;
  config: {
    vless?: VlessConfig;
    vmess?: VmessConfig;
    trojan?: TrojanConfig;
    shadowsocks?: ShadowsocksConfig;
  };
  subscriptionUrl: string;
  expiresAt: string;
}

interface VlessConfig {
  id: string;
  address: string;
  port: number;
  security: string;
  flow?: string;
  sni?: string;
  pbk?: string;
  sid?: string;
}

interface VmessConfig {
  id: string;
  address: string;
  port: number;
  alterId: number;
  security: string;
}

interface TrojanConfig {
  password: string;
  address: string;
  port: number;
  sni: string;
}

interface ShadowsocksConfig {
  method: string;
  password: string;
  address: string;
  port: number;
}

export interface NodeListParams extends PaginationParams {
  status?: NodeStatus;
  country?: string;
  protocol?: ProtocolType;
  serviceType?: ServiceType;
  ipType?: IpType;
  lineType?: LineType;
}

// 节点统计信息
export interface NodeStats {
  total: number;
  online: number;
  byType: Record<ServiceType, number>;
  byIpType?: Record<IpType, number>;
  byLineType?: Record<LineType, number>;
}

// ISP信息
export interface ISP {
  id: string;
  name: string;
  country: string;
  type: 'starlink' | 'cable' | 'fiber' | 'mobile';
  reputation: number;
  features: string[];
}
