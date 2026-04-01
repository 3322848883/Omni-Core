import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();
    table.string('user_id', 64).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('username', 100).notNullable();
    table.string('vpn_uuid', 36).notNullable().unique();
    table.tinyint('status').unsigned().notNullable().defaultTo(1);
    table.bigInteger('traffic_limit').unsigned().notNullable().defaultTo(10737418240);
    table.bigInteger('traffic_used').unsigned().notNullable().defaultTo(0);
    table.datetime('expire_date').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.integer('version').unsigned().notNullable().defaultTo(1);

    // Indexes - 使用表特定的索引名称避免冲突
    table.index('status', 'idx_users_status');
    table.index('expire_date', 'idx_users_expire_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
