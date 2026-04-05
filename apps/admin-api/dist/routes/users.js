"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../database");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
const router = (0, express_1.Router)();
exports.userRoutes = router;
// GET /api/v1/users - Get all users with pagination and filters
router.get('/', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.UserValidation.list), async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;
        let query = (0, database_1.db)('users').where('status', '!=', 3);
        if (status) {
            query = query.where('status', status);
        }
        if (search) {
            query = query.where(function () {
                this.where('email', 'like', `%${search}%`)
                    .orWhere('username', 'like', `%${search}%`)
                    .orWhere('user_id', 'like', `%${search}%`);
            });
        }
        const [countResult] = await query.clone().count('* as count');
        const total = parseInt(countResult.count);
        const users = await query
            .select('*')
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset);
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                items: users.map(user => ({
                    id: user.id,
                    userId: user.user_id,
                    email: user.email,
                    username: user.username,
                    vpnUuid: user.vpn_uuid,
                    status: user.status,
                    trafficLimit: user.traffic_limit,
                    trafficUsed: user.traffic_used,
                    expireDate: user.expire_date,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/users/:id - Get user by ID
router.get('/:id', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.UserValidation.byId), async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await (0, database_1.db)('users')
            .where('user_id', id)
            .where('status', '!=', 3)
            .first();
        if (!user) {
            throw new errors_1.NotFoundError('User', id);
        }
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                id: user.id,
                userId: user.user_id,
                email: user.email,
                username: user.username,
                vpnUuid: user.vpn_uuid,
                status: user.status,
                trafficLimit: user.traffic_limit,
                trafficUsed: user.traffic_used,
                expireDate: user.expire_date,
                createdAt: user.created_at,
                updatedAt: user.updated_at,
                version: user.version
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/users - Create new user
router.post('/', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.UserValidation.create), async (req, res, next) => {
    try {
        const { email, username, password, trafficLimit = 10737418240, expireDate } = req.body;
        const existingUser = await (0, database_1.db)('users')
            .where('email', email)
            .orWhere('username', username)
            .first();
        if (existingUser) {
            throw new errors_1.ValidationError([
                { field: 'email', message: 'Email or username already exists' }
            ]);
        }
        const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const vpnUuid = (0, uuid_1.v4)();
        // Hash password if provided
        let passwordHash = null;
        if (password) {
            passwordHash = await bcryptjs_1.default.hash(password, 10);
        }
        await (0, database_1.db)('users').insert({
            user_id: userId,
            email,
            username,
            password_hash: passwordHash,
            vpn_uuid: vpnUuid,
            status: 1,
            traffic_limit: trafficLimit,
            traffic_used: 0,
            expire_date: expireDate || null,
            version: 1
        });
        // Fetch the created user (MySQL compatible)
        const user = await (0, database_1.db)('users').where('user_id', userId).first();
        await (0, database_1.db)('user_history').insert({
            user_id: userId,
            field_name: 'created',
            old_value: null,
            new_value: JSON.stringify({ email, username }),
            changed_by: req.user?.username || 'system',
            ip_address: req.ip
        });
        logger_1.logger.info(`User created: ${userId} by ${req.user?.username || 'system'}`);
        res.status(201).json({
            success: true,
            code: 201,
            message: 'User created successfully',
            data: {
                id: user.id,
                userId: user.user_id,
                email: user.email,
                username: user.username,
                vpnUuid: user.vpn_uuid,
                status: user.status,
                trafficLimit: user.traffic_limit,
                trafficUsed: user.traffic_used,
                expireDate: user.expire_date,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/v1/users/:id - Update user
router.put('/:id', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.UserValidation.update), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { username, trafficLimit, expireDate, status } = req.body;
        const user = await (0, database_1.db)('users')
            .where('user_id', id)
            .where('status', '!=', 3)
            .first();
        if (!user) {
            throw new errors_1.NotFoundError('User', id);
        }
        const updateData = {
            updated_at: new Date(),
            version: user.version + 1
        };
        if (username !== undefined) {
            updateData.username = username;
        }
        if (trafficLimit !== undefined) {
            updateData.traffic_limit = trafficLimit;
        }
        if (expireDate !== undefined) {
            updateData.expire_date = expireDate;
        }
        if (status !== undefined) {
            updateData.status = status;
        }
        // MySQL compatible update (no returning)
        await (0, database_1.db)('users')
            .where('user_id', id)
            .update(updateData);
        // Fetch updated user
        const updatedUser = await (0, database_1.db)('users')
            .where('user_id', id)
            .first();
        for (const [key, value] of Object.entries(updateData)) {
            if (key !== 'updated_at' && key !== 'version') {
                await (0, database_1.db)('user_history').insert({
                    user_id: id,
                    field_name: key,
                    old_value: user[key],
                    new_value: value,
                    changed_by: req.user?.username || 'system',
                    ip_address: req.ip
                });
            }
        }
        logger_1.logger.info(`User updated: ${id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'User updated successfully',
            data: {
                id: updatedUser.id,
                userId: updatedUser.user_id,
                email: updatedUser.email,
                username: updatedUser.username,
                vpnUuid: updatedUser.vpn_uuid,
                status: updatedUser.status,
                trafficLimit: updatedUser.traffic_limit,
                trafficUsed: updatedUser.traffic_used,
                expireDate: updatedUser.expire_date,
                createdAt: updatedUser.created_at,
                updatedAt: updatedUser.updated_at,
                version: updatedUser.version
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/v1/users/:id - Delete user (soft delete)
router.delete('/:id', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.UserValidation.byId), async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await (0, database_1.db)('users')
            .where('user_id', id)
            .where('status', '!=', 3)
            .first();
        if (!user) {
            throw new errors_1.NotFoundError('User', id);
        }
        await (0, database_1.db)('users')
            .where('user_id', id)
            .update({
            status: 3,
            updated_at: new Date(),
            version: user.version + 1
        });
        await (0, database_1.db)('user_history').insert({
            user_id: id,
            field_name: 'deleted',
            old_value: user.status,
            new_value: 3,
            changed_by: req.user?.username || 'system',
            ip_address: req.ip
        });
        logger_1.logger.info(`User deleted: ${id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/users/:id/ban - Ban user
router.post('/:id/ban', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.UserValidation.ban), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const user = await (0, database_1.db)('users')
            .where('user_id', id)
            .where('status', '!=', 3)
            .first();
        if (!user) {
            throw new errors_1.NotFoundError('User', id);
        }
        await (0, database_1.db)('users')
            .where('user_id', id)
            .update({
            status: 2,
            updated_at: new Date(),
            version: user.version + 1
        });
        await (0, database_1.db)('user_history').insert({
            user_id: id,
            field_name: 'banned',
            old_value: String(user.status),
            new_value: '2',
            changed_by: req.user?.username || 'system',
            ip_address: req.ip
        });
        logger_1.logger.info(`User banned: ${id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'User banned successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/users/:id/unban - Unban user
router.post('/:id/unban', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.UserValidation.byId), async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await (0, database_1.db)('users')
            .where('user_id', id)
            .where('status', '!=', 3)
            .first();
        if (!user) {
            throw new errors_1.NotFoundError('User', id);
        }
        await (0, database_1.db)('users')
            .where('user_id', id)
            .update({
            status: 1,
            updated_at: new Date(),
            version: user.version + 1
        });
        await (0, database_1.db)('user_history').insert({
            user_id: id,
            field_name: 'unbanned',
            old_value: user.status,
            new_value: 1,
            changed_by: req.user?.username || 'system',
            ip_address: req.ip
        });
        logger_1.logger.info(`User unbanned: ${id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'User unbanned successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/users/:id/traffic - Get user traffic stats
router.get('/:id/traffic', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.UserValidation.traffic), async (req, res, next) => {
    try {
        const { id } = req.params;
        const days = parseInt(req.query.days) || 30;
        const user = await (0, database_1.db)('users')
            .where('user_id', id)
            .where('status', '!=', 3)
            .first();
        if (!user) {
            throw new errors_1.NotFoundError('User', id);
        }
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const trafficStats = await (0, database_1.db)('traffic_stats_daily')
            .where('user_id', id)
            .where('stat_date', '>=', startDate.toISOString().split('T')[0])
            .orderBy('stat_date', 'asc')
            .select('*');
        const totalUpload = trafficStats.reduce((sum, stat) => sum + (stat.upload_bytes || 0), 0);
        const totalDownload = trafficStats.reduce((sum, stat) => sum + (stat.download_bytes || 0), 0);
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                userId: id,
                trafficLimit: user.traffic_limit,
                trafficUsed: user.traffic_used,
                trafficRemaining: Math.max(0, user.traffic_limit - user.traffic_used),
                usagePercent: Math.round((user.traffic_used / user.traffic_limit) * 100),
                totalUpload,
                totalDownload,
                dailyStats: trafficStats.map(stat => ({
                    date: stat.stat_date,
                    upload: stat.upload_bytes,
                    download: stat.download_bytes,
                    total: stat.total_bytes
                }))
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/users/:id/orders - Get user orders
router.get('/:id/orders', auth_1.authMiddleware, (0, validation_1.validate)(validation_1.UserValidation.byId), async (req, res, next) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const user = await (0, database_1.db)('users')
            .where('user_id', id)
            .where('status', '!=', 3)
            .first();
        if (!user) {
            throw new errors_1.NotFoundError('User', id);
        }
        const [countResult] = await (0, database_1.db)('orders')
            .where('user_id', id)
            .count('* as count');
        const total = parseInt(countResult.count);
        const orders = await (0, database_1.db)('orders')
            .where('user_id', id)
            .orderBy('created_at', 'desc')
            .limit(limit)
            .offset(offset)
            .select('*');
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: {
                items: orders.map(order => ({
                    id: order.id,
                    orderNo: order.order_no,
                    userId: order.user_id,
                    orderType: order.order_type,
                    status: order.status,
                    amount: order.amount,
                    trafficLimit: order.traffic_limit,
                    durationDays: order.duration_days,
                    startDate: order.start_date,
                    endDate: order.end_date,
                    paymentMethod: order.payment_method,
                    paymentTime: order.payment_time,
                    createdAt: order.created_at,
                    updatedAt: order.updated_at
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=users.js.map