import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, requireAdmin } from '../middlewares/auth';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { ErrorCode, HttpStatus } from '@shared/constants';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';
import {
  PaymentQRCodeService,
  QRCodeType,
  CreateQRCodeRequest,
  UpdateQRCodeRequest,
} from '../services/payment-qrcode.service';

const router = Router();

// 上传目录配置
const UPLOAD_DIR = '/uploads/qrcodes/';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  logger.info(`Created upload directory: ${UPLOAD_DIR}`);
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// 文件过滤器
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (JPEG, PNG, GIF, WebP)'));
  }
};

// 配置 multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// 类型定义扩展
declare global {
  namespace Express {
    interface Request {
      fileValidationError?: string;
    }
  }
}

/**
 * GET /api/v1/admin/payment-qrcodes
 * 获取收款码列表
 */
router.get('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as QRCodeType | undefined;
    const is_active = req.query.is_active !== undefined
      ? req.query.is_active === 'true'
      : undefined;

    const result = await PaymentQRCodeService.listQRCodes({
      page,
      limit,
      type,
      is_active,
    });

    sendPaginated(
      res,
      result.items,
      result.total,
      result.page,
      result.limit,
      '获取收款码列表成功'
    );
  } catch (error) {
    logger.error('Error listing QR codes:', error);
    if (error instanceof AppError) {
      sendError(res, error.message, error.code, error.statusCode);
    } else {
      sendError(
        res,
        '获取收款码列表失败',
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_ERROR
      );
    }
  }
});

/**
 * GET /api/v1/admin/payment-qrcodes/:id
 * 获取单个收款码详情
 */
router.get('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendError(
        res,
        '无效的ID参数',
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST
      );
    }

    const qrCode = await PaymentQRCodeService.getQRCodeById(id);
    sendSuccess(res, qrCode, '获取收款码成功');
  } catch (error) {
    logger.error('Error getting QR code:', error);
    if (error instanceof NotFoundError) {
      sendError(res, error.message, ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    } else if (error instanceof AppError) {
      sendError(res, error.message, error.code, error.statusCode);
    } else {
      sendError(
        res,
        '获取收款码失败',
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_ERROR
      );
    }
  }
});

/**
 * POST /api/v1/admin/payment-qrcodes
 * 创建收款码（支持图片上传）
 */
router.post(
  '/',
  authMiddleware,
  requireAdmin,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      // 检查文件是否上传
      if (!req.file) {
        return sendError(
          res,
          '请上传收款码图片',
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST
        );
      }

      const { type, name, amount, is_active, sort_order } = req.body;

      // 验证必填字段
      if (!type || !name) {
        // 删除已上传的文件
        fs.unlinkSync(req.file.path);
        return sendError(
          res,
          '类型和名称不能为空',
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST
        );
      }

      // 构建图片URL
      const imageUrl = `/uploads/qrcodes/${req.file.filename}`;

      // 构建创建请求
      const createData: CreateQRCodeRequest = {
        type: type as QRCodeType,
        name: name.trim(),
        amount: amount !== undefined && amount !== '' ? parseFloat(amount) : null,
        is_active: is_active === 'true' || is_active === true,
        sort_order: sort_order ? parseInt(sort_order, 10) : 0,
      };

      const qrCode = await PaymentQRCodeService.createQRCode(createData, imageUrl);
      sendSuccess(res, qrCode, '创建收款码成功', HttpStatus.CREATED);
    } catch (error) {
      // 发生错误时删除已上传的文件
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      logger.error('Error creating QR code:', error);
      if (error instanceof ValidationError) {
        sendError(res, error.message, ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
      } else if (error instanceof AppError) {
        sendError(res, error.message, error.code, error.statusCode);
      } else {
        sendError(
          res,
          '创建收款码失败',
          ErrorCode.INTERNAL_ERROR,
          HttpStatus.INTERNAL_ERROR
        );
      }
    }
  }
);

/**
 * PUT /api/v1/admin/payment-qrcodes/:id
 * 更新收款码（支持更换图片）
 */
router.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return sendError(
          res,
          '无效的ID参数',
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST
        );
      }

      // 获取现有收款码信息
      const existing = await PaymentQRCodeService.getQRCodeById(id);

      const { type, name, amount, is_active, sort_order } = req.body;

      // 构建更新数据
      const updateData: UpdateQRCodeRequest = {};

      if (type !== undefined) updateData.type = type as QRCodeType;
      if (name !== undefined) updateData.name = name.trim();
      if (amount !== undefined && amount !== '') {
        updateData.amount = parseFloat(amount);
      } else if (amount === '') {
        updateData.amount = null;
      }
      if (is_active !== undefined) {
        updateData.is_active = is_active === 'true' || is_active === true;
      }
      if (sort_order !== undefined) {
        updateData.sort_order = parseInt(sort_order, 10);
      }

      // 如果上传了新图片
      if (req.file) {
        const newImageUrl = `/uploads/qrcodes/${req.file.filename}`;
        updateData.image_url = newImageUrl;

        // 删除旧图片
        if (existing.image_url) {
          const oldImagePath = path.join(UPLOAD_DIR, path.basename(existing.image_url));
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            logger.info(`Deleted old image: ${oldImagePath}`);
          }
        }
      }

      const qrCode = await PaymentQRCodeService.updateQRCode(id, updateData);
      sendSuccess(res, qrCode, '更新收款码成功');
    } catch (error) {
      // 发生错误时删除已上传的新文件
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      logger.error('Error updating QR code:', error);
      if (error instanceof NotFoundError) {
        sendError(res, error.message, ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
      } else if (error instanceof ValidationError) {
        sendError(res, error.message, ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
      } else if (error instanceof AppError) {
        sendError(res, error.message, error.code, error.statusCode);
      } else {
        sendError(
          res,
          '更新收款码失败',
          ErrorCode.INTERNAL_ERROR,
          HttpStatus.INTERNAL_ERROR
        );
      }
    }
  }
);

/**
 * DELETE /api/v1/admin/payment-qrcodes/:id
 * 删除收款码
 */
router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendError(
        res,
        '无效的ID参数',
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST
      );
    }

    // 获取收款码信息以删除关联图片
    const existing = await PaymentQRCodeService.getQRCodeById(id);

    // 删除数据库记录
    await PaymentQRCodeService.deleteQRCode(id);

    // 删除关联的图片文件
    if (existing.image_url) {
      const imagePath = path.join(UPLOAD_DIR, path.basename(existing.image_url));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        logger.info(`Deleted image: ${imagePath}`);
      }
    }

    sendSuccess(res, null, '删除收款码成功');
  } catch (error) {
    logger.error('Error deleting QR code:', error);
    if (error instanceof NotFoundError) {
      sendError(res, error.message, ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    } else if (error instanceof AppError) {
      sendError(res, error.message, error.code, error.statusCode);
    } else {
      sendError(
        res,
        '删除收款码失败',
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_ERROR
      );
    }
  }
});

/**
 * POST /api/v1/admin/payment-qrcodes/:id/toggle
 * 启用/禁用收款码
 */
router.post('/:id/toggle', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendError(
        res,
        '无效的ID参数',
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST
      );
    }

    const qrCode = await PaymentQRCodeService.toggleQRCodeStatus(id);
    const statusText = qrCode.is_active ? '启用' : '禁用';
    sendSuccess(res, qrCode, `收款码已${statusText}`);
  } catch (error) {
    logger.error('Error toggling QR code status:', error);
    if (error instanceof NotFoundError) {
      sendError(res, error.message, ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    } else if (error instanceof AppError) {
      sendError(res, error.message, error.code, error.statusCode);
    } else {
      sendError(
        res,
        '切换收款码状态失败',
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_ERROR
      );
    }
  }
});

/**
 * Multer 错误处理中间件
 */
router.use((error: any, _req: Request, res: Response, _next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(
        res,
        `文件大小超过限制 (最大 ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST
      );
    }
    return sendError(
      res,
      `文件上传错误: ${error.message}`,
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST
    );
  }

  if (error) {
    logger.error('Upload error:', error);
    return sendError(
      res,
      error.message || '文件上传失败',
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_ERROR
    );
  }
});

export { router as paymentQrcodeRoutes };
export default router;
