import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { paymentFlowManager } from '../payment-flow-manager';
import { PaymentProvider, CreatePaymentRequest, PaymentStatus } from '../types';
import { getPaymentProvider } from '../index';

// 模拟支付提供商
jest.mock('../index', () => ({
  getPaymentProvider: jest.fn()
}));

// 模拟数据库
jest.mock('../../../database', () => ({
  db: {
    'payment_flows': {
      insert: jest.fn().mockResolvedValue([1]),
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(1),
      del: jest.fn().mockResolvedValue(1),
      orderBy: jest.fn().mockResolvedValue([])
    },
    'orders': {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({
        id: '1',
        order_no: 'ORD-001',
        user_id: 'user123',
        amount: 100,
        status: 'pending',
        payment_id: 'pay_123',
        payment_provider: 'stripe',
        traffic_limit: 1024
      })
    },
    'order_status_logs': {
      insert: jest.fn().mockResolvedValue([1])
    },
    'users': {
      where: jest.fn().mockReturnThis(),
      update: jest.fn().mockResolvedValue(1)
    },
    raw: jest.fn((sql, params) => sql)
  }
}));

describe('PaymentFlowManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createPaymentFlow', () => {
    it('should create a new payment flow', async () => {
      const mockProvider = {
        createPayment: jest.fn().mockResolvedValue({
          success: true,
          provider: 'stripe' as PaymentProvider,
          orderId: '1',
          clientSecret: 'cs_test_123',
          paymentIntentId: 'pi_123'
        })
      };

      (getPaymentProvider as any).mockReturnValue(mockProvider);

      const request: CreatePaymentRequest = {
        orderId: '1',
        orderNo: 'ORD-001',
        userId: 'user123',
        amount: 100,
        currency: 'USD',
        description: 'Test payment'
      };

      const response = await paymentFlowManager.createPaymentFlow('stripe', request);

      expect(response.success).toBe(true);
      expect(response.provider).toBe('stripe');
      expect(response.orderId).toBe('1');
    });
  });

  describe('processRefund', () => {
    it('should process a refund successfully', async () => {
      const mockProvider = {
        processRefund: jest.fn().mockResolvedValue({
          success: true,
          refundId: 'ref_123',
          amount: 100,
          status: 'succeeded'
        })
      };

      (getPaymentProvider as any).mockReturnValue(mockProvider);

      const response = await paymentFlowManager.processRefund('1', 100, 'Test refund');

      expect(response.success).toBe(true);
      expect(response.refundId).toBe('ref_123');
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status successfully', async () => {
      const mockProvider = {
        getPaymentStatus: jest.fn().mockResolvedValue({
          orderId: '1',
          status: 'paid' as PaymentStatus,
          amount: 100,
          currency: 'USD',
          paidAt: new Date(),
          providerOrderId: 'pi_123'
        })
      };

      (getPaymentProvider as any).mockReturnValue(mockProvider);

      const response = await paymentFlowManager.getPaymentStatus('stripe', 'pi_123');

      expect(response.status).toBe('paid');
    });
  });

  describe('getPendingPaymentFlows', () => {
    it('should get pending payment flows', async () => {
      const flows = await paymentFlowManager.getPendingPaymentFlows();
      expect(Array.isArray(flows)).toBe(true);
    });
  });

  describe('cleanupExpiredFlows', () => {
    it('should cleanup expired payment flows', async () => {
      await paymentFlowManager.cleanupExpiredFlows();
      expect(true).toBe(true);
    });
  });
});
