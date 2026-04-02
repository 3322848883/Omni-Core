import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('crypto_exchange_rates', (table) => {
    table.bigIncrements('id').primary();
    table.string('currency', 20).notNullable();
    table.string('fiat_currency', 10).notNullable().defaultTo('USD');
    table.decimal('rate', 20, 10).notNullable();
    table.string('source', 50).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['currency', 'fiat_currency'], 'idx_crypto_rates_currency_pair');
    table.index('created_at', 'idx_crypto_rates_created_at');
  });

  await knex.raw('ALTER TABLE crypto_exchange_rates COMMENT = "加密货币汇率表"');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('crypto_exchange_rates');
}
