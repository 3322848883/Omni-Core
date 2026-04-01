"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    // Admin Users Table
    await knex.schema.createTable('admin_users', (table) => {
        table.bigIncrements('id').primary();
        table.string('username', 100).notNullable().unique();
        table.string('email', 255).notNullable().unique();
        table.string('password_hash', 255).notNullable();
        table.string('role', 50).notNullable().defaultTo('operator'); // super_admin, admin, operator, auditor
        table.string('avatar', 255).nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamp('last_login_at').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index('role', 'idx_admin_users_role');
        table.index('is_active', 'idx_admin_users_is_active');
    });
    await knex.raw('ALTER TABLE admin_users COMMENT = "管理员账号表"');
    // Admin Logs Table
    await knex.schema.createTable('admin_logs', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('admin_id').unsigned().notNullable();
        table.string('action', 100).notNullable();
        table.string('resource', 100).notNullable();
        table.json('details').nullable();
        table.string('ip_address', 45).nullable();
        table.string('user_agent', 500).nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index('admin_id', 'idx_admin_logs_admin_id');
        table.index('action', 'idx_admin_logs_action');
        table.index('created_at', 'idx_admin_logs_created_at');
    });
    await knex.raw('ALTER TABLE admin_logs COMMENT = "管理员操作日志表"');
    // Configuration Table
    await knex.schema.createTable('configurations', (table) => {
        table.bigIncrements('id').primary();
        table.string('config_key', 255).notNullable().unique();
        table.json('config_value').notNullable();
        table.string('config_type', 20).notNullable().defaultTo('global'); // global, node, user, feature
        table.string('environment', 20).notNullable().defaultTo('dev'); // dev, staging, production
        table.integer('version').unsigned().notNullable().defaultTo(1);
        table.text('description').nullable();
        table.string('created_by', 100).nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index('config_type', 'idx_configurations_config_type');
        table.index('environment', 'idx_configurations_environment');
    });
    await knex.raw('ALTER TABLE configurations COMMENT = "配置表"');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('configurations');
    await knex.schema.dropTableIfExists('admin_logs');
    await knex.schema.dropTableIfExists('admin_users');
}
//# sourceMappingURL=20240321000006_create_admin_tables.js.map