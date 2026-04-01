"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('user_devices', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('device_id', 255).notNullable();
        table.string('ip_address', 45).nullable();
        table.text('user_agent').nullable();
        table.timestamp('last_active_at').notNullable().defaultTo(knex.fn.now());
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        // 索引
        table.index(['user_id', 'device_id'], 'idx_user_devices_user_device');
        table.index(['user_id', 'is_active'], 'idx_user_devices_user_active');
        table.index('last_active_at', 'idx_user_devices_last_active');
    });
    console.log('Created user_devices table');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('user_devices');
    console.log('Dropped user_devices table');
}
//# sourceMappingURL=20240321000009_create_user_devices.js.map