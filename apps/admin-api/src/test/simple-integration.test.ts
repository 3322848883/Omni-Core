import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../database';
import bcrypt from 'bcryptjs';

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

describe('Simple Integration Tests - Order and User Systems', () => {
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

    testOrder.userId = testUser.userId;
  });

  afterEach(async () => {
    // 清理测试数据
    await db('orders').where('user_id', testUser.userId).del();
    await db('users').where('user_id', testUser.userId).del();
  });

  it('should create a user and verify it exists', async () => {
    // 验证用户创建成功
    const user = await db('users').where('user_id', testUser.userId).first();
    expect(user).toBeTruthy();
    expect(user.email).toBe(testUser.email);
    expect(user.username).toBe(testUser.username);
    expect(user.status).toBe(testUser.status);
  });

  it('should create an order and associate it with a user', async () => {
    // 生成订单号
    const generateOrderNo = () => {
      const date = new Date();
      const dateStr = date.getFullYear() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      return `ORD${dateStr}${random}`;
    };

    const orderNo = generateOrderNo();

    // 创建订单
    const [order] = await db('orders').insert({
      order_no: orderNo,
      user_id: testOrder.userId,
      order_type: testOrder.orderType,
      status: 'pending',
      amount: testOrder.amount,
      traffic_limit: testOrder.trafficLimit,
      duration_days: testOrder.durationDays,
      start_date: null,
      end_date: null,
      payment_method: null,
      payment_time: null
    }).returning('*');

    // 验证订单创建成功
    expect(order).toBeTruthy();
    expect(order.user_id).toBe(testOrder.userId);
    expect(order.status).toBe('pending');
    expect(order.amount).toBe(testOrder.amount);

    // 验证订单与用户关联
    const userOrders = await db('orders').where('user_id', testUser.userId).select('*');
    expect(userOrders.length).toBe(1);
    expect(userOrders[0].id).toBe(order.id);
  });

  it('should process payment and update user traffic', async () => {
    // 生成订单号
    const generateOrderNo = () => {
      const date = new Date();
      const dateStr = date.getFullYear() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      return `ORD${dateStr}${random}`;
    };

    const orderNo = generateOrderNo();

    // 创建订单
    const [order] = await db('orders').insert({
      order_no: orderNo,
      user_id: testOrder.userId,
      order_type: testOrder.orderType,
      status: 'pending',
      amount: testOrder.amount,
      traffic_limit: testOrder.trafficLimit,
      duration_days: testOrder.durationDays,
      start_date: null,
      end_date: null,
      payment_method: null,
      payment_time: null
    }).returning('*');

    // 处理支付
    const now = new Date();
    const startDate = now;
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (order.duration_days || 30));

    await db('orders')
      .where('id', order.id)
      .update({
        status: 'completed',
        payment_method: 'test',
        payment_time: now,
        start_date: startDate,
        end_date: endDate,
        updated_at: now
      });

    // 更新用户流量和过期时间
    await db('users')
      .where('user_id', order.user_id)
      .update({
        traffic_limit: db.raw('traffic_limit + ?', [order.traffic_limit]),
        expire_date: endDate,
        updated_at: now
      });

    // 验证订单状态更新
    const updatedOrder = await db('orders').where('id', order.id).first();
    expect(updatedOrder.status).toBe('completed');

    // 验证用户流量和过期时间更新
    const updatedUser = await db('users').where('user_id', testUser.userId).first();
    expect(updatedUser.traffic_limit).toBe(testUser.trafficLimit + testOrder.trafficLimit);
    expect(updatedUser.expire_date).not.toBeNull();
  });

  it('should refund order and deduct user traffic', async () => {
    // 生成订单号
    const generateOrderNo = () => {
      const date = new Date();
      const dateStr = date.getFullYear() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      return `ORD${dateStr}${random}`;
    };

    const orderNo = generateOrderNo();

    // 创建订单
    const [order] = await db('orders').insert({
      order_no: orderNo,
      user_id: testOrder.userId,
      order_type: testOrder.orderType,
      status: 'pending',
      amount: testOrder.amount,
      traffic_limit: testOrder.trafficLimit,
      duration_days: testOrder.durationDays,
      start_date: null,
      end_date: null,
      payment_method: null,
      payment_time: null
    }).returning('*');

    // 处理支付
    const now = new Date();
    const startDate = now;
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (order.duration_days || 30));

    await db('orders')
      .where('id', order.id)
      .update({
        status: 'completed',
        payment_method: 'test',
        payment_time: now,
        start_date: startDate,
        end_date: endDate,
        updated_at: now
      });

    // 更新用户流量和过期时间
    await db('users')
      .where('user_id', order.user_id)
      .update({
        traffic_limit: db.raw('traffic_limit + ?', [order.traffic_limit]),
        expire_date: endDate,
        updated_at: now
      });

    // 退款
    await db('orders')
      .where('id', order.id)
      .update({
        status: 'refunded',
        updated_at: new Date()
      });

    // 扣除用户流量
    await db('users')
      .where('user_id', order.user_id)
      .update({
        traffic_limit: db.raw('GREATEST(traffic_limit - ?, 0)', [order.traffic_limit]),
        updated_at: new Date()
      });

    // 验证订单状态更新
    const updatedOrder = await db('orders').where('id', order.id).first();
    expect(updatedOrder.status).toBe('refunded');

    // 验证用户流量扣除
    const updatedUser = await db('users').where('user_id', testUser.userId).first();
    expect(updatedUser.traffic_limit).toBe(testUser.trafficLimit);
  });
});
