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
export declare function up(knex: Knex): Promise<void>;
export declare function down(knex: Knex): Promise<void>;
//# sourceMappingURL=20240324000002_add_service_types_to_plans.d.ts.map