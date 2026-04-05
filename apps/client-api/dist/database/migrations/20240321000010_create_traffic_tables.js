"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    // 流量日志表
    await knex.schema.createTable('traffic_logs', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.bigInteger('node_id').unsigned().notNullable().references('id').inTable('nodes').onDelete('CASCADE');
        table.bigInteger('upload').unsigned().notNullable().defaultTo(0);
        table.bigInteger('download').unsigned().notNullable().defaultTo(0);
        table.bigInteger('total').unsigned().notNullable().defaultTo(0);
        table.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        // 索引
        table.index(['user_id', 'recorded_at'], 'idx_traffic_logs_user_time');
        table.index(['node_id', 'recorded_at'], 'idx_traffic_logs_node_time');
        table.index('recorded_at', 'idx_traffic_logs_time');
    });
    // 日流量统计表
    await knex.schema.createTable('traffic_daily', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.bigInteger('node_id').unsigned().notNullable().references('id').inTable('nodes').onDelete('CASCADE');
        table.date('date').notNullable();
        table.bigInteger('upload').unsigned().notNullable().defaultTo(0);
        table.bigInteger('download').unsigned().notNullable().defaultTo(0);
        table.bigInteger('total').unsigned().notNullable().defaultTo(0);
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        // 索引
        table.unique(['user_id', 'node_id', 'date'], 'idx_traffic_daily_unique');
        table.index(['user_id', 'date'], 'idx_traffic_daily_user_date');
        table.index(['node_id', 'date'], 'idx_traffic_daily_node_date');
    });
    // 月流量统计表
    await knex.schema.createTable('traffic_monthly', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('year').notNullable();
        table.integer('month').notNullable();
        table.bigInteger('upload').unsigned().notNullable().defaultTo(0);
        table.bigInteger('download').unsigned().notNullable().defaultTo(0);
        table.bigInteger('total').unsigned().notNullable().defaultTo(0);
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        // 索引
        table.unique(['user_id', 'year', 'month'], 'idx_traffic_monthly_unique');
        table.index(['user_id', 'year', 'month'], 'idx_traffic_monthly_user_month');
    });
    console.log('Created traffic tables');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('traffic_monthly');
    await knex.schema.dropTableIfExists('traffic_daily');
    await knex.schema.dropTableIfExists('traffic_logs');
    console.log('Dropped traffic tables');
}
//# sourceMappingURL=20240321000010_create_traffic_tables.js.map