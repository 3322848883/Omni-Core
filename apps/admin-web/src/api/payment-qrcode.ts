import request from '@/utils/request';

/**
 * 收款码类型
 */
export type QRCodeType = 'wechat' | 'alipay';

/**
 * 收款码状态
 */
export type QRCodeStatus = 'active' | 'inactive';

/**
 * 金额类型
 */
export type AmountType = 'fixed' | 'any';

/**
 * 收款码数据接口
 */
export interface QRCode {
  id: string;
  name: string;
  type: QRCodeType;
  imageUrl: string;
  amountType: AmountType;
  fixedAmount?: number;
  minAmount?: number;
  maxAmount?: number;
  status: QRCodeStatus;
  sortOrder: number;
  usageCount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 收款码列表查询参数
 */
export interface QRCodeQuery {
  page?: number;
  limit?: number;
  type?: QRCodeType;
  status?: QRCodeStatus;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 收款码列表响应
 */
export interface QRCodeListResponse {
  items: QRCode[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 创建/更新收款码请求数据
 */
export interface QRCodeFormData {
  name: string;
  type: QRCodeType;
  imageUrl: string;
  amountType: AmountType;
  fixedAmount?: number;
  minAmount?: number;
  maxAmount?: number;
  description?: string;
  sortOrder: number;
}

/**
 * 获取收款码列表
 * @param params 查询参数
 */
export function getQRCodes(params: QRCodeQuery = {}) {
  return request.get<QRCodeListResponse>('/payment/qrcodes', { params });
}

/**
 * 获取收款码详情
 * @param id 收款码ID
 */
export function getQRCodeById(id: string) {
  return request.get<{ qrcode: QRCode }>(`/payment/qrcodes/${id}`);
}

/**
 * 创建收款码
 * @param data 收款码数据
 */
export function createQRCode(data: QRCodeFormData) {
  return request.post<{ qrcode: QRCode }>('/payment/qrcodes', data);
}

/**
 * 更新收款码
 * @param id 收款码ID
 * @param data 收款码数据
 */
export function updateQRCode(id: string, data: Partial<QRCodeFormData>) {
  return request.put<{ qrcode: QRCode }>(`/payment/qrcodes/${id}`, data);
}

/**
 * 删除收款码
 * @param id 收款码ID
 */
export function deleteQRCode(id: string) {
  return request.delete(`/payment/qrcodes/${id}`);
}

/**
 * 切换收款码状态
 * @param id 收款码ID
 * @param status 目标状态
 */
export function toggleQRCodeStatus(id: string, status: QRCodeStatus) {
  return request.patch(`/payment/qrcodes/${id}/status`, { status });
}

/**
 * 上传收款码图片
 * @param file 图片文件
 */
export function uploadQRCodeImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<{ url: string }>('/payment/qrcodes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 批量删除收款码
 * @param ids 收款码ID数组
 */
export function batchDeleteQRCodes(ids: string[]) {
  return request.post('/payment/qrcodes/batch-delete', { ids });
}

/**
 * 更新收款码排序
 * @param id 收款码ID
 * @param sortOrder 排序值
 */
export function updateQRCodeSort(id: string, sortOrder: number) {
  return request.patch(`/payment/qrcodes/${id}/sort`, { sortOrder });
}
