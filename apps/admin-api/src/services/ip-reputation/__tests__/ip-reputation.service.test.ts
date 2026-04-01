/**
 * IP声誉检测服务测试
 * 测试IPReputationService的所有功能
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { IPReputationService, getIPReputationService } from '../index';
import { IPReputation, IPDataApiResponse } from '../../../shared/types/ip-assets';
import { IPScoreThresholds } from '../../../shared/constants/ip-assets';

// Mock依赖
jest.mock('../../../database', () => ({
  db: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockResolvedValue([1]),
    update: jest.fn().mockResolvedValue(1),
    delete: jest.fn().mockResolvedValue(1),
    select: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    avg: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    raw: jest.fn((str: string) => str),
    onConflict: jest.fn().mockReturnThis(),
    merge: jest.fn().mockResolvedValue(1)
  }))
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

jest.mock('../../../config', () => ({
  config: {
    ipdataApiKey: 'test-api-key'
  }
}));

jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn()
    })),
    isAxiosError: jest.fn()
  }
}));

describe('IPReputationService', () => {
  let service: IPReputationService;
  let mockAxios: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IPReputationService({
      ipdataApiKey: 'test-api-key',
      cacheTtlSeconds: 3600,
      rateLimit: {
        maxRequestsPerMinute: 10,
        maxRequestsPerHour: 100,
        maxRequestsPerDay: 1000
      },
      alertThreshold: IPScoreThresholds.FAIR,
      criticalThreshold: IPScoreThresholds.POOR
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('IP格式验证', () => {
    it('应该接受有效的IPv4地址', () => {
      const validIPv4s = [
        '192.168.1.1',
        '10.0.0.1',
        '255.255.255.255',
        '0.0.0.0',
        '172.16.0.1'
      ];

      validIPv4s.forEach(ip => {
        expect(service['isValidIP'](ip)).toBe(true);
      });
    });

    it('应该接受有效的IPv6地址', () => {
      const validIPv6s = [
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        'fe80:0000:0000:0000:0202:b3ff:fe1e:8329'
      ];

      validIPv6s.forEach(ip => {
        expect(service['isValidIP'](ip)).toBe(true);
      });
    });

    it('应该拒绝无效的IP地址', () => {
      const invalidIPs = [
        'invalid',
        '192.168.1',
        '192.168.1.1.1',
        '256.1.1.1',
        '',
        '192.168.1.1/24',
        'example.com'
      ];

      invalidIPs.forEach(ip => {
        expect(service['isValidIP'](ip)).toBe(false);
      });
    });
  });

  describe('评分计算', () => {
    it('应该对干净IP返回高分', () => {
      const cleanData: IPDataApiResponse = {
        ip: '192.168.1.1',
        is_eu: false,
        city: 'Beijing',
        region: 'Beijing',
        region_code: 'BJ',
        country_name: 'China',
        country_code: 'CN',
        continent_name: 'Asia',
        continent_code: 'AS',
        latitude: 39.9042,
        longitude: 116.4074,
        asn: {
          asn: 'AS12345',
          name: 'Test ISP',
          domain: 'test.com',
          route: '192.168.0.0/16',
          type: 'isp'
        },
        organisation: 'Test Org',
        threat: {
          is_tor: false,
          is_proxy: false,
          is_anonymous: false,
          is_known_attacker: false,
          is_known_abuser: false,
          is_threat: false,
          is_bogon: false
        }
      };

      const score = service['calculateScore'](cleanData);
      expect(score).toBe(100);
    });

    it('应该对威胁IP扣减相应分数', () => {
      const threatData: IPDataApiResponse = {
        ip: '10.0.0.1',
        is_eu: false,
        city: null,
        region: null,
        region_code: null,
        country_name: null,
        country_code: null,
        continent_name: null,
        continent_code: null,
        latitude: 0,
        longitude: 0,
        asn: null,
        organisation: null,
        threat: {
          is_tor: true,
          is_proxy: true,
          is_anonymous: true,
          is_known_attacker: true,
          is_known_abuser: true,
          is_threat: true,
          is_bogon: true
        }
      };

      const score = service['calculateScore'](threatData);
      expect(score).toBeLessThan(50);
    });

    it('应该对数据中心IP扣减分数', () => {
      const datacenterData: IPDataApiResponse = {
        ip: '192.168.1.1',
        is_eu: false,
        city: null,
        region: null,
        region_code: null,
        country_name: null,
        country_code: null,
        continent_name: null,
        continent_code: null,
        latitude: 0,
        longitude: 0,
        asn: {
          asn: 'AS12345',
          name: 'Test Hosting',
          domain: 'test.com',
          route: '192.168.0.0/16',
          type: 'hosting'
        },
        organisation: null,
        threat: {
          is_tor: false,
          is_proxy: false,
          is_anonymous: false,
          is_known_attacker: false,
          is_known_abuser: false,
          is_threat: false,
          is_bogon: false
        }
      };

      const score = service['calculateScore'](datacenterData);
      expect(score).toBe(90); // 100 - 10 for hosting
    });

    it('评分应该在0-100范围内', () => {
      const extremeData: IPDataApiResponse = {
        ip: '1.1.1.1',
        is_eu: false,
        city: null,
        region: null,
        region_code: null,
        country_name: null,
        country_code: null,
        continent_name: null,
        continent_code: null,
        latitude: 0,
        longitude: 0,
        asn: null,
        organisation: null,
        threat: {
          is_tor: true,
          is_proxy: true,
          is_anonymous: true,
          is_known_attacker: true,
          is_known_abuser: true,
          is_threat: true,
          is_bogon: true
        }
      };

      const score = service['calculateScore'](extremeData);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('缓存管理', () => {
    it('应该正确生成缓存键', () => {
      const ip = '192.168.1.1';
      const key = service['getCacheKey'](ip);
      expect(key).toBe('ip:reputation:192.168.1.1');
    });

    it('应该正确检测过期数据', () => {
      const futureDate = new Date(Date.now() + 3600000); // 1小时后
      const pastDate = new Date(Date.now() - 3600000); // 1小时前

      const validReputation: IPReputation = {
        ip: '192.168.1.1',
        provider: 'test',
        score: 80,
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
        expiresAt: futureDate
      };

      const expiredReputation: IPReputation = {
        ip: '192.168.1.1',
        provider: 'test',
        score: 80,
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
        expiresAt: pastDate
      };

      expect(service['isExpired'](validReputation)).toBe(false);
      expect(service['isExpired'](expiredReputation)).toBe(true);
    });
  });

  describe('批量处理', () => {
    it('应该正确分块数组', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const chunks1 = service['chunkArray'](array, 3);
      expect(chunks1).toHaveLength(4);
      expect(chunks1[0]).toEqual([1, 2, 3]);
      expect(chunks1[3]).toEqual([10]);

      const chunks2 = service['chunkArray'](array, 5);
      expect(chunks2).toHaveLength(2);
      expect(chunks2[0]).toEqual([1, 2, 3, 4, 5]);

      const chunks3 = service['chunkArray'](array, 10);
      expect(chunks3).toHaveLength(1);
      expect(chunks3[0]).toEqual(array);
    });

    it('应该正确处理空数组', () => {
      const chunks = service['chunkArray']([], 3);
      expect(chunks).toHaveLength(0);
    });
  });

  describe('限流检查', () => {
    it('应该在未超过限制时通过', async () => {
      // 重置请求时间戳
      service['requestTimestamps'] = [];

      // 执行9次请求（限制为10次/分钟）
      for (let i = 0; i < 9; i++) {
        await expect(service['checkRateLimit']()).resolves.not.toThrow();
      }
    });

    it('应该在超过限制时抛出错误', async () => {
      // 重置请求时间戳
      service['requestTimestamps'] = [];

      // 执行10次请求达到限制
      for (let i = 0; i < 10; i++) {
        await service['checkRateLimit']();
      }

      // 第11次应该抛出错误
      await expect(service['checkRateLimit']()).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('单例模式', () => {
    it('应该返回相同的实例', () => {
      const instance1 = getIPReputationService();
      const instance2 = getIPReputationService();
      expect(instance1).toBe(instance2);
    });
  });

  describe('默认声誉', () => {
    it('应该返回正确的默认声誉数据', () => {
      const ip = '192.168.1.1';
      const reputation = service['getDefaultReputation'](ip);

      expect(reputation.ip).toBe(ip);
      expect(reputation.provider).toBe('default');
      expect(reputation.score).toBe(75);
      expect(reputation.isResidential).toBeNull();
      expect(reputation.abuseRecords).toBe(0);
      expect(reputation.rawData).toEqual({});
    });
  });
});

describe('IPReputationService - 集成测试', () => {
  it('应该正确初始化服务', () => {
    const service = new IPReputationService();
    expect(service).toBeDefined();
    expect(service['config'].cacheTtlSeconds).toBe(24 * 60 * 60);
  });

  it('应该接受自定义配置', () => {
    const customConfig = {
      ipdataApiKey: 'custom-key',
      cacheTtlSeconds: 7200,
      rateLimit: {
        maxRequestsPerMinute: 5,
        maxRequestsPerHour: 50,
        maxRequestsPerDay: 500
      },
      alertThreshold: 70,
      criticalThreshold: 30
    };

    const service = new IPReputationService(customConfig);
    expect(service['config'].ipdataApiKey).toBe('custom-key');
    expect(service['config'].cacheTtlSeconds).toBe(7200);
    expect(service['config'].rateLimit.maxRequestsPerMinute).toBe(5);
    expect(service['config'].alertThreshold).toBe(70);
    expect(service['config'].criticalThreshold).toBe(30);
  });
});
