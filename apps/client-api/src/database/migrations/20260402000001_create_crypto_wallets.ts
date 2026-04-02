import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('crypto_wallets', (table) => {
    table.bigIncrements('id').primary();
    table.string('wallet_id', 50).notNullable().unique();
    table.string('user_id', 50).notNullable();
    table.string('order_id', 50).nullable();
    table.string('currency', 20).notNullable();
    table.string('address', 255).notNullable();
    table.string('private_key', 500).nullable();
    table.decimal('expected_amount', 20, 10).notNullable();
    table.decimal('received_amount', 20, 10).defaultTo(0);
    table.string('status', 20).notNullable().defaultTo('pending');
    table.timestamp('expires_at').notNullable();
    table.timestamp('confirmed_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('user_id').references('user_id').inTable('users');
    table.foreign('order_id').references('order_id').inTable('orders');

    table.index('user_id', 'idx_crypto_wallets_user_id');
    table.index('order_id', 'idx_crypto_wallets_order_id');
    table.index('currency', 'idx_crypto_wallets_currency');
    table.index('status', 'idx_crypto_wallets_status');
    table.index('address', 'idx_crypto_wallets_address');
  });

  await knex.raw('ALTER TABLE crypto_wallets COMMENT = "加密货币钱包表"');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('crypto_wallets');
}
