export interface TrafficRecord {
  id: string;
  userId: string;
  username: string;
  nodeId: string;
  nodeName: string;
  upload: number;
  download: number;
  total: number;
  recordedAt: string;
}

export interface TrafficStats {
  date: string;
  upload: number;
  download: number;
  total: number;
}

export interface TrafficQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  nodeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface TrafficListResponse {
  list: TrafficRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TrafficOverview {
  todayUpload: number;
  todayDownload: number;
  todayTotal: number;
  monthUpload: number;
  monthDownload: number;
  monthTotal: number;
  totalUpload: number;
  totalDownload: number;
  totalTraffic: number;
}

export interface NodeTrafficStats {
  nodeId: string;
  nodeName: string;
  upload: number;
  download: number;
  total: number;
  userCount: number;
}

export interface UserTrafficStats {
  userId: string;
  username: string;
  email: string;
  upload: number;
  download: number;
  total: number;
  nodeCount: number;
}
