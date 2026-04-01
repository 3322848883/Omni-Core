import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ip_pool_ips', (table) => {
    table.string('id', 36).primary();
    table.string('pool_id', 36).notNullable();
    table.string('ip', 45).notNullable();
    table.string('status', 20).nullable().defaultTo('active');
    table.boolean('is_blocked').nullable().defaultTo(false);
    table.datetime('last_used_at').nullable();
    table.datetime('created_at').nullable();
    table.datetime('updated_at').nullable();
    table.index(['pool_id']);
    table.index(['ip']);
    table.unique(['pool_id', 'ip']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ip_pool_ips');
}
