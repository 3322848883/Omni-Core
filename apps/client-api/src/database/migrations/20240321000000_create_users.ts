import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();
    table.string('user_id', 50).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('username', 50).nullable();
    table.string('password_hash', 255).nullable();
    table.string('password_salt', 255).nullable();
    table.string('avatar_url', 500).nullable();
    table.text('invite_code').nullable();
    table.bigInteger('invited_by').unsigned().nullable();
    table.bigInteger('traffic_limit').unsigned().defaultTo(0);
    table.bigInteger('traffic_used').unsigned().defaultTo(0);
    table.date('expire_date').nullable();
    table.string('vpn_uuid', 50).nullable();
    table.tinyint('status').unsigned().defaultTo(1); // 1: active, 0: inactive
    table.timestamp('last_login_at').nullable();
    table.string('last_login_ip', 50).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id', 'idx_users_user_id');
    table.index('email', 'idx_users_email');
    table.index('status', 'idx_users_status');
    table.index('invite_code', 'idx_users_invite_code');
    table.index('invited_by', 'idx_users_invited_by');
    table.index('vpn_uuid', 'idx_users_vpn_uuid');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
