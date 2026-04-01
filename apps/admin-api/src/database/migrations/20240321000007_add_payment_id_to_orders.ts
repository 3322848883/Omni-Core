import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('orders', (table) => {
    table.string('payment_id', 255).nullable().after('payment_method');
    table.index('payment_id', 'idx_orders_payment_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('orders', (table) => {
    table.dropIndex('payment_id', 'idx_orders_payment_id');
    table.dropColumn('payment_id');
  });
}
