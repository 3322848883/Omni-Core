import { Order, PaymentInfo } from '@/types/user';
/**
 * Get orders list for user with pagination and optional status filter
 */
export declare const getOrders: (userId: string, page: number, limit: number, status?: string) => Promise<{
    orders: Order[];
    total: number;
}>;
/**
 * Get order by ID
 */
export declare const getOrderById: (orderId: string, userId: string) => Promise<Order>;
/**
 * Create a new order
 */
export declare const createOrder: (userId: string, planId: string, paymentMethod?: string) => Promise<Order>;
/**
 * Cancel an order
 */
export declare const cancelOrder: (orderId: string, userId: string) => Promise<Order>;
/**
 * Get payment information for an order
 */
export declare const getPaymentInfo: (orderId: string, userId: string) => Promise<PaymentInfo>;
/**
 * Verify payment status for an order
 */
export declare const verifyPayment: (orderId: string, userId: string) => Promise<{
    order: Order;
    paymentStatus: number;
}>;
//# sourceMappingURL=orderService.d.ts.map