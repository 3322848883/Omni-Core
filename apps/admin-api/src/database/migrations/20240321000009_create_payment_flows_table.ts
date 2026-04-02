import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('payment_flows', (table) => {
    table.increments('id').primary();
    table.string('orderId').notNullable().unique();
    table.string('orderNo').notNullable();
    table.string('userId').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency').notNullable();
    table.string('provider').notNullable();
    table.string('providerOrderId').nullable();
    table.string('status').notNullable();
    table.integer('attempts').defaultTo(0);
    table.timestamp('lastAttemptAt').nullable();
    table.timestamp('nextAttemptAt').nullable();
    table.string('idempotencyKey').notNullable().unique();
    table.json('metadata').nullable();
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });

  // 创建索引
  await knex.schema.raw('CREATE INDEX idx_payment_flows_status ON payment_flows(status)');
  await knex.schema.raw('CREATE INDEX idx_payment_flows_order_id ON payment_flows(orderId)');
  await knex.schema.raw('CREATE INDEX idx_payment_flows_user_id ON payment_flows(userId)');
  await knex.schema.raw('CREATE INDEX idx_payment_flows_next_attempt ON payment_flows(nextAttemptAt)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payment_flows');
}