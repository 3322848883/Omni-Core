"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.alterTable('nodes', (table) => {
        table.string('service_type', 50).nullable().defaultTo('standard').comment('服务类型: standard, premium, etc');
        table.string('service_group', 50).nullable().comment('服务组');
    });
    await knex.schema.createTable('subscription_plans', (table) => {
        table.bigIncrements('id').primary();
        table.string('name', 100).notNullable();
        table.text('description').nullable();
        table.decimal('price', 10, 2).notNullable().unsigned();
        table.string('currency', 10).notNullable().defaultTo('CNY');
        table.integer('duration_days').notNullable().unsigned().defaultTo(30);
        table.string('service_type', 50).notNullable().defaultTo('standard');
        table.string('group_id', 50).nullable();
        table.integer('max_devices').unsigned().nullable().defaultTo(1);
        table.integer('max_traffic_gb').unsigned().nullable();
        table.boolean('is_active').notNullable().defaultTo(true);
        table.integer('sort_order').unsigned().notNullable().defaultTo(0);
        table.json('features').nullable();
        table.json('settings').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
    await knex.raw('ALTER TABLE subscription_plans COMMENT = "套餐计划表"');
}
async function down(knex) {
    await knex.schema.dropTableIfExists('subscription_plans');
    await knex.schema.alterTable('nodes', (table) => {
        table.dropColumn('service_type');
        table.dropColumn('service_group');
    });
}
//# sourceMappingURL=20240325000001_add_service_types_and_plans.js.map