import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    table.string('line_type', 20).nullable().defaultTo('BGP').comment('线路类型: BGP, CN2, DoubleGrade, Severe');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    table.dropColumn('line_type');
  });
}
