import { Knex } from 'knex';

/**
 * 为 nodes 表添加服务类型相关字段
 * - service_type: 服务类型（standard/dedicated_line/exclusive）
 * - service_group: 服务分组
 * - is_premium: 是否高级节点
 * - bandwidth_limit: 带宽限制（Mbps）
 * - qos_level: QoS等级（1-5）
 * - max_users: 最大用户数
 * - current_users: 当前用户数
 */
export async function up(knex: Knex): Promise<void> {
  // 添加服务类型字段
  await knex.schema.alterTable('nodes', (table) => {
    // 服务类型：standard(标准), dedicated_line(专线), exclusive(独享)
    table.string('service_type', 20).notNullable().defaultTo('standard').after('status');
    
    // 服务分组，用于批量管理
    table.string('service_group', 50).nullable().defaultTo('default').after('service_type');
    
    // 是否高级节点
    table.boolean('is_premium').notNullable().defaultTo(false).after('service_group');
    
    // 带宽限制（Mbps）
    table.integer('bandwidth_limit').unsigned().notNullable().defaultTo(100).after('is_premium');
    
    // QoS等级（1-5，5为最高）
    table.tinyint('qos_level').unsigned().notNullable().defaultTo(3).after('bandwidth_limit');
    
    // 最大用户数
    table.integer('max_users').unsigned().notNullable().defaultTo(10000).after('qos_level');
    
    // 当前用户数
    table.integer('current_users').unsigned().notNullable().defaultTo(0).after('max_users');
    
    // 创建索引
    table.index('service_type', 'idx_nodes_service_type');
    table.index('service_group', 'idx_nodes_service_group');
    table.index('is_premium', 'idx_nodes_is_premium');
    table.index('qos_level', 'idx_nodes_qos_level');
    table.index(['service_type', 'status'], 'idx_nodes_service_type_status');
  });

  console.log('Added service type fields to nodes table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('nodes', (table) => {
    // 删除索引
    table.dropIndex('service_type', 'idx_nodes_service_type');
    table.dropIndex('service_group', 'idx_nodes_service_group');
    table.dropIndex('is_premium', 'idx_nodes_is_premium');
    table.dropIndex('qos_level', 'idx_nodes_qos_level');
    table.dropIndex(['service_type', 'status'], 'idx_nodes_service_type_status');
    
    // 删除字段
    table.dropColumn('current_users');
    table.dropColumn('max_users');
    table.dropColumn('qos_level');
    table.dropColumn('bandwidth_limit');
    table.dropColumn('is_premium');
    table.dropColumn('service_group');
    table.dropColumn('service_type');
  });

  console.log('Removed service type fields from nodes table');
}
