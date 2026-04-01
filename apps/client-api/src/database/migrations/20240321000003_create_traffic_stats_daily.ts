import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('traffic_stats_daily', (table) => {
    table.bigIncrements('id').primary();
    table.string('user_id', 50).notNullable();
    table.date('date').notNullable();
    table.bigInteger('upload').unsigned().notNullable().defaultTo(0);
    table.bigInteger('download').unsigned().notNullable().defaultTo(0);
    table.bigInteger('total').unsigned().notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Unique constraint
    table.unique(['user_id', 'date']);

    // Foreign key
    table.foreign('user_id').references('user_id').inTable('users');

    // Indexes
    table.index('user_id', 'idx_traffic_stats_daily_user_id');
    table.index('date', 'idx_traffic_stats_daily_date');
  });

  await knex.raw('ALTER TABLE traffic_stats_daily COMMENT = "流量统计表"');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('traffic_stats_daily');
}
