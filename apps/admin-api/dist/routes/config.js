"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../database");
const auth_1 = require("../middlewares/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.configRoutes = router;
router.get('/', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { category } = req.query;
        let query = (0, database_1.db)('system_config').select('*');
        if (category && typeof category === 'string') {
            query = query.where('category', category);
        }
        const configs = await query.orderBy('category').orderBy('config_key');
        const groupedConfigs = {};
        configs.forEach((config) => {
            if (!groupedConfigs[config.category]) {
                groupedConfigs[config.category] = [];
            }
            groupedConfigs[config.category].push(config);
        });
        res.json({
            success: true,
            data: {
                items: configs,
                grouped: groupedConfigs,
                categories: Object.keys(groupedConfigs)
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching configs:', error);
        next(error);
    }
});
router.get('/:key', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { key } = req.params;
        const config = await (0, database_1.db)('system_config')
            .where('config_key', key)
            .first();
        if (!config) {
            return res.status(404).json({
                success: false,
                error: 'Configuration not found'
            });
        }
        res.json({
            success: true,
            data: config
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching config:', error);
        next(error);
    }
});
router.put('/:key', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { key } = req.params;
        const { value, description } = req.body;
        const adminId = req.user?.sub;
        const config = await (0, database_1.db)('system_config')
            .where('config_key', key)
            .first();
        if (!config) {
            return res.status(404).json({
                success: false,
                error: 'Configuration not found'
            });
        }
        const oldValue = config.config_value;
        const updateData = {
            config_value: value,
            updated_at: new Date(),
            updated_by: adminId
        };
        if (description !== undefined) {
            updateData.description = description;
        }
        await (0, database_1.db)('system_config')
            .where('config_key', key)
            .update(updateData);
        await (0, database_1.db)('config_history').insert({
            config_key: key,
            old_value: oldValue,
            new_value: value,
            changed_by: adminId,
            changed_at: new Date()
        });
        logger_1.logger.info({
            message: 'Configuration updated',
            key,
            adminId,
            ip: req.ip
        });
        const updated = await (0, database_1.db)('system_config')
            .where('config_key', key)
            .first();
        res.json({
            success: true,
            message: 'Configuration updated successfully',
            data: updated
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating config:', error);
        next(error);
    }
});
router.get('/:key/history', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { key } = req.params;
        const { limit = '50', offset = '0' } = req.query;
        const pageLimit = Math.min(parseInt(limit) || 50, 100);
        const pageOffset = parseInt(offset) || 0;
        const history = await (0, database_1.db)('config_history')
            .select('config_history.*', 'admin_users.username as changed_by_username')
            .leftJoin('admin_users', 'config_history.changed_by', 'admin_users.id')
            .where('config_history.config_key', key)
            .orderBy('changed_at', 'desc')
            .limit(pageLimit)
            .offset(pageOffset);
        const [{ total }] = await (0, database_1.db)('config_history')
            .where('config_key', key)
            .count('* as total');
        res.json({
            success: true,
            data: {
                items: history,
                total: parseInt(total),
                limit: pageLimit,
                offset: pageOffset
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching config history:', error);
        next(error);
    }
});
router.post('/reset/:key', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { key } = req.params;
        const adminId = req.user?.sub;
        const config = await (0, database_1.db)('system_config')
            .where('config_key', key)
            .first();
        if (!config) {
            return res.status(404).json({
                success: false,
                error: 'Configuration not found'
            });
        }
        if (!config.default_value) {
            return res.status(400).json({
                success: false,
                error: 'No default value available for this configuration'
            });
        }
        const oldValue = config.config_value;
        await (0, database_1.db)('system_config')
            .where('config_key', key)
            .update({
            config_value: config.default_value,
            updated_at: new Date(),
            updated_by: adminId
        });
        await (0, database_1.db)('config_history').insert({
            config_key: key,
            old_value: oldValue,
            new_value: config.default_value,
            changed_by: adminId,
            changed_at: new Date()
        });
        logger_1.logger.info({
            message: 'Configuration reset to default',
            key,
            adminId,
            ip: req.ip
        });
        const updated = await (0, database_1.db)('system_config')
            .where('config_key', key)
            .first();
        res.json({
            success: true,
            message: 'Configuration reset to default value',
            data: updated
        });
    }
    catch (error) {
        logger_1.logger.error('Error resetting config:', error);
        next(error);
    }
});
router.post('/batch-update', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res, next) => {
    try {
        const { configs } = req.body;
        const adminId = req.user?.sub;
        if (!Array.isArray(configs)) {
            return res.status(400).json({
                success: false,
                error: 'Configs must be an array'
            });
        }
        const results = [];
        const errors = [];
        for (const item of configs) {
            const { key, value, description } = item;
            try {
                const config = await (0, database_1.db)('system_config')
                    .where('config_key', key)
                    .first();
                if (!config) {
                    errors.push({ key, error: 'Configuration not found' });
                    continue;
                }
                const oldValue = config.config_value;
                const updateData = {
                    config_value: value,
                    updated_at: new Date(),
                    updated_by: adminId
                };
                if (description !== undefined) {
                    updateData.description = description;
                }
                await (0, database_1.db)('system_config')
                    .where('config_key', key)
                    .update(updateData);
                await (0, database_1.db)('config_history').insert({
                    config_key: key,
                    old_value: oldValue,
                    new_value: value,
                    changed_by: adminId,
                    changed_at: new Date()
                });
                const updated = await (0, database_1.db)('system_config')
                    .where('config_key', key)
                    .first();
                results.push(updated);
            }
            catch (err) {
                errors.push({ key, error: 'Update failed' });
            }
        }
        logger_1.logger.info({
            message: 'Batch configuration update',
            count: results.length,
            adminId,
            ip: req.ip
        });
        res.json({
            success: true,
            message: `Updated ${results.length} configurations`,
            data: {
                updated: results,
                errors: errors.length > 0 ? errors : undefined
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error batch updating configs:', error);
        next(error);
    }
});
//# sourceMappingURL=config.js.map