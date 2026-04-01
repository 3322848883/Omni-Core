import { request } from '@/utils/request';

export interface TrafficStats {
  date: string;
  upload: number;
  download: number;
  total: number;
}

export interface TrafficOverview {
  today: {
    upload: number;
    download: number;
    total: number;
  };
  thisMonth: {
    upload: number;
    download: number;
    total: number;
  };
  total: {
    upload: number;
    download: number;
    total: number;
  };
}

export interface UserTrafficInfo {
  userId: string;
  trafficLimit: number;
  trafficUsed: number;
  trafficRemaining: number;
  usagePercent: number;
  period: {
    upload: number;
    download: number;
    total: number;
    days: number;
  };
  dailyStats: TrafficStats[];
}

// Get traffic overview
export function getTrafficOverview() {
  return request.get<TrafficOverview>('/traffic/overview');
}

// Get traffic trend
export function getTrafficTrend(days: number = 30) {
  return request.get<TrafficStats[]>('/traffic/trend', { params: { days } });
}

// Get user traffic info
export function getUserTraffic(days: number = 30) {
  return request.get<UserTrafficInfo>('/traffic/me', { params: { days } });
}

// Get real-time traffic (WebSocket or polling)
export function getRealtimeTraffic() {
  return request.get<{
    todayUsed: number;
    monthUsed: number;
    totalLimit: number;
    remaining: number;
    usagePercent: number;
  }>('/traffic/realtime');
}

// Get traffic stats with date range
export function getTrafficStats(params: {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}) {
  return request.get<TrafficStats[]>('/traffic/stats', { params });
}
