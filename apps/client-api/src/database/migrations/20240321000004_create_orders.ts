import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('orders', (table) => {
    table.bigIncrements('id').primary();
    table.string('order_id', 50).notNullable().unique();
    table.string('order_no', 50).notNullable().unique();
    table.string('user_id', 50).notNullable();
    table.string('plan_id', 50).nullable();
    table.string('order_type', 50).notNullable();
    table.string('status', 20).notNullable().defaultTo('pending'); // pending, completed, cancelled, refunded
    table.decimal('amount', 10, 2).notNullable();
    table.bigInteger('traffic_limit').nullable();
    table.integer('duration_days').nullable();
    table.date('start_date').nullable();
    table.date('end_date').nullable();
    table.string('payment_method', 50).nullable();
    table.timestamp('payment_time').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('user_id').references('user_id').inTable('users');
    table.foreign('plan_id').references('plan_id').inTable('subscription_plans');

    // Indexes
    table.index('user_id', 'idx_orders_user_id');
    table.index('status', 'idx_orders_status');
    table.index('created_at', 'idx_orders_created_at');
  });

  await knex.raw('ALTER TABLE orders COMMENT = "订单表"');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('orders');
}
