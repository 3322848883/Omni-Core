"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('users', (table) => {
        table.string('password_hash', 255).nullable().after('username');
    });
}
async function down(knex) {
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('password_hash');
    });
}
//# sourceMappingURL=20240321000008_add_password_to_users.js.map