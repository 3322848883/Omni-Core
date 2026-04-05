"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('invite_codes', (table) => {
        table.bigIncrements('id').primary();
        table.string('code', 50).notNullable().unique();
        table.string('created_by', 50).notNullable();
        table.string('used_by', 50).nullable();
        table.timestamp('used_at').nullable();
        table.integer('max_uses').notNullable().defaultTo(1);
        table.integer('used_count').notNullable().defaultTo(0);
        table.bigInteger('traffic_reward').notNullable().defaultTo(0);
        table.integer('days_reward').notNullable().defaultTo(0);
        table.string('status', 20).notNullable().defaultTo('active'); // active, used, disabled, expired
        table.timestamp('expire_at').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        // Foreign keys
        table.foreign('created_by').references('user_id').inTable('users');
        table.foreign('used_by').references('user_id').inTable('users');
        // Indexes
        table.index('created_by', 'idx_invite_codes_created_by');
        table.index('code', 'idx_invite_codes_code');
        table.index('status', 'idx_invite_codes_status');
    });
    await knex.raw('ALTER TABLE invite_codes COMMENT = "邀请码表"');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('invite_codes');
}
//# sourceMappingURL=20240321000006_create_invite_codes.js.map