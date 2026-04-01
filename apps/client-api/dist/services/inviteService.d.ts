import { InviteCode, InviteStats, ValidateInviteResponse } from '@/types/user';
/**
 * Get my invite codes
 */
export declare const getMyInviteCodes: (userId: string) => Promise<InviteCode[]>;
/**
 * Create a new invite code
 */
export declare const createInviteCode: (userId: string) => Promise<InviteCode>;
/**
 * Validate an invite code
 */
export declare const validateInviteCode: (code: string) => Promise<ValidateInviteResponse>;
/**
 * Get invite statistics for a user
 */
export declare const getInviteStats: (userId: string) => Promise<InviteStats>;
/**
 * Process invite reward when a user uses an invite code
 */
export declare const processInviteReward: (inviteCodeId: number, userId: string) => Promise<void>;
//# sourceMappingURL=inviteService.d.ts.map