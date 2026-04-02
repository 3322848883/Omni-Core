"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.integer('qos_level').unsigned().nullable().defaultTo(1).comment('QoS等级 (1-5)');
    });
}
async function down(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.dropColumn('qos_level');
    });
}
//# sourceMappingURL=20240325000010_add_node_qos_level.js.map