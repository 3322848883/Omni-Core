import { Knex } from 'knex';
/**
 * 为 user_subscriptions 表添加服务类型相关字段
 * - service_types: 用户可使用的服务类型
 * - effective_service_types: 实际生效的服务类型（考虑叠加）
 * - subscription_level: 订阅等级（1-3）
 */
export declare function up(knex: Knex): Promise<void>;
export declare function down(knex: Knex): Promise<void>;
//# sourceMappingURL=20240324000003_add_service_types_to_subscriptions.d.ts.map