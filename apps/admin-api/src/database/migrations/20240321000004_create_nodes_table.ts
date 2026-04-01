import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('nodes', (table) => {
    table.bigIncrements('id').primary();
    table.string('code', 50).notNullable().unique();
    table.string('name', 100).notNullable();
    table.string('region', 50).notNullable();
    table.string('country', 50).notNullable();
    table.string('city', 50).notNullable();
    table.decimal('latitude', 10, 8).nullable();
    table.decimal('longitude', 11, 8).nullable();
    table.string('host', 255).notNullable();
    table.integer('port').unsigned().notNullable();
    table.string('protocol', 20).notNullable(); // vless, vmess, trojan, shadowsocks
    table.string('status', 20).notNullable().defaultTo('offline'); // online, offline, maintenance
    table.tinyint('health_score').unsigned().nullable();
    table.tinyint('load_percent').unsigned().nullable();
    table.integer('active_connections').unsigned().nullable().defaultTo(0);
    table.integer('max_connections').unsigned().nullable().defaultTo(10000);
    table.tinyint('priority').unsigned().nullable().defaultTo(1);
    table.boolean('is_backup').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes - 使用表特定的索引名称避免冲突
    table.index('status', 'idx_nodes_status');
    table.index('region', 'idx_nodes_region');
    table.index('priority', 'idx_nodes_priority');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('nodes');
}
