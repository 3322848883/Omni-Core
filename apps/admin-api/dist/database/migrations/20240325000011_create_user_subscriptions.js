"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('user_subscriptions', (table) => {
        table.bigIncrements('id').primary();
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.bigInteger('plan_id').unsigned().notNullable().references('id').inTable('subscription_plans').onDelete('CASCADE');
        table.string('status', 20).notNullable().defaultTo('active');
        table.timestamp('start_date').notNullable();
        table.timestamp('end_date').nullable();
        table.integer('duration_days').unsigned().nullable();
        table.bigInteger('max_traffic_bytes').unsigned().nullable();
        table.bigInteger('used_traffic_bytes').unsigned().nullable().defaultTo(0);
        table.string('subscription_type', 50).nullable().defaultTo('new');
        table.string('order_id', 100).nullable();
        table.string('payment_method', 50).nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index(['user_id', 'status'], 'idx_user_subs_user_status');
        table.index(['plan_id'], 'idx_user_subs_plan');
        table.index(['end_date'], 'idx_user_subs_end_date');
    });
    await knex.raw('ALTER TABLE user_subscriptions COMMENT = "用户订阅表"');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('user_subscriptions');
}
//# sourceMappingURL=20240325000011_create_user_subscriptions.js.map