import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 检查并添加缺失的字段
  const hasExpireDate = await knex.schema.hasColumn('users', 'expire_date');
  if (!hasExpireDate) {
    await knex.schema.alterTable('users', (table) => {
      table.date('expire_date').nullable();
    });
  }

  // 检查是否有 traffic_limit 字段，如果没有，添加它
  const hasTrafficLimit = await knex.schema.hasColumn('users', 'traffic_limit');
  if (!hasTrafficLimit) {
    await knex.schema.alterTable('users', (table) => {
      table.bigInteger('traffic_limit').unsigned().defaultTo(0);
    });
  }

  // 检查是否有 traffic_used 字段，如果没有，添加它
  const hasTrafficUsed = await knex.schema.hasColumn('users', 'traffic_used');
  if (!hasTrafficUsed) {
    await knex.schema.alterTable('users', (table) => {
      table.bigInteger('traffic_used').unsigned().defaultTo(0);
    });
  }

  // 检查是否有 user_id 字段，如果没有，添加它
  const hasUserId = await knex.schema.hasColumn('users', 'user_id');
  if (!hasUserId) {
    await knex.schema.alterTable('users', (table) => {
      table.string('user_id', 50).nullable();
    });
  }

  // 检查是否有 vpn_uuid 字段，如果没有，添加它
  const hasVpnUuid = await knex.schema.hasColumn('users', 'vpn_uuid');
  if (!hasVpnUuid) {
    await knex.schema.alterTable('users', (table) => {
      table.string('vpn_uuid', 50).nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('expire_date');
    table.dropColumn('traffic_limit');
    table.dropColumn('traffic_used');
    table.dropColumn('user_id');
    table.dropColumn('vpn_uuid');
  });
}
