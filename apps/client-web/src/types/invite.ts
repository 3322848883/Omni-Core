// Invite Types

export interface InviteInfo {
  inviteCode: string;
  inviteLink: string;
  totalInvited: number;
  registeredCount: number;
  completedCount: number;
  totalTrafficReward: number;
  totalDurationReward: number;
  totalCashReward: number;
}

export interface InviteRecord {
  id: string;
  inviteeEmail: string;
  inviteeUsername?: string;
  status: 'pending' | 'registered' | 'completed';
  inviteChannel: string;
  registeredAt?: string;
  firstOrderAt?: string;
  createdAt: string;
}

export interface InviteReward {
  id: string;
  rewardType: 'traffic' | 'duration' | 'cash' | 'credit';
  rewardValue: number;
  rewardUnit: string;
  triggerEvent: string;
  status: 'pending' | 'issued' | 'failed';
  issuedAt?: string;
  createdAt: string;
}
