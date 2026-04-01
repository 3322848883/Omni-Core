import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('payments', (table) => {
    table.bigIncrements('id').primary();
    table.string('payment_id', 50).notNullable().unique();
    table.string('order_id', 50).notNullable();
    table.string('user_id', 50).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('payment_method', 50).notNullable();
    table.string('status', 20).notNullable().defaultTo('pending'); // pending, success, failed
    table.string('transaction_id', 255).nullable();
    table.timestamp('paid_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('order_id').references('order_id').inTable('orders');
    table.foreign('user_id').references('user_id').inTable('users');

    // Indexes
    table.index('order_id', 'idx_payments_order_id');
    table.index('user_id', 'idx_payments_user_id');
  });

  await knex.raw('ALTER TABLE payments COMMENT = "支付记录表"');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payments');
}
