import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('projects', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('merchant_id').unsigned().notNullable().references('id').inTable('merchants').onDelete('CASCADE');
    table.string('project_id', 50).notNullable().unique();
    table.string('name', 255).notNullable();
    table.string('description', 1000).nullable();
    table.string('status', 50).notNullable().defaultTo('active');
    table.text('config').nullable();
    table.integer('version').unsigned().notNullable().defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('merchant_id', 'idx_projects_merchant_id');
    table.index('project_id', 'idx_projects_project_id');
    table.index('status', 'idx_projects_status');
  });

  await knex.raw('ALTER TABLE projects COMMENT = "项目表"');

  await knex.schema.createTable('project_payment_configs', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('project_id').unsigned().notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.string('payment_channel', 100).notNullable();
    table.text('config').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('effective_from').notNullable();
    table.timestamp('effective_to').nullable();
    table.integer('version').unsigned().notNullable().defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('project_id', 'idx_project_payment_configs_project_id');
    table.index('payment_channel', 'idx_project_payment_configs_channel');
    table.index('is_active', 'idx_project_payment_configs_active');
  });

  await knex.raw('ALTER TABLE project_payment_configs COMMENT = "项目支付配置表"');

  await knex.schema.createTable('project_stats', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('project_id').unsigned().notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.date('stat_date').notNullable();
    table.bigInteger('total_transactions').unsigned().defaultTo(0);
    table.decimal('total_amount', 15, 2).defaultTo(0);
    table.bigInteger('successful_transactions').unsigned().defaultTo(0);
    table.decimal('successful_amount', 15, 2).defaultTo(0);
    table.bigInteger('failed_transactions').unsigned().defaultTo(0);
    table.decimal('failed_amount', 15, 2).defaultTo(0);
    table.decimal('total_fee', 15, 2).defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['project_id', 'stat_date'], 'idx_project_stats_unique');
    table.index('stat_date', 'idx_project_stats_stat_date');
  });

  await knex.raw('ALTER TABLE project_stats COMMENT = "项目数据统计表"');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('project_stats');
  await knex.schema.dropTableIfExists('project_payment_configs');
  await knex.schema.dropTableIfExists('projects');
}
