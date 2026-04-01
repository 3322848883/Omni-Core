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
  keyword?: string;
  status?: number;
  userId?: string;
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
