"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.string('ip_type', 20).nullable().defaultTo('IPv4').comment('IP类型: IPv4, IPv6, Dual');
    });
}
async function down(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.dropColumn('ip_type');
    });
}
//# sourceMappingURL=20240325000003_add_node_ip_type.js.map