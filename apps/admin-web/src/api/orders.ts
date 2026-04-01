import request from '@utils/request';
import type { Order, OrderQuery, OrderListResponse, OrderStats } from '../types/order';

export const getOrders = (params: OrderQuery): Promise<OrderListResponse> => {
  return request.get('/orders', { params });
};

export const getOrderById = (id: string): Promise<Order> => {
  return request.get(`/orders/${id}`);
};

export const createOrder = (data: Partial<Order>): Promise<Order> => {
  return request.post('/orders', data);
};

export const updateOrder = (id: string, data: Partial<Order>): Promise<Order> => {
  return request.put(`/orders/${id}`, data);
};

export const deleteOrder = (id: string): Promise<void> => {
  return request.delete(`/orders/${id}`);
};

export const payOrder = (id: string): Promise<void> => {
  return request.post(`/orders/${id}/pay`);
};

export const cancelOrder = (id: string): Promise<void> => {
  return request.post(`/orders/${id}/cancel`);
};

export const refundOrder = (id: string): Promise<void> => {
  return request.post(`/orders/${id}/refund`);
};

export const getOrderStats = (): Promise<OrderStats> => {
  return request.get('/orders/stats');
};