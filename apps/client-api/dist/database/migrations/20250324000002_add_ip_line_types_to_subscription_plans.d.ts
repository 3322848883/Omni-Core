import { Knex } from 'knex';
/**
 * 为 subscription_plans 表添加 IP 类型和线路类型限制字段
 * 套餐服务体系升级 - 阶段一：基础数据层
 *
 * 新增字段:
 * - allowed_ip_types: 允许的IP类型列表 (JSON)
 * - allowed_line_types: 允许的线路类型列表 (JSON)
 * - min_ip_score: 最低IP评分要求
 * - ip_rotation_enabled: 是否启用IP轮换
 * - ip_rotation_interval: IP轮换间隔（秒）
 */
export declare function up(knex: Knex): Promise<void>;
export declare function down(knex: Knex): Promise<void>;
//# sourceMappingURL=20250324000002_add_ip_line_types_to_subscription_plans.d.ts.map