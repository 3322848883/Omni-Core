"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middlewares/auth");
const orderService = __importStar(require("@/services/orderService"));
const response_1 = require("@/utils/response");
const validation_1 = require("@/middlewares/validation");
const router = (0, express_1.Router)();
/**
 * GET / - Get orders list
 * Query params: page, limit, status
 */
router.get('/', auth_1.authenticate, (0, validation_1.validate)(validation_1.OrderValidation.list), async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const status = req.query.status;
        const { orders, total } = await orderService.getOrders(req.user.id, page, limit, status);
        (0, response_1.paginationResponse)(res, orders, (0, response_1.createPaginationMeta)(page, limit, total), 'Orders retrieved successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /:id - Get order details
 */
router.get('/:id', auth_1.authenticate, (0, validation_1.validate)(validation_1.OrderValidation.byId), async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await orderService.getOrderById(id, req.user.id);
        (0, response_1.successResponse)(res, order, 'Order retrieved successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST / - Create new order
 */
router.post('/', auth_1.authenticate, (0, validation_1.validate)(validation_1.OrderValidation.create), async (req, res, next) => {
    try {
        const data = req.body;
        const order = await orderService.createOrder(req.user.id, data.planId, data.paymentMethod);
        (0, response_1.createdResponse)(res, order, 'Order created successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /:id/cancel - Cancel order
 */
router.post('/:id/cancel', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await orderService.cancelOrder(id, req.user.id);
        (0, response_1.successResponse)(res, order, 'Order cancelled successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /:id/payment - Get payment information
 */
router.get('/:id/payment', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const paymentInfo = await orderService.getPaymentInfo(id, req.user.id);
        (0, response_1.successResponse)(res, paymentInfo, 'Payment info retrieved successfully');
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /:id/verify-payment - Verify payment status
 */
router.post('/:id/verify-payment', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await orderService.verifyPayment(id, req.user.id);
        (0, response_1.successResponse)(res, result, 'Payment verified successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map