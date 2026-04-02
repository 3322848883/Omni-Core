"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reconciliation_service_1 = require("../services/reconciliation/reconciliation.service");
const settlement_service_1 = require("../services/reconciliation/settlement.service");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authMiddleware);
router.use(auth_1.requireAdmin);
// Validation schemas
const ReconciliationValidation = {
    create: {
        body: {
            provider: {
                required: true,
                type: 'string',
                values: ['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant'],
                message: 'Invalid payment provider',
            },
            reconciliation_date: {
                required: true,
                type: 'string',
                message: 'Reconciliation date is required',
            },
        },
    },
    process: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
    },
    list: {
        query: {
            provider: {
                type: 'string',
            },
            startDate: {
                type: 'string',
            },
            endDate: {
                type: 'string',
            },
            status: {
                type: 'string',
            },
            page: {
                type: 'string',
                convert: true,
                positive: true,
            },
            limit: {
                type: 'string',
                convert: true,
                positive: true,
                max: 100,
            },
        },
    },
    details: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        query: {
            status: {
                type: 'string',
            },
            page: {
                type: 'string',
                convert: true,
                positive: true,
            },
            limit: {
                type: 'string',
                convert: true,
                positive: true,
                max: 100,
            },
        },
    },
};
const SettlementValidation = {
    create: {
        body: {
            provider: {
                required: true,
                type: 'string',
                values: ['stripe', 'paypal', 'alipay', 'wechat', 'alipay_merchant', 'wechat_merchant'],
                message: 'Invalid payment provider',
            },
            start_date: {
                required: true,
                type: 'string',
                message: 'Start date is required',
            },
            end_date: {
                required: true,
                type: 'string',
                message: 'End date is required',
            },
        },
    },
    process: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
    },
    list: {
        query: {
            provider: {
                type: 'string',
            },
            startDate: {
                type: 'string',
            },
            endDate: {
                type: 'string',
            },
            status: {
                type: 'string',
            },
            page: {
                type: 'string',
                convert: true,
                positive: true,
            },
            limit: {
                type: 'string',
                convert: true,
                positive: true,
                max: 100,
            },
        },
    },
    details: {
        params: {
            id: {
                required: true,
                type: 'string',
            },
        },
        query: {
            page: {
                type: 'string',
                convert: true,
                positive: true,
            },
            limit: {
                type: 'string',
                convert: true,
                positive: true,
                max: 100,
            },
        },
    },
};
// Reconciliation routes
/**
 * @route POST /api/reconciliations
 * @desc Create a new reconciliation
 * @access Admin
 */
router.post('/reconciliations', (0, validation_1.validate)(ReconciliationValidation.create), async (req, res, next) => {
    try {
        const { provider, reconciliation_date } = req.body;
        const reconciliation = await reconciliation_service_1.reconciliationService.createReconciliation({
            provider: provider,
            reconciliation_date: new Date(reconciliation_date),
        });
        res.status(201).json({
            success: true,
            code: 201,
            message: 'Reconciliation created successfully',
            data: reconciliation,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/reconciliations/:id/process
 * @desc Process reconciliation
 * @access Admin
 */
router.post('/reconciliations/:id/process', (0, validation_1.validate)(ReconciliationValidation.process), async (req, res, next) => {
    try {
        const { id } = req.params;
        const reconciliation = await reconciliation_service_1.reconciliationService.processReconciliation(parseInt(id));
        res.json({
            success: true,
            code: 200,
            message: 'Reconciliation processed successfully',
            data: reconciliation,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/reconciliations
 * @desc Get all reconciliations
 * @access Admin
 */
router.get('/reconciliations', (0, validation_1.validate)(ReconciliationValidation.list), async (req, res, next) => {
    try {
        const { provider, startDate, endDate, status, page, limit } = req.query;
        const result = await reconciliation_service_1.reconciliationService.getReconciliations({
            provider: provider,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status: status,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/reconciliations/:id
 * @desc Get reconciliation by ID
 * @access Admin
 */
router.get('/reconciliations/:id', (0, validation_1.validate)(ReconciliationValidation.process), async (req, res, next) => {
    try {
        const { id } = req.params;
        const reconciliation = await reconciliation_service_1.reconciliationService.getReconciliationById(parseInt(id));
        if (!reconciliation) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: 'Reconciliation not found',
            });
        }
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: reconciliation,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/reconciliations/:id/details
 * @desc Get reconciliation details
 * @access Admin
 */
router.get('/reconciliations/:id/details', (0, validation_1.validate)(ReconciliationValidation.details), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, page, limit } = req.query;
        const result = await reconciliation_service_1.reconciliationService.getReconciliationDetails(parseInt(id), {
            status: status,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
// Settlement routes
/**
 * @route POST /api/settlements
 * @desc Create a new settlement report
 * @access Admin
 */
router.post('/settlements', (0, validation_1.validate)(SettlementValidation.create), async (req, res, next) => {
    try {
        const { provider, start_date, end_date } = req.body;
        const settlement = await settlement_service_1.settlementService.createSettlement({
            provider: provider,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
        });
        res.status(201).json({
            success: true,
            code: 201,
            message: 'Settlement report created successfully',
            data: settlement,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route POST /api/settlements/:id/process
 * @desc Process settlement report
 * @access Admin
 */
router.post('/settlements/:id/process', (0, validation_1.validate)(SettlementValidation.process), async (req, res, next) => {
    try {
        const { id } = req.params;
        const settlement = await settlement_service_1.settlementService.processSettlement(parseInt(id));
        res.json({
            success: true,
            code: 200,
            message: 'Settlement report processed successfully',
            data: settlement,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/settlements
 * @desc Get all settlement reports
 * @access Admin
 */
router.get('/settlements', (0, validation_1.validate)(SettlementValidation.list), async (req, res, next) => {
    try {
        const { provider, startDate, endDate, status, page, limit } = req.query;
        const result = await settlement_service_1.settlementService.getSettlementReports({
            provider: provider,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status: status,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/settlements/:id
 * @desc Get settlement report by ID
 * @access Admin
 */
router.get('/settlements/:id', (0, validation_1.validate)(SettlementValidation.process), async (req, res, next) => {
    try {
        const { id } = req.params;
        const settlement = await settlement_service_1.settlementService.getSettlementById(parseInt(id));
        if (!settlement) {
            return res.status(404).json({
                success: false,
                code: 404,
                message: 'Settlement report not found',
            });
        }
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: settlement,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * @route GET /api/settlements/:id/details
 * @desc Get settlement details
 * @access Admin
 */
router.get('/settlements/:id/details', (0, validation_1.validate)(SettlementValidation.details), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page, limit } = req.query;
        const result = await settlement_service_1.settlementService.getSettlementDetails(parseInt(id), {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        res.json({
            success: true,
            code: 200,
            message: 'success',
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=reconciliation.js.map