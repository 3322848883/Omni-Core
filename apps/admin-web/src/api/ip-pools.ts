import request from '@utils/request';
import type {
  IpPool,
  IpPoolDetail,
  IpPoolQuery,
  IpPoolListResponse,
  IpPoolFormData,
  RotationStrategyOption,
  IpPoolStats,
} from '../types/ip-pool';

export const getIpPools = (params: IpPoolQuery): Promise<IpPoolListResponse> => {
  return request.get('/ip-pools', { params });
};

export const getIpPoolById = (id: string): Promise<IpPoolDetail> => {
  return request.get(`/ip-pools/${id}`);
};

export const createIpPool = (data: IpPoolFormData): Promise<IpPool> => {
  return request.post('/ip-pools', data);
};

export const updateIpPool = (id: string, data: Partial<IpPoolFormData>): Promise<IpPool> => {
  return request.put(`/ip-pools/${id}`, data);
};

export const deleteIpPool = (id: string): Promise<void> => {
  return request.delete(`/ip-pools/${id}`);
};

export const enableIpPool = (id: string): Promise<void> => {
  return request.post(`/ip-pools/${id}/enable`);
};

export const disableIpPool = (id: string): Promise<void> => {
  return request.post(`/ip-pools/${id}/disable`);
};

export const rotateIpPool = (id: string): Promise<void> => {
  return request.post(`/ip-pools/${id}/rotate`);
};

export const refreshIpScores = (id: string): Promise<void> => {
  return request.post(`/ip-pools/${id}/refresh-scores`);
};

export const getRotationStrategies = (): Promise<RotationStrategyOption[]> => {
  return request.get('/meta/rotation-strategies');
};

export const getIpPoolStats = (): Promise<IpPoolStats> => {
  return request.get('/ip-pools/stats');
};

export const addIpToPool = (id: string, ip: string): Promise<void> => {
  return request.post(`/ip-pools/${id}/ips`, { ip });
};

export const removeIpFromPool = (id: string, ipId: string): Promise<void> => {
  return request.delete(`/ip-pools/${id}/ips/${ipId}`);
};
