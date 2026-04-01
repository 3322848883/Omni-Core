import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_subscriptions', (table) => {
    table.bigIncrements('id').primary();
    table.string('user_id', 50).notNullable();
    table.string('plan_id', 50).notNullable();
    table.string('status', 20).notNullable().defaultTo('active'); // active, expired, cancelled
    table.bigInteger('traffic_limit').notNullable();
    table.bigInteger('traffic_used').unsigned().notNullable().defaultTo(0);
    table.date('start_date').nullable();
    table.date('end_date').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('user_id').references('user_id').inTable('users');
    table.foreign('plan_id').references('plan_id').inTable('subscription_plans');

    // Indexes
    table.index('user_id', 'idx_user_subscriptions_user_id');
    table.index('status', 'idx_user_subscriptions_status');
  });

  await knex.raw('ALTER TABLE user_subscriptions COMMENT = "用户订阅表"');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_subscriptions');
}
