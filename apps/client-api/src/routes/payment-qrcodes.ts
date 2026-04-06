import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import * as paymentService from '@/services/payment.service';
import { successResponse, errorResponse } from '@/utils/response';
import { HTTP_STATUS, ERROR_CODES } from '@/constants';
import { validate } from '@/middlewares/validation';

const router = Router();

/**
 * GET / - 获取启用的收款码列表
 * 返回所有启用的个人收款码（支付宝、微信等）
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const qrCodes = await paymentService.getEnabledQrCodes();
    successResponse(res, qrCodes, 'Payment QR codes retrieved successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /:id - 获取收款码详情
 * 返回指定ID的收款码详细信息
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const qrCode = await paymentService.getQrCodeById(id);
    
    if (!qrCode) {
      return errorResponse(
        res,
        'Payment QR code not found',
        ERROR_CODES.PAYMENT_QR_CODE_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    if (!qrCode.isEnabled) {
      return errorResponse(
        res,
        'Payment QR code is disabled',
        ERROR_CODES.PAYMENT_QR_CODE_DISABLED,
        HTTP_STATUS.FORBIDDEN
      );
    }

    successResponse(res, qrCode, 'Payment QR code retrieved successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
