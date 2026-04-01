import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ip_pools', (table) => {
    table.string('id', 36).primary();
    table.string('name', 100).notNullable();
    table.integer('node_id').unsigned().notNullable();
    table.string('ip_type', 50).nullable().defaultTo('datacenter');
    table.string('rotation_strategy', 50).nullable().defaultTo('round_robin');
    table.integer('rotation_interval').unsigned().nullable().defaultTo(86400);
    table.integer('current_index').unsigned().nullable().defaultTo(0);
    table.boolean('is_active').nullable().defaultTo(true);
    table.datetime('last_rotation_at').nullable();
    table.datetime('created_at').nullable();
    table.datetime('updated_at').nullable();
    table.index(['node_id']);
    table.index(['is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ip_pools');
}
