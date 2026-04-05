"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.string('line_type', 20).nullable().defaultTo('BGP').comment('线路类型: BGP, CN2, DoubleGrade, Severe');
    });
}
async function down(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.dropColumn('line_type');
    });
}
//# sourceMappingURL=20240325000004_add_node_line_type.js.map