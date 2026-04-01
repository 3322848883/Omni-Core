import db from '@/config/database';
import { generateInviteCode } from '@/utils/crypto';
import { INVITE_CODE_STATUS } from '@/constants';
import { InviteCode, InviteStats, ValidateInviteResponse } from '@/types/user';
import { NotFoundError, ValidationError } from '@/errors/AppError';

/**
 * Get my invite codes
 */
export const getMyInviteCodes = async (userId: string): Promise<InviteCode[]> => {
  const codes = await db('invite_codes')
    .where({ created_by: userId })
    .orderBy('created_at', 'desc');

  return codes.map((code: Record<string, unknown>) => ({
    id: code.id as number,
    code: code.code as string,
    createdBy: code.created_by as string,
    usedBy: code.used_by as string | null,
    usedAt: code.used_at as Date | null,
    maxUses: code.max_uses as number,
    usedCount: code.used_count as number,
    trafficReward: code.traffic_reward as number,
    daysReward: code.days_reward as number,
    status: code.status as string,
    expireAt: code.expire_at as Date | null,
    createdAt: code.created_at as Date,
  }));
};

/**
 * Create a new invite code
 */
export const createInviteCode = async (userId: string): Promise<InviteCode> => {
  // Generate unique invite code
  let code: string;
  let isUnique = false;

  while (!isUnique) {
    code = generateInviteCode();
    const existing = await db('invite_codes')
      .where({ code })
      .first();
    if (!existing) {
      isUnique = true;
    }
  }

  // Default rewards configuration
  const defaultTrafficReward = 5 * 1024 * 1024 * 1024; // 5GB in bytes
  const defaultDaysReward = 7; // 7 days

  const [inviteCodeId] = await db('invite_codes').insert({
    code: code!,
    created_by: userId,
    max_uses: 1,
    used_count: 0,
    traffic_reward: defaultTrafficReward,
    days_reward: defaultDaysReward,
    status: INVITE_CODE_STATUS.ACTIVE,
    expire_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  });

  const newCode = await db('invite_codes')
    .where({ id: inviteCodeId })
    .first();

  return {
    id: newCode.id,
    code: newCode.code,
    createdBy: newCode.created_by,
    usedBy: newCode.used_by,
    usedAt: newCode.used_at,
    maxUses: newCode.max_uses,
    usedCount: newCode.used_count,
    trafficReward: newCode.traffic_reward,
    daysReward: newCode.days_reward,
    status: newCode.status,
    expireAt: newCode.expire_at,
    createdAt: newCode.created_at,
  };
};

/**
 * Validate an invite code
 */
export const validateInviteCode = async (code: string): Promise<ValidateInviteResponse> => {
  if (!code || code.length !== 8) {
    return {
      valid: false,
      trafficReward: 0,
      daysReward: 0,
      message: 'Invalid invite code format',
    };
  }

  const inviteCode = await db('invite_codes')
    .where({ code: code.toUpperCase() })
    .first();

  if (!inviteCode) {
    return {
      valid: false,
      trafficReward: 0,
      daysReward: 0,
      message: 'Invite code not found',
    };
  }

  // Check if code is expired
  if (inviteCode.expire_at && new Date(inviteCode.expire_at) < new Date()) {
    await db('invite_codes')
      .where({ id: inviteCode.id })
      .update({ status: INVITE_CODE_STATUS.EXPIRED });

    return {
      valid: false,
      trafficReward: 0,
      daysReward: 0,
      message: 'Invite code has expired',
    };
  }

  // Check if code is disabled
  if (inviteCode.status === INVITE_CODE_STATUS.DISABLED) {
    return {
      valid: false,
      trafficReward: 0,
      daysReward: 0,
      message: 'Invite code has been disabled',
    };
  }

  // Check if code has reached max uses
  if (inviteCode.used_count >= inviteCode.max_uses) {
    await db('invite_codes')
      .where({ id: inviteCode.id })
      .update({ status: INVITE_CODE_STATUS.USED });

    return {
      valid: false,
      trafficReward: 0,
      daysReward: 0,
      message: 'Invite code has been fully used',
    };
  }

  return {
    valid: true,
    trafficReward: inviteCode.traffic_reward,
    daysReward: inviteCode.days_reward,
    message: 'Invite code is valid',
  };
};

/**
 * Get invite statistics for a user
 */
export const getInviteStats = async (userId: string): Promise<InviteStats> => {
  // Get total invites created
  const totalInvitesResult = await db('invite_codes')
    .where({ created_by: userId })
    .count('id as count')
    .first();

  // Get successful invites (used codes)
  const successfulInvitesResult = await db('invite_codes')
    .where({ created_by: userId })
    .where('used_count', '>', 0)
    .count('id as count')
    .first();

  // Get total earned rewards from invite_rewards table
  const rewardsResult = await db('invite_rewards')
    .where({ user_id: userId })
    .select('reward_type', 'reward_value');

  let earnedTraffic = 0;
  let earnedDays = 0;

  for (const reward of rewardsResult) {
    if (reward.reward_type === 'traffic') {
      earnedTraffic += reward.reward_value;
    } else if (reward.reward_type === 'days') {
      earnedDays += reward.reward_value;
    }
  }

  return {
    totalInvites: Number(totalInvitesResult?.count || 0),
    successfulInvites: Number(successfulInvitesResult?.count || 0),
    earnedTraffic,
    earnedDays,
  };
};

/**
 * Process invite reward when a user uses an invite code
 */
export const processInviteReward = async (
  inviteCodeId: number,
  userId: string
): Promise<void> => {
  const inviteCode = await db('invite_codes')
    .where({ id: inviteCodeId })
    .first();

  if (!inviteCode) {
    throw new NotFoundError('Invite code', String(inviteCodeId));
  }

  // Check if code is still valid
  if (inviteCode.status !== INVITE_CODE_STATUS.ACTIVE) {
    throw new ValidationError([
      { field: 'inviteCode', message: 'Invite code is no longer valid' },
    ]);
  }

  // Check if code has reached max uses
  if (inviteCode.used_count >= inviteCode.max_uses) {
    throw new ValidationError([
      { field: 'inviteCode', message: 'Invite code has been fully used' },
    ]);
  }

  // Update invite code usage
  const newUsedCount = inviteCode.used_count + 1;
  const newStatus = newUsedCount >= inviteCode.max_uses
    ? INVITE_CODE_STATUS.USED
    : INVITE_CODE_STATUS.ACTIVE;

  await db('invite_codes')
    .where({ id: inviteCodeId })
    .update({
      used_count: newUsedCount,
      used_by: userId,
      used_at: new Date(),
      status: newStatus,
      updated_at: new Date(),
    });

  // Record rewards for the inviter
  if (inviteCode.traffic_reward > 0) {
    await db('invite_rewards').insert({
      invite_code_id: inviteCodeId,
      user_id: inviteCode.created_by,
      reward_type: 'traffic',
      reward_value: inviteCode.traffic_reward,
      created_at: new Date(),
    });
  }

  if (inviteCode.days_reward > 0) {
    await db('invite_rewards').insert({
      invite_code_id: inviteCodeId,
      user_id: inviteCode.created_by,
      reward_type: 'days',
      reward_value: inviteCode.days_reward,
      created_at: new Date(),
    });
  }
};
