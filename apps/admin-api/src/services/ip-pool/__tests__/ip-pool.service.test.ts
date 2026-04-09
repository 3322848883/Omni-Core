/**
 * IP池管理服务测试
 * 测试IPPoolService的所有功能
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { IPPoolService, getIPPoolService } from '../index';
import { IPPool, IPPoolConfig, IPPoolStatus } from '../../../shared/types/ip-assets';
import { IpType, RotationStrategy, IPScoreThresholds } from '../../../shared/constants/ip-assets';

// Mock依赖
const mockDb = {
  where: jest.fn().mockReturnThis(),
  first: jest.fn().mockResolvedValue(null),
  insert: jest.fn().mockResolvedValue([1]),
  update: jest.fn().mockResolvedValue(1),
  delete: jest.fn().mockResolvedValue(1),
  select: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  raw: jest.fn((str) => str)
};

jest.mock('../../../database', () => ({
  db: jest.fn(() => mockDb)
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('../../cache/redis', () => ({
  getRedisClient: jest.fn(() => ({
    getJSON: jest.fn().mockResolvedValue(null),
    setJSON: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('../../ip-reputation', () => ({
  getIPReputationService: jest.fn(() => ({
    checkIP: jest.fn().mockResolvedValue({
      ip: '192.168.1.1',
      score: 85,
      isResidential: true,
      isDatacenter: false,
      isVpn: false,
      isProxy: false,
      isTor: false,
      abuseRecords: 0,
      country: 'CN',
      isp: 'Test ISP',
      rawData: {},
      checkedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000)
    })
  }))
}));

describe('IPPoolService', () => {
  let service: IPPoolService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IPPoolService();
    // 重置mockDb的返回值
    mockDb.first.mockReset();
    mockDb.insert.mockReset();
    mockDb.update.mockReset();
    mockDb.delete.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('IP池创建', () => {
    it('应该成功创建IP池', async () => {
      const config: IPPoolConfig = {
        name: 'Test Pool',
        nodeId: 'node-123',
        ipType: IpType.DATACENTER,
        ips: ['192.168.1.1', '192.168.1.2'],
        rotationStrategy: RotationStrategy.ROUND_ROBIN,
        rotationInterval: 86400
      };

      mockDb.first.mockResolvedValueOnce(null); // 检查节点不存在IP池
      mockDb.insert.mockResolvedValueOnce([1]); // ip_pools插入
      mockDb.insert.mockResolvedValueOnce([1]); // ip_pool_ips插入
      mockDb.update.mockResolvedValueOnce(1); // 节点更新

      const pool = await service.createIPPool(config);

      expect(pool).toBeDefined();
      expect(pool.name).toBe(config.name);
      expect(pool.nodeId).toBe(config.nodeId);
      expect(pool.ipType).toBe(config.ipType);
      expect(pool.rotationStrategy).toBe(config.rotationStrategy);
      expect(pool.isActive).toBe(true);
    });

    it('应该为每个IP检测评分', async () => {
      const config: IPPoolConfig = {
        name: 'Test Pool',
        nodeId: 'node-123',
        ipType: IpType.RESIDENTIAL_STATIC,
        ips: ['192.168.1.1'],
        rotationStrategy: RotationStrategy.ROUND_ROBIN,
        rotationInterval: 3600
      };

      mockDb.first.mockResolvedValueOnce(null);
      mockDb.insert.mockResolvedValueOnce([1]);
      mockDb.insert.mockResolvedValueOnce([1]);
      mockDb.update.mockResolvedValueOnce(1);

      await service.createIPPool(config);

      // 验证IP声誉检测被调用
      const { getIPReputationService } = await import('../../ip-reputation');
      expect(getIPReputationService).toHaveBeenCalled();
    });
  });

  describe('IP轮换策略', () => {
    it('轮询策略应该按顺序选择IP', () => {
      const pool: IPPool = {
        id: 'pool-123',
        name: 'Test Pool',
        nodeId: 'node-123',
        ipType: IpType.DATACENTER,
        rotationStrategy: RotationStrategy.ROUND_ROBIN,
        rotationInterval: 3600,
        currentIndex: 0,
        lastRotationAt: undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const ips = [
        { ip: '192.168.1.1' },
        { ip: '192.168.1.2' },
        { ip: '192.168.1.3' }
      ];

      const selectedIP = service['getRoundRobinIP'](pool, ips);
      expect(selectedIP).toBe('192.168.1.1');

      // 模拟下一次轮换
      pool.currentIndex = 1;
      const selectedIP2 = service['getRoundRobinIP'](pool, ips);
      expect(selectedIP2).toBe('192.168.1.2');
    });

    it('随机策略应该从列表中随机选择IP', () => {
      const ips = [
        { ip: '192.168.1.1' },
        { ip: '192.168.1.2' },
        { ip: '192.168.1.3' }
      ];

      const selectedIP = service['getRandomIP'](ips);
      expect(ips.map(i => i.ip)).toContain(selectedIP);
    });

    it('最少使用策略应该选择使用次数最少的IP', () => {
      const ips = [
        { ip: '192.168.1.1', usage_count: 10 },
        { ip: '192.168.1.2', usage_count: 5 },
        { ip: '192.168.1.3', usage_count: 15 }
      ];

      const selectedIP = service['getLeastUsedIP'](ips);
      expect(selectedIP).toBe('192.168.1.2');
    });

    it('质量优先策略应该选择评分最高的IP', () => {
      const ips = [
        { ip: '192.168.1.1', score: 70 },
        { ip: '192.168.1.2', score: 90 },
        { ip: '192.168.1.3', score: 80 }
      ];

      const selectedIP = service['getQualityFirstIP'](ips);
      expect(selectedIP).toBe('192.168.1.2');
    });

    it('质量优先策略在没有评分时应该使用随机策略', () => {
      const ips = [
        { ip: '192.168.1.1', score: null },
        { ip: '192.168.1.2', score: null }
      ];

      const selectedIP = service['getQualityFirstIP'](ips);
      expect(['192.168.1.1', '192.168.1.2']).toContain(selectedIP);
    });
  });

  describe('轮换检查', () => {
    it('应该检测到需要轮换', () => {
      const pool: IPPool = {
        id: 'pool-123',
        name: 'Test Pool',
        nodeId: 'node-123',
        ipType: IpType.DATACENTER,
        rotationStrategy: RotationStrategy.ROUND_ROBIN,
        rotationInterval: 3600, // 1小时
        currentIndex: 0,
        lastRotationAt: new Date(Date.now() - 7200000), // 2小时前
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(service.shouldRotate(pool)).toBe(true);
    });

    it('应该检测到不需要轮换', () => {
      const pool: IPPool = {
        id: 'pool-123',
        name: 'Test Pool',
        nodeId: 'node-123',
        ipType: IpType.DATACENTER,
        rotationStrategy: RotationStrategy.ROUND_ROBIN,
        rotationInterval: 3600, // 1小时
        currentIndex: 0,
        lastRotationAt: new Date(Date.now() - 1800000), // 30分钟前
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(service.shouldRotate(pool)).toBe(false);
    });

    it('首次使用应该需要轮换', () => {
      const pool: IPPool = {
        id: 'pool-123',
        name: 'Test Pool',
        nodeId: 'node-123',
        ipType: IpType.DATACENTER,
        rotationStrategy: RotationStrategy.ROUND_ROBIN,
        rotationInterval: 3600,
        currentIndex: 0,
        lastRotationAt: undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(service.shouldRotate(pool)).toBe(true);
    });
  });

  describe('IP管理', () => {
    it('应该成功添加IP到池', async () => {
      const poolId = 'pool-123';
      const ip = '192.168.1.100';

      mockDb.first
        .mockResolvedValueOnce({
          id: poolId,
          name: 'Test Pool',
          node_id: 'node-123',
          ip_type: IpType.DATACENTER,
          rotation_strategy: RotationStrategy.ROUND_ROBIN,
          rotation_interval: 3600,
          current_index: 0,
          is_active: true
        }) // 检查IP池存在
        .mockResolvedValueOnce(null); // 检查IP不存在

      mockDb.insert.mockResolvedValueOnce([1]);

      const result = await service.addIPToPool(poolId, ip);

      expect(result).toBeDefined();
      expect(result.ip).toBe(ip);
      expect(result.poolId).toBe(poolId);
    });

    it('应该拒绝添加重复的IP', async () => {
      const poolId = 'pool-123';
      const ip = '192.168.1.100';

      mockDb.first
        .mockResolvedValueOnce({
          id: poolId,
          name: 'Test Pool',
          node_id: 'node-123'
        })
        .mockResolvedValueOnce({ id: 'ip-123', ip }); // IP已存在

      await expect(service.addIPToPool(poolId, ip)).rejects.toThrow('already exists');
    });

    it('应该成功从池中移除IP', async () => {
      const poolId = 'pool-123';
      const ip = '192.168.1.100';

      mockDb.delete.mockResolvedValueOnce(1);

      await expect(service.removeIPFromPool(poolId, ip)).resolves.not.toThrow();
    });

    it('应该处理移除不存在的IP', async () => {
      const poolId = 'pool-123';
      const ip = '192.168.1.100';

      mockDb.delete.mockResolvedValueOnce(0);

      await expect(service.removeIPFromPool(poolId, ip)).rejects.toThrow('not found');
    });
  });

  describe('IP池查询', () => {
    it('应该获取IP池列表', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: 'pool-1',
          name: 'Pool 1',
          node_id: 'node-1',
          ip_type: IpType.DATACENTER,
          rotation_strategy: RotationStrategy.ROUND_ROBIN,
          rotation_interval: 3600,
          current_index: 0,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);

      const result = await service.listIPPools({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('应该根据节点ID筛选', async () => {
      const nodeId = 'node-123';

      mockDb.limit.mockResolvedValueOnce([]);

      await service.listIPPools({ nodeId });

      expect(mockDb.where).toHaveBeenCalledWith('node_id', nodeId);
    });

    it('应该根据IP类型筛选', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await service.listIPPools({ ipType: IpType.RESIDENTIAL_DYNAMIC });

      expect(mockDb.where).toHaveBeenCalledWith('ip_type', IpType.RESIDENTIAL_DYNAMIC);
    });
  });

  describe('IP池状态管理', () => {
    it('应该激活IP池', async () => {
      const poolId = 'pool-123';

      mockDb.update.mockResolvedValueOnce(1);
      mockDb.first.mockResolvedValueOnce({
        id: poolId,
        name: 'Test Pool',
        node_id: 'node-123',
        is_active: true
      });

      const result = await service.setPoolActive(poolId, true);

      expect(result).toBeDefined();
      expect(result?.isActive).toBe(true);
    });

    it('应该停用IP池', async () => {
      const poolId = 'pool-123';

      mockDb.update.mockResolvedValueOnce(1);
      mockDb.first.mockResolvedValueOnce({
        id: poolId,
        name: 'Test Pool',
        node_id: 'node-123',
        is_active: false
      });

      const result = await service.setPoolActive(poolId, false);

      expect(result).toBeDefined();
      expect(result?.isActive).toBe(false);
    });
  });

  describe('IP评分刷新', () => {
    it('应该刷新池中所有IP的评分', async () => {
      const poolId = 'pool-123';

      mockDb.select.mockResolvedValueOnce([
        { id: 'ip-1', ip: '192.168.1.1' },
        { id: 'ip-2', ip: '192.168.1.2' }
      ]);

      mockDb.update.mockResolvedValue(1);

      await expect(service.refreshIPScores(poolId)).resolves.not.toThrow();
    });
  });

  describe('单例模式', () => {
    it('应该返回相同的实例', () => {
      const instance1 = getIPPoolService();
      const instance2 = getIPPoolService();
      expect(instance1).toBe(instance2);
    });
  });

  describe('边界条件', () => {
    it('应该处理空IP池', async () => {
      mockDb.orderBy.mockResolvedValueOnce([]);

      const pool: IPPool = {
        id: 'pool-123',
        name: 'Empty Pool',
        nodeId: 'node-123',
        ipType: IpType.DATACENTER,
        rotationStrategy: RotationStrategy.ROUND_ROBIN,
        rotationInterval: 3600,
        currentIndex: 0,
        lastRotationAt: undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const nextIP = await service['getNextAvailableIP'](pool);
      expect(nextIP).toBeNull();
    });

    it('应该处理只有一个IP的池', async () => {
      mockDb.orderBy.mockResolvedValueOnce([
        { ip: '192.168.1.1', status: 'active' }
      ]);

      const pool: IPPool = {
        id: 'pool-123',
        name: 'Single IP Pool',
        nodeId: 'node-123',
        ipType: IpType.DATACENTER,
        rotationStrategy: RotationStrategy.ROUND_ROBIN,
        rotationInterval: 3600,
        currentIndex: 0,
        lastRotationAt: undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const nextIP = await service['getNextAvailableIP'](pool);
      expect(nextIP).toBe('192.168.1.1');
    });
  });
});

describe('IPPoolService - 集成测试', () => {
  it('应该正确初始化服务', () => {
    const service = new IPPoolService();
    expect(service).toBeDefined();
  });
});
