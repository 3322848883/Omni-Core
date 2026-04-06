import request from '@utils/request';
import type { Order, OrderQuery, OrderListResponse, OrderStats, PendingOrderQuery, PendingOrderListResponse } from '../types/order';

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

/**
 * 获取待确认订单列表
 * @param params 查询参数
 */
export const getPendingConfirmationOrders = (params: PendingOrderQuery): Promise<PendingOrderListResponse> => {
  return request.get('/orders/pending-confirmation', { params });
};

/**
 * 确认订单收款
 * @param orderId 订单ID
 * @param remark 备注（可选）
 */
export const confirmOrderPayment = (orderId: string, remark?: string): Promise<void> => {
  return request.post(`/orders/${orderId}/confirm`, { remark });
};

/**
 * 拒绝订单收款
 * @param orderId 订单ID
 * @param reason 拒绝原因
 */
export const rejectOrderPayment = (orderId: string, reason: string): Promise<void> => {
  return request.post(`/orders/${orderId}/reject`, { reason });
};