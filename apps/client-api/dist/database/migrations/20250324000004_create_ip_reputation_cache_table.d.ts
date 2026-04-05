import { Knex } from 'knex';
/**
 * 创建 IP 声誉缓存表
 * 套餐服务体系升级 - 阶段一：基础数据层
 *
 * 创建表:
 * - ip_reputation_cache: IP声誉缓存表，用于缓存IP检测结果
 */
export declare function up(knex: Knex): Promise<void>;
export declare function down(knex: Knex): Promise<void>;
//# sourceMappingURL=20250324000004_create_ip_reputation_cache_table.d.ts.map