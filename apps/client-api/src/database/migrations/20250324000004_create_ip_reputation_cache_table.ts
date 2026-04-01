import { Knex } from 'knex';

/**
 * 创建 IP 声誉缓存表
 * 套餐服务体系升级 - 阶段一：基础数据层
 * 
 * 创建表:
 * - ip_reputation_cache: IP声誉缓存表，用于缓存IP检测结果
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ip_reputation_cache', (table) => {
    table.string('id', 50).primary().comment('记录ID');
    table.string('ip', 50).notNullable().unique().comment('IP地址');
    table.string('provider', 20).notNullable().comment('检测提供商');
    table.integer('score').unsigned().notNullable().comment('评分 0-100');
    table.boolean('is_residential').nullable().comment('是否住宅IP');
    table.integer('abuse_records').unsigned().notNullable().defaultTo(0).comment('滥用记录数');
    table.json('raw_data').nullable().comment('原始响应数据');
    table.timestamp('checked_at').notNullable().comment('检测时间');
    table.timestamp('expires_at').notNullable().comment('过期时间');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // 索引
    table.index('ip', 'idx_ip_reputation_ip');
    table.index('score', 'idx_ip_reputation_score');
    table.index('expires_at', 'idx_ip_reputation_expires');
    table.index('provider', 'idx_ip_reputation_provider');
    table.index('is_residential', 'idx_ip_reputation_is_residential');
  });

  console.log('Created ip_reputation_cache table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ip_reputation_cache');
  console.log('Dropped ip_reputation_cache table');
}
