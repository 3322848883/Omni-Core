import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Invite Relations Table
  await knex.schema.createTable('invite_relations', (table) => {
    table.bigIncrements('id').primary();
    table.string('invite_code', 20).notNullable().unique();
    table.string('inviter_id', 64).notNullable();
    table.string('invitee_id', 64).nullable();
    table.string('status', 20).notNullable().defaultTo('pending'); // pending, registered, completed, invalid
    table.string('invite_channel', 50).nullable();
    table.string('invite_ip', 45).nullable();
    table.string('invitee_ip', 45).nullable();
    table.string('invitee_device_id', 100).nullable();
    table.timestamp('registered_at').nullable();
    table.timestamp('first_order_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('inviter_id', 'idx_invite_relations_inviter_id');
    table.index('invitee_id', 'idx_invite_relations_invitee_id');
    table.index('status', 'idx_invite_relations_status');
  });

  await knex.raw('ALTER TABLE invite_relations COMMENT = "邀请关系表"');

  // Invite Rewards Table
  await knex.schema.createTable('invite_rewards', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('invite_relation_id').unsigned().notNullable();
    table.string('inviter_id', 64).notNullable();
    table.string('reward_type', 20).notNullable(); // traffic, duration, cash, credit
    table.decimal('reward_value', 10, 2).notNullable();
    table.string('reward_unit', 20).notNullable();
    table.string('trigger_event', 50).notNullable();
    table.string('status', 20).notNullable().defaultTo('pending'); // pending, issued, failed, revoked
    table.timestamp('issued_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('inviter_id', 'idx_invite_rewards_inviter_id');
    table.index('status', 'idx_invite_rewards_status');
  });

  await knex.raw('ALTER TABLE invite_rewards COMMENT = "邀请奖励记录表"');

  // Invite Reward Rules Table
  await knex.schema.createTable('invite_reward_rules', (table) => {
    table.bigIncrements('id').primary();
    table.string('rule_name', 100).notNullable();
    table.string('rule_code', 50).notNullable().unique();
    table.string('trigger_event', 20).notNullable(); // register, first_order, renewal, milestone
    table.string('condition_type', 20).notNullable().defaultTo('none'); // none, min_order_amount, specific_package, invite_count
    table.json('condition_value').nullable();
    table.json('rewards').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.tinyint('priority').unsigned().defaultTo(1);
    table.date('start_date').nullable();
    table.date('end_date').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.raw('ALTER TABLE invite_reward_rules COMMENT = "邀请奖励规则配置表"');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('invite_reward_rules');
  await knex.schema.dropTableIfExists('invite_rewards');
  await knex.schema.dropTableIfExists('invite_relations');
}
