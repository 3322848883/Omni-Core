import request from '@utils/request';
import type {
  InviteCode,
  InviteQuery,
  InviteListResponse,
  InviteRecordQuery,
  InviteRecordListResponse,
  InviteStats,
  CreateInviteCodeData,
} from '../types/invite';

export const getInviteCodes = (params: InviteQuery): Promise<InviteListResponse> => {
  return request.get('/invites', { params });
};

export const getInviteCodeById = (id: string): Promise<InviteCode> => {
  return request.get(`/invites/${id}`);
};

export const createInviteCode = (data: CreateInviteCodeData): Promise<InviteCode> => {
  return request.post('/invites', data);
};

export const updateInviteCode = (id: string, data: Partial<CreateInviteCodeData>): Promise<InviteCode> => {
  return request.put(`/invites/${id}`, data);
};

export const deleteInviteCode = (id: string): Promise<void> => {
  return request.delete(`/invites/${id}`);
};

export const enableInviteCode = (id: string): Promise<void> => {
  return request.post(`/invites/${id}/enable`);
};

export const disableInviteCode = (id: string): Promise<void> => {
  return request.post(`/invites/${id}/disable`);
};

export const getInviteRecords = (params: InviteRecordQuery): Promise<InviteRecordListResponse> => {
  return request.get('/invites/records', { params });
};

export const getInviteStats = (): Promise<InviteStats> => {
  return request.get('/invites/stats');
};