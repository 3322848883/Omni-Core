import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    table.string('ip_type', 20).nullable().defaultTo('IPv4').comment('IP类型: IPv4, IPv6, Dual');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    table.dropColumn('ip_type');
  });
}
