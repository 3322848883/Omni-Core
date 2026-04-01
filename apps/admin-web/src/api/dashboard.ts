import request from '@utils/request';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalNodes: number;
  onlineNodes: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface TrafficTrend {
  date: string;
  upload: number;
  download: number;
}

export interface UserDistribution {
  status: string;
  count: number;
}

export interface RecentActivity {
  id: number;
  content: string;
  time: string;
  type: 'primary' | 'success' | 'warning' | 'danger';
}

export const getDashboardStats = (): Promise<DashboardStats> => {
  return request.get('/dashboard/stats');
};

export const getTrafficTrend = (days: number = 7): Promise<TrafficTrend[]> => {
  return request.get('/traffic/trend', { params: { days } });
};

export const getUserDistribution = (): Promise<UserDistribution[]> => {
  return request.get('/dashboard/charts');
};

export const getRecentActivities = (): Promise<RecentActivity[]> => {
  return request.get('/dashboard/activities');
};
