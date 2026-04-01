import { Knex } from 'knex';
/**
 * 创建 IP 池相关表
 * 套餐服务体系升级 - 阶段一：基础数据层
 *
 * 创建表:
 * - ip_pools: IP池表
 * - ip_pool_ips: IP池IP列表表
 */
export declare function up(knex: Knex): Promise<void>;
export declare function down(knex: Knex): Promise<void>;
//# sourceMappingURL=20250324000003_create_ip_pools_table.d.ts.map