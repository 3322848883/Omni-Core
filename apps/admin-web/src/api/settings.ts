import request from '@utils/request';
import type { SystemSettings } from '../types/setting';

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