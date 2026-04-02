import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('crypto_payments', (table) => {
    table.bigIncrements('id').primary();
    table.string('crypto_payment_id', 50).notNullable().unique();
    table.string('wallet_id', 50).notNullable();
    table.string('order_id', 50).notNullable();
    table.string('user_id', 50).notNullable();
    table.string('transaction_id', 255).nullable();
    table.string('currency', 20).notNullable();
    table.decimal('amount', 20, 10).notNullable();
    table.decimal('fiat_amount', 10, 2).notNullable();
    table.string('fiat_currency', 10).notNullable().defaultTo('USD');
    table.decimal('exchange_rate', 20, 10).notNullable();
    table.integer('confirmations').defaultTo(0);
    table.integer('required_confirmations').notNullable().defaultTo(6);
    table.string('status', 20).notNullable().defaultTo('pending');
    table.timestamp('transaction_at').nullable();
    table.timestamp('confirmed_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('wallet_id').references('wallet_id').inTable('crypto_wallets');
    table.foreign('order_id').references('order_id').inTable('orders');
    table.foreign('user_id').references('user_id').inTable('users');

    table.index('wallet_id', 'idx_crypto_payments_wallet_id');
    table.index('order_id', 'idx_crypto_payments_order_id');
    table.index('user_id', 'idx_crypto_payments_user_id');
    table.index('transaction_id', 'idx_crypto_payments_tx_id');
    table.index('status', 'idx_crypto_payments_status');
  });

  await knex.raw('ALTER TABLE crypto_payments COMMENT = "加密货币支付记录表"');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('crypto_payments');
}
