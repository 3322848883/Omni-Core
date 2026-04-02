import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { orderRoutes } from '../routes/orders';
import { userRoutes } from '../routes/users';
import { authRoutes } from '../routes/auth';
import { errorHandler } from '../middlewares/errorHandler';
import { requestLogger } from '../middlewares/requestLogger';

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/users', userRoutes);
app.use(errorHandler);

describe('Performance Tests', () => {
  it('should respond to API requests within acceptable time', async () => {
    const startTime = Date.now();
    
    // 测试获取支付提供商列表的响应时间
    const response = await request(app).get('/api/v1/orders/payment/providers');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(1000); // 响应时间应小于1秒
  });

  it('should handle multiple concurrent requests', async () => {
    const requestCount = 10;
    const requests = [];
    
    for (let i = 0; i < requestCount; i++) {
      requests.push(
        request(app).get('/api/v1/orders/payment/providers')
      );
    }
    
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    const totalTime = endTime - startTime;
    const averageTime = totalTime / requestCount;
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
    
    expect(averageTime).toBeLessThan(500); // 平均响应时间应小于500ms
  });
});
