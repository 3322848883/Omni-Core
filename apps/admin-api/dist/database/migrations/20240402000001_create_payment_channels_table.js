"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('payment_channels', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
        table.string('provider').notNullable();
        table.string('status').notNullable().defaultTo('disabled');
        table.json('config').nullable();
        table.string('description').nullable();
        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
        table.timestamp('lastCheckedAt').nullable();
        table.string('lastStatus').nullable();
    });
    // 创建索引
    await knex.schema.raw('CREATE INDEX idx_payment_channels_provider ON payment_channels(provider)');
    await knex.schema.raw('CREATE INDEX idx_payment_channels_status ON payment_channels(status)');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('payment_channels');
}
//# sourceMappingURL=20240402000001_create_payment_channels_table.js.map