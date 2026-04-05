"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    // 节点健康检查历史表
    await knex.schema.createTable('node_health_checks', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('node_id').unsigned().notNullable().references('id').inTable('nodes').onDelete('CASCADE');
        table.enum('status', ['online', 'offline', 'degraded']).notNullable().defaultTo('offline');
        table.integer('latency').nullable(); // ms
        table.text('error').nullable();
        table.timestamp('checked_at').notNullable().defaultTo(knex.fn.now());
        // 索引
        table.index(['node_id', 'checked_at'], 'idx_health_checks_node_time');
        table.index('checked_at', 'idx_health_checks_time');
    });
    // 节点延迟测试表
    await knex.schema.createTable('node_latency_tests', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('node_id').unsigned().notNullable().references('id').inTable('nodes').onDelete('CASCADE');
        table.string('host', 255).notNullable();
        table.integer('port').unsigned().notNullable();
        table.integer('latency').notNullable(); // ms
        table.float('packet_loss').notNullable().defaultTo(0); // 百分比
        table.timestamp('tested_at').notNullable().defaultTo(knex.fn.now());
        // 索引
        table.index(['node_id', 'tested_at'], 'idx_latency_tests_node_time');
        table.index('tested_at', 'idx_latency_tests_time');
    });
    // 节点带宽测试表
    await knex.schema.createTable('node_bandwidth_tests', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('node_id').unsigned().notNullable().references('id').inTable('nodes').onDelete('CASCADE');
        table.float('bandwidth').notNullable(); // Mbps
        table.timestamp('tested_at').notNullable().defaultTo(knex.fn.now());
        // 索引
        table.index(['node_id', 'tested_at'], 'idx_bandwidth_tests_node_time');
        table.index('tested_at', 'idx_bandwidth_tests_time');
    });
    // 用户连接表
    await knex.schema.createTable('user_connections', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.bigInteger('node_id').unsigned().notNullable().references('id').inTable('nodes').onDelete('CASCADE');
        table.string('client_ip', 45).notNullable();
        table.string('session_id', 255).notNullable();
        table.bigInteger('upload').unsigned().defaultTo(0);
        table.bigInteger('download').unsigned().defaultTo(0);
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamp('connected_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('last_active_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('disconnected_at').nullable();
        // 索引
        table.index(['user_id', 'is_active'], 'idx_connections_user_active');
        table.index(['node_id', 'is_active'], 'idx_connections_node_active');
        table.index('session_id', 'idx_connections_session');
        table.index('last_active_at', 'idx_connections_last_active');
    });
    console.log('Created node health tables');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('user_connections');
    await knex.schema.dropTableIfExists('node_bandwidth_tests');
    await knex.schema.dropTableIfExists('node_latency_tests');
    await knex.schema.dropTableIfExists('node_health_checks');
    console.log('Dropped node health tables');
}
//# sourceMappingURL=20240321000011_create_node_health_tables.js.map