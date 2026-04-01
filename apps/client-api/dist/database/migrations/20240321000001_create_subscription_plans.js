"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('subscription_plans', (table) => {
        table.bigIncrements('id').primary();
        table.string('plan_id', 50).notNullable().unique();
        table.string('name', 100).notNullable();
        table.text('description').nullable();
        table.decimal('price', 10, 2).notNullable();
        table.integer('duration_days').notNullable();
        table.bigInteger('traffic_limit').notNullable();
        table.text('features').nullable(); // JSON format
        table.boolean('is_popular').defaultTo(false);
        table.integer('sort_order').defaultTo(0);
        table.tinyint('status').unsigned().defaultTo(1);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        // Indexes
        table.index('status', 'idx_subscription_plans_status');
        table.index('sort_order', 'idx_subscription_plans_sort_order');
    });
    await knex.raw('ALTER TABLE subscription_plans COMMENT = "订阅套餐表"');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('subscription_plans');
}
//# sourceMappingURL=20240321000001_create_subscription_plans.js.map