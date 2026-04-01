"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
/**
 * 创建 IP 池相关表
 * 套餐服务体系升级 - 阶段一：基础数据层
 *
 * 创建表:
 * - ip_pools: IP池表
 * - ip_pool_ips: IP池IP列表表
 */
async function up(knex) {
    // 创建 IP 池表
    await knex.schema.createTable('ip_pools', (table) => {
        table.string('id', 50).primary().comment('IP池ID');
        table.string('name', 100).notNullable().comment('IP池名称');
        table.string('node_id', 50).notNullable().comment('关联的节点ID');
        table.string('ip_type', 20).notNullable().comment('IP类型');
        table.string('rotation_strategy', 20).notNullable().defaultTo('round_robin').comment('轮换策略');
        table.integer('rotation_interval').unsigned().notNullable().defaultTo(86400).comment('轮换间隔（秒）');
        table.integer('current_index').unsigned().notNullable().defaultTo(0).comment('当前IP索引');
        table.timestamp('last_rotation_at').nullable().comment('上次轮换时间');
        table.boolean('is_active').notNullable().defaultTo(true).comment('是否激活');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        // 外键约束
        table.foreign('node_id').references('id').inTable('nodes').onDelete('CASCADE');
        // 索引
        table.index('node_id', 'idx_ip_pools_node_id');
        table.index('ip_type', 'idx_ip_pools_ip_type');
        table.index('is_active', 'idx_ip_pools_is_active');
    });
    console.log('Created ip_pools table');
    // 创建 IP 池 IP 列表表
    await knex.schema.createTable('ip_pool_ips', (table) => {
        table.string('id', 50).primary().comment('记录ID');
        table.string('pool_id', 50).notNullable().comment('IP池ID');
        table.string('ip', 50).notNullable().comment('IP地址');
        table.string('status', 20).notNullable().defaultTo('active').comment('状态: active/inactive/blocked');
        table.integer('score').unsigned().nullable().comment('IP评分');
        table.integer('usage_count').unsigned().notNullable().defaultTo(0).comment('使用次数');
        table.timestamp('assigned_at').nullable().comment('分配时间');
        table.timestamp('released_at').nullable().comment('释放时间');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        // 外键约束
        table.foreign('pool_id').references('id').inTable('ip_pools').onDelete('CASCADE');
        // 唯一约束：同一个IP池内IP不能重复
        table.unique(['pool_id', 'ip'], 'uk_pool_ip');
        // 索引
        table.index('pool_id', 'idx_ip_pool_ips_pool_id');
        table.index('status', 'idx_ip_pool_ips_status');
        table.index('score', 'idx_ip_pool_ips_score');
        table.index('ip', 'idx_ip_pool_ips_ip');
    });
    console.log('Created ip_pool_ips table');
}
async function down(knex) {
    // 先删除外键依赖的表
    await knex.schema.dropTableIfExists('ip_pool_ips');
    console.log('Dropped ip_pool_ips table');
    await knex.schema.dropTableIfExists('ip_pools');
    console.log('Dropped ip_pools table');
}
//# sourceMappingURL=20250324000003_create_ip_pools_table.js.map