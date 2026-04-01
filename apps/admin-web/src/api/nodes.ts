import request from '@utils/request';
import type {
  Node,
  NodeQuery,
  NodeListResponse,
  NodeStats,
  NodeFormData,
  IpMetadata,
  IpCheckResult,
  IpScoreRefreshResult,
  IpAsset,
} from '../types/node';

export const getNodes = async (params: NodeQuery & { serviceTypes?: string[] }): Promise<NodeListResponse> => {
  // Convert serviceTypes array to serviceType string for backend compatibility
  const convertedParams: Record<string, any> = { ...params };
  if (params.serviceTypes && params.serviceTypes.length > 0) {
    convertedParams.serviceType = params.serviceTypes[0];
    delete convertedParams.serviceTypes;
  }
  const res = await request.get('/nodes', { params: convertedParams });
  // Convert backend response format to frontend expected format
  return {
    list: res.items || [],
    total: res.pagination?.total || 0,
    page: res.pagination?.page || 1,
    pageSize: res.pagination?.limit || 20,
  };
};

export const getNodeById = (id: string): Promise<Node> => {
  return request.get(`/nodes/${id}`);
};

export const createNode = (data: NodeFormData): Promise<Node> => {
  return request.post('/nodes', data);
};

export const updateNode = (id: string, data: Partial<NodeFormData>): Promise<Node> => {
  return request.put(`/nodes/${id}`, data);
};

export const deleteNode = (id: string): Promise<void> => {
  return request.delete(`/nodes/${id}`);
};

export const enableNode = (id: string): Promise<void> => {
  return request.post(`/nodes/${id}/enable`);
};

export const disableNode = (id: string): Promise<void> => {
  return request.post(`/nodes/${id}/disable`);
};

export const getNodeStats = (): Promise<NodeStats> => {
  return request.get('/nodes/stats/overview');
};

export const testNodeConnection = (id: string): Promise<{ success: boolean; latency: number }> => {
  return request.post(`/nodes/${id}/test`);
};

export const batchUpdateNodes = (ids: string[], data: Partial<Node>): Promise<void> => {
  return request.post('/nodes/batch', { ids, data });
};

// IP Asset related APIs

/**
 * 获取 IP 元数据（IP类型、线路类型、ISP列表）
 */
export const getIpMetadata = (): Promise<IpMetadata> => {
  return request.get('/meta/ip-metadata');
};

/**
 * 获取 IP 类型选项
 */
export const getIpTypes = (): Promise<IpMetadata['ipTypes']> => {
  return request.get('/meta/ip-types');
};

/**
 * 获取线路类型选项
 */
export const getLineTypes = (): Promise<IpMetadata['lineTypes']> => {
  return request.get('/meta/line-types');
};

/**
 * 获取 ISP 列表
 */
export const getIsps = (params?: { country?: string; type?: string }): Promise<IpMetadata['isps']> => {
  return request.get('/isps', { params });
};

/**
 * 检测节点 IP
 */
export const checkNodeIp = (id: string): Promise<IpCheckResult> => {
  return request.post(`/nodes/${id}/check-ip`);
};

/**
 * 刷新节点 IP 评分
 */
export const refreshNodeIpScore = (id: string): Promise<IpScoreRefreshResult> => {
  return request.post(`/nodes/${id}/refresh-ip-score`);
};

/**
 * 获取节点 IP 资产详情
 */
export const getNodeIpAssets = (id: string): Promise<IpAsset[]> => {
  return request.get(`/nodes/${id}/ip-assets`);
};

/**
 * 批量检测节点 IP
 */
export const batchCheckNodeIps = (ids: string[]): Promise<Record<string, IpCheckResult>> => {
  return request.post('/nodes/batch-check-ip', { ids });
};

/**
 * 批量刷新节点 IP 评分
 */
export const batchRefreshNodeIpScores = (ids: string[]): Promise<Record<string, IpScoreRefreshResult>> => {
  return request.post('/nodes/batch-refresh-ip-score', { ids });
};
