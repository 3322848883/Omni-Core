import request from '@utils/request';
import type { SystemSettings } from '../types/setting';
import type { PaymentSettings } from '../types/payment-settings';

export const getSettings = (): Promise<SystemSettings> => {
  return request.get('/settings');
};

export const updateSettings = (data: Partial<SystemSettings>): Promise<SystemSettings> => {
  return request.put('/settings', data);
};

export const resetSettings = (): Promise<SystemSettings> => {
  return request.post('/settings/reset');
};

export const sendTestEmail = (email: string): Promise<{ success: boolean; message: string }> => {
  return request.post('/settings/test-email', { email });
};

// 支付配置相关 API
export const getPaymentSettings = (): Promise<PaymentSettings> => {
  return request.get('/settings/payment');
};

export const updatePaymentSettings = (data: Partial<PaymentSettings>): Promise<PaymentSettings> => {
  return request.put('/settings/payment', data);
};

export const testPaymentProvider = (provider: string, amount?: number, currency?: string): Promise<{ success: boolean; message: string }> => {
  return request.post('/settings/payment/test', { provider, amount, currency });
};

export const getPaymentProviderStatus = (): Promise<Array<{
  provider: string;
  name: string;
  enabled: boolean;
  configured: boolean;
  testStatus: string;
}>> => {
  return request.get('/settings/payment/status');
};

export const uploadQRCodeImage = (image: string, type: 'wechat_qr' | 'alipay_qr'): Promise<{ url: string }> => {
  return request.post('/settings/upload-image', { image, type });
};