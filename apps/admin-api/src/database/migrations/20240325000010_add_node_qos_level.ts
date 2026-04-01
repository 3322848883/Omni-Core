import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    table.integer('qos_level').unsigned().nullable().defaultTo(1).comment('QoS等级 (1-5)');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    table.dropColumn('qos_level');
  });
}
