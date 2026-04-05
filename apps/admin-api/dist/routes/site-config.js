"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const database_1 = require("../database");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const constants_1 = require("@shared/constants");
const router = (0, express_1.Router)();
// Parse config value based on type
function parseConfigValue(config) {
    switch (config.config_type) {
        case 'number':
            return parseFloat(config.config_value);
        case 'boolean':
            return config.config_value === 'true';
        case 'json':
            try {
                return JSON.parse(config.config_value);
            }
            catch {
                return config.config_value;
            }
        default:
            return config.config_value;
    }
}
// Public API: Get all public configurations (for frontend)
router.get('/public', async (req, res) => {
    try {
        const configs = await (0, database_1.db)('site_config')
            .where('is_public', true)
            .select('*');
        const result = {};
        configs.forEach(config => {
            result[config.config_key] = parseConfigValue(config);
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching public config:', error);
        throw new errors_1.AppError(constants_1.ErrorCode.INTERNAL_ERROR, 'Failed to fetch configuration', constants_1.HttpStatus.INTERNAL_ERROR);
    }
});
// Public API: Get pricing configuration (for frontend)
router.get('/pricing', async (req, res) => {
    try {
        const pricingConfigs = await (0, database_1.db)('site_config')
            .where('category', 'pricing')
            .where('is_public', true)
            .select('*');
        const result = {};
        pricingConfigs.forEach(config => {
            const key = config.config_key.replace('pricing_', '');
            result[key] = parseConfigValue(config);
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching pricing config:', error);
        throw new errors_1.AppError(constants_1.ErrorCode.INTERNAL_ERROR, 'Failed to fetch pricing configuration', constants_1.HttpStatus.INTERNAL_ERROR);
    }
});
// Admin API: Get all configurations (requires admin)
router.get('/', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        const { category } = req.query;
        let query = (0, database_1.db)('site_config').select('*');
        if (category) {
            query = query.where('category', category);
        }
        const configs = await query.orderBy('category').orderBy('config_key');
        res.json({
            success: true,
            data: configs.map(config => ({
                ...config,
                parsed_value: parseConfigValue(config)
            }))
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching config:', error);
        throw new errors_1.AppError(constants_1.ErrorCode.INTERNAL_ERROR, 'Failed to fetch configuration', constants_1.HttpStatus.INTERNAL_ERROR);
    }
});
// Admin API: Get single configuration
router.get('/:key', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const config = await (0, database_1.db)('site_config')
            .where('config_key', key)
            .first();
        if (!config) {
            throw new errors_1.AppError(constants_1.ErrorCode.NOT_FOUND, 'Configuration not found', constants_1.HttpStatus.NOT_FOUND);
        }
        res.json({
            success: true,
            data: {
                ...config,
                parsed_value: parseConfigValue(config)
            }
        });
    }
    catch (error) {
        if (error?.name === 'AppError')
            throw error;
        logger_1.logger.error('Error fetching config:', error);
        throw new errors_1.AppError(constants_1.ErrorCode.INTERNAL_ERROR, 'Failed to fetch configuration', constants_1.HttpStatus.INTERNAL_ERROR);
    }
});
// Admin API: Update configuration
router.put('/:key', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const { config_value, config_type, description, is_public } = req.body;
        // Check if config exists
        const existing = await (0, database_1.db)('site_config')
            .where('config_key', key)
            .first();
        if (!existing) {
            throw new errors_1.AppError(constants_1.ErrorCode.NOT_FOUND, 'Configuration not found', constants_1.HttpStatus.NOT_FOUND);
        }
        // Validate config_type
        const validTypes = ['string', 'number', 'boolean', 'json'];
        if (config_type && !validTypes.includes(config_type)) {
            throw new errors_1.AppError(constants_1.ErrorCode.VALIDATION_ERROR, 'Invalid config_type', constants_1.HttpStatus.BAD_REQUEST);
        }
        // Validate JSON type
        if (config_type === 'json' && config_value) {
            try {
                JSON.parse(config_value);
            }
            catch {
                throw new errors_1.AppError(constants_1.ErrorCode.VALIDATION_ERROR, 'Invalid JSON value', constants_1.HttpStatus.BAD_REQUEST);
            }
        }
        const updateData = {
            updated_at: new Date()
        };
        if (config_value !== undefined)
            updateData.config_value = config_value;
        if (config_type)
            updateData.config_type = config_type;
        if (description !== undefined)
            updateData.description = description;
        if (is_public !== undefined)
            updateData.is_public = is_public;
        await (0, database_1.db)('site_config')
            .where('config_key', key)
            .update(updateData);
        // Fetch updated config
        const updated = await (0, database_1.db)('site_config')
            .where('config_key', key)
            .first();
        res.json({
            success: true,
            message: 'Configuration updated successfully',
            data: {
                ...updated,
                parsed_value: parseConfigValue(updated)
            }
        });
    }
    catch (error) {
        if (error?.name === 'AppError')
            throw error;
        logger_1.logger.error('Error updating config:', error);
        throw new errors_1.AppError(constants_1.ErrorCode.INTERNAL_ERROR, 'Failed to update configuration', constants_1.HttpStatus.INTERNAL_ERROR);
    }
});
// Admin API: Batch update configurations
router.put('/', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        const { configs } = req.body;
        if (!Array.isArray(configs)) {
            throw new errors_1.AppError(constants_1.ErrorCode.VALIDATION_ERROR, 'Configs must be an array', constants_1.HttpStatus.BAD_REQUEST);
        }
        const results = [];
        for (const config of configs) {
            const { config_key, config_value, config_type } = config;
            if (!config_key) {
                continue;
            }
            // Validate JSON type
            if (config_type === 'json' && config_value) {
                try {
                    JSON.parse(config_value);
                }
                catch {
                    throw new errors_1.AppError(constants_1.ErrorCode.VALIDATION_ERROR, `Invalid JSON value for ${config_key}`, constants_1.HttpStatus.BAD_REQUEST);
                }
            }
            const existing = await (0, database_1.db)('site_config')
                .where('config_key', config_key)
                .first();
            if (existing) {
                await (0, database_1.db)('site_config')
                    .where('config_key', config_key)
                    .update({
                    config_value,
                    config_type: config_type || existing.config_type,
                    updated_at: new Date()
                });
                results.push({ config_key, status: 'updated' });
            }
            else {
                // Create new config
                await (0, database_1.db)('site_config').insert({
                    config_key,
                    config_value,
                    config_type: config_type || 'string',
                    category: config.category || 'general',
                    description: config.description || null,
                    is_public: config.is_public !== undefined ? config.is_public : true,
                    created_at: new Date(),
                    updated_at: new Date()
                });
                results.push({ config_key, status: 'created' });
            }
        }
        res.json({
            success: true,
            message: 'Configurations updated successfully',
            data: results
        });
    }
    catch (error) {
        if (error?.name === 'AppError')
            throw error;
        logger_1.logger.error('Error batch updating config:', error);
        throw new errors_1.AppError(constants_1.ErrorCode.INTERNAL_ERROR, 'Failed to update configurations', constants_1.HttpStatus.INTERNAL_ERROR);
    }
});
// Admin API: Create new configuration
router.post('/', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        const { config_key, config_value, config_type, category, description, is_public } = req.body;
        if (!config_key || config_value === undefined) {
            throw new errors_1.AppError(constants_1.ErrorCode.VALIDATION_ERROR, 'config_key and config_value are required', constants_1.HttpStatus.BAD_REQUEST);
        }
        // Check if key already exists
        const existing = await (0, database_1.db)('site_config')
            .where('config_key', config_key)
            .first();
        if (existing) {
            throw new errors_1.AppError(constants_1.ErrorCode.CONFLICT, 'Configuration key already exists', constants_1.HttpStatus.CONFLICT);
        }
        // Validate config_type
        const validTypes = ['string', 'number', 'boolean', 'json'];
        if (config_type && !validTypes.includes(config_type)) {
            throw new errors_1.AppError(constants_1.ErrorCode.VALIDATION_ERROR, 'Invalid config_type', constants_1.HttpStatus.BAD_REQUEST);
        }
        // Validate JSON type
        if (config_type === 'json' && config_value) {
            try {
                JSON.parse(config_value);
            }
            catch {
                throw new errors_1.AppError(constants_1.ErrorCode.VALIDATION_ERROR, 'Invalid JSON value', constants_1.HttpStatus.BAD_REQUEST);
            }
        }
        const [id] = await (0, database_1.db)('site_config').insert({
            config_key,
            config_value: config_value.toString(),
            config_type: config_type || 'string',
            category: category || 'general',
            description: description || null,
            is_public: is_public !== undefined ? is_public : true,
            created_at: new Date(),
            updated_at: new Date()
        });
        const newConfig = await (0, database_1.db)('site_config')
            .where('id', id)
            .first();
        res.status(201).json({
            success: true,
            message: 'Configuration created successfully',
            data: {
                ...newConfig,
                parsed_value: parseConfigValue(newConfig)
            }
        });
    }
    catch (error) {
        if (error?.name === 'AppError')
            throw error;
        logger_1.logger.error('Error creating config:', error);
        throw new errors_1.AppError(constants_1.ErrorCode.INTERNAL_ERROR, 'Failed to create configuration', constants_1.HttpStatus.INTERNAL_ERROR);
    }
});
// Admin API: Delete configuration
router.delete('/:key', auth_1.authMiddleware, auth_1.requireAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const existing = await (0, database_1.db)('site_config')
            .where('config_key', key)
            .first();
        if (!existing) {
            throw new errors_1.AppError(constants_1.ErrorCode.NOT_FOUND, 'Configuration not found', constants_1.HttpStatus.NOT_FOUND);
        }
        await (0, database_1.db)('site_config')
            .where('config_key', key)
            .delete();
        res.json({
            success: true,
            message: 'Configuration deleted successfully'
        });
    }
    catch (error) {
        if (error?.name === 'AppError')
            throw error;
        logger_1.logger.error('Error deleting config:', error);
        throw new errors_1.AppError(constants_1.ErrorCode.INTERNAL_ERROR, 'Failed to delete configuration', constants_1.HttpStatus.INTERNAL_ERROR);
    }
});
exports.default = router;
//# sourceMappingURL=site-config.js.map