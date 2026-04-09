/**
 * IP池管理API接口测试
 * 测试IP池路由的所有端点
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { ipPoolRoutes } from '../ip-pools';

// Mock认证中间件
jest.mock('../../middlewares/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'admin-123', username: 'admin', role: 'admin' };
    next();
  }
}));

// MockIP池服务
const mockIPPoolService: any = {
  listIPPools: jest.fn(),
  getIPPool: jest.fn(),
  getIPPoolStatus: jest.fn(),
  createIPPool: jest.fn(),
  updateIPPool: jest.fn(),
  deleteIPPool: jest.fn(),
  manualRotate: jest.fn(),
  addIPToPool: jest.fn(),
  removeIPFromPool: jest.fn(),
  refreshIPScores: jest.fn(),
  setPoolActive: jest.fn()
};

jest.mock('../../services/ip-pool', () => ({
  getIPPoolService: jest.fn(() => mockIPPoolService)
}));

// Mock数据库
const mockDb: any = {
  where: jest.fn().mockReturnThis(),
  first: jest.fn(),
  select: jest.fn().mockReturnThis(),
  raw: jest.fn((str) => str)
};

// Reset mock before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockDb.first.mockResolvedValue(null);
});

jest.mock('../../database', () => ({
  db: jest.fn(() => mockDb)
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('IP Pool Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/v1/ip-pools', ipPoolRoutes);
    
    // 错误处理中间件
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(err.statusCode || 500).json({
        success: false,
        code: err.statusCode || 500,
        message: err.message || 'Internal server error'
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/v1/ip-pools', () => {
    it('应该返回IP池列表', async () => {
      mockIPPoolService.listIPPools.mockResolvedValueOnce({
        items: [
          {
            id: 'pool-1',
            name: 'Test Pool',
            nodeId: 'node-1',
            ipType: 'datacenter',
            rotationStrategy: 'round_robin',
            rotationInterval: 3600,
            currentIndex: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        total: 1,
        page: 1,
        limit: 20
      });

      mockDb.first.mockResolvedValueOnce({
        code: 'NODE001',
        name: 'Test Node',
        status: 'online'
      });

      mockDb.first.mockResolvedValueOnce({
        total: 5,
        active: 4,
        blocked: 1
      });

      const response = await request(app)
        .get('/api/v1/ip-pools')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('应该支持分页参数', async () => {
      mockIPPoolService.listIPPools.mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 2,
        limit: 10
      });

      const response = await request(app)
        .get('/api/v1/ip-pools?page=2&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockIPPoolService.listIPPools).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 10 })
      );
    });

    it('应该支持按节点ID筛选', async () => {
      mockIPPoolService.listIPPools.mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        limit: 20
      });

      await request(app)
        .get('/api/v1/ip-pools?nodeId=node-123')
        .expect(200);

      expect(mockIPPoolService.listIPPools).toHaveBeenCalledWith(
        expect.objectContaining({ nodeId: 'node-123' })
      );
    });
  });

  describe('GET /api/v1/ip-pools/:id', () => {
    it('应该返回IP池详情', async () => {
      const poolId = 'pool-123';
      
      mockIPPoolService.getIPPoolStatus.mockResolvedValueOnce({
        pool: {
          id: poolId,
          name: 'Test Pool',
          nodeId: 'node-1',
          ipType: 'datacenter',
          rotationStrategy: 'round_robin',
          rotationInterval: 3600,
          currentIndex: 0,
          lastRotationAt: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        ips: [
          {
            id: 'ip-1',
            ip: '192.168.1.1',
            status: 'active',
            score: 85,
            usageCount: 10,
            assignedAt: new Date(),
            releasedAt: null,
            createdAt: new Date()
          }
        ],
        activeIpCount: 1,
        blockedIpCount: 0,
        currentIp: '192.168.1.1',
        nextRotationAt: new Date(Date.now() + 3600000)
      });

      mockDb.first.mockResolvedValueOnce({
        code: 'NODE001',
        name: 'Test Node',
        status: 'online',
        current_ip: '192.168.1.1'
      });

      const response = await request(app)
        .get(`/api/v1/ip-pools/${poolId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(poolId);
      expect(response.body.data.ips).toHaveLength(1);
    });

    it('应该返回404当IP池不存在', async () => {
      mockIPPoolService.getIPPoolStatus.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/v1/ip-pools/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('POST /api/v1/ip-pools', () => {
    it('应该成功创建IP池', async () => {
      const poolData = {
        name: 'New Pool',
        nodeId: 'node-123',
        ipType: 'datacenter',
        ips: ['192.168.1.1', '192.168.1.2'],
        rotationStrategy: 'round_robin',
        rotationInterval: 86400
      };

      mockDb.first.mockResolvedValueOnce({
        id: 'node-123',
        name: 'Test Node',
        ip_pool_id: null
      });

      mockIPPoolService.createIPPool.mockResolvedValueOnce({
        id: 'pool-new-123',
        name: poolData.name,
        nodeId: poolData.nodeId,
        ipType: poolData.ipType,
        rotationStrategy: poolData.rotationStrategy,
        rotationInterval: poolData.rotationInterval,
        currentIndex: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .post('/api/v1/ip-pools')
        .send(poolData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(poolData.name);
    });

    it('应该拒绝缺少必填字段的请求', async () => {
      const response = await request(app)
        .post('/api/v1/ip-pools')
        .send({
          name: 'Incomplete Pool'
          // 缺少其他必填字段
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该拒绝无效的IP类型', async () => {
      const response = await request(app)
        .post('/api/v1/ip-pools')
        .send({
          name: 'Test Pool',
          nodeId: 'node-123',
          ipType: 'invalid_type',
          ips: ['192.168.1.1']
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该拒绝无效的IP地址', async () => {
      mockDb.first.mockResolvedValueOnce({
        id: 'node-123',
        name: 'Test Node',
        ip_pool_id: null
      });

      const response = await request(app)
        .post('/api/v1/ip-pools')
        .send({
          name: 'Test Pool',
          nodeId: 'node-123',
          ipType: 'datacenter',
          ips: ['invalid-ip', '192.168.1.1']
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该拒绝为已有IP池的节点创建新池', async () => {
      mockDb.first.mockResolvedValueOnce({
        id: 'node-123',
        name: 'Test Node',
        ip_pool_id: 'existing-pool'
      });

      const response = await request(app)
        .post('/api/v1/ip-pools')
        .send({
          name: 'Test Pool',
          nodeId: 'node-123',
          ipType: 'datacenter',
          ips: ['192.168.1.1']
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/ip-pools/:id', () => {
    it('应该成功更新IP池', async () => {
      const poolId = 'pool-123';
      const updateData = {
        name: 'Updated Pool',
        rotationInterval: 7200
      };

      mockIPPoolService.getIPPool.mockResolvedValueOnce({
        id: poolId,
        name: 'Original Pool',
        nodeId: 'node-123'
      });

      mockIPPoolService.updateIPPool.mockResolvedValueOnce({
        id: poolId,
        name: updateData.name,
        rotationInterval: updateData.rotationInterval
      });

      const response = await request(app)
        .put(`/api/v1/ip-pools/${poolId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('应该返回404当IP池不存在', async () => {
      mockIPPoolService.getIPPool.mockResolvedValueOnce(null);

      const response = await request(app)
        .put('/api/v1/ip-pools/non-existent')
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('应该拒绝无效的轮换策略', async () => {
      const poolId = 'pool-123';

      mockIPPoolService.getIPPool.mockResolvedValueOnce({
        id: poolId,
        name: 'Test Pool'
      });

      const response = await request(app)
        .put(`/api/v1/ip-pools/${poolId}`)
        .send({ rotationStrategy: 'invalid_strategy' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/ip-pools/:id', () => {
    it('应该成功删除IP池', async () => {
      const poolId = 'pool-123';

      mockIPPoolService.getIPPool.mockResolvedValueOnce({
        id: poolId,
        name: 'Test Pool'
      });

      mockIPPoolService.deleteIPPool.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .delete(`/api/v1/ip-pools/${poolId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该返回404当IP池不存在', async () => {
      mockIPPoolService.getIPPool.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete('/api/v1/ip-pools/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/ip-pools/:id/rotate', () => {
    it('应该成功轮换IP', async () => {
      const poolId = 'pool-123';

      mockIPPoolService.getIPPool.mockResolvedValueOnce({
        id: poolId,
        name: 'Test Pool'
      });

      mockIPPoolService.manualRotate.mockResolvedValueOnce({
        success: true,
        poolId,
        previousIp: '192.168.1.1',
        newIp: '192.168.1.2',
        rotatedAt: new Date()
      });

      const response = await request(app)
        .post(`/api/v1/ip-pools/${poolId}/rotate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.previousIp).toBe('192.168.1.1');
      expect(response.body.data.newIp).toBe('192.168.1.2');
    });

    it('应该处理轮换失败', async () => {
      const poolId = 'pool-123';

      mockIPPoolService.getIPPool.mockResolvedValueOnce({
        id: poolId,
        name: 'Test Pool'
      });

      mockIPPoolService.manualRotate.mockResolvedValueOnce({
        success: false,
        poolId,
        error: 'No available IP'
      });

      const response = await request(app)
        .post(`/api/v1/ip-pools/${poolId}/rotate`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/ip-pools/:id/ips', () => {
    it('应该成功添加IP到池', async () => {
      const poolId = 'pool-123';
      const ipData = { ip: '192.168.1.100' };

      mockIPPoolService.getIPPool.mockResolvedValueOnce({
        id: poolId,
        name: 'Test Pool'
      });

      mockIPPoolService.addIPToPool.mockResolvedValueOnce({
        id: 'ip-new-123',
        poolId,
        ip: ipData.ip,
        status: 'active',
        score: 85,
        createdAt: new Date()
      });

      const response = await request(app)
        .post(`/api/v1/ip-pools/${poolId}/ips`)
        .send(ipData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ip).toBe(ipData.ip);
    });

    it('应该拒绝无效的IP地址', async () => {
      const poolId = 'pool-123';

      const response = await request(app)
        .post(`/api/v1/ip-pools/${poolId}/ips`)
        .send({ ip: 'invalid-ip' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该拒绝缺少IP地址', async () => {
      const poolId = 'pool-123';

      const response = await request(app)
        .post(`/api/v1/ip-pools/${poolId}/ips`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/ip-pools/:id/ips/:ipId', () => {
    it('应该成功从池中移除IP', async () => {
      const poolId = 'pool-123';
      const ipId = 'ip-456';

      mockIPPoolService.getIPPool.mockResolvedValueOnce({
        id: poolId,
        name: 'Test Pool'
      });

      mockDb.first.mockResolvedValueOnce({
        id: ipId,
        ip: '192.168.1.100'
      });

      mockIPPoolService.removeIPFromPool.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .delete(`/api/v1/ip-pools/${poolId}/ips/${ipId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('应该返回404当IP不存在', async () => {
      const poolId = 'pool-123';
      const ipId = 'non-existent-ip';

      mockIPPoolService.getIPPool.mockResolvedValueOnce({
        id: poolId,
        name: 'Test Pool'
      });

      mockDb.first.mockResolvedValueOnce(null);

      const response = await request(app)
        .delete(`/api/v1/ip-pools/${poolId}/ips/${ipId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/ip-pools/:id/refresh-scores', () => {
    it('应该成功刷新IP评分', async () => {
      const poolId = 'pool-123';

      mockIPPoolService.getIPPool.mockResolvedValueOnce({
        id: poolId,
        name: 'Test Pool'
      });

      mockIPPoolService.refreshIPScores.mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post(`/api/v1/ip-pools/${poolId}/refresh-scores`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/ip-pools/meta/rotation-strategies', () => {
    it('应该返回轮换策略列表', async () => {
      const response = await request(app)
        .get('/api/v1/ip-pools/meta/rotation-strategies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('value');
      expect(response.body.data[0]).toHaveProperty('label');
      expect(response.body.data[0]).toHaveProperty('description');
    });
  });
});

describe('IP Pool Routes - 边界条件', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/v1/ip-pools', ipPoolRoutes);
    
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(err.statusCode || 500).json({
        success: false,
        code: err.statusCode || 500,
        message: err.message || 'Internal server error'
      });
    });
  });

  it('应该处理空IP列表', async () => {
    mockDb.first.mockResolvedValueOnce({
      id: 'node-123',
      name: 'Test Node',
      ip_pool_id: null
    });

    const response = await request(app)
      .post('/api/v1/ip-pools')
      .send({
        name: 'Test Pool',
        nodeId: 'node-123',
        ipType: 'datacenter',
        ips: []
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('应该处理大量IP地址', async () => {
    const manyIps = Array.from({ length: 100 }, (_, i) => `192.168.1.${i + 1}`);

    mockDb.first.mockResolvedValueOnce({
      id: 'node-123',
      name: 'Test Node',
      ip_pool_id: null
    });

    mockIPPoolService.createIPPool.mockResolvedValueOnce({
      id: 'pool-large-123',
      name: 'Large Pool',
      nodeId: 'node-123'
    });

    const response = await request(app)
      .post('/api/v1/ip-pools')
      .send({
        name: 'Large Pool',
        nodeId: 'node-123',
        ipType: 'datacenter',
        ips: manyIps
      })
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});
