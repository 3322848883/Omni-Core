import request from '@utils/request';
import type { User, UserQuery, UserListResponse } from '../types/user';

export const getUsers = (params: UserQuery): Promise<UserListResponse> => {
  return request.get('/users', { params });
};

export const getUserById = (id: string): Promise<User> => {
  return request.get(`/users/${id}`);
};

export const createUser = (data: Partial<User>): Promise<User> => {
  return request.post('/users', data);
};

export const updateUser = (id: string, data: Partial<User>): Promise<User> => {
  return request.put(`/users/${id}`, data);
};

export const deleteUser = (id: string): Promise<void> => {
  return request.delete(`/users/${id}`);
};

export const banUser = (id: string): Promise<void> => {
  return request.post(`/users/${id}/ban`);
};

export const unbanUser = (id: string): Promise<void> => {
  return request.post(`/users/${id}/unban`);
};

export const getUserTraffic = (id: string, params?: { startDate?: string; endDate?: string }) => {
  return request.get(`/users/${id}/traffic`, { params });
};

export const getUserOrders = (id: string, params?: { page?: number; limit?: number }) => {
  return request.get(`/users/${id}/orders`, { params });
};