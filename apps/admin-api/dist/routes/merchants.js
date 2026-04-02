"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantRoutes = void 0;
const express_1 = require("express");
const merchant_service_1 = require("../services/merchant/merchant.service");
const auth_1 = require("../middlewares/auth");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
exports.merchantRoutes = router;
// GET /api/v1/merchants - List all merchants
router.get('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const search = req.query.search;
        const result = await merchant_service_1.MerchantService.listMerchants(page, limit, status, search);
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
// GET /api/v1/merchants/:id - Get merchant by ID
router.get('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const merchant = await merchant_service_1.MerchantService.getMerchantById(parseInt(id));
        if (!merchant) {
            throw new errors_1.NotFoundError('Merchant', id);
        }
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: merchant
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/merchants - Create new merchant
router.post('/', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { name, email, phone, businessLicense, taxId, contactPerson, address, website, notes } = req.body;
        if (!name || !email) {
            throw new errors_1.ValidationError([
                { field: 'name', message: 'Name is required' },
                { field: 'email', message: 'Email is required' }
            ]);
        }
        const merchant = await merchant_service_1.MerchantService.createMerchant({
            name,
            email,
            phone,
            businessLicense,
            taxId,
            contactPerson,
            address,
            website,
            notes
        });
        logger_1.logger.info(`Merchant created: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);
        res.status(201).json({
            success: true,
            code: 201,
            message: 'Merchant created successfully',
            data: merchant
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/v1/merchants/:id - Update merchant
router.put('/:id', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, businessLicense, taxId, contactPerson, address, website, status, notes } = req.body;
        const merchant = await merchant_service_1.MerchantService.updateMerchant(parseInt(id), {
            name,
            email,
            phone,
            businessLicense,
            taxId,
            contactPerson,
            address,
            website,
            status,
            notes
        });
        logger_1.logger.info(`Merchant updated: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'Merchant updated successfully',
            data: merchant
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/merchants/:id/api-keys - List merchant API keys
router.get('/:id/api-keys', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const merchant = await merchant_service_1.MerchantService.getMerchantById(parseInt(id));
        if (!merchant) {
            throw new errors_1.NotFoundError('Merchant', id);
        }
        const apiKeys = await merchant_service_1.MerchantService.listApiKeys(parseInt(id));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: apiKeys
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/merchants/:id/api-keys - Create API key
router.post('/:id/api-keys', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { keyName, scopes, ipWhitelist, expiresAt } = req.body;
        if (!keyName) {
            throw new errors_1.ValidationError([
                { field: 'keyName', message: 'Key name is required' }
            ]);
        }
        const merchant = await merchant_service_1.MerchantService.getMerchantById(parseInt(id));
        if (!merchant) {
            throw new errors_1.NotFoundError('Merchant', id);
        }
        const apiKey = await merchant_service_1.MerchantService.createApiKey(parseInt(id), {
            keyName,
            scopes,
            ipWhitelist,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined
        });
        logger_1.logger.info(`API key created for merchant: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);
        res.status(201).json({
            success: true,
            code: 201,
            message: 'API key created successfully',
            data: apiKey
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/merchants/:id/api-keys/:keyId/revoke - Revoke API key
router.post('/:id/api-keys/:keyId/revoke', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id, keyId } = req.params;
        const merchant = await merchant_service_1.MerchantService.getMerchantById(parseInt(id));
        if (!merchant) {
            throw new errors_1.NotFoundError('Merchant', id);
        }
        await merchant_service_1.MerchantService.revokeApiKey(parseInt(keyId), parseInt(id));
        logger_1.logger.info(`API key revoked for merchant: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'API key revoked successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/merchants/:id/rates - List merchant rates
router.get('/:id/rates', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paymentMethod } = req.query;
        const merchant = await merchant_service_1.MerchantService.getMerchantById(parseInt(id));
        if (!merchant) {
            throw new errors_1.NotFoundError('Merchant', id);
        }
        const rates = await merchant_service_1.MerchantService.listRates(parseInt(id), paymentMethod);
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: rates
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/merchants/:id/rates - Create merchant rate
router.post('/:id/rates', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { paymentMethod, currency, transactionRate, fixedFee, minFee, maxFee, effectiveFrom, effectiveTo } = req.body;
        if (!paymentMethod || transactionRate === undefined || !effectiveFrom) {
            throw new errors_1.ValidationError([
                { field: 'paymentMethod', message: 'Payment method is required' },
                { field: 'transactionRate', message: 'Transaction rate is required' },
                { field: 'effectiveFrom', message: 'Effective from date is required' }
            ]);
        }
        const merchant = await merchant_service_1.MerchantService.getMerchantById(parseInt(id));
        if (!merchant) {
            throw new errors_1.NotFoundError('Merchant', id);
        }
        const rate = await merchant_service_1.MerchantService.createRate(parseInt(id), {
            paymentMethod,
            currency,
            transactionRate,
            fixedFee,
            minFee,
            maxFee,
            effectiveFrom: new Date(effectiveFrom),
            effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined
        });
        logger_1.logger.info(`Rate created for merchant: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);
        res.status(201).json({
            success: true,
            code: 201,
            message: 'Rate created successfully',
            data: rate
        });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/v1/merchants/:id/rates/:rateId - Update merchant rate
router.put('/:id/rates/:rateId', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id, rateId } = req.params;
        const { paymentMethod, currency, transactionRate, fixedFee, minFee, maxFee, effectiveFrom, effectiveTo } = req.body;
        const merchant = await merchant_service_1.MerchantService.getMerchantById(parseInt(id));
        if (!merchant) {
            throw new errors_1.NotFoundError('Merchant', id);
        }
        const rate = await merchant_service_1.MerchantService.updateRate(parseInt(rateId), parseInt(id), {
            paymentMethod,
            currency,
            transactionRate,
            fixedFee,
            minFee,
            maxFee,
            effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
            effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined
        });
        logger_1.logger.info(`Rate updated for merchant: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'Rate updated successfully',
            data: rate
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/merchants/:id/stats - Get merchant statistics
router.get('/:id/stats', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        const merchant = await merchant_service_1.MerchantService.getMerchantById(parseInt(id));
        if (!merchant) {
            throw new errors_1.NotFoundError('Merchant', id);
        }
        const stats = await merchant_service_1.MerchantService.getMerchantStats(parseInt(id), startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
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
// GET /api/v1/merchants/:id/permissions - List merchant permissions
router.get('/:id/permissions', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const merchant = await merchant_service_1.MerchantService.getMerchantById(parseInt(id));
        if (!merchant) {
            throw new errors_1.NotFoundError('Merchant', id);
        }
        const permissions = await merchant_service_1.MerchantService.listPermissions(parseInt(id));
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: permissions
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/merchants/:id/permissions - Assign permission
router.post('/:id/permissions', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { permissionCode, permissionName, description } = req.body;
        if (!permissionCode || !permissionName) {
            throw new errors_1.ValidationError([
                { field: 'permissionCode', message: 'Permission code is required' },
                { field: 'permissionName', message: 'Permission name is required' }
            ]);
        }
        const merchant = await merchant_service_1.MerchantService.getMerchantById(parseInt(id));
        if (!merchant) {
            throw new errors_1.NotFoundError('Merchant', id);
        }
        const permission = await merchant_service_1.MerchantService.assignPermission(parseInt(id), permissionCode, permissionName, description);
        logger_1.logger.info(`Permission assigned to merchant: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);
        res.status(201).json({
            success: true,
            code: 201,
            message: 'Permission assigned successfully',
            data: permission
        });
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/v1/merchants/:id/permissions/:permissionCode - Remove permission
router.delete('/:id/permissions/:permissionCode', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { id, permissionCode } = req.params;
        const merchant = await merchant_service_1.MerchantService.getMerchantById(parseInt(id));
        if (!merchant) {
            throw new errors_1.NotFoundError('Merchant', id);
        }
        await merchant_service_1.MerchantService.removePermission(parseInt(id), permissionCode);
        logger_1.logger.info(`Permission removed from merchant: ${merchant.merchant_id} by ${req.user?.username || 'system'}`);
        res.json({
            success: true,
            code: 200,
            message: 'Permission removed successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=merchants.js.map