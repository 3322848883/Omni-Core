import { Knex } from 'knex';

/**
 * 为 subscription_plans 表添加服务类型相关字段
 * - group_id: 套餐组ID（standard/dedicated_line/exclusive）
 * - service_types: 套餐包含的服务类型（JSON数组）
 * - primary_service_type: 主要服务类型
 * - priority_boost: 优先级提升值
 * - guaranteed_bandwidth: 保证带宽（Mbps）
 * - max_connections: 最大连接数
 * - sort_order: 套餐排序
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('subscription_plans', (table) => {
    // 套餐组ID
    table.string('group_id', 20).notNullable().defaultTo('standard').after('plan_id');
    
    // 服务类型列表（JSON格式）
    table.text('service_types').notNullable().defaultTo('["standard"]').after('group_id');
    
    // 主要服务类型
    table.string('primary_service_type', 20).notNullable().defaultTo('standard').after('service_types');
    
    // 优先级提升值
    table.tinyint('priority_boost').unsigned().notNullable().defaultTo(0).after('primary_service_type');
    
    // 保证带宽（Mbps）
    table.integer('guaranteed_bandwidth').unsigned().notNullable().defaultTo(10).after('priority_boost');
    
    // 最大连接数
    table.integer('max_connections').unsigned().notNullable().defaultTo(3).after('guaranteed_bandwidth');
    
    // 创建索引
    table.index('group_id', 'idx_plans_group');
    table.index('primary_service_type', 'idx_plans_primary_type');
    table.index(['group_id', 'sort_order'], 'idx_plans_group_sort');
  });

  console.log('Added service type fields to subscription_plans table');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('subscription_plans', (table) => {
    // 删除索引
    table.dropIndex('group_id', 'idx_plans_group');
    table.dropIndex('primary_service_type', 'idx_plans_primary_type');
    table.dropIndex(['group_id', 'sort_order'], 'idx_plans_group_sort');
    
    // 删除字段
    table.dropColumn('max_connections');
    table.dropColumn('guaranteed_bandwidth');
    table.dropColumn('priority_boost');
    table.dropColumn('primary_service_type');
    table.dropColumn('service_types');
    table.dropColumn('group_id');
  });

  console.log('Removed service type fields from subscription_plans table');
}
