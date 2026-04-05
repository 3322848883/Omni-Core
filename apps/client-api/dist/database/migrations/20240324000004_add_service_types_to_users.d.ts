import { Knex } from 'knex';
/**
 * 为 users 表添加服务类型相关字段
 * - effective_service_types: 当前生效的服务类型
 * - service_type_expires: 各服务类型过期时间（JSON格式）
 */
export declare function up(knex: Knex): Promise<void>;
export declare function down(knex: Knex): Promise<void>;
//# sourceMappingURL=20240324000004_add_service_types_to_users.d.ts.map