import { request } from '@/utils/request';
import type { PaginationResult } from '@/types/index';

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

export interface InviteCode {
  id: string;
  code: string;
  status: 'active' | 'used' | 'disabled' | 'expired';
  createdBy: string;
  usedBy: string | null;
  usedAt: string | null;
  maxUses: number;
  usedCount: number;
  trafficReward: number;
  daysReward: number;
  expireAt: string | null;
  createdAt: string;
}

export interface InviteStats {
  totalInvites: number;
  successfulInvites: number;
  earnedTraffic: number;
  earnedDays: number;
}

export interface ValidateInviteRequest {
  code: string;
}

export interface ValidateInviteResponse {
  valid: boolean;
  trafficReward: number;
  daysReward: number;
  message?: string;
}

// Get my invite codes
export function getMyInviteCodes() {
  return request.get<InviteCode[]>('/invites/my');
}

// Create invite code
export function createInviteCode() {
  return request.post<InviteCode>('/invites');
}

// Validate invite code
export function validateInviteCode(code: string) {
  return request.post<ValidateInviteResponse>('/invites/validate', { code });
}

// Get invite statistics
export function getInviteStats() {
  return request.get<InviteStats>('/invites/stats');
}

// Get invite history
export function getInviteHistory() {
  return request.get<{
    inviteCode: string;
    usedBy: string;
    usedAt: string;
    rewardGiven: boolean;
  }[]>('/invites/history');
}

// Get invite info
export function getInviteInfo() {
  return request.get<InviteInfo>('/invites/info');
}

// Get invite records with pagination
export function getInviteRecords(params: { page?: number; limit?: number }) {
  return request.get<PaginationResult<InviteRecord>>('/invites/records', { params });
}
