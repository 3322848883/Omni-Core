import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import * as orderService from '@/services/orderService';
import * as paymentService from '@/services/payment.service';
import {
  successResponse,
  createdResponse,
  paginationResponse,
  errorResponse,
  createPaginationMeta,
} from '@/utils/response';
import { HTTP_STATUS, ERROR_CODES } from '@/constants';
import { CreateOrderData, CreatePaymentProofData } from '@/types/user';
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
      req.user!.user_id,
      page,
      limit,
      status
    );

    paginationResponse(
      res,
      {
        items: orders,
        pagination: createPaginationMeta(total, page, limit),
      },
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
    const order = await orderService.getOrderById(id, req.user!.user_id);
    successResponse(res, order, 'Order retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST / - Create new order
 * 支持个人收款码支付方式 (alipay_personal, wechat_personal)
 */
router.post('/', authenticate, validate(OrderValidation.create), async (req, res, next) => {
  try {
    const data: CreateOrderData = req.body;

    // 检查是否是个人收款码支付方式
    const personalPaymentMethods = ['alipay_personal', 'wechat_personal'];
    const isPersonalQrCode = data.paymentMethod && personalPaymentMethods.includes(data.paymentMethod);

    let order;
    if (isPersonalQrCode && data.qrCodeId) {
      // 使用个人收款码创建订单
      order = await paymentService.createOrderWithQrCode(
        req.user!.user_id,
        data.planId,
        data.qrCodeId,
        data.paymentMethod!
      );
    } else {
      // 使用原有方式创建订单
      order = await orderService.createOrder(
        req.user!.user_id,
        data.planId,
        data.paymentMethod
      );
    }

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
    const order = await orderService.cancelOrder(id, req.user!.user_id);
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
    const paymentInfo = await orderService.getPaymentInfo(id, req.user!.user_id);
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
    const result = await orderService.verifyPayment(id, req.user!.user_id);
    successResponse(res, result, 'Payment verified successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /:id/payment-proof - Upload payment proof
 * 用于个人收款码支付方式上传付款凭证
 */
router.post('/:id/payment-proof', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { qrCodeId, amount, payerName, payerAccount, transactionId, proofImageUrl } = req.body;

    // Validate required fields
    if (!qrCodeId) {
      return errorResponse(
        res,
        'QR code ID is required',
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'qrCodeId', message: 'QR code ID is required' }]
      );
    }

    if (!proofImageUrl) {
      return errorResponse(
        res,
        'Proof image URL is required',
        ERROR_CODES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST,
        [{ field: 'proofImageUrl', message: 'Proof image URL is required' }]
      );
    }

    const proofData: CreatePaymentProofData = {
      orderId: id,
      qrCodeId,
      amount: amount || 0,
      payerName,
      payerAccount,
      transactionId,
      proofImageUrl,
    };

    const proof = await paymentService.uploadPaymentProof(req.user!.user_id, proofData);
    createdResponse(res, proof, 'Payment proof uploaded successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /:id/payment-proof - Get payment proof status
 * 获取订单的付款凭证状态和详情
 */
router.get('/:id/payment-proof', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await paymentService.getPaymentProofStatus(id, req.user!.user_id);
    successResponse(res, result, 'Payment proof status retrieved successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
