"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.integer('ip_score').unsigned().nullable().comment('IP评分 (0-100)');
    });
}
async function down(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.dropColumn('ip_score');
    });
}
//# sourceMappingURL=20240325000005_add_node_ip_score.js.map