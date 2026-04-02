import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { db } from '../database';
import bcrypt from 'bcryptjs';

// 模拟express应用
import express from 'express';
import { orderRoutes } from '../routes/orders';
import { userRoutes } from '../routes/users';
import { authRoutes } from '../routes/auth';
import { errorHandler } from '../middlewares/errorHandler';
import { requestLogger } from '../middlewares/requestLogger';
import { authMiddleware } from '../middlewares/auth';

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/users', userRoutes);
app.use(errorHandler);

// 模拟依赖
vi.mock('../middlewares/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 1, username: 'test-admin' };
    next();
  }
}));

vi.mock('../services/payment', () => ({
  createPayment: vi.fn(() => ({
    provider: 'test',
    clientSecret: 'test-secret',
    checkoutUrl: 'http://example.com/checkout',
    paymentIntentId: 'test-intent'
  })),
  processRefund: vi.fn(() => ({
    success: true,
    refundId: 'test-refund',
    amount: 99.99,
    status: 'completed'
  })),
  getPaymentStatus: vi.fn(() => ({
    status: 'completed',
    amount: 99.99,
    currency: 'USD',
    paidAt: new Date(),
    providerOrderId: 'test-provider-order'
  })),
  getAvailableProviders: vi.fn(() => ['test']),
  getQRCodeInfo: vi.fn(() => ({
    qrCodeUrl: 'http://example.com/qr',
    receiverName: 'Test Receiver',
    instructions: 'Scan QR code to pay'
  }))
}));

vi.mock('../services/email', () => ({
  emailService: {
    isEmailConfigured: vi.fn(() => false),
    sendPaymentSuccessNotification: vi.fn(() => Promise.resolve())
  }
}));

// 测试用户数据
const testUser = {
  userId: `usr_${Date.now()}_test`,
  email: `test_${Date.now()}@example.com`,
  username: `test_user_${Date.now()}`,
  password: 'TestPassword123',
  status: 1,
  trafficLimit: 10737418240, // 10GB
  trafficUsed: 0,
  expireDate: null
};

// 测试订单数据
const testOrder = {
  userId: '', // 会在测试中设置
  orderType: 'premium',
  amount: 99.99,
  trafficLimit: 107374182400, // 100GB
  durationDays: 30
};

describe('Integration Tests - Order and User Systems', () => {
  let authToken: string;
  let createdOrderId: string;

  beforeEach(async () => {
    // 清除测试数据
    await db('orders').where('user_id', testUser.userId).del();
    await db('users').where('user_id', testUser.userId).del();

    // 创建测试用户
    const passwordHash = await bcrypt.hash(testUser.password, 10);
    await db('users').insert({
      user_id: testUser.userId,
      email: testUser.email,
      username: testUser.username,
      password_hash: passwordHash,
      vpn_uuid: `vpn_${Date.now()}`,
      status: testUser.status,
      traffic_limit: testUser.trafficLimit,
      traffic_used: testUser.trafficUsed,
      expire_date: testUser.expireDate
    });

    // 获取认证令牌
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    authToken = loginResponse.body.data.token;
    testOrder.userId = testUser.userId;
  });

  afterEach(async () => {
    // 清理测试数据
    await db('orders').where('user_id', testUser.userId).del();
    await db('users').where('user_id', testUser.userId).del();
  });

  it('should create an order and associate it with a user', async () => {
    // 创建订单
    const createOrderResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testOrder);

    expect(createOrderResponse.status).toBe(201);
    expect(createOrderResponse.body.success).toBe(true);
    expect(createOrderResponse.body.data.userId).toBe(testUser.userId);
    expect(createOrderResponse.body.data.status).toBe('pending');

    createdOrderId = createOrderResponse.body.data.id;

    // 验证订单存在
    const getOrderResponse = await request(app)
      .get(`/api/v1/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getOrderResponse.status).toBe(200);
    expect(getOrderResponse.body.success).toBe(true);
    expect(getOrderResponse.body.data.userId).toBe(testUser.userId);
  });

  it('should process payment and update user traffic and expire date', async () => {
    // 创建订单
    const createOrderResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testOrder);

    createdOrderId = createOrderResponse.body.data.id;

    // 处理支付
    const payOrderResponse = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/pay`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ paymentMethod: 'test' });

    expect(payOrderResponse.status).toBe(200);
    expect(payOrderResponse.body.success).toBe(true);

    // 验证订单状态更新
    const getOrderResponse = await request(app)
      .get(`/api/v1/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getOrderResponse.body.data.status).toBe('completed');

    // 验证用户流量和过期时间更新
    const getUserResponse = await request(app)
      .get(`/api/v1/users/${testUser.userId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getUserResponse.body.data.trafficLimit).toBe(testUser.trafficLimit + testOrder.trafficLimit);
    expect(getUserResponse.body.data.expireDate).not.toBeNull();
  });

  it('should refund order and deduct user traffic', async () => {
    // 创建订单
    const createOrderResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testOrder);

    createdOrderId = createOrderResponse.body.data.id;

    // 处理支付
    await request(app)
      .post(`/api/v1/orders/${createdOrderId}/pay`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ paymentMethod: 'test' });

    // 退款
    const refundResponse = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/refund`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Test refund' });

    expect(refundResponse.status).toBe(200);
    expect(refundResponse.body.success).toBe(true);

    // 验证订单状态更新
    const getOrderResponse = await request(app)
      .get(`/api/v1/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getOrderResponse.body.data.status).toBe('refunded');

    // 验证用户流量扣除
    const getUserResponse = await request(app)
      .get(`/api/v1/users/${testUser.userId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getUserResponse.body.data.trafficLimit).toBe(testUser.trafficLimit);
  });

  it('should get user orders', async () => {
    // 创建订单
    const createOrderResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testOrder);

    // 获取用户订单
    const getUserOrdersResponse = await request(app)
      .get(`/api/v1/users/${testUser.userId}/orders`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getUserOrdersResponse.status).toBe(200);
    expect(getUserOrdersResponse.body.success).toBe(true);
    expect(getUserOrdersResponse.body.data.items.length).toBeGreaterThan(0);
    expect(getUserOrdersResponse.body.data.items[0].userId).toBe(testUser.userId);
  });

  it('should cancel pending order', async () => {
    // 创建订单
    const createOrderResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testOrder);

    createdOrderId = createOrderResponse.body.data.id;

    // 取消订单
    const cancelResponse = await request(app)
      .post(`/api/v1/orders/${createdOrderId}/cancel`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reason: 'Test cancellation' });

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.success).toBe(true);

    // 验证订单状态更新
    const getOrderResponse = await request(app)
      .get(`/api/v1/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getOrderResponse.body.data.status).toBe('cancelled');
  });
});
