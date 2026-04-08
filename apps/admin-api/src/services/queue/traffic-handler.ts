import { logger } from '../../utils/logger';
import { db } from '../../database';

export interface TrafficStatsPayload {
  type: 'user_traffic' | 'node_traffic' | 'daily_summary';
  userId?: string;
  nodeId?: string;
  date?: string;
  uploadBytes?: number;
  downloadBytes?: number;
  connectionCount?: number;
}

export class TrafficStatsHandler {
  async handle(payload: TrafficStatsPayload): Promise<void> {
    try {
      logger.info('TrafficStatsHandler: Processing traffic stats task', { type: payload.type });

      switch (payload.type) {
        case 'user_traffic':
          await this.handleUserTraffic(payload);
          break;
        case 'node_traffic':
          await this.handleNodeTraffic(payload);
          break;
        case 'daily_summary':
          await this.handleDailySummary(payload);
          break;
        default:
          logger.warn('TrafficStatsHandler: Unknown traffic stats task type', { type: payload.type });
      }
    } catch (error) {
      logger.error('TrafficStatsHandler: Failed to process traffic stats task', error);
      throw error;
    }
  }

  private async handleUserTraffic(payload: TrafficStatsPayload): Promise<void> {
    if (!payload.userId) {
      throw new Error('User traffic stats requires userId');
    }

    const { userId, uploadBytes = 0, downloadBytes = 0, date } = payload;
    const statsDate = date ? new Date(date) : new Date();
    const dateStr = statsDate.toISOString().split('T')[0];

    try {
      const existing = await db('traffic_stats')
        .where({ user_id: userId, date: dateStr })
        .first();

      if (existing) {
        await db('traffic_stats')
          .where({ id: existing.id })
          .increment('upload_bytes', uploadBytes)
          .increment('download_bytes', downloadBytes)
          .update({ updated_at: db.fn.now() });
      } else {
        await db('traffic_stats').insert({
          user_id: userId,
          date: dateStr,
          upload_bytes: uploadBytes,
          download_bytes: uploadBytes,
          created_at: db.fn.now(),
          updated_at: db.fn.now(),
        });
      }

      logger.info('TrafficStatsHandler: User traffic stats updated', { userId, dateStr, uploadBytes, downloadBytes });
    } catch (dbError) {
      logger.error('TrafficStatsHandler: Database error updating user traffic stats', dbError);
      throw dbError;
    }
  }

  private async handleNodeTraffic(payload: TrafficStatsPayload): Promise<void> {
    if (!payload.nodeId) {
      throw new Error('Node traffic stats requires nodeId');
    }

    const { nodeId, uploadBytes = 0, downloadBytes = 0, date } = payload;
    const statsDate = date ? new Date(date) : new Date();
    const dateStr = statsDate.toISOString().split('T')[0];

    try {
      const existing = await db('node_traffic_stats')
        .where({ node_id: nodeId, date: dateStr })
        .first();

      if (existing) {
        await db('node_traffic_stats')
          .where({ id: existing.id })
          .increment('upload_bytes', uploadBytes)
          .increment('download_bytes', downloadBytes)
          .update({ updated_at: db.fn.now() });
      } else {
        await db('node_traffic_stats').insert({
          node_id: nodeId,
          date: dateStr,
          upload_bytes: uploadBytes,
          download_bytes: downloadBytes,
          created_at: db.fn.now(),
          updated_at: db.fn.now(),
        });
      }

      logger.info('TrafficStatsHandler: Node traffic stats updated', { nodeId, dateStr, uploadBytes, downloadBytes });
    } catch (dbError) {
      logger.error('TrafficStatsHandler: Database error updating node traffic stats', dbError);
      throw dbError;
    }
  }

  private async handleDailySummary(payload: TrafficStatsPayload): Promise<void> {
    const { date } = payload;
    const summaryDate = date ? new Date(date) : new Date();
    const dateStr = summaryDate.toISOString().split('T')[0];

    try {
      const userStats = await db('traffic_stats')
        .select(
          db.raw('SUM(upload_bytes) as total_upload'),
          db.raw('SUM(download_bytes) as total_download'),
          db.raw('COUNT(DISTINCT user_id) as active_users')
        )
        .where({ date: dateStr })
        .first();

      const nodeStats = await db('node_traffic_stats')
        .select(
          db.raw('SUM(upload_bytes) as total_upload'),
          db.raw('SUM(download_bytes) as total_download')
        )
        .where({ date: dateStr })
        .first();

      const existingSummary = await db('daily_traffic_summaries')
        .where({ date: dateStr })
        .first();

      const summaryData = {
        date: dateStr,
        total_upload: Number(userStats?.total_upload || 0) + Number(nodeStats?.total_upload || 0),
        total_download: Number(userStats?.total_download || 0) + Number(nodeStats?.total_download || 0),
        active_users: Number(userStats?.active_users || 0),
        updated_at: db.fn.now(),
      };

      if (existingSummary) {
        await db('daily_traffic_summaries')
          .where({ id: existingSummary.id })
          .update(summaryData);
      } else {
        await db('daily_traffic_summaries').insert({
          ...summaryData,
          created_at: db.fn.now(),
        });
      }

      logger.info('TrafficStatsHandler: Daily traffic summary generated', { dateStr });
    } catch (dbError) {
      logger.error('TrafficStatsHandler: Database error generating daily summary', dbError);
      throw dbError;
    }
  }
}

export const trafficStatsHandler = new TrafficStatsHandler();
