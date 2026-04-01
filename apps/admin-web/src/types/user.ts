export interface User {
  id: string;
  userId: string;
  email: string;
  username: string;
  vpnUuid: string;
  status: number; // 1-normal, 2-banned, 3-deleted
  trafficLimit: number;
  trafficUsed: number;
  expireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface LoginForm {
  username: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface UserQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
}

export interface UserListResponse {
  list: User[];
  total: number;
  page: number;
  pageSize: number;
}
