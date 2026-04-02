"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
async function seed(knex) {
    // Deletes ALL existing entries
    await knex('invite_reward_rules').del();
    // Inserts seed entries
    await knex('invite_reward_rules').insert([
        {
            rule_name: '注册奖励',
            rule_code: 'REGISTER_REWARD',
            trigger_event: 'register',
            condition_type: 'none',
            condition_value: null,
            rewards: JSON.stringify({
                traffic: 1073741824, // 1GB
                duration: 0,
                cash: 0,
            }),
            is_active: true,
            priority: 1,
            start_date: null,
            end_date: null,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        },
        {
            rule_name: '首单奖励',
            rule_code: 'FIRST_ORDER_REWARD',
            trigger_event: 'first_order',
            condition_type: 'min_order_amount',
            condition_value: JSON.stringify({ min_amount: 10 }),
            rewards: JSON.stringify({
                traffic: 5368709120, // 5GB
                duration: 7, // 7 days
                cash: 0,
            }),
            is_active: true,
            priority: 2,
            start_date: null,
            end_date: null,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        },
        {
            rule_name: '邀请里程碑-5人',
            rule_code: 'MILESTONE_5',
            trigger_event: 'milestone',
            condition_type: 'invite_count',
            condition_value: JSON.stringify({ count: 5 }),
            rewards: JSON.stringify({
                traffic: 10737418240, // 10GB
                duration: 30, // 30 days
                cash: 5, // $5
            }),
            is_active: true,
            priority: 3,
            start_date: null,
            end_date: null,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        },
    ]);
}
//# sourceMappingURL=03_invite_reward_rules.js.map