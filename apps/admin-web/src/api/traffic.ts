import request from '@utils/request';
import type {
  TrafficQuery,
  TrafficListResponse,
  TrafficStats,
  TrafficOverview,
  NodeTrafficStats,
  UserTrafficStats,
} from '../types/traffic';

export const getTrafficRecords = (params: TrafficQuery): Promise<TrafficListResponse> => {
  return request.get('/traffic', { params });
};

export const getTrafficStats = (params: { startDate?: string; endDate?: string }): Promise<TrafficStats[]> => {
  return request.get('/traffic/stats', { params });
};

export const getTrafficOverview = (): Promise<TrafficOverview> => {
  return request.get('/traffic/overview');
};

export const getNodeTrafficStats = (params: { startDate?: string; endDate?: string }): Promise<NodeTrafficStats[]> => {
  return request.get('/traffic/nodes', { params });
};

export const getUserTrafficStats = (params: { startDate?: string; endDate?: string }): Promise<UserTrafficStats[]> => {
  return request.get('/traffic/users', { params });
};