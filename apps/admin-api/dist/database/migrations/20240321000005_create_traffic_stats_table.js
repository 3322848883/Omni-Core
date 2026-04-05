"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    // Traffic stats daily table
    await knex.schema.createTable('traffic_stats_daily', (table) => {
        table.increments('id').primary();
        table.string('user_id', 50).notNullable();
        table.date('stat_date').notNullable();
        table.bigInteger('upload_bytes').defaultTo(0);
        table.bigInteger('download_bytes').defaultTo(0);
        table.bigInteger('total_bytes').defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.unique(['user_id', 'stat_date']);
        table.index('user_id');
        table.index('stat_date');
    });
    // Traffic stats node table
    await knex.schema.createTable('traffic_stats_node', (table) => {
        table.increments('id').primary();
        table.integer('node_id').unsigned().notNullable();
        table.date('stat_date').notNullable();
        table.bigInteger('upload_bytes').defaultTo(0);
        table.bigInteger('download_bytes').defaultTo(0);
        table.bigInteger('total_bytes').defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.unique(['node_id', 'stat_date']);
        table.index('node_id');
        table.index('stat_date');
    });
    // Order status logs table
    await knex.schema.createTable('order_status_logs', (table) => {
        table.increments('id').primary();
        table.integer('order_id').unsigned().notNullable();
        table.string('from_status', 20).nullable();
        table.string('to_status', 20).notNullable();
        table.string('changed_by', 50).notNullable();
        table.text('reason').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index('order_id');
        table.index('created_at');
    });
    // Invite codes table
    await knex.schema.createTable('invite_codes', (table) => {
        table.increments('id').primary();
        table.string('code', 20).notNullable().unique();
        table.string('status', 20).defaultTo('active'); // active, used, disabled, expired
        table.string('created_by', 50).notNullable();
        table.string('used_by', 50).nullable();
        table.timestamp('used_at').nullable();
        table.integer('max_uses').defaultTo(1);
        table.integer('used_count').defaultTo(0);
        table.bigInteger('traffic_reward').defaultTo(0);
        table.integer('days_reward').defaultTo(0);
        table.timestamp('expire_at').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index('code');
        table.index('status');
        table.index('created_by');
    });
    // Invite usage history table
    await knex.schema.createTable('invite_usage_history', (table) => {
        table.increments('id').primary();
        table.integer('invite_code_id').unsigned().notNullable();
        table.string('used_by', 50).notNullable();
        table.boolean('reward_given').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index('invite_code_id');
        table.index('used_by');
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('invite_usage_history');
    await knex.schema.dropTableIfExists('invite_codes');
    await knex.schema.dropTableIfExists('order_status_logs');
    await knex.schema.dropTableIfExists('traffic_stats_node');
    await knex.schema.dropTableIfExists('traffic_stats_daily');
}
//# sourceMappingURL=20240321000005_create_traffic_stats_table.js.map