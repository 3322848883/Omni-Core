"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    // 商家表
    await knex.schema.createTable('merchants', (table) => {
        table.bigIncrements('id').primary();
        table.string('merchant_id', 50).notNullable().unique();
        table.string('name', 255).notNullable();
        table.string('email', 255).notNullable().unique();
        table.string('phone', 50).nullable();
        table.string('business_license', 255).nullable();
        table.string('tax_id', 100).nullable();
        table.string('contact_person', 100).nullable();
        table.text('address').nullable();
        table.string('website', 255).nullable();
        table.string('status', 50).notNullable().defaultTo('pending');
        table.text('notes').nullable();
        table.integer('version').unsigned().notNullable().defaultTo(1);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index('merchant_id', 'idx_merchants_merchant_id');
        table.index('status', 'idx_merchants_status');
        table.index('email', 'idx_merchants_email');
    });
    await knex.raw('ALTER TABLE merchants COMMENT = "商家表"');
    // 商家API密钥表
    await knex.schema.createTable('merchant_api_keys', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('merchant_id').unsigned().notNullable().references('id').inTable('merchants').onDelete('CASCADE');
        table.string('key_name', 100).notNullable();
        table.string('api_key', 255).notNullable().unique();
        table.string('api_secret', 255).notNullable();
        table.string('scopes', 500).nullable();
        table.string('ip_whitelist', 1000).nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamp('expires_at').nullable();
        table.timestamp('last_used_at').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index('merchant_id', 'idx_merchant_api_keys_merchant_id');
        table.index('api_key', 'idx_merchant_api_keys_api_key');
        table.index('is_active', 'idx_merchant_api_keys_is_active');
    });
    await knex.raw('ALTER TABLE merchant_api_keys COMMENT = "商家API密钥表"');
    // 商家权限表
    await knex.schema.createTable('merchant_permissions', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('merchant_id').unsigned().notNullable().references('id').inTable('merchants').onDelete('CASCADE');
        table.string('permission_code', 100).notNullable();
        table.string('permission_name', 100).notNullable();
        table.text('description').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.index('merchant_id', 'idx_merchant_permissions_merchant_id');
        table.unique(['merchant_id', 'permission_code'], 'idx_merchant_permissions_unique');
    });
    await knex.raw('ALTER TABLE merchant_permissions COMMENT = "商家权限表"');
    // 商家费率配置表
    await knex.schema.createTable('merchant_rates', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('merchant_id').unsigned().notNullable().references('id').inTable('merchants').onDelete('CASCADE');
        table.string('payment_method', 100).notNullable();
        table.string('currency', 10).notNullable().defaultTo('CNY');
        table.decimal('transaction_rate', 5, 4).notNullable();
        table.decimal('fixed_fee', 10, 2).nullable().defaultTo(0);
        table.decimal('min_fee', 10, 2).nullable();
        table.decimal('max_fee', 10, 2).nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamp('effective_from').notNullable();
        table.timestamp('effective_to').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.index('merchant_id', 'idx_merchant_rates_merchant_id');
        table.index('payment_method', 'idx_merchant_rates_payment_method');
        table.index('is_active', 'idx_merchant_rates_is_active');
    });
    await knex.raw('ALTER TABLE merchant_rates COMMENT = "商家费率配置表"');
    // 商家数据统计表
    await knex.schema.createTable('merchant_stats', (table) => {
        table.bigIncrements('id').primary();
        table.bigInteger('merchant_id').unsigned().notNullable().references('id').inTable('merchants').onDelete('CASCADE');
        table.date('stat_date').notNullable();
        table.bigInteger('total_transactions').unsigned().defaultTo(0);
        table.decimal('total_amount', 15, 2).defaultTo(0);
        table.bigInteger('successful_transactions').unsigned().defaultTo(0);
        table.decimal('successful_amount', 15, 2).defaultTo(0);
        table.bigInteger('failed_transactions').unsigned().defaultTo(0);
        table.decimal('failed_amount', 15, 2).defaultTo(0);
        table.decimal('total_fee', 15, 2).defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.unique(['merchant_id', 'stat_date'], 'idx_merchant_stats_unique');
        table.index('stat_date', 'idx_merchant_stats_stat_date');
    });
    await knex.raw('ALTER TABLE merchant_stats COMMENT = "商家数据统计表"');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('merchant_stats');
    await knex.schema.dropTableIfExists('merchant_rates');
    await knex.schema.dropTableIfExists('merchant_permissions');
    await knex.schema.dropTableIfExists('merchant_api_keys');
    await knex.schema.dropTableIfExists('merchants');
}
//# sourceMappingURL=20260402000002_create_merchant_tables.js.map