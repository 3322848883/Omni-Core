import { request } from '@/utils/request';
import type { PaginationResult } from '@/types/index';
import type { Order, CreateOrderData, OrderListParams } from '@/types/order';

export interface PaymentInfo {
  orderId: string;
  orderNo: string;
  amount: number;
  paymentMethod: string;
  paymentUrl?: string;
  qrCode?: string;
  expiresAt: string;
}

export interface OrderStats {
  totalOrders: number;
  totalAmount: number;
  pendingOrders: number;
  completedOrders: number;
}

// Get user orders
export async function getOrderList(
  params?: OrderListParams
): Promise<PaginationResult<Order>> {
  // request.get already unwraps the response, returns data directly
  return await request.get<PaginationResult<Order>>('/orders', { params });
}

// Get order by ID
export function getOrderDetail(orderId: string): Promise<Order> {
  return request.get(`/orders/${orderId}`);
}

// Create order
export function createOrder(data: CreateOrderData): Promise<Order> {
  return request.post('/orders', data);
}

// Pay order
export function payOrder(
  id: string,
  method: string
): Promise<{ payment_url: string }> {
  return request.post(`/orders/${id}/pay`, { method });
}

// Cancel order
export async function cancelOrder(orderId: string, reason?: string): Promise<void> {
  await request.post(`/orders/${orderId}/cancel`, { reason });
}

// Get payment info
export async function getPaymentInfo(orderId: string): Promise<PaymentInfo> {
  return await request.get<PaymentInfo>(`/orders/${orderId}/payment`);
}

// Verify payment
export function verifyPayment(orderId: string): Promise<void> {
  return request.post(`/orders/${orderId}/verify-payment`);
}

// Get order statistics
export async function getOrderStats(): Promise<OrderStats> {
  return await request.get<OrderStats>('/orders/stats');
}
