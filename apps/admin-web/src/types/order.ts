export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  username: string;
  email: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: number; // 1-pending, 2-paid, 3-cancelled, 4-refunded
  paymentMethod: string;
  trafficLimit: number;
  duration: number; // days
  startDate?: string;
  endDate?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderQuery {
  page?: number;
  pageSize?: number;
  limit?: number;
  keyword?: string;
  orderNo?: string;
  username?: string;
  status?: number;
  userId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderListResponse {
  list: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrderStats {
  totalOrders: number;
  totalAmount: number;
  todayOrders: number;
  todayAmount: number;
  pendingOrders: number;
}

/**
 * 待确认订单
 */
export interface PendingConfirmationOrder {
  id: string;
  orderNo: string;
  userId: string;
  username: string;
  email: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentProofUrl?: string;
  userRemark?: string;
  trafficLimit: number;
  duration: number; // days
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 待确认订单查询参数
 */
export interface PendingOrderQuery {
  page?: number;
  pageSize?: number;
  limit?: number;
  keyword?: string;
  orderNo?: string;
  username?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 待确认订单列表响应
 */
export interface PendingOrderListResponse {
  list: PendingConfirmationOrder[];
  total: number;
  page: number;
  pageSize: number;
}
