// Node API
import request from '@/utils/request';
import type { PaginationResult } from '@/types/index';
import type { Node, NodeConfig, NodeListParams } from '@/types/node';

/**
 * Get node list
 * @param params Query params
 * @returns Node list
 */
export const getNodeList = (
  params?: NodeListParams
): Promise<PaginationResult<Node>> => {
  return request.get('/nodes', { params });
};

/**
 * Get node config
 * @param id Node ID
 * @returns Node config
 */
export const getNodeConfig = (id: string): Promise<NodeConfig> => {
  return request.get(`/nodes/${id}/config`);
};

/**
 * Test node latency
 * @param id Node ID
 * @returns Latency result (ms)
 */
export const testNodeLatency = (
  id: string
): Promise<{ latency: number }> => {
  return request.get(`/nodes/${id}/latency`);
};


