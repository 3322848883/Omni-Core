import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import { authLimiter } from '@/middlewares/rateLimiter';
import * as orderService from '@/services/orderService';
import { successResponse, createdResponse, errorResponse, paginationResponse, createPaginationMeta } from '@/utils/response';
import { HttpStatus, ErrorCode } from '@/constants';
import { CreateOrderData } from '@/types/user';
import { validate, OrderValidation } from '@/middlewares/validation';

const router = Router();

/**
 * GET / - Get orders list
 * Query params: page, limit, status
 */
router.get('/', authenticate, validate(OrderValidation.list), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const status = req.query.status as string | undefined;

    const { orders, total } = await orderService.getOrders(
      req.user!.id,
      page,
      limit,
      status
    );

    paginationResponse(
      res,
      orders,
      createPaginationMeta(page, limit, total),
      'Orders retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
});

/**
 * GET /:id - Get order details
 */
router.get('/:id', authenticate, validate(OrderValidation.byId), async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id, req.user!.id);
    successResponse(res, order, 'Order retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST / - Create new order
 */
router.post('/', authenticate, validate(OrderValidation.create), async (req, res, next) => {
  try {
    const data: CreateOrderData = req.body;

    const order = await orderService.createOrder(
      req.user!.id,
      data.planId,
      data.paymentMethod
    );

    createdResponse(res, order, 'Order created successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /:id/cancel - Cancel order
 */
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.cancelOrder(id, req.user!.id);
    successResponse(res, order, 'Order cancelled successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /:id/payment - Get payment information
 */
router.get('/:id/payment', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const paymentInfo = await orderService.getPaymentInfo(id, req.user!.id);
    successResponse(res, paymentInfo, 'Payment info retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /:id/verify-payment - Verify payment status
 */
router.post('/:id/verify-payment', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await orderService.verifyPayment(id, req.user!.id);
    successResponse(res, result, 'Payment verified successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
