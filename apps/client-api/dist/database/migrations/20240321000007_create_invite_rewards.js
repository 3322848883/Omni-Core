"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('invite_rewards', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('invite_code_id').unsigned().notNullable();
        table.string('user_id', 50).notNullable();
        table.string('reward_type', 50).notNullable(); // traffic, days, cash
        table.bigInteger('reward_value').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        // Foreign keys
        table.foreign('invite_code_id').references('id').inTable('invite_codes');
        table.foreign('user_id').references('user_id').inTable('users');
        // Indexes
        table.index('user_id', 'idx_invite_rewards_user_id');
        table.index('invite_code_id', 'idx_invite_rewards_invite_code_id');
    });
    await knex.raw('ALTER TABLE invite_rewards COMMENT = "邀请奖励表"');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('invite_rewards');
}
//# sourceMappingURL=20240321000007_create_invite_rewards.js.map