"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.boolean('is_premium').notNullable().defaultTo(false).comment('是否Premium节点');
        table.integer('bandwidth_limit').unsigned().nullable().comment('带宽限制(Mbps)');
        table.integer('max_users').unsigned().nullable().defaultTo(0).comment('最大用户数');
        table.integer('current_users').unsigned().nullable().defaultTo(0).comment('当前用户数');
    });
}
async function down(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.dropColumn('is_premium');
        table.dropColumn('bandwidth_limit');
        table.dropColumn('max_users');
        table.dropColumn('current_users');
    });
}
//# sourceMappingURL=20240325000002_add_node_extended_fields.js.map