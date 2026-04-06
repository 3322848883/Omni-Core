import { Router } from 'express';
import { xrayService } from '@/services/xray';
import { subscriptionService } from '@/services/subscription';
import { healthCheckService } from '@/services/healthCheck';
import { successResponse, errorResponse } from '@/utils/response';
import { HttpStatus, ErrorCode } from '@/constants';
import db from '@/config/database';
import logger from '@/utils/logger';
import { nodeFilterService } from '@/services/nodeFilterService';
import { authenticateByVpnUuid } from '@/middlewares/auth';

const router = Router();

/**
 * GET /xray/config - 获取 Xray 配置（管理员）
 */
router.get('/config', async (req, res) => {
  try {
    // 获取所有节点和用户信息
    const nodes = await db('nodes').where({ is_active: true }).select('*');
    const users = await db('users').where({ status: 1 }).select('*');

    // 转换为用户配置格式
    const userConfigs = users.map((user) => ({
      userId: user.user_id,
      email: user.email,
      uuid: user.vpn_uuid || xrayService.generateUUID(),
      trafficLimit: user.traffic_limit,
      trafficUsed: user.traffic_used,
      expireDate: user.expire_date,
      isActive: user.status === 1,
    }));

    // 生成配置
    const config = await xrayService.generateConfig(nodes, userConfigs);

    successResponse(res, config, '获取 Xray 配置成功');
  } catch (error) {
    logger.error('Failed to get Xray config:', error);
    errorResponse(
      res,
      '获取 Xray 配置失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '获取 Xray 配置失败' }]
    );
  }
});

/**
 * POST /xray/config - 更新 Xray 配置（管理员）
 */
router.post('/config', async (req, res) => {
  try {
    const config = req.body;

    // 验证配置
    xrayService.validateConfig(config);

    // 保存配置
    await xrayService.saveConfig(config);

    successResponse(res, null, 'Xray 配置已更新');
  } catch (error) {
    logger.error('Failed to update Xray config:', error);
    errorResponse(
      res,
      error instanceof Error ? error.message : '配置更新失败',
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      [{ field: 'config', message: error instanceof Error ? error.message : '配置更新失败' }]
    );
  }
});

/**
 * POST /xray/reload - 热重载 Xray 配置（管理员）
 */
router.post('/reload', async (req, res) => {
  try {
    await xrayService.reloadConfig();
    successResponse(res, null, 'Xray 配置已重载');
  } catch (error) {
    logger.error('Failed to reload Xray config:', error);
    errorResponse(
      res,
      '配置重载失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '配置重载失败' }]
    );
  }
});

/**
 * GET /xray/traffic - 获取流量统计（管理员）
 */
router.get('/traffic', async (req, res) => {
  try {
    const { userId, nodeId, startDate, endDate } = req.query;

    let query = db('traffic_logs').select('*');

    if (userId) {
      query = query.where('user_id', userId);
    }

    if (nodeId) {
      query = query.where('node_id', nodeId);
    }

    if (startDate) {
      query = query.where('recorded_at', '>=', startDate as string);
    }

    if (endDate) {
      query = query.where('recorded_at', '<=', endDate as string);
    }

    const logs = await query.orderBy('recorded_at', 'desc').limit(1000);

    successResponse(res, logs, '获取流量统计成功');
  } catch (error) {
    logger.error('Failed to get traffic stats:', error);
    errorResponse(
      res,
      '获取流量统计失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '获取流量统计失败' }]
    );
  }
});

/**
 * GET /xray/nodes/:id/health - 获取节点健康状态
 */
router.get('/nodes/:id/health', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100 } = req.query;

    const history = await healthCheckService.getHealthHistory(id, parseInt(limit as string, 10));

    successResponse(res, history, '获取健康状态成功');
  } catch (error) {
    logger.error('Failed to get health history:', error);
    errorResponse(
      res,
      '获取健康状态失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '获取健康状态失败' }]
    );
  }
});

/**
 * POST /xray/nodes/:id/test - 测试节点
 */
router.post('/nodes/:id/test', async (req, res) => {
  try {
    const { id } = req.params;

    // 获取节点信息
    const node = await db('nodes').where({ id }).first();

    if (!node) {
      return errorResponse(
        res,
        '节点不存在',
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        [{ field: 'id', message: '节点不存在' }]
      );
    }

    // 执行健康检查
    const result = await healthCheckService.checkNodeStatus(id, node.host, node.port);

    // 执行延迟测试
    const latencyResult = await healthCheckService.testLatency(id, node.host, node.port);

    successResponse(res, {
      health: result,
      latency: latencyResult,
    }, '节点测试完成');
  } catch (error) {
    logger.error('Failed to test node:', error);
    errorResponse(
      res,
      '节点测试失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '节点测试失败' }]
    );
  }
});

/**
 * GET /xray/nodes/:id/latency - 获取节点延迟历史
 */
router.get('/nodes/:id/latency', async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;

    const history = await healthCheckService.getLatencyHistory(id, parseInt(hours as string, 10));

    successResponse(res, history, '获取延迟历史成功');
  } catch (error) {
    logger.error('Failed to get latency history:', error);
    errorResponse(
      res,
      '获取延迟历史失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '获取延迟历史失败' }]
    );
  }
});

/**
 * GET /subscription/config - 获取订阅配置（用户）
 * 支持通过 VPN UUID (token 参数) 或 JWT Token 认证
 */
router.get('/subscription/config', authenticateByVpnUuid, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return errorResponse(
        res,
        '未授权',
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        [{ field: 'authorization', message: '未授权' }]
      );
    }

    // 使用新的 generateSubscriptionConfig 方法
    const config = await subscriptionService.generateSubscriptionConfig(user.user_id);

    // 如果没有可访问的节点，返回 404
    if (!config || config.nodes.length === 0) {
      return errorResponse(
        res,
        '没有可访问的节点',
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        [{ field: 'nodes', message: '没有可访问的节点' }]
      );
    }

    // 生成 Base64 订阅内容
    const subscriptionContent = subscriptionService.generateBase64Subscription(config);

    // 设置响应头
    const headers = subscriptionService.generateSubscriptionHeader(config);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(subscriptionContent);
  } catch (error) {
    logger.error('Failed to get subscription config:', error);
    errorResponse(
      res,
      '获取订阅配置失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '获取订阅配置失败' }]
    );
  }
});

/**
 * GET /subscription/qr - 获取订阅二维码（用户）
 */
router.get('/subscription/qr', async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return errorResponse(
        res,
        '未授权',
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        [{ field: 'authorization', message: '未授权' }]
      );
    }

    // 获取用户信息
    const userInfo = await db('users').where({ user_id: user.user_id }).first();

    if (!userInfo) {
      return errorResponse(
        res,
        '用户不存在',
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        [{ field: 'user', message: '用户不存在' }]
      );
    }

    // 生成订阅 URL
    const subscriptionUrl = `${req.protocol}://${req.get('host')}/subscription/config`;

    // 生成二维码
    const qrCode = await subscriptionService.generateQRCode(subscriptionUrl);

    successResponse(res, { qrCode, url: subscriptionUrl }, '获取二维码成功');
  } catch (error) {
    logger.error('Failed to generate subscription QR:', error);
    errorResponse(
      res,
      '生成二维码失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '生成二维码失败' }]
    );
  }
});

/**
 * GET /subscription/clash - 获取 Clash 配置（用户）
 * 支持通过 VPN UUID (token 参数) 或 JWT Token 认证
 */
router.get('/subscription/clash', authenticateByVpnUuid, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return errorResponse(
        res,
        '未授权',
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        [{ field: 'authorization', message: '未授权' }]
      );
    }

    // 使用新的 generateSubscriptionConfig 方法
    const config = await subscriptionService.generateSubscriptionConfig(user.user_id);

    // 如果没有可访问的节点，返回 404
    if (!config || config.nodes.length === 0) {
      return errorResponse(
        res,
        '没有可访问的节点',
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        [{ field: 'nodes', message: '没有可访问的节点' }]
      );
    }

    const clashConfig = subscriptionService.generateClashConfig(config);

    res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${user.user_id}.yaml"`);
    res.send(Buffer.from(clashConfig, 'base64').toString('utf-8'));
  } catch (error) {
    logger.error('Failed to get Clash config:', error);
    errorResponse(
      res,
      '获取 Clash 配置失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '获取 Clash 配置失败' }]
    );
  }
});

/**
 * GET /subscription/surge - 获取 Surge 配置（用户）
 * 支持通过 VPN UUID (token 参数) 或 JWT Token 认证
 */
router.get('/subscription/surge', authenticateByVpnUuid, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return errorResponse(
        res,
        '未授权',
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        [{ field: 'authorization', message: '未授权' }]
      );
    }

    // 使用新的 generateSubscriptionConfig 方法
    const config = await subscriptionService.generateSubscriptionConfig(user.user_id);

    // 如果没有可访问的节点，返回 404
    if (!config || config.nodes.length === 0) {
      return errorResponse(
        res,
        '没有可访问的节点',
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        [{ field: 'nodes', message: '没有可访问的节点' }]
      );
    }

    const surgeConfig = subscriptionService.generateSurgeConfig(config);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${user.user_id}.conf"`);
    res.send(Buffer.from(surgeConfig, 'base64').toString('utf-8'));
  } catch (error) {
    logger.error('Failed to get Surge config:', error);
    errorResponse(
      res,
      '获取 Surge 配置失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '获取 Surge 配置失败' }]
    );
  }
});

/**
 * GET /nodes/:id/config - 获取节点配置（用户）
 */
router.get('/nodes/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return errorResponse(
        res,
        '未授权',
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        [{ field: 'authorization', message: '未授权' }]
      );
    }

    // 检查用户是否有权限访问该节点
    const accessCheck = await nodeFilterService.checkUserNodeAccess(id, user.user_id);
    if (!accessCheck.allowed) {
      return errorResponse(
        res,
        accessCheck.reason || '无权访问该节点',
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        [{ field: 'id', message: accessCheck.reason || '无权访问该节点' }]
      );
    }

    // 获取节点信息
    const node = await db('nodes').where({ id, is_active: true }).first();

    if (!node) {
      return errorResponse(
        res,
        '节点不存在',
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        [{ field: 'id', message: '节点不存在' }]
      );
    }

    // 获取用户信息
    const userInfo = await db('users').where({ user_id: user.user_id }).first();

    if (!userInfo) {
      return errorResponse(
        res,
        '用户不存在',
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        [{ field: 'user', message: '用户不存在' }]
      );
    }

    // 生成分享链接
    const nodeConfig: import('@/services/xray').NodeConfig = {
      id: node.id,
      name: node.name,
      protocol: node.protocol,
      host: node.host,
      port: node.port,
      security: node.security,
      network: node.network,
      path: node.path,
      serviceName: node.service_name,
      flow: node.flow,
      encryption: node.encryption,
    };

    const shareLink = subscriptionService.generateNodeLink(nodeConfig, userInfo.vpn_uuid, userInfo.email);

    // 生成二维码
    const qrCode = await subscriptionService.generateQRCode(shareLink);

    successResponse(res, {
      link: shareLink,
      qrCode,
      node: {
        id: node.id,
        name: node.name,
        protocol: node.protocol,
        host: node.host,
        port: node.port,
      },
    }, '获取节点配置成功');
  } catch (error) {
    logger.error('Failed to get node config:', error);
    errorResponse(
      res,
      '获取节点配置失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '获取节点配置失败' }]
    );
  }
});

/**
 * GET /nodes/:id/latency - 测试节点延迟（用户）
 */
router.get('/nodes/:id/latency', async (req, res) => {
  try {
    const { id } = req.params;

    // 获取节点信息
    const node = await db('nodes').where({ id, is_active: true }).first();

    if (!node) {
      return errorResponse(
        res,
        '节点不存在',
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        [{ field: 'id', message: '节点不存在' }]
      );
    }

    // 执行延迟测试
    const result = await healthCheckService.testLatency(id, node.host, node.port);

    successResponse(res, result, '延迟测试完成');
  } catch (error) {
    logger.error('Failed to test latency:', error);
    errorResponse(
      res,
      '延迟测试失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '延迟测试失败' }]
    );
  }
});

/**
 * GET /traffic/realtime - 获取实时流量（用户）
 */
router.get('/traffic/realtime', async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return errorResponse(
        res,
        '未授权',
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        [{ field: 'authorization', message: '未授权' }]
      );
    }

    // 查询 Xray 流量统计
    const stats = await xrayService.queryUserTraffic(user.email);

    if (!stats) {
      return successResponse(res, {
        upload: 0,
        download: 0,
        total: 0,
      }, '获取实时流量成功');
    }

    successResponse(res, {
      upload: stats.upload,
      download: stats.download,
      total: stats.total,
    }, '获取实时流量成功');
  } catch (error) {
    logger.error('Failed to get realtime traffic:', error);
    errorResponse(
      res,
      '获取实时流量失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '获取实时流量失败' }]
    );
  }
});

/**
 * GET /traffic/usage - 获取流量使用情况（用户）
 */
router.get('/traffic/usage', async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return errorResponse(
        res,
        '未授权',
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        [{ field: 'authorization', message: '未授权' }]
      );
    }

    // 获取用户信息
    const userInfo = await db('users').where({ user_id: user.user_id }).first();

    if (!userInfo) {
      return errorResponse(
        res,
        '用户不存在',
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        [{ field: 'user', message: '用户不存在' }]
      );
    }

    // 获取今日流量
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await db('traffic_daily')
      .where({ user_id: userInfo.id, date: today })
      .sum('total as total')
      .first();

    // 获取本月流量
    const now = new Date();
    const monthStats = await db('traffic_monthly')
      .where({
        user_id: userInfo.id,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      })
      .first();

    successResponse(res, {
      total: userInfo.traffic_limit,
      used: userInfo.traffic_used,
      remaining: Math.max(0, userInfo.traffic_limit - userInfo.traffic_used),
      percentage: userInfo.traffic_limit > 0
        ? Math.round((userInfo.traffic_used / userInfo.traffic_limit) * 100)
        : 0,
      today: parseInt(todayStats?.total as string, 10) || 0,
      month: monthStats?.total || 0,
    }, '获取流量使用情况成功');
  } catch (error) {
    logger.error('Failed to get traffic usage:', error);
    errorResponse(
      res,
      '获取流量使用情况失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR,
      [{ field: 'general', message: '获取流量使用情况失败' }]
    );
  }
});

export { router as xrayRoutes };
