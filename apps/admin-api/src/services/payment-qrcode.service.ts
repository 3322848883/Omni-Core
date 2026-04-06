/**
 * Payment QR Code Service
 * 处理个人收款码的业务逻辑
 */

import { db } from '../database';
import { logger } from '../utils/logger';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';

// QR Code 类型
export type QRCodeType = 'wechat_personal' | 'alipay_personal';

// QR Code 数据模型
export interface PaymentQRCode {
  id: number;
  type: QRCodeType;
  name: string;
  image_url: string;
  amount: number | null;
  is_active: boolean;
  sort_order: number;
  usage_count: number;
  created_at: Date;
  updated_at: Date;
}

// 创建 QR Code 请求
export interface CreateQRCodeRequest {
  type: QRCodeType;
  name: string;
  amount?: number | null;
  is_active?: boolean;
  sort_order?: number;
}

// 更新 QR Code 请求
export interface UpdateQRCodeRequest {
  type?: QRCodeType;
  name?: string;
  amount?: number | null;
  is_active?: boolean;
  sort_order?: number;
  image_url?: string;
}

// 列表查询参数
export interface ListQRCodeParams {
  page?: number;
  limit?: number;
  type?: QRCodeType;
  is_active?: boolean;
}

// 列表响应
export interface ListQRCodeResponse {
  items: PaymentQRCode[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 验证 QR Code 类型
 */
function validateQRCodeType(type: string): type is QRCodeType {
  return ['wechat_personal', 'alipay_personal'].includes(type);
}

/**
 * 获取收款码列表
 */
export async function listQRCodes(params: ListQRCodeParams = {}): Promise<ListQRCodeResponse> {
  const { page = 1, limit = 20, type, is_active } = params;

  try {
    let query = db('payment_qrcodes');

    // 应用筛选条件
    if (type) {
      query = query.where('type', type);
    }
    if (is_active !== undefined) {
      query = query.where('is_active', is_active);
    }

    // 获取总数
    const countResult = await query.clone().count('* as count').first();
    const total = parseInt(countResult?.count as string, 10) || 0;

    // 获取分页数据
    const items = await query
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    return {
      items: items as PaymentQRCode[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error('Failed to list QR codes:', error);
    throw new AppError(
      '获取收款码列表失败',
      500,
      'INTERNAL_ERROR'
    );
  }
}

/**
 * 获取单个收款码
 */
export async function getQRCodeById(id: number): Promise<PaymentQRCode> {
  try {
    const qrCode = await db('payment_qrcodes')
      .where('id', id)
      .first();

    if (!qrCode) {
      throw new NotFoundError('Payment QR Code', id.toString());
    }

    return qrCode as PaymentQRCode;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to get QR code:', error);
    throw new AppError(
      '获取收款码失败',
      500,
      'INTERNAL_ERROR'
    );
  }
}

/**
 * 创建收款码
 */
export async function createQRCode(
  data: CreateQRCodeRequest,
  imageUrl: string
): Promise<PaymentQRCode> {
  try {
    // 验证类型
    if (!validateQRCodeType(data.type)) {
      throw new ValidationError('无效的收款码类型，必须是 wechat_personal 或 alipay_personal');
    }

    // 验证必填字段
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('收款码名称不能为空');
    }

    // 验证金额（如果提供）
    if (data.amount !== undefined && data.amount !== null) {
      if (data.amount <= 0) {
        throw new ValidationError('金额必须大于0');
      }
      if (data.amount > 999999.99) {
        throw new ValidationError('金额超出限制');
      }
    }

    // 检查同类型同金额的收款码是否已存在
    const existingQuery = db('payment_qrcodes')
      .where('type', data.type);

    if (data.amount === null || data.amount === undefined) {
      existingQuery.whereNull('amount');
    } else {
      existingQuery.where('amount', data.amount);
    }

    const existing = await existingQuery.first();
    if (existing) {
      throw new ValidationError('该类型和金额的收款码已存在');
    }

    // 创建收款码
    const [id] = await db('payment_qrcodes').insert({
      type: data.type,
      name: data.name.trim(),
      image_url: imageUrl,
      amount: data.amount ?? null,
      is_active: data.is_active ?? true,
      sort_order: data.sort_order ?? 0,
      usage_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const newQRCode = await db('payment_qrcodes').where('id', id).first();
    logger.info(`QR code created: ${id}, type: ${data.type}`);

    return newQRCode as PaymentQRCode;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AppError) {
      throw error;
    }
    logger.error('Failed to create QR code:', error);
    throw new AppError(
      '创建收款码失败',
      500,
      'INTERNAL_ERROR'
    );
  }
}

/**
 * 更新收款码
 */
export async function updateQRCode(
  id: number,
  data: UpdateQRCodeRequest
): Promise<PaymentQRCode> {
  try {
    // 检查收款码是否存在
    const existing = await db('payment_qrcodes').where('id', id).first();
    if (!existing) {
      throw new NotFoundError('Payment QR Code', id.toString());
    }

    // 验证类型（如果提供）
    if (data.type && !validateQRCodeType(data.type)) {
      throw new ValidationError('无效的收款码类型');
    }

    // 验证名称（如果提供）
    if (data.name !== undefined && data.name.trim() === '') {
      throw new ValidationError('收款码名称不能为空');
    }

    // 验证金额（如果提供）
    if (data.amount !== undefined && data.amount !== null) {
      if (data.amount <= 0) {
        throw new ValidationError('金额必须大于0');
      }
      if (data.amount > 999999.99) {
        throw new ValidationError('金额超出限制');
      }
    }

    // 构建更新数据
    const updateData: Partial<PaymentQRCode> = {
      updated_at: new Date(),
    };

    if (data.type !== undefined) updateData.type = data.type;
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;

    await db('payment_qrcodes').where('id', id).update(updateData);

    const updated = await db('payment_qrcodes').where('id', id).first();
    logger.info(`QR code updated: ${id}`);

    return updated as PaymentQRCode;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AppError) {
      throw error;
    }
    logger.error('Failed to update QR code:', error);
    throw new AppError(
      '更新收款码失败',
      500,
      'INTERNAL_ERROR'
    );
  }
}

/**
 * 删除收款码
 */
export async function deleteQRCode(id: number): Promise<void> {
  try {
    const existing = await db('payment_qrcodes').where('id', id).first();
    if (!existing) {
      throw new NotFoundError('Payment QR Code', id.toString());
    }

    await db('payment_qrcodes').where('id', id).delete();
    logger.info(`QR code deleted: ${id}`);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to delete QR code:', error);
    throw new AppError(
      '删除收款码失败',
      500,
      'INTERNAL_ERROR'
    );
  }
}

/**
 * 切换收款码启用状态
 */
export async function toggleQRCodeStatus(id: number): Promise<PaymentQRCode> {
  try {
    const existing = await db('payment_qrcodes').where('id', id).first();
    if (!existing) {
      throw new NotFoundError('Payment QR Code', id.toString());
    }

    const newStatus = !existing.is_active;
    await db('payment_qrcodes')
      .where('id', id)
      .update({
        is_active: newStatus,
        updated_at: new Date(),
      });

    const updated = await db('payment_qrcodes').where('id', id).first();
    logger.info(`QR code ${id} status toggled to: ${newStatus}`);

    return updated as PaymentQRCode;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Failed to toggle QR code status:', error);
    throw new AppError(
      '切换收款码状态失败',
      500,
      'INTERNAL_ERROR'
    );
  }
}

/**
 * 增加使用次数
 */
export async function incrementUsageCount(id: number): Promise<void> {
  try {
    await db('payment_qrcodes')
      .where('id', id)
      .increment('usage_count', 1);
  } catch (error) {
    logger.error('Failed to increment usage count:', error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 获取启用的收款码列表（用于客户端展示）
 */
export async function getActiveQRCodes(type?: QRCodeType): Promise<PaymentQRCode[]> {
  try {
    let query = db('payment_qrcodes')
      .where('is_active', true)
      .orderBy('sort_order', 'asc');

    if (type) {
      query = query.where('type', type);
    }

    return await query as PaymentQRCode[];
  } catch (error) {
    logger.error('Failed to get active QR codes:', error);
    throw new AppError(
      '获取收款码失败',
      500,
      'INTERNAL_ERROR'
    );
  }
}

// 导出服务对象
export const PaymentQRCodeService = {
  listQRCodes,
  getQRCodeById,
  createQRCode,
  updateQRCode,
  deleteQRCode,
  toggleQRCodeStatus,
  incrementUsageCount,
  getActiveQRCodes,
};

export default PaymentQRCodeService;
