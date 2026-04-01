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
export declare function up(knex: Knex): Promise<void>;
export declare function down(knex: Knex): Promise<void>;
//# sourceMappingURL=20240324000001_add_service_type_to_nodes.d.ts.map