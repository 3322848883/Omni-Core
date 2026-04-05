"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
/**
 * 为 user_subscriptions 表添加服务类型相关字段
 * - service_types: 用户可使用的服务类型
 * - effective_service_types: 实际生效的服务类型（考虑叠加）
 * - subscription_level: 订阅等级（1-3）
 */
async function up(knex) {
    await knex.schema.alterTable('user_subscriptions', (table) => {
        // 用户可使用的服务类型（JSON格式）
        table.text('service_types').nullable().defaultTo('["standard"]').after('plan_id');
        // 实际生效的服务类型（JSON格式）
        table.text('effective_service_types').nullable().after('service_types');
        // 订阅等级（1-3）
        table.tinyint('subscription_level').unsigned().notNullable().defaultTo(1).after('effective_service_types');
        // 创建索引
        table.index('subscription_level', 'idx_user_subs_level');
    });
    console.log('Added service type fields to user_subscriptions table');
}
async function down(knex) {
    await knex.schema.alterTable('user_subscriptions', (table) => {
        // 删除索引
        table.dropIndex('subscription_level', 'idx_user_subs_level');
        // 删除字段
        table.dropColumn('subscription_level');
        table.dropColumn('effective_service_types');
        table.dropColumn('service_types');
    });
    console.log('Removed service type fields from user_subscriptions table');
}
//# sourceMappingURL=20240324000003_add_service_types_to_subscriptions.js.map