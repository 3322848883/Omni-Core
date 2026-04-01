export interface InviteCode {
  id: string;
  code: string;
  creatorId: string;
  creatorName: string;
  maxUses: number;
  usedCount: number;
  rewardDays: number;
  rewardTraffic: number;
  status: number; // 1-active, 2-inactive, 3-expired
  expireAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InviteRecord {
  id: string;
  inviteCode: string;
  inviterId: string;
  inviterName: string;
  inviteeId: string;
  inviteeName: string;
  rewardDays: number;
  rewardTraffic: number;
  status: number; // 1-pending, 2-completed, 3-cancelled
  createdAt: string;
  completedAt?: string;
}

export interface InviteQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: number;
  creatorId?: string;
}

export interface InviteListResponse {
  list: InviteCode[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InviteRecordQuery {
  page?: number;
  pageSize?: number;
  inviteCode?: string;
  inviterId?: string;
  status?: number;
}

export interface InviteRecordListResponse {
  list: InviteRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InviteStats {
  totalCodes: number;
  activeCodes: number;
  totalUses: number;
  totalRewardDays: number;
  totalRewardTraffic: number;
}

export interface CreateInviteCodeData {
  maxUses: number;
  rewardDays: number;
  rewardTraffic: number;
  expireAt?: string;
}
