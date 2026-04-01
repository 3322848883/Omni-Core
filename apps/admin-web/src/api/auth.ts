import request from '@utils/request';
import Cookies from 'js-cookie';
import type { LoginForm, LoginResponse, UserInfo } from '../types/user';

const REFRESH_TOKEN_KEY = 'admin_refresh_token';

export const login = (data: LoginForm): Promise<LoginResponse> => {
  return request.post('/auth/login', data);
};

export const logout = (): Promise<void> => {
  return request.post('/auth/logout');
};

export const refreshToken = (): Promise<{ token: string; refreshToken: string }> => {
  const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
  return request.post('/auth/refresh', { refreshToken });
};

export const getCurrentUser = (): Promise<UserInfo> => {
  return request.get('/auth/me');
};