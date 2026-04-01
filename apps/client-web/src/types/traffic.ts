// Traffic Types

export interface TrafficStats {
  date: string;
  upload: number;
  download: number;
  total: number;
}

export interface TrafficHistoryParams {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface RealtimeTraffic {
  todayUsed: number;
  monthUsed: number;
  totalLimit: number;
  remaining: number;
  usagePercent: number;
}
