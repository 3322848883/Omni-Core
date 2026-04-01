"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordTraffic = exports.getUserTraffic = exports.getTrafficTrend = exports.getTrafficOverview = void 0;
const database_1 = __importDefault(require("@/config/database"));
const AppError_1 = require("@/errors/AppError");
/**
 * Get traffic overview for a user (today, this month, total)
 */
const getTrafficOverview = async (userId) => {
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    // Get today's traffic
    const todayStats = await (0, database_1.default)('traffic_stats_daily')
        .where({ user_id: userId })
        .where('stat_date', '=', today.toISOString().split('T')[0])
        .first();
    // Get this month's traffic
    const monthStats = await (0, database_1.default)('traffic_stats_daily')
        .where({ user_id: userId })
        .where('stat_date', '>=', firstDayOfMonth.toISOString().split('T')[0])
        .where('stat_date', '<=', today.toISOString().split('T')[0])
        .select(database_1.default.raw('SUM(upload_bytes) as upload_bytes'), database_1.default.raw('SUM(download_bytes) as download_bytes'), database_1.default.raw('SUM(total_bytes) as total_bytes'))
        .first();
    // Get total traffic from user record
    const totalUpload = user.traffic_used_upload || 0;
    const totalDownload = user.traffic_used_download || user.traffic_used || 0;
    const totalTraffic = totalUpload + totalDownload;
    return {
        today: {
            upload: todayStats?.upload_bytes || 0,
            download: todayStats?.download_bytes || 0,
            total: todayStats?.total_bytes || 0,
        },
        thisMonth: {
            upload: parseInt(monthStats?.upload_bytes || 0, 10),
            download: parseInt(monthStats?.download_bytes || 0, 10),
            total: parseInt(monthStats?.total_bytes || 0, 10),
        },
        total: {
            upload: totalUpload,
            download: totalDownload,
            total: totalTraffic,
        },
    };
};
exports.getTrafficOverview = getTrafficOverview;
/**
 * Get traffic trend for a user over specified number of days
 */
const getTrafficTrend = async (userId, days) => {
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days + 1);
    // Get traffic stats from database
    const stats = await (0, database_1.default)('traffic_stats_daily')
        .where({ user_id: userId })
        .where('stat_date', '>=', startDate.toISOString().split('T')[0])
        .where('stat_date', '<=', endDate.toISOString().split('T')[0])
        .orderBy('stat_date', 'asc')
        .select('stat_date as date', 'upload_bytes as upload', 'download_bytes as download', 'total_bytes as total');
    // Create a map of existing stats
    const statsMap = new Map();
    stats.forEach((stat) => {
        statsMap.set(stat.date, {
            date: stat.date,
            upload: stat.upload,
            download: stat.download,
            total: stat.total,
        });
    });
    // Fill in missing dates with zero values
    const result = [];
    for (let i = 0; i < days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        if (statsMap.has(dateStr)) {
            result.push(statsMap.get(dateStr));
        }
        else {
            result.push({
                date: dateStr,
                upload: 0,
                download: 0,
                total: 0,
            });
        }
    }
    return result;
};
exports.getTrafficTrend = getTrafficTrend;
/**
 * Get user traffic information with daily stats
 */
const getUserTraffic = async (userId, days) => {
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    const trafficLimit = user.traffic_limit || 0;
    const trafficUsed = user.traffic_used || 0;
    const trafficRemaining = Math.max(0, trafficLimit - trafficUsed);
    const usagePercent = trafficLimit > 0 ? Math.round((trafficUsed / trafficLimit) * 100) : 0;
    // Get daily stats for the specified period
    const dailyStats = await (0, exports.getTrafficTrend)(userId, days);
    // Calculate period totals
    const periodUpload = dailyStats.reduce((sum, stat) => sum + stat.upload, 0);
    const periodDownload = dailyStats.reduce((sum, stat) => sum + stat.download, 0);
    const periodTotal = periodUpload + periodDownload;
    return {
        userId,
        trafficLimit,
        trafficUsed,
        trafficRemaining,
        usagePercent,
        period: {
            upload: periodUpload,
            download: periodDownload,
            total: periodTotal,
            days,
        },
        dailyStats,
    };
};
exports.getUserTraffic = getUserTraffic;
/**
 * Record traffic for a user
 */
const recordTraffic = async (userId, upload, download) => {
    const user = await (0, database_1.default)('users').where({ user_id: userId }).first();
    if (!user) {
        throw new AppError_1.NotFoundError('User', userId);
    }
    const today = new Date().toISOString().split('T')[0];
    const total = upload + download;
    // Use transaction to ensure data consistency
    await database_1.default.transaction(async (trx) => {
        // Check if record exists for today
        const existingRecord = await trx('traffic_stats_daily')
            .where({ user_id: userId, stat_date: today })
            .first();
        if (existingRecord) {
            // Update existing record
            await trx('traffic_stats_daily')
                .where({ user_id: userId, stat_date: today })
                .update({
                upload_bytes: existingRecord.upload_bytes + upload,
                download_bytes: existingRecord.download_bytes + download,
                total_bytes: existingRecord.total_bytes + total,
                updated_at: new Date(),
            });
        }
        else {
            // Create new record
            await trx('traffic_stats_daily').insert({
                user_id: userId,
                stat_date: today,
                upload_bytes: upload,
                download_bytes: download,
                total_bytes: total,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }
        // Update user's total traffic
        await trx('users')
            .where({ user_id: userId })
            .update({
            traffic_used: (user.traffic_used || 0) + total,
            updated_at: new Date(),
        });
    });
};
exports.recordTraffic = recordTraffic;
//# sourceMappingURL=trafficService.js.map