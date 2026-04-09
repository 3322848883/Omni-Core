/**
 * 套餐权益验证服务测试
 * 测试套餐管理服务的所有功能
 */

// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as subscriptionPlanService from '../subscriptionPlanService';
import { ServiceType } from '@shared/constants';
import { CreatePlanData, UpdatePlanData } from '../../types/subscription-plan';

// 全局变量，用于在测试中访问mockDb
let mockDb: any;

// 使用jest.mock的回调函数方式来避免类型问题
jest.mock('../../database', () => {
  // 创建一个mock查询对象
  const mockDbInstance = {
    where: jest.fn(),
    first: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    select: jest.fn(),
    count: jest.fn(),
    orderBy: jest.fn(),
    offset: jest.fn(),
    limit: jest.fn(),
    whereNot: jest.fn(),
    join: jest.fn(),
    groupBy: jest.fn(),
    returning: jest.fn(),
    clone: jest.fn(),
    whereNotNull: jest.fn()
  };

  // 配置链式调用
  Object.keys(mockDbInstance).forEach(key => {
    // 所有方法都支持链式调用
    mockDbInstance[key].mockReturnThis();
  });

  // 配置默认返回值
  mockDbInstance.first.mockResolvedValue(null);
  mockDbInstance.insert.mockResolvedValue([1]);
  mockDbInstance.update.mockResolvedValue(1);
  mockDbInstance.delete.mockResolvedValue(1);
  mockDbInstance.limit.mockResolvedValue([]);
  mockDbInstance.orderBy.mockResolvedValue([]);
  mockDbInstance.groupBy.mockResolvedValue([]);
  mockDbInstance.count.mockResolvedValue([{ count: 0 }]);
  mockDbInstance.returning.mockResolvedValue([{}]);
  mockDbInstance.select.mockResolvedValue([]);

  // 创建mock db函数
  const mockDbFunction = jest.fn(() => mockDbInstance);

  // 添加raw和transaction方法
  mockDbFunction.raw = jest.fn((str: string) => str);
  mockDbFunction.transaction = jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn()
  });

  // 将mockDbInstance赋值给外部的mockDb变量
  mockDb = mockDbInstance;

  return {
    db: mockDbFunction
  };
});

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('SubscriptionPlanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 重新配置默认返回值
    mockDb.first.mockResolvedValue(null);
    mockDb.insert.mockResolvedValue([1]);
    mockDb.update.mockResolvedValue(1);
    mockDb.delete.mockResolvedValue(1);
    mockDb.limit.mockResolvedValue([]);
    mockDb.orderBy.mockResolvedValue([]);
    mockDb.groupBy.mockResolvedValue([]);
    mockDb.count.mockResolvedValue([{ count: 0 }]);
    mockDb.returning.mockResolvedValue([{}]);
    mockDb.select.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('套餐创建', () => {
    it('应该成功创建套餐', async () => {
      const planData: CreatePlanData = {
        name: 'Test Plan',
        description: 'Test description',
        price: 9.99,
        durationDays: 30,
        trafficLimit: 100 * 1024 * 1024 * 1024, // 100GB
        allowedServiceTypes: [ServiceType.STANDARD],
        primaryServiceType: ServiceType.STANDARD,
        priorityBoost: 0,
        guaranteedBandwidth: 0,
        maxConnections: 3,
        features: ['Feature 1', 'Feature 2'],
        isActive: true,
        sortOrder: 1
      };

      mockDb.first.mockResolvedValueOnce(null); // 检查名称不存在
      mockDb.insert.mockResolvedValueOnce([{
        id: 'plan_test_123',
        name: planData.name,
        description: planData.description,
        price: planData.price,
        duration_days: planData.durationDays,
        traffic_limit: planData.trafficLimit,
        service_types: JSON.stringify(planData.allowedServiceTypes),
        primary_service_type: planData.primaryServiceType,
        priority_boost: planData.priorityBoost,
        guaranteed_bandwidth: planData.guaranteedBandwidth,
        max_connections: planData.maxConnections,
        features: JSON.stringify(planData.features),
        is_active: planData.isActive,
        sort_order: planData.sortOrder,
        created_at: new Date(),
        updated_at: new Date()
      }]);

      const result = await subscriptionPlanService.createPlan(planData, 'admin');

      expect(result).toBeDefined();
      expect(result.name).toBe(planData.name);
      expect(result.price).toBe(planData.price);
      expect(result.durationDays).toBe(planData.durationDays);
      expect(result.allowedServiceTypes).toEqual(planData.allowedServiceTypes);
      expect(result.primaryServiceType).toBe(planData.primaryServiceType);
    });

    it('应该拒绝创建没有名称的套餐', async () => {
      const planData: CreatePlanData = {
        name: '',
        description: '',
        price: 9.99,
        durationDays: 30,
        trafficLimit: 100 * 1024 * 1024 * 1024,
        allowedServiceTypes: [ServiceType.STANDARD],
        primaryServiceType: ServiceType.STANDARD
      };

      await expect(subscriptionPlanService.createPlan(planData)).rejects.toThrow('Plan name is required');
    });

    it('应该拒绝创建负价格的套餐', async () => {
      const planData: CreatePlanData = {
        name: 'Test Plan',
        description: '',
        price: -9.99,
        durationDays: 30,
        trafficLimit: 100 * 1024 * 1024 * 1024,
        allowedServiceTypes: [ServiceType.STANDARD],
        primaryServiceType: ServiceType.STANDARD
      };

      await expect(subscriptionPlanService.createPlan(planData)).rejects.toThrow('Price must be a non-negative number');
    });

    it('应该拒绝创建无效持续时间的套餐', async () => {
      const planData: CreatePlanData = {
        name: 'Test Plan',
        description: '',
        price: 9.99,
        durationDays: 0,
        trafficLimit: 100 * 1024 * 1024 * 1024,
        allowedServiceTypes: [ServiceType.STANDARD],
        primaryServiceType: ServiceType.STANDARD
      };

      await expect(subscriptionPlanService.createPlan(planData)).rejects.toThrow('Duration days must be at least 1');
    });

    it('应该拒绝创建无效流量限制的套餐', async () => {
      const planData: CreatePlanData = {
        name: 'Test Plan',
        description: '',
        price: 9.99,
        durationDays: 30,
        trafficLimit: 0,
        allowedServiceTypes: [ServiceType.STANDARD],
        primaryServiceType: ServiceType.STANDARD
      };

      await expect(subscriptionPlanService.createPlan(planData)).rejects.toThrow('Traffic limit must be at least 1 byte');
    });

    it('应该拒绝创建没有服务类型的套餐', async () => {
      const planData: CreatePlanData = {
        name: 'Test Plan',
        description: '',
        price: 9.99,
        durationDays: 30,
        trafficLimit: 100 * 1024 * 1024 * 1024,
        allowedServiceTypes: [],
        primaryServiceType: ServiceType.STANDARD
      };

      await expect(subscriptionPlanService.createPlan(planData)).rejects.toThrow('At least one service type is required');
    });

    it('应该拒绝创建主服务类型不在服务类型列表中的套餐', async () => {
      const planData: CreatePlanData = {
        name: 'Test Plan',
        description: '',
        price: 9.99,
        durationDays: 30,
        trafficLimit: 100 * 1024 * 1024 * 1024,
        allowedServiceTypes: [ServiceType.STANDARD],
        primaryServiceType: ServiceType.DEDICATED_LINE
      };

      await expect(subscriptionPlanService.createPlan(planData)).rejects.toThrow('Primary service type must be included in allowedServiceTypes');
    });

    it('应该拒绝创建重复名称的套餐', async () => {
      const planData: CreatePlanData = {
        name: 'Existing Plan',
        description: '',
        price: 9.99,
        durationDays: 30,
        trafficLimit: 100 * 1024 * 1024 * 1024,
        allowedServiceTypes: [ServiceType.STANDARD],
        primaryServiceType: ServiceType.STANDARD
      };

      mockDb.first.mockResolvedValueOnce({ id: 'existing-plan', name: 'Existing Plan' });

      await expect(subscriptionPlanService.createPlan(planData)).rejects.toThrow('Plan name already exists');
    });
  });

  describe('套餐更新', () => {
    it('应该成功更新套餐', async () => {
      const planId = 'plan_test_123';
      const updateData: UpdatePlanData = {
        name: 'Updated Plan',
        price: 19.99,
        description: 'Updated description'
      };

      mockDb.first
        .mockResolvedValueOnce({
          id: planId,
          name: 'Original Plan',
          description: 'Original description',
          price: 9.99,
          duration_days: 30,
          traffic_limit: 100 * 1024 * 1024 * 1024,
          service_types: JSON.stringify([ServiceType.STANDARD]),
          primary_service_type: ServiceType.STANDARD,
          is_active: true
        }) // 检查套餐存在
        .mockResolvedValueOnce(null); // 检查名称不冲突

      mockDb.update.mockResolvedValueOnce(1);
      mockDb.first.mockResolvedValueOnce({
        id: planId,
        name: updateData.name,
        description: updateData.description,
        price: updateData.price,
        duration_days: 30,
        traffic_limit: 100 * 1024 * 1024 * 1024,
        service_types: JSON.stringify([ServiceType.STANDARD]),
        primary_service_type: ServiceType.STANDARD,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      const result = await subscriptionPlanService.updatePlan(planId, updateData, 'admin');

      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect(result.price).toBe(updateData.price);
      expect(result.description).toBe(updateData.description);
    });

    it('应该拒绝更新不存在的套餐', async () => {
      const planId = 'non-existent-plan';
      const updateData: UpdatePlanData = { name: 'Updated Plan' };

      mockDb.first.mockResolvedValueOnce(null);

      await expect(subscriptionPlanService.updatePlan(planId, updateData)).rejects.toThrow('not found');
    });

    it('应该拒绝更新为重复名称', async () => {
      const planId = 'plan_test_123';
      const updateData: UpdatePlanData = { name: 'Existing Name' };

      mockDb.first
        .mockResolvedValueOnce({ id: planId, name: 'Original Plan' })
        .mockResolvedValueOnce({ id: 'other-plan', name: 'Existing Name' });

      await expect(subscriptionPlanService.updatePlan(planId, updateData)).rejects.toThrow('Plan name already exists');
    });
  });

  describe('套餐删除', () => {
    it('应该成功删除没有活跃订阅的套餐', async () => {
      const planId = 'plan_test_123';

      mockDb.first.mockResolvedValueOnce({ id: planId, name: 'Test Plan' });
      mockDb.first.mockResolvedValueOnce({ count: '0' }); // 没有活跃订阅
      mockDb.delete.mockResolvedValueOnce(1);

      await expect(subscriptionPlanService.deletePlan(planId, 'admin')).resolves.not.toThrow();
    });

    it('应该拒绝删除不存在的套餐', async () => {
      const planId = 'non-existent-plan';

      mockDb.first.mockResolvedValueOnce(null);

      await expect(subscriptionPlanService.deletePlan(planId)).rejects.toThrow('not found');
    });

    it('应该拒绝删除有活跃订阅的套餐', async () => {
      const planId = 'plan_test_123';

      mockDb.first.mockResolvedValueOnce({ id: planId, name: 'Test Plan' });
      mockDb.first.mockResolvedValueOnce({ count: '5' }); // 有5个活跃订阅

      await expect(subscriptionPlanService.deletePlan(planId)).rejects.toThrow('Cannot delete plan with 5 active subscriptions');
    });
  });

  describe('套餐查询', () => {
    it('应该获取套餐列表', async () => {
      mockDb.limit.mockResolvedValueOnce([
        {
          id: 'plan-1',
          name: 'Plan 1',
          description: 'Description 1',
          price: 9.99,
          duration_days: 30,
          traffic_limit: 100 * 1024 * 1024 * 1024,
          service_types: JSON.stringify([ServiceType.STANDARD]),
          primary_service_type: ServiceType.STANDARD,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);

      const result = await subscriptionPlanService.getPlans({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('应该根据服务类型筛选', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await subscriptionPlanService.getPlans({ serviceType: ServiceType.DEDICATED_LINE });

      expect(mockDb.where).toHaveBeenCalledWith('primary_service_type', ServiceType.DEDICATED_LINE);
    });

    it('应该根据激活状态筛选', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await subscriptionPlanService.getPlans({ isActive: true });

      expect(mockDb.where).toHaveBeenCalledWith('is_active', true);
    });

    it('应该根据套餐组筛选', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await subscriptionPlanService.getPlans({ group: 'premium' });

      expect(mockDb.where).toHaveBeenCalledWith('group_id', 'premium');
    });

    it('应该根据ID获取套餐', async () => {
      const planId = 'plan_test_123';

      mockDb.first.mockResolvedValueOnce({
        id: planId,
        name: 'Test Plan',
        description: 'Test description',
        price: 9.99,
        duration_days: 30,
        traffic_limit: 100 * 1024 * 1024 * 1024,
        service_types: JSON.stringify([ServiceType.STANDARD]),
        primary_service_type: ServiceType.STANDARD,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      const result = await subscriptionPlanService.getPlanById(planId);

      expect(result).toBeDefined();
      expect(result.id).toBe(planId);
    });

    it('应该处理不存在的套餐ID', async () => {
      const planId = 'non-existent-plan';

      mockDb.first.mockResolvedValueOnce(null);

      await expect(subscriptionPlanService.getPlanById(planId)).rejects.toThrow('not found');
    });
  });

  describe('套餐统计', () => {
    it('应该获取套餐统计信息', async () => {
      const planId = 'plan_test_123';

      mockDb.first
        .mockResolvedValueOnce({
          id: planId,
          name: 'Test Plan',
          description: 'Test description',
          price: 9.99,
          duration_days: 30,
          traffic_limit: 100 * 1024 * 1024 * 1024,
          service_types: JSON.stringify([ServiceType.STANDARD]),
          primary_service_type: ServiceType.STANDARD,
          is_active: true
        }) // 获取套餐信息
        .mockResolvedValueOnce({
          total: '100',
          active: '80',
          expired: '20'
        }) // 订阅统计
        .mockResolvedValueOnce({
          total_revenue: '999.99',
          monthly_revenue: '99.99'
        }) // 收入统计
        .mockResolvedValueOnce({
          avg_duration: '25.5'
        }); // 时长统计

      const result = await subscriptionPlanService.getPlanStats(planId);

      expect(result).toBeDefined();
      expect(result.planId).toBe(planId);
      expect(result.totalSubscriptions).toBe(100);
      expect(result.revenue).toBe(999.99);
    });
  });

  describe('套餐激活/停用', () => {
    it('应该激活套餐', async () => {
      const planId = 'plan_test_123';

      mockDb.first
        .mockResolvedValueOnce({
          id: planId,
          name: 'Test Plan',
          is_active: false
        })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: planId,
          name: 'Test Plan',
          is_active: true
        });

      mockDb.update.mockResolvedValueOnce(1);

      const result = await subscriptionPlanService.activatePlan(planId, 'admin');

      expect(result).toBeDefined();
      expect(result.isActive).toBe(true);
    });

    it('应该停用套餐', async () => {
      const planId = 'plan_test_123';

      mockDb.first
        .mockResolvedValueOnce({
          id: planId,
          name: 'Test Plan',
          is_active: true
        })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: planId,
          name: 'Test Plan',
          is_active: false
        });

      mockDb.update.mockResolvedValueOnce(1);

      const result = await subscriptionPlanService.deactivatePlan(planId, 'admin');

      expect(result).toBeDefined();
      expect(result.isActive).toBe(false);
    });
  });

  describe('套餐选项', () => {
    it('应该获取套餐选项列表', async () => {
      mockDb.orderBy.mockResolvedValueOnce([
        { id: 'plan-1', name: 'Plan 1', price: 9.99 },
        { id: 'plan-2', name: 'Plan 2', price: 19.99 }
      ]);

      const result = await subscriptionPlanService.getPlanOptions();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('price');
    });

    it('应该根据服务类型筛选选项', async () => {
      mockDb.orderBy.mockResolvedValueOnce([
        { id: 'plan-1', name: 'Plan 1', price: 9.99 }
      ]);

      const result = await subscriptionPlanService.getPlanOptions(ServiceType.DEDICATED_LINE);

      expect(mockDb.where).toHaveBeenCalledWith('primary_service_type', ServiceType.DEDICATED_LINE);
      expect(result).toHaveLength(1);
    });
  });

  describe('套餐排序', () => {
    it('应该成功更新套餐排序', async () => {
      const sortData = [
        { id: 'plan-1', sortOrder: 1 },
        { id: 'plan-2', sortOrder: 2 },
        { id: 'plan-3', sortOrder: 3 }
      ];

      mockDb.transaction.mockResolvedValueOnce({
        commit: jest.fn(),
        rollback: jest.fn()
      });

      await expect(subscriptionPlanService.updatePlansSortOrder(sortData, 'admin')).resolves.not.toThrow();
    });
  });

  describe('套餐组', () => {
    it('应该获取套餐组列表', async () => {
      mockDb.groupBy.mockResolvedValueOnce([
        { group_id: 'standard', count: '5' },
        { group_id: 'premium', count: '3' }
      ]);

      const result = await subscriptionPlanService.getPlanGroups();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('planCount');
    });
  });

  describe('边界条件', () => {
    it('应该处理空套餐列表', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await subscriptionPlanService.getPlans({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('应该处理分页边界', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await subscriptionPlanService.getPlans({ page: 100, limit: 10 });

      expect(result.page).toBe(100);
      expect(result.pageSize).toBe(10);
    });

    it('应该处理价格为0的套餐', async () => {
      const planData: CreatePlanData = {
        name: 'Free Plan',
        description: '',
        price: 0,
        durationDays: 30,
        trafficLimit: 10 * 1024 * 1024 * 1024,
        allowedServiceTypes: [ServiceType.STANDARD],
        primaryServiceType: ServiceType.STANDARD
      };

      mockDb.first.mockResolvedValueOnce(null);
      mockDb.insert.mockResolvedValueOnce([{
        id: 'plan_free_123',
        name: planData.name,
        price: 0,
        duration_days: planData.durationDays,
        traffic_limit: planData.trafficLimit,
        service_types: JSON.stringify(planData.allowedServiceTypes),
        primary_service_type: planData.primaryServiceType,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }]);

      const result = await subscriptionPlanService.createPlan(planData);

      expect(result).toBeDefined();
      expect(result.price).toBe(0);
    });
  });
});

describe('SubscriptionPlanService - 服务类型验证', () => {
  it('应该接受有效的服务类型', async () => {
    const planData: CreatePlanData = {
      name: 'Valid Plan',
      description: '',
      price: 9.99,
      durationDays: 30,
      trafficLimit: 100 * 1024 * 1024 * 1024,
      allowedServiceTypes: [ServiceType.STANDARD, ServiceType.DEDICATED_LINE],
      primaryServiceType: ServiceType.STANDARD
    };

    mockDb.first.mockResolvedValueOnce(null);
    mockDb.insert.mockResolvedValueOnce([{
      id: 'plan_valid_123',
      name: planData.name,
      price: planData.price,
      duration_days: planData.durationDays,
      traffic_limit: planData.trafficLimit,
      service_types: JSON.stringify(planData.allowedServiceTypes),
      primary_service_type: planData.primaryServiceType,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    const result = await subscriptionPlanService.createPlan(planData);

    expect(result.allowedServiceTypes).toContain(ServiceType.STANDARD);
    expect(result.allowedServiceTypes).toContain(ServiceType.DEDICATED_LINE);
  });
});
