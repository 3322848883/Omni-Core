"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
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
async function up(knex) {
    await knex.schema.alterTable('subscription_plans', (table) => {
        // 允许的IP类型列表，JSON格式存储数组
        table.json('allowed_ip_types').nullable().after('features');
        // 允许的线路类型列表，JSON格式存储数组
        table.json('allowed_line_types').nullable().after('allowed_ip_types');
        // 最低IP评分要求
        table.integer('min_ip_score').unsigned().nullable().after('allowed_line_types');
        // 是否启用IP轮换
        table.boolean('ip_rotation_enabled').notNullable().defaultTo(false).after('min_ip_score');
        // IP轮换间隔（秒）
        table.integer('ip_rotation_interval').unsigned().nullable().after('ip_rotation_enabled');
    });
    console.log('Added IP type and line type fields to subscription_plans table');
}
async function down(knex) {
    await knex.schema.alterTable('subscription_plans', (table) => {
        // 删除字段
        table.dropColumn('ip_rotation_interval');
        table.dropColumn('ip_rotation_enabled');
        table.dropColumn('min_ip_score');
        table.dropColumn('allowed_line_types');
        table.dropColumn('allowed_ip_types');
    });
    console.log('Removed IP type and line type fields from subscription_plans table');
}
//# sourceMappingURL=20250324000002_add_ip_line_types_to_subscription_plans.js.map