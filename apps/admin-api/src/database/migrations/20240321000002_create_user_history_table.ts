import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_history', (table) => {
    table.bigIncrements('id').primary();
    table.string('user_id', 64).notNullable();
    table.string('field_name', 50).notNullable();
    table.text('old_value').nullable();
    table.text('new_value').nullable();
    table.string('changed_by', 100).notNullable();
    table.timestamp('changed_at').defaultTo(knex.fn.now());
    table.string('ip_address', 45).nullable();

    // Indexes - 使用表特定的索引名称避免冲突
    table.index('user_id', 'idx_history_user_id');
    table.index('changed_at', 'idx_history_changed_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_history');
}
