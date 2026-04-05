"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('orders', (table) => {
        table.string('payment_id', 255).nullable().after('payment_method');
        table.index('payment_id', 'idx_orders_payment_id');
    });
}
async function down(knex) {
    await knex.schema.alterTable('orders', (table) => {
        table.dropIndex('payment_id', 'idx_orders_payment_id');
        table.dropColumn('payment_id');
    });
}
//# sourceMappingURL=20240321000007_add_payment_id_to_orders.js.map