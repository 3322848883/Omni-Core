import { Knex } from 'knex';
/**
 * 为 nodes 表添加 IP 类型和线路类型相关字段
 * 套餐服务体系升级 - 阶段一：基础数据层
 *
 * 新增字段:
 * - ip_type: IP类型 (datacenter/residential_dynamic/residential_static/mobile)
 * - line_type: 线路类型 (standard/cn2/iepl/iplc)
 * - isp_name: ISP名称
 * - ip_score: IP纯净度评分 0-100
 * - supports_ipv6: 是否支持IPv6
 * - ip_pool_id: 关联的IP池ID
 * - current_ip: 当前使用的IP
 * - ip_rotation_enabled: 是否启用IP轮换
 * - ip_rotation_interval: IP轮换间隔（秒）
 * - last_ip_rotation_at: 上次IP轮换时间
 */
export declare function up(knex: Knex): Promise<void>;
export declare function down(knex: Knex): Promise<void>;
//# sourceMappingURL=20250324000001_add_ip_and_line_types_to_nodes.d.ts.map