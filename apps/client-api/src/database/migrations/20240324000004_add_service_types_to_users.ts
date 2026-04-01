import { Knex } from 'knex';

/**
 * 为 users 表添加服务类型相关字段
 * - effective_service_types: 当前生效的服务类型
 * - service_type_expires: 各服务类型过期时间（JSON格式）
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    // 当前生效的服务类型（JSON格式）
    table.text('effective_service_types').nullable().defaultTo('["standard"]').after('status');
    
    // 各服务类型过期时间（JSON格式）
    table.text('service_type_expires').nullable().after('effective_service_types');
    
    // 创建索引
    table.index('effective_service_types', 'idx_users_effective_types');
  });

  console.log('Added service type fields to users table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    // 删除索引
    table.dropIndex('effective_service_types', 'idx_users_effective_types');
    
    // 删除字段
    table.dropColumn('service_type_expires');
    table.dropColumn('effective_service_types');
  });

  console.log('Removed service type fields from users table');
}
