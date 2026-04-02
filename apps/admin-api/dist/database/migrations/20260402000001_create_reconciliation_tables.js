"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    // 创建对账记录表
    await knex.schema.createTable('reconciliations', (table) => {
        table.increments('id').primary();
        table.string('reconciliation_no', 64).notNullable().unique();
        table.string('provider', 50).notNullable();
        table.date('reconciliation_date').notNullable();
        table.string('status', 20).notNullable().defaultTo('pending'); // pending, processing, completed, failed
        table.integer('total_orders').defaultTo(0);
        table.integer('matched_orders').defaultTo(0);
        table.integer('unmatched_orders').defaultTo(0);
        table.decimal('total_amount', 10, 2).defaultTo(0);
        table.decimal('matched_amount', 10, 2).defaultTo(0);
        table.decimal('unmatched_amount', 10, 2).defaultTo(0);
        table.json('summary').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
    // 创建对账详情表
    await knex.schema.createTable('reconciliation_details', (table) => {
        table.increments('id').primary();
        table.integer('reconciliation_id').notNullable().references('id').inTable('reconciliations').onDelete('CASCADE');
        table.string('order_no', 64).notNullable();
        table.string('provider_order_id', 128).nullable();
        table.decimal('amount', 10, 2).notNullable();
        table.string('currency', 10).notNullable();
        table.string('status', 20).notNullable(); // matched, unmatched, error
        table.string('error_message').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
    // 创建结算报表表
    await knex.schema.createTable('settlement_reports', (table) => {
        table.increments('id').primary();
        table.string('report_no', 64).notNullable().unique();
        table.string('provider', 50).notNullable();
        table.date('start_date').notNullable();
        table.date('end_date').notNullable();
        table.string('status', 20).notNullable().defaultTo('pending'); // pending, processing, completed, failed
        table.integer('total_orders').defaultTo(0);
        table.decimal('total_amount', 10, 2).defaultTo(0);
        table.decimal('fee_amount', 10, 2).defaultTo(0);
        table.decimal('net_amount', 10, 2).defaultTo(0);
        table.json('summary').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
    // 创建结算详情表
    await knex.schema.createTable('settlement_details', (table) => {
        table.increments('id').primary();
        table.integer('settlement_report_id').notNullable().references('id').inTable('settlement_reports').onDelete('CASCADE');
        table.string('order_no', 64).notNullable();
        table.string('provider_order_id', 128).nullable();
        table.decimal('amount', 10, 2).notNullable();
        table.decimal('fee_amount', 10, 2).defaultTo(0);
        table.decimal('net_amount', 10, 2).notNullable();
        table.string('currency', 10).notNullable();
        table.timestamp('transaction_date').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
    // 创建索引
    await knex.schema.table('reconciliations', (table) => {
        table.index('provider', 'idx_reconciliations_provider');
        table.index('reconciliation_date', 'idx_reconciliations_date');
        table.index('status', 'idx_reconciliations_status');
    });
    await knex.schema.table('reconciliation_details', (table) => {
        table.index('reconciliation_id', 'idx_reconciliation_details_reconciliation_id');
        table.index('order_no', 'idx_reconciliation_details_order_no');
    });
    await knex.schema.table('settlement_reports', (table) => {
        table.index('provider', 'idx_settlement_reports_provider');
        table.index(['start_date', 'end_date'], 'idx_settlement_reports_date_range');
        table.index('status', 'idx_settlement_reports_status');
    });
    await knex.schema.table('settlement_details', (table) => {
        table.index('settlement_report_id', 'idx_settlement_details_settlement_report_id');
        table.index('order_no', 'idx_settlement_details_order_no');
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('settlement_details');
    await knex.schema.dropTableIfExists('settlement_reports');
    await knex.schema.dropTableIfExists('reconciliation_details');
    await knex.schema.dropTableIfExists('reconciliations');
}
//# sourceMappingURL=20260402000001_create_reconciliation_tables.js.map