"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('orders', (table) => {
        table.bigIncrements('id').primary();
        table.string('order_no', 64).notNullable().unique();
        table.string('user_id', 64).notNullable();
        table.string('order_type', 20).notNullable(); // monthly, quarterly, yearly, traffic
        table.string('status', 20).notNullable().defaultTo('pending'); // pending, paid, completed, cancelled, expired
        table.decimal('amount', 10, 2).notNullable();
        table.bigInteger('traffic_limit').unsigned().nullable();
        table.integer('duration_days').unsigned().nullable();
        table.date('start_date').nullable();
        table.date('end_date').nullable();
        table.string('payment_method', 50).nullable();
        table.timestamp('payment_time').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        // Indexes - 使用表特定的索引名称避免冲突
        table.index('user_id', 'idx_orders_user_id');
        table.index('status', 'idx_orders_status');
        table.index('created_at', 'idx_orders_created_at');
    });
    await knex.raw('ALTER TABLE orders COMMENT = "订单表"');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('orders');
}
//# sourceMappingURL=20240321000003_create_orders_table.js.map