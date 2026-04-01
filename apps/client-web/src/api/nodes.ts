import { request } from '@/utils/request';

// Connection config types
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

interface NodeConnectionConfig {
  id: string;
  name: string;
  protocol: string;
  host: string;
  port: number;
  config: {
    vless?: VlessConfig;
    vmess?: VmessConfig;
    trojan?: TrojanConfig;
    shadowsocks?: ShadowsocksConfig;
  };
  url: string;
}

interface ConnectionTestResult {
  nodeId: string;
  success: boolean;
  latency: number;
  message: string;
}

// Node type from API
interface ApiNode {
  id: string;
  name: string;
  location: string;
  country: string;
  countryFlag: string;
  status: 'online' | 'offline' | 'busy' | 'maintenance';
  latency?: number;
  load: number;
  protocols: string[];
  testing?: boolean;
  service_type: string;
  service_type_label: string;
  service_type_color: string;
  qos_level: number;
  is_premium: boolean;
  ip_type?: string;
  line_type?: string;
  isp_name?: string;
  isp_id?: string;
  ip_score?: number;
}

// Get all available nodes
export function getNodes() {
  return request.get<ApiNode[]>('/nodes');
}

// Get node by ID
export function getNodeById(nodeId: string) {
  return request.get<ApiNode>(`/nodes/${nodeId}`);
}

// Get node connection config
export function getNodeConfig(nodeId: string) {
  return request.get<NodeConnectionConfig>(`/nodes/${nodeId}/config`);
}

// Test node connection
export function testNodeConnection(nodeId: string) {
  return request.post<ConnectionTestResult>(`/nodes/${nodeId}/test`);
}

// Get all regions
export function getRegions() {
  return request.get<string[]>('/nodes/regions');
}

// Get recommended nodes
export function getRecommendedNodes() {
  return request.get<ApiNode[]>('/nodes/recommended');
}

// Get fastest node
export function getFastestNode() {
  return request.get<ApiNode>('/nodes/fastest');
}

// Test node (alias for testNodeConnection)
export function testNode(nodeId: string) {
  return request.post<{ latency: number }>(`/nodes/${nodeId}/test`);
}

// Get accessible nodes based on user's subscription
export function getAccessibleNodes() {
  return request.get<ApiNode[]>('/nodes/accessible');
}

// Get nodes with filters
export function getNodesWithFilters(params: {
  serviceType?: string;
  ipType?: string;
  lineType?: string;
  status?: string;
  region?: string;
}) {
  return request.get<ApiNode[]>('/nodes', { params });
}

// Get node statistics
export function getNodeStats() {
  return request.get<{
    total: number;
    online: number;
    byType: Record<string, number>;
    byIpType: Record<string, number>;
    byLineType: Record<string, number>;
  }>('/nodes/stats');
}
