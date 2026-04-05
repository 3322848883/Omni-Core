"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
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
async function up(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        // IP类型：datacenter(机房), residential_dynamic(动态住宅), residential_static(静态住宅), mobile(移动)
        table.string('ip_type', 20).notNullable().defaultTo('datacenter').after('service_type');
        // 线路类型：standard(标准), cn2, iepl, iplc
        table.string('line_type', 20).notNullable().defaultTo('standard').after('ip_type');
        // ISP名称
        table.string('isp_name', 50).nullable().after('line_type');
        // IP纯净度评分 0-100
        table.integer('ip_score').unsigned().nullable().after('isp_name');
        // 是否支持IPv6
        table.boolean('supports_ipv6').notNullable().defaultTo(false).after('ip_score');
        // 关联的IP池ID
        table.string('ip_pool_id', 50).nullable().after('supports_ipv6');
        // 当前使用的IP
        table.string('current_ip', 50).nullable().after('ip_pool_id');
        // 是否启用IP轮换
        table.boolean('ip_rotation_enabled').notNullable().defaultTo(false).after('current_ip');
        // IP轮换间隔（秒），默认24小时
        table.integer('ip_rotation_interval').unsigned().nullable().defaultTo(86400).after('ip_rotation_enabled');
        // 上次IP轮换时间
        table.timestamp('last_ip_rotation_at').nullable().after('ip_rotation_interval');
        // 创建索引
        table.index('ip_type', 'idx_nodes_ip_type');
        table.index('line_type', 'idx_nodes_line_type');
        table.index('isp_name', 'idx_nodes_isp_name');
        table.index('ip_score', 'idx_nodes_ip_score');
        table.index('ip_pool_id', 'idx_nodes_ip_pool_id');
        table.index(['ip_type', 'line_type'], 'idx_nodes_ip_line_type');
        table.index(['ip_type', 'status'], 'idx_nodes_ip_type_status');
    });
    console.log('Added IP type and line type fields to nodes table');
}
async function down(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        // 删除索引
        table.dropIndex('ip_type', 'idx_nodes_ip_type');
        table.dropIndex('line_type', 'idx_nodes_line_type');
        table.dropIndex('isp_name', 'idx_nodes_isp_name');
        table.dropIndex('ip_score', 'idx_nodes_ip_score');
        table.dropIndex('ip_pool_id', 'idx_nodes_ip_pool_id');
        table.dropIndex(['ip_type', 'line_type'], 'idx_nodes_ip_line_type');
        table.dropIndex(['ip_type', 'status'], 'idx_nodes_ip_type_status');
        // 删除字段
        table.dropColumn('last_ip_rotation_at');
        table.dropColumn('ip_rotation_interval');
        table.dropColumn('ip_rotation_enabled');
        table.dropColumn('current_ip');
        table.dropColumn('ip_pool_id');
        table.dropColumn('supports_ipv6');
        table.dropColumn('ip_score');
        table.dropColumn('isp_name');
        table.dropColumn('line_type');
        table.dropColumn('ip_type');
    });
    console.log('Removed IP type and line type fields from nodes table');
}
//# sourceMappingURL=20250324000001_add_ip_and_line_types_to_nodes.js.map