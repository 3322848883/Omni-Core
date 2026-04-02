"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRoutes = void 0;
const express_1 = require("express");
const project_service_1 = require("../services/project/project.service");
const auth_1 = require("../middlewares/auth");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
exports.projectRoutes = router;
router.get('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const merchantId = parseInt(req.query.merchantId);
        if (!merchantId) {
            throw new errors_1.ValidationError([{ field: 'merchantId', message: 'Merchant ID is required' }]);
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const search = req.query.search;
        const result = await project_service_1.ProjectService.listProjects(merchantId, page, limit, status, search);
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const project = await project_service_1.ProjectService.getProjectById(parseInt(id));
        if (!project) {
            throw new errors_1.NotFoundError('Project', id);
        }
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: project
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { merchantId, name, description, config } = req.body;
        if (!merchantId || !name) {
            throw new errors_1.ValidationError([
                { field: 'merchantId', message: 'Merchant ID is required' },
                { field: 'name', message: 'Name is required' }
            ]);
        }
        const project = await project_service_1.ProjectService.createProject({
            merchantId: parseInt(merchantId),
            name,
            description,
            config
        });
        logger_1.logger.info(`Project created: ${project.project_id} by ${req.user?.username || 'system'}`);
        res.status(201).json({
            success: true,
            code: 201,
            message: 'Project created successfully',
            data: project
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { merchantId, name, description, status, config } = req.body;
        if (!merchantId) {
            throw new errors_1.ValidationError([{ field: 'merchantId', message: 'Merchant ID is required' }]);
        }
        const project = await project_service_1.ProjectService.updateProject(parseInt(id), parseInt(merchantId), {
            name,
            description,
            status,
            config
        });
        logger_1.logger.info(`Project updated: ${project.project_id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'Project updated successfully',
            data: project
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { merchantId } = req.body;
        if (!merchantId) {
            throw new errors_1.ValidationError([{ field: 'merchantId', message: 'Merchant ID is required' }]);
        }
        await project_service_1.ProjectService.deleteProject(parseInt(id), parseInt(merchantId));
        logger_1.logger.info(`Project deleted: ${id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'Project deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id/payment-configs', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { merchantId, paymentChannel } = req.query;
        if (!merchantId) {
            throw new errors_1.ValidationError([{ field: 'merchantId', message: 'Merchant ID is required' }]);
        }
        const paymentConfigs = await project_service_1.ProjectService.listProjectPaymentConfigs(parseInt(id), parseInt(merchantId), paymentChannel);
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: paymentConfigs
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/payment-configs', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { merchantId, paymentChannel, config, effectiveFrom, effectiveTo } = req.body;
        if (!merchantId || !paymentChannel || !config || !effectiveFrom) {
            throw new errors_1.ValidationError([
                { field: 'merchantId', message: 'Merchant ID is required' },
                { field: 'paymentChannel', message: 'Payment channel is required' },
                { field: 'config', message: 'Config is required' },
                { field: 'effectiveFrom', message: 'Effective from date is required' }
            ]);
        }
        const paymentConfig = await project_service_1.ProjectService.createProjectPaymentConfig(parseInt(id), parseInt(merchantId), {
            paymentChannel,
            config,
            effectiveFrom: new Date(effectiveFrom),
            effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined
        });
        logger_1.logger.info(`Payment config created for project: ${id} by ${req.user?.username || 'system'}`);
        res.status(201).json({
            success: true,
            code: 201,
            message: 'Payment config created successfully',
            data: paymentConfig
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id/payment-configs/:configId', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id, configId } = req.params;
        const { merchantId, paymentChannel, config, isActive, effectiveFrom, effectiveTo } = req.body;
        if (!merchantId) {
            throw new errors_1.ValidationError([{ field: 'merchantId', message: 'Merchant ID is required' }]);
        }
        const paymentConfig = await project_service_1.ProjectService.updateProjectPaymentConfig(parseInt(configId), parseInt(id), parseInt(merchantId), {
            paymentChannel,
            config,
            isActive,
            effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
            effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined
        });
        logger_1.logger.info(`Payment config updated for project: ${id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'Payment config updated successfully',
            data: paymentConfig
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id/stats', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { merchantId, startDate, endDate } = req.query;
        if (!merchantId) {
            throw new errors_1.ValidationError([{ field: 'merchantId', message: 'Merchant ID is required' }]);
        }
        const stats = await project_service_1.ProjectService.getProjectStats(parseInt(id), parseInt(merchantId), startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: stats
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=projects.js.map