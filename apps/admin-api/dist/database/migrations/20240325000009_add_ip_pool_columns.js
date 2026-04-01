"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.string('ip_pool_id', 36).nullable().after('host').comment('关联的IP池ID');
    });
    await knex.schema.alterTable('ip_pool_ips', (table) => {
        table.datetime('assigned_at').nullable().after('last_used_at').comment('分配时间');
        table.datetime('released_at').nullable().after('assigned_at').comment('释放时间');
        table.integer('score').unsigned().nullable().after('is_blocked').comment('IP评分');
        table.integer('usage_count').unsigned().nullable().defaultTo(0).after('score').comment('使用次数');
    });
}
async function down(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.dropColumn('ip_pool_id');
    });
    await knex.schema.alterTable('ip_pool_ips', (table) => {
        table.dropColumn('assigned_at');
        table.dropColumn('released_at');
        table.dropColumn('score');
        table.dropColumn('usage_count');
    });
}
//# sourceMappingURL=20240325000009_add_ip_pool_columns.js.map