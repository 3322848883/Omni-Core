"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processInviteReward = exports.getInviteStats = exports.validateInviteCode = exports.createInviteCode = exports.getMyInviteCodes = void 0;
const database_1 = __importDefault(require("@/config/database"));
const crypto_1 = require("@/utils/crypto");
const constants_1 = require("@/constants");
const AppError_1 = require("@/errors/AppError");
/**
 * Get my invite codes
 */
const getMyInviteCodes = async (userId) => {
    const codes = await (0, database_1.default)('invite_codes')
        .where({ created_by: userId })
        .orderBy('created_at', 'desc');
    return codes.map((code) => ({
        id: code.id,
        code: code.code,
        createdBy: code.created_by,
        usedBy: code.used_by,
        usedAt: code.used_at,
        maxUses: code.max_uses,
        usedCount: code.used_count,
        trafficReward: code.traffic_reward,
        daysReward: code.days_reward,
        status: code.status,
        expireAt: code.expire_at,
        createdAt: code.created_at,
    }));
};
exports.getMyInviteCodes = getMyInviteCodes;
/**
 * Create a new invite code
 */
const createInviteCode = async (userId) => {
    // Generate unique invite code
    let code;
    let isUnique = false;
    while (!isUnique) {
        code = (0, crypto_1.generateInviteCode)();
        const existing = await (0, database_1.default)('invite_codes')
            .where({ code })
            .first();
        if (!existing) {
            isUnique = true;
        }
    }
    // Default rewards configuration
    const defaultTrafficReward = 5 * 1024 * 1024 * 1024; // 5GB in bytes
    const defaultDaysReward = 7; // 7 days
    const [inviteCodeId] = await (0, database_1.default)('invite_codes').insert({
        code: code,
        created_by: userId,
        max_uses: 1,
        used_count: 0,
        traffic_reward: defaultTrafficReward,
        days_reward: defaultDaysReward,
        status: constants_1.INVITE_CODE_STATUS.ACTIVE,
        expire_at: null,
        created_at: new Date(),
        updated_at: new Date(),
    });
    const newCode = await (0, database_1.default)('invite_codes')
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
exports.createInviteCode = createInviteCode;
/**
 * Validate an invite code
 */
const validateInviteCode = async (code) => {
    if (!code || code.length !== 8) {
        return {
            valid: false,
            trafficReward: 0,
            daysReward: 0,
            message: 'Invalid invite code format',
        };
    }
    const inviteCode = await (0, database_1.default)('invite_codes')
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
        await (0, database_1.default)('invite_codes')
            .where({ id: inviteCode.id })
            .update({ status: constants_1.INVITE_CODE_STATUS.EXPIRED });
        return {
            valid: false,
            trafficReward: 0,
            daysReward: 0,
            message: 'Invite code has expired',
        };
    }
    // Check if code is disabled
    if (inviteCode.status === constants_1.INVITE_CODE_STATUS.DISABLED) {
        return {
            valid: false,
            trafficReward: 0,
            daysReward: 0,
            message: 'Invite code has been disabled',
        };
    }
    // Check if code has reached max uses
    if (inviteCode.used_count >= inviteCode.max_uses) {
        await (0, database_1.default)('invite_codes')
            .where({ id: inviteCode.id })
            .update({ status: constants_1.INVITE_CODE_STATUS.USED });
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
exports.validateInviteCode = validateInviteCode;
/**
 * Get invite statistics for a user
 */
const getInviteStats = async (userId) => {
    // Get total invites created
    const totalInvitesResult = await (0, database_1.default)('invite_codes')
        .where({ created_by: userId })
        .count('id as count')
        .first();
    // Get successful invites (used codes)
    const successfulInvitesResult = await (0, database_1.default)('invite_codes')
        .where({ created_by: userId })
        .where('used_count', '>', 0)
        .count('id as count')
        .first();
    // Get total earned rewards from invite_rewards table
    const rewardsResult = await (0, database_1.default)('invite_rewards')
        .where({ user_id: userId })
        .select('reward_type', 'reward_value');
    let earnedTraffic = 0;
    let earnedDays = 0;
    for (const reward of rewardsResult) {
        if (reward.reward_type === 'traffic') {
            earnedTraffic += reward.reward_value;
        }
        else if (reward.reward_type === 'days') {
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
exports.getInviteStats = getInviteStats;
/**
 * Process invite reward when a user uses an invite code
 */
const processInviteReward = async (inviteCodeId, userId) => {
    const inviteCode = await (0, database_1.default)('invite_codes')
        .where({ id: inviteCodeId })
        .first();
    if (!inviteCode) {
        throw new AppError_1.NotFoundError('Invite code', String(inviteCodeId));
    }
    // Check if code is still valid
    if (inviteCode.status !== constants_1.INVITE_CODE_STATUS.ACTIVE) {
        throw new AppError_1.ValidationError([
            { field: 'inviteCode', message: 'Invite code is no longer valid' },
        ]);
    }
    // Check if code has reached max uses
    if (inviteCode.used_count >= inviteCode.max_uses) {
        throw new AppError_1.ValidationError([
            { field: 'inviteCode', message: 'Invite code has been fully used' },
        ]);
    }
    // Update invite code usage
    const newUsedCount = inviteCode.used_count + 1;
    const newStatus = newUsedCount >= inviteCode.max_uses
        ? constants_1.INVITE_CODE_STATUS.USED
        : constants_1.INVITE_CODE_STATUS.ACTIVE;
    await (0, database_1.default)('invite_codes')
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
        await (0, database_1.default)('invite_rewards').insert({
            invite_code_id: inviteCodeId,
            user_id: inviteCode.created_by,
            reward_type: 'traffic',
            reward_value: inviteCode.traffic_reward,
            created_at: new Date(),
        });
    }
    if (inviteCode.days_reward > 0) {
        await (0, database_1.default)('invite_rewards').insert({
            invite_code_id: inviteCodeId,
            user_id: inviteCode.created_by,
            reward_type: 'days',
            reward_value: inviteCode.days_reward,
            created_at: new Date(),
        });
    }
};
exports.processInviteReward = processInviteReward;
//# sourceMappingURL=inviteService.js.map