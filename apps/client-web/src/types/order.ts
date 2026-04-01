// Order Types
import type { PaginationParams } from './index';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export interface Order {
  id: string;
  orderNo: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreateOrderData {
  planId: string;
  period?: string;
  paymentMethod?: string;
  couponCode?: string;
}

export interface OrderListParams extends PaginationParams {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}
