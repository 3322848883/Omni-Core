import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';

// Xray API 客户端
export class XrayAPIClient {
  private client: AxiosInstance;
  private apiPort: number;

  constructor(apiPort: number = 10085) {
    this.apiPort = apiPort;
    this.client = axios.create({
      baseURL: `http://127.0.0.1:${apiPort}`,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // 获取所有入站连接统计
  async getInboundStats(reset: boolean = false): Promise<any> {
    try {
      const response = await this.client.post('/stats/query', {
        pattern: 'inbound>>>',
        reset,
      });
      return response.data;
    } catch (error) {
      logger.debug('Failed to get inbound stats');
      return { stat: [] };
    }
  }

  // 获取用户统计 (按邮箱)
  async getUserStats(email: string, reset: boolean = false): Promise<{
    uplink: number;
    downlink: number;
  }> {
    try {
      const [uplinkRes, downlinkRes] = await Promise.all([
        this.client.post('/stats/query', {
          pattern: `user>>>${email}>>>traffic>>>uplink`,
          reset,
        }),
        this.client.post('/stats/query', {
          pattern: `user>>>${email}>>>traffic>>>downlink`,
          reset,
        }),
      ]);

      return {
        uplink: uplinkRes.data?.stat?.[0]?.value || 0,
        downlink: downlinkRes.data?.stat?.[0]?.value || 0,
      };
    } catch (error) {
      logger.debug(`Failed to get user stats for ${email}`);
      return { uplink: 0, downlink: 0 };
    }
  }

  // 获取所有用户统计
  async getAllUserStats(reset: boolean = false): Promise<Map<string, { uplink: number; downlink: number }>> {
    try {
      const response = await this.client.post('/stats/query', {
        pattern: 'user>>>',
        reset,
      });

      const stats = new Map<string, { uplink: number; downlink: number }>();
      const data = response.data?.stat || [];

      // 解析统计数据
      for (const stat of data) {
        const match = stat.name.match(/user>>>(.+?)>>>traffic>>>(uplink|downlink)/);
        if (match) {
          const email = match[1];
          const type = match[2];
          const value = parseInt(stat.value) || 0;

          if (!stats.has(email)) {
            stats.set(email, { uplink: 0, downlink: 0 });
          }

          const userStats = stats.get(email)!;
          if (type === 'uplink') {
            userStats.uplink = value;
          } else {
            userStats.downlink = value;
          }
        }
      }

      return stats;
    } catch (error) {
      logger.debug('Failed to get all user stats');
      return new Map();
    }
  }

  // 添加用户到入站
  async addUser(inboundTag: string, user: {
    id?: string;
    password?: string;
    email: string;
    flow?: string;
    alterId?: number;
    level?: number;
  }): Promise<boolean> {
    try {
      await this.client.post('/handler/AddUser', {
        tag: inboundTag,
        user,
      });
      logger.info(`User ${user.email} added to inbound ${inboundTag}`);
      return true;
    } catch (error) {
      logger.debug(`Failed to add user ${user.email}`);
      return false;
    }
  }

  // 从入站移除用户
  async removeUser(inboundTag: string, email: string): Promise<boolean> {
    try {
      await this.client.post('/handler/RemoveUser', {
        tag: inboundTag,
        email,
      });
      logger.info(`User ${email} removed from inbound ${inboundTag}`);
      return true;
    } catch (error) {
      logger.debug(`Failed to remove user ${email}`);
      return false;
    }
  }

  // 获取所有入站配置
  async getInbounds(): Promise<any[]> {
    try {
      const response = await this.client.post('/handler/GetInbounds');
      return response.data?.inbounds || [];
    } catch (error) {
      logger.debug('Failed to get inbounds');
      return [];
    }
  }

  // 添加入站
  async addInbound(inbound: any): Promise<boolean> {
    try {
      await this.client.post('/handler/AddInbound', {
        inbound,
      });
      logger.info(`Inbound ${inbound.tag} added`);
      return true;
    } catch (error) {
      logger.debug(`Failed to add inbound ${inbound.tag}`);
      return false;
    }
  }

  // 移除入站
  async removeInbound(tag: string): Promise<boolean> {
    try {
      await this.client.post('/handler/RemoveInbound', {
        tag,
      });
      logger.info(`Inbound ${tag} removed`);
      return true;
    } catch (error) {
      logger.debug(`Failed to remove inbound ${tag}`);
      return false;
    }
  }

  // 获取系统状态
  async getSysStats(): Promise<any> {
    try {
      const response = await this.client.post('/stats/sys');
      return response.data;
    } catch (error) {
      logger.debug('Failed to get system stats');
      return null;
    }
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// 单例实例
let xrayClient: XrayAPIClient | null = null;

export function getXrayClient(apiPort?: number): XrayAPIClient {
  if (!xrayClient || apiPort) {
    xrayClient = new XrayAPIClient(apiPort);
  }
  return xrayClient;
}

export default XrayAPIClient;
