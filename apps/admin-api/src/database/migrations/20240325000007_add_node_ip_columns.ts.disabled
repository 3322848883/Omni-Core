import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    table.string('current_ip', 45).nullable().after('ip_pool_id').comment('当前分配的IP');
    table.boolean('supports_ipv6').nullable().defaultTo(false).after('is_premium').comment('是否支持IPv6');
    table.boolean('ip_rotation_enabled').nullable().defaultTo(false).after('current_ip').comment('IP轮换是否启用');
    table.integer('ip_rotation_interval').unsigned().nullable().after('ip_rotation_enabled').comment('IP轮换间隔(秒)');
    table.datetime('last_ip_rotation_at').nullable().after('ip_rotation_interval').comment('上次IP轮换时间');
    table.string('isp_name', 100).nullable().after('country').comment('ISP名称');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    table.dropColumn('current_ip');
    table.dropColumn('supports_ipv6');
    table.dropColumn('ip_rotation_enabled');
    table.dropColumn('ip_rotation_interval');
    table.dropColumn('last_ip_rotation_at');
    table.dropColumn('isp_name');
  });
}
