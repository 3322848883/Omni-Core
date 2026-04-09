/**
 * 套餐权益验证服务测试
 * 测试套餐管理服务的所有功能
 */

// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as subscriptionPlanService from '../subscriptionPlanService';
import { ServiceType } from '@shared/constants';
import { CreatePlanData, UpdatePlanData } from '../../types/subscription-plan';

// Mock数据库模块
jest.mock('../../database', () => {
  const mockQuery = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockResolvedValue(1),
    select: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    whereNot: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{}]),
    clone: jest.fn().mockReturnThis(),
    whereNotNull: jest.fn().mockReturnThis()
  };

  const mockDb = jest.fn(() => mockQuery);
  mockDb.raw = jest.fn((str) => str);
  mockDb.transaction = jest.fn().mockResolvedValue({
    commit: jest.fn(),
    rollback: jest.fn()
  });

  return {
    db: mockDb,
    mockQuery
  };
});

// Mock日志模块
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// 导入mockQuery
import { mockQuery } from '../../database';

describe('SubscriptionPlanService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      mockQuery.first.mockResolvedValueOnce(null);
      mockQuery.returning.mockResolvedValueOnce([{
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
  });

  describe('套餐查询', () => {
    it('应该根据ID获取套餐', async () => {
      const planId = 'plan_test_123';

      mockQuery.first.mockResolvedValueOnce({
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

      mockQuery.first.mockResolvedValueOnce(null);

      await expect(subscriptionPlanService.getPlanById(planId)).rejects.toThrow('not found');
    });
  });
});
